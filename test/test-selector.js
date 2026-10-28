(function () {
  window.addEventListener("DOMContentLoaded", function () {
    var themes = window.TEST_THEMES;
    var grid = document.querySelector(".test-card-grid");
    var randomButton = document.getElementById("randomTest");

    if (!Array.isArray(themes) || themes.length !== 41 || !grid || !randomButton) {
      throw new Error("Не може да се подготви списокот со тестови.");
    }

    themes.forEach(function (theme, index) {
      var testNumber = index + 1;
      var paddedNumber = String(testNumber).padStart(2, "0");
      var card = document.createElement("a");
      card.className = "test-card";
      card.href = "test/test.html?test=" + testNumber;
      card.style.setProperty("--card-accent", theme.accent);
      card.setAttribute("aria-label", "Започни тест " + paddedNumber + ", 31 прашање");

      var number = document.createElement("span");
      number.className = "test-card-number";
      number.textContent = paddedNumber;

      var title = document.createElement("span");
      title.className = "test-card-title";
      title.textContent = "Тест " + paddedNumber;

      var detail = document.createElement("span");
      detail.className = "test-card-detail";
      detail.appendChild(document.createTextNode("31 прашање"));
      var arrow = document.createElement("span");
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "↗";
      detail.appendChild(arrow);

      card.appendChild(number);
      card.appendChild(title);
      card.appendChild(detail);
      grid.appendChild(card);
    });

    randomButton.addEventListener("click", function () {
      var testNumber = Math.floor(Math.random() * themes.length) + 1;
      window.location.href = "test/test.html?test=" + testNumber;
    });
  });
})();
