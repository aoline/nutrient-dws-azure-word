import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import axios from "axios";
import FormData from "form-data";

app.http('viewer-upload', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      context.log('Processing viewer upload request');

      // Get API key from environment
      const apiKey = process.env.NUTRIENT_VIEWER_API_KEY;
      if (!apiKey) {
        context.error('NUTRIENT_VIEWER_API_KEY not configured');
        return {
          status: 500,
          body: JSON.stringify({ error: 'Viewer API key not configured' })
        };
      }

      // Parse multipart form data
      const formData = await request.formData();
      const fileEntry = formData.get('file');

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

      // Prepare request to Nutrient.io Viewer API
      const nutrientFormData = new FormData();
      
      // Convert File to Buffer for FormData
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      nutrientFormData.append('file', buffer, {
        filename: file.name,
        contentType: file.type,
      });

      // Make request to Nutrient.io Viewer API
      const response = await axios.post('https://api.nutrient.io/viewer/documents', nutrientFormData, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          ...nutrientFormData.getHeaders(),
        },
        timeout: 60000, // 1 minute
      });

      context.log('Nutrient.io Viewer API response:', response.data);

      // Return the document ID
      return {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: true,
          documentId: response.data.document_id || response.data.id,
        }),
      };

    } catch (error) {
      context.error('Error in viewer upload function:', error);
      
      if (axios.isAxiosError(error)) {
        const status = error.response?.status || 500;
        const message = error.response?.data || error.message;
        
        return {
          status,
          body: JSON.stringify({ 
            error: 'Nutrient.io Viewer API error',
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