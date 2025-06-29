function updateTime() {
  const now = new Date();
  const options = {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  };
  const formattedTime = now.toLocaleString("en-US", options);
  document.getElementById("time_text").textContent = formattedTime;
}
setInterval(updateTime, 1000);
updateTime();