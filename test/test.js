(function () {
  var licenceCategory = "Б";
  var questionsPerTest = 31;
  var testId = Number(new URLSearchParams(window.location.search).get("test"));
  if (!Number.isInteger(testId) || testId < 1 || testId > 41) testId = 1;
  var selectedButtonTheme = window.TEST_THEMES[testId - 1];
  var questions = [];
  var answers = {};
  var currentIndex = 0;
  var isFinished = false;
  var exam = document.getElementById("exam");
  var questionPanel = document.getElementById("questionPanel");
  var questionNumbers = document.getElementById("questionNumbers");
  var status = document.getElementById("testStatus");
  var resultPanel = document.getElementById("resultPanel");

  document.body.dataset.testStyle = String(testId);
  document.documentElement.style.setProperty("--exam-accent", selectedButtonTheme.accent);
  document.documentElement.style.setProperty("--exam-accent-hover", selectedButtonTheme.hover);
  document.getElementById("testVariation").textContent = "Варијација " + String(testId).padStart(2, "0");
  document.title = "Тест " + String(testId).padStart(2, "0") + " - Теорија за возачка";

  window.addEventListener("DOMContentLoaded", loadTest);

  function loadTest() {
    fetch("../data/theory/categories.json")
      .then(function (response) {
        if (!response.ok) throw new Error("Не може да се вчита списокот со категории.");
        return response.json();
      })
      .then(function (categories) {
        if (!Array.isArray(categories) || categories.length === 0) {
          throw new Error("Списокот со категории не е во очекуваниот формат.");
        }
        return Promise.all(
          categories.map(function (category) {
            return fetch("../data/theory/" + encodeURIComponent(category.file)).then(function (response) {
              if (!response.ok) throw new Error("Не може да се вчита датотеката " + category.file + ".");
              return response.json();
            });
          }),
        ).then(function (groups) {
          return { categories: categories, groups: groups };
        });
      })
      .then(function (data) {
        var eligibleQuestions = [];
        var random = createRandom(testId);
        data.groups.forEach(function (group) {
          if (!Array.isArray(group)) {
            throw new Error("Датотеката со прашања не е во очекуваниот формат.");
          }
          eligibleQuestions = eligibleQuestions.concat(
            group.filter(function (question) {
              return question && Array.isArray(question.categories) &&
                question.categories.indexOf(licenceCategory) >= 0;
            }),
          );
        });
        if (eligibleQuestions.length < questionsPerTest) {
          throw new Error("Нема доволно прашања за категоријата " + licenceCategory + ".");
        }
        shuffle(eligibleQuestions, random);
        questions = eligibleQuestions.slice(0, questionsPerTest);
        if (questions.some(function (question) { return !question.type; })) {
          throw new Error("Прашање од категоријата " + licenceCategory + " има невалиден формат.");
        }
        status.hidden = true;
        exam.hidden = false;
        render();
      })
      .catch(function (error) {
        console.error("Неуспешно вчитување на тестот.", error);
        status.classList.add("is-error");
        status.textContent =
          error.message + " Проверете дека страницата е отворена преку локален веб-сервер.";
      });
  }

  function render() {
    renderQuestion();
    renderQuestionNumbers();
    renderProgress();
    renderResult();
    document.getElementById("previousQuestion").disabled = currentIndex === 0;
    document.getElementById("nextQuestion").disabled = currentIndex === questions.length - 1;
    document.getElementById("nextQuestion").hidden = isFinished || currentIndex === questions.length - 1;
    document.getElementById("finishTest").classList.toggle("is-visible", !isFinished && currentIndex === questions.length - 1);
  }

  function renderQuestion() {
    var question = questions[currentIndex];
    if (!question) return;
    var saved = answers[currentIndex];
    var html = '<h2 class="exam-question">' + escapeHtml(question.question) + "</h2>";

    if (question.image) {
      html += renderImage(question.image, question.image_remote, "exam-image");
    }

    if (question.type === "multiple") {
      html += '<div class="exam-answers">';
      question.answers.forEach(function (answer) {
        var checked = saved && saved.indexOf(answer.id) >= 0;
        var correct = (question.correct || []).indexOf(answer.id) >= 0;
        var className = "exam-answer";
        if (isFinished && correct) className += " is-correct";
        else if (isFinished && checked) className += " is-incorrect";
        html +=
          '<label class="' + className + '"><input type="checkbox" name="exam-answer" value="' +
          escapeAttribute(answer.id) +
          '"' +
          (checked ? " checked" : "") +
          (isFinished ? " disabled" : "") +
          ">" +
          renderAnswer(answer) +
          "</label>";
      });
      html += "</div>";
    } else if (question.type === "matching") {
      var matchingAnswers = saved || {};
      html += '<div class="matching-image-list">';
      question.images.forEach(function (image, imageIndex) {
        var entered = matchingAnswers[image.id] || "";
        var correct = Number(entered) === Number(image.correct_answer_num);
        html +=
          '<label class="matching-image-item">' +
          renderImageMarkup(image.src, image.src_remote, "") +
          '<input type="number" min="1" max="' +
          question.answers.length +
          '" step="1" inputmode="numeric" data-image-id="' +
          escapeAttribute(image.id) +
          '" aria-label="Одговор за слика ' +
          (imageIndex + 1) +
          '" value="' +
          escapeAttribute(entered) +
          '"' +
          (isFinished ? " disabled" : "") +
          (isFinished ? ' aria-invalid="' + (!correct) + '"' : "") +
          "></label>";
      });
      html += "</div><div class=\"matching-answer-list\">";
      question.answers.forEach(function (answer) {
        html +=
          '<div class="matching-answer-row"><strong>' +
          answer.order +
          ".</strong><span>" +
          escapeHtml(answer.text) +
          "</span></div>";
      });
      html += "</div>";
    } else if (question.type === "fill-in") {
      html +=
        '<label class="fill-answer">Одговор:' +
        '<input type="text" name="exam-fill-answer" autocomplete="off" value="' +
        escapeAttribute(saved || "") +
        '" placeholder="Внесете одговор"' +
        (isFinished ? " disabled" : "") +
        "></label>";
      if (isFinished) {
        html += '<p class="fill-correct-answer">Точен одговор: ' + escapeHtml(question.correct_text) + "</p>";
      }
    } else {
      throw new Error("Неподдржан тип прашање: " + question.type);
    }

    questionPanel.innerHTML = html;
    questionPanel.querySelectorAll("img[data-remote]").forEach(function (image) {
      image.addEventListener("error", function () {
        var remote = image.getAttribute("data-remote");
        if (remote && image.src !== remote) image.src = remote;
      }, { once: true });
    });
  }

  function renderAnswer(answer) {
    var content = answer.image
      ? renderImageMarkup(answer.image, answer.image_remote, "exam-answer-image")
      : '<span>' + escapeHtml(answer.text) + "</span>";
    return content;
  }

  function renderImage(path, remote, className) {
    return '<div class="' + className + '">' + renderImageMarkup(path, remote, "") + "</div>";
  }

  function renderImageMarkup(path, remote, className) {
    return (
      '<img class="' +
      className +
      '" src="../' +
      escapeAttribute(path) +
      '" data-remote="' +
      escapeAttribute(remote || "") +
      '" alt="">'
    );
  }

  function renderQuestionNumbers() {
    questionNumbers.innerHTML = questions
      .map(function (question, index) {
        var className = "question-number";
        if (index === currentIndex) className += " is-current";
        if (hasAnswer(index)) className += " is-answered";
        if (isFinished && !isCorrect(index)) className += " is-wrong";
        return (
          '<button class="' +
          className +
          '" type="button" data-index="' +
          index +
          '" data-question-number="' +
          question.number +
          '" aria-label="Прашање ' +
          (index + 1) +
          (hasAnswer(index) ? ", одговорено" : ", неодговорено") +
          '"' +
          (index === currentIndex ? ' aria-current="step"' : "") +
          ">" +
          '<span aria-hidden="true">Q</span>' +
          String(index + 1).padStart(2, "0") +
          "</button>"
        );
      })
      .join("");
  }

  function renderProgress() {
    document.getElementById("questionProgress").textContent =
      "Прашање " + (currentIndex + 1) + " на " + questions.length;
    document.getElementById("questionPoints").textContent =
      questions[currentIndex].point_value + " поени";
  }

  function renderResult() {
    if (!isFinished) {
      resultPanel.hidden = true;
      return;
    }
    var score = calculateScore();
    var maxScore = questions.reduce(function (total, question) {
      return total + question.point_value;
    }, 0);
    var answeredCount = questions.filter(function (question, index) {
      return hasAnswer(index);
    }).length;
    resultPanel.hidden = false;
    resultPanel.innerHTML =
      "<strong>Резултат: " +
      score +
      " од " +
      maxScore +
      " поени</strong><br>Одговорени прашања: " +
      answeredCount +
      " од " +
      questions.length +
      '<button type="button" id="restartTest">Започни нов тест</button>';
  }

  function hasAnswer(index) {
    var response = answers[index];
    if (Array.isArray(response)) return response.length > 0;
    if (response && typeof response === "object") {
      return Object.keys(response).some(function (key) {
        return response[key] !== "";
      });
    }
    return typeof response === "string" && response.trim() !== "";
  }

  function isCorrect(index) {
    var question = questions[index];
    var response = answers[index];
    if (!hasAnswer(index)) return false;
    if (question.type === "multiple") {
      var correctAnswers = question.correct || [];
      return (
        response.length === correctAnswers.length &&
        response.every(function (answerId) {
          return correctAnswers.indexOf(answerId) >= 0;
        })
      );
    }
    if (question.type === "matching") {
      return question.images.every(function (image) {
        return Number(response[image.id]) === Number(image.correct_answer_num);
      });
    }
    return normalize(response) === normalize(question.correct_text);
  }

  function calculateScore() {
    return questions.reduce(function (total, question, index) {
      return total + (isCorrect(index) ? question.point_value : 0);
    }, 0);
  }

  questionPanel.addEventListener("change", function (event) {
    if (isFinished) return;
    var target = event.target;
    var question = questions[currentIndex];
    if (question.type === "multiple" && target.name === "exam-answer") {
      answers[currentIndex] = Array.from(
        questionPanel.querySelectorAll('input[name="exam-answer"]:checked'),
      ).map(function (input) {
        return input.value;
      });
    } else if (question.type === "matching" && target.matches("[data-image-id]")) {
      if (!answers[currentIndex]) answers[currentIndex] = {};
      answers[currentIndex][target.dataset.imageId] = target.value;
    } else if (question.type === "fill-in" && target.name === "exam-fill-answer") {
      answers[currentIndex] = target.value;
    }
    renderQuestionNumbers();
  });
  questionPanel.addEventListener("input", function (event) {
    if (isFinished) return;
    var target = event.target;
    var question = questions[currentIndex];
    if (question.type === "matching" && target.matches("[data-image-id]")) {
      if (!answers[currentIndex]) answers[currentIndex] = {};
      answers[currentIndex][target.dataset.imageId] = target.value;
      renderQuestionNumbers();
    } else if (question.type === "fill-in" && target.name === "exam-fill-answer") {
      answers[currentIndex] = target.value;
      renderQuestionNumbers();
    }
  });
  questionNumbers.addEventListener("click", function (event) {
    var button = event.target.closest("[data-index]");
    if (!button) return;
    currentIndex = Number(button.dataset.index);
    render();
    questionPanel.focus();
  });
  document.getElementById("previousQuestion").addEventListener("click", function () {
    if (currentIndex > 0) {
      currentIndex--;
      render();
    }
  });
  document.getElementById("nextQuestion").addEventListener("click", function () {
    if (currentIndex < questions.length - 1) {
      currentIndex++;
      render();
    }
  });
  document.getElementById("finishTest").addEventListener("click", finishTest);
  resultPanel.addEventListener("click", function (event) {
    if (event.target.id === "restartTest") window.location.reload();
  });

  function finishTest() {
    var unansweredCount = questions.filter(function (question, index) {
      return !hasAnswer(index);
    }).length;
    if (
      unansweredCount > 0 &&
      !window.confirm("Имате " + unansweredCount + " неодговорени прашања. Дали сакате да го завршите тестот?")
    ) {
      return;
    }
    isFinished = true;
    render();
    resultPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }

  function createRandom(seed) {
    var state = (seed * 0x9e3779b1) >>> 0;
    return function () {
      state += 0x6d2b79f5;
      var value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(items, random) {
    for (var index = items.length - 1; index > 0; index--) {
      var swapIndex = Math.floor(random() * (index + 1));
      var value = items[index];
      items[index] = items[swapIndex];
      items[swapIndex] = value;
    }
  }
})();
