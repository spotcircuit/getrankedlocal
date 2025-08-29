'use client';

import { motion } from 'framer-motion';
import { 
  User, Mail, Phone, Globe, Instagram, Facebook, Twitter, Youtube, 
  Calendar, Users, MapPin, CreditCard, TrendingUp, Award, Briefcase,
  DollarSign, Star, AlertCircle, ChevronRight, Building, Hash,
  BookOpen, Target, Activity, Brain, Settings
} from 'lucide-react';

interface AIIntelligenceSectionProps {
  aiData: any;
  businessName: string;
}

export default function AIIntelligenceSection({ aiData, businessName }: AIIntelligenceSectionProps) {
  // Log for debugging
  console.log('=== AI INTELLIGENCE SECTION ===');
  console.log('Full AI Data:', JSON.stringify(aiData, null, 2));
  
  if (!aiData || Object.keys(aiData).length === 0) {
    return null;
  }

  // Parse the data structure
  const owner = aiData.owner || {};
  const contacts = aiData.contacts || {};
  const pricing = aiData.pricing || {};
  const socialMedia = aiData.social_media || {};
  const competitors = aiData.competitors || [];
  const reviewInsights = aiData.review_insights || {};
  const businessIntel = aiData.business_intel || {};
  const technology = aiData.technology || {};
  const staff = aiData.staff || [];
  const medicalDirector = aiData.medical_director || {};
  const services = aiData.services || [];
  const industry = aiData.industry || null;

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 flex items-center justify-center flex-wrap">
            <Brain className="inline-block w-10 h-10 md:w-12 md:h-12 text-purple-400 mr-3" />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI Intelligence Report
            </span>
          </h2>
          <p className="text-lg md:text-xl text-gray-400">Deep insights extracted from AI analysis</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Owner/Founder Card */}
          {(owner.name || owner.names) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <User className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Ownership</h3>
              </div>
              <div className="space-y-2">
                {owner.names ? (
                  owner.names.map((name: string, idx: number) => (
                    <p key={idx} className="text-gray-300">
                      <span className="text-gray-500">Co-Owner:</span> {name}
                    </p>
                  ))
                ) : owner.name ? (
                  <p className="text-gray-300">
                    <span className="text-gray-500">Owner:</span> {owner.name}
                  </p>
                ) : null}
                {owner.credentials && (
                  <p className="text-gray-300">
                    <span className="text-gray-500">Credentials:</span> {owner.credentials}
                  </p>
                )}
                {owner.linkedin && (
                  <p className="text-gray-300">
                    <span className="text-gray-500">LinkedIn:</span> 
                    <span className="text-blue-400 ml-2">{owner.linkedin}</span>
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Services & Industry Card */}
          {(services.length > 0 || industry) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <Settings className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Services & Industry</h3>
              </div>
              <div className="space-y-3">
                {industry && (
                  <div className="mb-3 pb-3 border-b border-gray-700">
                    <p className="text-gray-400 text-xs uppercase mb-1">Industry</p>
                    <p className="text-indigo-400 font-semibold">{industry}</p>
                  </div>
                )}
                {services.length > 0 && (
                  <div>
                    <p className="text-gray-400 text-xs uppercase mb-2">Services Offered</p>
                    <div className="space-y-1">
                      {services.slice(0, 5).map((service: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2">
                          <ChevronRight className="w-3 h-3 text-indigo-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300 text-sm">{service}</span>
                        </div>
                      ))}
                      {services.length > 5 && (
                        <p className="text-gray-500 text-xs italic">+{services.length - 5} more services</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Contact Information */}
          {(contacts.emails?.length > 0 || contacts.phones?.length > 0) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Mail className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Contact Info</h3>
              </div>
              <div className="space-y-3">
                {contacts.emails?.slice(0, 2).map((email: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <p className="text-gray-300 text-sm break-all">{email}</p>
                  </div>
                ))}
                {contacts.phones?.slice(0, 2).map((phone: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <p className="text-gray-300 text-sm">{phone}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Pricing Information */}
          {Object.keys(pricing).length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Service Pricing</h3>
              </div>
              <div className="space-y-2">
                {Object.entries(pricing).slice(0, 5).map(([service, price]) => (
                  <div key={service} className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm capitalize">
                      {service.replace(/_/g, ' ')}:
                    </span>
                    <span className="text-green-400 font-semibold">{String(price)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Social Media Presence */}
          {Object.keys(socialMedia).length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-pink-500/20 rounded-lg">
                  <Hash className="w-5 h-5 text-pink-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Social Media</h3>
              </div>
              <div className="space-y-3">
                {Object.entries(socialMedia).map(([platform, data]: [string, any]) => {
                  const IconMap: any = {
                    instagram: Instagram,
                    facebook: Facebook,
                    twitter: Twitter,
                    youtube: Youtube,
                    tiktok: Activity
                  };
                  const Icon = IconMap[platform] || Globe;
                  
                  return (
                    <div key={platform} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300 capitalize">{platform}</span>
                      </div>
                      <div className="text-right">
                        {data.handle ? (
                          <span className="text-blue-400 text-sm">@{data.handle}</span>
                        ) : data.status ? (
                          <span className="text-gray-500 text-xs">{data.status}</span>
                        ) : null}
                        {data.followers && (
                          <span className="text-gray-400 text-xs ml-2">
                            {data.followers} followers
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Technology Stack */}
          {technology.booking_platform && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Technology</h3>
              </div>
              <div className="space-y-2">
                <p className="text-gray-300">
                  <span className="text-gray-500">Booking Platform:</span>{' '}
                  <span className="text-cyan-400 font-semibold">{technology.booking_platform}</span>
                </p>
              </div>
            </motion.div>
          )}

          {/* Business Intelligence */}
          {Object.keys(businessIntel).length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Business Intel</h3>
              </div>
              <div className="space-y-2">
                {businessIntel.expanding && (
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-green-400" />
                    <span className="text-green-400">Currently Expanding</span>
                  </div>
                )}
                {businessIntel.hiring && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-400">Actively Hiring</span>
                  </div>
                )}
                {businessIntel.founded && (
                  <p className="text-gray-300">
                    <span className="text-gray-500">Founded:</span> {businessIntel.founded}
                  </p>
                )}
                {businessIntel.employees && (
                  <p className="text-gray-300">
                    <span className="text-gray-500">Employees:</span> {businessIntel.employees}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Top Competitors */}
          {competitors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <Target className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Top Competitors</h3>
              </div>
              <div className="space-y-2">
                {competitors.slice(0, 3).map((competitor: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-red-400 font-bold">#{idx + 1}</span>
                    <span className="text-gray-300">{competitor}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Review Insights */}
          {reviewInsights.negative_themes?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Review Themes</h3>
              </div>
              <div className="space-y-2">
                {reviewInsights.negative_themes.slice(0, 3).map((theme: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <AlertCircle className="w-3 h-3 text-yellow-400" />
                    <span className="text-gray-300 text-sm capitalize">{theme}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Staff/Team */}
          {staff.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Team Members</h3>
              </div>
              <div className="space-y-2">
                {staff.slice(0, 4).map((member: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2">
                    <User className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-300 text-sm">{member}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Medical Director (if applicable) */}
          {medicalDirector.name && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <Award className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Medical Director</h3>
              </div>
              <div className="space-y-2">
                <p className="text-gray-300">
                  Dr. {medicalDirector.name}
                  {medicalDirector.credentials && (
                    <span className="text-indigo-400 ml-2">{medicalDirector.credentials}</span>
                  )}
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Raw AI Response for debugging (hidden by default) */}
        {aiData.raw_ai_response && (
          <details className="mt-8">
            <summary className="cursor-pointer text-gray-500 hover:text-gray-300 transition-colors">
              View Raw AI Response (Debug)
            </summary>
            <pre className="mt-4 p-4 bg-gray-900 rounded-lg overflow-x-auto text-xs text-gray-400">
              {aiData.raw_ai_response}
            </pre>
          </details>
        )}
      </div>
    </section>
  );
}