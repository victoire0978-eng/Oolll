import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket;

export default function Chat({ room }: { room: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!socket) socket = io();
    socket.emit('joinRoom', room);
    socket.on('message', (m: any) => setMessages(prev => [...prev, m]));
    return () => {
      socket.emit('leaveRoom', room);
      socket.off('message');
    };
  }, [room]);

  function send() {
    if (!text.trim()) return;
    const payload = { room, text, sender: 'me', ts: Date.now() };
    socket.emit('message', payload);
    setText('');
  }

  return (
    <div className="chat">
      <div className="messages" style={{maxHeight:300, overflow:'auto'}}>
        {messages.map((m,i)=><div key={i}><strong>{m.sender}</strong>: {m.text}</div>)}
      </div>
      <input value={text} onChange={e=>setText(e.target.value)} />
      <button onClick={send}>Envoyer</button>
    </div>
  );
}
