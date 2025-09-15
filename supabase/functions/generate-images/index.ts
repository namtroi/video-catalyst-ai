import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImageGenerationRequest {
  prompts: string[];
  quality: 'standard' | '4k';
}

// Segmind API returns binary image data directly

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

    const { prompts, quality }: ImageGenerationRequest = await req.json();

    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Prompts array is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Generating ${prompts.length} images with ${quality} quality`);

    // Configure parameters based on quality
    const imageConfig = quality === '4k' 
      ? { width: 4096, height: 4096, steps: 20 }
      : { width: 1024, height: 1024, steps: 6 };

    // Generate images for all prompts
    const imagePromises = prompts.map(async (prompt, index) => {
      console.log(`Generating image ${index + 1}/${prompts.length}: ${prompt.substring(0, 50)}...`);
      
      try {
        const response = await fetch('https://api.segmind.com/v1/seedream-4', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': segmindApiKey,
          },
          body: JSON.stringify({
            prompt: prompt,
            width: imageConfig.width,
            height: imageConfig.height,
            steps: imageConfig.steps,
            seed: Math.floor(Math.random() * 2147483647)
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Segmind API error for prompt ${index + 1}:`, response.status, errorText);
          throw new Error(`Segmind API error: ${response.status} ${errorText}`);
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
        
        console.log(`Successfully generated image ${index + 1}/${prompts.length}`);
        
        return {
          promptId: `prompt-${index}`,
          imageUrl: `data:image/jpeg;base64,${base64Data}`,
          quality: quality,
          seed: Math.floor(Math.random() * 2147483647)
        };
      } catch (error) {
        console.error(`Error generating image ${index + 1}:`, error);
        return {
          promptId: `prompt-${index}`,
          imageUrl: null,
          quality: quality,
          error: error.message
        };
      }
    });

    const results = await Promise.all(imagePromises);
    
    console.log(`Image generation complete. ${results.filter(r => r.imageUrl).length}/${results.length} successful`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        images: results,
        quality: quality,
        totalGenerated: results.filter(r => r.imageUrl).length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-images function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unexpected error occurred' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});