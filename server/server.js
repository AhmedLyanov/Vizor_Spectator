const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const clients = new Map();

io.on('connection', (socket) => {
  console.log('Клиент подключился:', socket.id);
  clients.set(socket.id, { id: socket.id, username: 'Guest' });
  socket.emit('clients', Array.from(clients.values()));

  socket.on('set-username', (data) => {
    const username = data.username || 'Guest';
    console.log(`Клиент ${socket.id} установил имя пользователя: ${username}`);
    clients.set(socket.id, { id: socket.id, username });
    // Send new-client and client-updated after updating clients
    socket.broadcast.emit('new-client', { id: socket.id, username });
    socket.broadcast.emit('client-updated', { id: socket.id, username });
    socket.emit('clients', Array.from(clients.values()));
  });

  socket.on('request-username', (targetId) => {
    const client = clients.get(targetId);
    if (client) {
      console.log(`Клиент ${socket.id} запросил имя пользователя для ${targetId}: ${client.username}`);
      socket.emit('username-response', { id: targetId, username: client.username });
    } else {
      console.log(`Клиент ${targetId} не найден для запроса имени`);
      socket.emit('username-response', { id: targetId, username: 'Guest' });
    }
  });

  socket.on('request-clients', () => {
    console.log(`Клиент ${socket.id} запросил список клиентов`);
    socket.emit('clients', Array.from(clients.values()));
  });

  socket.on('offer', (data) => {
    if (clients.has(data.target)) {
      console.log(`Получен offer от ${socket.id} (имя: ${clients.get(socket.id).username}) для ${data.target}`);
      socket.to(data.target).emit('offer', { ...data, from: socket.id, username: clients.get(socket.id).username });
    } else {
      console.log(`Целевой клиент ${data.target} не найден`);
    }
  });

  socket.on('answer', (data) => {
    if (clients.has(data.target)) {
      console.log(`Получен answer от ${socket.id} для ${data.target}`);
      socket.to(data.target).emit('answer', { ...data, from: socket.id });
    } else {
      console.log(`Целевой клиент ${data.target} не найден`);
    }
  });

  socket.on('ice-candidate', (data) => {
    if (clients.has(data.target)) {
      console.log(`Получен ICE candidate от ${socket.id} для ${data.target}`);
      socket.to(data.target).emit('ice-candidate', { ...data, from: socket.id });
    } else {
      console.log(`Целевой клиент ${data.target} не найден`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Клиент отключился: ${socket.id}`);
    clients.delete(socket.id);
    socket.broadcast.emit('client-disconnected', socket.id);
  });
});

server.listen(3000, () => {
  console.log('Сигнальный сервер запущен на порту 3000');
});