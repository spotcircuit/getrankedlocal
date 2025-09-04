'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ChevronRight, MapPin, Phone, Globe, Star, TrendingUp, Building2, 
  Users, Award, Clock, CheckCircle, ArrowRight, Activity, ExternalLink,
  BarChart3, Target, Zap, Shield, Search
} from 'lucide-react';

export default function BusinessDetailPage() {
  const params = useParams<{ state: string; city: string; niche: string; company: string }>();
  const searchParams = useSearchParams();
  const [businessData, setBusinessData] = useState<any>(null);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Decode parameters - matching the URL structure /state/city/niche/company
  const state = (params?.state || '').toString().toUpperCase();
  const city = decodeURIComponent((params?.city || '').toString()).replace(/-/g, ' ');
  const niche = decodeURIComponent((params?.niche || '').toString()).replace(/-/g, ' ');
  const company = decodeURIComponent((params?.company || '').toString()).replace(/-/g, ' ');
  const businessId = searchParams?.get('id');

  // Format display names
  const cityDisplay = city.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const nicheDisplay = niche === 'medspas' ? 'Medical Spas' :
                       niche === 'med spas' ? 'Medical Spas' :
                       niche === 'dentists' ? 'Dental Practices' :
                       niche === 'lawfirms' ? 'Law Firms' :
                       niche === 'law firms' ? 'Law Firms' :
                       niche === 'homeservices' ? 'Home Services' :
                       niche === 'home services' ? 'Home Services' :
                       niche === 'marketing agencies' ? 'Marketing Agencies' :
                       niche.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        setLoading(true);
        
        // Call analyze API - use ID if available, otherwise use name
        const analyzeUrl = businessId 
          ? `/api/analyze?id=${businessId}`
          : `/api/analyze?name=${encodeURIComponent(company)}&city=${encodeURIComponent(city)}&state=${state}&niche=${encodeURIComponent(niche)}`;
        console.log('Fetching analysis:', analyzeUrl);
        
        const analyzeResponse = await fetch(analyzeUrl);
        
        if (analyzeResponse.ok) {
          const data = await analyzeResponse.json();
          console.log('Analysis Data:', data);
          
          setBusinessData(data.business || { name: company });
          setAnalysis(data.analysis || {});
          setCompetitors(data.analysis?.competitors || []);
        }
        
      } catch (err) {
        console.error('Error fetching business data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessData();
  }, [company, city, state, niche]);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} className="w-5 h-5 fill-yellow-400/50 text-yellow-400" />);
      } else {
        stars.push(<Star key={i} className="w-5 h-5 text-gray-600" />);
      }
    }
    return stars;
  };

  const formatPhone = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex flex-col min-h-screen">
          <main className="flex-grow bg-gradient-to-b from-gray-900 to-black text-white">
            <div className="max-w-7xl mx-auto px-4 py-8">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="h-6 bg-gray-700 rounded w-3/4 mb-8"></div>
                <div className="space-y-4">
                  <div className="h-32 bg-gray-700 rounded"></div>
                  <div className="h-32 bg-gray-700 rounded"></div>
                </div>
              </div>
            </div>
          </main>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow bg-gradient-to-b from-gray-900 to-black text-white">
          {/* Breadcrumbs */}
          <div className="bg-gray-900/50 border-b border-gray-800">
            <div className="max-w-7xl mx-auto px-4 py-3">
              <nav className="flex items-center space-x-2 text-sm">
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                  Home
                </Link>
                <ChevronRight className="w-4 h-4 text-gray-600" />
                <Link href={`/${state.toLowerCase()}`} className="text-gray-400 hover:text-white transition-colors">
                  {state}
                </Link>
                <ChevronRight className="w-4 h-4 text-gray-600" />
                <Link href={`/${state.toLowerCase()}/${city.toLowerCase().replace(/\s+/g, '-')}`} className="text-gray-400 hover:text-white transition-colors">
                  {cityDisplay}
                </Link>
                <ChevronRight className="w-4 h-4 text-gray-600" />
                <Link href={`/${state.toLowerCase()}/${city.toLowerCase().replace(/\s+/g, '-')}/${niche.toLowerCase().replace(/\s+/g, '-')}`} className="text-gray-400 hover:text-white transition-colors">
                  {nicheDisplay}
                </Link>
                <ChevronRight className="w-4 h-4 text-gray-600" />
                <span className="text-white font-medium">{businessData?.name || company}</span>
              </nav>
            </div>
          </div>

          {/* Hero Section */}
          <section className="py-16 px-4 sm:px-6 bg-gradient-to-b from-gray-900/50 to-black">
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                {/* Business Header */}
                <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-gray-700 rounded-2xl p-8 mb-8">
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <h1 className="text-4xl md:text-5xl font-bold text-white">
                          {businessData?.name || company}
                        </h1>
                        {analysis?.currentRank && analysis.currentRank <= 3 && (
                          <div className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full">
                            <Award className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm font-medium text-yellow-400">Top Rated</span>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-xl text-gray-300 mb-6">
                        {nicheDisplay} in {cityDisplay}, {state}
                      </p>

                      {/* Rating */}
                      {businessData?.rating ? (
                        <div className="flex items-center gap-4 mb-6">
                          <div className="flex items-center gap-2">
                            {renderStars(businessData.rating)}
                            <span className="text-2xl font-bold text-white ml-2">
                              {businessData.rating.toFixed(1)}
                            </span>
                          </div>
                          <span className="text-gray-400">
                            ({businessData.reviewCount || 0} reviews)
                          </span>
                        </div>
                      ) : (
                        <p className="text-gray-500 mb-6">No ratings yet</p>
                      )}

                      {/* Contact Info */}
                      <div className="space-y-3">
                        {businessData?.address && (
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-purple-400 mt-1" />
                            <div>
                              <p className="text-white">{businessData.address}</p>
                              <a 
                                href={`https://maps.google.com/?q=${encodeURIComponent(businessData.address)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-400 hover:text-purple-300 text-sm inline-flex items-center gap-1 mt-1"
                              >
                                View on Map <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        )}

                        {businessData?.phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-purple-400" />
                            <a 
                              href={`tel:${businessData.phone}`}
                              className="text-white hover:text-purple-300 transition-colors"
                            >
                              {formatPhone(businessData.phone)}
                            </a>
                          </div>
                        )}

                        {businessData?.website && (
                          <div className="flex items-center gap-3">
                            <Globe className="w-5 h-5 text-purple-400" />
                            <a 
                              href={businessData.website.startsWith('http') ? businessData.website : `https://${businessData.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-white hover:text-purple-300 transition-colors inline-flex items-center gap-1"
                            >
                              Visit Website <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rank Card */}
                    <div className="lg:w-80">
                      <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-purple-500/30 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-purple-400" />
                          Market Position
                        </h3>
                        
                        <div className="space-y-4">
                          {analysis?.currentRank && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300">Current Rank</span>
                              <div className="flex items-center gap-2">
                                <span className="text-3xl font-bold text-white">#{analysis.currentRank}</span>
                                {analysis.currentRank <= 3 && (
                                  <Trophy className="w-6 h-6 text-yellow-400" />
                                )}
                              </div>
                            </div>
                          )}

                          {analysis?.potentialTraffic && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300">Traffic Potential</span>
                              <span className="text-xl font-semibold text-green-400">
                                +{analysis.potentialTraffic}
                              </span>
                            </div>
                          )}

                          {analysis?.reviewDeficit !== undefined && analysis.reviewDeficit > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300">Review Gap</span>
                              <span className="text-xl font-semibold text-orange-400">
                                -{analysis.reviewDeficit}
                              </span>
                            </div>
                          )}

                          <div className="pt-4 border-t border-gray-700">
                            <Link
                              href="/"
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white font-semibold hover:scale-105 transition-transform"
                            >
                              <Target className="w-5 h-5" />
                              Get Full Analysis
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                  {[
                    { 
                      label: 'Market Rank',
                      value: analysis?.currentRank ? `#${analysis.currentRank}` : 'N/A',
                      icon: <TrendingUp className="w-5 h-5" />,
                      color: 'from-purple-500 to-blue-500'
                    },
                    { 
                      label: 'Rating',
                      value: businessData?.rating ? businessData.rating.toFixed(1) : 'N/A',
                      icon: <Star className="w-5 h-5" />,
                      color: 'from-yellow-500 to-orange-500'
                    },
                    { 
                      label: 'Reviews',
                      value: businessData?.reviewCount || '0',
                      icon: <Users className="w-5 h-5" />,
                      color: 'from-green-500 to-teal-500'
                    },
                    { 
                      label: 'Competitors',
                      value: competitors.length || '0',
                      icon: <Building2 className="w-5 h-5" />,
                      color: 'from-red-500 to-pink-500'
                    }
                  ].map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative group"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} rounded-xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity`} />
                      <div className="relative bg-gray-900/90 border border-gray-700 rounded-xl p-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-gray-400 mb-2">
                          {stat.icon}
                          <span className="text-sm">{stat.label}</span>
                        </div>
                        <div className="text-2xl font-bold text-white">
                          {stat.value}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </section>

          {/* Competitors Section */}
          {competitors.length > 0 && (
            <section className="py-16 px-4 sm:px-6 bg-gray-900/30">
              <div className="max-w-7xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                    <Building2 className="w-8 h-8 text-purple-400" />
                    Top Competitors in {cityDisplay}
                  </h2>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {competitors.slice(0, 6).map((competitor, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        viewport={{ once: true }}
                        className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-xl p-6 hover:border-purple-500/50 transition-all"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-white mb-1">
                              {competitor.name}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-purple-400 font-medium">
                                Rank #{competitor.rank}
                              </span>
                              {competitor.rank <= 3 && (
                                <Award className="w-4 h-4 text-yellow-400" />
                              )}
                            </div>
                          </div>
                        </div>

                        {competitor.rating > 0 && (
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex">
                              {renderStars(competitor.rating)}
                            </div>
                            <span className="text-white font-semibold">
                              {competitor.rating.toFixed(1)}
                            </span>
                            <span className="text-gray-400 text-sm">
                              ({competitor.reviews} reviews)
                            </span>
                          </div>
                        )}

                        {competitor.advantages && competitor.advantages.length > 0 && (
                          <div className="space-y-2 mb-4">
                            {competitor.advantages.slice(0, 2).map((advantage: string, i: number) => (
                              <div key={i} className="flex items-center gap-2 text-sm">
                                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                                <span className="text-gray-300">{advantage}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2">
                          {competitor.phone && (
                            <a
                              href={`tel:${competitor.phone}`}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600/20 border border-green-600/30 rounded-lg text-green-400 text-sm font-medium hover:bg-green-600/30 transition-colors"
                            >
                              <Phone className="w-4 h-4" />
                              Call
                            </a>
                          )}
                          {competitor.website && (
                            <a
                              href={competitor.website.startsWith('http') ? competitor.website : `https://${competitor.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600/20 border border-blue-600/30 rounded-lg text-blue-400 text-sm font-medium hover:bg-blue-600/30 transition-colors"
                            >
                              <Globe className="w-4 h-4" />
                              Visit
                            </a>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </section>
          )}

          {/* Market Insights */}
          {analysis && (
            <section className="py-16 px-4 sm:px-6">
              <div className="max-w-7xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                    <Activity className="w-8 h-8 text-purple-400" />
                    Market Insights
                  </h2>

                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Pain Points */}
                    {analysis.painPoints && analysis.painPoints.length > 0 && (
                      <div className="bg-gradient-to-br from-red-900/20 to-red-800/20 border border-red-500/30 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <Shield className="w-5 h-5 text-red-400" />
                          Key Challenges
                        </h3>
                        <ul className="space-y-2">
                          {analysis.painPoints.slice(0, 3).map((point: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                              <span className="text-red-400 mt-1">•</span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Solutions */}
                    {analysis.solutions && analysis.solutions.length > 0 && (
                      <div className="bg-gradient-to-br from-green-900/20 to-green-800/20 border border-green-500/30 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <Zap className="w-5 h-5 text-green-400" />
                          Recommended Solutions
                        </h3>
                        <ul className="space-y-2">
                          {analysis.solutions.slice(0, 3).map((solution: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                              <span className="text-green-400 mt-1">✓</span>
                              {solution}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Timeline */}
                    <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-400" />
                        Timeline & Urgency
                      </h3>
                      {analysis.timeline && (
                        <p className="text-white font-medium mb-2">{analysis.timeline}</p>
                      )}
                      {analysis.urgency && (
                        <p className="text-sm text-gray-300">{analysis.urgency}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            </section>
          )}

          {/* CTA Section */}
          <section className="py-16 px-4 sm:px-6 bg-gradient-to-b from-black to-gray-900">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl blur-3xl" />
                <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-12">
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                    Ready to Dominate Your Local Market?
                  </h2>
                  <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                    Get a comprehensive competitive analysis and custom growth strategy to outrank 
                    your competition in {cityDisplay}.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      href="/"
                      className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white font-bold text-lg hover:scale-105 transition-transform"
                    >
                      <Search className="w-6 h-6" />
                      Analyze Your Business
                    </Link>
                    <a
                      href="tel:+1234567890"
                      className="inline-flex items-center gap-2 px-8 py-4 bg-gray-800 border border-gray-600 rounded-xl text-white font-bold text-lg hover:bg-gray-700 transition-colors"
                    >
                      <Phone className="w-6 h-6" />
                      Call for Consultation
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
        </main>
      </div>
      <Footer />
    </>
  );
}

// Add Trophy icon component
function Trophy({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}