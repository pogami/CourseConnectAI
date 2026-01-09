"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, use } from "react";
import { MessageSquare, BookOpen, Calendar, CheckCircle2, Clock, AlertCircle, Brain, FileText, GraduationCap, X } from "lucide-react";
import { useChatStore } from "@/hooks/use-chat-store";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FullPageChat } from "@/components/full-page-chat";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { chats } = useChatStore();
  const { toast } = useToast();
  // Access params property directly - useParams() returns the params object in client components
  const courseIdParam = params?.courseId;
  const courseId = courseIdParam ? decodeURIComponent(courseIdParam as string) : '';
  const [showSyllabus, setShowSyllabus] = useState(false);
  const [showFullPageChat, setShowFullPageChat] = useState(false);

  // Immediately redirect this page to its course chat
  useEffect(() => {
    if (courseId) {
      router.replace(`/dashboard/chat?tab=${encodeURIComponent(courseId)}`);
    }
  }, [courseId, router]);

  // Get the course data
  const course = chats[courseId];

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Course Not Found</CardTitle>
            <CardDescription>The course you're looking for doesn't exist.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const assignments = course.courseData?.assignments || [];
  const completedAssignments = assignments.filter((a: any) => a.status === 'Completed');
  const progress = assignments.length > 0 ? Math.round((completedAssignments.length / assignments.length) * 100) : 0;

  // Get upcoming assignments
  const upcomingAssignments = assignments
    .filter((a: any) => a.status !== 'Completed' && a.dueDate)
    .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // Get days until due
  const getDaysUntil = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Sample topics (you can enhance this with real data)
  const topics = [
    { name: "Limits and Continuity", progress: 100, status: "complete" },
    { name: "Derivatives", progress: 60, status: "in-progress" },
    { name: "Applications of Derivatives", progress: 0, status: "not-started" },
    { name: "Integration", progress: 0, status: "not-started" },
  ];

  return (
    <div className="min-h-screen">
      <div className="p-6 space-y-6">
        
        {/* Course Header */}
        <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/40 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/20 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-gray-100 dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
                {course.courseData?.courseCode || course.title}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {course.courseData?.courseName || 'Course'} 
                {course.courseData?.professor && ` • ${course.courseData.professor}`}
                {' • Fall 2025 • Section A'}
              </p>
            </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => setShowFullPageChat(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Ask AI
                  </Button>
              <Link href={`/dashboard/course/${courseId}/study`}>
                <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Study Mode
                </Button>
              </Link>
              <Dialog open={showSyllabus} onOpenChange={setShowSyllabus}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                    <FileText className="h-4 w-4 mr-2" />
                    View Syllabus
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">
                      📄 {course.courseData?.courseCode || course.title} - Syllabus
                    </DialogTitle>
                    <DialogDescription>
                      Course syllabus and important information
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6 mt-4">
                    {/* Course Information */}
                    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20">
                      <CardHeader>
                        <CardTitle className="text-lg">📚 Course Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="font-semibold text-gray-600 dark:text-gray-400">Course Code:</p>
                            <p className="text-gray-900 dark:text-gray-100">{course.courseData?.courseCode || course.title}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-600 dark:text-gray-400">Course Name:</p>
                            <p className="text-gray-900 dark:text-gray-100">{course.courseData?.courseName || 'Course'}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-600 dark:text-gray-400">Instructor:</p>
                            <p className="text-gray-900 dark:text-gray-100">{course.courseData?.professor || 'TBA'}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-600 dark:text-gray-400">Class Time:</p>
                            <p className="text-gray-900 dark:text-gray-100">{course.courseData?.classTime || 'Not specified'}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-600 dark:text-gray-400">Location:</p>
                            <p className="text-gray-900 dark:text-gray-100">{course.courseData?.location || 'Not specified'}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-600 dark:text-gray-400">Credits:</p>
                            <p className="text-gray-900 dark:text-gray-100">3</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Course Description */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">📝 Course Description</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {course.courseData?.courseName || 
                            'This course covers fundamental concepts and applications. Students will develop critical thinking skills and practical knowledge through hands-on learning experiences.'}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Learning Objectives */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">🎯 Learning Objectives</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                            <span>Understand fundamental concepts and principles</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                            <span>Apply theoretical knowledge to practical problems</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                            <span>Develop critical thinking and analytical skills</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                            <span>Communicate ideas effectively through written and oral presentations</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Assignments */}
                    {assignments.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">📋 Assignments & Grading</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {assignments.map((assignment: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-gray-100">{assignment.name}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'TBA'}
                                    {assignment.points && ` • ${assignment.points} points`}
                                  </p>
                                </div>
                                <Badge className={`${
                                  assignment.status === 'Completed' 
                                    ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                                    : assignment.status === 'In Progress'
                                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                }`}>
                                  {assignment.status || 'Not Started'}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Course Policies */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">📜 Course Policies</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Attendance Policy</h4>
                          <p className="text-gray-700 dark:text-gray-300">Regular attendance is expected. Students are responsible for all material covered in class.</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Late Assignment Policy</h4>
                          <p className="text-gray-700 dark:text-gray-300">Late assignments will be accepted with a 10% penalty per day late, up to 3 days.</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Academic Integrity</h4>
                          <p className="text-gray-700 dark:text-gray-300">All work must be your own. Plagiarism and cheating will result in disciplinary action.</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Overall Progress</span>
              <span className="font-semibold">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Quick Nav */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-lg border border-gray-200/50 dark:border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-lg dark:text-gray-100">📋 Quick Nav</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start dark:text-gray-300 dark:hover:bg-gray-800">Overview</Button>
                <Button variant="ghost" className="w-full justify-start dark:text-gray-300 dark:hover:bg-gray-800">Assignments</Button>
                <Button variant="ghost" className="w-full justify-start dark:text-gray-300 dark:hover:bg-gray-800">Study Tools</Button>
                <Button variant="ghost" className="w-full justify-start dark:text-gray-300 dark:hover:bg-gray-800">Resources</Button>
                <Button variant="ghost" className="w-full justify-start dark:text-gray-300 dark:hover:bg-gray-800">Grades</Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Upcoming Assignments */}
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-lg border border-gray-200/50 dark:border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-xl dark:text-gray-100">📅 Upcoming Assignments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingAssignments.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No upcoming assignments</p>
                ) : (
                  upcomingAssignments.map((assignment: any, idx: number) => {
                    const daysUntil = getDaysUntil(assignment.dueDate);
                    const isUrgent = daysUntil <= 2;
                    
                    return (
                      <div key={idx} className={`p-4 rounded-xl border ${isUrgent ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isUrgent ? 'bg-red-100 dark:bg-red-900/50' : 'bg-orange-100 dark:bg-orange-900/50'}`}>
                              {isUrgent ? <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" /> : <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-gray-100">{assignment.name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Due: {new Date(assignment.dueDate).toLocaleDateString()} ({daysUntil} {daysUntil === 1 ? 'day' : 'days'})
                              </p>
                              {assignment.status && (
                                <Badge className={`mt-1 ${assignment.status === 'In Progress' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
                                  {assignment.status}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="dark:border-gray-600 dark:text-gray-300">Continue</Button>
                            <Link href={`/dashboard/chat?id=${courseId}`}>
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                                <Brain className="h-4 w-4 mr-1" />
                                Ask AI
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Completed Assignments */}
                {completedAssignments.length > 0 && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Completed</p>
                    {completedAssignments.slice(0, 2).map((assignment: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 rounded-lg mb-2">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{assignment.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {assignment.grade && `Grade: ${assignment.grade} • `}
                              Submitted: {assignment.submittedDate ? new Date(assignment.submittedDate).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Course Topics */}
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-lg border border-gray-200/50 dark:border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-xl dark:text-gray-100">📖 Course Topics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {topics.map((topic, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {topic.status === 'complete' && <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />}
                        {topic.status === 'in-progress' && <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
                        {topic.status === 'not-started' && <Clock className="h-5 w-5 text-gray-400 dark:text-gray-500" />}
                        <span className={`font-medium ${topic.status === 'not-started' ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                          Week {idx + 1}: {topic.name}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{topic.progress}%</span>
                    </div>
                    <Progress value={topic.progress} className="h-2" />
                    <div className="flex gap-2 mt-2">
                      {topic.status === 'complete' && (
                        <>
                          <Link href={`/dashboard/course/${courseId}/review/${idx + 1}`}>
                            <Button size="sm" variant="outline" className="dark:border-gray-600 dark:text-gray-300">Review</Button>
                          </Link>
                          <Link href={`/dashboard/flashcards?course=${courseId}&topic=${idx + 1}`}>
                            <Button size="sm" variant="outline" className="dark:border-gray-600 dark:text-gray-300">Flashcards</Button>
                          </Link>
                          <Link href={`/dashboard/course/${courseId}/quiz/${idx + 1}`}>
                            <Button size="sm" variant="outline" className="dark:border-gray-600 dark:text-gray-300">Quiz</Button>
                          </Link>
                        </>
                      )}
                      {topic.status === 'in-progress' && (
                        <>
                          <Link href={`/dashboard/course/${courseId}/study/${idx + 1}`}>
                            <Button size="sm" className="dark:bg-blue-600 dark:hover:bg-blue-700">Study</Button>
                          </Link>
                          <Link href={`/dashboard/chat?id=${courseId}&topic=${idx + 1}`}>
                            <Button size="sm" variant="outline" className="dark:border-gray-600 dark:text-gray-300">Ask AI</Button>
                          </Link>
                          <Link href={`/dashboard/course/${courseId}/practice/${idx + 1}`}>
                            <Button size="sm" variant="outline" className="dark:border-gray-600 dark:text-gray-300">Practice</Button>
                          </Link>
                        </>
                      )}
                      {topic.status === 'not-started' && (
                        <Link href={`/dashboard/course/${courseId}/preview/${idx + 1}`}>
                          <Button size="sm" variant="outline" className="dark:border-gray-600 dark:text-gray-300">Preview</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Study Tools */}
            <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-lg border border-gray-200/50 dark:border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-xl dark:text-gray-100">🧠 Study Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Link href={`/dashboard/flashcards?course=${courseId}`}>
                    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/20 border-purple-200/50 dark:border-purple-800/50 hover:shadow-lg transition-all cursor-pointer">
                      <CardContent className="p-6 text-center">
                        <div className="text-3xl mb-2">🎴</div>
                        <h3 className="font-semibold mb-1 dark:text-gray-100">Flashcards</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">45 cards</p>
                        <Button size="sm" className="mt-3 w-full dark:bg-purple-600 dark:hover:bg-purple-700">Study</Button>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href={`/dashboard/course/${courseId}/quizzes`}>
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 border-blue-200/50 dark:border-blue-800/50 hover:shadow-lg transition-all cursor-pointer">
                      <CardContent className="p-6 text-center">
                        <div className="text-3xl mb-2">📝</div>
                        <h3 className="font-semibold mb-1 dark:text-gray-100">Quizzes</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">12 quizzes</p>
                        <Button size="sm" className="mt-3 w-full dark:bg-blue-600 dark:hover:bg-blue-700">Practice</Button>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href={`/dashboard/course/${courseId}/summaries`}>
                    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 border-green-200/50 dark:border-green-800/50 hover:shadow-lg transition-all cursor-pointer">
                      <CardContent className="p-6 text-center">
                        <div className="text-3xl mb-2">📋</div>
                        <h3 className="font-semibold mb-1 dark:text-gray-100">Summaries</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">8 topics</p>
                        <Button size="sm" className="mt-3 w-full dark:bg-green-600 dark:hover:bg-green-700">Read</Button>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href={`/dashboard/chat?id=${courseId}`} className="block">
                    <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 border-orange-200/50 dark:border-orange-800/50 hover:shadow-lg transition-all cursor-pointer">
                      <CardContent className="p-6 text-center">
                        <div className="text-3xl mb-2">🤖</div>
                        <h3 className="font-semibold mb-1 dark:text-gray-100">AI Tutor</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">24/7</p>
                        <Button size="sm" className="mt-3 w-full dark:bg-orange-600 dark:hover:bg-orange-700">Ask</Button>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

      </div>

      {/* Full Page Chat */}
      <FullPageChat
        isOpen={showFullPageChat}
        onClose={() => setShowFullPageChat(false)}
        courseId={courseId}
        courseTitle={course.courseData?.courseCode || course.title}
      />
    </div>
  );
}

