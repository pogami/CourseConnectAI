"use client";

import { useMemo, useState } from "react";
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
} from "recharts";
import "katex/dist/katex.min.css";
import { Slider } from '@/components/ui/slider';

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

// Interactive Graph Component with multiple functions and sliders
export function InteractiveGraph({ graphData, cleanContent, className }: InteractiveGraphProps) {
  const textOnly = cleanContent.replace(/GRAPH_DATA:[^\n]+/, '').trim();
  const chartType = graphData.data.chartType || (graphData.type === 'data' ? 'line' : 'function');
  
  const functions = graphData.data.functions || (graphData.data.function ? [{ 
    function: graphData.data.function, 
    label: graphData.data.label || graphData.data.function,
    color: graphData.data.color || 'hsl(var(--primary))'
  }] : []);
  
  const chartTitle = graphData.data.title || 
    (graphData.type === 'function' && functions.length === 1 ? `Graph of ${functions[0].label}` : 
     graphData.type === 'function' ? 'Graph' : 'Data Visualization');
  
  // Handle different chart types
  if (chartType === 'bar' && graphData.data.data) {
    const chartData = graphData.data.data;
    const colors = graphData.data.colors || ['hsl(var(--primary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    
    return (
      <div className={`relative ${className}`}>
        {textOnly && (
          <div className="relative leading-relaxed text-sm max-w-full overflow-hidden break-words ai-response group mb-4">
            {breakIntoParagraphs(textOnly).map((paragraph, i) => (
              <div key={i} className="mb-3 last:mb-0">
                {paragraph.split("\n").map((line, j) => renderMathLine(line, j))}
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 p-4 bg-card border border-border rounded-xl">
          <h3 className="text-sm font-semibold mb-3 text-foreground">{chartTitle}</h3>
          <div className="w-full overflow-x-auto">
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
              <Bar dataKey={graphData.data.yKey || "value"} fill={colors[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </div>
        </div>
      </div>
    );
  }
  
  if (chartType === 'pie' && graphData.data.data) {
    const chartData = graphData.data.data;
    const colors = graphData.data.colors || ['hsl(var(--primary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
    
    return (
      <div className={`relative ${className}`}>
        {textOnly && (
          <div className="relative leading-relaxed text-sm max-w-full overflow-hidden break-words ai-response group mb-4">
            {breakIntoParagraphs(textOnly).map((paragraph, i) => (
              <div key={i} className="mb-3 last:mb-0">
                {paragraph.split("\n").map((line, j) => renderMathLine(line, j))}
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 p-4 bg-card border border-border rounded-xl">
          <h3 className="text-sm font-semibold mb-3 text-foreground">{chartTitle}</h3>
          <div className="w-full flex justify-center">
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
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
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
        </div>
      </div>
    );
  }
  
  if (chartType === 'scatter' && graphData.data.data) {
    const chartData = graphData.data.data;
    const colors = graphData.data.colors || ['hsl(var(--primary))'];
    
    return (
      <div className={`relative ${className}`}>
        {textOnly && (
          <div className="relative leading-relaxed text-sm max-w-full overflow-hidden break-words ai-response group mb-4">
            {breakIntoParagraphs(textOnly).map((paragraph, i) => (
              <div key={i} className="mb-3 last:mb-0">
                {paragraph.split("\n").map((line, j) => renderMathLine(line, j))}
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 p-4 bg-card border border-border rounded-xl">
          <h3 className="text-sm font-semibold mb-3 text-foreground">{chartTitle}</h3>
          <div className="w-full overflow-x-auto">
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
                  borderRadius: '8px'
                }}
              />
              <Scatter dataKey="y" fill={colors[0]} />
            </ScatterChart>
          </div>
        </div>
      </div>
    );
  }
  
  if (chartType === 'area' && graphData.data.data) {
    const chartData = graphData.data.data;
    const colors = graphData.data.colors || ['hsl(var(--primary))'];
    
    return (
      <div className={`relative ${className}`}>
        {textOnly && (
          <div className="relative leading-relaxed text-sm max-w-full overflow-hidden break-words ai-response group mb-4">
            {breakIntoParagraphs(textOnly).map((paragraph, i) => (
              <div key={i} className="mb-3 last:mb-0">
                {paragraph.split("\n").map((line, j) => renderMathLine(line, j))}
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 p-4 bg-card border border-border rounded-xl">
          <h3 className="text-sm font-semibold mb-3 text-foreground">{chartTitle}</h3>
          <div className="w-full overflow-x-auto">
            <AreaChart width={Math.max(400, chartData.length * 10)} height={300} data={chartData}>
              <defs>
                <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[0]} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={colors[0]} stopOpacity={0.1}/>
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
                stroke={colors[0]} 
                fillOpacity={1}
                fill="url(#colorArea)"
              />
            </AreaChart>
          </div>
        </div>
      </div>
    );
  }
  
  // Handle line chart (data points) - default for data type
  if (graphData.type === 'data' && graphData.data.points) {
    const chartData = graphData.data.points;
    
    return (
      <div className={`relative ${className}`}>
        {textOnly && (
          <div className="relative leading-relaxed text-sm max-w-full overflow-hidden break-words ai-response group mb-4">
            {breakIntoParagraphs(textOnly).map((paragraph, i) => (
              <div key={i} className="mb-3 last:mb-0">
                {paragraph.split("\n").map((line, j) => renderMathLine(line, j))}
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 p-4 bg-card border border-border rounded-xl">
          <h3 className="text-sm font-semibold mb-3 text-foreground">{chartTitle}</h3>
          <div className="w-full overflow-x-auto">
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
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </div>
        </div>
      </div>
    );
  }
  
  // Support parameters with sliders
  const [parameters, setParameters] = useState<Record<string, number>>(
    graphData.data.parameters || {}
  );
  
  // Generate data for each function
  const allChartData = useMemo(() => {
    const minX = graphData.data.minX ?? -5;
    const maxX = graphData.data.maxX ?? 5;
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
  }, [functions, parameters, graphData.data.minX, graphData.data.maxX]);
  
  return (
    <div className={`relative ${className}`}>
      {textOnly && (
        <div className="relative leading-relaxed text-sm max-w-full overflow-hidden break-words ai-response group mb-4">
          {breakIntoParagraphs(textOnly).map((paragraph, i) => (
            <div key={i} className="mb-3 last:mb-0">
              {paragraph.split("\n").map((line, j) => renderMathLine(line, j))}
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 p-4 bg-card border border-border rounded-xl dark:bg-transparent dark:border-0 dark:p-0">
        <h3 className="text-sm font-semibold mb-3 text-foreground px-4 dark:px-0">{chartTitle}</h3>
        
        {/* Parameter Sliders */}
        {Object.keys(parameters).length > 0 && (
          <div className="mb-4 space-y-3 p-3 bg-muted/30 rounded-lg border border-border/50 mx-4 dark:mx-0">
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
        
        {/* Graph */}
        <div className="w-full overflow-x-auto">
          <LineChart 
            width={Math.max(400, allChartData.combinedData.length * 10)} 
            height={300} 
            data={allChartData.combinedData}
          >
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
                borderRadius: '8px'
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
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </div>
        
        {/* Legend for multiple functions */}
        {allChartData.datasets.length > 1 && (
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
        )}
      </div>
    </div>
  );
}

