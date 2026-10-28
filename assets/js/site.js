window.addEventListener("DOMContentLoaded", function () {
  var themes = ["light", "dark", "system"];
  var themeDetails = {
    light: { label: "Светла", icon: "☀" },
    dark: { label: "Темна", icon: "☾" },
    system: { label: "Системска", icon: "◐" },
  };
  var themeButton = document.getElementById("themeToggle");

  function applyTheme(theme) {
    var selectedTheme = themes.indexOf(theme) >= 0 ? theme : "system";
    var details = themeDetails[selectedTheme];

    document.documentElement.dataset.theme = selectedTheme;
    themeButton.querySelector(".theme-icon").textContent = details.icon;
    themeButton.querySelector(".theme-name").textContent = details.label;
    themeButton.setAttribute("aria-label", "Тековна тема: " + details.label + ". Кликнете за промена.");
    themeButton.title = "Тековна тема: " + details.label + " (кликнете за промена)";
  }

  applyTheme(localStorage.getItem("quiz-theme") || "system");
  themeButton.addEventListener("click", function () {
    var currentTheme = document.documentElement.dataset.theme;
    var nextTheme = themes[(themes.indexOf(currentTheme) + 1) % themes.length];

    applyTheme(nextTheme);
    localStorage.setItem("quiz-theme", nextTheme);
  });
});
