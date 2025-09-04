// JSON-LD Structured Data Component
// Renders structured data for search engines

interface JsonLdProps {
  data: any;
  id?: string;
}

export function JsonLd({ data, id }: JsonLdProps) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, null, 2),
      }}
    />
  );
}

export default JsonLd;