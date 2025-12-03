"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { ThumbsUp, Heart, PartyPopper, LucideIcon } from "lucide-react";

type ReactionType = "thumbsUp" | "heart" | "party";

interface ReactionButtonProps {
  updateId: string;
  type: ReactionType;
}

const icons: Record<ReactionType, LucideIcon> = {
  thumbsUp: ThumbsUp,
  heart: Heart,
  party: PartyPopper,
};

const colors: Record<ReactionType, string> = {
  thumbsUp: "text-blue-500",
  heart: "text-pink-500",
  party: "text-amber-500",
};

export function ReactionButton({ updateId, type }: ReactionButtonProps) {
  const [count, setCount] = useState(0);
  const [userHasReacted, setUserHasReacted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const Icon = icons[type];
  const reactionKey = `reaction-${updateId}-${type}`;

  // Load user state + shared count
  useEffect(() => {
    const init = async () => {
      try {
        const stored = localStorage.getItem(reactionKey);
        if (stored === "true") {
          setUserHasReacted(true);
        }

        const res = await fetch(
          `/api/changelog/reactions?updateId=${encodeURIComponent(
            updateId
          )}&type=${encodeURIComponent(type)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (typeof data.count === "number") {
            setCount(data.count);
          }
        }
      } catch (e) {
        console.warn("Failed to load reaction count", e);
      }
    };
    init();
  }, [reactionKey, updateId, type]);

  const getAnimation = () => {
    if (!isAnimating) return { scale: 1, rotate: 0 };
    if (type === "party") return { scale: [1, 1.4, 1], rotate: [0, 12, -12, 0] };
    if (type === "heart") return { scale: [1, 1.25, 1], rotate: 0 };
    if (type === "thumbsUp") return { scale: [1, 1.2, 1], rotate: [0, -18, 0] };
    return { scale: 1, rotate: 0 };
  };

  const handleClick = () => {
    const nextState = !userHasReacted;
    setUserHasReacted(nextState);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 350);

    const delta = nextState ? 1 : -1;
    setCount((c) => Math.max(0, c + delta));
    localStorage.setItem(reactionKey, String(nextState));

    // Persist globally (non-blocking)
    fetch("/api/changelog/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updateId, type, delta }),
    }).catch((e) => console.warn("Failed to update reaction", e));

    // Confetti only for party
    if (nextState && type === "party") {
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#f59e0b"],
        scalar: 0.7,
        disableForReducedMotion: true,
      });
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border active:scale-95",
        userHasReacted
          ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400"
          : "bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-300"
      )}
    >
      <div className="relative">
        <motion.div animate={getAnimation()} transition={{ duration: 0.35 }}>
          <Icon
            className={cn(
              "w-3.5 h-3.5 transition-colors",
              userHasReacted ? colors[type] : "group-hover:text-slate-700 dark:group-hover:text-slate-300"
            )}
            fill={userHasReacted && type === "heart" ? "currentColor" : "none"}
          />
        </motion.div>
      </div>
      <span className="min-w-[1ch] tabular-nums">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={count}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="inline-block"
          >
            {count || 0}
          </motion.span>
        </AnimatePresence>
      </span>
    </button>
  );
}


