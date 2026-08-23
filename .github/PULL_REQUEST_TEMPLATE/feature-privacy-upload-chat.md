# Pull request: Add privacy control, uploads with OCR, and realtime chat

This PR implements the changes requested by the repository owner to:

- Protect the creator's private info behind a password check using bcrypt with a server-side hashed secret.
- Add an uploads endpoint to accept images and PDFs, store them (local or S3) and run OCR (Google Vision if configured, else Tesseract.js fallback).
- Add Socket.IO scaffolding for realtime chat with public rooms and private messaging support.
- Add a Prisma schema for persisting users, conversations, messages and attachments (initial schema).

What's included
- Middleware: src/server/middleware/passwordProtect.ts
- API routes: src/server/routes/creator.ts, src/server/routes/upload.ts
- Storage & OCR services: src/server/services/storageService.ts, src/server/services/ocrService.ts
- Socket server: src/server/socket/index.ts
- Server entry: src/server/index.ts
- Prisma schema: prisma/schema.prisma
- Minimal frontend components: src/client/components/CreatorInfoModal.tsx, src/client/components/Chat.tsx
- Config / tooling: package.json, tsconfig.json, .env.example
- Branch README: README.feature-privacy-upload-chat.md

How to test
1. Checkout branch feature/privacy-upload-chat
2. Install deps: npm ci
3. Copy .env.example to .env and set CREATOR_INFO_HASHED_PW to a bcrypt hash of the chosen password
4. Run npm run dev
5. Test /api/creator-info and /api/uploads, and the Socket.IO endpoints.

Notes & security
- CREATOR_INFO_HASHED_PW must be set in environment variables (not in repo)
- For production, set USE_S3=true and configure S3 credentials and bucket
- Configure Google Vision or rely on Tesseract fallback
- Add rate limiting, helmet, and virus scanning for production readiness

