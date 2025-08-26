'use client';

import { motion } from 'framer-motion';
import { Star, Quote, TrendingUp, Award, Users, BarChart3 } from 'lucide-react';

export default function SocialProof() {
  const testimonials = [
    {
      name: "Medical Director",
      business: "The Fix Clinic",
      location: "Ashburn, VA",
      rating: 5,
      quote: "Significantly improved our rankings in under 90 days. Our call volume increased substantially while reducing our cost per lead. Excellent return on investment!",
      metric: "High ROI",
      image: "FC"
    },
    {
      name: "Practice Owner",
      business: "Contours Concierge",
      location: "Northern Virginia",
      rating: 5,
      quote: "As a mobile concierge aesthetics service, we needed to dominate multiple cities. Now we're #1 across Northern VA and booked solid for weeks in advance.",
      metric: "+$120K/mo",
      image: "CC"
    },
    {
      name: "Clinic Director",
      business: "Elite Wellness Center",
      location: "Ashburn, VA",
      rating: 5,
      quote: "The reputation management and AI optimization completely transformed our online presence. We went from invisible to the most recommended clinic in the area.",
      metric: "3x bookings",
      image: "EW"
    }
  ];

  const stats = [
    { number: "500+", label: "Businesses Ranked #1", icon: Trophy },
    { number: "3.2x", label: "Average ROI", icon: TrendingUp },
    { number: "92%", label: "Client Retention", icon: Users },
    { number: "60%", label: "Traffic Increase", icon: BarChart3 }
  ];

  return (
    <section className="py-20 px-6 bg-black">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Join <span className="text-yellow-400 font-bold">500+ Winners</span>
          </h2>
          <p className="text-xl text-gray-400">
            Real results from businesses just like yours
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 relative"
            >
              <Quote className="absolute top-4 right-4 w-8 h-8 text-purple-500/20" />
              
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {testimonial.image}
                </div>
                <div>
                  <h4 className="font-bold">{testimonial.name}</h4>
                  <p className="text-sm text-gray-400">{testimonial.business}</p>
                  <p className="text-xs text-gray-500">{testimonial.location}</p>
                </div>
              </div>
              
              <div className="flex gap-1 mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                ))}
              </div>
              
              <p className="text-gray-300 mb-4 italic">"{testimonial.quote}"</p>
              
              <div className="pt-4 border-t border-gray-700">
                <span className="text-2xl font-bold text-green-400">{testimonial.metric}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="text-center">
                <Icon className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white">{stat.number}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            );
          })}
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-gray-700 rounded-xl p-8"
        >
          <h3 className="text-xl font-bold text-center mb-6">Trusted By Industry Leaders</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center">
            <div className="text-center">
              <Award className="w-10 h-10 text-yellow-500 mx-auto mb-2" />
              <p className="text-sm font-semibold">Google Partner</p>
              <p className="text-xs text-gray-500">Certified Since 2019</p>
            </div>
            <div className="text-center">
              <Award className="w-10 h-10 text-blue-500 mx-auto mb-2" />
              <p className="text-sm font-semibold">Meta Partner</p>
              <p className="text-xs text-gray-500">Advanced Tier</p>
            </div>
            <div className="text-center">
              <Award className="w-10 h-10 text-purple-500 mx-auto mb-2" />
              <p className="text-sm font-semibold">SEO Excellence</p>
              <p className="text-xs text-gray-500">2024 Winner</p>
            </div>
            <div className="text-center">
              <Award className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-semibold">5-Star Rated</p>
              <p className="text-xs text-gray-500">100+ Reviews</p>
            </div>
          </div>
        </motion.div>

        {/* Case Study CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-gray-400 mb-4">
            Want to see detailed case studies from your industry?
          </p>
          <a 
            href="/Med_Spa_Case_Studies_90_Days.pdf"
            download="Med_Spa_Case_Studies_90_Days.pdf"
            className="inline-block px-6 py-3 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 rounded-lg font-semibold transition-colors"
          >
            Download Case Studies PDF
          </a>
        </motion.div>
      </div>
    </section>
  );
}

function Trophy() {
  return (
    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v1a1 1 0 001 1h1V5a3 3 0 016 0v2h1a1 1 0 001-1V5a2 2 0 00-2-2H5zm6 4V5a1 1 0 10-2 0v2H7.5A2.5 2.5 0 005 9.5V10a3 3 0 003 3v2a2 2 0 104 0v-2a3 3 0 003-3v-.5A2.5 2.5 0 0012.5 7H11z" clipRule="evenodd" />
    </svg>
  );
}