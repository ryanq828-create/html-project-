"use strict";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const LEVELS = {
  "College": ["BSIT", "BSIS", "BSN", "BSEE", "BSED", "BSCE"],
  "Senior High School": ["HUMSS", "STEM", "GA", "ITE"],
  "Junior High School": ["Grade 7", "Grade 8", "Grade 9", "Grade 10"]
};

const DB_KEY = "ssuStudentHub_local_v1";
const SESSION_KEY = "ssuStudentHub_session_local_v1";

let db = loadDB();
let user = null;
let isAdmin = false;
let activePage = "dashboard";
let toastTimer;

function loadDB() {
  try {
    const saved = JSON.parse(localStorage.getItem(DB_KEY));
    if (saved && saved.users) return saved;
  } catch (error) {
    console.warn("Could not load saved data.", error);
  }

  const initialDB = {
    users: [
      {
        id: 1,
        name: "Demo Student",
        email: "student@ssu.edu.ph",
        password: "Student123!",
        age: 18,
        educationLevel: "College",
        program: "BSIT",
        section: "BSIT 1A",
        bio: "Welcome to SSU Student Hub.",
        createdAt: new Date().toISOString(),
        role: "student"
      },
      {
        id: 2,
        name: "SSU Administrator",
        email: "admin@ssu.edu.ph",
        password: "ChangeMe123!",
        age: 25,
        educationLevel: "College",
        program: "BSIT",
        section: "ADMIN",
        bio: "Administrator account",
        createdAt: new Date().toISOString(),
        role: "admin"
      }
    ],
    announcements: [
      {
        id: 1,
        title: "Welcome to SSU Student Hub",
        body: "Check this page regularly for school updates, reminders, and learning materials.",
        author: "SSU Administration",
        createdAt: new Date().toISOString()
      }
    ],
    schedule: [
      {
        id: 1,
        subject: "Computer programming",
        day: "Monday",
        startTime: "08:00",
        endTime: "09:30",
        room: "Room 201",
        teacher: "Faculty"
      },
      {
        id: 2,
        subject: "Introduction to Programming",
        day: "Tuesday",
        startTime: "10:00",
        endTime: "11:30",
        room: "Room 203",
        teacher: "Faculty"
      }
    ],
    resources: [
      {
        id: 1,
        title: "MDN Web Docs",
        description: "Reference materials for HTML, CSS, and JavaScript.",
        url: "https://developer.mozilla.org/",
        category: "Technology"
      },
      {
        id: 2,
        title: "Khan Academy",
        description: "Free lessons and practice across many subjects.",
        url: "https://www.khanacademy.org/",
        category: "General"
      }
    ]
  };

  localStorage.setItem(DB_KEY, JSON.stringify(initialDB));
  return initialDB;
}

function saveDB() {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function toast(message, error = false) {
  const element = $("#toast");
  element.textContent = message;
  element.className = "toast show" + (error ? " error" : "");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    element.className = "toast";
  }, 3600);
}

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[character]));
}

function initials(name = "Student") {
  return name.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0] || "")
    .join("")
    .toUpperCase();
}

function niceDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function showAuth(tab = "login") {
  $("#authView").classList.remove("hidden");
  $("#appView").classList.add("hidden");
  switchAuth(tab);
}

function switchAuth(tab) {
  $$(".tab").forEach(button => {
    button.classList.toggle("active", button.dataset.auth === tab);
  });

  $("#loginForm").classList.toggle("hidden", tab !== "login");
  $("#registerForm").classList.toggle("hidden", tab !== "register");
}

function setPrograms(level, selected = "") {
  const select = $("#program");
  select.innerHTML = '<option value="">Select course / strand / grade</option>';

  const programs = level
    ? LEVELS[level] || []
    : [...new Set(Object.values(LEVELS).flat())];

  programs.forEach(program => {
    const option = document.createElement("option");
    option.value = program;
    option.textContent = program;
    select.appendChild(option);
  });

  select.value = programs.includes(selected) ? selected : "";
}

function showApp() {
  const currentUser = db.users.find(item => item.id === user.id);

  if (!currentUser) {
    user = null;
    localStorage.removeItem(SESSION_KEY);
    showAuth();
    return;
  }

  user = currentUser;
  isAdmin = user.role === "admin";

  $("#authView").classList.add("hidden");
  $("#appView").classList.remove("hidden");
  $("#topName").textContent = user.name;
  $("#topProgram").textContent = `${user.program} · ${user.educationLevel}`;
  $("#topAvatar").textContent = initials(user.name);
  $("#adminNav").classList.toggle("hidden", !isAdmin);

  $("#todayDate").textContent = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  });

  goTo("dashboard");
}

function register(form) {
  const values = Object.fromEntries(new FormData(form).entries());

  values.name = values.name.trim();
  values.email = values.email.trim().toLowerCase();
  values.age = Number(values.age);

  if (values.age < 12) {
    return toast("You must be at least 12 years old to create an account.", true);
  }

  if (values.password.length < 8) {
    return toast("Password must be at least 8 characters.", true);
  }

  if (db.users.some(item => item.email === values.email)) {
    return toast("That email already has an account. Please log in.", true);
  }

  if (!LEVELS[values.educationLevel]?.includes(values.program)) {
    return toast("Choose a valid education level and course, strand, or grade.", true);
  }

  user = {
    id: Date.now(),
    name: values.name,
    email: values.email,
    password: values.password,
    age: values.age,
    educationLevel: values.educationLevel,
    program: values.program,
    section: (values.section || "").trim(),
    bio: "",
    createdAt: new Date().toISOString(),
    role: "student"
  };

  db.users.push(user);
  saveDB();
  localStorage.setItem(SESSION_KEY, String(user.id));

  form.reset();
  setPrograms("");
  showApp();
  toast("Your account has been created. Welcome!");
}

$("#educationLevel").addEventListener("change", event => {
  const level = event.target.value;
  const selectedProgram = LEVELS[level]?.includes($("#program").value)
    ? $("#program").value
    : "";
  setPrograms(level, selectedProgram);
});

$$(".tab").forEach(button => {
  button.addEventListener("click", () => switchAuth(button.dataset.auth));
});

$("#registerForm").addEventListener("submit", event => {
  event.preventDefault();
  register(event.currentTarget);
});

$("#loginForm").addEventListener("submit", event => {
  event.preventDefault();

  const values = Object.fromEntries(new FormData(event.currentTarget).entries());
  const email = values.email.trim().toLowerCase();

  const found = db.users.find(item =>
    item.email === email && item.password === values.password
  );

  if (!found) {
    return toast("Incorrect email or password.", true);
  }

  user = found;
  localStorage.setItem(SESSION_KEY, String(user.id));
  showApp();
  toast(`Welcome back, ${user.name.split(" ")[0]}!`);
});

document.addEventListener("click", event => {
  const toggle = event.target.closest("[data-password-toggle]");
  if (!toggle) return;

  const input = document.getElementById(toggle.dataset.passwordToggle);
  if (!input) return;

  const shouldShow = input.type === "password";
  input.type = shouldShow ? "text" : "password";
  toggle.setAttribute("aria-label", shouldShow ? "Hide password" : "Show password");

  const eyeSvg = shouldShow ? `
    <svg class="eye-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ` : `
    <svg class="eye-icon eye-hidden" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      <path d="M3 3l18 18" />
    </svg>
  `;

  toggle.innerHTML = eyeSvg;
});

function logoutUser() {
  user = null;
  isAdmin = false;
  localStorage.removeItem(SESSION_KEY);
  showAuth();
  toast("You have logged out.");
}

$("#logoutBtn").addEventListener("click", logoutUser);

$("#mainNav").addEventListener("click", event => {
  const button = event.target.closest("[data-page]");
  if (button) goTo(button.dataset.page);
});

document.addEventListener("click", event => {
  const button = event.target.closest(".side-brand[data-page]");
  if (button) {
    event.preventDefault();
    goTo(button.dataset.page);
  }

  const pageButton = event.target.closest("button[data-page]");
  if (pageButton && !pageButton.closest("#mainNav")) {
    goTo(pageButton.dataset.page);
  }
});

function goTo(page) {
  if (page === "admin" && !isAdmin) {
    return toast("Administrator access required.", true);
  }

  activePage = page;

  $$(".nav-item").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  const titles = {
    dashboard: ["STUDENT WORKSPACE", "Dashboard"],
    profile: ["YOUR INFORMATION", "My profile"],
    schedule: ["PLAN YOUR WEEK", "Class schedule"],
    announcements: ["CAMPUS UPDATES", "Announcements"],
    resources: ["STUDY SMARTER", "Learning resources"],
    settings: ["ACCOUNT PREFERENCES", "Settings"],
    admin: ["PORTAL MANAGEMENT", "Admin panel"]
  };

  $("#pageEyebrow").textContent = titles[page][0];
  $("#pageTitle").textContent = titles[page][1];
  renderPage(page);
}

function announcementRows(items) {
  if (!items.length) {
    return '<div class="empty-state"><b>No announcements yet</b>School updates will appear here.</div>';
  }

  return items.map(item => `
    <article class="announcement-row">
      <h4>${esc(item.title)}</h4>
      <p>${esc(item.body)}</p>
      <div class="meta">
        <span>${esc(item.author || "CKC Administration")}</span>
        <span>·</span>
        <span>${niceDate(item.createdAt)}</span>
      </div>
    </article>
  `).join("");
}

function scheduleRows(items) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  items = [...items].sort((a, b) =>
    days.indexOf(a.day) - days.indexOf(b.day) ||
    a.startTime.localeCompare(b.startTime)
  );

  if (!items.length) {
    return '<div class="empty-state"><b>No schedule added</b>Your class schedule will appear here.</div>';
  }

  return items.map(item => `
    <div class="schedule-row">
      <div class="time-block">
        ${esc(item.day.slice(0, 3))}<br>
        ${esc(item.startTime)}–${esc(item.endTime)}
      </div>
      <div>
        <b>${esc(item.subject)}</b>
        <small>${esc(item.teacher || "Instructor not listed")}</small>
      </div>
      <span class="room-tag">${esc(item.room || "TBA")}</span>
    </div>
  `).join("");
}

function resourceRows(items) {
  if (!items.length) {
    return '<div class="empty-state"><b>No resources yet</b>Learning links will appear here.</div>';
  }

  return items.map(item => `
    <div class="resource-mini">
      <div class="resource-icon">↗</div>
      <div>
        <b>${esc(item.title)}</b>
        <p>${esc(item.description)}</p>
      </div>
    </div>
  `).join("");
}

function renderPage(page) {
  const content = $("#pageContent");

  if (page === "dashboard") {
    content.innerHTML = `
      <section class="welcome-banner">
        <div>
          <p class="eyebrow">YOUR STUDENT SPACE</p>
          <h2>Good to see you, ${esc(user.name.split(" ")[0])} 👋</h2>
          <p>Stay on top of your classes, campus news, and learning goals.</p>
        </div>
        <div class="banner-badge">✦ &nbsp; ${esc(user.program)}</div>
      </section>

      <div class="stats-grid">
        <article class="stat-card">
          <div class="stat-icon">◉</div>
          <div><small>Education level</small><b style="font-size:17px">${esc(user.educationLevel)}</b></div>
        </article>
        <article class="stat-card">
          <div class="stat-icon">▤</div>
          <div><small>Class schedule items</small><b>${db.schedule.length}</b></div>
        </article>
        <article class="stat-card">
          <div class="stat-icon">▧</div>
          <div><small>Learning resources</small><b>${db.resources.length}</b></div>
        </article>
      </div>

      <div class="dashboard-grid">
        <div>
          <section class="panel">
            <div class="panel-head">
              <h3>Latest announcements</h3>
              <button class="text-btn" data-page="announcements">View all →</button>
            </div>
            ${announcementRows([...db.announcements].reverse().slice(0, 5))}
          </section>

          <div class="section-heading">
            <h3>Learning resources</h3>
            <button class="text-btn" data-page="resources">Browse resources →</button>
          </div>
          <section class="panel">${resourceRows(db.resources.slice(0, 4))}</section>
        </div>

        <div>
          <section class="panel">
            <div class="panel-head">
              <h3>Your schedule</h3>
              <button class="text-btn" data-page="schedule">Full schedule →</button>
            </div>
            ${scheduleRows(db.schedule.slice(0, 6))}
          </section>

          <div class="section-heading">
            <h3>Student profile</h3>
            <button class="text-btn" data-page="profile">View profile →</button>
          </div>
          <section class="panel">
            <div class="profile-header" style="border:0;margin:0;padding:0">
              <div class="profile-avatar">${initials(user.name)}</div>
              <div><h2 style="font-size:15px">${esc(user.name)}</h2><p>${esc(user.email)}</p></div>
            </div>
            <div class="detail-grid" style="margin-top:18px">
              <div><div class="detail-label">Course / strand / grade</div><div class="detail-value">${esc(user.program)}</div></div>
              <div><div class="detail-label">Section</div><div class="detail-value">${esc(user.section || "Not set")}</div></div>
            </div>
          </section>
        </div>
      </div>
    `;
  }

  else if (page === "profile") {
    content.innerHTML = `
      <section class="content-card">
        <div class="profile-header">
          <div class="profile-avatar">${initials(user.name)}</div>
          <div>
            <h2>${esc(user.name)}</h2>
            <p>${esc(user.email)}</p>
            <div class="meta">Member since ${niceDate(user.createdAt)}</div>
          </div>
        </div>

        <div class="detail-grid">
          <div><div class="detail-label">Age</div><div class="detail-value">${user.age}</div></div>
          <div><div class="detail-label">Education level</div><div class="detail-value">${esc(user.educationLevel)}</div></div>
          <div><div class="detail-label">Course / strand / grade</div><div class="detail-value">${esc(user.program)}</div></div>
          <div><div class="detail-label">Section</div><div class="detail-value">${esc(user.section || "Not set")}</div></div>
          <div style="grid-column:1/-1">
            <div class="detail-label">About me</div>
            <div class="detail-value">${esc(user.bio || "Add a short introduction below.")}</div>
          </div>
        </div>
      </section>

      <section class="content-card">
        <h3>Edit profile details</h3>
        <form id="profileForm" class="content-form">
          <div class="detail-grid">
            <label>Full name<input name="name" required minlength="2" value="${esc(user.name)}"></label>
            <label>Age<input type="number" name="age" min="12" max="100" required value="${user.age}"></label>
            <label>Section<input name="section" value="${esc(user.section)}"></label>
            <label>About me<textarea name="bio" maxlength="500">${esc(user.bio)}</textarea></label>
          </div>
          <button class="primary">Save changes →</button>
        </form>
      </section>
    `;

    $("#profileForm").addEventListener("submit", event => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(event.currentTarget).entries());

      if (Number(values.age) < 12) {
        return toast("Age must be 12 or older.", true);
      }

      user.name = values.name.trim();
      user.age = Number(values.age);
      user.section = values.section.trim();
      user.bio = values.bio.trim();

      updateUser();
      toast("Profile updated.");
      renderPage("profile");
    });
  }

  else if (page === "settings") {
    content.innerHTML = `
      <section class="content-card">
        <h3>Account settings</h3>
        <p>Manage your sign-in credentials and account information.</p>
        <div class="detail-grid">
          <div><div class="detail-label">Registered email</div><div class="detail-value">${esc(user.email)}</div></div>
          <div><div class="detail-label">Account type</div><div class="detail-value">${isAdmin ? "Administrator" : "Student"}</div></div>
        </div>
      </section>

      <section class="content-card">
        <h3>Change password</h3>
        <form id="passwordForm" class="content-form">
          <label>Current password<input type="password" name="currentPassword" required></label>
          <label>New password<input type="password" name="newPassword" required minlength="8"></label>
          <label>Confirm new password<input type="password" name="confirmPassword" required minlength="8"></label>
          <button class="primary">Update password →</button>
        </form>
      </section>

      <section class="content-card">
        <h3>Session</h3>
        <p>Switch accounts or sign out of your current session at any time.</p>
        <div class="button-row">
          <button id="settingsChangeAccountBtn" class="secondary-btn" type="button">Change account</button>
          <button id="settingsLogoutBtn" class="danger-btn" type="button">Log out</button>
        </div>
      </section>

      <section class="content-card">
        <h3>Important limitation</h3>
        <p>This version stores accounts and content in this browser only. It does not synchronize data between computers or browsers. Do not use real sensitive student data in this demo.</p>
      </section>
    `;

    $("#passwordForm").addEventListener("submit", event => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(event.currentTarget).entries());

      if (values.currentPassword !== user.password) {
        return toast("Current password is incorrect.", true);
      }
      if (values.newPassword.length < 8) {
        return toast("New password must be at least 8 characters.", true);
      }
      if (values.newPassword !== values.confirmPassword) {
        return toast("The new passwords do not match.", true);
      }

      user.password = values.newPassword;
      updateUser();
      event.currentTarget.reset();
      toast("Password updated successfully.");
    });

    $("#settingsChangeAccountBtn").addEventListener("click", () => {
      user = null;
      isAdmin = false;
      localStorage.removeItem(SESSION_KEY);
      showAuth("login");
      toast("Choose a different account to continue.");
    });

    $("#settingsLogoutBtn").addEventListener("click", logoutUser);
  }

  else if (page === "schedule") {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const items = [...db.schedule].sort((a, b) =>
      days.indexOf(a.day) - days.indexOf(b.day) ||
      a.startTime.localeCompare(b.startTime)
    );

    content.innerHTML = `
      <section class="content-card">
        <h3>Class schedule</h3>
        <p>Schedule items entered by the administrator.</p>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Day</th><th>Time</th><th>Subject</th><th>Instructor</th><th>Room</th></tr></thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td>${esc(item.day)}</td>
                  <td>${esc(item.startTime)}–${esc(item.endTime)}</td>
                  <td><b>${esc(item.subject)}</b></td>
                  <td>${esc(item.teacher || "—")}</td>
                  <td>${esc(item.room || "TBA")}</td>
                </tr>
              `).join("") || '<tr><td colspan="5">No schedule has been added.</td></tr>'}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  else if (page === "announcements") {
    const items = [...db.announcements].reverse();

    content.innerHTML = `
      <div class="section-heading" style="margin-top:0">
        <h3>School announcements</h3>
        <span class="pill">${items.length} updates</span>
      </div>
      <div class="item-grid">
        ${items.map(item => `
          <article class="announcement-card">
            <span class="pill">CAMPUS UPDATE</span>
            <h3>${esc(item.title)}</h3>
            <p>${esc(item.body)}</p>
            <div class="meta">${esc(item.author)} · ${niceDate(item.createdAt)}</div>
          </article>
        `).join("") || '<div class="content-card empty-state">No announcements yet.</div>'}
      </div>
    `;
  }

  else if (page === "resources") {
    content.innerHTML = `
      <div class="section-heading" style="margin-top:0">
        <h3>Explore learning resources</h3>
        <span class="pill">${db.resources.length} resources</span>
      </div>
      <div class="item-grid">
        ${db.resources.map(item => `
          <article class="resource-card">
            <div class="resource-icon">↗</div>
            <span class="pill" style="margin-top:14px">${esc(item.category)}</span>
            <h3>${esc(item.title)}</h3>
            <p>${esc(item.description)}</p>
            <a class="resource-link" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">Open resource ↗</a>
          </article>
        `).join("") || '<div class="content-card empty-state">No resources yet.</div>'}
      </div>
    `;
  }

  else if (page === "admin") {
    renderAdmin(content);
  }
}

function updateUser() {
  const index = db.users.findIndex(item => item.id === user.id);
  db.users[index] = user;
  saveDB();

  $("#topName").textContent = user.name;
  $("#topAvatar").textContent = initials(user.name);
  $("#topProgram").textContent = `${user.program} · ${user.educationLevel}`;
}

function renderAdmin(content) {
  content.innerHTML = `
    <div class="danger-note" style="margin-bottom:18px">
      Admin tools save data in this browser's local storage. Data is not shared with other devices or users.
    </div>

    <section class="content-card">
      <h3>Publish announcement</h3>
      <form id="adminAnnouncement" class="content-form">
        <label>Title<input name="title" required maxlength="120"></label>
        <label>Message<textarea name="body" required maxlength="5000"></textarea></label>
        <button class="primary">Publish announcement →</button>
      </form>

      <div class="section-heading"><h3>Existing announcements</h3></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Title</th><th>Date</th><th>Action</th></tr></thead>
          <tbody>
            ${db.announcements.map(item => `
              <tr>
                <td>${esc(item.title)}</td>
                <td>${niceDate(item.createdAt)}</td>
                <td><button class="delete-btn" data-delete="announcement" data-id="${item.id}">Delete</button></td>
              </tr>
            `).join("") || '<tr><td colspan="3">No announcements</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>

    <section class="content-card">
      <h3>Add class schedule item</h3>
      <form id="adminSchedule" class="content-form">
        <div class="admin-form-grid">
          <label>Subject<input name="subject" required></label>
          <label>Day<select name="day">${["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(day => `<option>${day}</option>`).join("")}</select></label>
          <label>Start time<input type="time" name="startTime" required></label>
          <label>End time<input type="time" name="endTime" required></label>
          <label>Room<input name="room"></label>
          <label>Instructor<input name="teacher"></label>
        </div>
        <button class="primary">Add schedule item →</button>
      </form>

      <div class="table-wrap">
        <table>
          <thead><tr><th>Day</th><th>Time</th><th>Subject</th><th>Action</th></tr></thead>
          <tbody>
            ${db.schedule.map(item => `
              <tr>
                <td>${esc(item.day)}</td>
                <td>${esc(item.startTime)}–${esc(item.endTime)}</td>
                <td>${esc(item.subject)}</td>
                <td><button class="delete-btn" data-delete="schedule" data-id="${item.id}">Delete</button></td>
              </tr>
            `).join("") || '<tr><td colspan="4">No schedule items</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>

    <section class="content-card">
      <h3>Add learning resource</h3>
      <form id="adminResource" class="content-form">
        <div class="admin-form-grid">
          <label>Title<input name="title" required></label>
          <label>Category<input name="category" value="General" required></label>
          <label class="wide">Description<textarea name="description" required></textarea></label>
          <label class="wide">URL<input type="url" name="url" required placeholder="https://example.com"></label>
        </div>
        <button class="primary">Add resource →</button>
      </form>

      <div class="table-wrap">
        <table>
          <thead><tr><th>Title</th><th>Category</th><th>Action</th></tr></thead>
          <tbody>
            ${db.resources.map(item => `
              <tr>
                <td>${esc(item.title)}</td>
                <td>${esc(item.category)}</td>
                <td><button class="delete-btn" data-delete="resource" data-id="${item.id}">Delete</button></td>
              </tr>
            `).join("") || '<tr><td colspan="3">No resources</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>

    <section class="content-card">
      <h3>Registered accounts</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Age</th><th>Level</th><th>Program</th></tr></thead>
          <tbody>
            ${db.users.map(item => `
              <tr>
                <td>${esc(item.name)}</td>
                <td>${esc(item.email)}</td>
                <td>${item.age}</td>
                <td>${esc(item.educationLevel)}</td>
                <td>${esc(item.program)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;

  $("#adminAnnouncement").addEventListener("submit", event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());

    db.announcements.push({
      id: Date.now(),
      title: values.title.trim(),
      body: values.body.trim(),
      author: user.name,
      createdAt: new Date().toISOString()
    });

    saveDB();
    toast("Announcement published.");
    renderAdmin(content);
  });

  $("#adminSchedule").addEventListener("submit", event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());

    if (values.startTime >= values.endTime) {
      return toast("End time must be after start time.", true);
    }

    db.schedule.push({ ...values, id: Date.now() });
    saveDB();
    toast("Schedule item added.");
    renderAdmin(content);
  });

  $("#adminResource").addEventListener("submit", event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());

    try {
      const url = new URL(values.url);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error("Invalid URL");
    } catch {
      return toast("Enter a valid http or https URL.", true);
    }

    db.resources.push({ ...values, id: Date.now() });
    saveDB();
    toast("Learning resource added.");
    renderAdmin(content);
  });

  content.addEventListener("click", event => {
    const button = event.target.closest("[data-delete]");
    if (!button) return;
    if (!confirm("Delete this item?")) return;

    const listName = {
      announcement: "announcements",
      schedule: "schedule",
      resource: "resources"
    }[button.dataset.delete];

    db[listName] = db[listName].filter(item => item.id !== Number(button.dataset.id));
    saveDB();
    toast("Item deleted.");
    renderAdmin(content);
  });
}

(function init() {
  setPrograms($("#educationLevel").value);

  const id = Number(localStorage.getItem(SESSION_KEY));
  user = db.users.find(item => item.id === id) || null;

  if (user) {
    showApp();
  } else {
    showAuth("login");
  }
})();