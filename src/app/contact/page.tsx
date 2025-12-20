'use client';

import React, { useState } from 'react';
import { Navigation } from '@/components/landing/navigation';
import { Footer } from '@/components/landing/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail, 
  MessageSquare, 
  Clock, 
  Send, 
  CheckCircle, 
  CheckCircle2,
  HelpCircle, 
  Users,
  Sparkles,
  Zap,
  Globe,
  ArrowRight,
  Upload
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { HideAISupport } from '@/components/hide-ai-support';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const contactMethods = [
  {
    icon: Mail,
    title: "Email Support",
    description: "Get help with syllabus upload, AI chats, billing, or technical issues",
    action: "courseconnect.noreply@gmail.com",
    link: "mailto:courseconnect.noreply@gmail.com",
    gradient: "from-sky-500 to-sky-400",
    delay: 0.1
  },
  {
    icon: HelpCircle,
    title: "Help Center",
    description: "Browse FAQs and guides to find answers quickly",
    action: "View FAQs",
    link: "#faq",
    gradient: "from-sky-500 to-sky-400",
    delay: 0.2
  }
];

const faqs = [
  {
    question: "How do I upload my syllabus?",
    answer: "Go to Dashboard → Upload, then drag & drop your PDF, DOCX, or TXT syllabus. Our AI instantly extracts course information, assignments, and deadlines, then automatically creates a dedicated AI chat for that course."
  },
  {
    question: "What can the AI help me with?",
    answer: "Our AI provides course-specific tutoring based on your uploaded syllabus. You can ask about assignments, exam dates, course concepts, or get help with homework. The AI remembers your course context from the syllabus and gives personalized answers."
  },
  {
    question: "What features are currently available?",
    answer: "Right now you can: Upload & analyze syllabi (PDF, DOCX, TXT), use AI-powered class chats (course-specific tutoring), access general AI chat (any academic question), receive smart notifications, and manage your files. All core features are free during beta."
  },
  {
    question: "How does the deadline tracking work?",
    answer: "When you upload your syllabus, our AI automatically extracts all assignment due dates and exam dates. These appear in your dashboard organized by course, so you can see what's coming up and never miss a deadline."
  }
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const { toast } = useToast();
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Show success confirmation
      setMessageSent(true);
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        category: "",
        message: ""
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
      <div className="min-h-screen bg-white dark:bg-gray-950 font-sans selection:bg-sky-500/30">
      <Navigation />
      
      {/* Otherworldly Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-sky-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-sky-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />
        <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] bg-pink-500/10 rounded-full blur-[100px] animate-float" />
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.02] dark:opacity-[0.05]" />
      </div>

      <main className="relative z-10 pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Section */}
          <div className="text-center mb-20">
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight"
            >
              Let's start a <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-sky-600 to-sky-500 bg-clip-text text-transparent">
                conversation
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed"
            >
              Need help with syllabus upload, AI-powered class chats, or using CourseConnect? 
              We're here to help you succeed.
            </motion.p>
          </div>
          
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
            
            {/* Left Column: Contact Info & FAQ */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="lg:col-span-5 space-y-8"
            >
              {/* Contact Cards */}
              <div className="space-y-4">
                {contactMethods.map((method, idx) => (
                  <motion.a
                    key={idx}
                    href={method.link}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 + (idx * 0.1) }}
                    className="group block p-6 rounded-2xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border-2 border-gray-200/50 dark:border-gray-800/50 hover:border-sky-500/50 dark:hover:border-sky-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/10 hover:-translate-y-1"
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br text-white shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform", method.gradient)}>
                        <method.icon className="w-7 h-7" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                          {method.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-2">
                          {method.description}
                        </p>
                        <span className="text-sm font-medium text-sky-600 dark:text-sky-400 group-hover:underline">
                          {method.action} →
                        </span>
                      </div>
                    </div>
                  </motion.a>
                ))}
              </div>

              {/* Quick Tips Section */}
              <div className="bg-gradient-to-br from-sky-50 to-sky-50 dark:from-sky-950/20 dark:to-sky-950/20 rounded-2xl p-6 border border-sky-200/50 dark:border-sky-800/50">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Quick Tips
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">Be specific about your issue - include error messages or screenshots if possible</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">Check the FAQs below - your answer might already be there</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">For upload issues, try a different file format (PDF, DOCX, or TXT)</span>
                  </div>
                </div>
              </div>

              {/* FAQ Section */}
              <div id="faq" className="bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800/50">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-sky-500" />
                  Common Questions
                </h3>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`} className="border-b border-gray-200/50 dark:border-gray-700/50 last:border-0">
                      <AccordionTrigger className="text-left hover:no-underline hover:text-sky-600 dark:hover:text-sky-400 transition-colors py-3 text-gray-900 dark:text-gray-200 font-medium">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-600 dark:text-gray-400 leading-relaxed pb-3 pt-1">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </motion.div>

            {/* Right Column: Contact Form */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="lg:col-span-7"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-sky-500 rounded-[2.5rem] blur-2xl opacity-20 dark:opacity-40 animate-pulse" />
                <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-12 border border-white/50 dark:border-gray-700/50 shadow-2xl">
                  {messageSent ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                      className="text-center py-12"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ 
                          type: "spring",
                          stiffness: 200,
                          damping: 15,
                          delay: 0.2
                        }}
                        className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 mb-6 shadow-lg"
                      >
                        <motion.div
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ 
                            duration: 0.5,
                            delay: 0.4
                          }}
                        >
                          <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={3} />
                        </motion.div>
                      </motion.div>
                      <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="text-3xl font-bold text-gray-900 dark:text-white mb-3"
                      >
                        Message Sent!
                      </motion.h2>
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="text-gray-600 dark:text-gray-400 text-lg mb-8"
                      >
                        We've received your message and will get back to you soon.
                      </motion.p>
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        onClick={() => setMessageSent(false)}
                        className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105"
                      >
                        Send Another Message
                      </motion.button>
                    </motion.div>
                  ) : (
                    <>
                      <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Send us a message</h2>
                        <p className="text-gray-600 dark:text-gray-400">Have a question or need help? We're here to assist you.</p>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">Full Name</Label>
                        <Input
                          id="name"
                          placeholder="Jane Doe"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          className="bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-sky-500 dark:focus:border-sky-500 h-12 rounded-xl transition-all"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="jane@university.edu"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          className="bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-sky-500 dark:focus:border-sky-500 h-12 rounded-xl transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                        <Label htmlFor="category" className="text-gray-700 dark:text-gray-300">Topic</Label>
                        <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                          <SelectTrigger className="bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-sky-500 dark:focus:border-sky-500 h-12 rounded-xl transition-all">
                            <SelectValue placeholder="Select a topic" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="syllabus">Syllabus Upload Help</SelectItem>
                            <SelectItem value="ai-chat">AI Chat Support</SelectItem>
                            <SelectItem value="account">Account & Login Issues</SelectItem>
                            <SelectItem value="feature">Feature Request</SelectItem>
                            <SelectItem value="general">General Question</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-gray-700 dark:text-gray-300">Subject</Label>
                        <Input
                          id="subject"
                          placeholder="Brief summary"
                          value={formData.subject}
                          onChange={(e) => handleInputChange("subject", e.target.value)}
                          className="bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-sky-500 dark:focus:border-sky-500 h-12 rounded-xl transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-gray-700 dark:text-gray-300">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Tell us how we can help..."
                        className="min-h-[150px] bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:border-sky-500 dark:focus:border-sky-500 rounded-xl resize-none transition-all p-4"
                        value={formData.message}
                        onChange={(e) => handleInputChange("message", e.target.value)}
                        required
                      />
                    </div>

                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full h-14 bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-lg hover:shadow-sky-500/25 hover:scale-[1.02] transition-all duration-300 text-lg font-semibold tracking-wide"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                          Sending...
                        </>
                      ) : (
                        <span className="flex items-center gap-2">
                          Send Message <Send className="w-5 h-5" />
                        </span>
                      )}
                    </Button>
                  </form>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </main>

      <Footer />
      <HideAISupport />
    </div>
  );
}
