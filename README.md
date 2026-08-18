# 🧬 RepoDNA-AI (CodeDNA-AI)
> AI-Powered Software Intelligence Platform for repository analysis, dependency graphs, security scanning, and automated refactoring suggestions.

---

## 🚀 Quick Start Guide for Collaborators

Now that you have been added as a collaborator to the project, follow the steps below to clone, set up, and run the project locally on your machine.

---

### 📋 Prerequisites

Before running the project, make sure you have installed:
- **Git**
- **Node.js** (v18 or higher)
- **Java Development Kit (JDK 21)**
- **Maven** (or Maven Wrapper included in `backend`)
- **Gemini / AI API Key** (optional/required based on configuration)

---

### 1. 📥 Clone the Repository

Open your terminal/command prompt and run:

```bash
git clone https://github.com/Ayudhpogulwar/RepoDNA-Ai.git
cd RepoDNA-Ai
```

---

### 2. ⚙️ Backend Setup (Spring Boot + Java 21)

Navigate to the `backend` folder and start the server:

```bash
cd backend

# On Windows (CMD / PowerShell):
.\mvnw spring-boot:run

# On macOS / Linux:
./mvnw spring-boot:run
```

*The backend server will run on `http://localhost:8080`.*

---

### 3. 🎨 Frontend Setup (React + Vite + TypeScript)

Open a new terminal tab/window, navigate to the `frontend` folder, install dependencies, and run dev mode:

```bash
cd frontend

# Install Node modules
npm install

# Start local dev server
npm run dev
```

*The frontend application will run on `http://localhost:5173`.*

---

### 🛠️ Direct Push Workflow (Working on `main` Branch)

Since you are a collaborator on this repository, you can push directly to `main` without creating separate branches:

1. **Pull the latest code** before making any changes:
   ```bash
   git pull origin main
   ```

2. **Make your changes** in the codebase.

3. **Commit and push** directly to `main`:
   ```bash
   git add .
   git commit -m "Description of changes made"
   git push origin main
   ```

---

## 👥 Contributors
- **Ayudh Pogulwar** ([@Ayudhpogulwar](https://github.com/Ayudhpogulwar))
