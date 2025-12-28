'use client';

import React, { useState } from 'react';
import { Github, Linkedin, Mail, ArrowRight, Sun, Moon, Instagram, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/theme-context';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { CourseConnectLogo } from '@/components/icons/courseconnect-logo';
import Link from 'next/link';

const footerLinks = {
  product: [
    { name: 'Features', href: '/features' },
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ],
  resources: [
    // { name: 'Changelog', href: '/changelog' }, // Hidden
    // { name: 'Blog', href: '/blog' },
  ],
};

// Simple X (Twitter) logo
const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path
      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      fill="currentColor"
    />
  </svg>
);

const socialLinks = [
  { 
    name: 'GitHub', 
    icon: Github,
    href: 'https://github.com/courseconnect'
  },
  { 
    name: 'X', 
    icon: XIcon,
    href: 'https://twitter.com/courseconnect'
  },
  { 
    name: 'LinkedIn', 
    icon: Linkedin,
    href: 'https://www.linkedin.com/company/courseconnect-ai/'
  },
  { 
    name: 'Instagram', 
    icon: Instagram,
    href: 'https://instagram.com/courseconnect'
  },
];

export function Footer() {
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('🎉 Successfully Subscribed!', {
          description: 'Check your email for a welcome message!',
          duration: 5000,
        });
        setEmail('');
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        toast.error('Subscription Failed', {
          description: data.error || 'Please try again later.',
          duration: 4000,
        });
      }
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to subscribe. Please try again.',
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-white text-slate-900 dark:bg-gray-950 dark:text-slate-200 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
          
          {/* Brand Section */}
          <div className="lg:col-span-4 space-y-6">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <div className="w-10 h-10 relative transition-transform group-hover:scale-110 duration-300">
                <CourseConnectLogo className="w-full h-full object-contain" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                CourseConnect <span className="text-blue-600 dark:text-blue-500">AI</span>
              </span>
            </Link>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-sm">
              Get instant AI help, analyze your syllabus, and ace your courses with personalized study tools tailored to your curriculum.
            </p>
            <div className="flex items-center gap-4 pt-2">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                  aria-label={`Follow us on ${social.name}`}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Grid */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm uppercase tracking-wider">Product</h3>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-sm text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm uppercase tracking-wider">Company</h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-sm text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Newsletter & Bottom */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-sm text-slate-500 dark:text-slate-500">
              © {new Date().getFullYear()} CourseConnect <span className="text-blue-600 dark:text-blue-500">AI</span>. All rights reserved.
            </p>
            
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 px-0 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-500">
                <span>Made with</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-red-500 animate-pulse">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                </svg>
                <span>for students</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
