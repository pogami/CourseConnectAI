
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, BookUser, MessageSquare, Users, Calendar, TrendingUp, ArrowRight, Sparkles, LogOut, Globe, Zap, UserPlus, Plus, FileText } from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect } from 'react';
import { useChatStore } from "@/hooks/use-chat-store";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/client-simple";
import { toast } from "sonner";
import { UnifiedLoadingAnimation } from "@/components/unified-loading-animation";

export default function ClassOverviewPage() {
    const { chats, setCurrentTab, deleteChat, addChat, joinPublicGeneralChat, subscribeToChat } = useChatStore();
    const router = useRouter();
    const [user] = useAuthState(auth);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [transitioningTo, setTransitioningTo] = useState("");
    const [liveStats, setLiveStats] = useState({
        totalClasses: 0,
        upcomingExams: 0,
        totalMessages: 0,
        assignmentsDue: 0
    });
    const [recentJoins, setRecentJoins] = useState<Array<{name: string, time: string, class: string}>>([]);

    // Filter chats - exclude private-general-chat, only show General and user-uploaded classes
    const classChats = Object.entries(chats).filter(([key, chat]) => 
        key !== 'private-general-chat' && 
        key !== 'private-general-chat-guest' &&
        chat.chatType === 'class'
    );
    const publicChat = chats['public-general-chat'];

    // Calculate real-time stats from actual chat data
    useEffect(() => {
        const calculateRealStats = () => {
            // Total messages across all chats today
            const today = new Date();
            const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            
            const totalMessagesToday = Object.values(chats).reduce((total, chat) => {
                return total + (chat.messages || []).filter(msg => 
                    msg.timestamp && new Date(msg.timestamp) >= todayStart
                ).length;
            }, 0);

            // Count class chats
            const totalClasses = classChats.length;

            // Count upcoming exams (within next 30 days)
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            const now = new Date();
            
            let upcomingExams = 0;
            Object.values(chats).forEach(chat => {
                if (chat.chatType === 'class' && chat.courseData?.exams) {
                    chat.courseData.exams.forEach(exam => {
                        if (exam.date) {
                            const examDate = new Date(exam.date);
                            if (examDate >= now && examDate <= thirtyDaysFromNow) {
                                upcomingExams++;
                            }
                        }
                    });
                }
            });

            // Count assignments due (within next 7 days)
            const sevenDaysFromNow = new Date();
            sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
            
            let assignmentsDue = 0;
            Object.values(chats).forEach(chat => {
                if (chat.chatType === 'class' && chat.courseData?.assignments) {
                    chat.courseData.assignments.forEach(assignment => {
                        if (assignment.dueDate) {
                            const dueDate = new Date(assignment.dueDate);
                            if (dueDate >= now && dueDate <= sevenDaysFromNow) {
                                assignmentsDue++;
                            }
                        }
                    });
                }
            });

            setLiveStats({
                totalClasses: totalClasses,
                upcomingExams: upcomingExams,
                totalMessages: totalMessagesToday,
                assignmentsDue: assignmentsDue
            });
        };

        calculateRealStats();
        const interval = setInterval(calculateRealStats, 5000); // Update every 5 seconds

        return () => clearInterval(interval);
    }, [chats, classChats.length]);

    // Subscribe to public chat for real stats
    useEffect(() => {
        subscribeToChat('public-general-chat');
    }, [subscribeToChat]);

    const handleJoinPublicChat = async () => {
        try {
            await joinPublicGeneralChat();
            router.push('/dashboard/chat?tab=public-general-chat');
            toast({
                title: "Joined Public Chat",
                description: "You can now chat with everyone. Type @ai to call the AI.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to join public chat. Please try again.",
                variant: "destructive",
            });
        }
    };

    useEffect(() => {
        // Prefetch chat page to reduce navigation latency
        try { (router as any).prefetch?.('/dashboard/chat'); } catch {}
    }, [router]);

    const handleCardClick = (chatId: string, chatTitle: string) => {
        // Navigate immediately for snappy UX
        setCurrentTab(chatId);
        router.push('/dashboard/chat?tab=' + encodeURIComponent(chatId));
    }

    const handleLeaveClass = async (chatId: string, chatTitle: string, event?: React.MouseEvent) => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        console.log('🔴 Leave button clicked:', { chatId, chatTitle });
        try {
            await deleteChat(chatId);
            console.log('✅ Chat deleted successfully');
            toast.error(`You left ${chatTitle}`, {
                description: "You have successfully left the class",
                duration: 3000,
            });
            // No redirect - stay on overview page
        } catch (error) {
            console.error('❌ Error deleting chat:', error);
            toast.error("Failed to leave class", {
                description: "Please try again",
                duration: 3000,
            });
        }
    }

    // Get clean display name for chat
    const getChatDisplayName = (chat: any, chatId: string) => {
        // If chat has a proper title, use it
        if (chat.title && !chat.title.includes('private-general-chat')) {
            return chat.title;
        }
        
        // If it's a class chat with course data, use course name
        if (chat.courseData?.courseName) {
            return chat.courseData.courseName;
        }
        
        // If it's the public general chat, show "Community"
        if (chatId === 'public-general-chat') {
            return 'Community';
        }
        
        // If it's private general chat, show "General"
        if (chatId === 'private-general-chat') {
            return 'General';
        }
        
        // Fallback to cleaned chat ID
        return chatId.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    // Calculate real-time stats for each class
    const getRealTimeStats = (chat: any) => {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        // Messages today
        const messagesToday = (chat.messages || []).filter((msg: any) => 
            msg.timestamp && new Date(msg.timestamp) >= todayStart
        ).length;

        // Last active time and status
        const lastMessage = chat.messages?.[chat.messages.length - 1];
        let lastActive = '—';
        let status: 'active' | 'recent' | 'inactive' = 'inactive';
        let statusText = 'Inactive';
        let statusClass = 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
        
        if (lastMessage?.timestamp) {
            const timeDiff = Date.now() - lastMessage.timestamp;
            if (timeDiff < 60000) {
                lastActive = 'just now';
                status = 'active';
                statusText = 'Active';
                statusClass = 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
            } else if (timeDiff < 3600000) {
                lastActive = `${Math.floor(timeDiff / 60000)}m ago`;
                status = 'active';
                statusText = 'Active';
                statusClass = 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
            } else if (timeDiff < 86400000) {
                lastActive = `${Math.floor(timeDiff / 3600000)}h ago`;
                status = 'recent';
                statusText = 'Recent';
                statusClass = 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
            } else if (timeDiff < 604800000) {
                lastActive = `${Math.floor(timeDiff / 86400000)}d ago`;
                status = 'recent';
                statusText = 'Recent';
                statusClass = 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
            } else {
                lastActive = `${Math.floor(timeDiff / 86400000)}d ago`;
                status = 'inactive';
                statusText = 'Inactive';
                statusClass = 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
            }
        }

        // Calculate real students enrolled (use members array or count unique user IDs from messages)
        let studentsEnrolled = 1; // Default to 1 (at least the current user)
        
        if (chat.members && Array.isArray(chat.members)) {
            // Use actual members array if available
            studentsEnrolled = Math.max(chat.members.length, 1);
        } else {
            // Count unique user IDs from messages (excluding bot messages)
            const uniqueUserIds = new Set(
                (chat.messages || [])
                    .filter((msg: any) => msg.sender === 'user' && msg.userId)
                    .map((msg: any) => msg.userId)
            );
            // Also count unique senders who are users (for backward compatibility)
            const uniqueUserSenders = new Set(
                (chat.messages || [])
                    .filter((msg: any) => msg.sender === 'user')
                    .map((msg: any) => msg.userId || msg.name || msg.sender)
            );
            studentsEnrolled = Math.max(uniqueUserIds.size || uniqueUserSenders.size, 1);
        }

        return {
            students: studentsEnrolled,
            activity: messagesToday,
            lastActive: lastActive,
            status: status,
            statusText: statusText,
            statusClass: statusClass
        };
    };

    return (
        <div className="min-h-screen bg-transparent">
            {/* Transition Loader */}
            {isTransitioning && (
                <UnifiedLoadingAnimation 
                    mode="transition"
                    fromPage="Dashboard" 
                    toPage={transitioningTo}
                />
            )}
            <div className="space-y-8 animate-in fade-in-50">
                {/* Hero Section - Mobile Optimized */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/50 dark:from-gray-900 dark:via-blue-950/20 dark:to-indigo-950/20 p-6 sm:p-10 border border-white/60 dark:border-white/10 shadow-sm">
                    <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.03] dark:opacity-[0.08]"></div>
                    <div className="relative z-10">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-6">
                            <div className="p-3 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 w-fit">
                                <BookUser className="size-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                                        Class Overview
                                    </h1>
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border-blue-200 dark:border-blue-800 px-3 py-1 text-xs sm:text-sm font-medium">
                                        {classChats.length} Active {classChats.length === 1 ? 'Class' : 'Classes'}
                                    </Badge>
                                </div>
                                <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
                                    Track your academic progress, access study groups, and manage your assignments all in one place.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Live Stats Overview - Real-time Updates */}
                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-0 shadow-sm bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-100 dark:border-gray-800 transition-all duration-300 hover:bg-white/80 dark:hover:bg-gray-900/60 hover:shadow-md hover:-translate-y-0.5">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20">
                                    <BookUser className="size-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{liveStats.totalClasses}</p>
                                    <p className="text-sm font-medium text-muted-foreground">Enrolled Classes</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="border-0 shadow-sm bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-100 dark:border-gray-800 transition-all duration-300 hover:bg-white/80 dark:hover:bg-gray-900/60 hover:shadow-md hover:-translate-y-0.5">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-green-500/10 dark:bg-green-500/20">
                                    <Calendar className="size-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{liveStats.upcomingExams}</p>
                                    <p className="text-sm font-medium text-muted-foreground">Upcoming Exams</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="border-0 shadow-sm bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-100 dark:border-gray-800 transition-all duration-300 hover:bg-white/80 dark:hover:bg-gray-900/60 hover:shadow-md hover:-translate-y-0.5">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20">
                                    <MessageSquare className="size-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{liveStats.totalMessages}</p>
                                    <p className="text-sm font-medium text-muted-foreground">Activity Today</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm bg-white/60 dark:bg-gray-900/40 backdrop-blur-md border border-gray-100 dark:border-gray-800 transition-all duration-300 hover:bg-white/80 dark:hover:bg-gray-900/60 hover:shadow-md hover:-translate-y-0.5">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20">
                                    <FileText className="size-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{liveStats.assignmentsDue}</p>
                                    <p className="text-sm font-medium text-muted-foreground">Due This Week</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>


                {/* Removed Live Activity feed per request */}

                {/* Classes Grid */}
                {classChats.length > 0 ? (
                    <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Your Classes</h2>
                                <p className="text-muted-foreground">Manage your enrolled courses and study groups</p>
                            </div>
                            <Button asChild variant="outline" className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-gray-200 dark:border-gray-800 hover:bg-white/80 dark:hover:bg-gray-900/80 transition-all shadow-sm">
                                <Link href="/dashboard/upload">
                                    <Plus className="size-4 mr-2" />
                                    Add New Class
                                </Link>
                            </Button>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {classChats.map(([id, chat]) => {
                                const stats = getRealTimeStats(chat);
                                return (
                                    <Card 
                                        key={id} 
                                        onClick={() => handleCardClick(id, chat.title)}
                                        className="group cursor-pointer relative overflow-hidden border-0 bg-white/70 dark:bg-gray-900/50 backdrop-blur-xl transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:-translate-y-1 ring-1 ring-gray-200/50 dark:ring-gray-800/50 hover:ring-blue-500/30 dark:hover:ring-blue-400/30"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-transparent dark:from-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        
                                        <CardHeader className="pb-4 relative">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="p-2.5 rounded-xl bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-100 dark:ring-gray-700 group-hover:scale-105 transition-transform duration-300">
                                                    <BookUser className="size-6 text-blue-600 dark:text-blue-400"/>
                                                </div>
                                                <Badge variant="secondary" className={`${stats.statusClass} shadow-sm border-0`}>
                                                    {stats.statusText}
                                                </Badge>
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl mb-1 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                    {getChatDisplayName(chat, id)}
                                                </CardTitle>
                                                <CardDescription className="flex items-center gap-2">
                                                    <Users className="size-3.5" />
                                                    {stats.students} students enrolled
                                                </CardDescription>
                                            </div>
                                        </CardHeader>
                                        
                                        <CardContent className="relative pt-0">
                                            <div className="grid grid-cols-2 gap-3 py-4 border-t border-gray-100 dark:border-gray-800/50">
                                                <div className="space-y-1">
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                        <MessageSquare className="size-3.5" />
                                                        Activity
                                                    </p>
                                                    <p className="font-semibold text-sm">{stats.activity} today</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                        <Calendar className="size-3.5" />
                                                        Last Active
                                                    </p>
                                                    <p className="font-semibold text-sm">{stats.lastActive}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-col gap-2 mt-2">
                                                <div className="flex gap-2">
                                                    <Button 
                                                        className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 shadow-sm hover:shadow transition-all"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCardClick(id, getChatDisplayName(chat, id));
                                                        }}
                                                    >
                                                        Join Chat
                                                        <ArrowRight className="size-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                        onClick={(e) => handleLeaveClass(id, getChatDisplayName(chat, id), e)}
                                                    >
                                                        <LogOut className="size-4" />
                                                    </Button>
                                                </div>
                                                <Link 
                                                    href={`/dashboard/course/${encodeURIComponent(id)}/feed`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        console.log('Course Feed link clicked:', { id, chatTitle: getChatDisplayName(chat, id) });
                                                    }}
                                                    className="w-full"
                                                >
                                                    <Button 
                                                        variant="outline"
                                                        className="w-full border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                                                    >
                                                        <MessageSquare className="size-4 mr-2" />
                                                        Course Feed
                                                    </Button>
                                                </Link>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <Card className="border-0 shadow-lg bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl ring-1 ring-gray-200/50 dark:ring-gray-800/50">
                        <CardContent className="py-20">
                            <div className="text-center space-y-8">
                                <div className="relative w-fit mx-auto">
                                    <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full" />
                                    <div className="relative p-8 rounded-3xl bg-white dark:bg-gray-800 shadow-xl ring-1 ring-gray-100 dark:ring-gray-700">
                                        <BookUser className="size-12 text-blue-600 dark:text-blue-400" />
                                    </div>
                                </div>
                                <div className="space-y-3 max-w-lg mx-auto">
                                    <h3 className="text-2xl font-bold tracking-tight">No Classes Found</h3>
                                    <p className="text-muted-foreground text-lg">
                                        Get started by uploading your first syllabus to discover and join study groups for your classes.
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                                    <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-105">
                                        <Link href="/dashboard/upload">
                                            <Upload className="mr-2 h-5 w-5" />
                                            Upload Syllabus
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" size="lg" className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all hover:scale-105">
                                        <Link href="/dashboard/chat">
                                            <MessageSquare className="mr-2 h-5 w-5" />
                                            Browse General Chat
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Call to Action */}
                {classChats.length > 0 && (
                    <div className="mt-8 relative overflow-hidden rounded-2xl border border-border bg-background/50 dark:bg-background/20 p-6 sm:p-8">
                        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="space-y-2 text-center sm:text-left max-w-2xl">
                                <h3 className="text-xl sm:text-2xl font-bold">Ready to add more classes?</h3>
                                <p className="text-muted-foreground">
                                    Upload additional syllabi to create course-specific AI chats, track assignments, and unlock personalized study tools.
                                </p>
                            </div>
                            <Button asChild size="lg" className="shadow-sm whitespace-nowrap min-w-[180px]">
                                <Link href="/dashboard/upload">
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload Syllabus
                                </Link>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
