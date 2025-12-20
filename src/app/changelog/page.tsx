"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import {
  Book01Icon,
  Target01Icon,
  Chatting01Icon,
  Shield01Icon,
  ChartBarLineIcon,
  FlashIcon,
  MagicWand01Icon,
  Rocket01Icon,
  Search01Icon,
  Notification01Icon,
  Mail01Icon,
  CheckmarkCircle01Icon,
  AlertCircleIcon
} from "hugeicons-react";
import { Footer } from "@/components/landing/footer";
import { CourseConnectLogo } from "@/components/icons/courseconnect-logo";
import { ClientThemeToggle } from "@/components/client-theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ReactionButton } from "@/components/changelog/reaction-button";
import { InteractiveGraph } from "@/components/interactive-graph";

// --- Data & Types ---

type Category = "feature" | "improvement" | "fix" | "announcement";

interface UpdateItem {
  title: string;
  description: string;
  category: Category;
  icon: React.ReactNode;
  image?: string; // Placeholder for future screenshots
  tags?: string[];
}

interface Update {
  id: string;
  date: string;
  version: string;
  title: string; // Main title for the release
  description: string; // Brief summary
  type: "major" | "minor" | "patch";
  items: UpdateItem[];
  impact?: string; // Why this release matters for students
}

const updates: Update[] = [
  {
    id: "dec-7-2025-docs",
    date: "December 7, 2025",
    version: "1.3.1",
    title: "Smarter Document Analysis",
    description: "Get editor-quality feedback on your documents with personalized, actionable advice tailored to your work.",
    impact: "Upload any document—your essays, assignments, cover letters, or reports—and receive detailed feedback that speaks directly to you. The AI identifies your strengths, suggests specific improvements, and helps you polish your writing like a professional editor would.",
    type: "minor",
    items: [
      {
        category: "improvement",
        icon: <Book01Icon className="w-5 h-5" />,
        title: "Professional Document Analysis",
        description: "Get detailed, editor-quality feedback on your documents. The AI now provides comprehensive analysis with clear strengths, specific suggestions for improvement, and actionable insights—just like a professional reviewer would.",
        tags: ["Documents", "AI", "Feedback"]
      },
      {
        category: "fix",
        icon: <Chatting01Icon className="w-5 h-5" />,
        title: "Personalized Document Feedback",
        description: "The AI now speaks directly to you when reviewing your work. Instead of talking about you in third person, it uses 'you' and 'your'—making feedback feel more personal and helpful, like a mentor reviewing your cover letter or essay.",
        tags: ["Documents", "AI", "UX"]
      }
    ]
  },
  {
    id: "dec-7-2025-viz",
    date: "December 7, 2025",
    version: "1.3.1",
    title: "Improved Charts & Diagrams",
    description: "More reliable visualizations that work smoothly and don't break your layout.",
    impact: "Charts and diagrams now parse correctly, scroll when they're wide, and the AI will fix them if something goes wrong—so you can focus on learning, not fighting with broken visuals.",
    type: "patch",
    items: [
      {
        category: "improvement",
        icon: <ChartBarLineIcon className="w-5 h-5" />,
        title: "Reliable Charts & Diagrams",
        description: "Fixed parsing errors for graphs and charts. Wide diagrams now scroll horizontally instead of breaking your layout. If a diagram is wrong or empty, the AI will acknowledge the mistake and recreate it correctly.",
        tags: ["Visualizations", "Charts", "UX"]
      }
    ]
  },
  {
    id: "dec-7-2025-security",
    date: "December 7, 2025",
    version: "1.3.1",
    title: "Enhanced Security & Settings",
    description: "Better visibility into your account security and active sessions, plus improved settings organization.",
    impact: "You can now see exactly which devices are signed into your account and get alerts if someone new accesses it—giving you peace of mind about your account security.",
    type: "minor",
    items: [
      {
        category: "improvement",
        icon: <Shield01Icon className="w-5 h-5" />,
        title: "Security & Activity Dashboard",
        description: "New Security & Activity section shows your active session with device type, browser, location, and last active time. Keep track of where and when you're signed in.",
        tags: ["Security", "Settings", "Privacy"]
      },
      {
        category: "feature",
        icon: <Notification01Icon className="w-5 h-5" />,
        title: "New Device Alerts",
        description: "Enable email alerts to get notified whenever a new device signs into your account. Stay informed about account access and catch any unauthorized logins quickly.",
        tags: ["Security", "Notifications"]
      },
      {
        category: "improvement",
        icon: <Shield01Icon className="w-5 h-5" />,
        title: "Streamlined Settings Page",
        description: "Settings page reorganized for better clarity. Account information, security controls, and account actions are now easier to find and manage.",
        tags: ["Settings", "UX"]
      }
    ]
  },
  {
    id: "dec-2-2025",
    date: "December 2, 2025",
    version: "1.3.0",
    title: "The Smart Syllabus Update",
    description: "AI that actually reads your syllabus, personalized study suggestions, and better chat controls.",
    impact: "When the AI knows your exact course details, it can answer questions about class times, topics, and assignments accurately—no more guessing.",
    type: "major",
    items: [
      {
        category: "feature",
        icon: <Book01Icon className="w-5 h-5" />,
        title: "Syllabus-Aware AI Responses",
        description: "The AI now has access to your full syllabus text (up to 12,000 characters) and shows clean source quotes. When you ask about class times, topics, or assignments, it searches the syllabus first and cites exactly where it found the information.",
        tags: ["Syllabus", "AI", "Sources"]
      },
      {
        category: "feature",
        icon: <Target01Icon className="w-5 h-5" />,
        title: "Next Best Step Dashboard",
        description: "A personalized action strip on your dashboard that suggests the most urgent assignment or exam, or recommends a topic to review. One click takes you straight to the chat with a smart prefill.",
        tags: ["Dashboard", "Personalization"]
      },
      {
        category: "improvement",
        icon: <Chatting01Icon className="w-5 h-5" />,
        title: "Stop AI Response Button",
        description: "Added a stop button that appears while the AI is thinking, letting you cancel long responses instantly. Works in General Chat and Class Chats.",
        tags: ["Chat", "UX"]
      },
      {
        category: "fix",
        icon: <Shield01Icon className="w-5 h-5" />,
        title: "Chat Reset & Prefill Fixes",
        description: "Fixed chat reset so old messages don't reappear on reload. Also fixed prefill text staying in the input after you send a message.",
        tags: ["Chat", "Bug Fix"]
      }
    ]
  },
  {
    id: "nov-20-2025",
    date: "November 20, 2025",
    version: "1.2.0",
    title: "The Visualization Update",
    description: "Bringing your data to life with interactive charts, refined aesthetics, and smoother interactions.",
    impact: "Visualizations make your progress and problem areas obvious at a glance, so you can focus study time where it matters.",
    type: "major",
    items: [
      {
        category: "feature",
        icon: <ChartBarLineIcon className="w-5 h-5" />,
        title: "Interactive Graph & Chart Generation",
        description: "Ask the AI to instantly turn formulas and data into visuals. Try prompts like \"Graph y = x²\" or \"Show me a pie chart of my grades\" and explore fully interactive charts with zoom and sliders.",
        tags: ["Charts", "Math", "Visualization"]
      },
      {
        category: "improvement",
        icon: <FlashIcon className="w-5 h-5" />,
        title: "Dashboard 2.0",
        description: "A complete visual refresh of your dashboard with a clearer layout, better stats, and smoother animations.",
        tags: ["Dashboard", "UI"]
      },
      {
        category: "fix",
        icon: <Shield01Icon className="w-5 h-5" />,
        title: "Reliable Document Uploads",
        description: "Fixed an issue where complex PDF syllabi would sometimes fail to process. The upload engine is now significantly more robust.",
        tags: ["Uploads", "Reliability"]
      },
      {
        category: "improvement",
        icon: <Chatting01Icon className="w-5 h-5" />,
        title: "Smarter AI Summaries",
        description: "Document summaries are now more concise and structured, helping you get the gist of a 50-page reading in seconds.",
        tags: ["Summaries", "Notes"]
      }
    ]
  },
  {
    id: "nov-15-2025",
    date: "November 15, 2025",
    version: "1.1.0",
    title: "The Study Tools Update",
    description: "New ways to turn your chats into study materials and handle your documents.",
    impact: "Turning chats and readings into structured notes helps you revise faster and forget less.",
    type: "minor",
    items: [
      {
        category: "feature",
        icon: <MagicWand01Icon className="w-5 h-5" />,
        title: "AI Notes from Chat",
        description: "One-click magic: Turn any chat conversation into a beautifully formatted set of study notes, ready to print or save.",
        tags: ["Notes", "Study"]
      },
      {
        category: "feature",
        icon: <Book01Icon className="w-5 h-5" />,
        title: "Advanced PDF Processing",
        description: "We rebuilt our document engine from scratch. It now understands complex layouts, tables, and scientific notation in your uploads much better.",
        tags: ["Uploads", "PDF"]
      },
      {
        category: "improvement",
        icon: <Rocket01Icon className="w-5 h-5" />,
        title: "Lightning Fast Uploads",
        description: "Optimized file processing means your documents are ready to chat with almost instantly.",
        tags: ["Performance", "Uploads"]
      }
    ]
  },
  {
    id: "oct-22-2025",
    date: "October 22, 2025",
    version: "1.0.2",
    title: "My Courses & Assignments",
    description: "Making it easier to stay organized across all your classes.",
    type: "minor",
    items: [
      {
        category: "feature",
        icon: <ChartBarLineIcon className="w-5 h-5" />,
        title: "MY COURSES Section",
        description: "Added a dedicated \"My Courses\" section on the dashboard so you can quickly jump into the classes that matter most."
      },
      {
        category: "feature",
        icon: <MagicWand01Icon className="w-5 h-5" />,
        title: "Quick Add Course",
        description: "New \"Add Course\" button in the sidebar lets you spin up a new class chat in just a couple of clicks."
      },
      {
        category: "improvement",
        icon: <Chatting01Icon className="w-5 h-5" />,
        title: "Cleaner Empty States",
        description: "Improved dashboard messages when you have no courses yet, with clearer prompts to upload your first syllabus."
      }
    ]
  },
  {
    id: "oct-17-2025",
    date: "October 17, 2025",
    version: "1.0.0",
    title: "Public Beta Launch",
    description: "The official release of CourseConnect. Production-ready and open to everyone.",
    impact: "Bringing the full CourseConnect experience to students in a stable, trustworthy way marked the start of real-world learning impact.",
    type: "major",
    items: [
      {
        category: "announcement",
        icon: <Rocket01Icon className="w-5 h-5" />,
        title: "We Are Live!",
        description: "After weeks of testing, CourseConnect is now in Public Beta. Upload your syllabus and meet your new personalized AI tutor."
      },
      {
        category: "feature",
        icon: <Chatting01Icon className="w-5 h-5" />,
        title: "Beautiful Math Rendering",
        description: "Chatting about Calculus or Physics? We now support full LaTeX rendering, so equations look exactly like they do in your textbook.",
        tags: ["Math", "Rendering"]
      },
      {
        category: "improvement",
        icon: <FlashIcon className="w-5 h-5" />,
        title: "Unified Onboarding",
        description: "A seamless new welcome experience gets you from sign up to your first AI conversation in under 60 seconds."
      },
      {
        category: "improvement",
        icon: <MagicWand01Icon className="w-5 h-5" />,
        title: "Brand polish",
        description: "Refined CourseConnect’s visuals and messaging so the public beta feels clean, consistent, and trustworthy."
      },
      {
        category: "fix",
        icon: <Shield01Icon className="w-5 h-5" />,
        title: "Authentication & Notifications",
        description: "Fixed edge cases with sign-in, notifications, and onboarding slides so everything works smoothly on day one of beta."
      },
      {
        category: "fix",
        icon: <Shield01Icon className="w-5 h-5" />,
        title: "Reliable Google Sign-In",
        description: "Made Google login more reliable across browsers so you can sign in without random errors or dead ends."
      }
    ]
  },
  {
    id: "oct-11-2025",
    date: "October 11, 2025",
    version: "0.9.0",
    title: "The Interactive Learning Update",
    description: "Introducing powerful new ways to test your knowledge actively.",
    impact: "Quizzes and feedback turn passive reading into active recall, which is one of the fastest ways to actually remember material.",
    type: "major",
    items: [
      {
        category: "feature",
        icon: <Shield01Icon className="w-5 h-5" />,
        title: "Interactive Quiz & Exam System",
        description: "Don't just read—practice. The AI can now generate custom quizzes and full practice exams based on your course material."
      },
      {
        category: "feature",
        icon: <Chatting01Icon className="w-5 h-5" />,
        title: "AI Feedback Loop",
        description: "Get instant, constructive feedback on your quiz answers. The AI explains why an answer is right or wrong so you learn faster."
      },
      {
        category: "improvement",
        icon: <MagicWand01Icon className="w-5 h-5" />,
        title: "Dark Mode Refinement",
        description: "We polished the entire UI for night owls. Dark mode is now consistent, higher contrast, and easier on the eyes."
      },
      {
        category: "fix",
        icon: <Chatting01Icon className="w-5 h-5" />,
        title: "Chat Stability",
        description: "Fixed occasional chat loading glitches so conversations start and resume more smoothly."
      }
    ]
  },
  {
    id: "sept-30-2025",
    date: "September 30, 2025",
    version: "0.4.0",
    title: "Interactive Learning & Live Demo",
    description: "Enhanced interactive features and a polished live demo experience.",
    type: "major",
    items: [
      {
        category: "feature",
        icon: <MagicWand01Icon className="w-5 h-5" />,
        title: "Interactive Welcome Cards",
        description: "New interactive welcome cards guide new users through the product and showcase what the AI can do with your courses."
      },
      {
        category: "improvement",
        icon: <Rocket01Icon className="w-5 h-5" />,
        title: "Live Demo Improvements",
        description: "Enhanced the public demo experience with better sample data and more responsive UI so visitors can try CourseConnect instantly."
      }
    ]
  },
  {
    id: "sept-25-2025",
    date: "September 25, 2025",
    version: "0.3.0",
    title: "Advanced Study Tools",
    description: "Experimenting with powerful tools to understand your notes, images, and documents.",
    impact: "Richer inputs (like images and messy PDFs) mean you can bring more of your real coursework into a single study companion.",
    type: "major",
    items: [
      {
        category: "feature",
        icon: <Book01Icon className="w-5 h-5" />,
        title: "Smart Text Extraction",
        description: "Built a comprehensive text extraction pipeline for uploaded files, laying the groundwork for reliable syllabus and document parsing."
      },
      {
        category: "feature",
        icon: <MagicWand01Icon className="w-5 h-5" />,
        title: "AI Vision Experiments",
        description: "Added early support for analyzing images and screenshots with OCR, so the AI can start reasoning about visual content."
      },
      {
        category: "improvement",
        icon: <Chatting01Icon className="w-5 h-5" />,
        title: "Copy‑Friendly Chat UI",
        description: "Added convenient copy buttons to messages and code blocks to make it easier to move AI answers into your notes."
      }
    ]
  },
  {
    id: "sept-14-2025",
    date: "September 14, 2025",
    version: "0.1.0",
    title: "The Beginning",
    description: "The first line of code. The start of our mission to change how students learn.",
    impact: "Laying a solid foundation for chat, dashboard, and auth made it possible to ship features quickly without constantly breaking things.",
    type: "major",
    items: [
      {
        category: "announcement",
        icon: <Rocket01Icon className="w-5 h-5" />,
        title: "Project Genesis",
        description: "CourseConnect is born. We laid the foundation for a dual‑AI powered tutor focused on your specific courses."
      },
      {
        category: "feature",
        icon: <Chatting01Icon className="w-5 h-5" />,
        title: "Core Chat Engine",
        description: "The first iteration of our context‑aware chat is live, able to answer general study questions and guide you through topics."
      },
      {
        category: "feature",
        icon: <ChartBarLineIcon className="w-5 h-5" />,
        title: "Dashboard v1",
        description: "A simple, clean home for your courses with quick access to chats and core tools—the starting point for today’s dashboard."
      },
      {
        category: "improvement",
        icon: <FlashIcon className="w-5 h-5" />,
        title: "Mobile‑First & Google Sign‑In",
        description: "From day one we focused on real students: better mobile layouts, touch targets, and Google sign‑in so you can get into your account in seconds."
      }
    ]
  }
];

const categoryStyles: Record<Category, { label: string; color: string; bg: string; border: string }> = {
  feature: { label: "New Feature", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  improvement: { label: "Improvement", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  fix: { label: "Fix", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  announcement: { label: "Announcement", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
};

// Highlight matching search text within a string
const highlightMatch = (text: string, query: string) => {
  if (!query.trim()) return text;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const parts: React.ReactNode[] = [];
  let start = 0;

  while (true) {
    const index = lowerText.indexOf(lowerQuery, start);
    if (index === -1) break;
    if (index > start) {
      parts.push(text.slice(start, index));
    }
    parts.push(
      <mark
        key={`${index}-${lowerQuery}`}
        className="bg-yellow-200/70 dark:bg-yellow-500/40 text-inherit rounded px-0.5"
      >
        {text.slice(index, index + lowerQuery.length)}
      </mark>
    );
    start = index + lowerQuery.length;
  }

  if (start < text.length) {
    parts.push(text.slice(start));
  }

  return <>{parts}</>;
};

export default function ChangelogPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");
  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.1], [0, 1]);
  
  const searchQuery = searchTerm.trim().toLowerCase();

  // Per-release visibility and item filtering
  const visibleReleases = updates
    .map((update) => {
      const itemMatchesSearch = (item: UpdateItem) => {
        if (!searchQuery) return true;
        const inText =
          item.title.toLowerCase().includes(searchQuery) ||
          item.description.toLowerCase().includes(searchQuery);
        const inTags = item.tags?.some((tag) =>
          tag.toLowerCase().includes(searchQuery)
        );
        return inText || inTags;
      };

      const itemMatchesCategory = (item: UpdateItem) =>
        selectedCategory === "all" ? true : item.category === selectedCategory;

      const filteredItems = update.items.filter(
        (item) =>
          itemMatchesSearch(item) &&
          itemMatchesCategory(item)
      );

      const releaseMatchesSearch =
        !searchQuery ||
        update.title.toLowerCase().includes(searchQuery) ||
        update.description.toLowerCase().includes(searchQuery) ||
        filteredItems.length > 0;

      if (!releaseMatchesSearch) return null;

      return { ...update, filteredItems };
    })
    .filter(Boolean) as (Update & { filteredItems: UpdateItem[] })[];

  const latestRelease = updates[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-indigo-500/30">
      
      {/* Fixed Background Gradient */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-sky-500/5 rounded-full blur-[120px] opacity-50 dark:opacity-20" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] opacity-30 dark:opacity-10" />
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.015] dark:opacity-[0.03]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-950/60 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 relative transition-transform group-hover:scale-110 duration-300">
              <CourseConnectLogo className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
              CourseConnect <span className="text-blue-600 dark:text-blue-500">AI</span>
            </span>
          </Link>
          
          <div className="flex items-center gap-3">
            <ClientThemeToggle />
            <Link href="/login" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="font-medium shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 transition-all duration-300 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white gap-2 border-0">
                Get Started
                <ArrowRight className="w-4 h-4 opacity-70" />
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Progress Bar */}
        <motion.div 
          className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-sky-500 via-sky-400 to-indigo-500"
          style={{ width: "100%", scaleX: scrollYProgress, transformOrigin: "0%" }}
        />
      </header>

      <main className="relative z-10 pb-24">
        
        {/* Hero Section */}
        <div className="relative pt-20 pb-12 md:pt-32 md:pb-20 px-4 overflow-hidden">
          <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight text-slate-900 dark:text-white mb-6 drop-shadow-sm">
              What’s New in <br className="hidden sm:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-600 to-indigo-600 animate-gradient-x">
                CourseConnect AI
              </span>
            </h1>
              
              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                See the latest features, improvements, and fixes that make studying with CourseConnect faster, clearer, and more reliable.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="sticky top-16 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-y border-slate-200/60 dark:border-slate-800/60 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex flex-col gap-2">
            {/* Category filters */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {(["all", "feature", "improvement", "fix"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    selectedCategory === cat
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md"
                      : "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                    aria-label={
                      cat === "all"
                        ? "Show all updates"
                        : cat === "fix"
                        ? "Show fixes"
                        : `Show ${cat}s`
                    }
                  >
                    {cat === "all"
                      ? "All"
                      : cat === "fix"
                      ? "Fixes"
                      : `${cat.charAt(0).toUpperCase() + cat.slice(1)}s`}
                </button>
              ))}
            </div>
            
              <div className="hidden sm:flex items-center relative w-full max-w-[220px]">
              <Search01Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                placeholder="Search updates..." 
                className="pl-9 h-9 bg-slate-100 dark:bg-slate-900 border-transparent focus:bg-white dark:focus:bg-slate-950 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

          </div>
        </div>

        {/* Latest Release Highlights */}
        {latestRelease && !searchQuery && selectedCategory === "all" && (
          <section
            className="max-w-4xl mx-auto px-4 sm:px-6 pt-10"
            aria-label="Latest release highlights"
          >
            <div className="mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
                Latest release spotlight
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Here's what's new in {latestRelease.title} (v{latestRelease.version}).
              </p>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/80 shadow-sm p-5 sm:p-6">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-blue-500/5" />
              <div className="relative">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                    {latestRelease.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {latestRelease.description}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] sm:text-xs font-mono px-2 py-0.5"
                >
                  v{latestRelease.version}
                </Badge>
              </div>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {latestRelease.items.slice(0, 3).map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 flex-shrink-0" />
                    <span>
                      <span className="font-medium">{item.title}</span>
                    </span>
                  </li>
                ))}
              </ul>
              {latestRelease.impact && (
                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 italic">
                  {latestRelease.impact}
                </p>
              )}
              </div>
            </div>
          </section>
        )}

        {/* Timeline Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-16">
          <div className="relative">
            {/* Continuous Line */}
            <div className="absolute left-8 sm:left-[120px] top-0 bottom-0 w-[2px] bg-slate-200 dark:bg-slate-800 hidden sm:block" />

            <AnimatePresence mode="wait">
              {visibleReleases.length > 0 ? (
                visibleReleases.map((update, index) => {
                  const itemsToRender =
                    update.filteredItems && update.filteredItems.length > 0
                      ? update.filteredItems
                      : [];
                  const anchorId = `release-${update.version.replace(/\./g, "-")}`;

                  return (
                  <motion.div 
                    key={update.id}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="relative mb-20 last:mb-0 group"
                    id={anchorId}
                  >
                    {/* Desktop Date Marker */}
                    <div className="absolute left-0 w-[100px] text-right pr-8 pt-2 hidden sm:block">
                      <span className="block text-sm font-bold text-slate-900 dark:text-white">{update.date}</span>
                      <span className="block text-xs text-slate-500 font-mono mt-1">{update.version}</span>
            </div>

                    {/* Timeline Node */}
                    <div className="absolute left-8 sm:left-[120px] -translate-x-1/2 top-2 w-4 h-4 rounded-full border-[3px] border-white dark:border-slate-950 bg-sky-600 shadow-[0_0_0_4px_rgba(56,189,248,0.25)] z-10 hidden sm:block group-hover:scale-125 transition-transform duration-300" />

                    {/* Content Card */}
                    <div className="sm:ml-[160px]">
                      {/* Mobile Date Header */}
                      <div className="sm:hidden flex items-center justify-between mb-4">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{update.date}</span>
                        <Badge variant="outline" className="font-mono text-xs">{update.version}</Badge>
                  </div>

                      <div className="group/card relative bg-white dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-xl hover:border-indigo-500/20 dark:hover:border-indigo-500/20 transition-all duration-300 backdrop-blur-sm overflow-hidden">
                        {/* Gradient Glow Effect on Hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-blue-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        
                        <div className="relative flex items-start justify-between gap-4 mb-8">
                          <div>
                            <div className="flex items-center gap-3 mb-3">
                              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                              {update.title}
                            </h2>
                              <Badge variant="outline" className="text-[10px] font-mono">
                                v{update.version}
                              </Badge>
                              {update.type === 'major' && (
                                <Badge className="bg-sky-600 hover:bg-sky-700 border-0 text-white px-2 py-0.5 text-xs uppercase tracking-wider font-bold shadow-lg shadow-sky-500/20">
                                  Major Release
                                </Badge>
                              )}
                            </div>
                            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                              {highlightMatch(update.description, searchTerm)}
                            </p>
                            {update.impact && (
                              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 italic">
                                {update.impact}
                              </p>
                            )}
                  </div>
                          
                          {/* Decorative Icon for Major Updates */}
                          {update.type === 'major' && (
                            <div className="hidden sm:flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-500/30 transition-transform duration-300">
                              <Rocket01Icon className="w-7 h-7" />
                            </div>
                          )}
                        </div>

                        <div className="space-y-4 relative">
                          {itemsToRender.length > 0 ? (
                            itemsToRender.map((item, i) => (
                            <motion.div 
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.2 + (i * 0.05) }}
                                className="group/item relative flex gap-5 p-5 rounded-xl bg-slate-50/50 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/[0.05] border border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                            >
                              <div className={cn(
                                  "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover/item:scale-110 duration-300 shadow-sm",
                                categoryStyles[item.category].bg,
                                categoryStyles[item.category].color
                              )}>
                                {item.icon}
                              </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 truncate">
                                      {highlightMatch(item.title, searchTerm)}
                                  </h3>
                                  <span className={cn(
                                      "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border",
                                    categoryStyles[item.category].bg,
                                    categoryStyles[item.category].color,
                                    categoryStyles[item.category].border
                                  )}>
                                    {categoryStyles[item.category].label}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {highlightMatch(item.description, searchTerm)}
                                  </p>
                                  
                                  {/* Optional tags for quick scanning */}
                                
                                  {/* Feature Image Placeholder - could be real images later */}
                                  {item.category === 'feature' && item.title.includes("Interactive Graph") && (
                                    <div className="mt-6 w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/50">
                                      <div className="p-4">
                                        <InteractiveGraph 
                                          graphData={{
                                            type: "function",
                                            data: {
                                              function: "a * sin(x)",
                                              parameters: { a: 1 },
                                              parameterConfig: { a: { min: 0.5, max: 3, step: 0.1 } },
                                              minX: -6,
                                              maxX: 6,
                                              title: "Interactive Demo: y = a·sin(x)",
                                              color: "#6366f1"
                                            }
                                          }}
                                          cleanContent=""
                                          className="w-full"
                                        />
                                      </div>
                                    </div>
                                  )}
                              </div>
                            </motion.div>
                            ))
                          ) : (
                            <div className="text-sm text-slate-500 dark:text-slate-400 italic">
                              No items in this release match your current filters.
                            </div>
                          )}
        </div>

                        {/* Card Footer / Reactions */}
                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <div className="flex gap-2">
                            <ReactionButton updateId={update.id} type="thumbsUp" />
                            <ReactionButton updateId={update.id} type="heart" />
                            <ReactionButton updateId={update.id} type="party" />
                          </div>
                          <div className="text-xs text-slate-400 font-medium">
                            Released by CourseConnect Team
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
                })
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20"
                >
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search01Icon className="w-8 h-8 text-slate-400" />
              </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No updates found</h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    Try adjusting your search or filters
              </p>
              <Button 
                variant="outline" 
                    className="mt-4"
                    onClick={() => { setSearchTerm(""); setSelectedCategory("all"); }}
              >
                Clear Filters
              </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
