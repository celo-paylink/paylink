
# Express Starter Repo with Prisma

A boilerplate Node.js Express app using TypeScript, Prisma ORM, JWT authentication, Google OAuth, Cloudinary for image uploads, and a full developer tooling setup with ESLint, Prettier, Husky, Commitlint, and Lint-Staged.

---

## 🔧 Features

- ✅ TypeScript support
- ✅ Prisma ORM with PostgreSQL
- ✅ JWT Authentication
- ✅ Google OAuth2.0 integration (Passport)
- ✅ File uploads with Multer and Cloudinary
- ✅ Environment variable management with `dotenv`
- ✅ CORS whitelist configuration
- ✅ Code formatting and linting with:
  - ESLint
  - Prettier
  - Husky + Lint-Staged
  - Commitlint

---

## 📁 Project Structure

```

src/
│
├── app.ts              # Entry point for Express app
├── routes/             # Your route handlers
├── db/                 # database queries
├── config/             # Passport, Cloudinary, etc.
└── lib/                # types, jwt functions and prisma client instance

````

---

## 🚀 Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/IamHenryOkeke/node-express-be-with-prisma-starter-template
cd node-express-be-with-prisma-starter-template
````

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory based on the `.env.example` file:

```bash
cp .env.example .env
```

Edit the file to include your actual credentials (JWT secret, Cloudinary, Google OAuth, DB, etc.).

---

## 🧪 Development

```bash
npm run dev
```

Runs the app in development mode using `ts-node-dev`.

---

## 🏗 Production

### Build the App

```bash
npm run build
```

### Apply Prisma Migrations (Production-Safe)

```bash
npm run deploy:migrate
```

### Start the Server

```bash
npm start
```

> ✅ Use this order during deployment: **build → migrate → start**

---

## 🧹 Code Quality

This project uses **Husky**, **Commitlint**, **Prettier**, and **ESLint** to enforce consistent code quality and commit standards.

### Husky + Commitlint

```bash
npx husky install
```

### Linting

```bash
npm run lint
```

### Format Code

```bash
npx prettier --write .
```

---

## 🛠 Prisma

### Generate Client

```bash
npx prisma generate
```

### Migrate DB

```bash
npx prisma migrate dev --name init
```

### Deploy Migrations to Production

```bash
npx prisma migrate deploy
```

---

## ☁️ Deploying on Render (Free Plan)

### Recommended Build Command:

```bash
npm run build && npm run deploy:migrate
```

### Start Command:

```bash
npm start
```

### Environment Variables (set in Render dashboard):

* `PORT`
* `JWT_SECRET`
* `DATABASE_URL`
* `CLOUDINARY_API_KEY`
* `CLOUDINARY_API_SECRET`
* `CLOUDINARY_CLOUD_NAME` 
* `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
* `CORS_WHITELIST`

---


## 👨‍💻 Author

Built by [Okeke Henry](https://github.com/Iamhenryokeke)

