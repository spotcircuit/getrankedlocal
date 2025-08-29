'use client';

import { motion } from 'framer-motion';
import { 
  Brain, Globe, Phone, Mail, Users, TrendingUp, 
  AlertCircle, CheckCircle, XCircle, Star, 
  Instagram, Facebook, Twitter, Linkedin,
  DollarSign, Calendar, Building, Target
} from 'lucide-react';

interface AIIntelligenceSectionProps {
  aiData: any;
  businessName: string;
}

export default function AIIntelligenceSection({ aiData, businessName }: AIIntelligenceSectionProps) {
  if (!aiData || Object.keys(aiData).length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
            <Brain className="inline-block w-10 h-10 text-purple-400 mr-3" />
            AI <span className="text-purple-400">Deep Intelligence</span>
          </h2>
          <p className="text-center text-gray-400 mb-12 text-lg">
            Advanced insights discovered about {businessName}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Business Intel */}
          {aiData.business_intel && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700"
            >
              <Building className="w-8 h-8 text-blue-400 mb-3" />
              <h3 className="text-xl font-bold text-white mb-4">Business Intelligence</h3>
              <div className="space-y-3">
                {aiData.business_intel.founded && (
                  <div>
                    <span className="text-gray-400 text-sm">Founded</span>
                    <p className="text-white font-semibold">{aiData.business_intel.founded}</p>
                  </div>
                )}
                {aiData.business_intel.employee_count && (
                  <div>
                    <span className="text-gray-400 text-sm">Team Size</span>
                    <p className="text-white font-semibold">{aiData.business_intel.employee_count} employees</p>
                  </div>
                )}
                {aiData.business_intel.expanding !== undefined && (
                  <div className="flex items-center gap-2">
                    {aiData.business_intel.expanding ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-500" />
                    )}
                    <span className="text-white">
                      {aiData.business_intel.expanding ? 'Currently Expanding' : 'Stable Operations'}
                    </span>
                  </div>
                )}
                {aiData.business_intel.hiring !== undefined && (
                  <div className="flex items-center gap-2">
                    {aiData.business_intel.hiring ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-500" />
                    )}
                    <span className="text-white">
                      {aiData.business_intel.hiring ? 'Actively Hiring' : 'Not Hiring'}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Contact Information */}
          {aiData.contacts && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700"
            >
              <Phone className="w-8 h-8 text-green-400 mb-3" />
              <h3 className="text-xl font-bold text-white mb-4">Contact Intelligence</h3>
              <div className="space-y-3">
                {aiData.contacts.emails && aiData.contacts.emails.length > 0 && (
                  <div>
                    <span className="text-gray-400 text-sm flex items-center gap-1">
                      <Mail className="w-4 h-4" /> Primary Email
                    </span>
                    <p className="text-white font-semibold">{aiData.contacts.emails[0]}</p>
                  </div>
                )}
                {aiData.contacts.phones && aiData.contacts.phones.length > 0 && (
                  <div>
                    <span className="text-gray-400 text-sm flex items-center gap-1">
                      <Phone className="w-4 h-4" /> Primary Phone
                    </span>
                    <p className="text-white font-semibold">{aiData.contacts.phones[0]}</p>
                  </div>
                )}
                {aiData.domain && (
                  <div>
                    <span className="text-gray-400 text-sm flex items-center gap-1">
                      <Globe className="w-4 h-4" /> Website
                    </span>
                    <p className="text-white font-semibold">{aiData.domain}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Social Media Presence */}
          {aiData.social_media && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700"
            >
              <Users className="w-8 h-8 text-purple-400 mb-3" />
              <h3 className="text-xl font-bold text-white mb-4">Social Media Presence</h3>
              <div className="space-y-3">
                {Object.entries(aiData.social_media).map(([platform, data]: [string, any]) => {
                  const icons: any = {
                    instagram: Instagram,
                    facebook: Facebook,
                    twitter: Twitter,
                    linkedin: Linkedin
                  };
                  const Icon = icons[platform.toLowerCase()] || Globe;
                  
                  return (
                    <div key={platform} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5 text-gray-400" />
                        <span className="text-white capitalize">{platform}</span>
                      </div>
                      {typeof data === 'object' && data.followers && (
                        <span className="text-purple-400 font-semibold">
                          {data.followers.toLocaleString()} followers
                        </span>
                      )}
                      {typeof data === 'string' && (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Review Insights */}
          {aiData.review_insights && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700"
            >
              <Star className="w-8 h-8 text-yellow-400 mb-3" />
              <h3 className="text-xl font-bold text-white mb-4">Review Analysis</h3>
              <div className="space-y-4">
                {aiData.review_insights.positive_themes && aiData.review_insights.positive_themes.length > 0 && (
                  <div>
                    <span className="text-green-400 text-sm font-semibold mb-2 block">Strengths</span>
                    <div className="space-y-1">
                      {aiData.review_insights.positive_themes.slice(0, 3).map((theme: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span className="text-gray-300 text-sm">{theme}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {aiData.review_insights.negative_themes && aiData.review_insights.negative_themes.length > 0 && (
                  <div>
                    <span className="text-red-400 text-sm font-semibold mb-2 block">Areas to Improve</span>
                    <div className="space-y-1">
                      {aiData.review_insights.negative_themes.slice(0, 3).map((theme: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <span className="text-gray-300 text-sm">{theme}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Pricing Information */}
          {aiData.pricing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700"
            >
              <DollarSign className="w-8 h-8 text-green-400 mb-3" />
              <h3 className="text-xl font-bold text-white mb-4">Pricing Intelligence</h3>
              <div className="space-y-3">
                {aiData.pricing.membership && (
                  <div>
                    <span className="text-gray-400 text-sm">Membership</span>
                    <p className="text-green-400 font-bold text-lg">{aiData.pricing.membership}</p>
                  </div>
                )}
                {aiData.pricing.services && (
                  <div>
                    <span className="text-gray-400 text-sm">Popular Services</span>
                    <div className="mt-2 space-y-1">
                      {Object.entries(aiData.pricing.services).slice(0, 3).map(([service, price]) => (
                        <div key={service} className="flex justify-between text-sm">
                          <span className="text-gray-300">{service}</span>
                          <span className="text-white font-semibold">{String(price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Key Personnel */}
          {(aiData.medical_director || aiData.owner) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700"
            >
              <Users className="w-8 h-8 text-blue-400 mb-3" />
              <h3 className="text-xl font-bold text-white mb-4">Key Personnel</h3>
              <div className="space-y-3">
                {aiData.medical_director?.name && (
                  <div>
                    <span className="text-gray-400 text-sm">Medical Director</span>
                    <p className="text-white font-semibold">{aiData.medical_director.name}</p>
                    {aiData.medical_director.credentials && (
                      <p className="text-gray-400 text-sm">{aiData.medical_director.credentials}</p>
                    )}
                  </div>
                )}
                {aiData.owner?.name && (
                  <div>
                    <span className="text-gray-400 text-sm">Owner</span>
                    <p className="text-white font-semibold">{aiData.owner.name}</p>
                    {aiData.owner.role && (
                      <p className="text-gray-400 text-sm">{aiData.owner.role}</p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Strategic Recommendations */}
        {aiData.recommendations && aiData.recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            viewport={{ once: true }}
            className="mt-8 bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-xl p-8 border border-purple-700/50"
          >
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-8 h-8 text-purple-400" />
              <h3 className="text-2xl font-bold text-white">AI-Powered Recommendations</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {aiData.recommendations.slice(0, 4).map((rec: string, idx: number) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <span className="text-purple-400 font-bold text-sm">{idx + 1}</span>
                  </div>
                  <p className="text-gray-300">{rec}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}