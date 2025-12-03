"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Sparkles, CheckCircle, Zap, MessageSquare, Target, ArrowRight, FileCog } from "lucide-react";
import InteractiveSyllabusDemo from "@/components/interactive-syllabus-demo";
import { HowItWorksSlideshow } from "@/components/how-it-works-slideshow";
import { motion } from "framer-motion";

const features = [
  {
    icon: <Sparkles className="size-5 text-purple-500" />,
    title: "AI-Powered Analysis",
    description: "Smart parsing extracts key information automatically"
  },
  {
    icon: <FileText className="size-5 text-blue-500" />,
    title: "Instant Processing",
    description: "Get results in seconds, not minutes"
  },
  {
    icon: <CheckCircle className="size-5 text-green-500" />,
    title: "Auto-Class Detection",
    description: "Automatically creates a dedicated chat for your course"
  }
];

const steps = [
  {
    id: 1,
    title: "Upload Syllabus",
    description: "Drag & drop PDF, DOCX, or TXT",
    icon: <Upload className="size-5 text-white" />,
    color: "bg-blue-500"
  },
  {
    id: 2,
    title: "AI Processing",
    description: "We map assignments & schedule",
    icon: <FileCog className="size-5 text-white" />,
    color: "bg-purple-500"
  },
  {
    id: 3,
    title: "Start Studying",
    description: "Chat with your course instantly",
    icon: <MessageSquare className="size-5 text-white" />,
    color: "bg-green-500"
  }
];

export default function EnhancedSyllabusUploadPage() {
  const [showSlideshow, setShowSlideshow] = useState(false);

  useEffect(() => {
    // Check if slideshow should be shown from URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('showSlideshow') === 'true') {
      setShowSlideshow(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 space-y-12">
        
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-6"
        >
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 border border-blue-500/20 text-sm font-medium mb-2 backdrop-blur-sm shadow-sm hover:bg-blue-500/20 transition-colors cursor-default">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent font-semibold">New: Enhanced AI Parsing</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            <span className="block text-foreground">Transform Your Syllabus</span>
            <span className="block mt-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Into an Interactive Tutor
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Upload your course documents and let our AI instantly create a personalized study companion with deadlines, topics, and exam prep.
          </p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Upload Area */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-purple-600/50 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative bg-card rounded-xl border shadow-sm overflow-hidden">
                <InteractiveSyllabusDemo redirectToSignup={false} />
              </div>
            </div>
          </motion.div>

          {/* Right Column: How it works & Info */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-5 space-y-6"
          >
            {/* How It Works Card */}
            <Card className="border bg-card/50 backdrop-blur-xl shadow-xl overflow-hidden relative group/card hover:shadow-2xl transition-all duration-500 border-primary/10">
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
              
              <CardContent className="p-6 sm:p-8 relative">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-8 w-1.5 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full" />
                  <div>
                    <h3 className="text-xl font-bold tracking-tight">How It Works</h3>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Simple 3-Step Process</p>
                  </div>
                </div>

                <div className="space-y-8 relative">
                  {/* Connecting Line with Gradient */}
                  <div className="absolute left-[19px] top-4 bottom-8 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-green-500/50 opacity-30" />
                  
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex gap-6 relative group">
                      {/* Step Indicator */}
                      <div className="relative z-10">
                        <div className={`w-10 h-10 rounded-xl ${step.color} flex items-center justify-center shadow-lg transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ring-4 ring-background`}>
                          {step.icon}
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 pt-1">
                        <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors duration-300">
                          {step.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed group-hover:text-muted-foreground/80">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Value Props */}
            <div className="grid gap-4">
              <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex gap-4 items-start">
                <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                  <Zap className="size-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Instant Analysis</h4>
                  <p className="text-xs text-muted-foreground">We detect meeting times, grading policies, and assignment milestones instantly.</p>
                </div>
              </div>
              
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex gap-4 items-start">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400">
                  <Target className="size-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Study Assistance</h4>
                  <p className="text-xs text-muted-foreground">Generate summaries, practice questions, and study plans directly from your syllabus.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Slideshow */}
        {showSlideshow && (
          <HowItWorksSlideshow onClose={() => setShowSlideshow(false)} />
        )}
      </div>
    </div>
  );
}
