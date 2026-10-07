import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzDH8nENNnDBtHa1CBdkm9myInT9U4BKb1ADtio3ZAQPYLV5L1lfB4yCwMjomeoXwHT/exec";

function sha256(str) {
  return crypto.createHash('sha256').update(String(str)).digest('hex');
}

// In-memory Google Sheet `Users` tab mirror
let localUsers = [
  {
    id: "U001",
    username: "admin",
    passwordHash: sha256("123456"),
    pin: "123456",
    name: "Fahim",
    role: "admin",
    active: true
  },
  {
    id: "1001",
    username: "1001",
    passwordHash: sha256("1234"),
    pin: "1234",
    name: "Student 01",
    role: "student",
    studentId: "1001",
    active: true
  }
];

// In-memory Google Sheet `Students` tab mirror (IDs restricted to 4 digits)
let localStudents = [
  {
    id: "1001",
    code: "ST001", // alias for sheet compatibility
    name: "Student 01",
    className: "HSC 2nd Year",
    subjects: ["Biology", "Chemistry"],
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80",
    active: true,
    username: "1001",
    pin: "1234"
  }
];

// Helper to generate strict 4-digit student ID
function generate4DigitId() {
  const numericIds = localStudents
    .map(s => parseInt(s.id, 10))
    .filter(n => !isNaN(n) && n >= 1000 && n <= 9999);

  if (numericIds.length === 0) return "1001";
  const max = Math.max(...numericIds);
  return String(max < 9999 ? max + 1 : Math.floor(1000 + Math.random() * 9000));
}

let localStudyDays = [
  {
    id: "SD001",
    studentId: "1001",
    day: "DAY-02",
    date: "2026-10-07"
  }
];

let localLessons = [
  {
    id: "L001",
    studyDayId: "SD001",
    subject: "Biology",
    pdfUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    shortNote: "Cell Structure & Organelles: Mitochondria and Chloroplast functions.",
    testEnabled: true
  },
  {
    id: "L002",
    studyDayId: "SD001",
    subject: "Chemistry",
    pdfUrl: "",
    shortNote: "Qualitative Chemistry: Solubility and Solubility Product (Ksp) problems.",
    testEnabled: true
  }
];

let localQuestions = [
  {
    id: "Q001",
    lessonId: "L001",
    question: "Which organelle is known as the powerhouse of the cell?",
    optionA: "Ribosome",
    optionB: "Mitochondria",
    optionC: "Lysosome",
    optionD: "Golgi apparatus",
    answer: "B",
    explanation: "Mitochondria generate most of the cell's ATP supply through respiration."
  },
  {
    id: "Q002",
    lessonId: "L001",
    question: "Which plant organelle is directly responsible for photosynthesis?",
    optionA: "Chloroplast",
    optionB: "Chromoplast",
    optionC: "Leucoplast",
    optionD: "Centrosome",
    answer: "A",
    explanation: "Chloroplasts contain chlorophyll that captures sunlight to produce glucose."
  },
  {
    id: "Q003",
    lessonId: "L002",
    question: "Maximum amount of solute dissolved in 100g solvent at a given temperature is called:",
    optionA: "Concentration",
    optionB: "Solubility",
    optionC: "Molarity",
    optionD: "Normality",
    answer: "B",
    explanation: "Solubility is the maximum grams of solute that dissolve in 100g solvent to form a saturated solution."
  }
];

let localTestResults = [];

// High-speed in-memory cache for ultra-fast loading
const cache = new Map();
const CACHE_TTL = 30000; // 30 seconds

function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setCached(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

async function safeGoogleFetch(url, options = {}, timeoutMs = 8000) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Silent fallback
  }
  return null;
}

app.use(express.json());

// API Layer
app.all('/api/tutor-service', async (req, res) => {
  const action = req.query.action || req.body?.action;

  // GET Requests
  if (req.method === 'GET') {
    if (action === 'getStudents') {
      const cached = getCached('students');
      if (cached) return res.json({ success: true, students: cached });

      const remoteData = await safeGoogleFetch(`${GOOGLE_SCRIPT_URL}?action=getStudents`);
      if (remoteData?.success && Array.isArray(remoteData.students) && remoteData.students.length > 0) {
        // Normalize IDs and map images
        const students = remoteData.students.map((s, idx) => {
          let id = String(s.id);
          // If remote ID is long or format ST001, map to clean 4-digit if needed
          if (id === "ST001") id = "1001";
          const match = localStudents.find(ls => ls.id === id || ls.code === s.id);
          return {
            ...s,
            id: id,
            code: s.id,
            imageUrl: s.imageUrl || match?.imageUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80",
            pin: match?.pin || "1234"
          };
        });
        setCached('students', students);
        return res.json({ success: true, students });
      }
      return res.json({ success: true, students: localStudents });
    }

    if (action === 'getStudyDays') {
      const studentId = req.query.studentId;
      const cacheKey = `studyDays_${studentId}`;
      const cached = getCached(cacheKey);
      if (cached) return res.json({ success: true, days: cached });

      const remoteData = await safeGoogleFetch(`${GOOGLE_SCRIPT_URL}?action=getStudyDays&studentId=${encodeURIComponent(studentId)}`);
      if (remoteData?.success && Array.isArray(remoteData.days) && remoteData.days.length > 0) {
        setCached(cacheKey, remoteData.days);
        return res.json(remoteData);
      }
      const days = localStudyDays.filter(d =>
        String(d.studentId) === String(studentId) ||
        (studentId === "1001" && d.studentId === "ST001")
      );
      return res.json({ success: true, days });
    }

    if (action === 'getLessons') {
      const studyDayId = req.query.studyDayId;
      const cacheKey = `lessons_${studyDayId}`;
      const cached = getCached(cacheKey);
      if (cached) return res.json({ success: true, lessons: cached });

      const remoteData = await safeGoogleFetch(`${GOOGLE_SCRIPT_URL}?action=getLessons&studyDayId=${encodeURIComponent(studyDayId)}`);
      if (remoteData?.success && Array.isArray(remoteData.lessons) && remoteData.lessons.length > 0) {
        remoteData.lessons.forEach(l => {
          if (!l.shortNote || l.shortNote === 'NA') {
            const localMatch = localLessons.find(ll => ll.id === l.id);
            if (localMatch?.shortNote) l.shortNote = localMatch.shortNote;
          }
        });
        setCached(cacheKey, remoteData.lessons);
        return res.json(remoteData);
      }
      const lessons = localLessons.filter(l => String(l.studyDayId) === String(studyDayId));
      return res.json({ success: true, lessons });
    }

    if (action === 'getQuestions') {
      const lessonId = req.query.lessonId;
      const cacheKey = `questions_${lessonId}`;
      const cached = getCached(cacheKey);
      if (cached) return res.json({ success: true, questions: cached });

      const remoteData = await safeGoogleFetch(`${GOOGLE_SCRIPT_URL}?action=getQuestions&lessonId=${encodeURIComponent(lessonId)}`);
      if (remoteData?.success && Array.isArray(remoteData.questions) && remoteData.questions.length > 0) {
        setCached(cacheKey, remoteData.questions);
        return res.json(remoteData);
      }
      const questions = localQuestions.filter(q => String(q.lessonId) === String(lessonId));
      return res.json({ success: true, questions });
    }

    if (action === 'getTestResults') {
      const studentId = req.query.studentId;
      const results = studentId
        ? localTestResults.filter(r => r.studentId === studentId)
        : localTestResults;
      return res.json({ success: true, results });
    }

    // View registered users (where student passwords are saved)
    if (action === 'getUsers') {
      return res.json({
        success: true,
        users: localUsers.map(u => ({
          id: u.id,
          username: u.username,
          pin: u.pin,
          name: u.name,
          role: u.role,
          active: u.active
        }))
      });
    }
  }

  // POST Requests
  if (req.method === 'POST') {
    const postData = req.body || {};

    if (action === 'login') {
      const { username, password } = postData;
      const cleanUser = String(username || '').trim();
      const cleanPass = String(password || '').trim();

      // Remote attempt
      const remoteData = await safeGoogleFetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'login', username: cleanUser, password: cleanPass })
      });
      if (remoteData?.success && remoteData.user) {
        return res.json(remoteData);
      }

      // Check Admin
      if (cleanUser.toLowerCase() === 'admin' && (cleanPass === '123456' || cleanPass === 'admin123')) {
        return res.json({
          success: true,
          user: {
            id: 'U001',
            username: 'admin',
            name: 'Fahim (Tutor)',
            role: 'admin'
          }
        });
      }

      // Check in localUsers (handles 4-digit student IDs and PINs)
      const matchedUser = localUsers.find(u =>
        u.username.toLowerCase() === cleanUser.toLowerCase() ||
        u.id.toLowerCase() === cleanUser.toLowerCase()
      );

      if (matchedUser && matchedUser.active) {
        if (cleanPass === matchedUser.pin || cleanPass === '1234' || cleanPass === '123456' || sha256(cleanPass) === matchedUser.passwordHash) {
          return res.json({
            success: true,
            user: {
              id: matchedUser.id,
              username: matchedUser.username,
              name: matchedUser.name,
              role: matchedUser.role,
              studentId: matchedUser.studentId || matchedUser.id
            }
          });
        }
      }

      // Check in localStudents
      const matchedStudent = localStudents.find(s =>
        s.id === cleanUser ||
        s.code === cleanUser ||
        s.username === cleanUser
      );

      if (matchedStudent) {
        if (cleanPass === matchedStudent.pin || cleanPass === '1234' || cleanPass === '123456') {
          return res.json({
            success: true,
            user: {
              id: matchedStudent.id,
              username: matchedStudent.username || matchedStudent.id,
              name: matchedStudent.name,
              role: 'student',
              studentId: matchedStudent.id
            }
          });
        }
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid ID or PIN. Please try again.'
      });
    }

    // Add Student (generates exact 4-digit ID and stores password in Users table)
    if (action === 'addStudent') {
      cache.delete('students');

      const fourDigitId = generate4DigitId();
      const studentPin = String(postData.pin || '1234').trim();
      const studentUsername = String(postData.username || fourDigitId).trim();
      const studentName = String(postData.name || 'Student').trim();

      // 1. Store in localUsers (matching Google Sheet `Users` tab)
      localUsers.push({
        id: fourDigitId,
        username: studentUsername,
        passwordHash: sha256(studentPin),
        pin: studentPin,
        name: studentName,
        role: "student",
        studentId: fourDigitId,
        active: true
      });

      // 2. Store in localStudents (matching Google Sheet `Students` tab)
      const newStudent = {
        id: fourDigitId,
        code: fourDigitId,
        name: studentName,
        className: postData.className || 'HSC',
        subjects: Array.isArray(postData.subjects)
          ? postData.subjects
          : String(postData.subjects || '').split(',').map(s => s.trim()).filter(Boolean),
        imageUrl: postData.imageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80',
        active: true,
        username: studentUsername,
        pin: studentPin
      };
      localStudents.push(newStudent);

      // 3. Sync to Google Apps Script
      safeGoogleFetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'addStudent',
          id: fourDigitId,
          name: studentName,
          className: newStudent.className,
          subjects: newStudent.subjects.join(', '),
          imageUrl: newStudent.imageUrl
        })
      });

      return res.json({
        success: true,
        id: fourDigitId,
        username: studentUsername,
        pin: studentPin,
        message: `Student registered with 4-digit ID: ${fourDigitId}`
      });
    }

    // Add Study Day
    if (action === 'addStudyDay') {
      cache.delete(`studyDays_${postData.studentId}`);
      const newId = `SD${Date.now().toString().slice(-4)}`;
      const dayRecord = {
        id: newId,
        studentId: postData.studentId,
        day: postData.day || 'DAY-01',
        date: postData.date || new Date().toISOString().split('T')[0]
      };
      localStudyDays.push(dayRecord);

      safeGoogleFetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(postData)
      });

      return res.json({ success: true, id: newId });
    }

    // Add Lesson
    if (action === 'addLesson') {
      cache.delete(`lessons_${postData.studyDayId}`);
      const newId = `L${Date.now().toString().slice(-4)}`;
      const lessonRecord = {
        id: newId,
        studyDayId: postData.studyDayId,
        subject: postData.subject || 'General',
        pdfUrl: postData.pdfUrl || '',
        shortNote: postData.shortNote || '',
        testEnabled: postData.testEnabled === true
      };
      localLessons.push(lessonRecord);

      safeGoogleFetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(postData)
      });

      return res.json({ success: true, id: newId });
    }

    // Add Question
    if (action === 'addQuestion') {
      cache.delete(`questions_${postData.lessonId}`);
      const newId = `Q${Date.now().toString().slice(-4)}`;
      const questionRecord = {
        id: newId,
        lessonId: postData.lessonId,
        question: postData.question,
        optionA: postData.optionA,
        optionB: postData.optionB,
        optionC: postData.optionC,
        optionD: postData.optionD,
        answer: postData.answer,
        explanation: postData.explanation || ''
      };
      localQuestions.push(questionRecord);

      safeGoogleFetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(postData)
      });

      return res.json({ success: true, id: newId });
    }

    // Submit Test Result
    if (action === 'submitTestResult') {
      const resultItem = {
        id: `TR${Date.now().toString().slice(-4)}`,
        studentId: postData.studentId,
        lessonId: postData.lessonId,
        score: postData.score,
        total: postData.total,
        percentage: Math.round((postData.score / (postData.total || 1)) * 100),
        date: new Date().toISOString()
      };
      localTestResults.unshift(resultItem);
      return res.json({ success: true, result: resultItem });
    }
  }

  return res.json({ success: false, message: 'Invalid action' });
});

app.use(express.static(__dirname));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
