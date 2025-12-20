"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GraduationCap, Brain, Target, Zap, Sparkles, BookOpen, ArrowRight, TrendingUp, Clock, CheckCircle, RefreshCw, Plus, Eye, X, BarChart3, AlertCircle, ThumbsUp, ThumbsDown, Trash2, Info } from "lucide-react";
import FlashcardGenerator from "@/components/flashcard-generator";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/client-simple";
import { collection, getDocs, addDoc, query, limit, onSnapshot, where, deleteDoc, doc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/client-simple";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { LatexMathRenderer } from "@/components/latex-math-renderer";

interface FlashcardSet {
  id: string;
  title: string;
  topic: string;
  flashcards: Array<{
    front: string;
    back: string;
  }>;
  createdAt: string;
  userId: string;
  studyStats: {
    totalStudies: number;
    correctAnswers: number;
    lastStudied?: string;
  };
}

const studyTips = [
  "Review flashcards daily for best results",
  "Focus on difficult cards more frequently",
  "Use the shuffle feature to avoid memorizing order",
  "Take breaks between study sessions"
];

export default function FlashcardsPage() {
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAnalyticsPopup, setShowAnalyticsPopup] = useState(false);
  const [studyAnalytics, setStudyAnalytics] = useState<any[]>([]);
  const [showSetAnalyticsPopup, setShowSetAnalyticsPopup] = useState(false);
  const [selectedSetAnalytics, setSelectedSetAnalytics] = useState<any[]>([]);
  const [selectedSetTitle, setSelectedSetTitle] = useState('');
  const [user] = useAuthState(auth);
  const { toast } = useToast();

  // Add timeout fallback to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('Loading timeout reached, setting loading to false');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  // Function to load flashcard sets
  const loadFlashcardSets = async () => {
    if (!user) return;

    const q = query(
      collection(db, 'flashcardSets'),
      where('userId', '==', user.uid)
    );

    try {
      const snapshot = await getDocs(q);
      const sets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FlashcardSet[];

      // Sort by createdAt in JavaScript to avoid Firebase index requirement
      sets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setFlashcardSets(sets);
      setLoading(false);
    } catch (error) {
      console.error('Error loading flashcard sets:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load your flashcards"
      });
    }
  };

  // Function to delete a flashcard set
  const deleteFlashcardSet = async (setId: string, setName: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, 'flashcardSets', setId));
      toast({
        title: "Flashcard Set Deleted",
        description: `${setName} has been removed from your collection.`,
      });
      // Refresh the data
      loadFlashcardSets();
    } catch (error) {
      console.error('Error deleting flashcard set:', error);
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Could not delete the flashcard set. Please try again.",
      });
    }
  };

  // Real-time data loading
  useEffect(() => {
    console.log('useEffect triggered, user:', user);
    if (!user) {
      console.log('No user, setting loading to false');
      setLoading(false);
      return;
    }

    console.log('Setting up Firebase listener for user:', user.uid);
    const q = query(
      collection(db, 'flashcardSets'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Firebase snapshot received:', snapshot.docs.length, 'docs');
      const sets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FlashcardSet[];

      // Sort by createdAt in JavaScript to avoid Firebase index requirement
      sets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setFlashcardSets(sets);
      setLoading(false);
    }, (error) => {
      console.error('Error loading flashcard sets:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load your flashcards"
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);

  // Listen for flashcard save events to refresh data
  useEffect(() => {
    const handleFlashcardEvent = (event: CustomEvent) => {
      if (event.detail.type === 'flashcards_saved') {
        console.log('Flashcard save event received, refreshing data...');
        // Actually reload the data from Firebase
        loadFlashcardSets();
      }
    };

    const handleStudyEvent = (event: CustomEvent) => {
      if (event.detail.type === 'study_session_completed') {
        console.log('Study session completed, refreshing data...');
        // Reload flashcards to get updated study stats
        loadFlashcardSets();
      }
    };

    window.addEventListener('flashcard-event', handleFlashcardEvent as EventListener);
    window.addEventListener('study-event', handleStudyEvent as EventListener);

    return () => {
      window.removeEventListener('flashcard-event', handleFlashcardEvent as EventListener);
      window.removeEventListener('study-event', handleStudyEvent as EventListener);
    };
  }, [user]);

  // Load study analytics when popup opens
  useEffect(() => {
    if (showAnalyticsPopup && user) {
      loadStudyAnalytics();
    }
  }, [showAnalyticsPopup, user]);

  const loadStudyAnalytics = async () => {
    if (!user) return;

    try {
      console.log('Loading study analytics for user:', user.uid);

      // Load real study analytics from Firebase
      const q = query(
        collection(db, 'studySessions'),
        where('userId', '==', user.uid)
      );

      const snapshot = await getDocs(q);
      console.log('Found study sessions:', snapshot.docs.length);

      const analytics = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Array<{ id: string; timestamp?: string | Date }>;

      console.log('Study analytics data:', analytics);

      // Sort by timestamp (most recent first)
      analytics.sort((a, b) => {
        const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return bTime - aTime;
      });

      setStudyAnalytics(analytics);
    } catch (error) {
      console.error('Error loading study analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load study analytics",
        variant: "destructive",
      });
    }
  };

  // Function to load analytics for a specific set
  const loadSetAnalytics = async (setTitle: string, setId?: string) => {
    if (!user) return;

    try {
      console.log('Loading analytics for set:', setTitle, setId);
      
      // Try to query by setId first if available, otherwise fallback to setTitle
      let q;
      if (setId) {
        q = query(
          collection(db, 'studySessions'),
          where('userId', '==', user.uid),
          where('flashcardSetId', '==', setId)
        );
      } else {
        q = query(
          collection(db, 'studySessions'),
          where('userId', '==', user.uid),
          where('setTitle', '==', setTitle)
        );
      }

      const snapshot = await getDocs(q);
      let analytics = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];

      // Fallback: If no results with setId, try with setTitle (for legacy data)
      if (setId && analytics.length === 0) {
        console.log('No results with setId, falling back to setTitle');
        const fallbackQ = query(
          collection(db, 'studySessions'),
          where('userId', '==', user.uid),
          where('setTitle', '==', setTitle)
        );
        const fallbackSnapshot = await getDocs(fallbackQ);
        analytics = fallbackSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }

      // Also try with "Flashcards: " prefix if title matching fails
      if (analytics.length === 0 && !setTitle.startsWith('Flashcards:')) {
        const prefixedQ = query(
          collection(db, 'studySessions'),
          where('userId', '==', user.uid),
          where('setTitle', '==', `Flashcards: ${setTitle}`)
        );
        const prefixedSnapshot = await getDocs(prefixedQ);
        if (!prefixedSnapshot.empty) {
          analytics = prefixedSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        }
      }

      // Sort by timestamp in JavaScript to avoid Firebase index requirement
      analytics.sort((a, b) => {
        const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return bTime - aTime;
      });

      setSelectedSetAnalytics(analytics);
      setSelectedSetTitle(setTitle);
      setShowSetAnalyticsPopup(true);
    } catch (error) {
      console.error('Error loading set analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load study analytics for this set",
        variant: "destructive",
      });
    }
  };

  const totalCards = flashcardSets.reduce((sum, set) => sum + set.flashcards.length, 0);
  const totalStudies = flashcardSets.reduce((sum, set) => sum + set.studyStats.totalStudies, 0);
  const totalCorrect = flashcardSets.reduce((sum, set) => sum + set.studyStats.correctAnswers, 0);
  const accuracyRate = totalStudies > 0 ? Math.round((totalCorrect / totalStudies) * 100) : 0;

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading your flashcards...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-purple-500/5 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12 space-y-12">

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        >
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              <span className="block text-foreground">Master Your</span>
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Course Material
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Create, study, and track your progress with intelligent flashcards generated directly from your syllabus.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <Card className="border border-primary/20 bg-primary/15 dark:bg-primary/20 backdrop-blur-sm shadow-md">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2 rounded-lg bg-primary/20 dark:bg-primary/30 text-primary">
                  <BookOpen className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary dark:text-primary">{flashcardSets.length}</p>
                  <p className="text-xs text-muted-foreground font-medium">Total Sets</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-purple-500/20 bg-purple-500/15 dark:bg-purple-500/20 backdrop-blur-sm shadow-md">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2 rounded-lg bg-purple-500/20 dark:bg-purple-500/30 text-purple-600 dark:text-purple-400">
                  <Target className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{accuracyRate}%</p>
                  <p className="text-xs text-muted-foreground font-medium">Accuracy</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Generator */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-8 space-y-6"
          >
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-purple-600/50 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative bg-card rounded-xl border shadow-sm overflow-hidden">
                <CardHeader className="border-b bg-muted/30 py-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    Generate New Set
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      Create flashcards from your notes or syllabus
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <FlashcardGenerator />
                </CardContent>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Recent Sets & Tips */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-4 space-y-6"
          >
            {/* Recent Sets */}
            <Card className="border-0 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm border border-white/10 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  Recent Sets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {flashcardSets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No flashcards yet</p>
                    <p className="text-xs mt-1">Create your first set to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {flashcardSets.slice(0, 3).map((set) => (
                      <div key={set.id} className="group flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                        <div className="flex-1 min-w-0 mr-3">
                          <h4 className="font-medium truncate text-sm">{set.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-[10px] h-5">
                              {set.flashcards.length} cards
                            </Badge>
                            <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                              {set.topic}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => loadSetAnalytics(set.title, set.id)}
                          >
                            <BarChart3 className="size-4 text-muted-foreground hover:text-primary" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => deleteFlashcardSet(set.id, set.title)}
                          >
                            <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {flashcardSets.length > 3 && (
                      <Button
                        variant="outline"
                        className="w-full text-xs"
                        onClick={() => setShowAnalyticsPopup(true)}
                      >
                        View All ({flashcardSets.length - 3} more)
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dynamic Content: Pro Tips for new users, Weakest Concepts/Study Schedule for active users */}
            {(() => {
              // Determine if user is new or active
              const totalSets = flashcardSets.length;
              const totalStudySessions = flashcardSets.reduce((sum, set) => sum + (set.studyStats?.totalStudies || 0), 0);
              const hasRecentStudy = flashcardSets.some(set => {
                if (!set.studyStats?.lastStudied) return false;
                const lastStudied = new Date(set.studyStats.lastStudied);
                const daysSince = (Date.now() - lastStudied.getTime()) / (1000 * 60 * 60 * 24);
                return daysSince < 7; // Studied within last week
              });
              
              const isNewUser = totalSets < 2 || totalStudySessions < 5 || !hasRecentStudy;
              
              // Calculate weakest concepts for active users
              const weakestConcepts = flashcardSets
                .filter(set => set.studyStats?.totalStudies >= 3) // Only sets with at least 3 study sessions
                .map(set => {
                  const accuracy = set.studyStats.totalStudies > 0 
                    ? (set.studyStats.correctAnswers / set.studyStats.totalStudies) * 100 
                    : 100;
                  return {
                    title: set.title,
                    topic: set.topic,
                    accuracy: Math.round(accuracy),
                    totalStudies: set.studyStats.totalStudies
                  };
                })
                .filter(item => item.accuracy < 70) // Only show concepts with < 70% accuracy
                .sort((a, b) => a.accuracy - b.accuracy) // Sort by worst first
                .slice(0, 3); // Top 3 weakest
              
              // Calculate upcoming study schedule
              const upcomingStudy = flashcardSets
                .map(set => {
                  const lastStudied = set.studyStats?.lastStudied 
                    ? new Date(set.studyStats.lastStudied)
                    : new Date(set.createdAt);
                  const daysSince = (Date.now() - lastStudied.getTime()) / (1000 * 60 * 60 * 24);
                  return {
                    title: set.title,
                    topic: set.topic,
                    daysSince: Math.round(daysSince),
                    lastStudied: lastStudied
                  };
                })
                .sort((a, b) => b.daysSince - a.daysSince) // Most overdue first
                .slice(0, 3);
              
              if (isNewUser) {
                // Show Pro Tips for new users
                return (
                  <Card className="bg-green-500/5 border-green-500/20">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold flex items-center gap-2 text-green-700 dark:text-green-400">
                        <Target className="size-4" />
                        Pro Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {studyTips.map((tip, i) => (
                        <div key={i} className="flex gap-3 text-sm text-muted-foreground">
                          <CheckCircle className="size-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              } else if (weakestConcepts.length > 0) {
                // Show Weakest Concepts for active users
                return (
                  <Card className="bg-orange-500/5 border-orange-500/20">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold flex items-center gap-2 text-orange-700 dark:text-orange-400">
                        <AlertCircle className="size-4" />
                        Weakest Concepts
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {weakestConcepts.map((concept, i) => (
                        <div key={i} className="flex flex-col gap-1 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground">{concept.title}</span>
                            <Badge variant="destructive" className="text-xs">
                              {concept.accuracy}%
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{concept.topic}</span>
                            <span>•</span>
                            <span>{concept.totalStudies} studies</span>
                          </div>
                        </div>
                      ))}
                      <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                        Focus on these topics to improve your understanding
                      </p>
                    </CardContent>
                  </Card>
                );
              } else {
                // Show Upcoming Study Schedule
                return (
                  <Card className="bg-blue-500/5 border-blue-500/20">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold flex items-center gap-2 text-blue-700 dark:text-blue-400">
                        <Clock className="size-4" />
                        Upcoming Study Schedule
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {upcomingStudy.map((item, i) => (
                        <div key={i} className="flex flex-col gap-1 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground">{item.title}</span>
                            <Badge variant={item.daysSince > 7 ? "destructive" : "secondary"} className="text-xs">
                              {item.daysSince === 0 ? "Today" : item.daysSince === 1 ? "1 day ago" : `${item.daysSince} days ago`}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.topic}
                          </div>
                        </div>
                      ))}
                      <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                        Review these sets to maintain your knowledge
                      </p>
                    </CardContent>
                  </Card>
                );
              }
            })()}
          </motion.div>
        </div>
      </div>

      {/* Study Analytics Popup */}
      <Dialog open={showAnalyticsPopup} onOpenChange={setShowAnalyticsPopup}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 gap-0 border-border/40 bg-background/95 backdrop-blur-xl sm:rounded-3xl shadow-2xl">
          <div className="h-full flex flex-col relative">
            <DialogHeader className="p-8 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <BarChart3 className="size-5" />
              </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-primary/70">Master Performance</span>
                </div>
                <DialogTitle className="text-3xl font-bold tracking-tight">
                  Global Analytics
            </DialogTitle>
                <DialogDescription className="text-lg font-medium text-muted-foreground flex items-center gap-2">
                  <Sparkles className="size-4 text-purple-500" />
                  Across all study sets
            </DialogDescription>
              </div>
          </DialogHeader>

            <div className="flex-1 overflow-y-auto p-8 pt-2 space-y-10">
              {/* Summary Stats - Premium Horizontal Design */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative group overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-5 transition-all hover:bg-emerald-500/[0.06]">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center size-12 rounded-xl bg-emerald-500/10 text-emerald-600 shadow-sm shadow-emerald-500/10">
                      <ThumbsUp className="size-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-emerald-600/70 dark:text-emerald-400/60 uppercase tracking-wider">Total Correct</p>
                      <h4 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                        {studyAnalytics.filter(a => a.isCorrect).length}
                      </h4>
                    </div>
                  </div>
                </div>

                <div className="relative group overflow-hidden rounded-2xl border border-rose-500/20 bg-rose-500/[0.03] p-5 transition-all hover:bg-rose-500/[0.06]">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center size-12 rounded-xl bg-rose-500/10 text-rose-600 shadow-sm shadow-rose-500/10">
                      <ThumbsDown className="size-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-rose-600/70 dark:text-rose-400/60 uppercase tracking-wider">Total Incorrect</p>
                      <h4 className="text-3xl font-bold text-rose-600 dark:text-rose-400">
                        {studyAnalytics.filter(a => !a.isCorrect).length}
                      </h4>
                    </div>
                  </div>
                </div>

                <div className="relative group overflow-hidden rounded-2xl border border-blue-500/20 bg-blue-500/[0.03] p-5 transition-all hover:bg-blue-500/[0.06]">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center size-12 rounded-xl bg-blue-500/10 text-blue-600 shadow-sm shadow-blue-500/10">
                      <Target className="size-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-600/70 dark:text-blue-400/60 uppercase tracking-wider">Overall Accuracy</p>
                      <h4 className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {studyAnalytics.length > 0 ? Math.round((studyAnalytics.filter(a => a.isCorrect).length / studyAnalytics.length) * 100) : 0}%
                      </h4>
                    </div>
                  </div>
                </div>

                <div className="relative group overflow-hidden rounded-2xl border border-violet-500/20 bg-violet-500/[0.03] p-5 transition-all hover:bg-violet-500/[0.06]">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center size-12 rounded-xl bg-violet-500/10 text-violet-600 shadow-sm shadow-violet-500/10">
                      <BookOpen className="size-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-violet-600/70 dark:text-violet-400/60 uppercase tracking-wider">Sets Studied</p>
                      <h4 className="text-3xl font-bold text-violet-600 dark:text-violet-400">
                        {new Set(studyAnalytics.map(a => a.setTitle)).size}
                      </h4>
                    </div>
                  </div>
                </div>
              </div>

              {/* Global Study History Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-primary" />
                    <h3 className="text-xl font-bold tracking-tight">Full History</h3>
                  </div>
                  <Badge variant="secondary" className="px-3 py-1 font-semibold bg-secondary/50 backdrop-blur-sm">
                    {studyAnalytics.length} SESSIONS RECORDED
                  </Badge>
                </div>

                {studyAnalytics.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-muted/20 rounded-[2.5rem] border-2 border-dashed border-border/50">
                    <div className="p-5 rounded-2xl bg-muted/50 mb-6 ring-1 ring-border">
                      <Brain className="size-10 text-muted-foreground" />
                    </div>
                    <h4 className="text-xl font-bold">No data available</h4>
                    <p className="text-muted-foreground text-base max-w-[300px] mx-auto mt-2 leading-relaxed">
                      Start studying any of your sets to see your global learning progress here.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {studyAnalytics.map((session, index) => (
                      <div 
                        key={session.id} 
                        className="group relative overflow-hidden rounded-3xl border border-border/50 bg-card/50 hover:bg-card hover:border-border transition-all duration-300 shadow-sm"
                      >
                        <div className="p-6 sm:p-8">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
                            <div className="flex items-center gap-4">
                              <div className={`flex items-center justify-center size-14 rounded-2xl ${
                                session.isCorrect 
                                  ? 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20' 
                                  : 'bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20'
                              }`}>
                                {session.isCorrect ? <ThumbsUp className="size-7" /> : <ThumbsDown className="size-7" />}
                              </div>
                              <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                  <span className={`text-lg font-black uppercase tracking-tighter ${session.isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {session.isCorrect ? 'Mastered' : 'Needs Review'}
                                  </span>
                                  <Badge variant="secondary" className="text-[10px] font-bold h-5 px-2">
                                {session.difficulty}
                              </Badge>
                              </div>
                                <div className="flex items-center gap-2 text-xs font-semibold">
                                  <span className="text-primary/70">{session.setTitle}</span>
                                  <span className="text-muted-foreground/30">•</span>
                                  <span className="text-muted-foreground flex items-center gap-1">
                              <Clock className="size-3" />
                              {new Date(session.timestamp).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-8">
                            <div className="relative">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">The Question</span>
                                <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
                              </div>
                              <div className="text-lg font-semibold leading-relaxed text-foreground/90 bg-muted/20 rounded-[1.5rem] p-6 ring-1 ring-border/50 shadow-inner">
                                <LatexMathRenderer text={session.question} />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Your Response</span>
                                  <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
                                </div>
                                <div className={`text-base font-medium rounded-2xl p-5 ring-1 ${
                                  session.isCorrect 
                                    ? 'bg-emerald-500/[0.03] ring-emerald-500/20 text-emerald-700 dark:text-emerald-400' 
                                    : 'bg-rose-500/[0.03] ring-rose-500/20 text-rose-700 dark:text-rose-400'
                                  }`}>
                                  <LatexMathRenderer text={session.userAnswer} />
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Correct Solution</span>
                                  <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
                                </div>
                                <div className="text-base font-medium bg-primary/[0.03] ring-1 ring-primary/20 rounded-2xl p-5 text-foreground/80">
                                  <LatexMathRenderer text={session.correctAnswer} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Individual Set Analytics Popup */}
      <Dialog open={showSetAnalyticsPopup} onOpenChange={setShowSetAnalyticsPopup}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 gap-0 border-border/40 bg-background/95 backdrop-blur-xl sm:rounded-3xl shadow-2xl">
          <div className="h-full flex flex-col relative">
            <DialogHeader className="p-8 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <BarChart3 className="size-5" />
              </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-primary/70">Performance Report</span>
                </div>
                <DialogTitle className="text-3xl font-bold tracking-tight">
                  Study Analytics
            </DialogTitle>
                <DialogDescription className="text-lg font-medium text-muted-foreground flex items-center gap-2">
                  <BookOpen className="size-4" />
                  {selectedSetTitle}
            </DialogDescription>
              </div>
          </DialogHeader>

            <div className="flex-1 overflow-y-auto p-8 pt-2 space-y-10">
              {/* Summary Stats - Premium Horizontal Design */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative group overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-5 transition-all hover:bg-emerald-500/[0.06]">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center size-12 rounded-xl bg-emerald-500/10 text-emerald-600 shadow-sm shadow-emerald-500/10">
                      <ThumbsUp className="size-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-emerald-600/70 dark:text-emerald-400/60 uppercase tracking-wider">Correct</p>
                      <h4 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                        {selectedSetAnalytics.filter(a => a.isCorrect).length}
                      </h4>
                    </div>
                  </div>
                </div>

                <div className="relative group overflow-hidden rounded-2xl border border-rose-500/20 bg-rose-500/[0.03] p-5 transition-all hover:bg-rose-500/[0.06]">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center size-12 rounded-xl bg-rose-500/10 text-rose-600 shadow-sm shadow-rose-500/10">
                      <ThumbsDown className="size-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-rose-600/70 dark:text-rose-400/60 uppercase tracking-wider">Incorrect</p>
                      <h4 className="text-3xl font-bold text-rose-600 dark:text-rose-400">
                        {selectedSetAnalytics.filter(a => !a.isCorrect).length}
                      </h4>
                    </div>
                  </div>
                </div>

                <div className="relative group overflow-hidden rounded-2xl border border-blue-500/20 bg-blue-500/[0.03] p-5 transition-all hover:bg-blue-500/[0.06]">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center size-12 rounded-xl bg-blue-500/10 text-blue-600 shadow-sm shadow-blue-500/10">
                      <Target className="size-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-600/70 dark:text-blue-400/60 uppercase tracking-wider">Accuracy</p>
                      <h4 className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {selectedSetAnalytics.length > 0 ? Math.round((selectedSetAnalytics.filter(a => a.isCorrect).length / selectedSetAnalytics.length) * 100) : 0}%
                      </h4>
                    </div>
                  </div>
                </div>

                <div className="relative group overflow-hidden rounded-2xl border border-purple-500/20 bg-purple-500/[0.03] p-5 transition-all hover:bg-purple-500/[0.06]">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center size-12 rounded-xl bg-purple-500/10 text-purple-600 shadow-sm shadow-purple-500/10">
                      <Zap className="size-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-600/70 dark:text-purple-400/60 uppercase tracking-wider">Attempts</p>
                      <h4 className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                        {selectedSetAnalytics.length}
                      </h4>
                    </div>
                  </div>
                </div>
              </div>

              {/* Study History Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-primary" />
                    <h3 className="text-xl font-bold tracking-tight">Recent Sessions</h3>
                  </div>
                  <Badge variant="secondary" className="px-3 py-1 font-semibold bg-secondary/50 backdrop-blur-sm">
                    {selectedSetAnalytics.length} TOTAL SESSIONS
                  </Badge>
                </div>

                {selectedSetAnalytics.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-muted/20 rounded-[2rem] border-2 border-dashed border-border/50">
                    <div className="p-5 rounded-2xl bg-muted/50 mb-6 ring-1 ring-border">
                      <Brain className="size-10 text-muted-foreground" />
                    </div>
                    <h4 className="text-xl font-bold">No progress yet</h4>
                    <p className="text-muted-foreground text-base max-w-[300px] mx-auto mt-2 leading-relaxed">
                      Finish your first study session to unlock these detailed insights!
                    </p>
                    <Button 
                      className="mt-8 rounded-full px-8 py-6 h-auto text-base font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                      onClick={() => setShowSetAnalyticsPopup(false)}
                    >
                      Start Studying Now
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {selectedSetAnalytics.map((session, index) => (
                      <div 
                        key={session.id} 
                        className="group relative overflow-hidden rounded-3xl border border-border/50 bg-card/50 hover:bg-card hover:border-border transition-all duration-300 shadow-sm"
                      >
                        <div className="p-6 sm:p-8">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
                            <div className="flex items-center gap-4">
                              <div className={`flex items-center justify-center size-14 rounded-2xl ${
                                session.isCorrect 
                                  ? 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20' 
                                  : 'bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20'
                              }`}>
                                {session.isCorrect ? <ThumbsUp className="size-7" /> : <ThumbsDown className="size-7" />}
                              </div>
                              <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                  <span className={`text-lg font-black uppercase tracking-tighter ${session.isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {session.isCorrect ? 'Mastered' : 'Needs Review'}
                                  </span>
                                  <Badge variant="outline" className="text-[10px] font-bold h-5 px-2 bg-background/50 border-border/50">
                                {session.difficulty}
                              </Badge>
                              </div>
                                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                  <Clock className="size-3.5" />
                                  {new Date(session.timestamp).toLocaleDateString(undefined, { 
                                    month: 'long', 
                                    day: 'numeric', 
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                            </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-8">
                            <div className="relative">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">The Question</span>
                                <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
                              </div>
                              <div className="text-lg font-semibold leading-relaxed text-foreground/90 bg-muted/20 rounded-[1.5rem] p-6 ring-1 ring-border/50 shadow-inner">
                                <LatexMathRenderer text={session.question} />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Your Response</span>
                                  <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
                                </div>
                                <div className={`text-base font-medium rounded-2xl p-5 ring-1 ${
                                  session.isCorrect 
                                    ? 'bg-emerald-500/[0.03] ring-emerald-500/20 text-emerald-700 dark:text-emerald-400' 
                                    : 'bg-rose-500/[0.03] ring-rose-500/20 text-rose-700 dark:text-rose-400'
                                  }`}>
                                  <LatexMathRenderer text={session.userAnswer} />
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Correct Solution</span>
                                  <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
                                </div>
                                <div className="text-base font-medium bg-primary/[0.03] ring-1 ring-primary/20 rounded-2xl p-5 text-foreground/80">
                                  <LatexMathRenderer text={session.correctAnswer} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}