"use client";

import { EnhancedChatInput } from "@/components/enhanced-chat-input";
import { useState } from "react";

export default function AdvancedChatInput() {
  const [value, setValue] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (shouldCallAI: boolean = true) => {
    if (!value.trim() || isSending) return;
    
    setIsSending(true);
    // Add your send logic here
    console.log("Sending:", value);
    
    // Reset after a delay (simulate sending)
    setTimeout(() => {
      setValue("");
      setIsSending(false);
    }, 1000);
  };

  return (
    <EnhancedChatInput
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onSend={handleSend}
      placeholder="Ask anything..."
      disabled={isSending}
      isSending={isSending}
      className="w-full"
    />
  );
}



