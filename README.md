# Productivity Hub

A modern, feature-rich productivity application built with Next.js that helps you manage bookmarks, tasks, and interact with AI assistance.

🌐 **Live Website:** [productivity-hub.vercel.app](https://productivity-hub.vercel.app)

## Features

### 📚 Bookmarks Manager
- Add, edit, and delete bookmarks
- Store bookmarks locally in your browser
- Clean, card-based interface for easy browsing

### ✅ Todo List
- Create tasks with titles, descriptions, priorities, labels, and due dates
- Custom calendar date picker with year/month navigation
- Filter tasks by priority, label, or date (today, this week, this month, past)
- Sort tasks by priority or date
- Mark tasks as completed with visual line-through styling
- Toggle visibility of completed tasks
- All data persisted in browser localStorage

### 🤖 AI Assistant
- Interactive chat interface powered by OpenAI
- Function calling capabilities

## Technologies Used

### Core Framework
- **Next.js 15.5.2** - React framework for production
- **React 19.1.0** - UI library
- **TypeScript 5** - Type-safe JavaScript

### Styling & UI
- **Tailwind CSS 4** - Utility-first CSS framework
- **Motion (Framer Motion) 12.23.12** - Animation library
- **React Icons 5.5.0** - Icon library
- **clsx 2.1.1** - Conditional className utility

### Development Tools
- **ESLint 9** - Code linting
- **PostCSS** - CSS processing

## Installation & Setup

### Prerequisites
- Node.js 18+ installed on your system
- npm, yarn, pnpm, or bun package manager

### Download & Install

1. **Clone or download the repository**
   ```bash
   git clone <https://github.com/DavoodAkrami/productivity-hub.git>
   cd productivity-hub
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables** (if using AI features)
   
   Create a `.env.local` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   OPEN_AI_BASE_URL:your_openai_base_url
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── AI/              # AI chat interface
│   ├── todolist/        # Todo list management
│   ├── page.tsx         # Bookmarks page (home)
│   └── layout.tsx       # Root layout
├── components/          # Reusable UI components
├── configs/            # Configuration files
├── providers/         # React context providers
└── utilities/         # Helper functions
```
