# Nutrient.io MS Word Add-in

A Microsoft Word Add-in that integrates with Nutrient.io's Document Engine (Processor API) and Viewer API to provide PDF conversion, import, and redaction capabilities.

## Features

- **Export to PDF**: Convert Word documents to PDF (PDF/A, PDF/UA) with live preview
- **Import from PDF**: Convert PDFs to Word documents using OCR
- **Redaction & Metadata Stripping**: Remove sensitive information and metadata
- **Secure Backend**: Azure Functions proxy for CORS and API key protection
- **Viewer Integration**: Embed processed PDFs in iframe for preview

## Architecture

```
[Word Add-in (OfficeJS + React)]
    ↕ retrieves document via Office.context
    ↓ POST file + instructions
[Azure Functions Proxy]
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
- Azure Functions Core Tools
- Nutrient.io API keys (Processor + Viewer)
- Microsoft Word (desktop or online)

### Local Development

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd nutrient-dws-azure-word
   npm install
   cd azure-functions && npm install
   ```

2. **Configure environment variables:**
   ```bash
   # Copy and edit local settings
   cp azure-functions/local.settings.json.example azure-functions/local.settings.json
   # Add your API keys to local.settings.json
   ```

3. **Start development servers:**
   ```bash
   # Terminal 1: Start Azure Functions
   cd azure-functions
   npm start
   
   # Terminal 2: Start frontend dev server
   npm run dev
   ```

4. **Sideload the add-in:**
   ```bash
   npm run sideload
   ```

### Production Deployment

1. **Set up Azure resources:**
   - Create Azure Function App
   - Create Azure Static Web App (optional)
   - Configure CORS settings

2. **Configure GitHub Secrets:**
   - `AZURE_CREDENTIALS`
   - `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`
   - `NUTRIENT_API_KEY`
   - `NUTRIENT_VIEWER_API_KEY`

3. **Deploy:**
   ```bash
   git push origin main
   ```

## Project Structure

```
nutrient-dws-azure-word/
├── src/                          # Frontend React app
│   ├── components/               # React components
│   ├── services/                 # API services
│   ├── types/                    # TypeScript definitions
│   └── utils/                    # Utility functions
├── azure-functions/              # Azure Functions backend
│   ├── src/                      # Function source code
│   ├── host.json                 # Functions configuration
│   └── local.settings.json       # Local environment
├── manifest.xml                  # Office Add-in manifest
├── package.json                  # Frontend dependencies
└── .github/workflows/            # CI/CD pipelines
```

## API Endpoints

### Azure Functions

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

Configure in `azure-functions/host.json`:

```json
{
  "http": {
    "cors": {
      "allowedOrigins": [
        "https://localhost:3000",
        "https://your-addin-domain.com"
      ]
    }
  }
}
```

## Development Commands

```bash
# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Lint code

# Azure Functions
cd azure-functions
npm start            # Start local Functions runtime
npm run build        # Build TypeScript

# Office Add-in
npm run sideload     # Sideload add-in to Word
npm run validate     # Validate manifest
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure CORS is configured in `host.json`
2. **API Key Errors**: Verify environment variables are set
3. **Office.js Loading**: Check manifest.xml source location
4. **Build Failures**: Ensure all dependencies are installed

### Debug Mode

Enable debug logging in Azure Functions:

```json
{
  "logging": {
    "logLevel": {
      "default": "Debug"
    }
  }
}
```

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