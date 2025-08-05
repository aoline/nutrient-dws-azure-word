import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import FormData from 'form-data';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Processing viewer upload request');

    // Get API key from environment
    const apiKey = process.env.NUTRIENT_VIEWER_API_KEY;
    if (!apiKey) {
      console.error('NUTRIENT_VIEWER_API_KEY not configured');
      return res.status(500).json({ error: 'Viewer API key not configured' });
    }

    // Parse multipart form data
    const formData = req.body;
    const file = formData.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Prepare request to Nutrient.io Viewer API
    const nutrientFormData = new FormData();
    
    // Convert file to Buffer for FormData
    const buffer = Buffer.from(file.data || file);
    
    nutrientFormData.append('file', buffer, {
      filename: file.name || 'document.pdf',
      contentType: file.type || 'application/pdf',
    });

    // Make request to Nutrient.io Viewer API
    const response = await axios.post('https://api.nutrient.io/viewer/documents', nutrientFormData, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        ...nutrientFormData.getHeaders(),
      },
      timeout: 60000, // 1 minute
    });

    console.log('Nutrient.io Viewer API response:', response.data);

    // Return the document ID
    res.setHeader('Content-Type', 'application/json');
    res.json({
      success: true,
      documentId: response.data.document_id || response.data.id,
    });

  } catch (error) {
    console.error('Error in viewer upload function:', error);
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data || error.message;
      
      return res.status(status).json({ 
        error: 'Nutrient.io Viewer API error',
        details: message 
      });
    }

    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 