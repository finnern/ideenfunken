# Ideenfunken Clean - Book Voting App

A clean, modern book recommendation and voting platform for the Black Forest (Schwarzwald) community. This app allows users to vote on inspiring books, with the top selections being made available at local libraries.

## ✨ Features

- **Community Voting System**: Each user gets 5 votes to distribute among books
- **Book Collection**: Browse and vote on 52+ inspiring books
- **Real-time Updates**: Vote counts update instantly
- **Authentication**: Secure email/password login system
- **Responsive Design**: Works perfectly on desktop and mobile
- **Direct Database Operations**: Fast, reliable database interactions

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **Notifications**: Sonner

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ideenfunken-clean
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit `.env` and add your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## 📊 Database Schema

The app uses the following Supabase tables:

- `books` - Book information (title, author, description, votes, etc.)
- `book_votes` - User voting records
- `profiles` - User profile data

## 🗳️ How Voting Works

1. **Login Required**: Users must authenticate to vote
2. **5 Vote Limit**: Each user gets exactly 5 votes
3. **One Vote Per Book**: Maximum 1 vote per book per user
4. **Real-time Feedback**: Vote counts update immediately
5. **Vote Management**: Users can add/remove votes freely within their limit

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## 🎯 Project Goals

This app was created to:
- Foster innovation in the Schwarzwald region
- Create a community-driven book selection process
- Support local libraries with curated, inspiring literature
- Provide a modern, user-friendly voting experience

## 🔐 Security Features

- Environment variables for sensitive data
- Row Level Security (RLS) on database
- Input validation and sanitization
- Direct database operations (no CSP issues)

## 🤝 Contributing

This is a community project. Feel free to:
- Report issues
- Suggest new features
- Submit pull requests
- Improve documentation

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Funded by Simon Group from Aichhalden (€1,500)
- Built for the Black Forest community
- Designed to promote inspiring literature