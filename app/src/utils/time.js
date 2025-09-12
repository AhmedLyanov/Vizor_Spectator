function updateTime() {
  const now = new Date();
  const options = {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  };
  let formattedTime = now.toLocaleString("ru-RU", options);
  formattedTime = formattedTime.replace(/(^|\s)\S/g, function(letter) {
    return letter.toUpperCase();
  });
  
  document.getElementById("time_text").textContent = formattedTime;
}
setInterval(updateTime, 1000);
updateTime();