/**
 * Chat Export Utilities
 * Supports exporting chats in multiple formats: JSON, Markdown, PDF, Word
 */

export type ExportFormat = 'json' | 'markdown' | 'pdf' | 'word';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  name: string;
  text: string;
  timestamp: number;
  sources?: any[];
  file?: any;
  files?: any[];
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt?: number;
}

/**
 * Export chat as Markdown
 */
export function exportAsMarkdown(chat: Chat): string {
  const lines: string[] = [];
  
  lines.push(`# ${chat.title}\n`);
  lines.push(`**Exported:** ${new Date().toLocaleString()}`);
  lines.push(`**Messages:** ${chat.messages.length}\n`);
  lines.push('---\n');
  
  chat.messages.forEach((msg) => {
    const timestamp = new Date(msg.timestamp).toLocaleString();
    const senderName = msg.sender === 'bot' ? 'CourseConnect AI' : msg.name;
    const role = msg.sender === 'bot' ? '🤖' : '👤';
    
    lines.push(`\n## ${role} ${senderName}`);
    lines.push(`*${timestamp}*\n`);
    
    // Clean up the text - remove markdown artifacts if any
    let cleanText = msg.text;
    // Preserve code blocks
    const codeBlockRegex = /```[\s\S]*?```/g;
    const codeBlocks: string[] = [];
    cleanText = cleanText.replace(codeBlockRegex, (match) => {
      codeBlocks.push(match);
      return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
    });
    
    // Split into lines and process
    const textLines = cleanText.split('\n');
    textLines.forEach(line => {
      lines.push(line);
    });
    
    // Restore code blocks
    codeBlocks.forEach((block, idx) => {
      const placeholder = `__CODE_BLOCK_${idx}__`;
      const lineIndex = lines.findIndex(l => l.includes(placeholder));
      if (lineIndex !== -1) {
        lines[lineIndex] = lines[lineIndex].replace(placeholder, block);
      }
    });
    
    if (msg.sources && msg.sources.length > 0) {
      lines.push('\n**Sources:**');
      msg.sources.forEach((source: any) => {
        if (source.fileName) {
          lines.push(`- ${source.fileName}${source.page ? ` (Page ${source.page})` : ''}`);
        }
      });
    }
    
    lines.push('\n---');
  });
  
  return lines.join('\n');
}

/**
 * Export chat as PDF using browser print API
 * Opens print dialog where user can save as PDF
 */
export async function exportAsPDF(chat: Chat): Promise<void> {
  // Create HTML content optimized for printing
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${chat.title}</title>
        <style>
          @media print {
            @page {
              margin: 1in;
            }
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
          }
          h1 {
            color: #2563eb;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 10px;
            page-break-after: avoid;
          }
          .meta {
            color: #666;
            font-size: 14px;
            margin-bottom: 30px;
            page-break-after: avoid;
          }
          .message {
            margin-bottom: 30px;
            padding: 15px;
            border-left: 4px solid #e5e7eb;
            background: #f9fafb;
            page-break-inside: avoid;
          }
          .message.user {
            border-left-color: #3b82f6;
            background: #eff6ff;
          }
          .message.bot {
            border-left-color: #10b981;
            background: #f0fdf4;
          }
          .message-header {
            font-weight: 600;
            margin-bottom: 10px;
            color: #111;
          }
          .message-time {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
          }
          .message-content {
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          .sources {
            margin-top: 10px;
            font-size: 12px;
            color: #666;
          }
          .sources ul {
            margin: 5px 0;
            padding-left: 20px;
          }
          code {
            background: #f3f4f6;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
          }
          pre {
            background: #1f2937;
            color: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            overflow-x: auto;
            page-break-inside: avoid;
          }
          pre code {
            background: transparent;
            padding: 0;
            color: inherit;
          }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(chat.title)}</h1>
        <div class="meta">
          <strong>Exported:</strong> ${new Date().toLocaleString()}<br>
          <strong>Messages:</strong> ${chat.messages.length}
        </div>
        ${chat.messages.map(msg => {
          const timestamp = new Date(msg.timestamp).toLocaleString();
          const senderName = msg.sender === 'bot' ? 'CourseConnect AI' : escapeHtml(msg.name);
          const role = msg.sender === 'bot' ? '🤖' : '👤';
          const messageClass = msg.sender === 'bot' ? 'bot' : 'user';
          
          let content = escapeHtml(msg.text);
          // Convert code blocks
          content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre><code>${escapeHtml(code)}</code></pre>`;
          });
          // Convert inline code
          content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
          // Convert line breaks
          content = content.replace(/\n/g, '<br>');
          
          let sourcesHtml = '';
          if (msg.sources && msg.sources.length > 0) {
            sourcesHtml = '<div class="sources"><strong>Sources:</strong><ul>';
            msg.sources.forEach((source: any) => {
              if (source.fileName) {
                sourcesHtml += `<li>${escapeHtml(source.fileName)}${source.page ? ` (Page ${source.page})` : ''}</li>`;
              }
            });
            sourcesHtml += '</ul></div>';
          }
          
          return `
            <div class="message ${messageClass}">
              <div class="message-header">${role} ${senderName}</div>
              <div class="message-content">${content}</div>
              ${sourcesHtml}
              <div class="message-time">${timestamp}</div>
            </div>
          `;
        }).join('')}
      </body>
    </html>
  `;
  
  // Open print dialog for PDF export
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Could not open print window. Please allow popups to export as PDF.');
  }
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Wait for content to load, then trigger print dialog
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      // Note: User will use browser's "Save as PDF" option in print dialog
    }, 250);
  };
}

/**
 * Export chat as Word document (DOCX format using HTML)
 */
export function exportAsWord(chat: Chat): Blob {
  const htmlContent = `
    <!DOCTYPE html>
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>${chat.title}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>90</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: 8.5in 11in;
            margin: 1in;
          }
          body {
            font-family: 'Calibri', 'Arial', sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #000;
          }
          h1 {
            color: #2563eb;
            font-size: 24pt;
            margin-bottom: 12pt;
            border-bottom: 2pt solid #2563eb;
            padding-bottom: 6pt;
          }
          .meta {
            color: #666;
            font-size: 10pt;
            margin-bottom: 18pt;
          }
          .message {
            margin-bottom: 18pt;
            padding: 12pt;
            border-left: 3pt solid #e5e7eb;
            background: #f9fafb;
            page-break-inside: avoid;
          }
          .message.user {
            border-left-color: #3b82f6;
            background: #eff6ff;
          }
          .message.bot {
            border-left-color: #10b981;
            background: #f0fdf4;
          }
          .message-header {
            font-weight: bold;
            font-size: 12pt;
            margin-bottom: 6pt;
            color: #000;
          }
          .message-time {
            font-size: 9pt;
            color: #666;
            margin-top: 6pt;
          }
          .message-content {
            white-space: pre-wrap;
            word-wrap: break-word;
            font-size: 11pt;
          }
          .sources {
            margin-top: 6pt;
            font-size: 9pt;
            color: #666;
          }
          code {
            background: #f3f4f6;
            padding: 2pt 4pt;
            border-radius: 2pt;
            font-family: 'Courier New', monospace;
            font-size: 10pt;
          }
          pre {
            background: #1f2937;
            color: #f9fafb;
            padding: 12pt;
            border-radius: 4pt;
            overflow-x: auto;
            font-family: 'Courier New', monospace;
            font-size: 9pt;
          }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(chat.title)}</h1>
        <div class="meta">
          <strong>Exported:</strong> ${new Date().toLocaleString()}<br>
          <strong>Messages:</strong> ${chat.messages.length}
        </div>
        ${chat.messages.map(msg => {
          const timestamp = new Date(msg.timestamp).toLocaleString();
          const senderName = msg.sender === 'bot' ? 'CourseConnect AI' : escapeHtml(msg.name);
          const role = msg.sender === 'bot' ? '🤖' : '👤';
          const messageClass = msg.sender === 'bot' ? 'bot' : 'user';
          
          let content = escapeHtml(msg.text);
          // Convert code blocks
          content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            return `<pre><code>${escapeHtml(code)}</code></pre>`;
          });
          // Convert inline code
          content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
          // Convert line breaks
          content = content.replace(/\n/g, '<br>');
          
          let sourcesHtml = '';
          if (msg.sources && msg.sources.length > 0) {
            sourcesHtml = '<div class="sources"><strong>Sources:</strong><ul>';
            msg.sources.forEach((source: any) => {
              if (source.fileName) {
                sourcesHtml += `<li>${escapeHtml(source.fileName)}${source.page ? ` (Page ${source.page})` : ''}</li>`;
              }
            });
            sourcesHtml += '</ul></div>';
          }
          
          return `
            <div class="message ${messageClass}">
              <div class="message-header">${role} ${senderName}</div>
              <div class="message-content">${content}</div>
              ${sourcesHtml}
              <div class="message-time">${timestamp}</div>
            </div>
          `;
        }).join('')}
      </body>
    </html>
  `;
  
  // Create a blob with Word-compatible HTML
  const blob = new Blob(['\ufeff', htmlContent], { 
    type: 'application/msword' 
  });
  
  return blob;
}

/**
 * Export chat in the specified format
 */
export async function exportChat(chat: Chat, format: ExportFormat): Promise<void> {
  const sanitizedTitle = chat.title.replace(/[^a-z0-9]/gi, '_');
  const timestamp = new Date().toISOString().split('T')[0];
  
  let blob: Blob;
  let filename: string;
  let mimeType: string;
  
  switch (format) {
    case 'json': {
      const exportData = {
        chatName: chat.title,
        exportDate: new Date().toISOString(),
        messageCount: chat.messages.length,
        messages: chat.messages.map(msg => ({
          sender: msg.sender,
          name: msg.name,
          text: msg.text,
          timestamp: new Date(msg.timestamp).toLocaleString()
        }))
      };
      blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      filename = `${sanitizedTitle}_chat_export_${timestamp}.json`;
      mimeType = 'application/json';
      break;
    }
    
    case 'markdown': {
      const markdown = exportAsMarkdown(chat);
      blob = new Blob([markdown], { type: 'text/markdown' });
      filename = `${sanitizedTitle}_chat_export_${timestamp}.md`;
      mimeType = 'text/markdown';
      break;
    }
    
    case 'pdf': {
      // For PDF, we'll use the print dialog approach
      // This opens the print dialog where user can save as PDF
      try {
        await exportAsPDF(chat);
        return; // Print dialog handles the rest - user saves via browser
      } catch (error: any) {
        console.error('PDF export error:', error);
        throw new Error(error.message || 'Could not export as PDF. Please allow popups.');
      }
    }
    
    case 'word': {
      blob = exportAsWord(chat);
      filename = `${sanitizedTitle}_chat_export_${timestamp}.doc`;
      mimeType = 'application/msword';
      break;
    }
    
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
  
  // Download the file
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Helper function to escape HTML
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

