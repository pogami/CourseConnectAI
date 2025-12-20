"use client"

import { useTheme as useNextTheme } from "next-themes"
import { useTheme as useCustomTheme } from "@/contexts/theme-context"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  // Try custom theme first, fallback to next-themes
  const customTheme = useCustomTheme?.()
  const nextTheme = useNextTheme?.()
  const theme = customTheme?.theme || nextTheme?.theme || "system"

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-right"
      richColors={false}
      closeButton
      expand={true}
      gap={8}
      duration={10000}
      toastOptions={{
        duration: 10000,
        classNames: {
          toast:
            "group toast bg-black dark:bg-black text-white border-none shadow-lg rounded-lg",
          title: "text-white font-semibold text-sm",
          description: "text-white/90 text-sm",
          actionButton:
            "bg-white/15 hover:bg-white/25 text-white rounded-md border-none font-medium",
          cancelButton:
            "bg-transparent hover:bg-white/10 text-white rounded-md border-none font-medium",
          closeButton: "bg-transparent border-none text-white/70 hover:text-white hover:opacity-100",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
