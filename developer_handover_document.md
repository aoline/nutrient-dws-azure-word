**Developer Handover: MS Word Add-in for Nutrient.io DWS APIs**

---

## 1. Project Overview

This MS Word Add-in integrates with Nutrient.io’s Document Engine (Processor API `/build`) and Viewer API to provide:

- **Export to PDF** (PDF/A, PDF/UA) with live preview and download
- **Import from PDF** → DOCX (OCR)
- **Redaction & Metadata Stripping**
- **Viewer Embed** of processed PDFs
- **Secure backend** on Azure Functions for CORS and key protection

---

## 2. Architecture Diagram

```text
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

---

## 3. Frontend Setup

- **Tech Stack:** React + TypeScript + OfficeJS + Webpack
- **Project Structure:**
  ```
  src/
  ├── components/          # React UI components
  │   ├── ExportTab.tsx    # PDF export functionality
  │   ├── ImportTab.tsx    # PDF import with drag/drop
  │   └── RedactTab.tsx    # Redaction & metadata stripping
  ├── services/            # API integration
  │   └── DocumentService.ts # Office.js + Azure Functions
  ├── types/               # TypeScript definitions
  └── utils/               # Helper functions
  ```

- **Primary UI Tabs:**
  - **Export to PDF:** Capture current `.docx`, call `/api/build`, embed PDF in `<iframe>` via Viewer URL, provide **Download** button
  - **Import from PDF:** Drag/drop PDF file, OCR toggle, convert to DOCX and insert into document
  - **Redact & Strip Metadata:** Remove sensitive data and metadata, export as clean PDF

- **Key Features:**
  - **Document Retrieval:** `Office.context.document.getFileAsync(Office.FileType.Compressed)` → assemble `Blob`
  - **API Integration:** `fetch()` to Azure endpoints; wrap `Blob` in `FormData` with `file` and `instructions`
  - **Error Handling:** Comprehensive error states and user feedback
  - **Loading States:** Visual feedback during processing
  - **Responsive Design:** Works in Word taskpane (narrow width)

- **Security:** No user-exposed keys—frontend calls proxies that inject keys server-side

---

## 4. Backend (Azure Functions)

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

- `` (excluded from source control):
  ```json
  {
    "IsEncrypted": false,
    "Values": {
      "AzureWebJobsStorage": "UseDevelopmentStorage=true",
      "FUNCTIONS_WORKER_RUNTIME": "node",
      "NUTRIENT_API_KEY": "<proc_key>",
      "NUTRIENT_VIEWER_API_KEY": "<viewer_key>"
    }
  }
  ```
- **CORS:** configure in `host.json` or Azure Portal to allow your add-in domain

---

## 5. Environment Variables & Secrets

- `` – Processor API key (PDF conversion)
- `` – Viewer API key (PDF embedding)

### Injection Methods

- **Azure CLI:**
  ```bash
  az functionapp config appsettings set \
    --name <FunctionApp> \
    --resource-group <ResourceGroup> \
    --settings \
      NUTRIENT_API_KEY=<proc_key> \
      NUTRIENT_VIEWER_API_KEY=<viewer_key>
  ```
- **GitHub Actions:** configure via `azure/CLI` step using GitHub Secrets

---

## 6. CI/CD (GitHub Actions)

```yaml
# .github/workflows/deploy-azure-functions.yml
name: Deploy Azure Functions
on: push:
  branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install && npm run build
      - uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      - uses: azure/functions-action@v1
        with:
          app-name: 'my-nutrient-proxy'
          package: '.'
      - uses: azure/CLI@v1
        with:
          inlineScript: |
            az functionapp config appsettings set \
              --name my-nutrient-proxy \
              --resource-group MyResourceGroup \
              --settings \
                NUTRIENT_API_KEY=${{ secrets.NUTRIENT_API_KEY }} \
                NUTRIENT_VIEWER_API_KEY=${{ secrets.NUTRIENT_VIEWER_API_KEY }}
```

---

## 7. Office Add-in Manifest

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

## 8. Developer Checklist

### Setup Requirements
- [ ] Node.js 18+ installed
- [ ] Azure Functions Core Tools installed
- [ ] Nutrient.io API keys obtained (Processor + Viewer)
- [ ] Azure subscription with Function App created
- [ ] GitHub repository with secrets configured

### Local Development
- [ ] Clone repository and run `npm install`
- [ ] Install Azure Functions dependencies: `cd azure-functions && npm install`
- [ ] Configure `azure-functions/local.settings.json` with API keys
- [ ] Start Azure Functions: `cd azure-functions && npm start`
- [ ] Start frontend dev server: `npm run dev`
- [ ] Sideload add-in: `npm run sideload`
- [ ] Test all three tabs (Export, Import, Redact)

### Production Deployment
- [ ] Update `manifest.xml` with production URLs
- [ ] Configure Azure Function App CORS settings
- [ ] Set environment variables in Azure
- [ ] Deploy via GitHub Actions: `git push origin main`
- [ ] Test add-in in production environment

### Testing Checklist
- [ ] Export Word document to PDF (all formats)
- [ ] Import PDF with OCR enabled/disabled
- [ ] Redact document with metadata stripping
- [ ] Verify PDF viewer embedding works
- [ ] Test error handling and user feedback
- [ ] Validate CORS and security settings

### Security Considerations
- [ ] API keys stored securely in Azure Key Vault
- [ ] CORS properly configured for production domains
- [ ] Input validation on all API endpoints
- [ ] Error messages don't expose sensitive information
- [ ] HTTPS enforced for all communications

---

## 9. Resources & References

- **Processor API:** [https://www.nutrient.io/api/docx-to-pdf-api/](https://www.nutrient.io/api/docx-to-pdf-api/)
- **Viewer API:** [https://www.nutrient.io/api/viewer-api/](https://www.nutrient.io/api/viewer-api/)
- **OfficeJS Docs:** [https://learn.microsoft.com/office/dev/add-ins/](https://learn.microsoft.com/office/dev/add-ins/)
- **Azure Functions:** [https://learn.microsoft.com/azure/azure-functions/](https://learn.microsoft.com/azure/azure-functions/)
- **Office Add-in Manifest:** [https://learn.microsoft.com/office/dev/add-ins/develop/add-in-manifests](https://learn.microsoft.com/office/dev/add-ins/develop/add-in-manifests)

## 10. Implementation Notes

### Key Implementation Decisions

1. **Architecture Pattern:** Proxy pattern with Azure Functions to protect API keys
2. **Frontend Framework:** React with TypeScript for type safety and maintainability
3. **Build System:** Webpack for bundling and development server
4. **State Management:** React hooks for local state (no external state library needed)
5. **Error Handling:** Comprehensive error boundaries and user feedback
6. **Security:** API keys stored in Azure environment variables, never exposed to client

### Performance Considerations

- **File Size:** Azure Functions timeout set to 5 minutes for large documents
- **Memory Usage:** Stream processing for large files
- **Caching:** PDF viewer URLs cached to avoid re-uploading
- **Bundle Size:** Webpack optimization for production builds

### Testing Strategy

- **Unit Tests:** Jest for component and service testing
- **Integration Tests:** Azure Functions local testing
- **E2E Tests:** Manual testing with Word desktop/online
- **Security Tests:** API key exposure validation

### Deployment Pipeline

1. **Development:** Local Azure Functions + webpack dev server
2. **Staging:** Azure Function App with staging environment
3. **Production:** Automated deployment via GitHub Actions
4. **Monitoring:** Azure Application Insights integration

**Prepared by:** Product Team @ Nutrient.io\
**Date:** 2025-01-27\
**Version:** 2.0 (Extended Implementation)

