import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import axios from "axios";
import FormData from "form-data";

interface ProcessingInstructions {
  format?: string;
  ocr?: boolean;
  redact?: boolean;
  stripMetadata?: boolean;
  action?: string;
}

app.http('build', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      context.log('Processing build request');

      // Get API key from environment
      const apiKey = process.env.NUTRIENT_API_KEY;
      if (!apiKey) {
        context.error('NUTRIENT_API_KEY not configured');
        return {
          status: 500,
          body: JSON.stringify({ error: 'API key not configured' })
        };
      }

      // Parse multipart form data
      const formData = await request.formData();
      const fileEntry = formData.get('file');
      const instructionsStr = formData.get('instructions') as string;

      if (!fileEntry || !(fileEntry instanceof File)) {
        return {
          status: 400,
          body: JSON.stringify({ error: 'No valid file provided' })
        };
      }
      const file = fileEntry;

      if (!file) {
        return {
          status: 400,
          body: JSON.stringify({ error: 'No file provided' })
        };
      }

      if (!instructionsStr) {
        return {
          status: 400,
          body: JSON.stringify({ error: 'No instructions provided' })
        };
      }

      const instructions: ProcessingInstructions = JSON.parse(instructionsStr);
      context.log('Instructions:', instructions);

      // Prepare request to Nutrient.io API
      const nutrientFormData = new FormData();
      
      // Convert File to Buffer for FormData
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      nutrientFormData.append('file', buffer, {
        filename: file.name,
        contentType: file.type,
      });

      // Add instructions as headers
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${apiKey}`,
        'x-instructions': JSON.stringify(instructions),
        'x-filename': file.name,
      };

      // Make request to Nutrient.io API
      const response = await axios.post('https://api.nutrient.io/build', nutrientFormData, {
        headers: {
          ...headers,
          ...nutrientFormData.getHeaders(),
        },
        responseType: 'arraybuffer',
        timeout: 300000, // 5 minutes
      });

      context.log('Nutrient.io API response status:', response.status);

      // Return the PDF binary data
      return {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${file.name.replace(/\.[^/.]+$/, '.pdf')}"`,
        },
        body: Buffer.from(response.data),
      };

    } catch (error) {
      context.error('Error in build function:', error);
      
      if (axios.isAxiosError(error)) {
        const status = error.response?.status || 500;
        const message = error.response?.data || error.message;
        
        return {
          status,
          body: JSON.stringify({ 
            error: 'Nutrient.io API error',
            details: message 
          })
        };
      }

      return {
        status: 500,
        body: JSON.stringify({ 
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error'
        })
      };
    }
  }
}); 