import express from 'express';
import http from 'http';
import cors from 'cors';
import creatorRouter from './routes/creator';
import uploadRouter from './routes/upload';
import { initSocket } from './socket';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use(creatorRouter);
app.use(uploadRouter);

// Static uploads in /uploads
import path from 'path';
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

const server = http.createServer(app);
const io = initSocket(server);

const PORT = Number(process.env.PORT || 4000);
server.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
