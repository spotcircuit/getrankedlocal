'use client';

import Image from 'next/image';

export default function SocialProofImage() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="relative w-full">
          <Image
            src="/social-proof.webp"
            alt="Success stories across industries - 500+ Businesses Dominating Their Markets"
            width={1200}
            height={1000}
            loading="lazy"
            className="rounded-xl shadow-2xl w-full h-auto object-contain"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>
      </div>
    </section>
  );
}