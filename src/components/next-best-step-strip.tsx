"use client";

import { useMemo } from "react";
import { useChatStore } from "@/hooks/use-chat-store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight01Icon,
  SparklesIcon,
  Clock01Icon,
  GraduationScrollIcon,
  Book01Icon
} from "hugeicons-react";
import Link from "next/link";

interface NextStep {
  kind: "assignment" | "exam" | "review";
  title: string;
  courseLabel: string;
  detail: string;
  cta: string;
  href: string;
  urgencyLabel?: string;
}

export function NextBestStepStrip() {
  const { chats } = useChatStore();

  const nextStep = useMemo<NextStep | null>(() => {
    const classChats = Object.values(chats).filter(
      (chat: any) => chat?.chatType === "class" && chat?.courseData
    ) as any[];

    if (classChats.length === 0) return null;

    const now = new Date();
    const upcoming: {
      type: "assignment" | "exam";
      chatId: string;
      courseCode: string;
      name: string;
      date: Date;
    }[] = [];

    for (const chat of classChats) {
      const courseCode = chat.courseData.courseCode || chat.title || "Course";

      // Assignments
      (chat.courseData.assignments || []).forEach((a: any) => {
        if (!a?.dueDate || a?.dueDate === "null" || a?.status === "Completed") return;
        const d = new Date(a.dueDate);
        if (isNaN(d.getTime()) || d.getTime() < now.getTime()) return;
        upcoming.push({
          type: "assignment",
          chatId: chat.id,
          courseCode,
          name: a.name || "Assignment",
          date: d,
        });
      });

      // Exams
      (chat.courseData.exams || []).forEach((e: any) => {
        if (!e?.date || e?.date === "null") return;
        const d = new Date(e.date);
        if (isNaN(d.getTime()) || d.getTime() < now.getTime()) return;
        upcoming.push({
          type: "exam",
          chatId: chat.id,
          courseCode,
          name: e.name || "Exam",
          date: d,
        });
      });
    }

    if (upcoming.length === 0) {
      // Fallback: simple review suggestion using any course
      const anyCourse = classChats[0];
      const label = anyCourse.courseData.courseCode || anyCourse.title || "Your course";
      const chatId = anyCourse.id;
      const prefill = encodeURIComponent(`Give me a quick review session for ${label}.`);
      return {
        kind: "review",
        title: "Review a key concept",
        courseLabel: label,
        detail: "No urgent deadlines detected. Spend 10 minutes reinforcing concepts so they stay fresh.",
        cta: "Start a quick review",
        href: `/dashboard/chat?tab=${encodeURIComponent(chatId)}&prefill=${prefill}`,
      };
    }

    // Pick the closest deadline
    upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());
    const item = upcoming[0];
    const days = Math.ceil((item.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    let urgencyLabel: string | undefined;
    if (days <= 0) urgencyLabel = "Due today";
    else if (days === 1) urgencyLabel = "Due tomorrow";
    else urgencyLabel = `Due in ${days} days`;

    const base: NextStep = {
      kind: item.type,
      title:
        item.type === "exam"
          ? "Next best step: get exam-ready"
          : "Next best step: move one assignment forward",
      courseLabel: item.courseCode,
      detail:
        item.type === "exam"
          ? `You have "${item.name}" coming up in ${item.courseCode}. A short focused review now will make exam week less chaotic.`
          : `Work on "${item.name}" for ${item.courseCode}. Even 20–30 minutes now will make it much easier before the deadline.`,
      cta:
        item.type === "exam"
          ? "Open chat to review for this exam"
          : "Open chat to work on this assignment",
      href: "",
      urgencyLabel,
    };

    const prefillText =
      item.type === "exam"
        ? `Help me review for "${item.name}" in ${item.courseCode}.`
        : `Help me make progress on "${item.name}" for ${item.courseCode}.`;

    base.href = `/dashboard/chat?tab=${encodeURIComponent(
      item.chatId
    )}&prefill=${encodeURIComponent(prefillText)}`;

    return base;
  }, [chats]);

  if (!nextStep) return null;

  const Icon =
    nextStep.kind === "exam" ? GraduationScrollIcon : nextStep.kind === "assignment" ? Book01Icon : SparklesIcon;

  return (
    <Card className="border-2 border-blue-200/80 dark:border-blue-900/60 bg-gradient-to-r from-blue-50/80 via-sky-50/80 to-indigo-50/80 dark:from-blue-950/40 dark:via-sky-950/30 dark:to-indigo-950/40 shadow-md mb-6 rounded-2xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-start gap-3 md:gap-4">
          <div className="mt-0.5 md:mt-0 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Icon className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">
                {nextStep.title}
              </p>
              <span className="inline-flex items-center rounded-full bg-white/80 dark:bg-black/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300 border border-blue-100/80 dark:border-blue-800/80">
                {nextStep.courseLabel}
              </span>
              {nextStep.urgencyLabel && (
                <span className="inline-flex items-center rounded-full bg-red-50/90 dark:bg-red-900/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700 dark:text-red-300 border border-red-100/80 dark:border-red-800/80">
                  <Clock01Icon className="h-3 w-3 mr-1" />
                  {nextStep.urgencyLabel}
                </span>
              )}
            </div>
            <p className="text-xs md:text-sm text-gray-700 dark:text-gray-200 max-w-2xl">
              {nextStep.detail}
            </p>
          </div>
        </div>
        <div className="flex md:items-center">
          <Button
            asChild
            size="sm"
            className="whitespace-nowrap rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm px-3 md:px-4 py-2 shadow-sm"
          >
            <Link href={nextStep.href}>
              {nextStep.cta}
              <ArrowRight01Icon className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}


