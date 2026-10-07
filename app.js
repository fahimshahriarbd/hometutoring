// ========================================
// GOOGLE APPS SCRIPT API
// ========================================

const API_URL =
  "https://script.google.com/macros/s/AKfycbzDH8nENNnDBtHa1CBdkm9myInT9U4BKb1ADtio3ZAQPYLV5L1lfB4yCwMjomeoXwHT/exec";


// ========================================
// ELEMENTS
// ========================================

const loginScreen =
  document.getElementById("loginScreen");

const studentScreen =
  document.getElementById("studentScreen");

const loginForm =
  document.getElementById("loginForm");

const usernameInput =
  document.getElementById("username");

const passwordInput =
  document.getElementById("password");

const loginButton =
  document.getElementById("loginButton");

const loginMessage =
  document.getElementById("loginMessage");

const logoutButton =
  document.getElementById("logoutButton");

const studentList =
  document.getElementById("studentList");

const welcomeText =
  document.getElementById("welcomeText");


// ========================================
// LOGIN
// ========================================

loginForm.addEventListener("submit", async function(event) {

  event.preventDefault();


  const username =
    usernameInput.value.trim();

  const password =
    passwordInput.value;


  if (!username || !password) {

    loginMessage.textContent =
      "Please enter username and password.";

    return;
  }


  loginButton.disabled = true;

  loginButton.textContent =
    "Logging in...";

  loginMessage.textContent = "";


  try {

    const response =
      await fetch(API_URL, {

        method: "POST",

        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },

        body: JSON.stringify({

          action: "login",

          username: username,

          password: password

        })

      });


    const data =
      await response.json();


    if (data.success) {

      localStorage.setItem(
        "tutorUser",
        JSON.stringify(data.user)
      );


      showStudentScreen(
        data.user
      );

    } else {

      loginMessage.textContent =
        data.message ||
        "Login failed.";

    }


  } catch (error) {

    console.error(error);

    loginMessage.textContent =
      "Unable to connect to server.";

  }


  loginButton.disabled = false;

  loginButton.textContent =
    "Login";

});


// ========================================
// SHOW STUDENT SCREEN
// ========================================

function showStudentScreen(user) {

  loginScreen.classList.add("hidden");

  studentScreen.classList.remove("hidden");


  welcomeText.textContent =
    "Welcome, " + user.name;


  loadStudents();

}


// ========================================
// LOAD STUDENTS
// ========================================

async function loadStudents() {

  studentList.innerHTML =
    '<div class="loading">Loading students...</div>';


  try {

    const response =
      await fetch(
        API_URL + "?action=getStudents"
      );


    const data =
      await response.json();


    if (!data.success) {

      studentList.innerHTML =
        '<div class="loading">Unable to load students.</div>';

      return;
    }


    if (!data.students ||
        data.students.length === 0) {

      studentList.innerHTML =
        '<div class="loading">No students found.</div>';

      return;
    }


    studentList.innerHTML = "";


    data.students.forEach(function(student) {

      const card =
        document.createElement("div");


      card.className =
        "student-card";


      const info =
        document.createElement("div");


      info.className =
        "student-info";


      const name =
        document.createElement("h3");


      name.textContent =
        student.name;


      const className =
        document.createElement("p");


      className.textContent =
        student.className;


      const subjects =
        document.createElement("div");


      subjects.className =
        "subjects";


      student.subjects.forEach(function(subject) {

        const button =
          document.createElement("span");


        button.className =
          "subject";


        button.textContent =
          subject;


        subjects.appendChild(button);

      });


      info.appendChild(name);

      info.appendChild(className);

      info.appendChild(subjects);


      let image;


      if (student.imageUrl) {

        image =
          document.createElement("img");

        image.src =
          student.imageUrl;

        image.alt =
          student.name;

        image.className =
          "student-image";

      } else {

        image =
          document.createElement("div");

        image.className =
          "student-image";

        image.style.display =
          "flex";

        image.style.alignItems =
          "center";

        image.style.justifyContent =
          "center";

        image.style.background =
          "#eef4ff";

        image.textContent =
          "👤";

        image.style.fontSize =
          "35px";

      }


      card.appendChild(info);

      card.appendChild(image);


      studentList.appendChild(card);

    });


  } catch (error) {

    console.error(error);

    studentList.innerHTML =
      '<div class="loading">Connection error.</div>';

  }

}


// ========================================
// LOGOUT
// ========================================

logoutButton.addEventListener(
  "click",
  function() {

    localStorage.removeItem(
      "tutorUser"
    );


    studentScreen.classList.add(
      "hidden"
    );


    loginScreen.classList.remove(
      "hidden"
    );


    usernameInput.value = "";

    passwordInput.value = "";

    loginMessage.textContent = "";

  }
);


// ========================================
// CHECK EXISTING LOGIN
// ========================================

function checkLogin() {

  const savedUser =
    localStorage.getItem("tutorUser");


  if (!savedUser) {

    return;

  }


  try {

    const user =
      JSON.parse(savedUser);


    if (user && user.id) {

      showStudentScreen(user);

    }

  } catch (error) {

    localStorage.removeItem(
      "tutorUser"
    );

  }

}


// ========================================
// START APP
// ========================================

checkLogin();
