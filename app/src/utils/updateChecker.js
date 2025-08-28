window.electronAPI.onUpdateMessage((msg) => {
  document.getElementById("updates").innerText = msg;
});

document.addEventListener('DOMContentLoaded', function() {
  const downloadBtn = document.getElementById('download-update-btn');
  
  if (downloadBtn) {
    downloadBtn.addEventListener('click', function() {
      window.electronAPI.downloadUpdate();
    });
  }
});