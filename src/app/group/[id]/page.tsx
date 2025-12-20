import { Metadata } from 'next';
import { generateStudyGroupMeta, StudyGroupData } from '@/lib/open-graph';
import StudyGroupPageContent from './study-group-page-content';

interface StudyGroupPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Mock study group data - replace with actual data fetching
async function getStudyGroupData(groupId: string): Promise<StudyGroupData> {
  // In a real implementation, you would fetch this from your database
  // For now, return mock data
  return {
    id: groupId,
    name: `Study Group ${groupId}`,
    description: `Join ${groupId} study group for collaborative learning and academic success.`,
    course: 'CS-101',
    memberCount: 8,
    maxMembers: 12,
    isPublic: true,
    tags: ['programming', 'algorithms', 'data-structures'],
  };
}

export async function generateMetadata(props: StudyGroupPageProps): Promise<Metadata> {
  const params = await props.params;
  const { id } = params;
  const group = await getStudyGroupData(id);
  return generateStudyGroupMeta(group);
}

export default async function StudyGroupPage(props: StudyGroupPageProps) {
  const params = await props.params;
  const { id } = params;
  const group = await getStudyGroupData(id);
  
  return <StudyGroupPageContent group={group} />;
}
