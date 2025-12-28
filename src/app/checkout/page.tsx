'use client';

import { EmbeddedStripeCheckout } from '@/components/embedded-stripe-checkout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Crown, Star, Shield, Zap, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { CourseConnectLogo } from '@/components/icons/courseconnect-logo';
import { useEffect } from 'react';

export default function CustomCheckoutPage() {
  const priceId = process.env.NEXT_PUBLIC_STRIPE_SCHOLAR_PRICE_ID;

  // Force dark mode for checkout page
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light');
    root.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  if (!priceId) {
    return (
      <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              Payment Setup Required
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              Stripe configuration needed. Contact support to enable payments.
            </p>
            <Button 
              asChild 
              className="w-full bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
            >
              <Link href="/pricing">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Plans
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      {/* Modern Header */}
      <header className="sticky top-0 z-50 border-b border-white/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/home" className="flex items-center gap-2 sm:gap-3 group">
            {/* CourseConnect Logo */}
            <CourseConnectLogo className="h-6 w-6 sm:h-7 sm:w-7 group-hover:scale-110 transition-all duration-300" />
            
            {/* Enhanced CourseConnect text */}
            <div className="relative">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight relative">
                <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient-x">
                  CourseConnect
                </span>
                {/* Subtle text shadow for depth */}
                <span className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent blur-sm opacity-30 -z-10">
                  CourseConnect
                </span>
              </h1>
              {/* Tagline - always visible */}
              <p className="text-xs sm:text-sm text-muted-foreground font-medium tracking-wide -mt-1">
                AI-Powered Learning
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              asChild
              className="hover:bg-slate-100/50 dark:hover:bg-slate-800/50 border-0 shadow-none hover:shadow-md transition-all duration-300"
            >
              <Link href="/pricing">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Plan Info */}
          <div className="space-y-8">
            {/* Plan Header */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center justify-center lg:justify-start mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Crown className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 via-purple-900 to-blue-900 dark:from-slate-100 dark:via-purple-100 dark:to-blue-100 bg-clip-text text-transparent">
                Scholar Plan
              </h1>
              <div className="flex items-baseline justify-center lg:justify-start gap-2 mb-6">
                <span className="text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  $4.99
                </span>
                <span className="text-xl text-slate-600 dark:text-slate-400">/month</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-2 rounded-full text-sm font-semibold mb-8">
                <Star className="h-4 w-4" />
                14-day free trial
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                What's included:
              </h3>
              {[
                "Unlimited AI tutoring sessions",
                "Voice input & natural language processing", 
                "Advanced image & document analysis",
                "Smart study schedule generation",
                "Priority customer support",
                "Early access to new features"
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                </div>
              ))}
            </div>

          </div>

          {/* Right Column - Checkout Form */}
          <div className="lg:sticky lg:top-24">
            <Card className="border-0 shadow-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
              <CardHeader className="text-center pb-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <CourseConnectLogo className="h-8 w-8" />
                  <div className="text-left">
                    <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                      CourseConnect
                    </h2>
                    <p className="text-xs text-muted-foreground">AI-Powered Learning</p>
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  Complete Your Subscription
                </CardTitle>
                <p className="text-slate-600 dark:text-slate-400">
                  Start your 14-day free trial today
                </p>
              </CardHeader>
              <CardContent className="px-6 pb-6">

                <EmbeddedStripeCheckout
                  priceId={priceId}
                  planName="Scholar"
                  onSuccess={() => {
                    window.location.href = '/dashboard';
                  }}
                  onCancel={() => {
                    window.location.href = '/pricing';
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
