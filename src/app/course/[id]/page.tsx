import { Metadata } from 'next';
import { use } from 'react';
import { generateCourseMeta, CourseData } from '@/lib/open-graph';
import CoursePageContent from './course-page-content';

interface CoursePageProps {
  params: Promise<{
    id: string;
  }>;
}

// Mock course data - replace with actual data fetching
async function getCourseData(courseId: string): Promise<CourseData> {
  // In a real implementation, you would fetch this from your database
  // For now, return mock data
  return {
    id: courseId,
    title: `Course ${courseId}`,
    description: `Learn about ${courseId} with CourseConnect. Join thousands of students studying this course together.`,
    instructor: 'Dr. Smith',
    courseCode: courseId,
    department: 'Computer Science',
    semester: 'Fall 2024',
    year: '2024',
    memberCount: 150,
  };
}

export async function generateMetadata(props: CoursePageProps): Promise<Metadata> {
  const params = await props.params;
  const { id } = params;
  const course = await getCourseData(id);
  return generateCourseMeta(course);
}

export default async function CoursePage(props: CoursePageProps) {
  const params = await props.params;
  const { id } = params;
  const course = await getCourseData(id);
  
  return <CoursePageContent course={course} />;
}
