/**
 * Smart Ollama Model Manager
 * Automatically selects the best available model based on hardware capabilities
 */

export interface OllamaModel {
  name: string;
  size: string;
  performance: 'high' | 'medium' | 'low';
  capability: 'general' | 'coding' | 'vision' | 'embedding';
  memory_required: number; // in MB
}

export const AVAILABLE_MODELS: OllamaModel[] = [
  {
    name: 'llama3.1:70b',
    size: '40+ GB',
    performance: 'high',
    capability: 'general',
    memory_required: 40960
  },
  {
    name: 'llama3.1:8b',
    size: '4.9 GB', 
    performance: 'high',
    capability: 'general',
    memory_required: 4900
  },
  {
    name: 'llava:latest',
    size: '4.7 GB',
    performance: 'medium',
    capability: 'vision',
    memory_required: 4700
  },
  {
    name: 'codellama:latest',
    size: '3.8 GB',
    performance: 'high',
    capability: 'coding',
    memory_required: 3800
  },
  {
    name: 'gemma2:2b',
    size: '1.6 GB',
    performance: 'medium',
    capability: 'general',
    memory_required: 1600
  },
  {
    name: 'qwen2.5:1.5b',
    size: '986 MB',
    performance: 'low',
    capability: 'general',
    memory_required: 986
  },
  {
    name: 'nomic-embed-text:latest',
    size: '274 MB',
    performance: 'low',
    capability: 'embedding',
    memory_required: 274
  }
];

export class OllamaModelManager {
  private static installedModelNames: string[] = [];

  // Ensure fresh model cache on server-side
  static async ensureModelCacheFresh(): Promise<void> {
    try {
      const res = await fetch('http://localhost:11434/api/tags');
      if (res.ok) {
        const body = await res.json();
        this.installedModelNames = body.models?.map((m: any) => m.name) ?? [];
        console.log('[OllamaModelManager] Refres models:', this.installedModelNames);
      }
    } catch (err) {
      console.warn('[OllamaModelManager] Could not reach Ollama /api/tags:', (err as Error).message);
      this.installedModelNames = ['llama3.1:8b', 'gemma2:2b', 'qwen2.5:1.5b'];
    }
  }

  /**
   * Get the best available model for general chat/analysis
   */
  static getBestGeneralModel(): string {
    // Prioritize GPT OSS model (qwen2.5:1.5b) for best chat experience
    if (this.isModelAvailable('qwen2.5:1.5b')) {
      return 'qwen2.5:1.5b';
    }
    
    // Try gemma3:1b second (815MB - fastest)
    if (this.isModelAvailable('gemma3:1b')) {
      return 'gemma3:1b';
    }
    
    // Try gemma2:2b third (1.6GB - fast)
    if (this.isModelAvailable('gemma2:2b')) {
      return 'gemma2:2b';
    }
    
    // Fallback to llama3.1:8b for better quality when needed
    if (this.isModelAvailable('llama3.1:8b')) {
      return 'llama3.1:8b';
    }
    
    // If none available, return empty string (will trigger fallback)
    return '';
  }
  
  /**
   * Get the best model for coding tasks
   */
  static getBestCodingModel(): string {
    if (this.isModelAvailable('codellama:latest')) {
      return 'codellama:latest';
    }
    
    // Fallback to general models
    return this.getBestGeneralModel();
  }
  
  /**
   * Get the best model for vision/image analysis
   */
  static getBestVisionModel(): string {
    if (this.isModelAvailable('llava:latest')) {
      return 'llava:latest';
    }
    
    // Vision capabilities would need specialized handling
    return this.getBestGeneralModel();
  }
  
  /**
   * Get the best model for mathematical analysis
   */
  static getBestMathModel(): string {
    // For math, prefer models with strong reasoning capabilities
    // Try larger models first for better mathematical reasoning
    if (this.isModelAvailable('llama3.1:8b')) {
      return 'llama3.1:8b';
    }
    
    if (this.isModelAvailable('gemma2:2b')) {
      return 'gemma2:2b';
    }
    
    // Fallback to general model
    return this.getBestGeneralModel();
  }
  
  /**
   * Check if a model is available
   */
  static isModelAvailable(modelName: string): boolean {
    // For now, we'll check against a cached list
    // In production, this could make an API call to Ollama
    return this.installedModelNames.some(name => 
      name.includes(modelName.split(':')[0])
    );
  }
  
  /**
   * Update the list of available models
   */
  static async refreshAvailableModels(): Promise<void> {
    await this.ensureModelCacheFresh();
  }
  
  /**
   * Get optimized parameters for a model
   */
  static getOptimalParameters(modelName: string) {
    const model = AVAILABLE_MODELS.find(m => m.name === modelName);
    
    if (!model) {
      // Default parameters
      return {
        temperature: 0.6,
        max_tokens: 1000,
        num_ctx: 2048,
        top_p: 0.9,
        top_k: 40
      };
    }
    
    // High-performance models - more conversational
    if (model.performance === 'high') {
      return {
        temperature: 0.8, // More natural and conversational
        max_tokens: 2000,
        num_ctx: 6144, // Better context but not overwhelming
        top_p: 0.95, // More diverse responses
        top_k: 40
      };
    }
    
    // Medium performance models
    if (model.performance === 'medium') {
      return {
        temperature: 0.8, // Maintain conversational tone
        max_tokens: 1500,
        num_ctx: 4096,
        top_p: 0.95,
        top_k: 40
      };
    }
    
    // Low performance models - still conversational
    return {
      temperature: 0.85, // Even more conversational for smaller models
      max_tokens: 1000,
      num_ctx: 4096, // Give smaller models good context too
      top_p: 0.95,
      top_k: 40
    };
  }
}

// Note: Avoid triggering network calls at module import time in serverless/edge runtimes.
// Call `OllamaModelManager.refreshAvailableModels()` from handlers as needed instead.
