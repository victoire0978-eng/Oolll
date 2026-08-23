import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';

const HASHED_SECRET = process.env.CREATOR_INFO_HASHED_PW;

export async function requireCreatorPassword(req: Request, res: Response, next: NextFunction) {
  const supplied = (req.body.password || req.query.password || req.headers['x-creator-password']) as string | undefined;
  if (!HASHED_SECRET) return res.status(500).json({ error: 'Server misconfiguration: missing CREATOR_INFO_HASHED_PW' });
  if (!supplied) return res.status(401).json({ error: 'Mot de passe requis' });

  const match = await bcrypt.compare(supplied, HASHED_SECRET);
  if (!match) return res.status(403).json({ error: 'Mot de passe incorrect' });
  next();
}
