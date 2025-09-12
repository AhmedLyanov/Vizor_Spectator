async function displayUsername() {
  try {
    const username = await window.electronAPI.getUsername();
    document.getElementById('username').textContent = username;
  } catch (error) {
    console.error('Ошибка получения имени пользователя:', error);
  }
}
displayUsername();