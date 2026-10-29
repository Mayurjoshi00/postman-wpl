console.log("working no error app.js loaded")
let projects = [];
let skills = [];

function addProject() {
  const title = document.getElementById("projectTitle").value;
  const desc = document.getElementById("projectDesc").value;
  if (title === "" || desc === "") return;
  projects.push({ title, desc });
  const li = document.createElement("li");
  li.className = "list-group-item";
  li.innerText = title;
  document.getElementById("projectList").appendChild(li);
  document.getElementById("projectTitle").value = "";
  document.getElementById("projectDesc").value = "";
}

function addSkill() {
  const name = document.getElementById("skillName").value.trim();
  const level = document.getElementById("skillLevel").value;
  if (name === "" || level === "" || level < 0 || level > 100) return;
  skills.push({ name, level });
  const li = document.createElement("li");
  li.className = "list-group-item d-flex justify-content-between";
  li.innerHTML = `<span>${name}</span><span>${level}%</span>`;
  document.getElementById("skillList").appendChild(li);
  document.getElementById("skillName").value = "";
  document.getElementById("skillLevel").value = "";
}

document.getElementById("portfolioForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const username = document.getElementById("name").value.toLowerCase().replace(/\s+/g, "");

  const data = {
    username,
    name: document.getElementById("name").value,
    bio: document.getElementById("bio").value,
    education: {
      degree: document.getElementById("degree").value,
      college: document.getElementById("college").value,
      year: document.getElementById("year").value
    },
    experience: {
      role: document.getElementById("expRole").value,
      company: document.getElementById("expCompany").value,
      description: document.getElementById("expDesc").value
    },
    socials: {
      github: document.getElementById("githubLink").value,
      linkedin: document.getElementById("linkedinLink").value
    },
    skills,
    projects,
    theme: document.getElementById("theme").value
  };

  async function proceed(data) {
    // Save to localStorage first - always works
    localStorage.setItem("portfolioData", JSON.stringify(data));

    // Try backend silently - don't block navigation
    // Update (PUT) if the portfolio already exists, otherwise create it (POST)
    try {
      const opts = (method) => ({
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      let res = await fetch("/api/portfolios/" + encodeURIComponent(data.username), opts("PUT"));
      if (res.status === 404) res = await fetch("/api/portfolios", opts("POST"));
      if (res.ok) console.log("✅ Also saved to the backend API");
    } catch (err) {
      console.warn("⚠️ Backend save skipped:", err.message);
    }

    // Always navigate regardless
    window.location.href = "preview.html";
  }

  const imgFile = document.getElementById("profileImageInput").files[0];
  if (imgFile) {
    const reader = new FileReader();
    reader.onload = function () {
      data.profileImage = reader.result;
      proceed(data);
    };
    reader.readAsDataURL(imgFile);
  } else {
    proceed(data);
  }
});

function clearData() {
  if (confirm("Clear all data?")) {
    localStorage.removeItem("portfolioData");
    location.reload();
  }
}

window.onload = function () {
  const data = JSON.parse(localStorage.getItem("portfolioData"));
  if (!data) return;
  document.getElementById("name").value = data.name;
  document.getElementById("bio").value = data.bio;
  document.getElementById("theme").value = data.theme;
  skills = data.skills || [];
  projects = data.projects || [];
  skills.forEach(s => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between";
    li.innerHTML = `<span>${s.name}</span><span>${s.level}%</span>`;
    document.getElementById("skillList").appendChild(li);
  });
  projects.forEach(p => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.innerText = p.title;
    document.getElementById("projectList").appendChild(li);
  });
};