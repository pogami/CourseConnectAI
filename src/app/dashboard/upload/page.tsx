"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Sparkles, CheckCircle, Zap, MessageSquare, Target, ArrowRight, FileCog } from "lucide-react";
import { FolderUploadIcon, AiMagicIcon, Chatting01Icon, FlashIcon, Target01Icon, ConnectIcon } from "hugeicons-react";
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
    icon: <FolderUploadIcon size={24} />,
    color: "bg-gradient-to-br from-blue-500 to-blue-600",
    glowColor: "from-blue-500/20"
  },
  {
    id: 2,
    title: "AI Processing",
    description: "We map assignments & schedule",
    icon: <AiMagicIcon size={24} />,
    color: "bg-gradient-to-br from-purple-500 to-purple-600",
    glowColor: "from-purple-500/20"
  },
  {
    id: 3,
    title: "Start Studying",
    description: "Chat with your course instantly",
    icon: <Chatting01Icon size={24} />,
    color: "bg-gradient-to-br from-green-500 to-green-600",
    glowColor: "from-green-500/20"
  },
  {
    id: 4,
    title: "Connect & Study Together",
    description: "Find classmates automatically",
    icon: <ConnectIcon size={24} />,
    color: "bg-gradient-to-br from-orange-500 to-orange-600",
    glowColor: "from-orange-500/20",
    comingSoon: true
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
            <span className="block text-foreground">Upload Your Syllabus</span>
            <span className="block mt-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Get an AI That Knows Your Course
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Our AI extracts deadlines, assignments, and course details, then creates a dedicated chat that understands your specific class. Ask questions, get homework help, and study smarter.
          </p>
        </motion.div>

        {/* How It Works Section - Top */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-6xl mx-auto"
        >
          <Card className="border bg-card/50 backdrop-blur-xl shadow-xl overflow-hidden relative group/card hover:shadow-2xl transition-all duration-500 border-primary/10">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            
            <CardContent className="p-6 sm:p-8 relative">
              <div className="flex items-center gap-3 mb-10">
                <div className="h-10 w-1.5 bg-gradient-to-b from-blue-500 via-purple-500 via-green-500 to-orange-500 rounded-full shadow-lg" />
                <div>
                  <h3 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    How It Works
                  </h3>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-0.5">
                      Simple Process
                    </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
                {steps.map((step, index) => (
                  <motion.div 
                    key={step.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                    className="flex flex-col items-center text-center relative group"
                  >
                    {/* Step Indicator */}
                    <div className="relative z-10 flex-shrink-0 mb-4">
                      <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center shadow-xl transform transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl ring-4 ring-background relative overflow-hidden`}>
                        {/* Glow effect */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${step.glowColor} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                        <div className="relative z-10 text-white">
                          {step.icon}
                        </div>
                      </div>
                      {/* Step number badge */}
                      <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-background border-2 border-gray-300 dark:border-gray-700 flex items-center justify-center shadow-sm">
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                          {step.id}
                        </span>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <h4 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors duration-300">
                          {step.title}
                        </h4>
                        {step.comingSoon && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full border border-orange-200 dark:border-orange-800">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/70 transition-colors duration-300">
                        {step.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upload Area - Middle */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-purple-600/50 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-card rounded-xl border shadow-sm overflow-hidden">
              <InteractiveSyllabusDemo redirectToSignup={false} />
            </div>
          </div>
        </motion.div>

        {/* Value Props - Bottom */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="max-w-4xl mx-auto grid md:grid-cols-2 gap-4 mt-8"
        >
          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex gap-4 items-start">
            <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
              <FlashIcon size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Instant Analysis</h4>
              <p className="text-xs text-muted-foreground">We detect meeting times, grading policies, and assignment milestones instantly.</p>
            </div>
          </div>
          
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex gap-4 items-start">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400">
              <Target01Icon size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Study Assistance</h4>
              <p className="text-xs text-muted-foreground">Chat with AI that knows your course. Get homework help, explanations, and study guidance based on your syllabus.</p>
            </div>
          </div>
        </motion.div>

        {/* Slideshow */}
        {showSlideshow && (
          <HowItWorksSlideshow onClose={() => setShowSlideshow(false)} />
        )}
      </div>
    </div>
  );
}
