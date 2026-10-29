const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// ---------- MIDDLEWARE ----------
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ---------- SERVE FRONTEND ----------
app.use(express.static(path.join(__dirname, "../frontend")));

// ---------- IN-MEMORY STORE (no database needed) ----------
// Key = username, value = portfolio object.
// Data is lost when the server restarts (Render free tier restarts after idling).
const portfolios = new Map();

const now = () => new Date().toISOString();

portfolios.set("mayurjoshi", {
  username: "mayurjoshi",
  name: "Mayur Joshi",
  bio: "Final-year MCA student and full-stack developer",
  education: { degree: "MCA", college: "MS Ramaiah Institute of Technology", year: "2024-2026" },
  experience: { role: "Frontend Intern", company: "Tech Solutions Pvt Ltd", description: "Worked on dashboards" },
  socials: { github: "https://github.com/Mayurjoshi00", linkedin: "" },
  skills: [{ name: "Python", level: 85 }, { name: "React", level: 75 }],
  projects: [{ title: "Smart Portfolio Builder", desc: "Node/Express portfolio generator" }],
  theme: "dark",
  profileImage: "",
  createdAt: now(),
  updatedAt: now()
});

// ---------- VALIDATION ----------
const THEMES = ["light", "dark"];
const USERNAME_RE = /^[a-z0-9._-]{2,30}$/;
const NESTED = {
  education: ["degree", "college", "year"],
  experience: ["role", "company", "description"],
  socials: ["github", "linkedin"]
};

const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isText = (v) => typeof v === "string" && v.trim() !== "";

// Reads only the known fields that are present in `body`.
// Returns { data, errors }. Unknown fields are ignored.
function parseFields(body) {
  const b = isObject(body) ? body : {};
  const data = {};
  const errors = [];

  if (b.name !== undefined) {
    if (isText(b.name)) data.name = b.name.trim();
    else errors.push("name must be a non-empty string");
  }
  if (b.bio !== undefined) {
    if (typeof b.bio === "string") data.bio = b.bio;
    else errors.push("bio must be a string");
  }
  if (b.theme !== undefined) {
    if (THEMES.includes(b.theme)) data.theme = b.theme;
    else errors.push(`theme must be one of: ${THEMES.join(", ")}`);
  }
  if (b.profileImage !== undefined) {
    if (typeof b.profileImage === "string") data.profileImage = b.profileImage;
    else errors.push("profileImage must be a string");
  }

  for (const [key, fields] of Object.entries(NESTED)) {
    if (b[key] === undefined) continue;
    if (!isObject(b[key])) {
      errors.push(`${key} must be an object`);
      continue;
    }
    data[key] = {};
    for (const f of fields) {
      if (b[key][f] === undefined) continue;
      if (typeof b[key][f] === "string") data[key][f] = b[key][f];
      else errors.push(`${key}.${f} must be a string`);
    }
  }

  if (b.skills !== undefined) {
    if (!Array.isArray(b.skills)) {
      errors.push("skills must be an array");
    } else {
      data.skills = [];
      b.skills.forEach((s, i) => {
        const raw = isObject(s) ? s.level : undefined;
        const level = typeof raw === "string" && raw.trim() !== "" ? Number(raw) : raw;
        if (!isObject(s) || !isText(s.name)) errors.push(`skills[${i}].name must be a non-empty string`);
        else if (typeof level !== "number" || Number.isNaN(level) || level < 0 || level > 100)
          errors.push(`skills[${i}].level must be a number between 0 and 100`);
        else data.skills.push({ name: s.name.trim(), level });
      });
    }
  }

  if (b.projects !== undefined) {
    if (!Array.isArray(b.projects)) {
      errors.push("projects must be an array");
    } else {
      data.projects = [];
      b.projects.forEach((p, i) => {
        if (!isObject(p) || !isText(p.title)) errors.push(`projects[${i}].title must be a non-empty string`);
        else if (p.desc !== undefined && typeof p.desc !== "string") errors.push(`projects[${i}].desc must be a string`);
        else data.projects.push({ title: p.title.trim(), desc: p.desc || "" });
      });
    }
  }

  return { data, errors };
}

const fail = (res, status, error, details) => res.status(status).json(details ? { error, details } : { error });

// ---------- API ROUTES ----------
const api = express.Router();

// GET /api/health
api.get("/health", (req, res) => {
  res.json({ status: "ok", uptimeSeconds: Math.round(process.uptime()), portfolios: portfolios.size, timestamp: now() });
});

// Collection: /api/portfolios
api
  .route("/portfolios")
  // GET /api/portfolios?theme=dark&search=mayur&limit=5
  .get((req, res) => {
    const { theme, search, limit } = req.query;
    let list = [...portfolios.values()];

    if (theme !== undefined) {
      if (!THEMES.includes(theme)) return fail(res, 400, `theme must be one of: ${THEMES.join(", ")}`);
      list = list.filter((p) => p.theme === theme);
    }
    if (search) list = list.filter((p) => p.name.toLowerCase().includes(String(search).toLowerCase()));
    if (limit !== undefined) {
      const n = Number(limit);
      if (!Number.isInteger(n) || n < 1) return fail(res, 400, "limit must be a positive integer");
      list = list.slice(0, n);
    }
    res.json({ count: list.length, data: list });
  })
  // POST /api/portfolios  -> 201 Created
  .post((req, res) => {
    const body = isObject(req.body) ? req.body : {};
    const { data, errors } = parseFields(body);

    if (typeof body.username !== "string" || !USERNAME_RE.test(body.username))
      errors.push("username is required: 2-30 characters, lowercase letters, digits, dot, underscore or hyphen");
    if (data.name === undefined && body.name === undefined) errors.push("name is required");
    if (data.bio === undefined && body.bio === undefined) errors.push("bio is required");
    if (errors.length) return fail(res, 400, "Validation failed", errors);

    if (portfolios.has(body.username)) return fail(res, 409, `Portfolio '${body.username}' already exists`);

    const portfolio = {
      username: body.username,
      name: data.name,
      bio: data.bio,
      education: { degree: "", college: "", year: "", ...data.education },
      experience: { role: "", company: "", description: "", ...data.experience },
      socials: { github: "", linkedin: "", ...data.socials },
      skills: data.skills || [],
      projects: data.projects || [],
      theme: data.theme || "light",
      profileImage: data.profileImage || "",
      createdAt: now(),
      updatedAt: now()
    };
    portfolios.set(portfolio.username, portfolio);
    res.status(201).location(`/api/portfolios/${portfolio.username}`).json({ message: "Portfolio created", data: portfolio });
  })
  .all((req, res) => res.set("Allow", "GET, POST").status(405).json({ error: `${req.method} is not allowed on /api/portfolios` }));

// Single item: /api/portfolios/:username
api
  .route("/portfolios/:username")
  // GET /api/portfolios/:username
  .get((req, res) => {
    const portfolio = portfolios.get(req.params.username);
    if (!portfolio) return fail(res, 404, `Portfolio '${req.params.username}' not found`);
    res.json({ data: portfolio });
  })
  // PUT /api/portfolios/:username  -> full replace (name and bio required)
  .put((req, res) => {
    const existing = portfolios.get(req.params.username);
    if (!existing) return fail(res, 404, `Portfolio '${req.params.username}' not found`);

    const body = isObject(req.body) ? req.body : {};
    const { data, errors } = parseFields(body);
    if (body.username !== undefined && body.username !== req.params.username)
      errors.push("username in the body must match the username in the URL");
    if (body.name === undefined) errors.push("name is required");
    if (body.bio === undefined) errors.push("bio is required");
    if (errors.length) return fail(res, 400, "Validation failed", errors);

    const portfolio = {
      username: existing.username,
      name: data.name,
      bio: data.bio,
      education: { degree: "", college: "", year: "", ...data.education },
      experience: { role: "", company: "", description: "", ...data.experience },
      socials: { github: "", linkedin: "", ...data.socials },
      skills: data.skills || [],
      projects: data.projects || [],
      theme: data.theme || "light",
      profileImage: data.profileImage || "",
      createdAt: existing.createdAt,
      updatedAt: now()
    };
    portfolios.set(portfolio.username, portfolio);
    res.json({ message: "Portfolio replaced", data: portfolio });
  })
  // PATCH /api/portfolios/:username  -> partial update
  .patch((req, res) => {
    const existing = portfolios.get(req.params.username);
    if (!existing) return fail(res, 404, `Portfolio '${req.params.username}' not found`);

    const body = isObject(req.body) ? req.body : {};
    const { data, errors } = parseFields(body);
    if (body.username !== undefined && body.username !== req.params.username)
      errors.push("username cannot be changed");
    if (Object.keys(data).length === 0 && errors.length === 0) errors.push("no valid fields to update");
    if (errors.length) return fail(res, 400, "Validation failed", errors);

    const portfolio = { ...existing, ...data, updatedAt: now() };
    for (const key of Object.keys(NESTED)) if (data[key]) portfolio[key] = { ...existing[key], ...data[key] };
    portfolios.set(portfolio.username, portfolio);
    res.json({ message: "Portfolio updated", data: portfolio });
  })
  // DELETE /api/portfolios/:username
  .delete((req, res) => {
    const portfolio = portfolios.get(req.params.username);
    if (!portfolio) return fail(res, 404, `Portfolio '${req.params.username}' not found`);
    portfolios.delete(req.params.username);
    res.json({ message: "Portfolio deleted", data: portfolio });
  })
  .all((req, res) =>
    res.set("Allow", "GET, PUT, PATCH, DELETE").status(405).json({ error: `${req.method} is not allowed on this route` })
  );

// Any other /api/... path
api.use((req, res) => fail(res, 404, `Route ${req.method} ${req.originalUrl} not found`));

app.use("/api", api);

// ---------- FRONTEND FALLBACK ----------
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ---------- ERROR HANDLER ----------
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") return fail(res, 400, "Invalid JSON in request body");
  if (err.type === "entity.too.large") return fail(res, 413, "Request body too large");
  console.error(err);
  fail(res, 500, "Internal server error");
});

// ---------- START ----------
app.listen(PORT, () => {
  console.log(`🔥 App running on http://localhost:${PORT}`);
});
