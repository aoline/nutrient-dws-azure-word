# Nutrient.io MS Word Add-in

A Microsoft Word Add-in that integrates with Nutrient.io's Document Engine (Processor API) and Viewer API to provide PDF conversion, import, and redaction capabilities.

## Features

- **Export to PDF**: Convert Word documents to PDF (PDF/A, PDF/UA) with live preview
- **Import from PDF**: Convert PDFs to Word documents using OCR
- **Redaction & Metadata Stripping**: Remove sensitive information and metadata
- **Secure Backend**: Vercel serverless functions for CORS and API key protection
- **Viewer Integration**: Embed processed PDFs in iframe for preview

## Architecture

```
[Word Add-in (OfficeJS + React)]
    ↕ retrieves document via Office.context
    ↓ POST file + instructions
[Vercel Serverless Functions]
 ├─ /api/build           ↔ Nutrient `/build`
 └─ /api/viewer-upload   ↔ Nutrient `/viewer/documents`
    ↓ responses (PDF or JSON)
[Word Add-in UI]
    ↕ embeds PDF in iframe (Viewer)
    ↕ triggers Save
```

## Quick Start

### Prerequisites

- Node.js 18+
- Vercel CLI (`npm install -g vercel`)
- Nutrient.io API keys (Processor + Viewer)
- Microsoft Word (desktop or online)

### Local Development

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd nutrient-dws-azure-word
   npm install --legacy-peer-deps
   ```

2. **Configure environment variables:**
   ```bash
   # Create .env.local file
   echo "NUTRIENT_API_KEY=your-processor-api-key" > .env.local
   echo "NUTRIENT_VIEWER_API_KEY=your-viewer-api-key" >> .env.local
   ```

3. **Start development servers:**
   ```bash
   # Terminal 1: Start Vercel dev server (includes API routes)
   npm run vercel:dev
   
   # Terminal 2: Start frontend dev server
   npm run dev
   ```

4. **Sideload the add-in:**
   ```bash
   npm run sideload
   ```

### Production Deployment with Vercel

1. **Deploy to Vercel:**
   ```bash
   # First time setup
   vercel login
   vercel
   
   # For production deployment
   npm run vercel:deploy
   ```

2. **Configure environment variables in Vercel:**
   - Go to your Vercel dashboard
   - Navigate to Settings → Environment Variables
   - Add:
     - `NUTRIENT_API_KEY` = your processor API key
     - `NUTRIENT_VIEWER_API_KEY` = your viewer API key

3. **Update manifest.xml:**
   - Replace `https://localhost:3000` with your Vercel deployment URL
   - Update `AppDomains` to include your Vercel domain

## Project Structure

```
nutrient-dws-azure-word/
├── src/                          # Frontend React app
│   ├── components/               # React components
│   ├── services/                 # API services
│   ├── types/                    # TypeScript definitions
│   └── utils/                    # Utility functions
├── api/                          # Vercel serverless functions
│   ├── build.ts                  # PDF conversion endpoint
│   └── viewer-upload.ts          # Viewer upload endpoint
├── manifest.xml                  # Office Add-in manifest
├── package.json                  # Dependencies and scripts
├── vercel.json                   # Vercel configuration
└── .env                          # Environment variables
```

## API Endpoints

### Vercel Serverless Functions

- `POST /api/build` - Proxy to Nutrient.io build API
- `POST /api/viewer-upload` - Proxy to Nutrient.io viewer API

### Request Format

```typescript
// Build API
{
  file: File,
  instructions: {
    format: 'pdf' | 'pdf-a' | 'pdf-ua',
    ocr: boolean,
    redact: boolean,
    stripMetadata: boolean
  }
}

// Viewer API
{
  file: File
}
```

## Configuration

### Environment Variables

- `NUTRIENT_API_KEY` - Processor API key for PDF conversion
- `NUTRIENT_VIEWER_API_KEY` - Viewer API key for PDF embedding

### CORS Settings

Vercel automatically handles CORS for serverless functions. The configuration is in `vercel.json`.

## Development Commands

```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Lint code

# Vercel
npm run vercel:dev   # Start Vercel dev server
npm run vercel:deploy # Deploy to production

# Office Add-in
npm run sideload     # Sideload add-in to Word
npm run validate     # Validate manifest
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Vercel handles CORS automatically
2. **API Key Errors**: Verify environment variables are set in Vercel dashboard
3. **Office.js Loading**: Check manifest.xml source location
4. **Build Failures**: Ensure all dependencies are installed with `--legacy-peer-deps`

### Debug Mode

Enable debug logging in Vercel functions by adding console.log statements.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the [developer handover document](developer_handover_document.md)
- Review [Nutrient.io API documentation](https://www.nutrient.io/api/)
- Contact the development team 