
'use client';

import { StudyGroupData } from '@/lib/open-graph';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, Calendar, User, MessageSquare, Share2, Lock, Unlock, Crown, Star } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface StudyGroupPageContentProps {
  group: StudyGroupData;
}

export default function StudyGroupPageContent({ group }: StudyGroupPageContentProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-indigo-50 to-blue-50 dark:from-purple-950 dark:via-indigo-950 dark:to-blue-950">
      <div className="container mx-auto px-4 py-8">
        {/* Group Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-sm">
              {group.course}
            </Badge>
            <Badge variant={group.isPublic ? "default" : "destructive"} className="text-sm">
              {group.isPublic ? (
                <>
                  <Unlock className="h-3 w-3 mr-1" />
                  Public
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3 mr-1" />
                  Private
                </>
              )}
            </Badge>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {group.name}
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
            {group.description}
          </p>
          
          <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{group.memberCount}/{group.maxMembers || '∞'} members</span>
            </div>
            {group.course && (
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>{group.course}</span>
              </div>
            )}
          </div>
        </div>

        {/* Group Actions */}
        <div className="flex gap-4 mb-8">
          <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            <Users className="h-4 w-4 mr-2" />
            Join Group
          </Button>
          <Button variant="outline" size="lg">
            <MessageSquare className="h-4 w-4 mr-2" />
            Group Chat
          </Button>
          <Button variant="outline" size="lg">
            <Share2 className="h-4 w-4 mr-2" />
            Share Group
          </Button>
        </div>

        {/* Group Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Group Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Welcome to {group.name}! This study group is designed to help students 
                  collaborate and learn together. Join the discussion and enhance your 
                  academic experience.
                </p>
                
                {group.tags && group.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {group.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Study sessions are scheduled regularly. Check the calendar for upcoming meetings.
                </p>
                <Button variant="outline">
                  View Calendar
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Group Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Members</span>
                  <p className="text-sm">{group.memberCount}/{group.maxMembers || '∞'}</p>
                </div>
                {group.course && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Course</span>
                    <p className="text-sm">{group.course}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</span>
                  <p className="text-sm">{group.isPublic ? 'Public' : 'Private'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Group Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Mock members */}
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Student {i}</p>
                        <p className="text-xs text-gray-500">Active</p>
                      </div>
                      {i === 1 && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-3">
                  View All Members
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Group Chat
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Session
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Share2 className="h-4 w-4 mr-2" />
                  Invite Members
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
