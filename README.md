# 🏦 Vault Auction

A modern real-time online auction platform where users can register, list valuable items, participate in live auctions, place bids in real-time, and track auction activities seamlessly.

🌐 **Live Demo:** https://vault-auction-oyjrobaxo-cmr14.vercel.app/

---

## 🚀 Features

* 🔐 User Authentication (Register & Login)
* 👤 Role-based Access (User/Admin)
* 📦 Create and Manage Auction Items
* 🖼️ Upload Item Images
* 💸 Real-Time Bidding using Socket.IO
* 🏆 Leaderboard System
* 📊 User Dashboard
* ⚡ Live Auction Updates
* 🔄 Automated Auction Scheduler
* 🛡️ JWT-based Secure Authentication

---

## 🛠️ Tech Stack

### Frontend

* Next.js
* React.js
* Tailwind CSS
* Zustand
* Socket.IO Client

### Backend

* Node.js
* Express.js
* Socket.IO
* JWT Authentication
* Multer

### Database & ORM

* PostgreSQL (Neon)
* Prisma ORM

### Deployment

* Frontend: Vercel
* Backend: Render
* Database: Neon

---

## 📂 Project Structure

```bash
vault-auction/
│
├── client/          # Next.js Frontend
├── server/          # Express Backend
│   ├── prisma/      # Prisma Schema & Migrations
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   └── services/
│
├── .gitignore
└── README.md
```

---

## ⚙️ Environment Variables

### Backend (.env)

```env
DATABASE_URL=your_neon_database_url
JWT_SECRET=your_secret_key
PORT=5000
CLIENT_URL=http://localhost:3000
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## 🔧 Installation & Setup

### Clone the repository

```bash
git clone https://github.com/sameera1406/Vault_Auction_Complete.git
cd Vault_Auction_Complete
```

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

Frontend runs on:

```bash
http://localhost:3000
```

### Backend Setup

```bash
cd server
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Backend runs on:

```bash
http://localhost:5000
```

---

## 🌍 Deployment

### Frontend

Deployed on Vercel:

https://vault-auction-oyjrobaxo-cmr14.vercel.app/

### Backend

Deployed on Render.

---

## 📸 Screenshots

Add screenshots of:

* Home Page
* Dashboard
* Auction Details Page
* Login/Register Page
* Leaderboard

---

## 🔮 Future Enhancements

* Payment Gateway Integration
* Email Notifications
* Auction Categories & Filters
* User Profile Management
* Watchlist Feature
* AI-based Auction Recommendations

---

## 👨‍💻 Author

**Sangadi Chiru Sameera**

* GitHub: https://github.com/sameera1406

---

## ⭐ Support

If you like this project, please give it a ⭐ on GitHub!

---

## 📜 License

This project is developed for educational and portfolio purposes.
