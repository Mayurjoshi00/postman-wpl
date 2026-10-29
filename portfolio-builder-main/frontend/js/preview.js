const data = JSON.parse(localStorage.getItem("portfolioData"));

if (data) {
    // Profile image - safely inside the if block
    if (data.profileImage) {
        const img = document.getElementById("profileImage");
        img.src = data.profileImage;
        img.style.display = "block";
    }

    document.getElementById("previewName").innerText = data.name;
    document.getElementById("previewBio").innerText = data.bio;
    document.getElementById("eduDegree").innerText = data.education.degree;
    document.getElementById("eduCollege").innerText = data.education.college;
    document.getElementById("eduYear").innerText = data.education.year;
    document.getElementById("expRoleText").innerText = data.experience.role;
    document.getElementById("expCompanyText").innerText = data.experience.company;
    document.getElementById("expDescText").innerText = data.experience.description;

    if (data.socials.github) {
        document.getElementById("githubProfile").href = data.socials.github;
    }
    if (data.socials.linkedin) {
        document.getElementById("linkedinProfile").href = data.socials.linkedin;
    }

    if (data.theme === "dark") {
        document.body.classList.add("dark-theme");
    }

    const skillsContainer = document.getElementById("skillsContainer");
    data.skills.forEach(skill => {
        const div = document.createElement("div");
        div.className = "mb-3";
        div.innerHTML = `
            <div class="d-flex justify-content-between">
                <span>${skill.name}</span>
                <span>${skill.level}%</span>
            </div>
            <div class="progress">
                <div class="progress-bar bg-success"
                     style="width:${skill.level}%"></div>
            </div>
        `;
        skillsContainer.appendChild(div);
    });

    const projectsContainer = document.getElementById("projectsContainer");
    data.projects.forEach(p => {
        const card = document.createElement("div");
        card.className = "card p-3 mb-3";
        card.innerHTML = `<h5>${p.title}</h5><p>${p.desc}</p>`;
        projectsContainer.appendChild(card);
    });
}