# Express.js Backend Integration

## Overview

The add-in now uses an Express.js server as the backend instead of Vercel Functions. This provides better control, easier debugging, and more flexibility for the document conversion process.

## 🏗️ Architecture

### Backend Components

```
Express.js Server (.vercel/server.js)
├── Static File Serving (dist/*)
├── CORS Middleware
├── Health Check (/health)
├── API Status (/api/status)
├── Document Conversion (/convert)
└── Legacy Endpoints (/api/build, /api/viewer-upload)
```

### Frontend Integration

```
Word Add-in (React + TypeScript)
├── DocumentService.ts (Updated for Express.js)
├── Office.js Integration
├── File Upload Handling
└── Response Processing
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd .vercel
npm install
```

### 2. Set Environment Variables

```bash
export NUTRIENT_DWS_API_KEY=your_dws_api_key_here
export NUTRIENT_VIEWER_API_KEY=your_viewer_api_key_here
```

### 3. Start the Server

```bash
# Option 1: Use the start script
./start-express-server.sh

# Option 2: Manual start
cd .vercel
npm start
```

### 4. Test the Integration

Visit: `http://localhost:3000/minimal.html`

## 📋 API Endpoints

### Health Check
- **URL**: `GET /health`
- **Purpose**: Verify server is running
- **Response**: Server status and timestamp

```json
{
  "status": "ok",
  "timestamp": "2025-08-05T20:30:00.000Z",
  "environment": "development"
}
```

### API Status
- **URL**: `GET /api/status`
- **Purpose**: Check API configuration and endpoints
- **Response**: Available endpoints and environment info

```json
{
  "status": "running",
  "endpoints": {
    "convert": "/convert",
    "health": "/health",
    "status": "/api/status"
  },
  "environment": {
    "nodeEnv": "development",
    "hasDwsKey": true,
    "hasViewerKey": true
  }
}
```

### Document Conversion
- **URL**: `POST /convert`
- **Purpose**: Convert Word document to PDF and upload to viewer
- **Request**: Multipart form data with file
- **Response**: Document token and URLs

```json
{
  "success": true,
  "documentToken": "doc_abc123",
  "viewerUrl": "https://dws-viewer.nutrient-powered.io/view/doc_abc123",
  "downloadUrl": "https://dws-viewer.nutrient-powered.io/download/doc_abc123"
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NUTRIENT_DWS_API_KEY` | DWS Processor API key | Yes |
| `NUTRIENT_VIEWER_API_KEY` | DWS Viewer API key | Yes |
| `PORT` | Server port (default: 3000) | No |
| `NODE_ENV` | Environment (development/production) | No |

### Server Configuration

```javascript
// .vercel/server.js
const PORT = process.env.PORT || 3000;
const DWS_API_KEY = process.env.NUTRIENT_DWS_API_KEY;
const VIEWER_API_KEY = process.env.NUTRIENT_VIEWER_API_KEY;
```

## 🔄 Document Conversion Flow

### 1. File Upload
```typescript
// Frontend sends document file
const formData = new FormData();
formData.append('file', documentFile, 'document.docx');
```

### 2. DWS Processor API
```javascript
// Backend sends to DWS Processor
const processorResponse = await axios.post(
  'https://dws-processor.nutrient.io/api/convert',
  processorForm,
  {
    headers: {
      Authorization: `Bearer ${DWS_API_KEY}`,
    },
    responseType: 'arraybuffer',
  }
);
```

### 3. DWS Viewer API
```javascript
// Backend uploads to DWS Viewer
const viewerResponse = await axios.post(
  'https://dws-viewer.nutrient-powered.io/api/documents',
  viewerForm,
  {
    headers: {
      Authorization: `Bearer ${VIEWER_API_KEY}`,
    },
  }
);
```

### 4. Response Processing
```typescript
// Frontend receives document token
const result = await response.json();
const viewerUrl = `https://dws-viewer.nutrient-powered.io/view/${result.documentToken}`;
```

## 🛠️ Development

### Local Development

1. **Start the server**:
   ```bash
   cd .vercel
   npm run dev  # Uses nodemon for auto-restart
   ```

2. **Test endpoints**:
   ```bash
   curl http://localhost:3000/health
   curl http://localhost:3000/api/status
   ```

3. **Test conversion** (with file):
   ```bash
   curl -X POST -F "file=@document.docx" http://localhost:3000/convert
   ```

### Debugging

#### Server Logs
```javascript
// Enable detailed logging
console.log('Received conversion request');
console.log(`Processing file: ${fileName}`);
console.log('DWS Processor API response received');
console.log(`Document token received: ${documentToken}`);
```

#### Error Handling
```javascript
try {
  // Conversion logic
} catch (err) {
  console.error('Conversion error:', err.response?.data || err.message);
  res.status(500).json({ 
    error: 'Conversion failed', 
    details: err.message,
    timestamp: new Date().toISOString()
  });
}
```

## 🔒 Security

### CORS Configuration
```javascript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
```

### API Key Protection
- API keys are stored in environment variables
- Keys are never exposed to the frontend
- Server validates keys before making API calls

### File Upload Security
- Files are stored temporarily in `uploads/` directory
- Files are automatically cleaned up after processing
- File size and type validation can be added

## 📊 Monitoring

### Health Checks
- **Endpoint**: `/health`
- **Frequency**: Every 30 seconds
- **Response**: Server status and uptime

### API Status
- **Endpoint**: `/api/status`
- **Purpose**: Monitor API configuration
- **Response**: Environment and endpoint status

### Error Tracking
```javascript
// Log all errors with timestamps
console.error('Conversion error:', {
  error: err.message,
  timestamp: new Date().toISOString(),
  file: req.file?.originalname,
  status: err.response?.status
});
```

## 🚀 Deployment

### Local Deployment
```bash
# Build the frontend
npm run build

# Start the server
cd .vercel
npm start
```

### Production Deployment
```bash
# Set production environment
export NODE_ENV=production
export PORT=3000

# Start the server
cd .vercel
npm start
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY .vercel/package*.json ./
RUN npm install
COPY .vercel/ ./
COPY dist/ ./dist/
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔄 Migration from Vercel Functions

### Changes Made

1. **Backend**: Express.js server replaces Vercel Functions
2. **Frontend**: DocumentService updated to use `/convert` endpoint
3. **File Handling**: Direct file upload instead of blob URLs
4. **Error Handling**: Enhanced error reporting and logging

### Benefits

- **Better Control**: Full control over server configuration
- **Easier Debugging**: Direct access to server logs
- **Flexibility**: Can add custom middleware and endpoints
- **Performance**: No cold start delays
- **Development**: Faster iteration and testing

## 🧪 Testing

### Manual Testing
1. Start the server: `./start-express-server.sh`
2. Visit: `http://localhost:3000/minimal.html`
3. Click "Test Backend Conversion"
4. Check server logs for detailed information

### Automated Testing
```bash
# Test health endpoint
curl http://localhost:3000/health

# Test API status
curl http://localhost:3000/api/status

# Test conversion (with sample file)
curl -X POST -F "file=@test-document.docx" http://localhost:3000/convert
```

## 📚 Related Documentation

- [Sideloading Detection System](./SIDELOADING_DETECTION.md)
- [Developer Handover Document](./developer_handover_document.md)
- [Minimal Add-in Documentation](./minimal-addin/README.md)

## 🔧 Troubleshooting

### Common Issues

1. **Server won't start**:
   - Check Node.js version (requires 18+)
   - Verify dependencies are installed
   - Check port availability

2. **API keys not working**:
   - Verify environment variables are set
   - Check API key validity
   - Review server logs for errors

3. **File upload fails**:
   - Check file size limits
   - Verify file format
   - Review CORS configuration

4. **Conversion errors**:
   - Check DWS API connectivity
   - Verify API key permissions
   - Review error logs

### Debug Commands
```bash
# Check server status
curl http://localhost:3000/health

# Check API configuration
curl http://localhost:3000/api/status

# Test file upload
curl -X POST -F "file=@test.docx" http://localhost:3000/convert

# View server logs
tail -f .vercel/logs/server.log
```

---

**Created**: 2025-08-05  
**Version**: 1.0  
**Status**: Production Ready 