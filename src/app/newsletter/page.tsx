"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Mail, Bell, ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { PushNotificationManager } from "@/components/push-notification-manager";
import { MobileButton } from "@/components/ui/mobile-button";
import { useToast } from "@/hooks/use-toast";
import confetti from 'canvas-confetti';
import { MobileInput } from "@/components/ui/mobile-input";

export default function NewsletterPage() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Subscription successful, triggering confetti!');
        toast({
          title: "Successfully Subscribed!",
          description: data.emailSent 
            ? "Check your email for a welcome message!" 
            : "You're now subscribed! Welcome email sent.",
        });
        setEmail('');
        
        // Enhanced confetti animation
        const duration = 4500; // Longer duration
        const animationEnd = Date.now() + duration;
        const defaults = { 
          startVelocity: 35, // Slightly higher velocity
          spread: 360, 
          ticks: 90, // Longer particle life
          zIndex: 0,
          gravity: 0.75, // More noticeable gravity
          drift: 0.05, // Slight horizontal drift
          scalar: 1.2, // Slightly larger particles
          shapes: ['circle', 'square', 'star'], // Add different shapes
          colors: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#8B5A2B', '#FFD700', '#C0C0C0'] // More colors
        };

        function randomInRange(min: number, max: number) {
          return Math.random() * (max - min) + min;
        }

        const interval: NodeJS.Timeout = setInterval(function() {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 75 * (timeLeft / duration); // Start with more particles

          // Launch from left
          confetti(Object.assign({}, defaults, {
            particleCount: particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
          }));
          // Launch from right
          confetti(Object.assign({}, defaults, {
            particleCount: particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
          }));
          // Optional: Add a central burst occasionally
          if (Math.random() > 0.7) {
            confetti(Object.assign({}, defaults, {
              particleCount: particleCount / 2,
              angle: randomInRange(60, 120),
              spread: randomInRange(40, 70),
              origin: { x: 0.5, y: 0.5 }
            }));
          }
        }, 200); // Slightly faster interval for more continuous flow
        
        setIsSubscribed(true);
      } else {
        console.error('Subscription failed:', data.error);
        toast({
          variant: "destructive",
          title: "Subscription Failed",
          description: data.error || "Please try again later.",
        });
      }
    } catch (error) {
      console.error('Network error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to subscribe. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubscribed) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                You're All Set! 🎉
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Thanks for subscribing to CourseConnect updates! You'll be the first to know about new features, improvements, and exciting developments.
              </p>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2">
                  <Bell className="h-5 w-5" />
                  What to Expect
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">New Feature Announcements</h3>
                    <p className="text-sm text-gray-600">Be the first to know about exciting new features</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Product Updates</h3>
                    <p className="text-sm text-gray-600">Stay informed about improvements and enhancements</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Tips & Best Practices</h3>
                    <p className="text-sm text-gray-600">Learn how to get the most out of CourseConnect</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/home">
                <Button size="lg" className="w-full sm:w-auto">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
              {/* <Link href="/changelog">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  View Recent Updates
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Header */}
          <div className="mb-12">
            <Badge variant="outline" className="mb-4">
              <Mail className="h-3 w-3 mr-1" />
              Stay Updated
            </Badge>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Subscribe to CourseConnect Updates
            </h1>
            <p className="text-xl text-gray-600">
              Get notified about new features, improvements, and exciting developments. 
              Subscribe to our email newsletter for updates, and enable push notifications on mobile devices for instant alerts.
            </p>
          </div>

          {/* Push Notifications */}
          <PushNotificationManager />

          {/* Subscription Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <Bell className="h-5 w-5" />
                Join Our Community
              </CardTitle>
              <CardDescription>
                Enter your email to start receiving updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubscribe} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <MobileInput
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1"
                    required
                    mobileSize="md"
                    fullWidthOnMobile={true}
                  />
                  <MobileButton 
                    type="submit" 
                    disabled={isLoading || !email.trim()}
                    mobileSize="md"
                    fullWidthOnMobile={true}
                    className="sm:w-auto"
                  >
                    {isLoading ? "Subscribing..." : "Subscribe"}
                  </MobileButton>
                </div>
                <p className="text-sm text-gray-500">
                  We respect your privacy. Unsubscribe at any time.
                </p>
              </form>
            </CardContent>
          </Card>

          {/* Benefits */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Instant Notifications</h3>
              <p className="text-sm text-gray-600">
                Be the first to know about new features and updates
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Quality Content</h3>
              <p className="text-sm text-gray-600">
                Receive curated updates about features that matter to you
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Mail className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Mobile Push Notifications</h3>
              <p className="text-sm text-gray-600">
                Instant notifications on mobile devices (Android/iOS only)
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <MobileButton 
              variant="outline" 
              size="lg" 
              className="w-full sm:w-auto"
              fullWidthOnMobile={true}
              asChild
            >
              <Link href="/home">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </MobileButton>
            {/* <MobileButton 
              variant="ghost" 
              size="lg" 
              className="w-full sm:w-auto hover:bg-transparent"
              fullWidthOnMobile={true}
              asChild
            >
              <Link href="/changelog">
                View Recent Updates
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </MobileButton> */}
          </div>
        </div>
      </div>
    </div>
  );
}
