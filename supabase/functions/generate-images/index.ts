import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImageGenerationRequest {
  prompts: string[];
  quality: 'standard' | '4k';
  model: 'dreamshaper-lightning' | 'seedream-4' | 'flux-1.1-pro-ultra';
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

    const { prompts, quality, model = 'seedream-4' }: ImageGenerationRequest = await req.json();

    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Prompts array is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Generating ${prompts.length} images with ${quality} quality using ${model} model`);

    // Configure parameters based on model and quality
    const getModelConfig = (model: string, quality: string) => {
      if (model === 'dreamshaper-lightning') {
        return {
          endpoint: 'https://api.segmind.com/v1/sdxl-lightning-dreamshaper',
          steps: quality === '4k' ? 6 : 4,
          params: {
            scheduler: 'DPM++ 2M Karras',
            width: quality === '4k' ? 1344 : 1024,
            height: quality === '4k' ? 768 : 576,
            samples: 1,
            guidance_scale: 1.0
          }
        };
      } else if (model === 'flux-1.1-pro-ultra') {
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

    // Generate images in batches of 3 to avoid API rate limits and improve reliability
    const batchSize = 3;
    const results = [];
    
    const generateImageBatch = async (promptBatch: string[], startIndex: number) => {
      const batchPromises = promptBatch.map(async (prompt, batchIndex) => {
        const globalIndex = startIndex + batchIndex;
        console.log(`Generating image ${globalIndex + 1}/${prompts.length}: ${prompt.substring(0, 50)}...`);
        
        try {
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
            console.error(`Segmind API error for prompt ${globalIndex + 1}:`, response.status, errorText);
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
          
          console.log(`Successfully generated image ${globalIndex + 1}/${prompts.length}`);
          
          return {
            promptId: `prompt-${globalIndex}`,
            imageUrl: `data:image/jpeg;base64,${base64Data}`,
            quality: quality,
            model: model,
            seed: Math.floor(Math.random() * 2147483647)
          };
        } catch (error) {
          console.error(`Error generating image ${globalIndex + 1}:`, error);
          return {
            promptId: `prompt-${globalIndex}`,
            imageUrl: null,
            quality: quality,
            model: model,
            error: error.message
          };
        }
      });
      
      return await Promise.all(batchPromises);
    };

    // Process prompts in batches
    for (let i = 0; i < prompts.length; i += batchSize) {
      const batch = prompts.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(prompts.length / batchSize)} (${batch.length} images)`);
      
      const batchResults = await generateImageBatch(batch, i);
      results.push(...batchResults);
      
      // Add a small delay between batches to be API-friendly
      if (i + batchSize < prompts.length) {
        console.log('Waiting 200ms before next batch...');
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log(`Image generation complete. ${results.filter(r => r.imageUrl).length}/${results.length} successful`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        images: results,
        quality: quality,
        model: model,
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