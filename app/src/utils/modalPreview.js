document
  .getElementById("show-preview-btn")
  .addEventListener("click", function () {
    const previewSection = document.getElementById("preview-section");
    previewSection.classList.toggle("hidden");

    const btnText = previewSection.classList.contains("hidden")
      ? "Мой экран"
      : "Скрыть экран";
    this.querySelector("span").textContent = btnText;
  });
