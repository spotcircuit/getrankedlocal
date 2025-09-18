import { NextRequest, NextResponse } from 'next/server';

interface BusinessAnalysisRequest {
  businessName: string;
  businessWebsite?: string;
  businessNiche?: string;
}

// Grid-search focused query - targeting data we DON'T have from competitor analysis
function buildAnalysisQuery(businessName: string, businessWebsite?: string, businessNiche?: string): string {
  const domainPart = businessWebsite ? `(${businessWebsite.replace(/^https?:\/\//, '')})` : '';

  // Determine if it's a medical spa or general business
  const medicalKeywords = ['med spa', 'medical spa', 'medspa', 'botox', 'filler', 'aesthetic', 'cosmetic', 'dermatology', 'plastic surgery'];
  const isMedicalBusiness = businessNiche ?
    medicalKeywords.some(keyword => businessNiche.toLowerCase().includes(keyword)) :
    medicalKeywords.some(keyword => businessName.toLowerCase().includes(keyword));

  if (isMedicalBusiness) {
    return `For ${businessName} ${domainPart} give me business intelligence data for lead generation: owner founder names with direct contact email and personal LinkedIn, medical director name and credentials, staff names and contact emails, Botox price per unit, filler cost per syringe, HydraFacial pricing, CoolSculpting cost, membership package details and pricing, booking system platform used (Vagaro/Mindbody/etc), business Instagram handle with follower count, business Facebook page name, recent negative Google review themes, expansion plans, hiring activity, years in business, employee count, and any special certifications or awards`;
  } else {
    return `For ${businessName} ${domainPart} give me business intelligence data for lead generation: owner founder names with direct contact email and personal LinkedIn, key staff names and contact emails, detailed service pricing, membership or package deals with costs, appointment booking system used, business Instagram handle with follower count, business Facebook page name, recent negative Google review themes, expansion plans, hiring activity, years in business, employee count, industry certifications, and any awards or recognitions`;
  }
}

// Enhanced parsing for lead generation data (what we DON'T get from grid search)
function parseAIResponse(text: string, businessWebsite?: string): any {
  const intelligence = {
    domain: businessWebsite || '',
    extraction_timestamp: new Date().toISOString(),
    owner: {} as any,
    contacts: { emails: [] as string[], phones: [] as string[] },
    medical_director: {} as any,
    pricing: {} as Record<string, string>,
    technology: {} as any,
    social_media: {} as Record<string, any>,
    review_insights: { negative_themes: [] as string[], positive_themes: [] as string[] },
    business_intel: {} as any,
    staff: [] as any[],
    certifications: [] as string[],
    lead_generation_notes: '',
    expansion_activity: {} as any
  };

  // Extract owner/founder info with multiple names
  const ownerMatch = text.match(/Owner\/Founder:\s*([^\n]+)/i);
  if (ownerMatch) {
    const ownerText = ownerMatch[1];
    // Handle multiple owners: "Dr. Sarah Johnson, MD (owner), Michael Chen (co-founder/operations)"
    const owners = ownerText.split('),').map(o => o.trim() + (o.includes(')') ? '' : ')'));
    if (owners.length > 1) {
      intelligence.owner.names = owners.map(o => o.replace(/\s*\([^)]*\)\s*,?\s*$/, '').trim());
      intelligence.owner.primary = owners[0].replace(/\s*\([^)]*\)\s*,?\s*$/, '').trim();
    } else {
      intelligence.owner.name = ownerText.replace(/\s*\([^)]*\)\s*,?\s*$/, '').trim();
    }
  }

  // Extract direct contact email
  const directContactMatch = text.match(/Direct Contact:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (directContactMatch) {
    intelligence.owner.direct_email = directContactMatch[1];
  }

  // Extract personal LinkedIn
  const linkedinMatch = text.match(/Personal LinkedIn:\s*([^\n]+)/i);
  if (linkedinMatch) {
    intelligence.owner.linkedin = linkedinMatch[1].trim();
  }

  // Extract all emails
  const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const emails = [...text.matchAll(emailPattern)].map(m => m[1]);
  intelligence.contacts.emails = [...new Set(emails)];

  // Extract staff with roles and emails
  const staffSection = text.match(/Key Staff:[\s\n]+((?:[^\n]*\n)*?)(?=\n[A-Z]|\n\n|$)/m);
  if (staffSection) {
    const staffLines = staffSection[1].split('\n').filter(line => line.trim().startsWith('•'));
    intelligence.staff = staffLines.map(line => {
      const cleaned = line.replace(/^[•\-\*]\s*/, '');
      const emailMatch = cleaned.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      const nameParts = cleaned.split(' - ');
      return {
        name: nameParts[0]?.trim(),
        role: nameParts[1]?.replace(emailMatch?.[0] || '', '').replace(/\s*-\s*$/, '').trim(),
        email: emailMatch?.[1]
      };
    }).filter(staff => staff.name);
  }

  // Extract medical director
  const medDirMatch = text.match(/Medical Director:\s*([^\n]+)/i);
  if (medDirMatch) {
    intelligence.medical_director.name = medDirMatch[1].replace(/,.*$/, '').trim();
    const credMatch = medDirMatch[1].match(/(MD|DO|NP|PA-C|RN).*$/i);
    if (credMatch) {
      intelligence.medical_director.credentials = credMatch[0];
    }
  }

  // Extract service pricing with context
  const pricingSection = text.match(/Service Pricing \(Lead Gen Intel\):[\s\n]+((?:[^\n]*\n)*?)(?=\nTechnology|\n[A-Z][^:]*:|$)/m);
  if (pricingSection) {
    const pricingLines = pricingSection[1].split('\n').filter(line => line.trim().startsWith('•'));
    pricingLines.forEach(line => {
      const priceMatch = line.match(/([^:]+):\s*\$([^(]+?)(?:\s*\(|$)/);
      if (priceMatch) {
        const serviceKey = priceMatch[1].replace(/^[•\-\*]\s*/, '').trim().toLowerCase().replace(/\s+/g, '_');
        intelligence.pricing[serviceKey] = `$${priceMatch[2].trim()}`;
      }
    });
  }

  // Extract technology stack
  const bookingMatch = text.match(/Booking Platform:\s*([^\n(]+)/i);
  if (bookingMatch) {
    intelligence.technology.booking_platform = bookingMatch[1].trim();
  }

  const paymentMatch = text.match(/Payment Processing:\s*([^\n]+)/i);
  if (paymentMatch) {
    intelligence.technology.payment_processing = paymentMatch[1].trim();
  }

  // Extract social media with follower counts
  const instagramMatch = text.match(/Instagram:\s*@?([a-zA-Z0-9._]+)\s*\(([^)]+)\)/i);
  if (instagramMatch) {
    intelligence.social_media.instagram = {
      handle: instagramMatch[1],
      followers: instagramMatch[2]
    };
  }

  const facebookMatch = text.match(/Facebook:\s*([^(]+)\s*\(([^)]+)\)/i);
  if (facebookMatch) {
    intelligence.social_media.facebook = {
      page_name: facebookMatch[1].trim(),
      likes: facebookMatch[2]
    };
  }

  // Extract business intelligence
  const foundedMatch = text.match(/Founded:\s*(\d{4})\s*\(([^)]+)\)/i);
  if (foundedMatch) {
    intelligence.business_intel.founded = foundedMatch[1];
    intelligence.business_intel.years_in_business = foundedMatch[2];
  }

  const empMatch = text.match(/Employee Count:\s*([^\n]+)/i);
  if (empMatch) {
    intelligence.business_intel.employees = empMatch[1].trim();
  }

  // Extract expansion activity
  const expansionMatch = text.match(/Expansion:\s*([^\n]+)/i);
  if (expansionMatch) {
    intelligence.expansion_activity.recent = expansionMatch[1].trim();
  }

  const hiringMatch = text.match(/Hiring:\s*([^\n]+)/i);
  if (hiringMatch) {
    intelligence.expansion_activity.hiring = hiringMatch[1].trim();
  }

  // Extract negative review themes
  const reviewSection = text.match(/Recent Negative Review Themes:[\s\n]+((?:[^\n]*\n)*?)(?=\nCertifications|\n[A-Z][^:]*:|$)/m);
  if (reviewSection) {
    const themeLines = reviewSection[1].split('\n').filter(line => line.trim().startsWith('•'));
    intelligence.review_insights.negative_themes = themeLines.map(line =>
      line.replace(/^[•\-\*]\s*/, '').trim()
    );
  }

  // Extract certifications and awards
  const certSection = text.match(/Certifications & Awards:[\s\n]+((?:[^\n]*\n)*?)(?=\nLead Generation|\n[A-Z][^:]*:|$)/m);
  if (certSection) {
    const certLines = certSection[1].split('\n').filter(line => line.trim().startsWith('•'));
    intelligence.certifications = certLines.map(line =>
      line.replace(/^[•\-\*]\s*/, '').trim()
    );
  }

  // Extract lead generation notes
  const leadNotesMatch = text.match(/Lead Generation Notes:\s*([^\n]+)/i);
  if (leadNotesMatch) {
    intelligence.lead_generation_notes = leadNotesMatch[1].trim();
  }

  return intelligence;
}

export async function POST(request: NextRequest) {
  try {
    const body: BusinessAnalysisRequest = await request.json();
    const { businessName, businessWebsite, businessNiche } = body;

    if (!businessName) {
      return NextResponse.json(
        { error: 'Business name is required' },
        { status: 400 }
      );
    }

    // Build the analysis query
    const query = buildAnalysisQuery(businessName, businessWebsite, businessNiche);

    // Simulate Google AI search analysis
    // In a real implementation, this would call a headless browser automation service
    // or integrate with the production Python script

    // Simulate realistic lead generation intelligence (data NOT available from grid search)
    const mockResponse = `Business Intelligence for Lead Generation:

Owner/Founder: Dr. Sarah Johnson, MD (owner), Michael Chen (co-founder/operations)
Direct Contact: sarah.johnson@${businessWebsite?.replace(/^https?:\/\//, '') || 'business.com'}
Personal LinkedIn: linkedin.com/in/dr-sarah-johnson-md

${businessNiche?.toLowerCase().includes('med') ? 'Medical Director: Dr. Sarah Johnson, MD, Board Certified Dermatologist' : ''}

Key Staff:
• Jessica Martinez - Operations Manager - jessica@${businessWebsite?.replace(/^https?:\/\//, '') || 'business.com'}
• Amanda Wilson - Lead Aesthetician - amanda@${businessWebsite?.replace(/^https?:\/\//, '') || 'business.com'}

Service Pricing (Lead Gen Intel):
${businessNiche?.toLowerCase().includes('med') ?
`• Botox: $12 per unit (industry avg: $10-15)
• Dermal Fillers: $650 per syringe (Juvederm)
• HydraFacial: $175 per session
• CoolSculpting: $2,400 per treatment area
• Membership Package: $199/month (includes 1 HydraFacial + 20% off all services)` :
`• Premium Service: $150 per session
• Standard Package: $89 per treatment
• Monthly Membership: $129/month (includes 2 treatments)
• Corporate Package: $2,500 for 20 sessions`}

Technology Stack:
Booking Platform: Vagaro (appointment scheduling)
Payment Processing: Square integrated

Social Media Presence:
Instagram: @${businessName.toLowerCase().replace(/\s+/g, '')} (2,847 followers)
Facebook: ${businessName} (1,234 page likes)

Business Intelligence:
Founded: 2018 (6 years in business)
Employee Count: 8-12 staff members
Expansion: Recently opened second location in 2023
Hiring: Currently seeking licensed aesthetician (Indeed posting active)

Recent Negative Review Themes:
• Appointment wait times (15+ minutes late starts)
• Pricing higher than competitors mentioned in reviews
• Difficulty reaching staff by phone for rescheduling

Certifications & Awards:
${businessNiche?.toLowerCase().includes('med') ?
'• Board Certified Dermatology (Dr. Johnson)' :
'• Industry Certification in Advanced Techniques'}
• 2023 Local Business Excellence Award
• BBB A+ Rating

Lead Generation Notes:
High-value target - premium pricing indicates strong cash flow, expansion shows growth, hiring suggests capacity building.`;

    // Parse the response using production patterns
    const parsedData = parseAIResponse(mockResponse, businessWebsite);

    return NextResponse.json(parsedData);

  } catch (error) {
    console.error('AI Business Analysis Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze business' },
      { status: 500 }
    );
  }
}