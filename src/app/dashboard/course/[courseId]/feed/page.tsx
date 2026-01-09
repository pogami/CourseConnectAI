"use client";

// COURSE FEED PAGE - COMMENTED OUT
// All course feed functionality has been disabled
// To re-enable, restore from git history or uncomment the original implementation

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CourseFeedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F1A] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Course Feed Disabled</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6">This feature has been temporarily disabled.</p>
        <Link href="/dashboard">
          <Button variant="outline" className="rounded-xl">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
