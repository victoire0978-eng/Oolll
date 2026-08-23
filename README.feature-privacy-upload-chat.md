# Oolll - feature/privacy-upload-chat

This branch implements:

- Password-protected creator info endpoint (/api/creator-info) requiring a bcrypt-hashed password stored in CREATOR_INFO_HASHED_PW.
- Upload endpoint (/api/uploads) supporting images and PDF, with OCR using Google Vision (if configured) or Tesseract.js fallback.
- Real-time chat scaffolding using Socket.IO, with public rooms and private messaging support.
- Prisma schema for basic persistence (users, conversations, messages, attachments).

Quickstart (local):

1. Copy .env.example to .env and fill values (especially CREATOR_INFO_HASHED_PW).
2. Install dependencies: npm ci
3. Generate Prisma client: npm run prisma:generate
4. Run server: npm run dev

Hash a password locally:

node -e "const bcrypt=require('bcrypt'); bcrypt.hash(process.argv[1]||'monMotDePasse',10).then(h=>console.log(h));" -- monMotDePasse

