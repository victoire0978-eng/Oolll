import express from 'express';
import { requireCreatorPassword } from '../middleware/passwordProtect';
const router = express.Router();

router.post('/api/creator-info', requireCreatorPassword, async (req, res) => {
  // Seules les infos non sensibles peuvent être dans le repo; tout le reste via secrets/env/DB
  const creator = {
    name: process.env.CREATOR_NAME || 'Nom',
    bio: process.env.CREATOR_BIO || 'Bio publique limitée',
    privateNote: process.env.CREATOR_PRIVATE_NOTE || 'Infos protégées (accessible si mot de passe ok)'
  };
  res.json({ creator });
});

export default router;
