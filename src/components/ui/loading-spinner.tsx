import { cn } from "@/lib/utils";
import { RippleText } from "@/components/ripple-text";
import { CCLogo } from "@/components/icons/cc-logo";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6", 
  lg: "h-8 w-8",
  xl: "h-12 w-12"
};

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="relative">
        {/* Outer ring */}
        <div
          className={cn(
            "animate-spin rounded-full border-2 border-purple-200 dark:border-purple-800",
            sizeClasses[size],
            className
          )}
        />
        {/* Inner gradient ring */}
        <div
          className={cn(
            "absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary/50",
            sizeClasses[size]
          )}
          style={{ 
            animation: 'spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite'
          }}
        />
        {/* Center dot */}
        <div
          className={cn(
            "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 animate-pulse",
            size === "sm" ? "h-1 w-1" : size === "md" ? "h-1.5 w-1.5" : size === "lg" ? "h-2 w-2" : "h-3 w-3"
          )}
        />
      </div>
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse font-medium">{text}</p>
      )}
    </div>
  );
}

export function PageLoadingSpinner() {
  return (
    <div className="fixed inset-0 z-[9999] bg-white dark:bg-gray-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <CCLogo className="h-20 w-auto md:h-24" />
        <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
          CourseConnect <span className="text-blue-600 dark:text-blue-400">AI</span>
        </div>
      </div>
    </div>
  );
}

export function InlineLoadingSpinner({ text }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <LoadingSpinner text={text} />
    </div>
  );
}
