let stopwatchStartTime = Date.now();
const stopwatchElement = document.getElementById('stopwatch');

function formatStopwatchTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateStopwatch() {
    const currentTime = Date.now();
    const elapsedTime = currentTime - stopwatchStartTime;
    stopwatchElement.textContent = formatStopwatchTime(elapsedTime);
    requestAnimationFrame(updateStopwatch);
}

// Запускаем секундомер при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    stopwatchStartTime = Date.now();
    updateStopwatch();
});