# MediVoice

Medical report platform where doctors record findings via voice, enter blood test data, and generate reports with local LLM analysis. Patients view reports using an access code.

## Setup

### Node.js

Download and install from https://nodejs.org/ (v18 or later). This includes npm.

Verify:
```
node -v
npm -v
```

### Database

macOS:
```
brew install postgresql@17
brew services start postgresql@17
createdb medivoice
psql medivoice -f server/schema.sql
```

If `psql` is not found, add it to PATH:
```
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
```

Windows:
1. Install from https://www.postgresql.org/download/windows/, keep default port 5432
2. Make sure PostgreSQL bin folder is in PATH (e.g. `C:\Program Files\PostgreSQL\17\bin`)
3. Then:
```
createdb -U postgres medivoice
psql -U postgres medivoice -f server/schema.sql
```

### Ollama

Install from https://ollama.com/, then pull the model:
```
ollama pull llama3.2:3b
```

### Project

```
npm install
```

## Running

Open two terminals:

Terminal 1 (backend):
```
npm run server
```

Terminal 2 (frontend):
```
npm run dev
```

Make sure Ollama is running (`ollama serve` or open the app).

Open http://localhost:5173 in browser.

## How to use

1. Go to Doctor Portal, fill in patient info, record findings, enter blood test data
2. Generate report — you get an access code like `MV1L9z3x`
3. Patient goes to View My Report, enters the code

## Troubleshooting

- `psql: command not found` — PostgreSQL not in PATH, see setup section
- Port 3001 connection refused — backend not running, run `npm run server`
- Port 11434 connection refused — Ollama not running
- Windows auth error — use `psql -U postgres medivoice`, and update `server/index.cjs` Pool config with user/password
