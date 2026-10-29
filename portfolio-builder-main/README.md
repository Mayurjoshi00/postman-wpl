# Smart Portfolio Builder — Node.js + Express REST API

Portfolio generator with a static frontend and a REST API (no database; data is kept in memory).

## Run
```bash
cd portfolio-backend
npm install
npm start          # http://localhost:5000
```
Or with Docker: `docker-compose up --build`

On Render: Web Service, Docker environment, no env vars needed (uses `PORT`).

## API  (base URL: `http://localhost:5000`)

| Method | Endpoint | Purpose | Success | Errors |
|--------|----------|---------|---------|--------|
| GET | `/api/health` | Health check | 200 | |
| GET | `/api/portfolios?theme=&search=&limit=` | List / filter | 200 | 400 |
| GET | `/api/portfolios/:username` | Get one | 200 | 404 |
| POST | `/api/portfolios` | Create (`username`, `name`, `bio` required) | 201 + `Location` header | 400, 409 |
| PUT | `/api/portfolios/:username` | Replace whole portfolio (`name`, `bio` required) | 200 | 400, 404 |
| PATCH | `/api/portfolios/:username` | Partial update | 200 | 400, 404 |
| DELETE | `/api/portfolios/:username` | Delete | 200 | 404 |

Other methods on these routes return 405 with an `Allow` header. Errors are JSON: `{ "error": "...", "details": [...] }`.

Sample body:
```json
{
  "username": "john", "name": "John Doe", "bio": "Developer",
  "education": { "degree": "MCA", "college": "MSRIT", "year": "2026" },
  "experience": { "role": "Intern", "company": "ABC", "description": "..." },
  "socials": { "github": "", "linkedin": "" },
  "skills": [{ "name": "JS", "level": 80 }],
  "projects": [{ "title": "App", "desc": "..." }],
  "theme": "dark"
}
```
Rules: `username` = 2-30 chars of `a-z 0-9 . _ -`; `theme` = `light` | `dark`; skill `level` = 0-100.

## Postman
Files in `postman/`: import `Portfolio-Builder-API.postman_collection.json` and an environment (`Local` or `Render`). Pick the environment, then Collection Runner -> Run. 29 requests, 86 assertions.

Command line: `npx newman run postman/Portfolio-Builder-API.postman_collection.json -e postman/Local.postman_environment.json`
