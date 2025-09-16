import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SingleImageGenerationRequest {
  prompt: string;
  quality: 'standard' | '4k';
  model: 'seedream-4' | 'flux-1.1-pro-ultra';
  promptId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const segmindApiKey = Deno.env.get('SEGMIND_API_KEY');
    if (!segmindApiKey) {
      throw new Error('SEGMIND_API_KEY is not set');
    }

    const { prompt, quality, model = 'seedream-4', promptId }: SingleImageGenerationRequest = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Generating single image with ${quality} quality using ${model} model: ${prompt.substring(0, 50)}...`);

    // Configure parameters based on model and quality
    const getModelConfig = (model: string, quality: string) => {
      if (model === 'flux-1.1-pro-ultra') {
        return {
          endpoint: 'https://api.segmind.com/v1/flux-1.1-pro-ultra',
          steps: quality === '4k' ? 25 : 12,
          params: {
            aspect_ratio: '16:9',
            raw: false
          }
        };
      } else {
        // Seedream-4 configuration with proper HD and 4K dimensions for 16:9 YouTube thumbnails
        const dimensions = quality === '4k' 
          ? { width: 3840, height: 2160, size: '3840x2160' }  // True 4K
          : { width: 1920, height: 1080, size: '1920x1080' }; // True HD
        
        return {
          endpoint: 'https://api.segmind.com/v1/seedream-4',
          steps: quality === '4k' ? 20 : 6,
          params: {
            size: dimensions.size,
            width: dimensions.width,
            height: dimensions.height,
            aspect_ratio: '16:9'
          }
        };
      }
    };

    const modelConfig = getModelConfig(model, quality);

    const response = await fetch(modelConfig.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': segmindApiKey,
      },
      body: JSON.stringify({
        prompt: prompt,
        steps: modelConfig.steps,
        seed: Math.floor(Math.random() * 2147483647),
        ...modelConfig.params
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Segmind API error:`, response.status, errorText);
      
      // Parse specific API error messages
      let enhancedError = `API error: ${response.status}`;
      
      if (errorText) {
        const lowerErrorText = errorText.toLowerCase();
        if (lowerErrorText.includes('content') && (lowerErrorText.includes('block') || lowerErrorText.includes('inappropriate'))) {
          enhancedError = 'Content blocked by AI safety filters';
        } else if (lowerErrorText.includes('rate') || lowerErrorText.includes('limit')) {
          enhancedError = 'Rate limit exceeded';
        } else if (lowerErrorText.includes('quota') || lowerErrorText.includes('credit')) {
          enhancedError = 'API quota exceeded';
        } else {
          enhancedError = errorText;
        }
      }
      
      throw new Error(enhancedError);
    }

    // Get binary image data and convert to base64
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to base64 using chunked approach to avoid call stack overflow
    let binaryString = '';
    const chunkSize = 1024;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      binaryString += String.fromCharCode(...chunk);
    }
    const base64Data = btoa(binaryString);
    
    console.log(`Successfully generated single image for prompt: ${promptId}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        image: {
          promptId: promptId,
          imageUrl: `data:image/jpeg;base64,${base64Data}`,
          quality: quality,
          model: model,
          seed: Math.floor(Math.random() * 2147483647)
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-single-image function:', error);
    
    // Parse and categorize different API error types
    let errorMessage = 'An unexpected error occurred';
    let errorType = 'unknown';
    
    if (error.message) {
      const errorText = error.message.toLowerCase();
      
      if (errorText.includes('content') && (errorText.includes('block') || errorText.includes('sensitive') || errorText.includes('inappropriate'))) {
        errorMessage = 'Content blocked: Prompt may contain sensitive or inappropriate content';
        errorType = 'content_blocked';
      } else if (errorText.includes('rate limit') || errorText.includes('too many requests')) {
        errorMessage = 'Rate limit exceeded: Please wait before retrying';
        errorType = 'rate_limit';
      } else if (errorText.includes('timeout') || errorText.includes('time out')) {
        errorMessage = 'Request timeout: Please try again';
        errorType = 'timeout';
      } else if (errorText.includes('quota') || errorText.includes('credits')) {
        errorMessage = 'API quota exceeded: Service temporarily unavailable';
        errorType = 'quota_exceeded';
      } else if (errorText.includes('invalid') && errorText.includes('prompt')) {
        errorMessage = 'Invalid prompt: Please try a different description';
        errorType = 'invalid_prompt';
      } else if (errorText.includes('api') && errorText.includes('error')) {
        errorMessage = 'API service error: Please try again later';
        errorType = 'api_error';
      } else {
        errorMessage = error.message;
        errorType = 'unknown';
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        errorType: errorType,
        promptId: (await req.json().catch(() => ({})))?.promptId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});