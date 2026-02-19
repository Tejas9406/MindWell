# Student Stress Level Checker – Backend (Java Spring Boot)

This is the **Java Spring Boot** backend replacing the previous Python/Flask backend. All API endpoints and behavior remain the same so the frontend works without changes.

## Requirements

- **Java 17+** (JDK installed and `JAVA_HOME` set, or `java` on PATH)
- **Maven** – optional if you use the run script (see below)

## Configuration

1. **Environment variables** (or set in `src/main/resources/application.properties`):
   - `PORT` – Server port (default: `5000`, same as before)
   - `GEMINI_API_KEY` – Optional. If set, chat uses Gemini AI; otherwise uses the built-in smart local responses.

2. **Key files** (place in the `backend` folder, or set full paths in `application.properties`):
   - **Firebase Admin SDK**: `student-stress-management-firebase-adminsdk-fbsvc-1337fa3ab4.json`
   - **Google Sheets service account**: `student-stress-level-checker-622e5c819593.json`

3. **Optional** in `application.properties`:
   - `firebase.credentials.path` – Path to Firebase JSON key
   - `sheets.credentials.path` – Path to Sheets JSON key
   - `spreadsheet.id` – Google Sheet ID

To use your existing `.env` (e.g. `GEMINI_API_KEY`, `PORT`), export before running:

```bash
# Windows (PowerShell)
Get-Content .env | ForEach-Object { if ($_ -match '^([^#][^=]+)=(.*)$') { [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), 'Process') } }

# Windows (cmd) / Linux / Mac
set -a && source .env && set +a   # then run Java
# Or just: set GEMINI_API_KEY=your_key && set PORT=5000
```

## Run

From the **`backend`** directory.

### Option 1: Without Maven installed (Windows)

```powershell
.\run.ps1
```

This script uses `mvn` from PATH if available; otherwise it downloads Maven once into `.mvn\cache` and runs the app. If PowerShell blocks the script, run: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`

### Option 2: With Maven in PATH

```bash
mvn spring-boot:run
```

### Option 3: Build and run the JAR

```bash
mvn clean package
java -jar target/stress-level-checker-backend-1.0.0.jar
```

(Use `.\run.ps1 clean package` if you don’t have Maven in PATH, then run the JAR with `java -jar target\stress-level-checker-backend-1.0.0.jar`.)

Server runs at **http://localhost:5000** (or the port you set). The frontend can keep using the same base URL.

## API Endpoints (unchanged)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check |
| GET | `/favicon.ico` | 204 No Content |
| POST | `/api/sync-responses` | Trigger Google Sheet → Firestore sync |
| POST | `/api/chat` | AI chat (body: `{ "message", "email" }`) |
| GET | `/api/music` | Relaxation music list |
| GET | `/api/articles` | Mental health articles list |
