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

const clients = new Set();

io.on('connection', (socket) => {
  console.log('Клиент подключился:', socket.id);
  clients.add(socket.id);
  socket.emit('clients', Array.from(clients));

  socket.broadcast.emit('new-client', socket.id);

  socket.on('request-clients', () => {
    console.log(`Клиент ${socket.id} запросил список клиентов`);
    socket.emit('clients', Array.from(clients));
  });

  socket.on('offer', (data) => {
    if (clients.has(data.target)) {
      console.log(`Получен offer от ${socket.id} для ${data.target}`);
      socket.to(data.target).emit('offer', { ...data, from: socket.id });
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
    console.log('Клиент отключился:', socket.id);
    clients.delete(socket.id);
    socket.broadcast.emit('client-disconnected', socket.id);
  });
});

server.listen(3000, () => {
  console.log('Сигнальный сервер запущен на порту 3000');
});
