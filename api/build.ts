import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import FormData from 'form-data';

interface ProcessingInstructions {
  format?: string;
  ocr?: boolean;
  redact?: boolean;
  stripMetadata?: boolean;
  action?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Processing build request');

    // Get API key from environment
    const apiKey = process.env.NUTRIENT_API_KEY;
    if (!apiKey) {
      console.error('NUTRIENT_API_KEY not configured');
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Parse multipart form data
    const formData = req.body;
    const file = formData.file;
    const instructionsStr = formData.instructions;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    if (!instructionsStr) {
      return res.status(400).json({ error: 'No instructions provided' });
    }

    const instructions: ProcessingInstructions = JSON.parse(instructionsStr);
    console.log('Instructions:', instructions);

    // Prepare request to Nutrient.io API
    const nutrientFormData = new FormData();
    
    // Convert file to Buffer for FormData
    const buffer = Buffer.from(file.data || file);
    
    nutrientFormData.append('file', buffer, {
      filename: file.name || 'document.docx',
      contentType: file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    // Add instructions as headers
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${apiKey}`,
      'x-instructions': JSON.stringify(instructions),
      'x-filename': file.name || 'document.docx',
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

    console.log('Nutrient.io API response status:', response.status);

    // Return the PDF binary data
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${(file.name || 'document').replace(/\.[^/.]+$/, '.pdf')}"`);
    res.send(Buffer.from(response.data));

  } catch (error) {
    console.error('Error in build function:', error);
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data || error.message;
      
      return res.status(status).json({ 
        error: 'Nutrient.io API error',
        details: message 
      });
    }

    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 