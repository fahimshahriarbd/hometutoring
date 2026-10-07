// ==========================================
// HOME TUTOR - CLIENT JAVASCRIPT
// ==========================================

const API_BASE = "/api/tutor-service";

// App State
let currentUser = null;
let currentMode = "student"; // 'student' or 'admin'
let cachedStudents = [];
let cachedStudyDays = [];
let cachedLessons = [];
let currentQuizQuestions = [];
let currentQuizLessonId = null;

// DOM Elements
const loginScreen = document.getElementById("loginScreen");
const studentPortalScreen = document.getElementById("studentPortalScreen");
const adminScreen = document.getElementById("adminScreen");

// Login Elements
const loginCard = document.getElementById("loginCard");
const adminToggleBtn = document.getElementById("adminToggleBtn");
const settingsBadge = document.getElementById("settingsBadge");
const loginLogo = document.getElementById("loginLogo");
const loginBadge = document.getElementById("loginBadge");
const loginTitle = document.getElementById("loginTitle");
const loginSubtitle = document.getElementById("loginSubtitle");
const loginForm = document.getElementById("loginForm");
const usernameLabel = document.getElementById("usernameLabel");
const usernameInput = document.getElementById("username");
const passwordLabel = document.getElementById("passwordLabel");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginButton");
const switchModeLink = document.getElementById("switchModeLink");
const loginMessage = document.getElementById("loginMessage");

// Student Portal Elements
const studentGreeting = document.getElementById("studentGreeting");
const studentLogoutBtn = document.getElementById("studentLogoutBtn");
const studentNameDisplay = document.getElementById("studentNameDisplay");
const studentClassDisplay = document.getElementById("studentClassDisplay");
const studentIdDisplay = document.getElementById("studentIdDisplay");
const studentSubjectsDisplay = document.getElementById("studentSubjectsDisplay");
const studentPhotoImg = document.getElementById("studentPhotoImg");
const studyDaysList = document.getElementById("studyDaysList");

// Test Modal Elements
const testModal = document.getElementById("testModal");
const testSubjectBadge = document.getElementById("testSubjectBadge");
const testTitle = document.getElementById("testTitle");
const testSubtitle = document.getElementById("testSubtitle");
const closeTestModalBtn = document.getElementById("closeTestModalBtn");
const testBody = document.getElementById("testBody");
const testQuestionsContainer = document.getElementById("testQuestionsContainer");
const submitTestBtn = document.getElementById("submitTestBtn");
const testResultView = document.getElementById("testResultView");
const scoreEmoji = document.getElementById("scoreEmoji");
const scoreTitle = document.getElementById("scoreTitle");
const scoreDisplay = document.getElementById("scoreDisplay");
const scorePercentage = document.getElementById("scorePercentage");
const testReviewContainer = document.getElementById("testReviewContainer");
const closeResultBtn = document.getElementById("closeResultBtn");

// Admin Elements
const adminLogoutBtn = document.getElementById("adminLogoutBtn");
const adminTabs = document.querySelectorAll(".tab-item");
const tabContents = document.querySelectorAll(".tab-pane");
const adminSearchStudent = document.getElementById("adminSearchStudent");
const adminStudentList = document.getElementById("adminStudentList");
const openAddStudentModalBtn = document.getElementById("openAddStudentModalBtn");
const addStudentModal = document.getElementById("addStudentModal");
const closeAddStudentModalBtn = document.getElementById("closeAddStudentModalBtn");
const addStudentForm = document.getElementById("addStudentForm");
const addStudentMsg = document.getElementById("addStudentMsg");

// Admin Forms
const addStudyDayForm = document.getElementById("addStudyDayForm");
const dayStudentSelect = document.getElementById("dayStudentSelect");
const dayLabelInput = document.getElementById("dayLabelInput");
const dayDateInput = document.getElementById("dayDateInput");
const studyDayMsg = document.getElementById("studyDayMsg");

const addLessonForm = document.getElementById("addLessonForm");
const lessonDaySelect = document.getElementById("lessonDaySelect");
const lessonSubjectInput = document.getElementById("lessonSubjectInput");
const lessonNoteInput = document.getElementById("lessonNoteInput");
const lessonPdfInput = document.getElementById("lessonPdfInput");
const lessonTestEnabled = document.getElementById("lessonTestEnabled");
const lessonMsg = document.getElementById("lessonMsg");

const addQuestionForm = document.getElementById("addQuestionForm");
const questionLessonSelect = document.getElementById("questionLessonSelect");
const questionTextInput = document.getElementById("questionTextInput");
const optAInput = document.getElementById("optAInput");
const optBInput = document.getElementById("optBInput");
const optCInput = document.getElementById("optCInput");
const optDInput = document.getElementById("optDInput");
const correctAnswerSelect = document.getElementById("correctAnswerSelect");
const explanationInput = document.getElementById("explanationInput");
const questionMsg = document.getElementById("questionMsg");
const testResultsList = document.getElementById("testResultsList");
const usersCredentialsList = document.getElementById("usersCredentialsList");


// ==========================================
// 1. LOGIN & MODE SWITCHING
// ==========================================

function setMode(mode) {
  currentMode = mode;
  loginMessage.textContent = "";

  if (currentMode === "admin") {
    loginCard.classList.add("admin-mode");
    adminToggleBtn.classList.add("active-admin");
    settingsBadge.textContent = "Student";
    adminToggleBtn.title = "Switch to Student Login";

    loginLogo.textContent = "👨‍🏫";
    loginBadge.textContent = "Admin Portal";
    loginTitle.textContent = "Tutor Sign In";
    loginSubtitle.textContent = "Enter your admin username and PIN";

    usernameLabel.textContent = "Admin Username";
    usernameInput.placeholder = "admin";

    passwordLabel.textContent = "Admin PIN";
    passwordInput.placeholder = "123456";

    loginButton.textContent = "Sign In as Tutor";
    switchModeLink.innerHTML = "🎓 Switch to Student Login";
  } else {
    loginCard.classList.remove("admin-mode");
    adminToggleBtn.classList.remove("active-admin");
    settingsBadge.textContent = "Admin";
    adminToggleBtn.title = "Switch to Admin Login";

    loginLogo.textContent = "🎓";
    loginBadge.textContent = "Student Portal";
    loginTitle.textContent = "Student Login";
    loginSubtitle.textContent = "Enter your 4-digit ID and PIN";

    usernameLabel.textContent = "Student ID";
    usernameInput.placeholder = "e.g. 1001";

    passwordLabel.textContent = "PIN Code";
    passwordInput.placeholder = "e.g. 1234";

    loginButton.textContent = "Sign In";
    switchModeLink.innerHTML = "⚙️ Tutor / Admin Login";
  }
}

adminToggleBtn.addEventListener("click", () => {
  setMode(currentMode === "student" ? "admin" : "student");
});

switchModeLink.addEventListener("click", () => {
  setMode(currentMode === "student" ? "admin" : "student");
});

// Login Submit
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    loginMessage.textContent = "Please enter both ID and PIN.";
    return;
  }

  loginButton.disabled = true;
  loginButton.textContent = "Authenticating...";
  loginMessage.textContent = "";

  try {
    const res = await fetch(`${API_BASE}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "login",
        username: username,
        password: password
      })
    });

    const data = await res.json();

    if (data.success && data.user) {
      currentUser = data.user;
      localStorage.setItem("tutorUser", JSON.stringify(currentUser));

      if (currentUser.role === "admin") {
        showAdminScreen(currentUser);
      } else {
        showStudentPortal(currentUser);
      }
    } else {
      loginMessage.textContent = data.message || "Invalid credentials.";
    }
  } catch (err) {
    loginMessage.textContent = "Unable to connect. Please check credentials and try again.";
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = currentMode === "admin" ? "Sign In as Tutor" : "Sign In";
  }
});


// ==========================================
// 2. STUDENT PORTAL
// ==========================================

async function showStudentPortal(user) {
  loginScreen.classList.add("hidden");
  adminScreen.classList.add("hidden");
  studentPortalScreen.classList.remove("hidden");

  studentGreeting.textContent = `Welcome, ${user.name || "Student"}`;

  // Instant render from local cache if available, then fetch
  const targetId = user.studentId || user.id || "1001";
  fetchStudentData(targetId);
}

async function fetchStudentData(studentId) {
  try {
    const res = await fetch(`${API_BASE}?action=getStudents`);
    const data = await res.json();
    cachedStudents = data.students || [];

    let student = cachedStudents.find(s =>
      String(s.id) === String(studentId) ||
      String(s.code) === String(studentId) ||
      s.name.toLowerCase().includes((currentUser.name || "").toLowerCase())
    );

    if (!student && cachedStudents.length > 0) {
      student = cachedStudents[0];
    }

    if (student) {
      renderStudentProfile(student);
      loadStudentStudyDays(student.id);
    }
  } catch (err) {
    console.error("Failed to load student data:", err);
  }
}

function renderStudentProfile(student) {
  studentNameDisplay.textContent = student.name || "Student";
  studentClassDisplay.textContent = student.className || "Class";
  studentIdDisplay.textContent = `ID: ${student.id || "1001"}`;

  if (student.imageUrl) {
    studentPhotoImg.src = student.imageUrl;
  }

  const subjects = Array.isArray(student.subjects) ? student.subjects : ["General"];
  studentSubjectsDisplay.innerHTML = subjects
    .map(sub => `<span class="subject-tag">${sub}</span>`)
    .join("");
}

async function loadStudentStudyDays(studentId) {
  studyDaysList.innerHTML = '<div class="loader-box">Loading lessons...</div>';

  try {
    const res = await fetch(`${API_BASE}?action=getStudyDays&studentId=${encodeURIComponent(studentId)}`);
    const data = await res.json();
    const days = data.days || [];

    if (days.length === 0) {
      studyDaysList.innerHTML = '<div class="loader-box">No lessons logged yet.</div>';
      return;
    }

    studyDaysList.innerHTML = "";

    for (const day of days) {
      const dayCard = document.createElement("div");
      dayCard.className = "day-item-card";

      let formattedDate = day.date || "";
      if (formattedDate.includes("T")) formattedDate = formattedDate.split("T")[0];

      dayCard.innerHTML = `
        <div class="day-bar">
          <div>
            <span class="day-tag-badge">${day.day || "DAY"}</span>
            <span class="day-date-text">📅 ${formattedDate}</span>
          </div>
          <span style="font-size: 11px; color: #64748b; font-weight: 600;">Home Tutoring</span>
        </div>
        <div class="day-lessons-box" id="lessonsFor_${day.id}">
          <div style="font-size: 12px; color: #64748b;">Loading topics...</div>
        </div>
      `;

      studyDaysList.appendChild(dayCard);
      fetchLessonsForDay(day.id);
    }
  } catch (err) {
    studyDaysList.innerHTML = '<div class="loader-box">Unable to load study log.</div>';
  }
}

async function fetchLessonsForDay(studyDayId) {
  const container = document.getElementById(`lessonsFor_${studyDayId}`);
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}?action=getLessons&studyDayId=${encodeURIComponent(studyDayId)}`);
    const data = await res.json();
    const lessons = data.lessons || [];

    if (lessons.length === 0) {
      container.innerHTML = '<div style="font-size: 12px; color: #64748b;">No lesson topics recorded.</div>';
      return;
    }

    container.innerHTML = "";

    lessons.forEach(lesson => {
      const card = document.createElement("div");
      card.className = "lesson-single";

      const note = (lesson.shortNote && lesson.shortNote !== "NA")
        ? lesson.shortNote
        : "Class notes and discussion recorded.";

      card.innerHTML = `
        <span class="subject-badge-pill">📖 ${lesson.subject || "Subject"}</span>

        <div class="notes-callout">
          <div class="callout-title">Notes:</div>
          <div class="callout-body">${note}</div>
        </div>

        <div class="actions-row">
          ${lesson.pdfUrl ? `
            <a href="${lesson.pdfUrl}" target="_blank" rel="noopener noreferrer" class="btn-pdf">
              📄 View PDF
            </a>
          ` : ''}

          ${lesson.testEnabled ? `
            <button class="btn-quiz" onclick="openQuizModal('${lesson.id}', '${lesson.subject || "Lesson"}')">
              📝 Take Quiz
            </button>
          ` : `
            <span style="font-size: 11px; color: #94a3b8;">(Quiz not required)</span>
          `}
        </div>
      `;

      container.appendChild(card);
    });
  } catch (err) {
    container.innerHTML = '<div style="font-size: 12px; color: #dc2626;">Failed to load topics.</div>';
  }
}


// ==========================================
// 3. QUIZ MODAL
// ==========================================

window.openQuizModal = async function(lessonId, subject) {
  currentQuizLessonId = lessonId;
  testModal.classList.remove("hidden");
  testBody.classList.remove("hidden");
  testResultView.classList.add("hidden");
  submitTestBtn.classList.remove("hidden");
  closeResultBtn.classList.add("hidden");

  testSubjectBadge.textContent = subject;
  testTitle.textContent = `${subject} Quiz`;
  testSubtitle.textContent = "Select your answers and click submit";
  testQuestionsContainer.innerHTML = '<div class="loader-box">Loading questions...</div>';

  try {
    const res = await fetch(`${API_BASE}?action=getQuestions&lessonId=${encodeURIComponent(lessonId)}`);
    const data = await res.json();
    let questions = data.questions || [];

    if (questions.length === 0) {
      questions = [
        {
          id: `Q_demo_1`,
          lessonId: lessonId,
          question: `What was the primary focus of today's ${subject} topic?`,
          optionA: "Core theoretical principles & applications",
          optionB: "Rote memorization only",
          optionC: "None of the above",
          optionD: "Optional supplementary reading",
          answer: "A",
          explanation: "Theoretical principles and practical applications form the core basis."
        },
        {
          id: `Q_demo_2`,
          lessonId: lessonId,
          question: `How soon should lesson notes be reviewed for best retention?`,
          optionA: "Never",
          optionB: "Within 24 hours of the tutoring session",
          optionC: "Only on the day of the final exam",
          optionD: "Not necessary",
          answer: "B",
          explanation: "Reviewing within 24 hours significantly improves long-term memory."
        }
      ];
    }

    currentQuizQuestions = questions;
    renderQuizQuestions(questions);
  } catch (err) {
    testQuestionsContainer.innerHTML = '<div class="loader-box">Error loading quiz.</div>';
  }
};

function renderQuizQuestions(questions) {
  testSubtitle.textContent = `${questions.length} Questions • Choose the best option`;
  testQuestionsContainer.innerHTML = "";

  questions.forEach((q, idx) => {
    const box = document.createElement("div");
    box.className = "quiz-item";

    box.innerHTML = `
      <div class="quiz-q-title">${idx + 1}. ${q.question}</div>
      <div class="options-col">
        <label class="option-choice">
          <input type="radio" name="quiz_${q.id}" value="A">
          <span><strong>A.</strong> ${q.optionA || "A"}</span>
        </label>
        <label class="option-choice">
          <input type="radio" name="quiz_${q.id}" value="B">
          <span><strong>B.</strong> ${q.optionB || "B"}</span>
        </label>
        <label class="option-choice">
          <input type="radio" name="quiz_${q.id}" value="C">
          <span><strong>C.</strong> ${q.optionC || "C"}</span>
        </label>
        <label class="option-choice">
          <input type="radio" name="quiz_${q.id}" value="D">
          <span><strong>D.</strong> ${q.optionD || "D"}</span>
        </label>
      </div>
    `;

    testQuestionsContainer.appendChild(box);
  });
}

submitTestBtn.addEventListener("click", async () => {
  if (currentQuizQuestions.length === 0) return;

  let score = 0;
  const total = currentQuizQuestions.length;
  const reviewData = [];

  for (const q of currentQuizQuestions) {
    const selected = document.querySelector(`input[name="quiz_${q.id}"]:checked`);
    const studentAnswer = selected ? selected.value : null;
    const isCorrect = studentAnswer === q.answer;

    if (isCorrect) score++;

    reviewData.push({
      question: q.question,
      studentAnswer,
      correctAnswer: q.answer,
      isCorrect,
      explanation: q.explanation || ""
    });
  }

  // Save result
  try {
    await fetch(`${API_BASE}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "submitTestResult",
        studentId: currentUser?.studentId || currentUser?.id || "1001",
        lessonId: currentQuizLessonId,
        score,
        total
      })
    });
  } catch (err) {
    console.warn("Could not save score:", err);
  }

  // Show Result Screen
  testBody.classList.add("hidden");
  testResultView.classList.remove("hidden");
  submitTestBtn.classList.add("hidden");
  closeResultBtn.classList.remove("hidden");

  const pct = Math.round((score / total) * 100);
  scoreDisplay.textContent = `${score} / ${total}`;
  scorePercentage.textContent = `Score: ${pct}%`;

  if (pct >= 80) {
    scoreEmoji.textContent = "🏆";
    scoreTitle.textContent = "Excellent Job!";
  } else if (pct >= 50) {
    scoreEmoji.textContent = "👍";
    scoreTitle.textContent = "Good Effort!";
  } else {
    scoreEmoji.textContent = "📚";
    scoreTitle.textContent = "Review the Notes!";
  }

  testReviewContainer.innerHTML = reviewData.map((item, idx) => `
    <div class="review-card ${item.isCorrect ? 'correct' : 'wrong'}">
      <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px;">
        ${idx + 1}. ${item.question}
      </div>
      <div style="font-size: 12px;">
        Your Answer: <strong style="color: ${item.isCorrect ? '#16a34a' : '#dc2626'};">
          ${item.studentAnswer ? `Option ${item.studentAnswer}` : 'None'}
        </strong> •
        Correct: <strong style="color: #16a34a;">Option ${item.correctAnswer}</strong>
      </div>
      ${item.explanation ? `
        <div class="explanation-text">
          💡 ${item.explanation}
        </div>
      ` : ''}
    </div>
  `).join("");
});

closeTestModalBtn.addEventListener("click", () => testModal.classList.add("hidden"));
closeResultBtn.addEventListener("click", () => testModal.classList.add("hidden"));


// ==========================================
// 4. TUTOR ADMIN PANEL
// ==========================================

function showAdminScreen(user) {
  loginScreen.classList.add("hidden");
  studentPortalScreen.classList.add("hidden");
  adminScreen.classList.remove("hidden");

  if (dayDateInput) {
    dayDateInput.value = new Date().toISOString().split("T")[0];
  }

  loadAdminStudents();
  loadAllAdminData();
}

// Tab Switching
adminTabs.forEach(btn => {
  btn.addEventListener("click", () => {
    adminTabs.forEach(b => b.classList.remove("active"));
    tabContents.forEach(c => c.classList.remove("active"));

    btn.classList.add("active");
    const target = document.getElementById(btn.dataset.tab);
    if (target) target.classList.add("active");

    if (btn.dataset.tab === "resultsTab") loadAdminTestResults();
    if (btn.dataset.tab === "passwordsTab") loadAdminUserCredentials();
  });
});

async function loadAdminStudents() {
  adminStudentList.innerHTML = '<div class="loader-box">Loading students...</div>';

  try {
    const res = await fetch(`${API_BASE}?action=getStudents`);
    const data = await res.json();
    cachedStudents = data.students || [];

    renderAdminStudentCards(cachedStudents);
    populateStudentDropdowns(cachedStudents);
  } catch (err) {
    adminStudentList.innerHTML = '<div class="loader-box">Failed to load students.</div>';
  }
}

function renderAdminStudentCards(students) {
  if (students.length === 0) {
    adminStudentList.innerHTML = '<div class="loader-box">No students registered yet.</div>';
    return;
  }

  adminStudentList.innerHTML = "";

  students.forEach(s => {
    const card = document.createElement("div");
    card.className = "admin-card-unit";

    const subjectsText = Array.isArray(s.subjects) ? s.subjects.join(", ") : s.subjects;
    const imgUrl = s.imageUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80";

    card.innerHTML = `
      <img src="${imgUrl}" alt="${s.name}" class="avatar-1x1" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80'">
      <div style="flex: 1; min-width: 0;">
        <span class="tag-accent">${s.className || "Class"}</span>
        <h4 style="font-size: 15px; font-weight: 700; margin: 2px 0;">${s.name}</h4>
        <p style="font-size: 11px; color: #64748b;">4-Digit ID: <strong>${s.id}</strong></p>
        <p style="font-size: 11px; color: #2563eb; margin-top: 2px;">Subjects: ${subjectsText}</p>
      </div>
    `;

    adminStudentList.appendChild(card);
  });
}

// Student Search Filter
if (adminSearchStudent) {
  adminSearchStudent.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
      renderAdminStudentCards(cachedStudents);
      return;
    }

    const filtered = cachedStudents.filter(s => {
      const name = (s.name || "").toLowerCase();
      const cls = (s.className || "").toLowerCase();
      const id = String(s.id || "").toLowerCase();
      const sub = (Array.isArray(s.subjects) ? s.subjects.join(" ") : String(s.subjects || "")).toLowerCase();
      return name.includes(q) || cls.includes(q) || id.includes(q) || sub.includes(q);
    });

    renderAdminStudentCards(filtered);
  });
}

function populateStudentDropdowns(students) {
  if (!dayStudentSelect) return;
  dayStudentSelect.innerHTML = students
    .map(s => `<option value="${s.id}">${s.name} (ID: ${s.id})</option>`)
    .join("");
}

async function loadAllAdminData() {
  try {
    const studentId = dayStudentSelect?.value || (cachedStudents[0]?.id || "1001");
    const resDays = await fetch(`${API_BASE}?action=getStudyDays&studentId=${encodeURIComponent(studentId)}`);
    const dataDays = await resDays.json();
    cachedStudyDays = dataDays.days || [];

    if (lessonDaySelect) {
      lessonDaySelect.innerHTML = cachedStudyDays
        .map(d => `<option value="${d.id}">${d.day} (${d.date ? d.date.split("T")[0] : ""})</option>`)
        .join("");
    }

    if (cachedStudyDays.length > 0) {
      const firstDayId = cachedStudyDays[0].id;
      const resLessons = await fetch(`${API_BASE}?action=getLessons&studyDayId=${encodeURIComponent(firstDayId)}`);
      const dataLessons = await resLessons.json();
      cachedLessons = dataLessons.lessons || [];

      if (questionLessonSelect) {
        questionLessonSelect.innerHTML = cachedLessons
          .map(l => `<option value="${l.id}">${l.subject} - ${l.shortNote?.slice(0, 30) || "Lesson"}</option>`)
          .join("");
      }
    }
  } catch (err) {
    console.error("Admin data sync error:", err);
  }
}

// Add Study Day Form
if (addStudyDayForm) {
  addStudyDayForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    studyDayMsg.textContent = "Saving...";
    studyDayMsg.style.color = "#2563eb";

    const payload = {
      action: "addStudyDay",
      studentId: dayStudentSelect.value,
      day: dayLabelInput.value.trim(),
      date: dayDateInput.value
    };

    try {
      const res = await fetch(`${API_BASE}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        studyDayMsg.textContent = "✅ Study Day added!";
        studyDayMsg.style.color = "#16a34a";
        loadAllAdminData();
      }
    } catch {
      studyDayMsg.textContent = "Failed to add study day.";
      studyDayMsg.style.color = "#dc2626";
    }
  });
}

// Add Lesson Form
if (addLessonForm) {
  addLessonForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    lessonMsg.textContent = "Saving...";
    lessonMsg.style.color = "#2563eb";

    const payload = {
      action: "addLesson",
      studyDayId: lessonDaySelect.value,
      subject: lessonSubjectInput.value.trim(),
      shortNote: lessonNoteInput.value.trim(),
      pdfUrl: lessonPdfInput.value.trim(),
      testEnabled: lessonTestEnabled.checked
    };

    try {
      const res = await fetch(`${API_BASE}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        lessonMsg.textContent = "✅ Lesson saved!";
        lessonMsg.style.color = "#16a34a";
        lessonNoteInput.value = "";
        loadAllAdminData();
      }
    } catch {
      lessonMsg.textContent = "Failed to save lesson.";
      lessonMsg.style.color = "#dc2626";
    }
  });
}

// Add Question Form
if (addQuestionForm) {
  addQuestionForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    questionMsg.textContent = "Saving question...";
    questionMsg.style.color = "#2563eb";

    const payload = {
      action: "addQuestion",
      lessonId: questionLessonSelect.value,
      question: questionTextInput.value.trim(),
      optionA: optAInput.value.trim(),
      optionB: optBInput.value.trim(),
      optionC: optCInput.value.trim(),
      optionD: optDInput.value.trim(),
      answer: correctAnswerSelect.value,
      explanation: explanationInput.value.trim()
    };

    try {
      const res = await fetch(`${API_BASE}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        questionMsg.textContent = "✅ Question added!";
        questionMsg.style.color = "#16a34a";
        questionTextInput.value = "";
        optAInput.value = "";
        optBInput.value = "";
        optCInput.value = "";
        optDInput.value = "";
        explanationInput.value = "";
      }
    } catch {
      questionMsg.textContent = "Failed to add question.";
      questionMsg.style.color = "#dc2626";
    }
  });
}

// Add Student Modal & 4-Digit ID Generation
if (openAddStudentModalBtn) {
  openAddStudentModalBtn.addEventListener("click", () => {
    addStudentModal.classList.remove("hidden");
    addStudentMsg.textContent = "";
  });
}

if (closeAddStudentModalBtn) {
  closeAddStudentModalBtn.addEventListener("click", () => {
    addStudentModal.classList.add("hidden");
  });
}

if (addStudentForm) {
  addStudentForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    addStudentMsg.textContent = "Assigning 4-digit ID and registering...";
    addStudentMsg.style.color = "#2563eb";

    const payload = {
      action: "addStudent",
      name: document.getElementById("newStudentName").value.trim(),
      className: document.getElementById("newStudentClass").value.trim(),
      subjects: document.getElementById("newStudentSubjects").value.trim(),
      imageUrl: document.getElementById("newStudentImageUrl").value.trim(),
      pin: document.getElementById("newStudentPin").value.trim() || "1234"
    };

    try {
      const res = await fetch(`${API_BASE}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        addStudentMsg.textContent = `✅ Assigned 4-Digit ID: ${data.id}! Credential stored in Users.`;
        addStudentMsg.style.color = "#16a34a";
        setTimeout(() => {
          addStudentModal.classList.add("hidden");
          loadAdminStudents();
        }, 1200);
      }
    } catch {
      addStudentMsg.textContent = "Failed to add student.";
      addStudentMsg.style.color = "#dc2626";
    }
  });
}

// View Test Results
async function loadAdminTestResults() {
  testResultsList.innerHTML = '<div class="loader-box">Loading scores...</div>';

  try {
    const res = await fetch(`${API_BASE}?action=getTestResults`);
    const data = await res.json();
    const results = data.results || [];

    if (results.length === 0) {
      testResultsList.innerHTML = '<div class="loader-box">No test submissions yet.</div>';
      return;
    }

    testResultsList.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Lesson</th>
            <th>Score</th>
            <th>Percentage</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${results.map(r => `
            <tr>
              <td><strong>${r.studentId}</strong></td>
              <td>${r.lessonId || "Quiz"}</td>
              <td><strong style="color: #16a34a;">${r.score} / ${r.total}</strong></td>
              <td>${r.percentage}%</td>
              <td>${new Date(r.date).toLocaleDateString()}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  } catch {
    testResultsList.innerHTML = '<div class="loader-box">Failed to load results.</div>';
  }
}

// View Student Passwords & Logins (Users sheet)
async function loadAdminUserCredentials() {
  usersCredentialsList.innerHTML = '<div class="loader-box">Loading credentials...</div>';

  try {
    const res = await fetch(`${API_BASE}?action=getUsers`);
    const data = await res.json();
    const users = data.users || [];

    if (users.length === 0) {
      usersCredentialsList.innerHTML = '<div class="loader-box">No users recorded.</div>';
      return;
    }

    usersCredentialsList.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>User / Student ID</th>
            <th>Name</th>
            <th>PIN / Password</th>
            <th>Role</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(u => `
            <tr>
              <td><strong>${u.id}</strong></td>
              <td>${u.name}</td>
              <td><code style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-weight:700;">${u.pin || "••••"}</code></td>
              <td><span class="tag-accent">${u.role}</span></td>
              <td><span style="color:#16a34a; font-weight:700;">Active</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  } catch {
    usersCredentialsList.innerHTML = '<div class="loader-box">Failed to load credentials.</div>';
  }
}


// ==========================================
// 5. LOGOUT & SESSION
// ==========================================

function handleLogout() {
  localStorage.removeItem("tutorUser");
  currentUser = null;

  studentPortalScreen.classList.add("hidden");
  adminScreen.classList.add("hidden");
  loginScreen.classList.remove("hidden");

  usernameInput.value = "";
  passwordInput.value = "";
  loginMessage.textContent = "";

  setMode("student");
}

studentLogoutBtn.addEventListener("click", handleLogout);
adminLogoutBtn.addEventListener("click", handleLogout);

function checkSavedSession() {
  const saved = localStorage.getItem("tutorUser");
  if (!saved) return;

  try {
    const user = JSON.parse(saved);
    if (user && user.id) {
      currentUser = user;
      if (user.role === "admin") {
        showAdminScreen(user);
      } else {
        showStudentPortal(user);
      }
    }
  } catch {
    localStorage.removeItem("tutorUser");
  }
}

setMode("student");
checkSavedSession();
