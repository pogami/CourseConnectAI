import AdvancedChatInput from "@/components/chat/ChatInput";

import { Button } from "@/components/ui/button";

import { Menu, Plus } from "lucide-react";



export default function ChatPage() {

  return (

    <div className="flex min-h-screen flex-col bg-background text-foreground dark:bg-zinc-950">

      {/* 1. Minimal Header */}

      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-zinc-800">

        <div className="flex items-center gap-2">

          <Button variant="ghost" size="icon" className="-ml-2">

            <Menu className="h-5 w-5" />

          </Button>

          <span className="font-semibold text-sm tracking-tight">

            Genius<span className="text-muted-foreground">Chat</span>

          </span>

        </div>

        

        <div className="flex items-center gap-2">

          <Button variant="outline" size="sm" className="hidden sm:flex h-8 gap-2 rounded-full border-zinc-200 dark:border-zinc-800">

            <Plus className="h-3.5 w-3.5" />

            <span>New Chat</span>

          </Button>

          <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">

             <span className="text-xs font-medium">U</span>

          </div>

        </div>

      </header>



      {/* 2. Main Content Area */}

      <main className="flex flex-1 flex-col items-center justify-center p-4">

        {/* We wrap the input in a max-width container to control the layout */}

        <div className="w-full max-w-3xl animate-in fade-in zoom-in-95 duration-500">

          <AdvancedChatInput />

        </div>

      </main>



      {/* 3. Footer / Legal (Optional) */}

      <footer className="py-4 text-center">

        <p className="text-xs text-muted-foreground">

          AI can make mistakes. Please check important info.

        </p>

      </footer>

    </div>

  );

}

