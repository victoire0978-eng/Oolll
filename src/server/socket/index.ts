import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import Redis from 'ioredis';
import { createAdapter } from 'socket.io-redis';

export function initSocket(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, { cors: { origin: '*' } });

  if (process.env.REDIS_URL) {
    const pubClient = new Redis(process.env.REDIS_URL);
    const subClient = pubClient.duplicate();
    // createAdapter signature depends on version; adjust if needed
    // @ts-ignore
    io.adapter(createAdapter({ pubClient, subClient }));
  }

  io.on('connection', (socket) => {
    socket.on('joinRoom', (room: string) => {
      socket.join(room);
    });

    socket.on('leaveRoom', (room: string) => {
      socket.leave(room);
    });

    socket.on('message', (payload: any) => {
      // payload = { room, text, sender, attachments? }
      io.to(payload.room).emit('message', payload);
      // TODO: persist to DB (Prisma) if desired
    });

    socket.on('privateMessage', (payload: any) => {
      // emit to specific socket id or user room
      if (payload.toSocketId) {
        io.to(payload.toSocketId).emit('privateMessage', payload);
      }
    });
  });

  return io;
}
