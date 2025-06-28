const socket = io('http://localhost:3000/', { reconnectionAttempts: 5, reconnectionDelay: 1000 });
const peers = {};
let localStream = null;
const candidateBuffers = {};
let activeModalVideoId = null;


const connectionStatus = document.getElementById('connection-status');
const connectionCount = document.getElementById('connection-count');
const videoModal = document.getElementById('video-modal');
const modalVideo = document.getElementById('modal-video');
const closeModal = document.querySelector('.close-modal');


function openModal(videoId) {
  const video = document.getElementById(videoId);
  if (video) {
    activeModalVideoId = videoId;
    modalVideo.srcObject = video.srcObject;
    videoModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

function closeModalWindow() {
  videoModal.style.display = 'none';
  document.body.style.overflow = 'auto';
  activeModalVideoId = null;
}

closeModal.addEventListener('click', closeModalWindow);
window.addEventListener('click', (e) => {
  if (e.target === videoModal) {
    closeModalWindow();
  }
});


function updateConnectionStatus(connected) {
  connectionStatus.className = connected ? 'status-indicator status-connected' : 'status-indicator status-disconnected';
}

function updateConnectionCount() {
  const count = Object.keys(peers).length;
  connectionCount.textContent = `${count} подключений`;
}

async function getSources() {
  try {
    const sources = await window.electronAPI.getSources();
    const sourceList = document.getElementById('source-list');
    sourceList.innerHTML = '';

    sources.forEach(source => {
      const div = document.createElement('div');
      div.className = 'source-item';
      
      const img = document.createElement('img');
      img.className = 'source-thumbnail';
      img.src = source.thumbnail;
      img.alt = source.name;
      
      const p = document.createElement('p');
      p.className = 'source-name';
      p.textContent = source.name;
      
      div.appendChild(img);
      div.appendChild(p);
      
      div.addEventListener('click', () => selectSource(source.id));
      sourceList.appendChild(div);
    });
  } catch (error) {
    console.error('Ошибка получения источников:', error);
  }
}

async function selectSource(sourceId) {
  try {
    console.log('Выбран sourceId:', sourceId); 


    const constraints = {
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: sourceId,
        },
        optional: [
          { maxWidth: window.screen.width },
          { maxHeight: window.screen.height }
        ]
      }
    };


    localStream = await navigator.mediaDevices.getUserMedia(constraints);

    console.log('Локальный поток создан:', localStream.getVideoTracks());

   
    const video = document.getElementById('preview');
    video.srcObject = localStream;
    video.play();
    
    socket.emit('request-clients');
    updateConnectionStatus(true);
  } catch (error) {
    console.error('Ошибка при захвате экрана:', error);
    updateConnectionStatus(false);
  }
}

function createPeer(targetId, initiator = false) {
  console.log(`Создание peer для ${targetId}, initiator: ${initiator}`);
  const peer = new SimplePeer({
    initiator,
    trickle: true,
    stream: localStream,
    reconnectTimer: 1000,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        {
          urls: 'turn:global.turn.twilio.com:3478?transport=tcp',
          username: 'your-twilio-username',
          credential: 'your-twilio-password'
        },
        {
          urls: 'turn:localhost:3478?transport=udp',
          username: 'valid-username',
          credential: 'valid-password'
        }
      ],
      iceTransportPolicy: 'all',
      sdpSemantics: 'unified-plan'
    }
  });

  peers[targetId] = peer;
  candidateBuffers[targetId] = [];

  peer.on('signal', (data) => {
    console.log(`Сигнал от ${targetId}:`, data.type, JSON.stringify(data));
    if (data.type === 'offer') {
      socket.emit('offer', { target: targetId, offer: data });
    } else if (data.type === 'answer') {
      socket.emit('answer', { target: targetId, answer: data });
    } else if (data.candidate) {
      socket.emit('ice-candidate', { target: targetId, candidate: data });
    }
  });

  peer.on('stream', (stream) => {
    console.log(`Получен поток от ${targetId}`, stream.getTracks());
    const videoContainer = document.createElement('div');
    videoContainer.className = 'remote-video-container';
    videoContainer.id = `container-${targetId}`;
    
    const video = document.createElement('video');
    video.className = 'remote-video';
    video.srcObject = stream;
    video.autoplay = true;
    video.id = `video-${targetId}`;
    
    const videoActions = document.createElement('div');
    videoActions.className = 'video-actions';
    
    const expandBtn = document.createElement('button');
    expandBtn.className = 'video-action-btn';
    expandBtn.innerHTML = '<i class="fas fa-expand"></i>';
    expandBtn.title = 'Увеличить';
    expandBtn.addEventListener('click', () => openModal(`video-${targetId}`));
    
    videoActions.appendChild(expandBtn);
    videoContainer.appendChild(video);
    videoContainer.appendChild(videoActions);
    
    document.getElementById('remote-videos').appendChild(videoContainer);
    updateConnectionCount();
  });

  peer.on('connect', () => {
    console.log(`WebRTC соединение установлено с ${targetId}`);
    updateConnectionStatus(true);
    updateConnectionCount();
  });

  peer.on('iceconnectionstatechange', () => {
    const state = peer._pc.iceConnectionState;
    console.log(`ICE connection state для ${targetId}: ${state}`);
    if (state === 'failed') {
      console.log(`Попытка перезапуска ICE для ${targetId}`);
      peer._pc.restartIce();
    } else if (state === 'disconnected') {
      console.log(`Попытка восстановления соединения для ${targetId}`);
      setTimeout(() => {
        if (peer._pc.iceConnectionState === 'disconnected') {
          peer.reconnect();
        }
      }, 3000);
    }
  });

  peer.on('signalingstatechange', () => {
    console.log(`Signaling state для ${targetId}: ${peer._pc.signalingState}`);
  });

  peer.on('error', (err) => {
    console.error(`Ошибка WebRTC с ${targetId}:`, err);
    updateConnectionStatus(false);
  });

  peer.on('close', () => {
    console.log(`Соединение с ${targetId} закрыто`);
    const videoContainer = document.getElementById(`container-${targetId}`);
    if (videoContainer) videoContainer.remove();
    delete peers[targetId];
    delete candidateBuffers[targetId];
    updateConnectionCount();
    
    setTimeout(() => {
      if (!peers[targetId] && localStream) {
        console.log(`Повторное создание peer для ${targetId}`);
        createPeer(targetId, initiator);
      }
    }, 5000);
  });

  if (candidateBuffers[targetId].length > 0) {
    console.log(`Отправка буферизированных кандидатов для ${targetId}`);
    candidateBuffers[targetId].forEach(candidate => peer.signal(candidate));
    candidateBuffers[targetId] = [];
  }

  return peer;
}

setInterval(() => {
  Object.keys(candidateBuffers).forEach(targetId => {
    const peer = peers[targetId];
    if (peer && candidateBuffers[targetId].length > 0) {
      console.log(`Отправка буферизированных кандидатов для ${targetId}`);
      candidateBuffers[targetId].forEach(candidate => peer.signal(candidate));
      candidateBuffers[targetId] = [];
    }
  });
}, 1000);

socket.on('connect', () => {
  console.log('Подключен к серверу, ID:', socket.id);
  updateConnectionStatus(true);
});

socket.on('connect_error', (err) => {
  console.error('Ошибка подключения к серверу:', err);
  updateConnectionStatus(false);
});

socket.on('clients', (clientIds) => {
  if (!localStream) return;
  console.log('Получен список клиентов:', clientIds);
  clientIds.forEach((clientId) => {
    if (clientId !== socket.id && !peers[clientId]) {
      createPeer(clientId, true);
    }
  });
  updateConnectionCount();
});

socket.on('new-client', (clientId) => {
  if (!localStream) return;
  console.log('Новый клиент:', clientId);
  if (!peers[clientId]) {
    createPeer(clientId, false);
  }
});

socket.on('offer', (data) => {
  console.log(`Получен offer от ${data.from}:`, JSON.stringify(data.offer));
  const peer = peers[data.from] || createPeer(data.from, false);
  peer.signal(data.offer);
});

socket.on('answer', (data) => {
  console.log(`Получен answer от ${data.from}:`, JSON.stringify(data.answer));
  const peer = peers[data.from];
  if (peer) peer.signal(data.answer);
});

socket.on('ice-candidate', (data) => {
  console.log(`Получен ICE candidate от ${data.from}:`, JSON.stringify(data.candidate));
  const peer = peers[data.from];
  if (peer) {
    peer.signal(data.candidate);
  } else {
    console.log(`Буферизация ICE candidate для ${data.from}`);
    candidateBuffers[data.from] = candidateBuffers[data.from] || [];
    candidateBuffers[data.from].push(data.candidate);
  }
});

socket.on('client-disconnected', (clientId) => {
  console.log(`Клиент отключился: ${clientId}`);
  if (peers[clientId]) {
    peers[clientId].destroy();
    delete peers[clientId];
    delete candidateBuffers[clientId];
    const videoContainer = document.getElementById(`container-${clientId}`);
    if (videoContainer) videoContainer.remove();
    updateConnectionCount();
  }
});

document.getElementById('getSourcesButton').addEventListener('click', getSources);

window.addEventListener('resize', () => {
  if (activeModalVideoId) {
    const video = document.getElementById(activeModalVideoId);
    if (video) {
      modalVideo.srcObject = video.srcObject;
    }
  }
});