const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const db = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.get('/computers', (req, res) => {
  db.all("SELECT * FROM computers", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    console.log("Текущие данные в БД:", rows);
    res.json(rows);
  });
});

const clients = new Map();

io.on('connection', (socket) => {
  console.log('Клиент подключился:', socket.id);
  clients.set(socket.id, { id: socket.id, username: 'Guest' });
  socket.on('request-username', (targetId) => {
    const requester = clients.get(socket.id);
    const targetClient = clients.get(targetId);
    if (!targetClient || (requester.group && targetClient.group !== requester.group)) {
      console.log(`Запрещен запрос имени: разные группы или клиент не найден`);
      socket.emit('username-response', { id: targetId, username: 'Guest' });
      return;
    }
    console.log(`Клиент ${socket.id} запросил имя пользователя для ${targetId}: ${targetClient.username}`);
    socket.emit('username-response', { id: targetId, username: targetClient.username });
  });

  socket.on('request-clients', () => {
    const client = clients.get(socket.id);
    console.log(`Клиент ${socket.id} запросил список клиентов`);
    if (client && client.group) {
      const groupClients = Array.from(clients.values()).filter(c => c.group === client.group);
      socket.emit('clients', groupClients);
    } else {
      socket.emit('clients', []);
    }
  });

  socket.on('set-identity', ({ username, hostname }) => {
    console.log(`Клиент ${socket.id}: ${username} с ПК ${hostname}`);

    db.get("SELECT group_name FROM computers WHERE hostname = ?", [hostname], (err, row) => {
      let group = row ? row.group_name : 'default';

      clients.set(socket.id, { id: socket.id, username, hostname, group });
      socket.join(group);

      socket.emit('joined-group', { group });
      socket.to(group).emit('new-client', { id: socket.id, username, hostname });
      const groupClients = Array.from(clients.values()).filter(c => c.group === group);
      socket.emit('clients', groupClients);
    });
  });

  socket.on('offer', (data) => {
    const sender = clients.get(socket.id);
    const targetClient = clients.get(data.target);
    if (!targetClient || sender.group !== targetClient.group) {
      console.log(`Запрещено: разные группы для ${socket.id} и ${data.target}`);
      return;
    }
    console.log(`Получен offer от ${socket.id} (имя: ${clients.get(socket.id).username}) для ${data.target}`);
    socket.to(data.target).emit('offer', { ...data, from: socket.id, username: clients.get(socket.id).username });
  });

  socket.on('answer', (data) => {
    const sender = clients.get(socket.id);
    const targetClient = clients.get(data.target);
    if (!targetClient || sender.group !== targetClient.group) {
      console.log(`Запрещено: разные группы для ${socket.id} и ${data.target}`);
      return;
    }
    console.log(`Получен answer от ${socket.id} для ${data.target}`);
    socket.to(data.target).emit('answer', { ...data, from: socket.id });
  });

  socket.on('ice-candidate', (data) => {
    const sender = clients.get(socket.id);
    const targetClient = clients.get(data.target);
    if (!targetClient || sender.group !== targetClient.group) {
      console.log(`Запрещено: разные группы для ${socket.id} и ${data.target}`);
      return;
    }
    console.log(`Получен ICE candidate от ${socket.id} для ${data.target}`);
    socket.to(data.target).emit('ice-candidate', { ...data, from: socket.id });
  });

  socket.on('disconnect', () => {
    console.log(`Клиент отключился: ${socket.id}`);
    const client = clients.get(socket.id);
    if (client && client.group) {
      io.to(client.group).emit('client-disconnected', socket.id);
    }
    clients.delete(socket.id);
  });
});

server.listen(3000, () => {
  console.log('Сигнальный сервер запущен на порту 3000');
});