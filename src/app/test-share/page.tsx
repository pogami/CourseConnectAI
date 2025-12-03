"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { shareChat } from "@/lib/share-service";
import { Chat, Message } from "@/hooks/use-chat-store";
import { Copy, Check, ExternalLink, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function TestSharePage() {
  const { toast } = useToast();
  const [chatTitle, setChatTitle] = useState("Test Chat Conversation");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! This is a test message from a user.",
      sender: "user",
      name: "Test User",
      timestamp: Date.now() - 3600000,
    },
    {
      id: "2",
      text: "This is a response from the AI assistant. It can include **markdown formatting**, code blocks, and even math equations like $E = mc^2$.",
      sender: "bot",
      name: "AI Assistant",
      timestamp: Date.now() - 3500000,
    },
    {
      id: "3",
      text: "Here's another user message asking a question.",
      sender: "user",
      name: "Test User",
      timestamp: Date.now() - 3400000,
    },
    {
      id: "4",
      text: "And here's the AI's detailed response with multiple paragraphs and explanations.",
      sender: "bot",
      name: "AI Assistant",
      timestamp: Date.now() - 3300000,
    },
  ]);
  const [shareId, setShareId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleAddMessage = () => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text: `New message ${messages.length + 1}`,
      sender: messages.length % 2 === 0 ? "user" : "bot",
      name: messages.length % 2 === 0 ? "Test User" : "AI Assistant",
      timestamp: Date.now(),
    };
    setMessages([...messages, newMessage]);
  };

  const handleShare = async () => {
    if (!chatTitle.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a chat title.",
      });
      return;
    }

    if (messages.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please add at least one message.",
      });
      return;
    }

    setIsSharing(true);
    try {
      const testChat: Chat = {
        id: "test-chat-" + Date.now(),
        title: chatTitle,
        messages: messages,
        createdAt: Date.now() - 3600000,
        updatedAt: Date.now(),
        chatType: "class",
      };

      const id = await shareChat(testChat);
      const url = `${window.location.origin}/share/${id}`;
      
      setShareId(id);
      setShareUrl(url);
      
      toast({
        title: "Success!",
        description: "Chat shared successfully. Link copied to clipboard.",
      });

      // Copy to clipboard
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Share error:", error);
      toast({
        variant: "destructive",
        title: "Share Failed",
        description: error instanceof Error ? error.message : "Could not share chat.",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyUrl = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Link copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Test Chat Sharing</h1>
        <p className="text-muted-foreground">
          Create a test chat and share it to verify the sharing functionality works correctly.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column: Chat Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Chat Editor</CardTitle>
            <CardDescription>Create and edit your test chat</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Chat Title</Label>
              <Input
                id="title"
                value={chatTitle}
                onChange={(e) => setChatTitle(e.target.value)}
                placeholder="Enter chat title"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Messages ({messages.length})</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddMessage}
                >
                  Add Message
                </Button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto border rounded-md p-4">
                {messages.map((msg, idx) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg ${
                      msg.sender === "user"
                        ? "bg-blue-100 dark:bg-blue-900/20 ml-auto max-w-[80%]"
                        : "bg-gray-100 dark:bg-gray-800 mr-auto max-w-[80%]"
                    }`}
                  >
                    <div className="text-xs text-muted-foreground mb-1">
                      {msg.name} • {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-sm">{msg.text}</div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No messages yet. Click "Add Message" to add one.
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleShare}
              disabled={isSharing || messages.length === 0}
              className="w-full"
            >
              {isSharing ? "Sharing..." : "Share Chat"}
            </Button>
          </CardContent>
        </Card>

        {/* Right Column: Share Result */}
        <Card>
          <CardHeader>
            <CardTitle>Share Result</CardTitle>
            <CardDescription>Your shareable link will appear here</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {shareUrl ? (
              <>
                <div>
                  <Label>Share ID</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={shareId || ""} readOnly className="font-mono text-xs" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (shareId) {
                          navigator.clipboard.writeText(shareId);
                          toast({ title: "ID copied!" });
                        }
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Share URL</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={shareUrl} readOnly className="font-mono text-xs" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyUrl}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={shareUrl} target="_blank" className="flex-1">
                    <Button variant="default" className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Shared Chat
                    </Button>
                  </Link>
                  <Link href={`/share/${shareId}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      View Preview
                    </Button>
                  </Link>
                </div>

                <div className="mt-4 p-4 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground">
                    <strong>Test Checklist:</strong>
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                    <li>Click "Open Shared Chat" to view the shared page</li>
                    <li>Verify all messages are displayed correctly</li>
                    <li>Check that the sign-up prompt appears at the bottom</li>
                    <li>Test the link in an incognito/private window</li>
                    <li>Verify formatting (markdown, code blocks) works</li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Share a chat to get a link</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Test Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => {
                setChatTitle("Sample Math Discussion");
                setMessages([
                  {
                    id: "1",
                    text: "Can you explain the quadratic formula?",
                    sender: "user",
                    name: "Student",
                    timestamp: Date.now() - 3600000,
                  },
                  {
                    id: "2",
                    text: "The quadratic formula is: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$\n\nThis formula solves equations of the form $ax^2 + bx + c = 0$.",
                    sender: "bot",
                    name: "AI Tutor",
                    timestamp: Date.now() - 3500000,
                  },
                ]);
              }}
            >
              Load Math Example
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setChatTitle("Code Help Session");
                setMessages([
                  {
                    id: "1",
                    text: "How do I write a function in JavaScript?",
                    sender: "user",
                    name: "Developer",
                    timestamp: Date.now() - 3600000,
                  },
                  {
                    id: "2",
                    text: "Here's an example:\n\n```javascript\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n```",
                    sender: "bot",
                    name: "AI Assistant",
                    timestamp: Date.now() - 3500000,
                  },
                ]);
              }}
            >
              Load Code Example
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setChatTitle("");
                setMessages([]);
                setShareId(null);
                setShareUrl(null);
              }}
            >
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

