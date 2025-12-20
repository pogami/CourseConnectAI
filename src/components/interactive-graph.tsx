"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { BlockMath, InlineMath } from "react-katex";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Brush,
} from "recharts";
import "katex/dist/katex.min.css";
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Palette, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'framer-motion';
// 3D graphs removed for stability

// --- Helper Functions for Text Rendering ---

// Convert markdown links to actual clickable HTML links
const convertMarkdownLinks = (text: string) => {
  return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline font-medium transition-colors" title="${url}">${linkText}</a>`;
  });
};

// Convert [[Term]] into highlighted spans
const convertHighlightedTerms = (text: string) => {
  return text.replace(/\[\[([^\]]+)\]\]/g, (_, term) => {
    const cleaned = term.trim();
    if (!cleaned) return term;
    return `<span class="inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-50/80 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 font-medium transition-colors border border-blue-100 dark:border-blue-500/20">${cleaned}</span>`;
  });
};

// Detect math and render with KaTeX
function renderMathLine(line: string, i: number) {
  // Check if line contains any math delimiters
  const hasMath = line.includes("$$") || (line.includes("$") && line.includes("$")) || 
                  (line.includes("\\(") && line.includes("\\)")) || 
                  (line.includes("\\[") && line.includes("\\]")) ||
                  line.includes("\\boxed{");
  
  if (!hasMath) {
    // No math, return as regular text with bold formatting
    let processedLine = line
      .replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*([^\*]+)\*/g, '<strong>$1</strong>'); // Convert italic to bold instead
    
    // Convert markdown links to clickable HTML links
    processedLine = convertMarkdownLinks(processedLine);
    processedLine = convertHighlightedTerms(processedLine);
    
    return (
      <p key={i} className="text-sm not-italic break-words max-w-full overflow-hidden leading-7 font-sans" dangerouslySetInnerHTML={{ __html: processedLine }} />
    );
  }

  // Split the line by math expressions and render each part appropriately
  const parts = line.split(/(\$\$[\s\S]*?\$\$|\$[^$]*?\$|\\\[[\s\S]*?\\\]|\\\([^)]*?\\\)|\\boxed\{[^}]*\})/);
  
  // Check if this line contains block math (which renders as <div>)
  const hasBlockMath = parts.some(part => 
    (part.startsWith('$$') && part.endsWith('$$')) || 
    (part.startsWith('\\[') && part.endsWith('\\]'))
  );
  
  // Use <div> instead of <p> if there's block math to avoid invalid HTML nesting
  const ContainerTag = hasBlockMath ? 'div' : 'p';
  
  return (
    <ContainerTag key={i} className="text-sm not-italic break-words max-w-full overflow-hidden leading-7 font-sans">
      {parts.map((part, partIndex) => {
        // Block math ($$...$$)
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const mathContent = part.slice(2, -2).trim();
          return <BlockMath key={`${i}-${partIndex}`} math={mathContent} />;
        }
        // Block math (\[...\])
        else if (part.startsWith('\\[') && part.endsWith('\\]')) {
          const mathContent = part.slice(2, -2).trim();
          return <BlockMath key={`${i}-${partIndex}`} math={mathContent} />;
        }
        // Inline math ($...$)
        else if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          const mathContent = part.slice(1, -1).trim();
          return <InlineMath key={`${i}-${partIndex}`} math={mathContent} />;
        }
        // Inline math (\(...\))
        else if (part.startsWith('\\(') && part.endsWith('\\)')) {
          const mathContent = part.slice(2, -2).trim();
          return <InlineMath key={`${i}-${partIndex}`} math={mathContent} />;
        }
        // Boxed math
        else if (part.startsWith('\\boxed{') && part.endsWith('}')) {
          const boxedMatch = part.match(/\\boxed\{([^}]+)\}/);
          if (boxedMatch) {
            const boxedContent = boxedMatch[1];
            return (
              <span key={`${i}-${partIndex}`} className="inline-block border border-foreground px-3 py-2 bg-transparent">
                <InlineMath math={boxedContent} />
              </span>
            );
          }
        }
        // Regular text with formatting
        else if (part.trim()) {
          let processedPart = part
            .replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\*([^\*]+)\*/g, '<strong>$1</strong>'); // Convert italic to bold instead
          
          processedPart = convertMarkdownLinks(processedPart);
          processedPart = convertHighlightedTerms(processedPart);
          
          return <span key={`${i}-${partIndex}`} dangerouslySetInnerHTML={{ __html: processedPart }} />;
        }
        return null;
      })}
    </ContainerTag>
  );
}

// Function to break long text into paragraphs
function breakIntoParagraphs(text: string): string[] {
  let paragraphs = text.split('\n\n');
  
  if (paragraphs.length === 1) {
    const sentenceRegex = /([^.!?]+)([.!?]+)/g;
    const sentences: Array<{text: string, punctuation: string}> = [];
    let match;
    
    while ((match = sentenceRegex.exec(text)) !== null) {
      const sentenceText = match[1].trim();
      const punctuation = match[2];
      if (sentenceText.length > 0) {
        sentences.push({ text: sentenceText, punctuation });
      }
    }
    
    if (sentences.length === 0) {
      return [text];
    }
    
    const result: string[] = [];
    let currentParagraph = '';
    
    for (const { text: sentenceText, punctuation } of sentences) {
      const fullSentence = sentenceText + punctuation;
      if (currentParagraph.length + fullSentence.length > 200 && currentParagraph.length > 0) {
        result.push(currentParagraph.trim());
        currentParagraph = fullSentence + ' ';
      } else {
        currentParagraph += (currentParagraph ? ' ' : '') + fullSentence;
      }
    }
    
    if (currentParagraph.trim()) {
      result.push(currentParagraph.trim());
    }
    
    return result.length > 0 ? result : [text];
  }
  
  return paragraphs.filter(p => p.trim().length > 0);
}

// --- Graph Logic ---

// Generate data points for a mathematical function
function generateFunctionData(
  fn: string, 
  minX: number = -5, 
  maxX: number = 5, 
  step: number = 0.1
): Array<{ x: number; y: number }> {
  const data: Array<{ x: number; y: number }> = [];
  
  // Enhanced function evaluator
  const evaluateFunction = (x: number, expression: string): number => {
    try {
      let expr = expression.trim();
      expr = expr.replace(/\bx\b/g, `(${x})`);
      expr = expr.replace(/\^/g, '**');
      expr = expr
        .replace(/\bsin\b/g, 'Math.sin')
        .replace(/\bcos\b/g, 'Math.cos')
        .replace(/\btan\b/g, 'Math.tan')
        .replace(/\basin\b/g, 'Math.asin')
        .replace(/\bacos\b/g, 'Math.acos')
        .replace(/\batan\b/g, 'Math.atan')
        .replace(/\bexp\b/g, 'Math.exp')
        .replace(/\blog\b/g, 'Math.log')
        .replace(/\bln\b/g, 'Math.log')
        .replace(/\bsqrt\b/g, 'Math.sqrt')
        .replace(/\babs\b/g, 'Math.abs')
        .replace(/\bPI\b/g, Math.PI.toString())
        .replace(/\bE\b/g, Math.E.toString());
      
      expr = expr.replace(/(\d+)([a-zA-Z(])/g, '$1*$2');
      expr = expr.replace(/([a-zA-Z)])(\d+)/g, '$1*$2');
      
      const result = new Function('Math', 'return ' + expr)(Math);
      
      if (typeof result === 'number' && isFinite(result) && !isNaN(result)) {
        return result;
      }
      return 0;
    } catch (error) {
      console.warn('Function evaluation error:', error);
      return 0;
    }
  };
  
  for (let x = minX; x <= maxX; x += step) {
    const y = evaluateFunction(x, fn);
    if (isFinite(y) && !isNaN(y)) {
      data.push({ 
        x: Math.round(x * 100) / 100, 
        y: Math.round(y * 100) / 100 
      });
    }
  }
  
  return data;
}

export interface InteractiveGraphProps {
  graphData: any;
  cleanContent: string;
  className?: string;
}

// Color scheme presets
const colorSchemes = {
  default: ['hsl(var(--primary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
  vibrant: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'],
  pastel: ['#a78bfa', '#60a5fa', '#34d399', '#fbbf24', '#fb7185', '#f472b6'],
  monochrome: ['#1f2937', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb'],
  ocean: ['#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#22c55e'],
  sunset: ['#f97316', '#ef4444', '#ec4899', '#a855f7', '#8b5cf6']
};

// 3D Surface Component removed

// Interactive Graph Component with multiple functions and sliders
export function InteractiveGraph({ graphData, cleanContent, className }: InteractiveGraphProps) {
  // Add safety checks
  if (!graphData || !graphData.data) {
    console.error('Invalid graphData:', graphData);
    return <div className={className}>Error: Invalid graph data</div>;
  }

  const textOnly = cleanContent?.replace(/GRAPH_DATA:[^\n]+/, '').trim() || '';
  const chartType = graphData.data?.chartType || (graphData.type === 'data' ? 'line' : 'function');
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Enhanced state
  const [colorScheme, setColorScheme] = useState<keyof typeof colorSchemes>('default');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  
  const functions = graphData.data?.functions || (graphData.data?.function ? [{ 
    function: graphData.data.function, 
    label: graphData.data.label || graphData.data.function,
    color: graphData.data.color || 'hsl(var(--primary))'
  }] : []);
  
  const chartTitle = graphData.data.title || 
    (graphData.type === 'function' && functions.length === 1 ? `Graph of ${functions[0].label}` : 
     graphData.type === 'function' ? 'Graph' : 'Data Visualization');
  
  const colors = colorSchemes[colorScheme];
  
  // Export functions
  const handleExportPNG = async () => {
    if (!chartRef.current) return;
    try {
      const canvas = await html2canvas(chartRef.current, { backgroundColor: null });
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${chartTitle.replace(/[^a-z0-9]/gi, '_')}.png`;
      link.href = url;
      link.click();
    } catch (error) {
      console.error('Failed to export PNG:', error);
    }
  };
  
  const handleExportSVG = () => {
    if (!chartRef.current) return;
    // For SVG, we'll use a simplified approach - convert chart to SVG
    const svg = chartRef.current.querySelector('svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${chartTitle.replace(/[^a-z0-9]/gi, '_')}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }
  };
  
  // Zoom controls
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanX(0);
    setPanY(0);
  };
  
  // Control Panel Component
  const ControlPanel = () => (
    <div className="flex flex-wrap items-center gap-2 mb-3 p-2 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-2">
        <Label className="text-xs">Color:</Label>
        <Select value={colorScheme} onValueChange={(v: any) => setColorScheme(v)}>
          <SelectTrigger className="h-8 w-[120px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(colorSchemes).map(scheme => (
              <SelectItem key={scheme} value={scheme}>{scheme}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="outline" onClick={handleZoomOut} className="h-8 w-8 p-0">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-xs w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
        <Button size="sm" variant="outline" onClick={handleZoomIn} className="h-8 w-8 p-0">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={handleResetZoom} className="h-8 w-8 p-0">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-1 ml-auto">
        <Button size="sm" variant="outline" onClick={handleExportPNG} className="h-8 text-xs">
          <Download className="h-3 w-3 mr-1" />
          PNG
        </Button>
        <Button size="sm" variant="outline" onClick={handleExportSVG} className="h-8 text-xs">
          <Download className="h-3 w-3 mr-1" />
          SVG
        </Button>
      </div>
    </div>
  );

  // Handle different chart types
  if (chartType === 'bar' && graphData.data.data) {
    const chartData = graphData.data.data;
    
    return (
      <div className={`relative ${className}`} ref={chartRef}>
        {textOnly && (
          <div className="relative leading-relaxed text-sm max-w-full overflow-hidden break-words ai-response group mb-4">
            {breakIntoParagraphs(textOnly).map((paragraph, i) => (
              <div key={i} className="mb-3 last:mb-0">
                {paragraph.split("\n").map((line, j) => renderMathLine(line, j))}
              </div>
            ))}
          </div>
        )}
        <motion.div 
          className="mt-4 p-4 bg-card border border-border rounded-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-sm font-semibold mb-3 text-foreground">{chartTitle}</h3>
          <ControlPanel />
          <div 
            className="w-full max-w-full overflow-x-auto overflow-y-visible" 
            style={{ 
              maxWidth: '100%',
              transform: `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`,
              transformOrigin: 'top left'
            }}
          >
            <div style={{ minWidth: '400px', width: 'max-content' }}>
              <BarChart width={Math.max(400, chartData.length * 60)} height={300} data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis 
                dataKey={graphData.data.xKey || "name"}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Bar 
                dataKey={graphData.data.yKey || "value"} 
                fill={colors[0]} 
                radius={[4, 4, 0, 0]}
                animationDuration={500}
              />
              </BarChart>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }
  
  if (chartType === 'pie' && graphData.data.data) {
    const chartData = graphData.data.data;
    const chartColors = graphData.data.colors || colors;
    
    return (
      <div className={`relative ${className}`} ref={chartRef}>
        {textOnly && (
          <div className="relative leading-relaxed text-sm max-w-full overflow-hidden break-words ai-response group mb-4">
            {breakIntoParagraphs(textOnly).map((paragraph, i) => (
              <div key={i} className="mb-3 last:mb-0">
                {paragraph.split("\n").map((line, j) => renderMathLine(line, j))}
              </div>
            ))}
          </div>
        )}
        <motion.div 
          className="mt-4 p-4 bg-card border border-border rounded-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-sm font-semibold mb-3 text-foreground">{chartTitle}</h3>
          <ControlPanel />
          <div 
            className="w-full flex justify-center"
            style={{ 
              transform: `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`,
              transformOrigin: 'center'
            }}
          >
            <PieChart width={400} height={300}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey={graphData.data.valueKey || "value"}
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-card border border-border rounded-lg p-2 shadow-lg">
                        <p className="text-sm font-medium text-foreground">
                          {payload[0].name}: {payload[0].value}
                        </p>
                        {payload[0].payload.percent && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {((payload[0].payload.percent) * 100).toFixed(1)}%
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </div>
        </motion.div>
      </div>
    );
  }
  
  if (chartType === 'scatter' && graphData.data.data) {
    const chartData = graphData.data.data;
    const chartColors = graphData.data.colors || colors;
    
    return (
      <div className={`relative ${className}`} ref={chartRef}>
        {textOnly && (
          <div className="relative leading-relaxed text-sm max-w-full overflow-hidden break-words ai-response group mb-4">
            {breakIntoParagraphs(textOnly).map((paragraph, i) => (
              <div key={i} className="mb-3 last:mb-0">
                {paragraph.split("\n").map((line, j) => renderMathLine(line, j))}
              </div>
            ))}
          </div>
        )}
        <motion.div 
          className="mt-4 p-4 bg-card border border-border rounded-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-sm font-semibold mb-3 text-foreground">{chartTitle}</h3>
          <ControlPanel />
          <div 
            className="w-full max-w-full overflow-x-auto overflow-y-visible" 
            style={{ 
              maxWidth: '100%',
              transform: `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`,
              transformOrigin: 'top left'
            }}
          >
            <div style={{ minWidth: '400px', width: 'max-content' }}>
              <ScatterChart width={Math.max(400, chartData.length * 20)} height={300} data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis 
                type="number"
                dataKey="x"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis 
                type="number"
                dataKey="y"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Scatter dataKey="y" fill={chartColors[0]} />
              </ScatterChart>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }
  
  if (chartType === 'area' && graphData.data.data) {
    const chartData = graphData.data.data;
    const chartColors = graphData.data.colors || colors;
    
    return (
      <div className={`relative ${className}`} ref={chartRef}>
        {textOnly && (
          <div className="relative leading-relaxed text-sm max-w-full overflow-hidden break-words ai-response group mb-4">
            {breakIntoParagraphs(textOnly).map((paragraph, i) => (
              <div key={i} className="mb-3 last:mb-0">
                {paragraph.split("\n").map((line, j) => renderMathLine(line, j))}
              </div>
            ))}
          </div>
        )}
        <motion.div 
          className="mt-4 p-4 bg-card border border-border rounded-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-sm font-semibold mb-3 text-foreground">{chartTitle}</h3>
          <ControlPanel />
          <div 
            className="w-full max-w-full overflow-x-auto overflow-y-visible" 
            style={{ 
              maxWidth: '100%',
              transform: `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`,
              transformOrigin: 'top left'
            }}
          >
            <div style={{ minWidth: '400px', width: 'max-content' }}>
              <AreaChart width={Math.max(400, chartData.length * 10)} height={300} data={chartData}>
              <defs>
                <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColors[0]} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={chartColors[0]} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis 
                dataKey="x"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Area 
                type="monotone" 
                dataKey="y" 
                stroke={chartColors[0]} 
                fillOpacity={1}
                fill="url(#colorArea)"
              />
              </AreaChart>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }
  
  // Handle line chart (data points) - default for data type
  if (graphData.type === 'data' && graphData.data.points) {
    const chartData = graphData.data.points;
    const chartColors = graphData.data.colors || colors;
    
    return (
      <div className={`relative ${className}`} ref={chartRef}>
        {textOnly && (
          <div className="relative leading-relaxed text-sm max-w-full overflow-hidden break-words ai-response group mb-4">
            {breakIntoParagraphs(textOnly).map((paragraph, i) => (
              <div key={i} className="mb-3 last:mb-0">
                {paragraph.split("\n").map((line, j) => renderMathLine(line, j))}
              </div>
            ))}
          </div>
        )}
        <motion.div 
          className="mt-4 p-4 bg-card border border-border rounded-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-sm font-semibold mb-3 text-foreground">{chartTitle}</h3>
          <ControlPanel />
          <div 
            className="w-full max-w-full overflow-x-auto overflow-y-visible" 
            style={{ 
              maxWidth: '100%',
              transform: `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`,
              transformOrigin: 'top left'
            }}
          >
            <div style={{ minWidth: '400px', width: 'max-content' }}>
              <LineChart width={Math.max(400, chartData.length * 10)} height={300} data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis 
                dataKey="x" 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Line 
                type="monotone" 
                dataKey="y" 
                stroke={chartColors[0]} 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              </LineChart>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }
  
  // Support parameters with sliders
  const [parameters, setParameters] = useState<Record<string, number>>(
    graphData.data?.parameters || {}
  );
  
  // Generate data for each function
  const allChartData = useMemo(() => {
    const minX = graphData.data?.minX ?? -5;
    const maxX = graphData.data?.maxX ?? 5;
    const step = 0.1;
    
    // Generate x values
    const xValues: number[] = [];
    for (let x = minX; x <= maxX; x += step) {
      xValues.push(Math.round(x * 100) / 100);
    }
    
    // Generate data for each function
    const datasets: Array<{ name: string; data: Array<{ x: number; y: number }>; color: string }> = [];
    
    functions.forEach((fnObj: any, index: number) => {
      let fn = fnObj.function;
      
      // Replace parameters in function (e.g., "a*x^2" where a is a parameter)
      Object.keys(parameters).forEach(param => {
        fn = fn.replace(new RegExp(`\\b${param}\\b`, 'g'), parameters[param].toString());
      });
      
      const data = generateFunctionData(fn, minX, maxX, step);
      datasets.push({
        name: fnObj.label || fnObj.function,
        data,
        color: fnObj.color || `hsl(${210 + index * 60}, 70%, 50%)`
      });
    });
    
    // Combine all datasets into one array with all x values
    const combinedData = xValues.map(x => {
      const point: any = { x };
      datasets.forEach((dataset, idx) => {
        const yValue = dataset.data.find(p => Math.abs(p.x - x) < 0.01)?.y;
        if (yValue !== undefined) {
          point[`y${idx}`] = yValue;
        }
      });
      return point;
    });
    
    return { combinedData, datasets };
  }, [functions, parameters, graphData.data?.minX, graphData.data?.maxX]);
  
  return (
    <div className={`relative ${className}`} ref={chartRef}>
      {textOnly && (
        <div className="relative leading-relaxed text-sm max-w-full overflow-hidden break-words ai-response group mb-4">
          {breakIntoParagraphs(textOnly).map((paragraph, i) => (
            <div key={i} className="mb-3 last:mb-0">
              {paragraph.split("\n").map((line, j) => renderMathLine(line, j))}
            </div>
          ))}
        </div>
      )}
      <motion.div 
        className="mt-4 p-4 bg-card border border-border rounded-xl dark:bg-transparent dark:border-0 dark:p-0"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="text-sm font-semibold mb-3 text-foreground px-4 dark:px-0">{chartTitle}</h3>
        
        {/* Controls: Color, Zoom, Download */}
        <div className="mb-4 px-4 dark:px-0">
          <ControlPanel />
        </div>
        
        {/* Controls: Parameters */}
        <div className="mb-4 space-y-3 mx-4 dark:mx-0">
          {Object.keys(parameters).length > 0 && (
            <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
              <p className="text-xs font-medium text-muted-foreground mb-2">Adjust Parameters:</p>
              {Object.keys(parameters).map(param => {
                const paramConfig = graphData.data.parameterConfig?.[param] || { min: -10, max: 10, step: 0.1 };
                return (
                  <div key={param} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{param} = {parameters[param].toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[parameters[param]]}
                      onValueChange={([value]) => {
                        setParameters(prev => ({ ...prev, [param]: value }));
                      }}
                      min={paramConfig.min}
                      max={paramConfig.max}
                      step={paramConfig.step}
                      className="w-full"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Graph */}
        <div 
          className="w-full max-w-full overflow-x-auto overflow-y-visible" 
          style={{ 
            maxWidth: '100%',
            transform: `scale(${zoomLevel}) translate(${panX}px, ${panY}px)`,
            transformOrigin: 'top left'
          }}
        >
          <div style={{ minWidth: '400px', width: 'max-content' }}>
            <LineChart 
              width={Math.max(400, allChartData.combinedData.length * 10)} 
              height={350} 
              data={allChartData.combinedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis 
                dataKey="x" 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                label={{ value: 'x', position: 'insideBottomRight', offset: -10, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                label={{ value: 'y', position: 'insideLeft', offset: 10, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              {allChartData.datasets.map((dataset, idx) => (
                <Line 
                  key={idx}
                  type="monotone" 
                  dataKey={`y${idx}`}
                  name={dataset.name}
                  stroke={dataset.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </div>
        </div>
        
        {/* Legend for multiple functions */}
        {allChartData.datasets.length > 1 ? (
          <div className="mt-3 flex flex-wrap gap-3 justify-center">
            {allChartData.datasets.map((dataset, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: dataset.color }}
                />
                <span className="text-muted-foreground">{dataset.name}</span>
              </div>
            ))}
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}

