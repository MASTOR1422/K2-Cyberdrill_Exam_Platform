/* ==========================================================================
   K2-Cyberdrill Exam Platform — Application logic
   - Safe HTML escaping (no XSS, no broken template literals)
   - Responsive UX with keyboard & touch support
   - Progress bar, stats panel, toast notifications
   ========================================================================== */

(function () {
  'use strict';

  // ---------------- State ----------------
  let currentExam = null;
  let currentQuestionIndex = 0;
  let userAnswers = [];
  let timerInterval = null;
  let timeRemainingSeconds = 0;
  let uploadedExamData = null;
  let questionBank = null;
  let selectedExamId = null;
  let selectedTheme = 'Tous';
  let statsPanelVisible = false;

  // ---------------- Safe text helpers ----------------
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Light markdown rendering for explanations:
   *   - `code`  -> <code>code</code>
   *   - **bold** -> <strong>
   * Input is HTML-escaped first, then markdown is applied on the safe string.
   */
  function renderRichText(str) {
    const safe = escapeHtml(str);
    return safe
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  }

  // ---------------- Toast ----------------
  let toastTimer = null;
  function toast(message, type) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.className = 'toast show' + (type ? ' ' + type : '');
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => { el.hidden = true; }, 300);
    }, 2600);
  }

  // ---------------- Question bank loading ----------------
  async function getQuestionBank() {
    if (uploadedExamData) return uploadedExamData;
    if (questionBank) return questionBank;

    const response = await fetch('questions.json', { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error('Impossible de charger le fichier des examens (questions.json).');
    }
    questionBank = await response.json();
    return questionBank;
  }

  // ---------------- Initialization ----------------
  async function initializeApp() {
    try {
      const data = await getQuestionBank();
      renderExamButtons(data);

      if (data.exams && data.exams.length > 0) {
        const firstExam = data.exams[0];
        selectedExamId = firstExam.id;
        renderThemeButtons(firstExam);
        loadExam(firstExam.id, 'Tous');
      }
    } catch (error) {
      const container = document.getElementById('quiz-container');
      if (container) {
        container.innerHTML = `<div class="error-box">${escapeHtml(error.message)}</div>`;
      }
    }
  }

  // ---------------- Exam buttons ----------------
  function renderExamButtons(data) {
    const examList = document.getElementById('exam-list');
    if (!examList || !data || !Array.isArray(data.exams)) return;

    examList.innerHTML = data.exams.map((exam) => {
      const isActive = selectedExamId === exam.id || (!selectedExamId && exam.id === data.exams[0].id);
      return `
        <button type="button" class="exam-btn ${isActive ? 'active' : ''}" data-exam-id="${escapeHtml(exam.id)}" role="tab" aria-selected="${isActive}">
          ${escapeHtml(exam.title)}
        </button>
      `;
    }).join('');

    examList.querySelectorAll('.exam-btn').forEach((button) => {
      button.addEventListener('click', () => {
        const examId = button.getAttribute('data-exam-id');
        selectedExamId = examId;
        selectedTheme = 'Tous';
        renderExamButtons(data);
        renderThemeButtons(data.exams.find((exam) => exam.id === examId));
        loadExam(examId, 'Tous');
      });
    });
  }

  // ---------------- Theme buttons ----------------
  function renderThemeButtons(exam) {
    const themeList = document.getElementById('theme-list');
    if (!themeList || !exam) return;

    const themes = ['Tous', ...new Set(exam.questions.map((question) => question.topic).filter(Boolean))];
    themeList.innerHTML = themes.map((theme) => {
      const isActive = selectedTheme === theme;
      return `
        <button type="button" class="theme-btn ${isActive ? 'active' : ''}" data-theme="${escapeHtml(theme)}" role="tab" aria-selected="${isActive}">
          ${escapeHtml(theme)}
        </button>
      `;
    }).join('');

    themeList.querySelectorAll('.theme-btn').forEach((button) => {
      button.addEventListener('click', () => {
        const theme = button.getAttribute('data-theme');
        selectedTheme = theme;
        renderThemeButtons(exam);
        loadExam(exam.id, theme);
      });
    });
  }

  // ---------------- Load exam ----------------
  async function loadExam(examId, theme) {
    const themeArg = theme === undefined ? 'Tous' : theme;
    try {
      const data = await getQuestionBank();
      const exam = data.exams.find((item) => item.id === examId);

      if (!exam) {
        throw new Error(`Examen introuvable : ${examId}`);
      }

      const filteredQuestions = themeArg === 'Tous'
        ? exam.questions
        : exam.questions.filter((question) => question.topic === themeArg);

      if (!filteredQuestions.length) {
        throw new Error(`Aucune question disponible pour le thème "${themeArg}" dans ${exam.title}.`);
      }

      selectedExamId = examId;
      selectedTheme = themeArg;
      currentExam = Object.assign({}, exam, { questions: filteredQuestions });
      currentQuestionIndex = 0;
      userAnswers = [];
      timeRemainingSeconds = (currentExam.durationMinutes || 90) * 60;

      renderExamButtons(data);
      renderThemeButtons(data.exams.find((item) => item.id === examId));
      updateStatsPanel();
      startTimer();
      showQuestion();
      toast(`Examen chargé : ${currentExam.title} (${filteredQuestions.length} questions)`);
    } catch (error) {
      const container = document.getElementById('quiz-container');
      if (container) {
        container.innerHTML = `<div class="error-box">${escapeHtml(error.message)}</div>`;
      }
    }
  }
  // Expose for inline onclick in results page
  window.loadExam = loadExam;

  // ---------------- JSON upload ----------------
  function handleJsonUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const data = JSON.parse(loadEvent.target.result);
        if (!data || !Array.isArray(data.exams)) {
          throw new Error('Le fichier JSON doit contenir une propriété exams[].');
        }

        uploadedExamData = data;
        questionBank = data;
        const firstExam = data.exams[0];
        const timerDisplay = document.getElementById('timer-display');
        if (timerDisplay) {
          timerDisplay.textContent = `Fichier chargé : ${firstExam ? firstExam.title : 'Examen importé'}`;
        }

        renderExamButtons(data);
        renderThemeButtons(firstExam);
        if (firstExam && firstExam.id) {
          loadExam(firstExam.id, 'Tous');
        }
        toast('Fichier JSON importé avec succès.', 'success');
      } catch (error) {
        toast(`Fichier JSON invalide : ${error.message}`, 'error');
      }
      // Reset input so the same file can be re-imported
      event.target.value = '';
    };
    reader.readAsText(file);
  }

  // ---------------- Timer ----------------
  function startTimer() {
    clearInterval(timerInterval);

    const timerDisplay = document.getElementById('timer-display');
    if (timerDisplay) {
      timerDisplay.classList.remove('warning', 'critical');
    }

    updateTimerDisplay();

    timerInterval = setInterval(() => {
      timeRemainingSeconds -= 1;
      updateTimerDisplay();

      const td = document.getElementById('timer-display');
      if (td) {
        td.classList.remove('warning', 'critical');
        if (timeRemainingSeconds <= 60 && timeRemainingSeconds > 0) {
          td.classList.add('critical');
        } else if (timeRemainingSeconds <= 300 && timeRemainingSeconds > 0) {
          td.classList.add('warning');
        }
      }

      if (timeRemainingSeconds <= 0) {
        clearInterval(timerInterval);
        toast('Temps écoulé ! Examen clôturé automatiquement.', 'error');
        showResults(true);
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timer-display');
    if (!timerDisplay) return;

    const safe = Math.max(0, timeRemainingSeconds);
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const seconds = safe % 60;

    const formattedTime = [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');

    timerDisplay.textContent = `⏱ Temps restant : ${formattedTime}`;
  }

  // ---------------- Stats panel ----------------
  function updateStatsPanel() {
    const content = document.getElementById('stats-content');
    if (!content || !currentExam) return;

    const total = currentExam.questions.length;
    const answered = userAnswers.filter((a) => a).length;
    const correct = userAnswers.filter((a) => a && a.correct).length;
    const duration = currentExam.durationMinutes || 90;
    const passScore = Math.ceil(total * 0.7);

    content.innerHTML = `
      <div class="stat-card"><span class="stat-value">${total}</span><span class="stat-label">Questions</span></div>
      <div class="stat-card"><span class="stat-value">${answered}</span><span class="stat-label">Répondues</span></div>
      <div class="stat-card"><span class="stat-value">${correct}</span><span class="stat-label">Correctes</span></div>
      <div class="stat-card"><span class="stat-value">${duration}min</span><span class="stat-label">Durée</span></div>
      <div class="stat-card"><span class="stat-value">${passScore}</span><span class="stat-label">Score requis (70%)</span></div>
    `;
  }

  // ---------------- Save answer ----------------
  function saveAnswer(selectedIndex) {
    if (!currentExam) return null;

    const question = currentExam.questions[currentQuestionIndex];
    const safeIndex = Number(selectedIndex);

    const answer = {
      question: question.question,
      selectedIndex: safeIndex,
      correct: safeIndex === question.correctIndex,
      explanation: question.explanation,
      option: question.options[safeIndex] || 'Aucune réponse'
    };

    userAnswers[currentQuestionIndex] = answer;
    updateStatsPanel();
    updateProgressBar();
    return answer;
  }

  function updateProgressBar() {
    if (!currentExam) return;
    const bar = document.getElementById('exam-progress-bar');
    if (!bar) return;
    const total = currentExam.questions.length;
    const answered = userAnswers.filter((a) => a).length;
    const pct = total ? (answered / total) * 100 : 0;
    bar.style.width = pct + '%';
  }

  // ---------------- Show question ----------------
  function showQuestion() {
    if (!currentExam) return;

    const question = currentExam.questions[currentQuestionIndex];
    const container = document.getElementById('quiz-container');
    const answeredChoice = userAnswers[currentQuestionIndex] ? userAnswers[currentQuestionIndex].selectedIndex : undefined;
    const answer = userAnswers[currentQuestionIndex];

    const feedbackHtml = answer
      ? `
        <div class="feedback ${answer.correct ? 'correct' : 'incorrect'}">
          <strong>${answer.correct ? '✓ VRAI' : '✗ FAUX'}</strong>
          <p><span>Réponse correcte :</span> ${escapeHtml(question.options[question.correctIndex])}</p>
          <p><span>Explication :</span> ${renderRichText(question.explanation)}</p>
        </div>
      `
      : '';

    let html = `
      <div class="question-card">
        <div class="question-header">
          <span>Question ${currentQuestionIndex + 1} / ${currentExam.questions.length}</span>
          <span class="theme-badge">${escapeHtml(question.topic || selectedTheme || 'Thème')}</span>
        </div>
        <h3>${escapeHtml(question.question)}</h3>
        <div class="answers">
    `;

    question.options.forEach((option, optionIndex) => {
      const isChecked = answeredChoice === optionIndex ? 'checked' : '';
      const selectedClass = answeredChoice === optionIndex ? 'selected' : '';
      html += `
        <label class="option-item ${selectedClass}">
          <input type="radio" name="answer" value="${optionIndex}" ${isChecked}>
          <span>${String.fromCharCode(65 + optionIndex)}. ${escapeHtml(option)}</span>
        </label>
      `;
    });

    const isLast = currentQuestionIndex === currentExam.questions.length - 1;
    html += `
        </div>
        ${feedbackHtml}
        <div class="navigation">
          <button type="button" class="btn secondary" onclick="goToPreviousQuestion()" ${currentQuestionIndex === 0 ? 'disabled' : ''}>← Précédent</button>
          <button type="button" class="btn primary" onclick="goToNextQuestion()">${isLast ? 'Terminer l\'examen' : 'Suivant →'}</button>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Wire radio events
    const radios = container.querySelectorAll('input[name="answer"]');
    radios.forEach((radio) => {
      radio.addEventListener('change', (event) => {
        saveAnswer(event.target.value);
        showQuestion();
      });
    });

    updateProgressBar();
    // Scroll to question top on mobile
    const card = container.querySelector('.question-card');
    if (card && window.innerWidth < 768) {
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function goToPreviousQuestion() {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex -= 1;
      showQuestion();
    }
  }
  window.goToPreviousQuestion = goToPreviousQuestion;

  function goToNextQuestion() {
    if (!currentExam) return;

    const selectedAnswer = userAnswers[currentQuestionIndex] ? userAnswers[currentQuestionIndex].selectedIndex : undefined;
    if (selectedAnswer === undefined || selectedAnswer === null) {
      toast('Veuillez sélectionner une réponse avant de continuer.', 'warning');
      return;
    }

    if (currentQuestionIndex < currentExam.questions.length - 1) {
      currentQuestionIndex += 1;
      showQuestion();
      return;
    }

    showResults(false);
  }
  window.goToNextQuestion = goToNextQuestion;

  // ---------------- Results ----------------
  function showResults(finishedByTimeout) {
    clearInterval(timerInterval);

    if (!currentExam) return;

    const correct = userAnswers.filter((entry) => entry && entry.correct).length;

    const timerDisplay = document.getElementById('timer-display');
    if (timerDisplay) {
      timerDisplay.textContent = '✓ Examen terminé';
      timerDisplay.classList.remove('warning', 'critical');
    }

    const container = document.getElementById('quiz-container');
    const totalQuestions = currentExam.questions.length;
    const percentage = totalQuestions ? Math.round((correct / totalQuestions) * 100) : 0;
    const passed = percentage >= 70;

    let html = `
      <div class="results-card">
        <h2>Résultat de l'Examen Blanc</h2>
        <div class="score-banner ${passed ? 'pass' : 'fail'}">
          <span class="big">${correct} / ${totalQuestions}</span>
          <span>${percentage}% — ${passed ? '✓ Réussi' : '✗ Échec'} (seuil 70%)</span>
        </div>
    `;

    if (finishedByTimeout) {
      html += '<p class="warning">⏱ Le temps imparti est écoulé. L\'examen a été clôturé automatiquement.</p>';
    }

    const summary = currentExam.questions.map((question, idx) => {
      const answer = userAnswers[idx] || {
        question: question.question,
        selectedIndex: null,
        correct: false,
        explanation: question.explanation,
        option: 'Aucune réponse'
      };

      const selectedLabel = answer.selectedIndex !== null && answer.selectedIndex !== undefined
        ? question.options[answer.selectedIndex]
        : 'Aucune réponse';

      const statusClass = answer.correct ? 'success' : 'error';
      const statusText = answer.correct ? '✓ Correct' : '✗ Incorrect';

      return `
        <div class="review-item">
          <p><strong>Q${idx + 1} :</strong> ${escapeHtml(question.question)}</p>
          <p>Votre réponse : <span>${escapeHtml(selectedLabel)}</span></p>
          <p>Statut : <span class="${statusClass}">${statusText}</span></p>
          <p><em>Explication :</em> ${renderRichText(question.explanation)}</p>
        </div>
      `;
    }).join('');

    html += summary;
    html += `
        <div class="navigation results-actions">
          <button type="button" class="btn primary" onclick="loadExam('${escapeHtml(currentExam.id)}', '${escapeHtml(selectedTheme)}')">↻ Recommencer</button>
        </div>
      </div>
    `;

    container.innerHTML = html;
    updateStatsPanel();
    updateProgressBar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast(passed ? `Bravo ! ${percentage}% — examen réussi.` : `${percentage}% — seuil de 70% non atteint.`, passed ? 'success' : 'error');
  }

  // ---------------- Stats toggle ----------------
  function setupStatsToggle() {
    const toggle = document.getElementById('toggle-stats');
    const panel = document.getElementById('stats-panel');
    if (!toggle || !panel) return;

    toggle.addEventListener('click', () => {
      statsPanelVisible = !statsPanelVisible;
      panel.hidden = !statsPanelVisible;
      toggle.setAttribute('aria-pressed', String(statsPanelVisible));
      if (statsPanelVisible) updateStatsPanel();
    });
  }

  // ---------------- File input (programmatic) ----------------
  function setupFileImport() {
    const input = document.getElementById('json-upload');
    if (input) {
      input.addEventListener('change', handleJsonUpload);
    }
    const labels = document.querySelectorAll('.file-import-label');
    labels.forEach((label) => {
      label.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const inp = label.querySelector('input[type="file"]');
          if (inp) inp.click();
        }
      });
    });
  }

  // ---------------- Boot ----------------
  window.addEventListener('DOMContentLoaded', () => {
    const timerDisplay = document.getElementById('timer-display');
    if (timerDisplay) {
      timerDisplay.textContent = '⏱ Aucun examen lancé';
    }
    setupStatsToggle();
    setupFileImport();
    initializeApp();
  });
})();
