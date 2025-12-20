import { Metadata } from 'next';
import { generateProfileMeta, ProfileData } from '@/lib/open-graph';
import ProfilePageContent from './profile-page-content';

interface ProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

// Mock profile data - replace with actual data fetching
async function getProfileData(profileId: string): Promise<ProfileData> {
  // In a real implementation, you would fetch this from your database
  // For now, return mock data
  return {
    id: profileId,
    displayName: `Student ${profileId}`,
    school: 'University of Example',
    major: 'Computer Science',
    graduationYear: '2025',
    bio: 'Passionate student studying Computer Science. Love learning and collaborating with peers.',
  };
}

export async function generateMetadata(props: ProfilePageProps): Promise<Metadata> {
  const params = await props.params;
  const { id } = params;
  const profile = await getProfileData(id);
  return generateProfileMeta(profile);
}

export default async function ProfilePage(props: ProfilePageProps) {
  const params = await props.params;
  const { id } = params;
  const profile = await getProfileData(id);
  
  return <ProfilePageContent profile={profile} />;
}
