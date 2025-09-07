window.electronAPI.onUpdateMessage((msg) => {
  const updateModal = document.getElementById('update-modal');
  const updateMessage = document.getElementById('update-message');
  const progressBar = document.getElementById('update-progress');
  const progressText = document.getElementById('update-progress-text');
  const downloadBtn = document.getElementById('download-update-btn');
  const cancelBtn = document.getElementById('cancel-update-btn');

  if (msg.includes('Доступно новое обновление')) {
    updateMessage.innerText = 'Доступна новая версия приложения. Хотите скачать обновление?';
    updateModal.style.display = 'flex';
    progressBar.style.width = '0%';
    progressText.innerText = '';
    downloadBtn.style.display = 'block';
    cancelBtn.style.display = 'block';
  } else if (msg.includes('Обновлений нет')) {
    updateModal.style.display = 'none';
  } else if (msg.includes('Скачивание')) {
    const percent = msg.match(/(\d+)/)?.[0] || '0';
    updateMessage.innerText = 'Загрузка обновления...';
    progressBar.style.width = `${percent}%`;
    progressText.innerText = `${percent}%`;
    downloadBtn.style.display = 'none';
    cancelBtn.style.display = 'none';
  } else if (msg.includes('Обновление загружено')) {
    updateMessage.innerText = 'Обновление загружено. Перезапуск приложения...';
    progressBar.style.width = '100%';
    progressText.innerText = '100%';
    downloadBtn.style.display = 'none';
    cancelBtn.style.display = 'none';
  } else {
    updateMessage.innerText = msg;
    progressBar.style.width = '0%';
    progressText.innerText = '';
  }
});

document.addEventListener('DOMContentLoaded', function() {
  const downloadBtn = document.getElementById('download-update-btn');
  const cancelBtn = document.getElementById('cancel-update-btn');
  
  if (downloadBtn) {
    downloadBtn.addEventListener('click', function() {
      window.electronAPI.downloadUpdate();
    });
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function() {
      document.getElementById('update-modal').style.display = 'none';
    });
  }
});