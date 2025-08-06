**Developer Handover: MS Word Add-in for Nutrient.io DWS APIs**

---

## 1. Project Overview

This MS Word Add-in integrates with Nutrient.io's Document Engine (Processor API `/build`) and Viewer API to provide:

- **Export to PDF** (PDF/A, PDF/UA) with live preview and download
- **Import from PDF** → DOCX (OCR)
- **Redaction & Metadata Stripping**
- **Viewer Embed** of processed PDFs
- **Secure backend** on Vercel Serverless Functions for CORS and key protection
- **Enhanced Download Functionality** with prominent download links and preview options

---

## 2. Architecture Diagram

```text
[Word Add-in (OfficeJS + React)]
    ↕ retrieves document via Office.context
    ↓ POST file + instructions
[Vercel Serverless Functions]
 ├─ /api/build           ↔ Nutrient `/build`
 └─ /api/viewer-upload   ↔ Nutrient `/viewer/documents`
    ↓ responses (PDF or JSON)
[Word Add-in UI]
    ↕ embeds PDF in iframe (Viewer)
    ↕ triggers Download via blob URL
    ↕ provides Preview link
```

---

## 3. Frontend Setup

- **Tech Stack:** React + TypeScript + OfficeJS + Webpack
- **Project Structure:**
  ```
  src/
  ├── components/          # React UI components
  │   ├── ExportTab.tsx    # PDF export with enhanced download
  │   ├── ImportTab.tsx    # PDF import with drag/drop
  │   └── RedactTab.tsx    # Redaction with enhanced download
  ├── services/            # API integration
  │   └── DocumentService.ts # Office.js + Vercel Functions
  ├── types/               # TypeScript definitions
  ├── __tests__/           # Integration tests
  └── utils/               # Helper functions
  ```

- **Primary UI Tabs:**
  - **Export to PDF:** Capture current `.docx`, call `/api/build`, embed PDF in `<iframe>` via Viewer URL, provide **Download** button with enhanced styling
  - **Import from PDF:** Drag/drop PDF file, OCR toggle, convert to DOCX and insert into document
  - **Redact & Strip Metadata:** Remove sensitive data and metadata, export as clean PDF with enhanced download

- **Key Features:**
  - **Document Retrieval:** `Office.context.document.getFileAsync(Office.FileType.Compressed)` → assemble `Blob`
  - **API Integration:** `fetch()` to Vercel endpoints; wrap `Blob` in `FormData` with `file` and `instructions`
  - **Enhanced Download:** Prominent download buttons with icons, proper filename generation, blob URL handling
  - **Preview Integration:** Both embedded iframe and external preview links
  - **Error Handling:** Comprehensive error states and user feedback
  - **Loading States:** Visual feedback during processing
  - **Responsive Design:** Works in Word taskpane (narrow width)

- **Security:** No user-exposed keys—frontend calls proxies that inject keys server-side

---

## 4. Backend (Vercel Serverless Functions)

### Endpoints

- `POST /api/build`
  - Proxies to `https://api.nutrient.io/build`
  - Expects multipart form data:
    - `file`: Document file (DOCX/PDF)
    - `instructions`: JSON string with processing options
  - Returns binary PDF or DOCX
  - Supports: PDF conversion, OCR, redaction, metadata stripping

- `POST /api/viewer-upload`
  - Proxies to `https://api.nutrient.io/viewer/documents`
  - Expects multipart form data:
    - `file`: PDF file to upload
  - Returns JSON `{ success: true, documentId: string }`
  - Used for embedding PDFs in iframe viewer

### Local Dev

- Environment variables in Vercel dashboard:
  - `NUTRIENT_API_KEY`: Processor API key (PDF conversion)
  - `NUTRIENT_VIEWER_API_KEY`: Viewer API key (PDF embedding)

---

## 5. Enhanced Download Functionality

### Features
- **Prominent Download Buttons:** Styled with icons (📥) and clear call-to-action
- **Smart Filename Generation:** Includes format type (e.g., `document-pdf-a.pdf`)
- **Blob URL Handling:** Uses `URL.createObjectURL()` for secure file downloads
- **Preview Integration:** Both embedded iframe and external preview links
- **Error Recovery:** Graceful handling of download failures

### Implementation
```typescript
// In DocumentService.ts
const pdfUrl = URL.createObjectURL(pdfBlob);
// Creates secure blob URL for download

// In ExportTab.tsx
const handleDownload = () => {
  if (pdfUrl) {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `document-${format}.pdf`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
```

### UI Components
- **Success State:** Blue-themed success box with download and preview options
- **Download Button:** Green button with download icon
- **Preview Button:** Blue button with eye icon, opens in new tab
- **Embedded Viewer:** 400px height iframe for inline preview

---

## 6. Testing Strategy

### Test Coverage
- **Unit Tests:** Component behavior, service methods, utility functions
- **Integration Tests:** Complete export → download flow
- **Download Tests:** Blob URL creation, link generation, file naming

### Test Files
```
src/
├── components/__tests__/
│   ├── ExportTab.test.tsx      # Export component tests
│   └── Download.test.tsx       # Download functionality tests
├── services/__tests__/
│   └── DocumentService.test.ts # Service method tests
└── __tests__/
    └── integration.test.ts     # End-to-end flow tests
```

### Running Tests
```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
npm run test:e2e          # End-to-end tests
```

### Test Examples
```typescript
// Download functionality test
it('should create download link with correct attributes', () => {
  const link = createDownloadLink(pdfUrl, filename);
  expect(link.href).toBe(pdfUrl);
  expect(link.download).toBe(filename);
  expect(link.style.display).toBe('none');
});

// Integration test
it('should complete full export and download flow', async () => {
  const result = await exportToPDF(options);
  expect(result.success).toBe(true);
  expect(result.pdfUrl).toContain('blob:');
  expect(result.viewerUrl).toContain('viewer.nutrient.io');
});
```

---

## 7. Environment Variables & Secrets

- `NUTRIENT_API_KEY` – Processor API key (PDF conversion)
- `NUTRIENT_VIEWER_API_KEY` – Viewer API key (PDF embedding)

### Injection Methods

- **Vercel CLI:**
  ```bash
  vercel env add NUTRIENT_API_KEY
  vercel env add NUTRIENT_VIEWER_API_KEY
  ```
- **Vercel Dashboard:** Configure via Environment Variables section

---

## 8. CI/CD (GitHub Actions)

```yaml
# .github/workflows/deploy-vercel.yml
name: Deploy to Vercel
on: push:
  branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install --legacy-peer-deps
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## 9. Office Add-in Manifest

- **Key Points:**
  - `<SourceLocation DefaultValue="https://localhost:3000/index.html"/>` (dev) or production URL
  - `<Permissions>ReadWriteDocument</Permissions>` for document access
  - Ribbon button in Home tab: "PDF Tools" group
  - CORS domains configured in `AppDomains` section
  - Icons required: 16x16, 32x32, 80x80 PNG files

- **Manifest Features:**
  - Single taskpane with tabbed interface
  - Custom ribbon group "Nutrient.io Tools"
  - Button action: `ShowTaskpane` with `TaskpaneId`
  - Support for both desktop and online Word
  - Version overrides for modern Office features

- **Validation:**
  ```bash
  npm run validate  # Validates manifest.xml
  npm run sideload  # Sideloads to Word for testing
  ```

---

## 10. Developer Checklist

### Setup Requirements
- [ ] Node.js 18+ installed
- [ ] Nutrient.io API keys obtained (Processor + Viewer)
- [ ] Vercel account with project created
- [ ] GitHub repository with secrets configured

### Local Development
- [ ] Clone repository and run `npm install --legacy-peer-deps`
- [ ] Configure environment variables in Vercel dashboard
- [ ] Start frontend dev server: `npm run dev`
- [ ] Sideload add-in: `npm run sideload`
- [ ] Test all three tabs (Export, Import, Redact)
- [ ] Verify download functionality works

### Production Deployment
- [ ] Update `manifest.xml` with production URLs
- [ ] Configure Vercel environment variables
- [ ] Deploy via GitHub Actions: `git push origin main`
- [ ] Test add-in in production environment
- [ ] Verify download links work in production

### Testing Checklist
- [ ] Export Word document to PDF (all formats)
- [ ] Import PDF with OCR enabled/disabled
- [ ] Redact document with metadata stripping
- [ ] Verify PDF viewer embedding works
- [ ] Test download functionality for all formats
- [ ] Verify preview links open correctly
- [ ] Test error handling and user feedback
- [ ] Validate CORS and security settings
- [ ] Run test suite: `npm test`

### Security Considerations
- [ ] API keys stored securely in Vercel environment variables
- [ ] CORS properly configured for production domains
- [ ] Input validation on all API endpoints
- [ ] Error messages don't expose sensitive information
- [ ] HTTPS enforced for all communications
- [ ] Blob URLs properly cleaned up after download

---

## 11. Resources & References

- **Processor API:** [https://www.nutrient.io/api/docx-to-pdf-api/](https://www.nutrient.io/api/docx-to-pdf-api/)
- **Viewer API:** [https://www.nutrient.io/api/viewer-api/](https://www.nutrient.io/api/viewer-api/)
- **OfficeJS Docs:** [https://learn.microsoft.com/office/dev/add-ins/](https://learn.microsoft.com/office/dev/add-ins/)
- **Vercel Functions:** [https://vercel.com/docs/functions](https://vercel.com/docs/functions)
- **Office Add-in Manifest:** [https://learn.microsoft.com/office/dev/add-ins/develop/add-in-manifests](https://learn.microsoft.com/office/dev/add-ins/develop/add-in-manifests)

## 12. Implementation Notes

### Key Implementation Decisions

1. **Architecture Pattern:** Proxy pattern with Vercel Functions to protect API keys
2. **Frontend Framework:** React with TypeScript for type safety and maintainability
3. **Build System:** Webpack for bundling and development server
4. **State Management:** React hooks for local state (no external state library needed)
5. **Error Handling:** Comprehensive error boundaries and user feedback
6. **Security:** API keys stored in Vercel environment variables, never exposed to client
7. **Download UX:** Enhanced download buttons with icons and clear feedback

### Performance Considerations

- **File Size:** Vercel Functions timeout set to 10 seconds for large documents
- **Memory Usage:** Stream processing for large files
- **Caching:** PDF viewer URLs cached to avoid re-uploading
- **Bundle Size:** Webpack optimization for production builds
- **Blob Cleanup:** URLs properly revoked to prevent memory leaks

### Testing Strategy

- **Unit Tests:** Jest for component and service testing
- **Integration Tests:** Complete export → download flow validation
- **E2E Tests:** Manual testing with Word desktop/online
- **Security Tests:** API key exposure validation
- **Download Tests:** Blob URL creation and file download verification

### Deployment Pipeline

1. **Development:** Local webpack dev server with HTTPS
2. **Staging:** Vercel preview deployments
3. **Production:** Automated deployment via GitHub Actions
4. **Monitoring:** Vercel Analytics integration

**Prepared by:** Product Team @ Nutrient.io\
**Date:** 2025-01-27\
**Version:** 3.0 (Enhanced Download & Testing)

