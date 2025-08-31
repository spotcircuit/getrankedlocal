'use client';

import { useState } from 'react';
import { 
  ChevronDown, ChevronUp, Building2, User, Mail, Phone, Globe, 
  DollarSign, Users, Star, Calendar, TrendingUp, Shield, 
  Instagram, Facebook, Twitter, Youtube, Linkedin, MapPin,
  Package, CreditCard, AlertCircle, Briefcase
} from 'lucide-react';

interface AIIntelligenceDynamicProps {
  aiData: any;
  businessName: string;
}

// Helper to parse raw AI response into sections
function parseAIResponse(rawText: string, businessName: string = ''): Record<string, any> {
  if (!rawText) return {};
  
  const sections: Record<string, any> = {};
  const structured: Record<string, any> = {};
  
  // First, remove duplicate content by finding repeated sections
  let cleanedText = rawText;
  
  // Find and remove duplicate paragraphs (same text appearing multiple times)
  const paragraphs = rawText.split(/\n\n+/);
  const uniqueParagraphs = new Set<string>();
  const deduplicatedParagraphs: string[] = [];
  
  for (const para of paragraphs) {
    const normalized = para.trim().toLowerCase();
    if (normalized && !uniqueParagraphs.has(normalized)) {
      uniqueParagraphs.add(normalized);
      deduplicatedParagraphs.push(para.trim());
    }
  }
  
  cleanedText = deduplicatedParagraphs.join('\n\n');
  
  // Clean up common duplicate text patterns and fragments
  cleanedText = cleanedText
    .replace(/Here are the complete details on [^.]+\.\s*/gi, '')
    .replace(/based on publicly available information\.\s*/gi, '')
    .replace(/Owner and founders?\s*$/gim, '')
    .replace(/or package deals[\s\S]*?top 3 local competitors/g, '') // Remove run-on sentences
    .replace(/by name, negative review themes[^.]*?\./gi, '') // Remove incomplete fragments
    .trim();
  
  // Split into major sections based on common headers
  const sectionPatterns = [
    { key: 'founder', patterns: ['Founder/Owner:', 'Founder:', 'Owner:', 'Founded by', 'Juan Carlos', 'JC Sanabria'] },
    { key: 'staff', patterns: ['Staff:', 'Team:', 'Key personnel:', 'Key staff:', 'Employees:'] },
    { key: 'pricing', patterns: ['Pricing:', 'Main service pricing:', 'Cost:', 'Prices:', 'Membership', 'General pricing', 'Daily specials', 'Happy Hour'] },
    { key: 'services', patterns: ['Services:', 'Main services:', 'Treatments:', 'Offers:', 'Specializes'] },
    { key: 'social', patterns: ['Social Media:', 'Instagram:', 'Facebook:', 'Social media handles:', 'Social media'] },
    { key: 'competitors', patterns: ['Competitors:', 'Top .* competitors:', 'Competition:', 'local competitors', 'top 3'] },
    { key: 'reviews', patterns: ['Negative review themes:', 'Review themes:', 'Customer complaints', 'negative review'] },
    { key: 'booking', patterns: ['Booking Platform:', 'Booking:', 'Reservation:', 'Appointment', 'Booking platform'] },
    { key: 'location', patterns: ['Primary Location:', 'Location:', 'Address:'] },
    { key: 'expansion', patterns: ['Recent expansion:', 'Expansion:', 'Recent news:', 'Hiring news:', 'expansion', 'hiring for a new'] },
    { key: 'contact', patterns: ['Contact Information:', 'Contact:', 'Location Email:', 'General email:', 'Contact information', 'Owner email'] },
  ];
  
  // Find each section in the text
  sectionPatterns.forEach(({ key, patterns }) => {
    for (const pattern of patterns) {
      // Try different regex patterns to catch various formats
      const regexPatterns = [
        new RegExp(`${pattern}[:\\s]+([^\\n]+(?:\\n(?![A-Z][a-z]+\\s*:)[^\\n]+)*)`, 'gi'),
        new RegExp(`(?:^|\\n)([^\\n]*${pattern}[^\\n]*)`, 'gi'),
        new RegExp(`${pattern}[^.]*?\\.`, 'gi')
      ];
      
      for (const regex of regexPatterns) {
        const match = regex.exec(cleanedText);
        if (match && match[0]) {
          // Clean up the extracted section
          let sectionContent = (match[1] || match[0]).trim();
          
          // Remove the pattern itself from the content
          patterns.forEach(p => {
            sectionContent = sectionContent.replace(new RegExp(`^${p}[:\\s]*`, 'i'), '');
          });
          
          // Remove any remaining duplicate phrases
          sectionContent = sectionContent
            .replace(/Here are the complete details on [^.]+\.\s*/gi, '')
            .replace(/Owner and founders?\s*/gi, '')
            .replace(/^\$\d+\s*$/gm, '') // Remove standalone price lines
            .trim();
          
          if (sectionContent && sectionContent.length > 10 && !sections[key]) {
            sections[key] = sectionContent;
            break;
          }
        }
      }
      if (sections[key]) break;
    }
  });
  
  // Extract specific data points with light regex
  const extractedData: Record<string, any> = {};
  
  // Try to extract structured data from the messy text
  // Owner/Founder extraction
  const ownerMatch = cleanedText.match(/(?:Juan Carlos|JC)\s*(?:\(JC\))?\s*Sanabria[^.]*(?:is the|owner)[^.]*\./i);
  if (ownerMatch) {
    structured.owner = {
      name: 'Juan Carlos (JC) Sanabria',
      role: 'Owner',
      business: cleanedText.match(/of ([^.]+?)(?:\.|$)/i)?.[1] || businessName
    };
  }
  
  // Extract social media with follower counts
  const socialRegex = /@(\w+)\s*\(?([\d,]+)?\s*followers?\)?/gi;
  let socialMatch;
  extractedData.socialMedia = {};
  while ((socialMatch = socialRegex.exec(rawText)) !== null) {
    const platform = socialMatch[1];
    const followers = socialMatch[2] ? socialMatch[2].replace(/,/g, '') : null;
    extractedData.socialMedia[platform] = followers ? parseInt(followers) : 'Active';
  }
  
  // Extract emails
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  extractedData.emails = Array.from(new Set(rawText.match(emailRegex) || []));
  
  // Extract phone numbers
  const phoneRegex = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  extractedData.phones = Array.from(new Set(rawText.match(phoneRegex) || []));
  
  // Extract dollar amounts
  const priceRegex = /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g;
  let priceMatch;
  extractedData.prices = [];
  while ((priceMatch = priceRegex.exec(rawText)) !== null) {
    extractedData.prices.push(priceMatch[0]);
  }
  
  // Extract LinkedIn URLs
  const linkedinRegex = /linkedin\.com\/(?:in|company)\/([^\s,)]+)/gi;
  extractedData.linkedinProfiles = Array.from(new Set((rawText.match(linkedinRegex) || [])));
  
  // Extract specific pricing data
  const pricingData: string[] = [];
  const priceMatches = cleanedText.match(/\$\d+(?:\.\d{2})?\s*(?:for\s+)?[^\n.]{0,50}/gi);
  if (priceMatches) {
    priceMatches.forEach(match => {
      const cleaned = match.trim();
      if (cleaned.length > 3 && !pricingData.some(p => p.includes(cleaned))) {
        pricingData.push(cleaned);
      }
    });
  }
  
  // Extract expansion/news
  const expansionMatch = cleanedText.match(/(?:expansion|hiring)[^.]*(?:new\s+location|forthcoming)[^.]*/i);
  if (expansionMatch) {
    structured.expansion = expansionMatch[0].trim();
  }
  
  // Extract booking info
  const bookingMatch = cleanedText.match(/(?:Reservations?|Booking)[^.]*(?:call|phone|directly)[^.]*/i);
  if (bookingMatch) {
    structured.booking = bookingMatch[0].trim();
  }
  
  if (pricingData.length > 0) {
    structured.pricing = pricingData;
  }
  
  return { sections, extracted: extractedData, structured };
}

// Icon mapping for different data types
const getIconForSection = (key: string) => {
  const iconMap: Record<string, any> = {
    founder: User,
    staff: Users,
    pricing: DollarSign,
    services: Package,
    social: Instagram,
    competitors: TrendingUp,
    reviews: AlertCircle,
    booking: Calendar,
    location: MapPin,
    expansion: Briefcase,
    contact: Mail,
  };
  return iconMap[key] || Building2;
};

export default function AIIntelligenceDynamic({ aiData, businessName }: AIIntelligenceDynamicProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  if (!aiData) return null;
  
  // Parse the raw AI response if available
  const rawResponse = aiData.raw_ai_response || aiData.rawResponse || '';
  const { sections, extracted, structured } = parseAIResponse(rawResponse, businessName);
  
  // Merge structured data with parsed data
  const intelligenceData = {
    ...aiData,
    ...sections,
    ...extracted,
    ...structured,
  };
  
  // Determine what data we have
  const hasOwnerInfo = intelligenceData.owner?.name || intelligenceData.founder;
  const hasStaff = intelligenceData.staff?.length || intelligenceData.staff;
  const hasSocial = Object.keys(intelligenceData.socialMedia || {}).length > 0 || intelligenceData.social_media;
  const hasPricing = intelligenceData.prices?.length || intelligenceData.pricing;
  const hasCompetitors = intelligenceData.competitors;
  const hasReviews = intelligenceData.reviews;
  const hasEmails = intelligenceData.emails?.length || intelligenceData.contacts?.emails?.length;
  const hasPhones = intelligenceData.phones?.length || intelligenceData.contacts?.phones?.length;
  
  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl p-6 backdrop-blur-sm border border-purple-500/20">
      <div 
        className="flex items-center justify-between mb-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-purple-400" />
          <h2 className="text-xl font-bold text-white">AI Business Intelligence</h2>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Owner/Founder Section */}
          {hasOwnerInfo && (
            <div className="bg-black/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-white">Leadership</h3>
              </div>
              <div className="text-sm text-gray-300 space-y-1">
                {intelligenceData.owner?.name && (
                  <p>Owner: <span className="text-white">{intelligenceData.owner.name}</span></p>
                )}
                {intelligenceData.founder && (
                  <p className="whitespace-pre-wrap">{intelligenceData.founder}</p>
                )}
                {intelligenceData.owner?.credentials && (
                  <p>Credentials: <span className="text-blue-400">{intelligenceData.owner.credentials}</span></p>
                )}
                {intelligenceData.linkedinProfiles?.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <Linkedin className="w-4 h-4 text-blue-500" />
                    {intelligenceData.linkedinProfiles.map((profile: string, i: number) => (
                      <a key={i} href={`https://${profile}`} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-400 hover:text-blue-300 text-xs">
                        View Profile
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact Information */}
          {(hasEmails || hasPhones) && (
            <div className="bg-black/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4 text-green-400" />
                <h3 className="text-sm font-semibold text-white">Contact Information</h3>
              </div>
              <div className="space-y-2">
                {(intelligenceData.emails || intelligenceData.contacts?.emails)?.map((email: string, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <Mail className="w-3 h-3 text-gray-400" />
                    <a href={`mailto:${email}`} className="text-sm text-blue-400 hover:text-blue-300">
                      {email}
                    </a>
                  </div>
                ))}
                {(intelligenceData.phones || intelligenceData.contacts?.phones)?.map((phone: string, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-gray-400" />
                    <a href={`tel:${phone}`} className="text-sm text-blue-400 hover:text-blue-300">
                      {phone}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Social Media Presence */}
          {hasSocial && (
            <div className="bg-black/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Instagram className="w-4 h-4 text-pink-400" />
                <h3 className="text-sm font-semibold text-white">Social Media Presence</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(intelligenceData.socialMedia || intelligenceData.social_media || {}).map(([platform, value]) => (
                  <div key={platform} className="flex items-center gap-2">
                    {platform.toLowerCase().includes('instagram') && <Instagram className="w-4 h-4 text-pink-500" />}
                    {platform.toLowerCase().includes('facebook') && <Facebook className="w-4 h-4 text-blue-500" />}
                    {platform.toLowerCase().includes('twitter') && <Twitter className="w-4 h-4 text-sky-400" />}
                    {platform.toLowerCase().includes('youtube') && <Youtube className="w-4 h-4 text-red-500" />}
                    <div>
                      <p className="text-xs text-gray-400 capitalize">{platform}</p>
                      <p className="text-sm text-white">
                        {typeof value === 'number' ? `${(value as number).toLocaleString()} followers` : String(value)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pricing Information */}
          {hasPricing && (
            <div className="bg-black/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                <h3 className="text-sm font-semibold text-white">Pricing & Packages</h3>
              </div>
              <div className="text-sm text-gray-300 space-y-1">
                {intelligenceData.pricing && (
                  <p className="whitespace-pre-wrap">{intelligenceData.pricing}</p>
                )}
                {intelligenceData.prices?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {intelligenceData.prices.map((price: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-green-900/30 text-green-400 rounded text-xs">
                        {price}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dynamic Sections */}
          {sections && typeof sections === 'object' && Object.entries(sections).map(([key, content]) => {
            // Skip if already displayed above or if content is too short/duplicate
            if (['founder', 'pricing', 'social'].includes(key)) return null;
            if (!content || typeof content !== 'string' || content.length < 10) return null;
            
            // Skip if content looks like duplicate/placeholder text
            if (content.includes('Here are the complete details') || 
                content === 'Owner and founders' ||
                content.length < 20) {
              return null;
            }
            
            const Icon = getIconForSection(key);
            
            return (
              <div key={key} className="bg-black/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-semibold text-white capitalize">
                    {key.replace(/_/g, ' ')}
                  </h3>
                </div>
                <div className="text-sm text-gray-300 whitespace-pre-wrap">
                  {content}
                </div>
              </div>
            );
          })}

          {/* Raw Response Fallback */}
          {rawResponse && Object.keys(sections).length === 0 && (
            <div className="bg-black/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-white">Full Intelligence Report</h3>
              </div>
              <div className="text-sm text-gray-300 whitespace-pre-wrap max-h-96 overflow-y-auto">
                {rawResponse}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}