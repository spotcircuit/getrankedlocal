'use client';

import React, { useMemo, useState } from 'react';

// Local SEO / Google Business Profile Intake Form
// -------------------------------------------------
// ✅ Built with React + Tailwind (no external UI deps)
// ✅ Multi-step wizard with validation & dynamic repeaters
// ✅ Produces a clean JSON payload ready for n8n/Zapier webhook
// ✅ Copy-to-clipboard + test POST button
// -------------------------------------------------
// How to use:
// - Drop this component into a Next.js/React app.
// - Provide a WEBHOOK_URL env var or replace the placeholder in handleSubmit.
// - Tailwind required for styling (remove classes if not using Tailwind).
// - Extend fields as needed; everything is typed & organized for easy editing.

// -------------------- Types --------------------

type Hours = {
  open: string;
  close: string;
  closed: boolean;
};

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

const defaultHours: Record<DayKey, Hours> = {
  mon: { open: '09:00', close: '17:00', closed: false },
  tue: { open: '09:00', close: '17:00', closed: false },
  wed: { open: '09:00', close: '17:00', closed: false },
  thu: { open: '09:00', close: '17:00', closed: false },
  fri: { open: '09:00', close: '17:00', closed: false },
  sat: { open: '10:00', close: '14:00', closed: true },
  sun: { open: '10:00', close: '14:00', closed: true },
};

type Location = {
  locationName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  primaryCategory: string; // e.g., "Medical spa"
  additionalCategories: string[];
  serviceAreaBusiness: boolean;
  serviceAreaCities: string[];
  parkingDetails?: string;
  accessibility: string[]; // e.g., ["Wheelchair accessible"]
  hours: Record<DayKey, Hours>;
};

type Service = {
  name: string; // e.g., "Botox"
  description?: string;
  priceFrom?: string;
  keywords: string[]; // ["botox near me", "botox {city}"]
};

type IntakePayload = {
  business: {
    legalName: string;
    dbaName?: string;
    vertical: string; // e.g., "Medical Spa"
    website?: string;
    primaryContact: { name: string; email: string; phone: string };
  };
  locations: Location[];
  gbp: {
    profileUrl?: string;
    appointmentLink?: string;
    managerEmailInvited?: string; // email you asked owner to add in GBP
    attributes: string[]; // women-led, veteran-owned, etc
    services: Service[];
    qnaSeeds: string[];
    messagingConsent: { smsReviews: boolean; emailReviews: boolean; missedCallTextBack: boolean };
  };
  reviews: {
    currentCount?: number;
    avgRating?: number;
    targetPerMonth: number; // target reviews/mo
    platforms: string[]; // ["Google", "Yelp", ...]
    googleReviewLink?: string;
    escalationEmail?: string; // for ≤3★ alerts
  };
  website: {
    cms?: string; // Wordpress, Webflow, Shopify, Squarespace, Custom
    bookingSystem?: string; // Acuity, Vagaro, Boulevard, GlossGenius, etc.
    ga4PropertyId?: string;
    gtmId?: string;
    gscVerified?: boolean;
    callTracking?: string; // CallRail, Twilio, none
  };
  social: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
  };
  citations: {
    yelp?: string;
    healthgrades?: string;
    realself?: string;
    bbb?: string;
    appleMaps?: string;
    bingPlaces?: string;
    otherListings: string[];
  };
  competitors: { name: string; url?: string; gmapUrl?: string }[];
  keywords: string[];
  assets: {
    logoUrl?: string;
    brandGuideUrl?: string;
    photoFolderUrl?: string; // Google Drive/Dropbox link
    consentOnFile: boolean; // confirms B/A photos OK to use (HIPAA-safe)
    beforeAfterPolicy?: string; // short note on your policy
  };
  compliance: {
    hipaaSensitive: boolean;
    allowFirstNameInReviews: boolean;
    disclaimersAccepted: boolean; // rankings fluctuate, no medical claims
  };
  goals: {
    kpis: { callsPerWeek?: number; bookingsPerWeek?: number; revenuePerNewPatient?: number };
    targets: { top3Days?: number; cityExpansion?: string[] };
    offers: { membership?: boolean; promos?: string; financing?: boolean };
    budget?: { monthly?: number };
  };
  approvals: {
    autoPostGBP: boolean; // allow us to auto-post approved content
    autoReplyPosReviews: boolean; // auto reply to ≥4★
    alertLowReviewsEmail?: string; // alert for ≤3★
  };
};

const emptyLocation = (): Location => ({
  locationName: 'Primary Location',
  address1: '',
  address2: '',
  city: '',
  state: '',
  zip: '',
  country: 'US',
  phone: '',
  primaryCategory: 'Medical spa',
  additionalCategories: [],
  serviceAreaBusiness: false,
  serviceAreaCities: [],
  parkingDetails: '',
  accessibility: [],
  hours: JSON.parse(JSON.stringify(defaultHours)),
});

const defaultPayload: IntakePayload = {
  business: {
    legalName: '',
    dbaName: '',
    vertical: 'Medical Spa',
    website: '',
    primaryContact: { name: '', email: '', phone: '' },
  },
  locations: [emptyLocation()],
  gbp: {
    profileUrl: '',
    appointmentLink: '',
    managerEmailInvited: '',
    attributes: [],
    services: [],
    qnaSeeds: [
      'Do you offer same-day Botox appointments?',
      'Where do I park when I arrive?',
    ],
    messagingConsent: { smsReviews: true, emailReviews: true, missedCallTextBack: true },
  },
  reviews: {
    currentCount: undefined,
    avgRating: undefined,
    targetPerMonth: 10,
    platforms: ['Google'],
    googleReviewLink: '',
    escalationEmail: '',
  },
  website: { cms: '', bookingSystem: '', ga4PropertyId: '', gtmId: '', gscVerified: false, callTracking: '' },
  social: { instagram: '', facebook: '', tiktok: '', youtube: '' },
  citations: { yelp: '', healthgrades: '', realself: '', bbb: '', appleMaps: '', bingPlaces: '', otherListings: [] },
  competitors: [],
  keywords: ['med spa {city}', 'botox {city}', 'lip filler {city}'],
  assets: { logoUrl: '', brandGuideUrl: '', photoFolderUrl: '', consentOnFile: false, beforeAfterPolicy: '' },
  compliance: { hipaaSensitive: true, allowFirstNameInReviews: true, disclaimersAccepted: false },
  goals: {
    kpis: { callsPerWeek: undefined, bookingsPerWeek: undefined, revenuePerNewPatient: undefined },
    targets: { top3Days: 90, cityExpansion: [] },
    offers: { membership: false, promos: '', financing: true },
    budget: { monthly: undefined },
  },
  approvals: { autoPostGBP: true, autoReplyPosReviews: true, alertLowReviewsEmail: '' },
};

// -------------------- UI Helpers --------------------

const Section: React.FC<{ title: string; children: React.ReactNode; subtitle?: string }> = ({ title, children, subtitle }) => (
  <div className='bg-white rounded-2xl shadow p-5 sm:p-6 mb-6 border border-gray-100'>
    <h2 className='text-xl font-semibold'>{title}</h2>
    {subtitle && <p className='text-sm text-gray-500 mt-1'>{subtitle}</p>}
    <div className='mt-4 grid gap-4'>{children}</div>
  </div>
);

const Label: React.FC<{ children: React.ReactNode }>=({children})=> (
  <label className='text-sm font-medium text-gray-700'>{children}</label>
);

const TextInput: React.FC<{
  value: string | number | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}> = ({ value, onChange, placeholder, type = 'text' }) => (
  <input
    className='w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10'
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    type={type}
  />
);

const Checkbox: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
  <label className='inline-flex items-center gap-2 text-sm'>
    <input type='checkbox' checked={checked} onChange={(e) => onChange(e.target.checked)} className='h-4 w-4' />
    {label}
  </label>
);

const PillInput: React.FC<{ values: string[]; onChange: (arr: string[]) => void; placeholder?: string }> = ({ values, onChange, placeholder }) => {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...values, v]);
    setDraft('');
  };
  const remove = (i: number) => onChange(values.filter((_, idx) => idx !== i));
  return (
    <div>
      <div className='flex gap-2'>
        <input className='flex-1 rounded-xl border border-gray-300 px-3 py-2' value={draft} onChange={(e)=>setDraft(e.target.value)} placeholder={placeholder ?? 'Add item and press +'} />
        <button type='button' onClick={add} className='rounded-xl border px-3 py-2 hover:bg-gray-50'>+
        </button>
      </div>
      {values.length>0 && (
        <div className='flex flex-wrap gap-2 mt-2'>
          {values.map((v,i)=> (
            <span key={i} className='inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm'>
              {v}
              <button type='button' onClick={()=>remove(i)} className='text-gray-500 hover:text-black'>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const Stepper: React.FC<{ step: number; total: number }>=({step,total})=>{
  const pct = Math.round(((step+1)/total)*100);
  return (
    <div className='mb-4'>
      <div className='flex items-center justify-between text-sm text-gray-600 mb-1'>
        <span>Step {step+1} of {total}</span>
        <span>{pct}%</span>
      </div>
      <div className='h-2 bg-gray-200 rounded-full overflow-hidden'>
        <div className='h-full bg-black/80' style={{width: `${pct}%`}} />
      </div>
    </div>
  );
};

// -------------------- Main Component --------------------

export default function LocalSEOIntakeForm(){
  const [data, setData] = useState<IntakePayload>({...defaultPayload});
  const [step, setStep] = useState(0);
  const steps = [
    'Business & Contacts',
    'Locations & Hours',
    'GBP & Services',
    'Reviews & Messaging',
    'Website & Tracking',
    'Social & Citations',
    'Competitors & Keywords',
    'Assets & Compliance',
    'Goals & Approvals',
    'Review & Submit',
  ];

  const canNext = useMemo(()=>{
    if(step===0){
      const b = data.business;
      return b.legalName && b.primaryContact.name && b.primaryContact.email && b.primaryContact.phone;
    }
    if(step===1){
      return data.locations.every(loc => loc.city && loc.state && loc.zip && loc.phone && loc.primaryCategory);
    }
    if(step===2){
      return true;
    }
    if(step===3){ return !!data.reviews.targetPerMonth; }
    if(step===8){ return data.compliance.disclaimersAccepted; }
    return true;
  },[data,step]);

  const copyJson = async ()=>{
    const str = JSON.stringify(data, null, 2);
    await navigator.clipboard.writeText(str);
    alert('JSON copied to clipboard ✔');
  };

  const handleSubmit = async ()=>{
    try {
      const payload = { ...data, submittedAt: new Date().toISOString() };
      // 🔌 Replace with your n8n webhook URL
      const WEBHOOK_URL = process.env.NEXT_PUBLIC_INTAKE_WEBHOOK || '';
      if(!WEBHOOK_URL){
        console.warn('No webhook URL set. Set NEXT_PUBLIC_INTAKE_WEBHOOK.');
        alert('No webhook configured. JSON shown below; copy or set NEXT_PUBLIC_INTAKE_WEBHOOK.');
        console.log(payload);
        return;
      }
      const res = await fetch(WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if(!res.ok) throw new Error(`Webhook error: ${res.status}`);
      alert('Submitted to webhook ✔');
    } catch (e:any) {
      alert(`Submit failed: ${e.message}`);
    }
  };

  // -------- Renderers per step --------

  const renderBusiness = () => (
    <Section title='Business & Primary Contact' subtitle='Tell us who you are and how to reach you.'>
      <div className='grid md:grid-cols-2 gap-4'>
        <div>
          <Label>Legal business name *</Label>
          <TextInput value={data.business.legalName} onChange={(v)=>setData({...data, business:{...data.business, legalName:v}})} placeholder='Auveau Aesthetics LLC'/>
        </div>
        <div>
          <Label>DBA (public name)</Label>
          <TextInput value={data.business.dbaName} onChange={(v)=>setData({...data, business:{...data.business, dbaName:v}})} placeholder='Auveau Aesthetics + Wellness'/>
        </div>
        <div>
          <Label>Website</Label>
          <TextInput value={data.business.website} onChange={(v)=>setData({...data, business:{...data.business, website:v}})} placeholder='https://example.com'/>
        </div>
        <div>
          <Label>Vertical</Label>
          <TextInput value={data.business.vertical} onChange={(v)=>setData({...data, business:{...data.business, vertical:v}})} placeholder='Medical Spa'/>
        </div>
      </div>
      <div className='grid md:grid-cols-3 gap-4'>
        <div>
          <Label>Primary contact name *</Label>
          <TextInput value={data.business.primaryContact.name} onChange={(v)=>setData({...data, business:{...data.business, primaryContact:{...data.business.primaryContact, name:v}}})} placeholder='Jane Doe'/>
        </div>
        <div>
          <Label>Primary contact email *</Label>
          <TextInput value={data.business.primaryContact.email} onChange={(v)=>setData({...data, business:{...data.business, primaryContact:{...data.business.primaryContact, email:v}}})} placeholder='jane@clinic.com' type='email'/>
        </div>
        <div>
          <Label>Primary contact phone *</Label>
          <TextInput value={data.business.primaryContact.phone} onChange={(v)=>setData({...data, business:{...data.business, primaryContact:{...data.business.primaryContact, phone:v}}})} placeholder='(555) 555-5555'/>
        </div>
      </div>
    </Section>
  );

  const changeLocation = (idx:number, patch: Partial<Location>)=>{
    const copy = [...data.locations];
    copy[idx] = { ...copy[idx], ...patch };
    setData({ ...data, locations: copy });
  };

  const renderLocations = () => (
    <>
      {data.locations.map((loc, idx)=> (
        <Section key={idx} title={`Location ${idx+1}: ${loc.locationName||'(unnamed)'}`} subtitle='Exact NAP, categories, and hours help you rank locally.'>
          <div className='grid md:grid-cols-2 gap-4'>
            <div>
              <Label>Location name</Label>
              <TextInput value={loc.locationName} onChange={(v)=>changeLocation(idx,{locationName:v})} placeholder='West Lake Hills'/>
            </div>
            <div>
              <Label>Phone *</Label>
              <TextInput value={loc.phone} onChange={(v)=>changeLocation(idx,{phone:v})} placeholder='(555) 555-5555'/>
            </div>
            <div>
              <Label>Address 1 *</Label>
              <TextInput value={loc.address1} onChange={(v)=>changeLocation(idx,{address1:v})} placeholder='123 Main St'/>
            </div>
            <div>
              <Label>Address 2</Label>
              <TextInput value={loc.address2||''} onChange={(v)=>changeLocation(idx,{address2:v})} placeholder='Suite 200'/>
            </div>
            <div>
              <Label>City *</Label>
              <TextInput value={loc.city} onChange={(v)=>changeLocation(idx,{city:v})} placeholder='Austin'/>
            </div>
            <div className='grid grid-cols-3 gap-2'>
              <div>
                <Label>State *</Label>
                <TextInput value={loc.state} onChange={(v)=>changeLocation(idx,{state:v})} placeholder='TX'/>
              </div>
              <div>
                <Label>Zip *</Label>
                <TextInput value={loc.zip} onChange={(v)=>changeLocation(idx,{zip:v})} placeholder='78746'/>
              </div>
              <div>
                <Label>Country</Label>
                <TextInput value={loc.country} onChange={(v)=>changeLocation(idx,{country:v})} placeholder='US'/>
              </div>
            </div>
            <div>
              <Label>Primary category *</Label>
              <TextInput value={loc.primaryCategory} onChange={(v)=>changeLocation(idx,{primaryCategory:v})} placeholder='Medical spa'/>
            </div>
            <div>
              <Label>Additional categories</Label>
              <PillInput values={loc.additionalCategories} onChange={(arr)=>changeLocation(idx,{additionalCategories:arr})} placeholder='Add a category and press +'/>
            </div>
            <div className='col-span-full grid md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Service area business?</Label>
                <div className='flex gap-4'>
                  <Checkbox checked={loc.serviceAreaBusiness} onChange={(v)=>changeLocation(idx,{serviceAreaBusiness:v})} label='Yes, we travel to clients' />
                </div>
                {loc.serviceAreaBusiness && (
                  <div>
                    <Label>Service area cities</Label>
                    <PillInput values={loc.serviceAreaCities} onChange={(arr)=>changeLocation(idx,{serviceAreaCities:arr})} placeholder='Add city / neighborhood'/>
                  </div>
                )}
              </div>
              <div className='space-y-2'>
                <Label>Accessibility</Label>
                <PillInput values={loc.accessibility} onChange={(arr)=>changeLocation(idx,{accessibility:arr})} placeholder='e.g., Wheelchair accessible entrance'/>
                <Label>Parking details</Label>
                <TextInput value={loc.parkingDetails||''} onChange={(v)=>changeLocation(idx,{parkingDetails:v})} placeholder='Garage parking, validated'/>
              </div>
            </div>
          </div>
          <div className='mt-4'>
            <Label>Hours</Label>
            <div className='grid md:grid-cols-2 gap-3 mt-2'>
              {Object.keys(loc.hours).map((k)=>{
                const dk = k as DayKey;
                const hv = loc.hours[dk];
                return (
                  <div key={k} className='flex items-center gap-3'>
                    <div className='w-20 sm:w-24 capitalize text-sm text-gray-600'>{dk}</div>
                    <Checkbox checked={hv.closed} onChange={(v)=>{
                      const hours = {...loc.hours, [dk]: { ...hv, closed: v }};
                      changeLocation(idx,{ hours });
                    }} label='Closed'/>
                    {!hv.closed && (
                      <>
                        <input type='time' value={hv.open} onChange={(e)=>{
                          const hours = {...loc.hours, [dk]: { ...hv, open: e.target.value }};
                          changeLocation(idx,{ hours });
                        }} className='border rounded px-2 py-1'/>
                        <span>–</span>
                        <input type='time' value={hv.close} onChange={(e)=>{
                          const hours = {...loc.hours, [dk]: { ...hv, close: e.target.value }};
                          changeLocation(idx,{ hours });
                        }} className='border rounded px-2 py-1'/>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Section>
      ))}

      <div className='flex gap-3'>
        <button type='button' className='rounded-xl border px-3 py-2' onClick={()=> setData({...data, locations: [...data.locations, emptyLocation()]})}>+ Add location</button>
        {data.locations.length>1 && (
          <button type='button' className='rounded-xl border px-3 py-2' onClick={()=> setData({...data, locations: data.locations.slice(0,-1)})}>Remove last</button>
        )}
      </div>
    </>
  );

  const renderGBP = () => (
    <Section title='Google Business Profile (GBP) & Services' subtitle='Everything we need to harden your GBP and capture service keywords.'>
      <div className='grid md:grid-cols-2 gap-4'>
        <div>
          <Label>GBP profile URL</Label>
          <TextInput value={data.gbp.profileUrl} onChange={(v)=>setData({...data, gbp:{...data.gbp, profileUrl:v}})} placeholder='https://maps.google.com/...'/>
        </div>
        <div>
          <Label>Appointment link</Label>
          <TextInput value={data.gbp.appointmentLink} onChange={(v)=>setData({...data, gbp:{...data.gbp, appointmentLink:v}})} placeholder='https://booking.example.com'/>
        </div>
        <div>
          <Label>Manager email invited (GBP access)</Label>
          <TextInput value={data.gbp.managerEmailInvited} onChange={(v)=>setData({...data, gbp:{...data.gbp, managerEmailInvited:v}})} placeholder='seo@youragency.com'/>
        </div>
        <div>
          <Label>Attributes (type and press +)</Label>
          <PillInput values={data.gbp.attributes} onChange={(arr)=>setData({...data, gbp:{...data.gbp, attributes:arr}})} placeholder='Women-led, Veteran-owned, LGBTQ+ friendly'/>
        </div>
      </div>
      <div>
        <Label>Core services (with optional keywords)</Label>
        <ServiceEditor services={data.gbp.services} onChange={(arr)=>setData({...data, gbp:{...data.gbp, services:arr}})} />
      </div>
      <div>
        <Label>Seed Q&A for GBP</Label>
        <PillInput values={data.gbp.qnaSeeds} onChange={(arr)=>setData({...data, gbp:{...data.gbp, qnaSeeds:arr}})} placeholder='Add common patient questions'/>
      </div>
      <div className='grid md:grid-cols-3 gap-4'>
        <Checkbox checked={data.gbp.messagingConsent.smsReviews} onChange={(v)=>setData({...data, gbp:{...data.gbp, messagingConsent:{...data.gbp.messagingConsent, smsReviews:v}}})} label='Allow SMS review requests'/>
        <Checkbox checked={data.gbp.messagingConsent.emailReviews} onChange={(v)=>setData({...data, gbp:{...data.gbp, messagingConsent:{...data.gbp.messagingConsent, emailReviews:v}}})} label='Allow email review requests'/>
        <Checkbox checked={data.gbp.messagingConsent.missedCallTextBack} onChange={(v)=>setData({...data, gbp:{...data.gbp, messagingConsent:{...data.gbp.messagingConsent, missedCallTextBack:v}}})} label='Allow missed-call text-back'/>
      </div>
    </Section>
  );

  const renderReviews = () => (
    <Section title='Reviews & Reputation' subtitle='Targets and safeguards for HIPAA-safe review growth.'>
      <div className='grid md:grid-cols-3 gap-4'>
        <div>
          <Label>Current Google review count</Label>
          <TextInput type='number' value={data.reviews.currentCount} onChange={(v)=>setData({...data, reviews:{...data.reviews, currentCount: Number(v||0)}})} placeholder='e.g., 227'/>
        </div>
        <div>
          <Label>Current average rating</Label>
          <TextInput type='number' value={data.reviews.avgRating} onChange={(v)=>setData({...data, reviews:{...data.reviews, avgRating: Number(v||0)}})} placeholder='e.g., 4.9'/>
        </div>
        <div>
          <Label>Target new reviews / month *</Label>
          <TextInput type='number' value={data.reviews.targetPerMonth} onChange={(v)=>setData({...data, reviews:{...data.reviews, targetPerMonth: Number(v||0)}})} placeholder='10'/>
        </div>
      </div>
      <div className='grid md:grid-cols-2 gap-4'>
        <div>
          <Label>Google review link (short)</Label>
          <TextInput value={data.reviews.googleReviewLink} onChange={(v)=>setData({...data, reviews:{...data.reviews, googleReviewLink:v}})} placeholder='https://g.page/r/...'/>
        </div>
        <div>
          <Label>Low-rating escalation email</Label>
          <TextInput type='email' value={data.reviews.escalationEmail} onChange={(v)=>setData({...data, reviews:{...data.reviews, escalationEmail:v}})} placeholder='care@clinic.com'/>
        </div>
      </div>
      <div>
        <Label>Review platforms</Label>
        <PillInput values={data.reviews.platforms} onChange={(arr)=>setData({...data, reviews:{...data.reviews, platforms:arr}})} placeholder='Google, Yelp, Healthgrades'/>
      </div>
    </Section>
  );

  const renderWebsite = () => (
    <Section title='Website & Tracking' subtitle='So we can measure, improve, and attribute results.'>
      <div className='grid md:grid-cols-3 gap-4'>
        <div>
          <Label>CMS</Label>
          <TextInput value={data.website.cms||''} onChange={(v)=>setData({...data, website:{...data.website, cms:v}})} placeholder='WordPress / Webflow / Shopify / ...'/>
        </div>
        <div>
          <Label>Booking system</Label>
          <TextInput value={data.website.bookingSystem||''} onChange={(v)=>setData({...data, website:{...data.website, bookingSystem:v}})} placeholder='Acuity / Boulevard / Vagaro'/>
        </div>
        <div>
          <Label>Call tracking provider</Label>
          <TextInput value={data.website.callTracking||''} onChange={(v)=>setData({...data, website:{...data.website, callTracking:v}})} placeholder='CallRail / Twilio / None'/>
        </div>
        <div>
          <Label>GA4 property ID</Label>
          <TextInput value={data.website.ga4PropertyId||''} onChange={(v)=>setData({...data, website:{...data.website, ga4PropertyId:v}})} placeholder='G-XXXXXXXXX'/>
        </div>
        <div>
          <Label>GTM ID</Label>
          <TextInput value={data.website.gtmId||''} onChange={(v)=>setData({...data, website:{...data.website, gtmId:v}})} placeholder='GTM-XXXXXXX'/>
        </div>
        <div>
          <Label>Search Console verified?</Label>
          <div className='mt-2'><Checkbox checked={!!data.website.gscVerified} onChange={(v)=>setData({...data, website:{...data.website, gscVerified:v}})} label={data.website.gscVerified?'Yes':'No'}/></div>
        </div>
      </div>
    </Section>
  );

  const renderSocialCitations = () => (
    <Section title='Social & Citations' subtitle='Links that reinforce your entity and improve local trust.'>
      <div className='grid md:grid-cols-2 gap-4'>
        <div>
          <Label>Instagram</Label>
          <TextInput value={data.social.instagram||''} onChange={(v)=>setData({...data, social:{...data.social, instagram:v}})} placeholder='https://instagram.com/...'/>
        </div>
        <div>
          <Label>Facebook</Label>
          <TextInput value={data.social.facebook||''} onChange={(v)=>setData({...data, social:{...data.social, facebook:v}})} placeholder='https://facebook.com/...'/>
        </div>
        <div>
          <Label>TikTok</Label>
          <TextInput value={data.social.tiktok||''} onChange={(v)=>setData({...data, social:{...data.social, tiktok:v}})} placeholder='https://tiktok.com/@...'/>
        </div>
        <div>
          <Label>YouTube</Label>
          <TextInput value={data.social.youtube||''} onChange={(v)=>setData({...data, social:{...data.social, youtube:v}})} placeholder='https://youtube.com/@...'/>
        </div>
      </div>
      <div className='grid md:grid-cols-2 gap-4 mt-4'>
        <div>
          <Label>Yelp</Label>
          <TextInput value={data.citations.yelp||''} onChange={(v)=>setData({...data, citations:{...data.citations, yelp:v}})} placeholder='https://yelp.com/biz/...'/>
        </div>
        <div>
          <Label>Healthgrades</Label>
          <TextInput value={data.citations.healthgrades||''} onChange={(v)=>setData({...data, citations:{...data.citations, healthgrades:v}})} placeholder='https://healthgrades.com/...'/>
        </div>
        <div>
          <Label>RealSelf</Label>
          <TextInput value={data.citations.realself||''} onChange={(v)=>setData({...data, citations:{...data.citations, realself:v}})} placeholder='https://realself.com/...'/>
        </div>
        <div>
          <Label>BBB</Label>
          <TextInput value={data.citations.bbb||''} onChange={(v)=>setData({...data, citations:{...data.citations, bbb:v}})} placeholder='https://bbb.org/...'/>
        </div>
        <div>
          <Label>Apple Maps</Label>
          <TextInput value={data.citations.appleMaps||''} onChange={(v)=>setData({...data, citations:{...data.citations, appleMaps:v}})} placeholder='https://maps.apple.com/...'/>
        </div>
        <div>
          <Label>Bing Places</Label>
          <TextInput value={data.citations.bingPlaces||''} onChange={(v)=>setData({...data, citations:{...data.citations, bingPlaces:v}})} placeholder='https://bing.com/maps?...'/>
        </div>
      </div>
      <div>
        <Label>Other listings</Label>
        <PillInput values={data.citations.otherListings} onChange={(arr)=>setData({...data, citations:{...data.citations, otherListings:arr}})} placeholder='Paste URLs, press +'/>
      </div>
    </Section>
  );

  const renderCompetitorsKeywords = () => (
    <Section title='Competitors & Keywords' subtitle='Who are we up against and what should we rank for?'>
      <div>
        <Label>Top competitors (name + link optional)</Label>
        <CompetitorEditor items={data.competitors} onChange={(arr)=>setData({...data, competitors:arr})} />
      </div>
      <div>
        <Label>Priority keywords</Label>
        <PillInput values={data.keywords} onChange={(arr)=>setData({...data, keywords:arr})} placeholder='e.g., med spa west lake hills'/>
      </div>
    </Section>
  );

  const renderAssetsCompliance = () => (
    <Section title='Assets & Compliance' subtitle='Brand assets and what we’re allowed to do (HIPAA-safe).'>
      <div className='grid md:grid-cols-2 gap-4'>
        <div>
          <Label>Logo URL</Label>
          <TextInput value={data.assets.logoUrl||''} onChange={(v)=>setData({...data, assets:{...data.assets, logoUrl:v}})} placeholder='https://.../logo.png'/>
        </div>
        <div>
          <Label>Brand guide URL</Label>
          <TextInput value={data.assets.brandGuideUrl||''} onChange={(v)=>setData({...data, assets:{...data.assets, brandGuideUrl:v}})} placeholder='https://.../brand.pdf'/>
        </div>
        <div>
          <Label>Photo folder (Drive/Dropbox)</Label>
          <TextInput value={data.assets.photoFolderUrl||''} onChange={(v)=>setData({...data, assets:{...data.assets, photoFolderUrl:v}})} placeholder='https://drive.google.com/...'/>
        </div>
        <div className='grid grid-cols-1 gap-2'>
          <Checkbox checked={data.assets.consentOnFile} onChange={(v)=>setData({...data, assets:{...data.assets, consentOnFile:v}})} label='We have consent on file for marketing use of images (no PHI).'/>
          <Label>Before/After policy (optional)</Label>
          <TextInput value={data.assets.beforeAfterPolicy||''} onChange={(v)=>setData({...data, assets:{...data.assets, beforeAfterPolicy:v}})} placeholder='e.g., use initials only, no PHI, written consent required'/>
        </div>
      </div>
      <div className='grid md:grid-cols-3 gap-4 mt-2'>
        <Checkbox checked={data.compliance.hipaaSensitive} onChange={(v)=>setData({...data, compliance:{...data.compliance, hipaaSensitive:v}})} label='Handle data as HIPAA-sensitive'/>
        <Checkbox checked={data.compliance.allowFirstNameInReviews} onChange={(v)=>setData({...data, compliance:{...data.compliance, allowFirstNameInReviews:v}})} label='Allow first-name usage in replies (no treatment confirmation)'/>
        <Checkbox checked={data.compliance.disclaimersAccepted} onChange={(v)=>setData({...data, compliance:{...data.compliance, disclaimersAccepted:v}})} label='Accept ranking/medical disclaimers'/>
      </div>
    </Section>
  );

  const renderGoalsApprovals = () => (
    <Section title='Goals, Offers & Approvals' subtitle='Define success and what we’re authorized to automate.'>
      <div className='grid md:grid-cols-3 gap-4'>
        <div>
          <Label>Target calls/week</Label>
          <TextInput type='number' value={data.goals.kpis.callsPerWeek} onChange={(v)=>setData({...data, goals:{...data.goals, kpis:{...data.goals.kpis, callsPerWeek: Number(v||0)}}})} placeholder='e.g., 25'/>
        </div>
        <div>
          <Label>Target bookings/week</Label>
          <TextInput type='number' value={data.goals.kpis.bookingsPerWeek} onChange={(v)=>setData({...data, goals:{...data.goals, kpis:{...data.goals.kpis, bookingsPerWeek: Number(v||0)}}})} placeholder='e.g., 15'/>
        </div>
        <div>
          <Label>Revenue per new patient ($)</Label>
          <TextInput type='number' value={data.goals.kpis.revenuePerNewPatient} onChange={(v)=>setData({...data, goals:{...data.goals, kpis:{...data.goals.kpis, revenuePerNewPatient: Number(v||0)}}})} placeholder='e.g., 350'/>
        </div>
      </div>
      <div className='grid md:grid-cols-2 gap-4 mt-2'>
        <div>
          <Label>Top-3 target (days)</Label>
          <TextInput type='number' value={data.goals.targets.top3Days} onChange={(v)=>setData({...data, goals:{...data.goals, targets:{...data.goals.targets, top3Days: Number(v||0)}}})} placeholder='e.g., 90'/>
        </div>
        <div>
          <Label>City expansion (optional)</Label>
          <PillInput values={data.goals.targets.cityExpansion||[]} onChange={(arr)=>setData({...data, goals:{...data.goals, targets:{...data.goals.targets, cityExpansion:arr}}})} placeholder='Add nearby cities'/>
        </div>
      </div>
      <div className='grid md:grid-cols-2 gap-4 mt-2'>
        <div>
          <Label>Promos / memberships</Label>
          <TextInput value={data.goals.offers.promos||''} onChange={(v)=>setData({...data, goals:{...data.goals, offers:{...data.goals.offers, promos:v}}})} placeholder='e.g., New patient special, membership tiers'/>
        </div>
        <div className='grid grid-cols-1 gap-2'>
          <Checkbox checked={data.goals.offers.membership||false} onChange={(v)=>setData({...data, goals:{...data.goals, offers:{...data.goals.offers, membership:v}}})} label='We offer memberships'/>
          <Checkbox checked={data.goals.offers.financing||false} onChange={(v)=>setData({...data, goals:{...data.goals, offers:{...data.goals.offers, financing:v}}})} label='We offer financing'/>
        </div>
      </div>
      <div className='grid md:grid-cols-2 gap-4 mt-2'>
        <div>
          <Label>Monthly budget (USD)</Label>
          <TextInput type='number' value={data.goals.budget?.monthly} onChange={(v)=>setData({...data, goals:{...data.goals, budget:{...data.goals.budget, monthly:Number(v||0)}}})} placeholder='e.g., 2497'/>
        </div>
        <div>
          <Label>Alert email for ≤3★ reviews</Label>
          <TextInput type='email' value={data.approvals.alertLowReviewsEmail||''} onChange={(v)=>setData({...data, approvals:{...data.approvals, alertLowReviewsEmail:v}})} placeholder='team@clinic.com'/>
        </div>
      </div>
      <div className='grid md:grid-cols-3 gap-4 mt-2'>
        <Checkbox checked={data.approvals.autoPostGBP} onChange={(v)=>setData({...data, approvals:{...data.approvals, autoPostGBP:v}})} label='Allow auto-posting of approved GBP content'/>
        <Checkbox checked={data.approvals.autoReplyPosReviews} onChange={(v)=>setData({...data, approvals:{...data.approvals, autoReplyPosReviews:v}})} label='Auto-reply to 4★–5★ reviews'/>
        <Checkbox checked={data.compliance.disclaimersAccepted} onChange={(v)=>setData({...data, compliance:{...data.compliance, disclaimersAccepted:v}})} label='Accept ranking/medical disclaimers (required)'/>
      </div>
    </Section>
  );

  const renderReviewSubmit = () => (
    <Section title='Review & Submit' subtitle='Copy your JSON payload or send it to your webhook.'>
      <pre className='bg-gray-950 text-gray-100 text-xs rounded-xl p-4 overflow-auto max-h-96'>
        {JSON.stringify(data, null, 2)}
      </pre>
      <div className='flex flex-wrap gap-3'>
        <button type='button' onClick={copyJson} className='rounded-xl border px-4 py-2 hover:bg-gray-50'>Copy JSON</button>
        <button type='button' onClick={handleSubmit} className='rounded-xl bg-black text-white px-4 py-2 hover:bg-black/90'>Submit to Webhook</button>
      </div>
      <p className='text-xs text-gray-500 mt-3'>Tip: Set <code className='px-1 py-0.5 bg-gray-100 rounded'>NEXT_PUBLIC_INTAKE_WEBHOOK</code> to your n8n/Zapier URL to receive this payload.</p>
    </Section>
  );

  return (
    <div className='intake bg-gray-50 min-h-screen'>
      <div className='max-w-5xl mx-auto px-4 py-6 sm:p-6'>
      <div className='mb-6'>
        <h1 className='text-xl sm:text-2xl md:text-3xl font-semibold'>Local SEO / GBP Intake</h1>
        <p className='text-gray-600 mt-1'>Everything needed to optimize your Google local ranking, in one place.</p>
      </div>

      <Stepper step={step} total={steps.length} />

      {step===0 && renderBusiness()}
      {step===1 && renderLocations()}
      {step===2 && renderGBP()}
      {step===3 && renderReviews()}
      {step===4 && renderWebsite()}
      {step===5 && renderSocialCitations()}
      {step===6 && renderCompetitorsKeywords()}
      {step===7 && renderAssetsCompliance()}
      {step===8 && renderGoalsApprovals()}
      {step===9 && renderReviewSubmit()}

      <div className='flex items-center justify-between mt-4'>
        <button
          type='button'
          onClick={()=> setStep((s)=> Math.max(0, s-1))}
          className='rounded-xl border px-4 py-2 text-sm sm:text-base hover:bg-gray-50 disabled:opacity-40'
          disabled={step===0}
        >Back</button>
        <div className='flex gap-3'>
          {step<steps.length-1 && (
            <button
              type='button'
              onClick={()=> setStep((s)=> Math.min(steps.length-1, s+1))}
              disabled={!canNext}
              className='rounded-xl bg-black text-white px-5 py-2 text-sm sm:text-base hover:bg-black/90 disabled:opacity-40'
            >Next</button>
          )}
          {step===steps.length-1 && (
            <button type='button' onClick={handleSubmit} className='rounded-xl bg-black text-white px-5 py-2 text-sm sm:text-base hover:bg-black/90'>Submit</button>
          )}
        </div>
      </div>

      <footer className='text-xs text-gray-600 mt-6 leading-relaxed'>
        <p><strong>Compliance note:</strong> We never confirm a person was a patient or discuss treatment details in public replies. Rankings fluctuate and are not guaranteed; optimization focuses on best practices, relevance, and user experience.</p>
      </footer>
      </div>
    </div>
  );
}

// -------------------- Editors --------------------

const ServiceEditor: React.FC<{ services: Service[]; onChange: (s: Service[]) => void }>=({services,onChange})=>{
  const add = ()=> onChange([...services, { name: '', description: '', priceFrom: '', keywords: [] }]);
  const remove = (i:number)=> onChange(services.filter((_,idx)=> idx!==i));
  const patch = (i:number, p: Partial<Service>)=> onChange(services.map((s,idx)=> idx===i? { ...s, ...p }: s));
  return (
    <div className='space-y-4'>
      {services.map((s,i)=> (
        <div key={i} className='rounded-xl border p-4'>
          <div className='grid md:grid-cols-3 gap-4'>
            <div>
              <Label>Service name</Label>
              <TextInput value={s.name} onChange={(v)=>patch(i,{name:v})} placeholder='Botox'/>
            </div>
            <div>
              <Label>Price from (optional)</Label>
              <TextInput value={s.priceFrom||''} onChange={(v)=>patch(i,{priceFrom:v})} placeholder='$12/unit'/>
            </div>
            <div>
              <Label>Keywords</Label>
              <PillInput values={s.keywords} onChange={(arr)=>patch(i,{keywords:arr})} placeholder='botox austin, botox near me'/>
            </div>
          </div>
          <div className='mt-3'>
            <Label>Description</Label>
            <textarea className='w-full rounded-xl border border-gray-300 px-3 py-2' style={{ minHeight: '80px' }} value={s.description||''} onChange={(e)=>patch(i,{description:e.target.value})} placeholder='Short, patient-friendly description'/>
          </div>
          <div className='mt-3 text-right'>
            <button type='button' onClick={()=>remove(i)} className='text-sm text-red-600 hover:underline'>Remove service</button>
          </div>
        </div>
      ))}
      <button type='button' onClick={add} className='rounded-xl border px-3 py-2'>+ Add service</button>
    </div>
  );
};

const CompetitorEditor: React.FC<{ items: {name:string; url?:string; gmapUrl?:string}[]; onChange: (arr:any[])=>void }>=({items,onChange})=>{
  const add = ()=> onChange([...items, { name: '', url: '', gmapUrl: '' }]);
  const remove = (i:number)=> onChange(items.filter((_,idx)=> idx!==i));
  const patch = (i:number, p: Partial<{name:string; url?:string; gmapUrl?:string}>)=> onChange(items.map((s,idx)=> idx===i? { ...s, ...p }: s));
  return (
    <div className='space-y-3'>
      {items.map((c,i)=> (
        <div key={i} className='rounded-xl border p-4 grid md:grid-cols-3 gap-3'>
          <div>
            <Label>Competitor name</Label>
            <TextInput value={c.name} onChange={(v)=>patch(i,{name:v})} placeholder="It's A Secret Med Spa - Austin"/>
          </div>
          <div>
            <Label>Website</Label>
            <TextInput value={c.url||''} onChange={(v)=>patch(i,{url:v})} placeholder='https://competitor.com'/>
          </div>
          <div>
            <Label>Google Maps URL</Label>
            <TextInput value={c.gmapUrl||''} onChange={(v)=>patch(i,{gmapUrl:v})} placeholder='https://maps.google.com/...'/>
          </div>
          <div className='md:col-span-3 text-right'>
            <button type='button' onClick={()=>remove(i)} className='text-sm text-red-600 hover:underline'>Remove</button>
          </div>
        </div>
      ))}
      <button type='button' onClick={add} className='rounded-xl border px-3 py-2'>+ Add competitor</button>
    </div>
  );
};
