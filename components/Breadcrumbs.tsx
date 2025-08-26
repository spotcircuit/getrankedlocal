'use client';

import Link from 'next/link';
import { ChevronRight, Home, MapPin, Building2, Briefcase } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: React.ElementType;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  // Add home to the beginning if not present
  const allItems = items[0]?.label !== 'Home' 
    ? [{ label: 'Home', href: '/', icon: Home }, ...items]
    : items;

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-4">
      <div className="max-w-6xl mx-auto">
        <ol className="flex items-center space-x-2 text-sm">
          {allItems.map((item, index) => {
            const Icon = item.icon;
            const isLast = index === allItems.length - 1;
            
            return (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="w-4 h-4 text-gray-500 mx-2" />
                )}
                {isLast ? (
                  <span className="flex items-center gap-2 text-white font-semibold">
                    {Icon && <Icon className="w-4 h-4" />}
                    {item.label}
                  </span>
                ) : (
                  <Link 
                    href={item.href}
                    className="flex items-center gap-2 text-gray-400 hover:text-purple-400 transition-colors"
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}