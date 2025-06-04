# 👻 Welcome to `Yuyuko_bot-y2`

```py
print(f"Hello, user! Please run `npm install typescript ts-node @types/node --save-dev` to install the required packages. We're about to begin building the second-generation Yuyuko bot!")
```

## 📦 Required Libraries & Setup Instructions

### 💻 Programming Languages

* TypeScript
* JavaScript (optional for extensions)

### 📚 Core Dependencies

* [`discord.js`](https://discord.js.org)
* `dotenv`
* `typescript`
* `ts-node`
* `@types/node`

---

### ⚙️ Step 1: Initialize the Project

Create a new project folder and initialize it:

```bash
npm init -y
```

---

### 📥 Step 2: Install Required Packages

Install development tools:

```bash
npm install typescript ts-node @types/node --save-dev
```

Install runtime dependencies:

```bash
npm install discord.js dotenv
```

---

### 🛠 Step 3: Create `tsconfig.json`

You can generate the config with:

```bash
npx tsc --init
```

Or manually create it with the following recommended settings:

```json
{
    "compilerOptions": {
        "target": "es2020",
        "module": "commonjs",
        "strict": true,
        "outDir": "./build",
        "rootDir": ".",
        "esModuleInterop": true,
        "skipLibCheck": true,
        "resolveJsonModule": true,
        "types": ["node"],
        "moduleResolution": "node"
        "sourceMap": true
    },
    "include": [
        "commands/**/*",
        "events/**/*",
        "deploy-commands.ts"
    ],
    "exclude": [
        "node_modules",
        "build"
    ]
}
```

---

### 🚀 Ready to Start?

Create a `src` folder and begin writing your bot using TypeScript!
Example entry file: `src/index.ts`

To run your bot in development mode:

```bash
npx ts-node src/index.ts
```

---

## 📄 License

This project is licensed under the **GNU General Public License v3.0**.
See the [LICENSE](./LICENSE) file for more details.
