import { NextRequest, NextResponse } from 'next/server';

interface BusinessAnalysisRequest {
  businessName: string;
  businessWebsite?: string;
  businessNiche?: string;
}

// Template query based on production AI module patterns
function buildAnalysisQuery(businessName: string, businessWebsite?: string, businessNiche?: string): string {
  const domainPart = businessWebsite ? `(${businessWebsite.replace(/^https?:\/\//, '')})` : '';

  // Determine if it's a medical spa or general business
  const medicalKeywords = ['med spa', 'medical spa', 'medspa', 'botox', 'filler', 'aesthetic', 'cosmetic', 'dermatology', 'plastic surgery'];
  const isMedicalBusiness = businessNiche ?
    medicalKeywords.some(keyword => businessNiche.toLowerCase().includes(keyword)) :
    medicalKeywords.some(keyword => businessName.toLowerCase().includes(keyword));

  if (isMedicalBusiness) {
    return `Give me complete details on ${businessName} ${domainPart} - owner founder name with email and LinkedIn profile, company LinkedIn, all staff and location emails, medical director MD/DO name and credentials, Botox price per unit, filler cost per syringe, membership packages, booking platform name, all social media handles and follower counts (Instagram Facebook TikTok Twitter YouTube), top 3 local competitors by name, negative review themes, and recent expansion or hiring news`;
  } else {
    return `Give me complete details on ${businessName} ${domainPart} - owner founder name with email and LinkedIn profile, company LinkedIn, all staff and location emails, pricing for main services, membership or package deals, booking platform or reservation system, all social media handles and follower counts (Instagram Facebook TikTok Twitter YouTube), top 3 local competitors by name, negative review themes, and recent expansion or hiring news`;
  }
}

// Enhanced parsing function based on production patterns
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
    competitors: [] as string[],
    review_insights: { negative_themes: [] as string[], positive_themes: [] as string[] },
    business_intel: {} as any,
    staff: [] as string[],
    location: {} as any,
    services: [] as string[],
    industry: null as string | null
  };

  // Extract Industry
  const industryMatch = text.match(/Industry:\s*([^\n]+)/);
  if (industryMatch) {
    intelligence.industry = industryMatch[1].trim();
  }

  // Extract Services
  const servicesMatch = text.match(/Services:[\s\n]+([^\n]+(?:\n[^\n]+)*?)(?=\nSocial|\nContact|\nFacebook|\n[A-Z][a-z]+\s+[A-Z]|$)/m);
  if (servicesMatch) {
    const servicesText = servicesMatch[1];
    const services = [];
    for (const line of servicesText.split('\n')) {
      const cleanLine = line.trim().replace(/^[\u2022\-\*•]\s*/, '');
      if (cleanLine && !['social', 'facebook', 'instagram', 'follower', 'potential', 'competitor'].some(skip => cleanLine.toLowerCase().includes(skip))) {
        services.push(cleanLine);
      }
    }
    intelligence.services = services.slice(0, 5);
  }

  // Extract owner/founder info - using simpler patterns for mock data
  const ownerMatch = text.match(/Owner\/Founder:\s*([^\n]+)/i);
  if (ownerMatch && !['not available', 'analysis in progress'].some(placeholder => ownerMatch[1].toLowerCase().includes(placeholder))) {
    intelligence.owner.name = ownerMatch[1].trim();
  }

  // Extract emails
  const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const emails = [...text.matchAll(emailPattern)].map(m => m[1]);
  intelligence.contacts.emails = [...new Set(emails)];

  // Extract phones
  const phonePattern = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phones = [...text.matchAll(phonePattern)].map(m => m[0]);
  intelligence.contacts.phones = [...new Set(phones)];

  // Extract LinkedIn profiles
  const linkedinMatch = text.match(/LinkedIn:\s*([^\n,]+)/i);
  if (linkedinMatch) {
    intelligence.owner.linkedin = linkedinMatch[1].trim();
  }

  // Extract pricing
  const pricingSection = text.match(/Pricing:[\s\n]+([^\n]+(?:\n[^\n]+)*?)(?=\n[A-Z]|\n\n|$)/m);
  if (pricingSection) {
    const pricingText = pricingSection[1];
    const servicePrices = [...pricingText.matchAll(/([^:$]+):\s*\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g)];
    for (const [, service, price] of servicePrices) {
      const serviceKey = service.trim().toLowerCase().replace(/\s+/g, '_');
      intelligence.pricing[serviceKey] = `$${price}`;
    }
  }

  // Extract social media
  const socialPatterns = [
    { platform: 'facebook', pattern: /Facebook:\s*([^\n]+)/i },
    { platform: 'instagram', pattern: /Instagram:\s*@?([a-zA-Z0-9._]+)/i },
    { platform: 'twitter', pattern: /Twitter:\s*@?([a-zA-Z0-9_]+)/i },
    { platform: 'tiktok', pattern: /TikTok:\s*@?([a-zA-Z0-9._]+)/i },
    { platform: 'youtube', pattern: /YouTube:\s*([^,\n]+)/i },
  ];

  for (const { platform, pattern } of socialPatterns) {
    const match = text.match(pattern);
    if (match) {
      const handle = match[1].trim();
      intelligence.social_media[platform] = { handle };
    }
  }

  // Extract competitors
  const compMatch = text.match(/Competitors include:\s*([^\n]+)/i);
  if (compMatch) {
    const competitors = compMatch[1].split(',').map(c => c.trim()).filter(c => c.length > 0);
    intelligence.competitors = competitors.slice(0, 3);
  }

  // Extract negative themes
  const negativeMatch = text.match(/Negative review themes:\s*([^\n]+)/i);
  if (negativeMatch) {
    const themes = negativeMatch[1].split(',').map(t => t.trim()).filter(t => t.length > 0);
    intelligence.review_insights.negative_themes = themes;
  }

  // Extract business intel
  const foundedMatch = text.match(/Founded:\s*(\d{4})/i);
  if (foundedMatch) {
    intelligence.business_intel.founded = foundedMatch[1];
  }

  const empMatch = text.match(/Employees:\s*([^\n]+)/i);
  if (empMatch) {
    intelligence.business_intel.employees = empMatch[1].trim();
  }

  // Extract booking platform
  const bookingMatch = text.match(/Booking Platform:\s*([^\n]+)/i);
  if (bookingMatch) {
    intelligence.technology.booking_platform = bookingMatch[1].trim();
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

    // For now, simulate a realistic response structure
    const mockResponse = `Industry: ${businessNiche || 'Business Services'}

Owner/Founder: Analysis in progress for ${businessName}

Services:
• Primary service offering
• Secondary service offering
• Consultation services

Contact Information:
Email: info@${businessWebsite?.replace(/^https?:\/\//, '') || 'business.com'}
Phone: (555) 123-4567

Social Media:
Instagram: @${businessName.toLowerCase().replace(/\s+/g, '')}
Facebook: ${businessName}

Competitors include: Business A, Business B, Business C

Negative review themes: waiting times, pricing concerns

Founded: 2020
Employees: 5-10

Booking Platform: Square

LinkedIn: ${businessName.replace(/\s+/g, '-').toLowerCase()}

Pricing:
Basic service: $100
Premium service: $200

Analysis completed using Google AI mode search.`;

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