# ARX IT Club of SJS — Web Platform

**"Learn. Build. Grow."**

The official website and student member portal for ARX IT Club of Saint Joseph School.

---

## Project Structure

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/kidvs/Arx-Website-SJS.git
cd Arx-Website-SJS
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Required variables:

```env
PORT=3000
JWT_SECRET=
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=
TELEGRAM_CHANNEL_USERNAME=
ADMIN_PASSWORD=
APP_URL=
```

### Running Locally

```bash
npm run dev
```

---

## Deployment (Vercel)

1. Import this repository on [vercel.com](https://vercel.com)
2. Set the environment variables in the Vercel dashboard
3. Deploy — Vercel will use `vercel.json` automatically

### Deleting Vercel Environment Variables

This permanently deletes the user-managed environment variables for the selected Vercel project. Vercel-managed system variables and local `.env` files are not changed. Before running it, temporarily paste your token and project name into the constants at the top of `scripts/delete-vercel-env.ts`. The script asks you to type `DELETE` before deleting anything. Remove the token from the file after running it; do not commit a real token.

Run it from the project folder:

```bash
npm run vercel:env:delete
```

---

## Contributing

1. Fork the repository or clone it directly (if you have access)
2. Create a new branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request on GitHub

---

## Contributors

- [@kidvs](https://github.com/kidvs)
- [@Noobruller](https://github.com/Noobruller)
- [@Nathan-wond](https://github.com/Nathan-wond)
