"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Upload, 
  GraduationCap,
  Mail,
  Sparkles,
  BookOpen,
  Github,
  Twitter,
  Linkedin,
  Instagram,
  History,
  Sun,
  Moon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { CourseConnectLogo } from "@/components/icons/courseconnect-logo";
import { useTheme } from "@/contexts/theme-context";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import confetti from 'canvas-confetti';

const quickLinks = [
  { name: "Dashboard", href: "/dashboard", icon: <GraduationCap className="h-4 w-4" /> },
  { name: "Upload Syllabus", href: "/dashboard/upload", icon: <Upload className="h-4 w-4" /> },
  { name: "Study Groups", href: "/dashboard/chat", icon: <Users className="h-4 w-4" /> },
  { name: "Flashcards", href: "/dashboard/flashcards", icon: <BookOpen className="h-4 w-4" /> },
  { name: "Advanced Features", href: "/dashboard/advanced", icon: <Sparkles className="h-4 w-4" /> }
];

const companyLinks = [
  { name: "About Us", href: "/about" },
  { name: "Features", href: "/features" },
  { name: "Contact", href: "/contact" },
  { name: "Site Updates & Changelog", href: "/changelog", icon: <History className="h-4 w-4" /> }
];

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
  { name: "GitHub", href: "https://github.com/courseconnect", icon: Github },
  { name: "X", href: "https://twitter.com/courseconnect", icon: XIcon },
  { name: "LinkedIn", href: "https://linkedin.com/company/courseconnect", icon: Linkedin },
  { name: "Instagram", href: "https://instagram.com/courseconnect", icon: Instagram }
];

export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmittingEmail(true);
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Successfully Subscribed!",
          description: data.emailSent 
            ? "Check your email for a welcome message!" 
            : "You're now subscribed! Welcome email sent.",
        });
        setEmail('');
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        toast({
          variant: "destructive",
          title: "Subscription Failed",
          description: data.error || "Please try again later.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to subscribe. Please try again.",
      });
    } finally {
      setIsSubmittingEmail(false);
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
              The ultimate platform for college students to connect, collaborate, and succeed academically with AI-powered tools.
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
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {/* Quick Access */}
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm uppercase tracking-wider">Quick Access</h3>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href}
                      className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
                    >
                      {link.icon && <span className="opacity-70">{link.icon}</span>}
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm uppercase tracking-wider">Company</h3>
              <ul className="space-y-3">
                {companyLinks.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href}
                      className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
                    >
                      {link.icon && <span className="opacity-70">{link.icon}</span>}
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter Signup */}
            <div className="sm:col-span-2 md:col-span-1">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm uppercase tracking-wider">Stay Updated</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Get the latest updates on new features and improvements.
              </p>
              <form onSubmit={handleEmailSubmit} className="flex flex-col gap-2">
                <Input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-blue-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
                  disabled={isSubmittingEmail}
                >
                  {isSubmittingEmail ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <div className="flex items-center gap-2 justify-center">
                      Subscribe <Mail className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
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
