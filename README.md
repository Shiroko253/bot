# 👻 Welcome to `Yuyuko_bot-y2`

```py
print(f"Hello, user! Please run `npm install typescript ts-node @types/node --save-dev` to install the required packages. Get ready to build Yuyuko bot 2nd generation!")
```

## 📦 Required Packages & Setup Instructions

### 💻 Programming Languages
- Main entry: **JavaScript (`index.js`)**
- Commands & Events modules: **TypeScript or JavaScript** (folder: `commands/` and `events/`)

---

### 📚 Installation Steps

#### 1. Initialize Project

```bash
npm init -y
```

#### 2. Install Dependencies

**Development dependencies:**
```bash
npm install typescript ts-node @types/node --save-dev
```

**Runtime dependencies:**
```bash
npm install discord.js dotenv
```

#### 3. Create TypeScript Configuration

```bash
npx tsc --init
```
**Recommended `tsconfig.json` (only for `commands/` and `events/`, output to `build/`):**

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./build",
    "skipLibCheck": true
  },
  "include": ["commands/**/*", "events/**/*"]
}
```

---

## 📁 Project Structure (Sample)

```
/project-root
├── index.js        # Main entry (JavaScript, executed directly)
├── commands/       # Command modules (TypeScript/JavaScript)
├── events/         # Event modules (TypeScript/JavaScript)
├── build/          # Compiled JS output from TypeScript (auto-generated)
├── tsconfig.json   # TypeScript config
└── .env            # Environment variables
```

- **index.js**: The main entry file, which loads JS modules from `build/commands/` and `build/events/`.
- **commands/**, **events/**: Write your features in TS or JS, but TS is recommended. Compile TS to `build/`.
- **build/**: Stores all compiled JS files. Do not edit directly.

---

## 🚀 Development & Start-up Workflow

1. **Development:**  
   Write your modules in `commands/` and `events/` using TypeScript.

2. **Compile TypeScript:**
   ```bash
   npx tsc
   ```
   - This compiles TS files into JS under `build/commands/` and `build/events/`.

3. **Start the bot:**
   ```bash
   node index.js
   ```
   - Make sure `index.js` only loads JS files from `build/commands/` and `build/events/`, not the original TS files!

---

## 🔒 Notes

- **index.js** can only load JS files. Do NOT require/import TS source files directly.
- Place secrets (like your Discord Token) in `.env`.
- `commands/` and `events/` are only for source code; run the bot using the compiled JS in `build/`.
- Do not place command or event modules in the root directory—keep them in their designated folders.

---

## 📄 License

This project is licensed under the **GNU General Public License v3.0**.  
See [LICENSE](./LICENSE) for details.
