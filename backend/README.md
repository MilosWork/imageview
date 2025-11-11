# imageview backend (minimal)

This is a minimal Node + Express backend scaffold for the `imageview` frontend.

What it provides:

- GET /api/images — returns the in-memory images list
- POST /api/upload — accepts multipart form-data with `image` file and `title` field, stores the file in `uploads/` and returns the saved item
- Serves uploaded files from `/uploads`

Quick start (PowerShell):

```powershell
cd backend
npm install
npm run dev   # requires nodemon, or `npm start` to run once
```

Notes:
- This is a simple demo server. Uploaded files are stored on disk at `backend/uploads/` and the image list is kept in memory (will be lost when the server restarts).
- For production use, add validation, authentication, proper storage (S3 or database), and security headers.
