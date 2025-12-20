"use client";

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, FileText, Sparkles, ArrowRight, Loader2, X, RotateCcw, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export default function OCRTestPage() {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }
    
    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImage(result);
      setResult(null);
      setIsUploading(false);
      console.log("📸 Image preview set, length:", result.length);
    };
    reader.onerror = () => {
      toast.error("Failed to read image file");
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const processOCR = async () => {
    if (!image) return;

    setIsProcessing(true);
    console.log("🚀 Starting OCR process...");
    try {
      // Extract mime type
      const mimeType = image.split(',')[0].split(':')[1].split(';')[0];
      console.log("🔍 Mime type:", mimeType);

      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: image,
          mimeType: mimeType
        }),
      });

      console.log("📡 API Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ API Error:", errorData);
        throw new Error(errorData.error || 'Failed to process image');
      }

      const data = await response.json();
      console.log("✅ Extraction successful");
      setResult(data.text);
      toast.success("Text extracted successfully!");
    } catch (error: any) {
      console.error("🚨 OCR Error:", error);
      toast.error(error.message || "Failed to process image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      toast.success("Copied to clipboard!");
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="container max-w-5xl mx-auto py-12 px-4 sm:px-6">
      <div className="flex flex-col items-center mb-12 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 mb-6"
        >
          <Camera className="size-8 text-blue-600 dark:text-blue-400" />
        </motion.div>
        <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white mb-4">
          Notes <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Digitizer</span>
        </h1>
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-200 dark:border-blue-800">
            Engine: GPT-4o Direct
          </span>
          <span className="px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-800">
            v2.0 Stable
          </span>
        </div>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl font-medium leading-relaxed">
          Take a photo of your handwritten lecture notes and transform them into clean, editable text instantly using AI Vision.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Left Side: Upload/Preview */}
        <div className="space-y-6">
          <Card 
            className={`border-2 border-dashed transition-all duration-300 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden rounded-[2.5rem] min-h-[300px] flex items-center justify-center ${
              isDragging 
                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 scale-[1.02]" 
                : "border-slate-200 dark:border-slate-800"
            }`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <CardContent className="p-0 w-full h-full flex items-center justify-center">
              {isUploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="size-10 text-blue-500 animate-spin" />
                  <p className="text-sm font-bold text-slate-500">Loading Preview...</p>
                </div>
              ) : !image ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-12 w-full flex flex-col items-center justify-center cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-300"
                >
                  <div className={`size-20 rounded-3xl flex items-center justify-center mb-6 transition-all duration-500 ${
                    isDragging ? "bg-blue-100 dark:bg-blue-900 scale-110 rotate-3" : "bg-slate-100 dark:bg-slate-800 group-hover:scale-110 group-hover:rotate-3"
                  }`}>
                    <Upload className={`size-8 transition-colors ${isDragging ? "text-blue-600" : "text-slate-400 group-hover:text-blue-500"}`} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                    {isDragging ? "Drop your note here" : "Upload or Take Photo"}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium">Supports JPG, PNG • Handwriting optimized</p>
                </div>
              ) : (
                <div 
                  className="relative group w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-950"
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                >
                  <img 
                    src={image} 
                    alt="Note Preview" 
                    className={`max-w-full h-auto max-h-[600px] object-contain shadow-2xl transition-all duration-300 ${
                      isDragging ? "opacity-50 blur-sm scale-95" : ""
                    }`} 
                  />
                  {isDragging && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="p-6 rounded-2xl bg-blue-600/20 backdrop-blur-md border-2 border-blue-500 animate-pulse">
                        <Upload className="size-12 text-blue-500" />
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                    <Button 
                      variant="outline" 
                      className="bg-white/10 border-white/20 text-white backdrop-blur-md rounded-xl hover:bg-white/20"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <RotateCcw className="size-4 mr-2" /> Replace
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="rounded-xl"
                      onClick={reset}
                    >
                      <X className="size-4 mr-2" /> Remove
                    </Button>
                  </div>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                capture="environment"
                className="hidden" 
              />
            </CardContent>
          </Card>

          {image && !result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Button 
                onClick={processOCR}
                disabled={isProcessing}
                className="w-full py-8 text-xl font-black rounded-3xl bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-500/25 group overflow-hidden relative"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-3">
                    <Loader2 className="size-6 animate-spin" />
                    Analyzing Handwriting...
                  </span>
                ) : (
                  <span className="flex items-center gap-3">
                    <Sparkles className="size-6 group-hover:animate-pulse" />
                    Digitize My Notes
                    <ArrowRight className="size-6 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </motion.div>
          )}
        </div>

        {/* Right Side: Result */}
        <div className="space-y-6 min-h-[400px]">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full"
              >
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-2xl h-full flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <FileText className="size-5" />
                      </div>
                      <h3 className="text-xl font-bold tracking-tight">Extracted Text</h3>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                      onClick={copyToClipboard}
                    >
                      {isCopied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                      <span className="ml-2">{isCopied ? 'Copied' : 'Copy'}</span>
                    </Button>
                  </div>
                  
                  <div className="flex-1 bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap overflow-y-auto max-h-[500px]">
                    {result}
                  </div>

                  <div className="mt-6 flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1 rounded-2xl border-slate-200 dark:border-slate-800 py-6 font-bold"
                      onClick={reset}
                    >
                      Start Over
                    </Button>
                    <Button 
                      className="flex-1 rounded-2xl bg-slate-900 dark:bg-white dark:text-slate-900 py-6 font-bold hover:scale-[1.02] transition-all"
                      onClick={() => window.location.href = `/dashboard/chat?content=${encodeURIComponent(result)}`}
                    >
                      Use in Chat
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center p-12 text-center bg-slate-50/50 dark:bg-slate-900/20 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800"
              >
                <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-6 opacity-50">
                  <FileText className="size-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-400">Waiting for analysis...</h3>
                <p className="text-sm text-slate-400 max-w-[200px] mt-2">Upload your notes on the left to see the magic happen.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
