'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Wifi, Bell, Mail, Globe2, Activity, Cpu, Users, Database, Upload, MessageSquare, FileText } from 'lucide-react';
import { MotionCard, MotionHeadline, MotionSection } from '@/components/ui/motion-section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/landing/footer';
import { Navigation } from '@/components/landing/navigation';
// Avoid importing server-only ollama library on client; use API route instead
// import { rtdb } from '@/lib/firebase/client'; // Realtime Database removed
import { onValue, ref } from 'firebase/database';

interface ServiceStatus {
  name: string;
  ok: boolean;
  value?: string | number;
  icon: React.ReactNode;
  description?: string;
}

export default function StatusPage() {
  const [isClient, setIsClient] = useState(false);
  const [emailSubscribers, setEmailSubscribers] = useState<number | null>(null);
  const [pushSubscribers, setPushSubscribers] = useState<number | null>(null);
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);
  const [ollamaHealthy, setOllamaHealthy] = useState<boolean | null>(null);
  const [activeUsers, setActiveUsers] = useState<number | null>(null);
  const [firestoreConnected, setFirestoreConnected] = useState<boolean | null>(null);
  const [websiteHealthy, setWebsiteHealthy] = useState<boolean | null>(null);
  const [syllabusUploadHealthy, setSyllabusUploadHealthy] = useState<boolean | null>(null);
  const [aiChatHealthy, setAiChatHealthy] = useState<boolean | null>(null);
  const [geminiHealthy, setGeminiHealthy] = useState<boolean | null>(null);
  const [openaiHealthy, setOpenaiHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const poll = () => {
      // Website health check (check if we can reach the API)
      fetch('/api/status')
        .then(res => {
          setWebsiteHealthy(res.ok);
          return res.ok ? res.json() : Promise.reject(res);
        })
        .then(data => {
          setActiveUsers(data.activeUsers ?? 0);
          setFirestoreConnected(data.firestoreConnected ?? false);
        })
        .catch(() => {
          setWebsiteHealthy(false);
          setActiveUsers(0);
          setFirestoreConnected(false);
        });

      // Email subscriber count
      fetch('/api/changelog-email')
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(data => setEmailSubscribers(data.subscriberCount ?? 0))
        .catch(() => setEmailSubscribers(0));

      // Push subscribers
      fetch('/api/push-notifications/subscribe')
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(data => setPushSubscribers(data.totalSubscriptions ?? 0))
        .catch(() => setPushSubscribers(0));

      // API health check
      fetch('/api/newsletter/subscribe', { method: 'OPTIONS' })
        .then(res => setApiHealthy(res.ok))
        .catch(() => {
          // Fallback: try a simple GET
          fetch('/api/status')
            .then(res => setApiHealthy(res.ok))
            .catch(() => setApiHealthy(false));
        });

      // Service health checks
      fetch('/api/status/services')
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(data => {
          setSyllabusUploadHealthy(data.checks?.syllabusUpload?.ok ?? false);
          setAiChatHealthy(data.checks?.aiChat?.ok ?? false);
          setGeminiHealthy(data.checks?.gemini?.ok ?? false);
          setOpenaiHealthy(data.checks?.openai?.ok ?? false);
        })
        .catch(() => {
          setSyllabusUploadHealthy(false);
          setAiChatHealthy(false);
          setGeminiHealthy(false);
          setOpenaiHealthy(false);
        });
    };

    // initial poll
    poll();
    // poll every 15s for real-time updates
    const intervalId = setInterval(poll, 15000);
    return () => clearInterval(intervalId);
  }, []);

  const services: ServiceStatus[] = useMemo(() => [
    {
      name: 'Website',
      ok: websiteHealthy ?? false,
      value: websiteHealthy == null ? 'Checking…' : websiteHealthy ? 'Operational' : 'Degraded',
      icon: <Globe2 className="h-5 w-5" />,
      description: 'Main website and routing'
    },
    {
      name: 'Syllabus Upload',
      ok: syllabusUploadHealthy ?? false,
      value: syllabusUploadHealthy == null ? 'Checking…' : syllabusUploadHealthy ? 'Operational' : 'Degraded',
      icon: <Upload className="h-5 w-5" />,
      description: 'PDF, DOCX, TXT processing'
    },
    {
      name: 'AI Chat Service',
      ok: aiChatHealthy ?? false,
      value: aiChatHealthy == null ? 'Checking…' : aiChatHealthy ? 'Operational' : 'Degraded',
      icon: <MessageSquare className="h-5 w-5" />,
      description: 'Course-specific AI tutoring'
    },
    {
      name: 'Gemini AI',
      ok: geminiHealthy ?? false,
      value: geminiHealthy == null ? 'Checking…' : geminiHealthy ? 'Available' : 'Unavailable',
      icon: <Cpu className="h-5 w-5" />,
      description: 'Google Gemini API status'
    },
    {
      name: 'OpenAI',
      ok: openaiHealthy ?? false,
      value: openaiHealthy == null ? 'Checking…' : openaiHealthy ? 'Available' : 'Unavailable',
      icon: <Cpu className="h-5 w-5" />,
      description: 'OpenAI API fallback status'
    },
    {
      name: 'Firestore Database',
      ok: firestoreConnected ?? false,
      value: firestoreConnected == null ? 'Checking…' : firestoreConnected ? 'Connected' : 'Offline',
      icon: <Database className="h-5 w-5" />,
      description: 'Database connection'
    },
    {
      name: 'Active Users',
      ok: (activeUsers ?? 0) >= 0,
      value: activeUsers == null ? '—' : `${activeUsers} online`,
      icon: <Users className="h-5 w-5" />,
      description: 'Users active in last 5 minutes'
    },
  ], [websiteHealthy, syllabusUploadHealthy, aiChatHealthy, geminiHealthy, openaiHealthy, firestoreConnected, activeUsers]);

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 dark:to-purple-950">
      <Navigation />
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <MotionSection className="text-center mb-10">
          <MotionHeadline className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
            System Status
          </MotionHeadline>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-4 text-lg text-gray-600 dark:text-gray-300"
          >
            Live health across our services.
          </motion.p>
        </MotionSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s, idx) => (
            <MotionCard key={s.name} delay={idx * 0.05} className="">
              <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-white/70 dark:bg-gray-900/70 backdrop-blur">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2">
                    <span className={`p-2 rounded-lg ${s.ok ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'}`}>
                      {s.icon}
                    </span>
                    <CardTitle className="text-base font-semibold">{s.name}</CardTitle>
                  </div>
                  <Badge variant={s.ok ? 'secondary' : 'destructive'} className="capitalize">
                    {s.ok ? 'Operational' : 'Issue'}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">{s.description}</div>
                    <div className={`flex items-center gap-2 font-medium ${s.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {s.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      <span>{s.value ?? '—'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </MotionCard>
          ))}
        </div>

        <MotionSection delay={0.1} className="mt-12">
          <Card className="border border-gray-200/60 dark:border-gray-800/60 bg-white/70 dark:bg-gray-900/70 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">Service Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white mb-2">Core Services</div>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                    <li>• Syllabus Upload: PDF, DOCX, TXT processing</li>
                    <li>• AI Chat: Course-specific tutoring</li>
                    <li>• Database: Firestore for user data</li>
                  </ul>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white mb-2">AI Providers</div>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                    <li>• Google Gemini: Primary AI engine</li>
                    <li>• OpenAI: Fallback AI provider</li>
                    <li>• Status updates every 15 seconds</li>
                  </ul>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                <Button size="sm" variant="secondary" onClick={() => window.location.reload()}>
                  Refresh Status
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href="/contact">Contact Support</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </MotionSection>
      </main>
      <Footer />
    </div>
  );
}


