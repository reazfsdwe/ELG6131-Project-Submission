# MediVoice

A smart medical report platform. Doctors record clinical findings via voice, upload blood test data, and generate structured reports powered by a local LLM. Patients view their reports using a unique access code.

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [PostgreSQL](https://www.postgresql.org/download/) v14 or later
- [Ollama](https://ollama.com/) with the following models pulled:
  - `llama3.2:3b` (text analysis)
  - `qwen3-vl:4b` (image analysis, optional)

## 1. Install PostgreSQL

### macOS

```bash
brew install postgresql@17
brew services start postgresql@17
```

### Windows

1. Download the installer from https://www.postgresql.org/download/windows/
2. Run the installer, keep the default port (5432) and remember the password you set.
3. Make sure "Add to PATH" is checked during installation, or manually add `C:\Program Files\PostgreSQL\17\bin` to your system PATH.

### Verify installation

```bash
psql --version
```

If the command is not found on macOS, add PostgreSQL to your PATH:

```bash
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
```

You can add this line to your `~/.zshrc` or `~/.bash_profile` to make it permanent.

## 2. Create the database

### macOS

```bash
createdb medivoice
```

### Windows

Open a terminal (Command Prompt or PowerShell):

```bash
createdb -U postgres medivoice
```

You will be prompted for the password you set during installation.

### Create the table

Run the following command to set up the schema:

```bash
psql medivoice -f server/schema.sql
```

On Windows, use:

```bash
psql -U postgres medivoice -f server/schema.sql
```

## 3. Install Ollama and pull models

1. Download and install Ollama from https://ollama.com/
2. Pull the required model:

```bash
ollama pull llama3.2:3b
```

## 4. Install project dependencies

```bash
npm install
```

## 5. Start the application

You need two terminal windows:

**Terminal 1 - Start the API server:**

```bash
npm run server
```

You should see: `API server running on http://localhost:3001`

**Terminal 2 - Start the frontend:**

```bash
npm run dev
```

Open the URL shown in the terminal (usually http://localhost:5173).

## 6. Start Ollama

Make sure Ollama is running in the background:

```bash
ollama serve
```

Or simply open the Ollama desktop app.

## Usage

1. Open the app in your browser.
2. Click **Doctor Portal** to create a new report.
3. Fill in patient information, record clinical findings, and/or enter blood test data.
4. Generate the report to receive a unique access code (e.g., `MV1L9z3x`).
5. Share the access code with the patient.
6. The patient clicks **View My Report** and enters the code to view their report.

## Project Structure

```
src/
  pages/          -> Page components (Home, DoctorPortal, PatientPortal, etc.)
  services/       -> LLM service, database service
  context/        -> React Context for report state management
  components/ui/  -> Reusable UI components
  lib/            -> Utility functions (snowflake ID generator)
server/
  index.cjs       -> Express API server
  schema.sql      -> PostgreSQL table schema
```

## Troubleshooting

**"psql: command not found"**
PostgreSQL is not in your PATH. See step 1 for how to add it.

**"connection refused" on port 3001**
The API server is not running. Run `npm run server` in a separate terminal.

**"connection refused" on port 11434**
Ollama is not running. Start it with `ollama serve` or open the Ollama app.

**API server fails to start with a database connection error**
Make sure PostgreSQL is running and the `medivoice` database exists. Check with `psql medivoice -c "SELECT 1"`.

**On Windows, PostgreSQL authentication fails**
Try connecting with the postgres user: `psql -U postgres medivoice`. If that works, update `server/index.cjs` to include the user and password in the Pool config:
```js
const pool = new Pool({
  database: 'medivoice',
  user: 'postgres',
  password: 'your_password',
});
```
