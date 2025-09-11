import os, time, random, hashlib, sqlite3
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional

import typer
import pandas as pd
from dotenv import load_dotenv
from tqdm import tqdm
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright, Browser, Page
from urllib.parse import quote_plus

app = typer.Typer(help='Keyword/Location/Company checker via Playwright (DuckDuckGo HTML SERP)')

def env(key: str, default: Optional[str] = None) -> str:
    v = os.getenv(key, default)
    if v is None:
        raise typer.BadParameter(f'Missing env var: {key}')
    return v

def ensure_db(db_path: Path):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    sql = (
        'CREATE TABLE IF NOT EXISTS results ('
        'id INTEGER PRIMARY KEY AUTOINCREMENT,'
        'source TEXT NOT NULL,'
        'query TEXT NOT NULL,'
        'title TEXT,'
        'link TEXT,'
        'snippet TEXT,'
        'fingerprint TEXT UNIQUE,'
        'created_at TEXT DEFAULT (datetime('"'"'now'"'"'))'
        ');'
    )
    cur.execute(sql)
    conn.commit()
    return conn

def fingerprint(rec: Dict) -> str:
    base = (rec.get('source','')+'|'+rec.get('title','')+'|'+rec.get('link','')).encode('utf-8','ignore')
    return hashlib.sha256(base).hexdigest()

def write_csv(rows: List[Dict], out_dir: Path, prefix: str) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.utcnow().strftime('%Y%m%d-%H%M%S')
    out_path = out_dir / f'{prefix}_{ts}.csv'
    pd.DataFrame(rows).to_csv(out_path, index=False)
    return out_path

def insert_if_new(conn, rec: Dict) -> bool:
    cur = conn.cursor()
    try:
        cur.execute('INSERT INTO results (source, query, title, link, snippet, fingerprint) VALUES (?,?,?,?,?,?)',
                    (rec['source'], rec['query'], rec.get('title'), rec.get('link'), rec.get('snippet'), rec['fingerprint']))
        conn.commit(); return True
    except sqlite3.IntegrityError:
        return False

DUCK_HTML = 'https://duckduckgo.com/html/?q={q}'
def sleep_jitter(base=0.6, spread=0.5):
    time.sleep(base + random.random() * spread)

class SERPClient:
    def __init__(self, headless: bool = True, browser_name: str = 'chromium', timeout_ms: int = 30000, proxy: Optional[str]=None):
        self.headless=headless; self.browser_name=browser_name; self.timeout_ms=timeout_ms; self.proxy=proxy
        self._p=None; self._browser=None; self._context=None; self._page=None

    def __enter__(self):
        self._p = sync_playwright().start()
        launcher = getattr(self._p, self.browser_name)
        kwargs = {'headless': self.headless}
        if self.proxy:
            kwargs['proxy'] = {'server': self.proxy}
        self._browser: Browser = launcher.launch(**kwargs)
        self._context = self._browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
            viewport={'width': 1366, 'height': 900},
        )
        self._page: Page = self._context.new_page()
        self._page.set_default_timeout(self.timeout_ms)
        return self

    def __exit__(self, exc_type, exc, tb):
        try:
            if self._context: self._context.close()
            if self._browser: self._browser.close()
        finally:
            if self._p: self._p.stop()

    def search(self, query: str, max_results: int = 10) -> List[Dict]:
        url = DUCK_HTML.format(q=quote_plus(query))
        self._page.goto(url, wait_until='domcontentloaded')
        html = self._page.content()
        items = self._parse_ddg_html(html)[:max_results]
        while len(items) < max_results:
            try:
                more = self._page.query_selector('a.result--more__btn') or self._page.query_selector('a.nav-link--next')
                if not more:
                    break
                more.click(); self._page.wait_for_load_state('domcontentloaded')
                sleep_jitter()
                html = self._page.content()
                next_batch = self._parse_ddg_html(html)
                if not next_batch:
                    break
                known = {i.get('link') for i in items}
                for r in next_batch:
                    if r.get('link') not in known:
                        items.append(r)
                        known.add(r.get('link'))
                        if len(items) >= max_results:
                            break
            except Exception:
                break
        sleep_jitter()
        return items[:max_results]

    @staticmethod
    def _parse_ddg_html(html: str) -> List[Dict]:
        soup = BeautifulSoup(html, 'html.parser')
        out: List[Dict] = []
        for res in soup.select('div.result'):
            a = res.select_one('a.result__a')
            if not a:
                continue
            link = a.get('href')
            title = a.get_text(strip=True)
            snippet_el = res.select_one('a.result__snippet, div.result__snippet')
            snippet = snippet_el.get_text(' ', strip=True) if snippet_el else ''
            out.append({'title': title, 'link': link, 'snippet': snippet})
        return out

def run_queries(queries: List[str], per_query: int, db_path: Path, out_dir: Path) -> Path:
    conn = ensure_db(db_path)
    output_rows = []
    headless = env('HEADLESS','1') == '1'
    browser = env('BROWSER','chromium')
    timeout_ms = int(env('TIMEOUT_MS','30000'))
    proxy = os.getenv('PROXY')

    with SERPClient(headless=headless, browser_name=browser, timeout_ms=timeout_ms, proxy=proxy) as serp:
        for q in tqdm(queries, desc='Running queries'):
            for item in serp.search(q, max_results=per_query):
                rec = {'source':'playwright_serp','query':q,'title':item.get('title'),'link':item.get('link'),'snippet':item.get('snippet')}
                rec['fingerprint'] = fingerprint(rec)
                rec['is_new'] = insert_if_new(conn, rec)
                output_rows.append(rec)
    csv_path = write_csv(output_rows, out_dir, 'run')
    conn.close()
    return csv_path

@app.command()
def run(
    mode: str = typer.Option(..., help='kw | company'),
    keyword: Optional[str] = typer.Option(None, help='Keyword for kw mode'),
    location: Optional[str] = typer.Option(None, help='Location for kw mode'),
    company: Optional[str] = typer.Option(None, help='Company name for company mode'),
    extra: Optional[str] = typer.Option(None, help="Optional filter, e.g. 'site:facebook.com' or 'intitle:jobs'"),
    per_query: int = typer.Option(10, help='Results to capture per query (best effort)'),
):
    load_dotenv()
    out_dir = Path(env('OUT_DIR','./out'))
    db_path = Path(env('DB_PATH','./results.db'))
    queries: List[str] = []
    if mode == 'kw':
        if not keyword or not location:
            raise typer.BadParameter('For mode=kw, pass --keyword and --location')
        base = f'"{keyword}" "{location}"'
        if extra:
            base += f' {extra}'
        queries.append(base)
        variants = [f'"{keyword}" near "{location}"', f'"{keyword}" jobs "{location}"']
        if extra:
            variants = [v + f' {extra}' for v in variants]
        queries.extend(variants)
    elif mode == 'company':
        if not company:
            raise typer.BadParameter('For mode=company, pass --company')
        base = f'"{company}"'
        queries = [base]
        if extra:
            queries.append(f"{base} {extra}")
    else:
        raise typer.BadParameter('mode must be "kw" or "company"')
    csv_path = run_queries(queries, per_query, db_path, out_dir)
    typer.echo(f'Done. Wrote: {csv_path}')

if __name__ == '__main__':
    app()
