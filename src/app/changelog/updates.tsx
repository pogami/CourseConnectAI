import React from "react";
import {
  ArrowRight,
  Sparkles,
  Zap,
  BarChart3,
  FileText,
  Shield,
  MessageSquare,
  Star,
  Rocket,
  Search,
} from "lucide-react";

export type Category = "feature" | "improvement" | "fix" | "announcement";

export interface UpdateItem {
  title: string;
  description: string;
  category: Category;
  icon: React.ReactNode;
  image?: string; // Placeholder for future screenshots
  tags?: string[];
}

export interface Update {
  id: string;
  date: string;
  version: string;
  title: string; // Main title for the release
  description: string; // Brief summary
  type: "major" | "minor" | "patch";
  items: UpdateItem[];
  impact?: string; // Why this release matters for students
}

export const updates: Update[] = [
  {
    id: "nov-20-2025",
    date: "November 20, 2025",
    version: "1.2.0",
    title: "The Visualization Update",
    description:
      "Bringing your data to life with interactive charts, refined aesthetics, and smoother interactions.",
    impact:
      "For students, this means you can see where you’re doing well (and where you’re falling behind) at a glance, instead of digging through raw text.",
    type: "major",
    items: [
      {
        category: "feature",
        icon: <BarChart3 className="w-5 h-5" />,
        title: "Interactive Graph & Chart Generation",
        description:
          'Ask the AI to instantly turn formulas and data into visuals. Try prompts like "Graph y = x²" or "Show me a pie chart of my grades" and explore fully interactive charts with zoom and sliders.',
        tags: ["Charts", "Math", "Visualization"],
      },
      {
        category: "improvement",
        icon: <Zap className="w-5 h-5" />,
        title: "Dashboard 2.0",
        description:
          "A complete visual refresh of your dashboard with a clearer layout, better stats, and smoother animations.",
        tags: ["Dashboard", "UI"],
      },
      {
        category: "fix",
        icon: <Shield className="w-5 h-5" />,
        title: "Reliable Document Uploads",
        description:
          "Fixed an issue where complex PDF syllabi would sometimes fail to process. The upload engine is now significantly more robust.",
        tags: ["Uploads", "Reliability"],
      },
      {
        category: "improvement",
        icon: <MessageSquare className="w-5 h-5" />,
        title: "Smarter AI Summaries",
        description:
          "Document summaries are now more concise and structured, helping you get the gist of a 50-page reading in seconds.",
        tags: ["Summaries", "Notes"],
      },
    ],
  },
  {
    id: "nov-15-2025",
    date: "November 15, 2025",
    version: "1.1.0",
    title: "The Study Tools Update",
    description:
      "New ways to turn your chats into study materials and handle your documents.",
    impact:
      "For students, this means less time rewriting notes by hand and more time actually reviewing them.",
    type: "minor",
    items: [
      {
        category: "feature",
        icon: <Sparkles className="w-5 h-5" />,
        title: "AI Notes from Chat",
        description:
          "One-click magic: Turn any chat conversation into a beautifully formatted set of study notes, ready to print or save.",
        tags: ["Notes", "Study"],
      },
      {
        category: "feature",
        icon: <FileText className="w-5 h-5" />,
        title: "Advanced PDF Processing",
        description:
          "We rebuilt our document engine from scratch. It now understands complex layouts, tables, and scientific notation in your uploads much better.",
        tags: ["Uploads", "PDF"],
      },
      {
        category: "improvement",
        icon: <Rocket className="w-5 h-5" />,
        title: "Lightning Fast Uploads",
        description:
          "Optimized file processing means your documents are ready to chat with almost instantly.",
        tags: ["Performance", "Uploads"],
      },
    ],
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
        icon: <BarChart3 className="w-5 h-5" />,
        title: "MY COURSES Section",
        description:
          'Added a dedicated "My Courses" section on the dashboard so you can quickly jump into the classes that matter most.',
        tags: ["Dashboard", "Courses"],
      },
      {
        category: "feature",
        icon: <Sparkles className="w-5 h-5" />,
        title: "Quick Add Course",
        description:
          'New "Add Course" button in the sidebar lets you spin up a new class chat in just a couple of clicks.',
        tags: ["Dashboard", "Courses"],
      },
      {
        category: "improvement",
        icon: <MessageSquare className="w-5 h-5" />,
        title: "Cleaner Empty States",
        description:
          "Improved dashboard messages when you have no courses yet, with clearer prompts to upload your first syllabus.",
        tags: ["Dashboard", "UX"],
      },
    ],
  },
  {
    id: "oct-17-2025",
    date: "October 17, 2025",
    version: "1.0.0",
    title: "Public Beta Launch",
    description:
      "The official release of CourseConnect. Production-ready and open to everyone.",
    impact:
      "Bringing the full CourseConnect experience to students in a stable, trustworthy way marked the start of real-world learning impact.",
    type: "major",
    items: [
      {
        category: "announcement",
        icon: <Rocket className="w-5 h-5" />,
        title: "We Are Live!",
        description:
          "After weeks of testing, CourseConnect is now in Public Beta. Upload your syllabus and meet your new personalized AI tutor.",
      },
      {
        category: "feature",
        icon: <MessageSquare className="w-5 h-5" />,
        title: "Beautiful Math Rendering",
        description:
          "Chatting about Calculus or Physics? We now support full LaTeX rendering, so equations look exactly like they do in your textbook.",
        tags: ["Math", "Rendering"],
      },
      {
        category: "improvement",
        icon: <Zap className="w-5 h-5" />,
        title: "Unified Onboarding",
        description:
          "A seamless new welcome experience gets you from sign up to your first AI conversation in under 60 seconds.",
        tags: ["Onboarding", "UX"],
      },
      {
        category: "fix",
        icon: <Shield className="w-5 h-5" />,
        title: "Authentication & Notifications",
        description:
          "Fixed edge cases with sign-in, notifications, and onboarding slides so everything works smoothly on day one of beta.",
        tags: ["Auth", "Notifications"],
      },
    ],
  },
  {
    id: "oct-13-2025",
    date: "October 13, 2025",
    version: "0.9.5",
    title: "Brand & Communication Refresh",
    description: "Sharpening how CourseConnect looks and talks to students.",
    type: "minor",
    items: [
      {
        category: "feature",
        icon: <Sparkles className="w-5 h-5" />,
        title: "Official Logo & Visuals",
        description:
          "Refreshed CourseConnect’s visuals with an updated logo and more consistent branding across the experience.",
        tags: ["Branding", "UI"],
      },
      {
        category: "feature",
        icon: <FileText className="w-5 h-5" />,
        title: "Email Newsletter",
        description:
          "Introduced an email newsletter so students can receive product updates and study tips directly in their inbox.",
        tags: ["Communication"],
      },
      {
        category: "improvement",
        icon: <MessageSquare className="w-5 h-5" />,
        title: "Notification System Upgrade",
        description:
          "Improved in-app notifications with real-time updates so you never miss important activity in your courses.",
        tags: ["Notifications"],
      },
    ],
  },
  {
    id: "oct-11-2025",
    date: "October 11, 2025",
    version: "0.9.0",
    title: "The Interactive Learning Update",
    description:
      "Introducing powerful new ways to test your knowledge actively.",
    impact:
      "For students, this means you can regularly quiz yourself and get targeted feedback, which is one of the fastest ways to actually remember material.",
    type: "major",
    items: [
      {
        category: "feature",
        icon: <Shield className="w-5 h-5" />,
        title: "Interactive Quiz & Exam System",
        description:
          "Don't just read—practice. The AI can now generate custom quizzes and full practice exams based on your course material.",
        tags: ["Quizzes", "Assessment"],
      },
      {
        category: "feature",
        icon: <MessageSquare className="w-5 h-5" />,
        title: "AI Feedback Loop",
        description:
          "Get instant, constructive feedback on your quiz answers. The AI explains why an answer is right or wrong so you learn faster.",
        tags: ["Quizzes", "Feedback"],
      },
      {
        category: "improvement",
        icon: <Sparkles className="w-5 h-5" />,
        title: "Dark Mode Refinement",
        description:
          "We polished the entire UI for night owls. Dark mode is now consistent, higher contrast, and easier on the eyes.",
        tags: ["UI", "Dark Mode"],
      },
    ],
  },
  {
    id: "sept-30-2025",
    date: "September 30, 2025",
    version: "0.4.0",
    title: "Real‑Time Chat & Live Demo",
    description:
      "Bringing real-time collaboration and a polished live demo experience.",
    type: "major",
    items: [
      {
        category: "feature",
        icon: <MessageSquare className="w-5 h-5" />,
        title: "Real‑Time Class Chat",
        description:
          "Implemented real-time chat channels with typing indicators and pinned public rooms so classmates can collaborate live.",
        tags: ["Chat", "Realtime"],
      },
      {
        category: "feature",
        icon: <Sparkles className="w-5 h-5" />,
        title: "Interactive Welcome Cards",
        description:
          "New interactive welcome cards guide new users through the product and showcase what the AI can do with your courses.",
        tags: ["Onboarding"],
      },
      {
        category: "improvement",
        icon: <Rocket className="w-5 h-5" />,
        title: "Live Demo Improvements",
        description:
          "Enhanced the public demo experience with better sample data and more responsive UI so visitors can try CourseConnect instantly.",
        tags: ["Demo", "Performance"],
      },
    ],
  },
  {
    id: "sept-25-2025",
    date: "September 25, 2025",
    version: "0.3.0",
    title: "Advanced Study Tools",
    description:
      "Experimenting with powerful tools to understand your notes, images, and documents.",
    impact:
      "For students, this means you can bring more of your messy, real-world course materials (images, scanned PDFs) into one place and still get useful help.",
    type: "major",
    items: [
      {
        category: "feature",
        icon: <FileText className="w-5 h-5" />,
        title: "Smart Text Extraction",
        description:
          "Built a comprehensive text extraction pipeline for uploaded files, laying the groundwork for reliable syllabus and document parsing.",
        tags: ["Uploads", "Text Extraction"],
      },
      {
        category: "feature",
        icon: <Sparkles className="w-5 h-5" />,
        title: "AI Vision Experiments",
        description:
          "Added early support for analyzing images and screenshots with OCR, so the AI can start reasoning about visual content.",
        tags: ["Vision", "OCR"],
      },
      {
        category: "improvement",
        icon: <MessageSquare className="w-5 h-5" />,
        title: "Copy‑Friendly Chat UI",
        description:
          "Added convenient copy buttons to messages and code blocks to make it easier to move AI answers into your notes.",
        tags: ["Chat", "UX"],
      },
    ],
  },
  {
    id: "sept-14-2025",
    date: "September 14, 2025",
    version: "0.1.0",
    title: "The Beginning",
    description:
      "The first line of code. The start of our mission to change how students learn.",
    impact:
      "For students, this foundation is why the app feels stable and fast even as we keep shipping new features on top.",
    type: "major",
    items: [
      {
        category: "announcement",
        icon: <Rocket className="w-5 h-5" />,
        title: "Project Genesis",
        description:
          "CourseConnect is born. We laid the foundation for a dual‑AI powered tutor focused on your specific courses.",
      },
      {
        category: "feature",
        icon: <MessageSquare className="w-5 h-5" />,
        title: "Core Chat Engine",
        description:
          "The first iteration of our context‑aware chat is live, able to answer general study questions and guide you through topics.",
        tags: ["Chat"],
      },
      {
        category: "feature",
        icon: <BarChart3 className="w-5 h-5" />,
        title: "Dashboard v1",
        description:
          "A simple, clean home for your courses with quick access to chats and core tools—the starting point for today’s dashboard.",
        tags: ["Dashboard"],
      },
      {
        category: "improvement",
        icon: <Zap className="w-5 h-5" />,
        title: "Mobile‑First & Google Sign‑In",
        description:
          "From day one we focused on real students: better mobile layouts, touch targets, and Google sign‑in so you can get into your account in seconds.",
        tags: ["Mobile", "Auth"],
      },
    ],
  },
];


