var DATA = [];

var activeCats = new Set();
var showCorrect = false;
var userAnswers = {};

window.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".cat-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (this.dataset.cat === "__all") {
        document.querySelectorAll(".cat-btn").forEach(function (b) {
          b.classList.remove("active");
        });
        this.classList.add("active-all");
        activeCats.clear();
      } else {
        document.querySelector(".cat-btn.active-all") &&
          document.querySelector(".cat-btn.active-all").classList.remove("active-all");
        if (activeCats.has(this.dataset.cat)) {
          activeCats.delete(this.dataset.cat);
          this.classList.remove("active");
        } else {
          activeCats.add(this.dataset.cat);
          this.classList.add("active");
        }
        if (activeCats.size === 0) {
          document.querySelector('.cat-btn[data-cat="__all"]').classList.add("active-all");
        }
      }
      render();
    });
  });

  document.getElementById("showCorrect").addEventListener("change", function (e) {
    showCorrect = e.target.checked;
    render();
  });

  document.getElementById("clearAll").addEventListener("click", function () {
    userAnswers = {};
    render();
  });

  document.getElementById("lightbox").addEventListener("click", function (e) {
    if (e.target === this) closeLightbox();
  });

  document.getElementById("statsBar").textContent = "Прашањата се вчитуваат...";
  fetch("data/theory/categories.json")
    .then(function (response) {
      if (!response.ok) throw new Error("Failed to load category manifest: " + response.status);
      return response.json();
    })
    .then(function (categories) {
      if (!Array.isArray(categories)) throw new Error("Theory category manifest is not an array");
      return Promise.all(
        categories.map(function (category) {
          var file = "data/theory/" + category.file;
          return fetch(file).then(function (response) {
            if (!response.ok) throw new Error("Failed to load " + file + ": " + response.status);
            return response.json();
          });
        }),
      );
    })
    .then(function (groups) {
      DATA = groups
        .reduce(function (allQuestions, group) {
          if (!Array.isArray(group)) throw new Error("Theory category file is not an array");
          return allQuestions.concat(group);
        }, [])
        .sort(function (a, b) {
          return a.index - b.index;
        });
      render();
    })
    .catch(function (error) {
      console.error("Failed to load theory category files.", error);
      document.getElementById("statsBar").textContent =
        "Не можеа да се вчитаат прашањата. Отворете ја страницата преку веб-сервер.";
    });
});

function renderAnswerContent(answer) {
  if (!answer.image) return escapeHtml(answer.text);
  return (
    '<img class="answer-image" src="' +
    escapeHtml(answer.image) +
    '" data-remote="' +
    escapeHtml(answer.image_remote || "") +
    '" onerror="imgFallback(this)" onclick="event.preventDefault();event.stopPropagation();openLightbox(this.src)" alt="">'
  );
}

function openLightbox(src) {
  document.getElementById("lightboxImg").src = src;
  document.getElementById("lightbox").style.display = "block";
}

function closeLightbox() {
  document.getElementById("lightbox").style.display = "none";
}

function isVisible(q) {
  if (activeCats.size === 0) return true;
  return q.categories.some(function (c) {
    return activeCats.has(c);
  });
}

function render() {
  var container = document.getElementById("questionsContainer");
  var visible = DATA.filter(isVisible);
  var html = "";
  var correctCount = 0,
    answeredCount = 0;

  visible.forEach(function (q, vi) {
    var qid = "q" + q.index;
    var isAnswered = userAnswers[qid] !== undefined;
    var revealed = userAnswers[qid + "_revealed"];

    html += '<div class="question">';
    html += '<div class="q-header">';
    html += '<span class="q-number">' + q.number + ".</span>";
    html += '<span class="q-categories">' + q.categories.join(", ") + "</span>";
    html += '<span class="q-points">' + q.point_value + " поени</span>";
    html += '</div><div class="q-body">';

    html += '<div class="q-text">' + escapeHtml(q.question) + "</div>";

    if (q.image) {
      html +=
        '<div class="q-image"><img src="' +
        q.image +
        '" data-remote="' +
        (q.image_remote || "") +
        '" onerror="imgFallback(this)" onclick="openLightbox(this.src)" alt=""></div>';
    }

    if (q.type === "multiple") {
      html += '<div class="answers">';
      var sel = userAnswers[qid] || [];
      var isCorrect = false;
      if (isAnswered) {
        var correctIds = q.answers
          .filter(function (a) {
            return a.correct;
          })
          .map(function (a) {
            return a.id;
          });
        isCorrect =
          sel.length === correctIds.length &&
          sel.every(function (id) {
            return correctIds.indexOf(id) >= 0;
          });
        if (isCorrect) correctCount++;
        answeredCount++;
      }
      q.answers.forEach(function (a) {
        var checked = sel.indexOf(a.id) >= 0;
        var cls = "answer-option";
        if ((showCorrect || isAnswered) && !revealed) {
          if (a.correct) cls += " correct-ans";
          else if (checked) cls += " wrong-ans";
        }
        var badge = "";
        if ((showCorrect || isAnswered) && !revealed) {
          if (a.correct) badge = ' <span class="badge badge-ok">✓</span>';
          else if (checked) badge = ' <span class="badge badge-no">✗</span>';
        }
        html +=
          '<label class="' +
          cls +
          '"><input type="checkbox" data-qid="' +
          qid +
          '" data-aid="' +
          a.id +
          '"' +
          (checked ? " checked" : "") +
          ' onchange="handleMulti(this)"><span class="answer-text">' +
          renderAnswerContent(a) +
          "</span>" +
          badge +
          "</label>";
      });
      html += '<div class="reveal-answer' + (revealed ? " show" : "") + '" id="' + qid + '_reveal">';
      html += "Точен одговор: ";
      html += q.answers
        .filter(function (a) {
          return a.correct;
        })
        .map(function (a) {
          return renderAnswerContent(a);
        })
        .join(", ");
      html += "</div>";
      html += '<button class="reveal-btn" onclick="revealAnswer(\'' + qid + "')\">Покажи точен одговор</button>";
      html += "</div>";
    } else if (q.type === "matching") {
      var um = userAnswers[qid] || {};
      var isCorrect =
        isAnswered &&
        q.images.every(function (img) {
          return um[img.id] === img.correct_answer_num;
        });
      if (isAnswered) {
        if (isCorrect) correctCount++;
        answeredCount++;
      }
      html += '<div class="matching-grid">';
      html += '<div class="matching-images">';
      q.images.forEach(function (img) {
        var uv = um[img.id];
        var selOpts = '<option value="">--</option>';
        q.answers.forEach(function (a) {
          selOpts +=
            '<option value="' + a.order + '"' + (uv === a.order ? " selected" : "") + ">" + a.order + "</option>";
        });
        var st = "";
        if ((showCorrect || isAnswered) && !revealed) {
          if (uv === undefined) {
            st = "";
          } else if (uv === img.correct_answer_num) {
            st = ' <span style="color:#34a853;font-weight:600">✓</span>';
          } else {
            st = ' <span style="color:#ea4335;font-weight:600">✗ (треба ' + img.correct_answer_num + ")</span>";
          }
        }
        html +=
          '<div class="matching-img-box"><img src="' +
          img.src +
          '" data-remote="' +
          (img.src_remote || "") +
          '" onerror="imgFallback(this)" onclick="openLightbox(this.src)" alt=""><div class="img-label"><select data-qid="' +
          qid +
          '" data-iid="' +
          img.id +
          '" onchange="handleMatch(this)">' +
          selOpts +
          "</select>" +
          st +
          "</div></div>";
      });
      html += '</div><div class="matching-answers">';
      q.answers.forEach(function (a) {
        html +=
          '<div class="matching-answer-row"><span class="num">' +
          a.order +
          '.</span><span class="text">' +
          escapeHtml(a.text) +
          "</span></div>";
      });
      html += "</div>";
      html += '<div class="reveal-answer' + (revealed ? " show" : "") + '" id="' + qid + '_reveal">';
      html += "Точни одговори: ";
      var pairs = [];
      q.images.forEach(function (img) {
        var ansText = "";
        q.answers.forEach(function (a) {
          if (a.order === img.correct_answer_num) ansText = a.text;
        });
        pairs.push(
          "слика " + (pairs.length + 1) + " → " + img.correct_answer_num + " (" + escapeHtml(ansText) + ")",
        );
      });
      html += pairs.join(", ");
      html += "</div>";
      html += '<button class="reveal-btn" onclick="revealAnswer(\'' + qid + "')\">Покажи точен одговор</button>";
      html += "</div>";
    } else if (q.type === "fill-in") {
      var userVal = userAnswers[qid];
      var isCorrect = false;
      if (isAnswered) {
        isCorrect = userVal === q.correct_text;
        if (isCorrect) correctCount++;
        answeredCount++;
      }
      html += '<div class="fill-in-box">';
      html +=
        'Одговор: <input type="text" data-qid="' +
        qid +
        '" value="' +
        (userVal || "") +
        '" onchange="handleFill(this)" oninput="handleFill(this)" placeholder="внеси одговор">';
      if ((showCorrect || isAnswered) && !revealed) {
        if (isAnswered && isCorrect) {
          html += ' <span class="fill-status fill-ok">✓ Точен</span>';
        } else if (isAnswered) {
          html += ' <span class="fill-status fill-no">✗ Точен одговор: ' + escapeHtml(q.correct_text) + "</span>";
        } else if (showCorrect) {
          html += ' <span class="fill-status fill-ok">Точен одговор: ' + escapeHtml(q.correct_text) + "</span>";
        }
      }
      html += '<div class="reveal-answer' + (revealed ? " show" : "") + '" id="' + qid + '_reveal">';
      html += "Точен одговор: " + escapeHtml(q.correct_text);
      html += "</div>";
      html += '<button class="reveal-btn" onclick="revealAnswer(\'' + qid + "')\">Покажи точен одговор</button>";
      html += "</div>";
    }

    html += "</div></div>";
  });

  container.innerHTML = html;
  var statsText = "Прикажани: " + visible.length + " од " + DATA.length + " прашања";
  if (answeredCount > 0) statsText += " | Одговорени: " + answeredCount + ", Точни: " + correctCount;
  document.getElementById("statsBar").textContent = statsText;
}

function handleMulti(el) {
  var qid = el.dataset.qid;
  var aid = el.dataset.aid;
  if (!userAnswers[qid]) userAnswers[qid] = [];
  var arr = userAnswers[qid];
  var idx = arr.indexOf(aid);
  if (el.checked) {
    if (idx < 0) arr.push(aid);
  } else {
    if (idx >= 0) arr.splice(idx, 1);
  }
  render();
}

function handleMatch(el) {
  var qid = el.dataset.qid;
  var iid = el.dataset.iid;
  if (!userAnswers[qid]) userAnswers[qid] = {};
  userAnswers[qid][iid] = el.value ? parseInt(el.value) : undefined;
  render();
}

function handleFill(el) {
  var qid = el.dataset.qid;
  userAnswers[qid] = el.value.trim();
  render();
}

function revealAnswer(qid) {
  userAnswers[qid + "_revealed"] = true;
  render();
}

function imgFallback(img) {
  var remote = img.getAttribute("data-remote");
  if (remote && img.src !== remote) {
    img.src = remote;
  }
}

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
