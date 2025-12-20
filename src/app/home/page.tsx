"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, BookOpen, Bot, Mail, MessageSquare, Users, Upload, GraduationCap, Send, User, CheckCircle, Sparkles, FileText, Clock, Loader2, X, MessageCircle, TrendingUp, Smartphone, Brain, Mic, Camera, BarChart3, Calendar, Music, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { useChatStore } from "@/hooks/use-chat-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiteFooter } from "@/components/site-footer";
import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { MobileNavigation } from "@/components/mobile-navigation";
import { MobileButton } from "@/components/ui/mobile-button";
import { CourseConnectLogo } from "@/components/icons/courseconnect-logo";
import { LiveActivityWidget } from "@/components/live-activity-widget";
import { GradientStar } from "@/components/icons/gradient-star";
// import { AIBot } from "@/components/ai-bot";

const popularClasses = [
    { name: "BIO-101", description: "Intro to Biology", icon: <Bot className="size-8 text-green-500" />, studentCount: 123 },
    { name: "CS-202", description: "Data Structures", icon: <Users className="size-8 text-blue-500" />, studentCount: 88 },
    { name: "ENG-210", description: "Shakespeare", icon: <MessageSquare className="size-8 text-amber-500" />, studentCount: 45 },
    { name: "HIST-301", description: "American History", icon: <BookOpen className="size-8 text-red-500" />, studentCount: 92 },
    { name: "PSYCH-101", description: "Intro to Psychology", icon: <Bot className="size-8 text-purple-500" />, studentCount: 150 },
    { name: "MATH-203", description: "Linear Algebra", icon: <Users className="size-8 text-indigo-500" />, studentCount: 76 },
]

export default function LandingPage() {
    const { toast } = useToast();

  return (
        <div className="flex min-h-screen flex-col bg-transparent relative">
            <style>
                {`
                    :root {
                        --primary-hsl: 203 76% 70%;
                        --background-hsl: 204 100% 96%;
                    }
                    .dark {
                        --primary-hsl: 203 70% 65%;
                        --background-hsl: 210 15% 12%;
                    }
                    
                    /* Ensure proper centering */
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    
                    .container {
                        width: 100%;
                        margin-left: auto;
                        margin-right: auto;
                    }
                `}
            </style>
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-transparent backdrop-blur supports-[backdrop-filter]:bg-transparent light:bg-white/90 light:backdrop-blur-xl light:border-gray-200/50 light:shadow-sm">
                <div className="container flex h-64 sm:h-80 max-w-6xl mx-auto px-4 sm:px-6 items-center justify-between">
                    <Link href="/home" className="flex items-center gap-2 sm:gap-3 group">
                        {/* CourseConnect Logo */}
                        <CourseConnectLogo className="h-64 w-64 sm:h-80 sm:w-80 group-hover:scale-110 transition-all duration-300" />
                        
                        {/* Enhanced CourseConnect text */}
                        <div className="relative">
                            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight relative">
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
                    
                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-4">
                        <Button variant="ghost" size="sm" className="h-10 text-sm min-h-[44px]" asChild>
                            <Link href="/about">About</Link>
                        </Button>
                        <Button variant="ghost" size="sm" className="h-10 text-sm min-h-[44px]" asChild>
                            <Link href="/features">Features</Link>
                        </Button>
                        <Button variant="ghost" size="sm" className="h-10 text-sm min-h-[44px]" asChild>
                            <Link href="/login">Sign In</Link>
                        </Button>
                        <Button size="sm" className="h-10 text-sm min-h-[44px] bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300" asChild>
                            <Link href="/dashboard">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                    </div>
                    
                    {/* Mobile Navigation */}
                    <div className="flex lg:hidden items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-10 text-xs min-h-[44px] px-2" asChild>
                            <Link href="/login">Sign In</Link>
                                </Button>
                        <Button size="sm" className="h-10 text-xs min-h-[44px] px-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white" asChild>
                            <Link href="/dashboard">Start</Link>
                                </Button>
                    </div>

                </div>
            </header>
            <main className="flex-1">
                <Tabs defaultValue="features" className="w-full">
                    <div className="container max-w-6xl mx-auto px-3 sm:px-6">
                        <TabsList className="grid w-full grid-cols-3 mb-6 sm:mb-8 h-12 sm:h-11 min-h-[48px] sm:min-h-[44px] bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-200/20 dark:border-purple-800/20">
                            <TabsTrigger value="features" className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white min-h-[48px] sm:min-h-[44px]">Features</TabsTrigger>
                            <TabsTrigger value="classes" className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white min-h-[48px] sm:min-h-[44px]">Popular Classes</TabsTrigger>
                            <TabsTrigger value="demo" className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white min-h-[48px] sm:min-h-[44px]">Try Demo</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="features" className="space-y-8 sm:space-y-12 lg:space-y-16">
            {/* Features Section */}
                            <div className="w-full">
                                <div className="text-center mb-8 sm:mb-12 lg:mb-16">
                                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-3 sm:mb-4 lg:mb-6">Everything You Need to Succeed</h2>
                                    <p className="text-sm sm:text-base lg:text-xl text-muted-foreground max-w-3xl mx-auto px-4 sm:px-0">
                            CourseConnect combines AI-powered analysis with collaborative study tools to help you ace every class.
                        </p>
                                </div>
                    
                                {/* Feature Cards Grid */}
                                <div className="grid gap-6 sm:gap-8 lg:gap-10 md:grid-cols-2 lg:grid-cols-3 mb-8 sm:mb-12 lg:mb-16">
                        {/* AI Syllabus Analysis */}
                            <Card className="group relative overflow-hidden bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-900 dark:to-blue-950/20 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 hover:scale-[1.02]">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <CardHeader className="relative z-10">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                        <FileText className="h-8 w-8 text-white" />
                            </div>
                                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">AI Syllabus Analysis</CardTitle>
                                    <CardDescription className="text-base leading-relaxed">
                                Upload any syllabus and get instant insights about course structure, key topics, and study recommendations.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            </div>
                                            <span className="font-medium">Automatic topic extraction</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            </div>
                                            <span className="font-medium">Study schedule suggestions</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            </div>
                                            <span className="font-medium">Difficulty assessment</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        
                        {/* Smart Study Groups */}
                            <Card className="group relative overflow-hidden bg-gradient-to-br from-white to-green-50/50 dark:from-gray-900 dark:to-green-950/20 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 hover:scale-[1.02]">
                                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <CardHeader className="relative z-10">
                                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                        <Users className="h-8 w-8 text-white" />
                            </div>
                                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Smart Study Groups</CardTitle>
                                    <CardDescription className="text-base leading-relaxed">
                                Join or create study groups for your classes. Connect with classmates and collaborate on assignments.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            </div>
                                            <span className="font-medium">Auto-match with classmates</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            </div>
                                            <span className="font-medium">Real-time collaboration</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            </div>
                                            <span className="font-medium">Study session scheduling</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* AI Flashcards */}
                            <Card className="group relative overflow-hidden bg-gradient-to-br from-white to-purple-50/50 dark:from-gray-900 dark:to-purple-950/20 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 hover:scale-[1.02]">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <CardHeader className="relative z-10">
                                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                        <GraduationCap className="h-8 w-8 text-white" />
                            </div>
                                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">AI-Generated Flashcards</CardTitle>
                                    <CardDescription className="text-base leading-relaxed">
                                Automatically create study flashcards from your course materials. Perfect for exam preparation.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            </div>
                                            <span className="font-medium">Smart question generation</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            </div>
                                            <span className="font-medium">Spaced repetition system</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            </div>
                                            <span className="font-medium">Progress tracking</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        
                        {/* CourseConnect AI Assistant */}
                            <Card className="group relative overflow-hidden bg-gradient-to-br from-white to-indigo-50/50 dark:from-gray-900 dark:to-indigo-950/20 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 hover:scale-[1.02]">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <CardHeader className="relative z-10">
                                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                        <MessageCircle className="h-8 w-8 text-white" />
                                    </div>
                                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">CourseConnect AI Assistant</CardTitle>
                                    <CardDescription className="text-base leading-relaxed">
                                        Get instant help with homework, explanations, and study tips from our AI tutor.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            </div>
                                            <span className="font-medium">24/7 homework help</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            </div>
                                            <span className="font-medium">Concept explanations</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            </div>
                                            <span className="font-medium">Study strategy advice</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Progress Tracking */}
                            <Card className="group relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/50 dark:from-gray-900 dark:to-emerald-950/20 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 hover:scale-[1.02]">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <CardHeader className="relative z-10">
                                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                        <TrendingUp className="h-8 w-8 text-white" />
                                    </div>
                                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Progress Tracking</CardTitle>
                                    <CardDescription className="text-base leading-relaxed">
                                        Monitor your academic progress across all classes with detailed analytics and insights.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            </div>
                                            <span className="font-medium">Grade predictions</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            </div>
                                            <span className="font-medium">Study time analytics</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            </div>
                                            <span className="font-medium">Performance insights</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Live Activity Widget */}
                            <div className="md:col-span-2 lg:col-span-1">
                                <LiveActivityWidget />
                            </div>

                            {/* Enhanced Mobile App */}
                            <Card className="group relative overflow-hidden bg-gradient-to-br from-white to-orange-50/50 dark:from-gray-900 dark:to-orange-950/20 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 hover:scale-[1.02] mobile-card">
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <CardHeader className="relative z-10 mobile-spacing">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                                        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg touch-manipulation">
                                            <Smartphone className="h-8 w-8 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">
                                                Study Anywhere
                                            </h3>
                                            <p className="text-sm sm:text-base text-orange-600 dark:text-orange-400 font-medium">
                                                Mobile-First Learning
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300 mb-4">
                                        Take CourseConnect with you everywhere. Our mobile-optimized interface provides seamless access to all features on any device.
                                    </p>
                                </CardHeader>
                                <CardContent className="relative z-10 mobile-spacing">
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            </div>
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Optimized AI chat interface</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            </div>
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Touch-friendly flashcards</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            </div>
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Push notifications & reminders</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            </div>
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Responsive study groups</span>
                                        </div>
                                    </div>
                                    
                                    {/* Mobile Demo Preview */}
                                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 mb-4">
                                        <div className="text-center">
                                            <div className="inline-block bg-white dark:bg-gray-900 rounded-xl p-2 shadow-sm">
                                                <div className="w-24 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                                    <Smartphone className="h-6 w-6 text-white" />
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
                                                Mobile Interface
                                            </p>
                                        </div>
                                    </div>

                                    {/* Mobile CTA */}
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Link href="/login" className="flex-1">
                                            <MobileButton className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 touch-manipulation mobile-full-width" mobileSize="md">
                                                Try Mobile App
                                            </MobileButton>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                                </div>
                            </div>
                        </TabsContent>
                        
                        <TabsContent value="classes">
                            <div className="w-full">
                                <h2 className="text-3xl font-bold tracking-tight mb-6 text-center">Popular Classes</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                    {popularClasses.map((pClass) => (
                                        <Card key={pClass.name} className="flex flex-col items-center text-center p-4 transition-all hover:shadow-xl hover:-translate-y-1 bg-card/80 backdrop-blur-sm">
                                            <div className="mb-3 p-3 rounded-full bg-primary/10">
                                                {pClass.icon}
                                            </div>
                                            <h3 className="font-semibold text-sm mb-1">{pClass.name}</h3>
                                            <p className="text-xs text-muted-foreground mb-2">{pClass.description}</p>
                                            <Badge variant="secondary" className="text-xs">
                                                {pClass.studentCount} students
                                            </Badge>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>
                        
                        <TabsContent value="demo" className="space-y-8">
                            <div className="w-full">
                                <div className="text-center mb-8">
                                    <div className="flex items-center justify-center gap-3 mb-4">
                                        <GradientStar size={32} className="animate-pulse" />
                                        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Try CourseConnect Demo</h2>
                                        <GradientStar size={32} className="animate-pulse" style={{ animationDelay: '0.5s' }} />
                                    </div>
                                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                        Experience how CourseConnect works with our interactive demo. Join a sample class chat and see AI assistance in action!
                                    </p>
                                </div>

                                {/* Demo Chat Interface */}
                                <Card className="max-w-4xl mx-auto">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <GradientStar size={20} className="animate-pulse" />
                                            <MessageSquare className="h-5 w-5 text-primary" />
                                            CS-101 Study Group - Live Demo
                                        </CardTitle>
                                        <CardDescription>
                                            This is a live demo of CourseConnect's class chat. Try asking questions and see how our AI helps!
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {/* Chat Messages */}
                                        <div className="h-80 overflow-y-auto space-y-4 mb-4 p-4 bg-muted/20 rounded-lg">
                                            {/* Demo Messages */}
                                            <div className="flex gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="bg-blue-500 text-white">JS</AvatarFallback>
                                                </Avatar>
                                                <div className="bg-background border rounded-lg p-3 max-w-[80%]">
                                                    <div className="font-semibold text-sm mb-1">John Smith</div>
                                                    <div className="text-sm">Hey everyone! Can someone help me understand recursion in our assignment?</div>
                                                    <div className="text-xs text-muted-foreground mt-1">2 minutes ago</div>
                                                </div>
                                            </div>

                                            <div className="flex gap-3">
                                                <div className="h-8 w-8 flex items-center justify-center">
                                                    <GradientStar size={24} className="animate-pulse" />
                                                </div>
                                                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 max-w-[80%]">
                                                    <div className="font-semibold text-sm mb-1 flex items-center gap-1">
                                                        <GradientStar size={12} className="animate-pulse" />
                                                        CourseConnect AI
                                                    </div>
                                                    <div className="text-sm">
                                                        A derivative is the rate of change of a function. Think speed - how fast something changes.
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-1">Just now</div>
                                                </div>
                                            </div>

                                            <div className="flex gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="bg-purple-500 text-white">SM</AvatarFallback>
                                                </Avatar>
                                                <div className="bg-background border rounded-lg p-3 max-w-[80%]">
                                                    <div className="font-semibold text-sm mb-1">Sarah Miller</div>
                                                    <div className="text-sm">Thanks AI! That really helped. Can you also explain how to implement a binary search recursively?</div>
                                                    <div className="text-xs text-muted-foreground mt-1">1 minute ago</div>
                                                </div>
                                            </div>

                                            <div className="flex gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="bg-green-500 text-white">AI</AvatarFallback>
                                                </Avatar>
                                                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 max-w-[80%]">
                                                    <div className="font-semibold text-sm mb-1 flex items-center gap-1">
                                                        <Bot className="h-3 w-3" />
                                                        CourseConnect AI
                                                    </div>
                                                    <div className="text-sm">
                                                        Absolutely! Here's how binary search works recursively:
                                                        <br/><br/>
                                                        <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
{`function binarySearch(arr, target, left = 0, right = arr.length - 1) {
    if (left > right) return -1;  // Base case
    
    const mid = Math.floor((left + right) / 2);
    
    if (arr[mid] === target) return mid;  // Found it!
    if (arr[mid] > target) return binarySearch(arr, target, left, mid - 1);
    return binarySearch(arr, target, mid + 1, right);
}`}
                                                        </pre>
                                                        <br/>
                                                        <strong>Mathematical Concept:</strong>
                                                        <br/>Time Complexity: O(log₂n) - logarithmic time
                                                        <br/>Space Complexity: O(log₂n) - recursive calls
                                                        <br/><br/>
                                                        The key is dividing the search space in half each time!
                                                        <br/>Example: Searching 1000 items takes only ~10 comparisons!
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-1">Just now</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Chat Input */}
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Ask a question or share something..."
                                                className="flex-1"
                                            />
                                            <Button disabled className="bg-gradient-to-r from-purple-500 to-blue-600 text-white">
                                                <Send className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="text-xs text-muted-foreground text-center mt-2">
                                            💡 <strong>Demo Mode:</strong> This is a preview of CourseConnect's class chat. 
                                            <Link href="/dashboard/chat" className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent hover:underline ml-1 font-semibold">
                                                Try the real thing →
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Demo Features */}
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
                                    <Card className="text-center p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200/20 dark:border-purple-800/20">
                                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                                            <MessageSquare className="h-6 w-6 text-white" />
                                        </div>
                                        <h3 className="font-semibold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Real-time Chat</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Instant messaging with classmates and AI assistance
                                        </p>
                                    </Card>

                                    <Card className="text-center p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200/20 dark:border-purple-800/20">
                                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                                            <Bot className="h-6 w-6 text-white" />
                                        </div>
                                        <h3 className="font-semibold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">AI Homework Help</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Get instant explanations and step-by-step solutions
                                        </p>
                                    </Card>

                                    <Card className="text-center p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200/20 dark:border-purple-800/20">
                                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                                            <Users className="h-6 w-6 text-white" />
                                        </div>
                                        <h3 className="font-semibold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Study Groups</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Collaborate with classmates on assignments and projects
                                        </p>
                                    </Card>
                                </div>

                                {/* CTA */}
                                <div className="text-center mt-8">
                                    <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105" asChild>
                                        <Link href="/dashboard/upload">
                                            Start Your Free Trial <ArrowRight className="ml-2" />
                                        </Link>
                                    </Button>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        No credit card required • Join thousands of students
                                    </p>
                                </div>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>

            {/* Scholar Features Section */}
                <div className="py-16 bg-transparent">
                    <div className="container max-w-6xl mx-auto px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold tracking-tight mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                            Scholar Features
                        </h2>
                            <p className="text-lg text-blue-700 dark:text-blue-300 max-w-3xl mx-auto">
                            Advanced tools designed for serious students who want to excel academically
                            </p>
                        </div>
                        
                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {/* Advanced AI Tutor */}
                            <Card className="bg-white/80 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                                <CardHeader>
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center mb-4">
                                        <Brain className="h-6 w-6 text-white" />
                                    </div>
                                    <CardTitle className="text-xl text-purple-800 dark:text-purple-200">Advanced AI Tutor</CardTitle>
                                    <CardDescription className="text-purple-600 dark:text-purple-400">
                                        Specialized AI tutors for Math, Science, Programming, and more subjects
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2 text-sm text-purple-700 dark:text-purple-300">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-purple-500" />
                                            Subject-specific expertise
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-purple-500" />
                                            Step-by-step problem solving
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-purple-500" />
                                            Advanced concept explanations
                                        </li>
                                    </ul>
                                </CardContent>
                            </Card>

                            {/* Voice & Image Analysis */}
                            <Card className="bg-white/80 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                                <CardHeader>
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center mb-4">
                                        <Mic className="h-6 w-6 text-white" />
                            </div>
                                    <CardTitle className="text-xl text-purple-800 dark:text-purple-200">Multi-Modal AI</CardTitle>
                                    <CardDescription className="text-purple-600 dark:text-purple-400">
                                Voice input and image analysis for comprehensive learning support
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2 text-sm text-purple-700 dark:text-purple-300">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-purple-500" />
                                            Voice-to-text questions
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-purple-500" />
                                            Image and diagram analysis
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-purple-500" />
                                            Handwritten text recognition
                                        </li>
                            </ul>
                                </CardContent>
                            </Card>
                        
                        {/* Grade Predictions */}
                            <Card className="bg-white/80 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                                <CardHeader>
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center mb-4">
                                        <TrendingUp className="h-6 w-6 text-white" />
                            </div>
                                    <CardTitle className="text-xl text-purple-800 dark:text-purple-200">Grade Predictions</CardTitle>
                                    <CardDescription className="text-purple-600 dark:text-purple-400">
                                AI-powered grade predictions with personalized recommendations
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2 text-sm text-purple-700 dark:text-purple-300">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-purple-500" />
                                            Performance analytics
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-purple-500" />
                                            Study time optimization
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-purple-500" />
                                            Improvement suggestions
                                        </li>
                            </ul>
                                </CardContent>
                            </Card>

                            {/* Calendar Integration */}
                            <Card className="bg-white/80 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                                <CardHeader>
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center mb-4">
                                        <Calendar className="h-6 w-6 text-white" />
                            </div>
                                    <CardTitle className="text-xl text-purple-800 dark:text-purple-200">Smart Scheduling</CardTitle>
                                    <CardDescription className="text-purple-600 dark:text-purple-400">
                                Google Calendar integration for better time management
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2 text-sm text-purple-700 dark:text-purple-300">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-purple-500" />
                                            Automatic study reminders
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-purple-500" />
                                            Assignment deadlines
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-purple-500" />
                                            Exam preparation scheduling
                                        </li>
                            </ul>
                                </CardContent>
                            </Card>
                        
                        {/* Focus Music */}
                            <Card className="bg-white/80 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                                <CardHeader>
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center mb-4">
                                        <Music className="h-6 w-6 text-white" />
                            </div>
                                    <CardTitle className="text-xl text-purple-800 dark:text-purple-200">Focus Music</CardTitle>
                                    <CardDescription className="text-purple-600 dark:text-purple-400">
                                Curated study playlists and ambient sounds for concentration
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2 text-sm text-purple-700 dark:text-purple-300">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-purple-500" />
                                            Spotify integration
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-purple-500" />
                                            Study-focused playlists
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-purple-500" />
                                            Ambient background sounds
                                        </li>
                            </ul>
                                </CardContent>
                            </Card>
                        
                        {/* Advanced Analytics */}
                            <Card className="bg-white/80 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                                <CardHeader>
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center mb-4">
                                        <BarChart3 className="h-6 w-6 text-white" />
                            </div>
                                    <CardTitle className="text-xl text-purple-800 dark:text-purple-200">Advanced Analytics</CardTitle>
                                    <CardDescription className="text-purple-600 dark:text-purple-400">
                                Detailed insights into your learning patterns and progress
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2 text-sm text-purple-700 dark:text-purple-300">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-purple-500" />
                                            Learning pattern analysis
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-purple-500" />
                                            Progress tracking
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-purple-500" />
                                            Performance insights
                                        </li>
                            </ul>
                                </CardContent>
                            </Card>
                      </div>
                    
                        {/* CTA for Scholar Features */}
                    <div className="text-center mt-12">
                            <Button 
                                size="lg" 
                                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                                onClick={() => {
                                    // Activate trial and redirect to advanced dashboard
                                    const { activateTrial } = useChatStore.getState();
                                    activateTrial();
                                    toast({
                                        title: "Trial Activated! 🎉",
                                        description: "Your 14-day Scholar Features trial has started. Enjoy unlimited access!",
                                    });
                                    // Small delay to show toast, then redirect
                                    setTimeout(() => {
                                        window.location.href = '/dashboard/advanced';
                                    }, 1000);
                                }}
                            >
                                Unlock Scholar Features <ArrowRight className="ml-2" />
                        </Button>
                            <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                            Try Scholar features free for 14 days • No credit card required
                        </p>
          </div>
        </div>
                </div>

                {/* Statistics Section */}
                <div className="py-16 bg-transparent">
                    <div className="container max-w-6xl mx-auto px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold tracking-tight mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                            Trusted by Students Across the U.S.
                        </h2>
                            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                            Join students who are already succeeding with CourseConnect's AI-powered study tools
                        </p>
                    </div>
                    
                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                            {/* AI-Powered Tools */}
                        <div className="text-center">
                                <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">AI-Powered</div>
                                <div className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">Study Tools</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Smart analysis</div>
                        </div>

                            {/* U.S. Universities */}
                        <div className="text-center">
                                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">U.S.</div>
                                <div className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">Universities</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Nationwide coverage</div>
                        </div>

                            {/* Free to Start */}
                        <div className="text-center">
                                <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">Free</div>
                                <div className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">To Start</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">No upfront cost</div>
                    </div>

                            {/* Success Focus */}
                            <div className="text-center">
                                <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">Success</div>
                                <div className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">Focused</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">Grade improvement</div>
                            </div>
                        </div>
                        
                        {/* Testimonials */}
                        <div className="mt-16">
                            <h3 className="text-2xl font-bold text-center mb-8 text-blue-800 dark:text-blue-200">What Students Say</h3>
                            <div className="grid gap-6 md:grid-cols-3">
                                <Card className="bg-white/80 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-1 mb-3">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                            ))}
                                        </div>
                                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                                            "CourseConnect helped me improve my grades by 15% this semester. The AI tutor is incredible!"
                                        </p>
                                        <div className="font-semibold text-blue-800 dark:text-blue-200">Sarah M.</div>
                                        <div className="text-xs text-blue-600 dark:text-blue-400">Computer Science Student</div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-white/80 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-1 mb-3">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                            ))}
                                        </div>
                                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                                "The study groups feature connected me with amazing classmates. We aced our finals together!"
                            </p>
                                        <div className="font-semibold text-blue-800 dark:text-blue-200">Alex K.</div>
                                        <div className="text-xs text-blue-600 dark:text-blue-400">Biology Major</div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-white/80 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-1 mb-3">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                            ))}
                                </div>
                                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                                "The flashcards feature is a game-changer. I went from C+ to A- in organic chemistry!"
                            </p>
                                        <div className="font-semibold text-blue-800 dark:text-blue-200">Maria R.</div>
                                        <div className="text-xs text-blue-600 dark:text-blue-400">Chemistry Student</div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                        </div>
                        
                {/* Dedicated Mobile Section Removed */}
                <div className="py-12 sm:py-16 lg:py-20">
                </div>

            </main>
            
            {/* Pricing Section */}
            <section id="features" className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
                <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12 sm:mb-16">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 sm:mb-6">
                            Simple, Transparent{' '}
                            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Pricing
                            </span>
                        </h2>
                        <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
                            Choose the plan that works best for you. Start free and upgrade as you need more features.
                        </p>
                    </div>
                    {/* FeaturesSection Removed */}
                </div>
            </section>
            
            {/* Comprehensive Footer with Links and Logs */}
            <SiteFooter />


            <Toaster />


            
            {/* PWA Install Prompt */}
            
            {/* AIBot hidden per request */}
    </div>
    );
}