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

- **Tech Stack:** React + TypeScript + OfficeJS
- **Primary UI Tab:**
  - **Export to PDF:** capture current `.docx`, call `/api/build`, embed PDF in `<iframe>` via Viewer URL, and provide **Save** button
- **Optional Tabs/Controls:**
  - **Import from PDF → DOCX PO C** (drag/drop PDF, OCR toggle)
  - **Redact & Strip Metadata** (custom flows)
- **Key Management:** no user-exposed keys—frontend calls proxies that inject keys server-side
- **Retrieve DOCX:** use `Office.context.document.getFileAsync(Office.FileType.Compressed)` → assemble `Blob`
- **API Calls:** use `fetch()` to Azure endpoints; wrap `Blob` in `FormData` with `file` and `instructions`

---

## 4. Backend (Azure Functions)

### Endpoints

- ``

  - Proxies to `https://api.nutrient.io/build`
  - Expects raw binary body + headers:
    - `x-instructions`: JSON
    - `x-filename`: filename
  - Returns binary PDF

- ``

  - Proxies to `https://api.nutrient.io/viewer/documents`
  - Returns JSON `{ document_id }`

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
  - `<SourceLocation DefaultValue="https://<your-domain>/taskpane/index.html"/>`
  - `<Permissions>ReadWriteDocument</Permissions>`
  - Define a single ribbon button/command for the **Export to PDF** tab

---

## 8. Developer Checklist

-

---

## 9. Resources & References

- **Processor API:** [https://www.nutrient.io/api/docx-to-pdf-api/](https://www.nutrient.io/api/docx-to-pdf-api/)
- **Viewer API:** [https://www.nutrient.io/api/viewer-api/](https://www.nutrient.io/api/viewer-api/)
- **OfficeJS Docs:** [https://learn.microsoft.com/office/dev/add-ins/](https://learn.microsoft.com/office/dev/add-ins/)
- **Azure Functions:** [https://learn.microsoft.com/azure/azure-functions/](https://learn.microsoft.com/azure/azure-functions/)

**Prepared by:** Product Team @ Nutrient.io\
**Date:** 2025-08-05

