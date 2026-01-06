# Cloudbeds Rate Copier - Quick Reference

## 🚀 Getting Started Locally

### Option 1: Quick Start (Easiest)
```bash
# Linux/Mac
./start.sh

# Windows
start.bat
```

### Option 2: Manual Setup
```bash
# 1. Create virtual environment
python -m venv venv

# 2. Activate it
source venv/bin/activate  # Linux/Mac
# OR
venv\Scripts\activate  # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the app
python app.py
```

Visit: **http://localhost:5000**

**Then in the browser:**
- Enter your Bearer Token
- Enter your Property ID
- Start using the app!

---

## 📦 GitHub Setup

```bash
# Initialize repo
git init
git add .
git commit -m "Initial commit"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

---

## ☁️ Heroku Deployment

```bash
# Login
heroku login

# Create app
heroku create your-app-name

# Set environment variable
heroku config:set CLOUDBEDS_TOKEN=your_token_here

# Deploy
git push heroku main

# Open app
heroku open
```

---

## 🔧 Key Configuration

**Enter directly in the web UI:**
- `Bearer Token` - Your Cloudbeds API Bearer Token
- `Property ID` - Your Cloudbeds property ID

**Get your token from:**
- Cloudbeds API Console

**Optional:** You can also set the Bearer Token as an environment variable `CLOUDBEDS_TOKEN` for production use.

---

## 📁 Project Structure

```
rate_copier/
├── app.py                 # Main Flask application
├── templates/
│   └── index.html        # Frontend UI
├── static/
│   └── css/
│       └── style.css     # Styling
├── requirements.txt      # Dependencies
├── Procfile             # Heroku config
├── runtime.txt          # Python version
├── .env.example         # Environment template
├── README.md            # Full documentation
├── DEPLOYMENT.md        # Detailed deployment guide
├── start.sh             # Quick start (Linux/Mac)
└── start.bat            # Quick start (Windows)
```

---

## 🎯 How to Use the App

1. Enter your **Bearer Token** (from Cloudbeds API Console)
2. Enter your **Property ID**
3. Select a **Reference Date** (the date to copy rates from)
4. Click **Load Room Types**
5. For each room type:
   - View the current rate for the reference date
   - Select future years (2026-2029) to copy to
   - Click **Copy Rates**
6. View results showing success/failure for each year

---

## 📊 API Endpoints Used

- **GET** `/api/v1.2/getRate` - Fetch rates
- **POST** `/api/v1.2/putRate` - Update rates
- **GET** `/api/v1.2/getRoomTypes` - Fetch room types

---

## ⚡ Quick Commands

**Local Development:**
```bash
python app.py                    # Run app
pip install -r requirements.txt  # Install deps
```

**Heroku:**
```bash
heroku logs --tail              # View logs
heroku restart                  # Restart app
heroku config                   # View env vars
heroku ps                       # Check dynos
```

**Git:**
```bash
git status                      # Check status
git add .                       # Stage changes
git commit -m "message"         # Commit
git push                        # Push to GitHub
git push heroku main            # Deploy to Heroku
```

---

## 🐛 Common Issues

**"Module not found"**
→ Activate venv and run `pip install -r requirements.txt`

**"Bearer token is required"**
→ Enter your Bearer Token in the web UI

**Heroku app crashed**
→ Check logs: `heroku logs --tail`
→ Verify env var: `heroku config`

---

## 📚 Full Documentation

- **README.md** - Complete project documentation
- **DEPLOYMENT.md** - Detailed deployment guide
- **Cloudbeds API Docs** - https://developers.cloudbeds.com

---

## 🎨 Features

✅ Modern, responsive UI
✅ Real-time rate loading
✅ Multi-year selection
✅ Batch rate copying
✅ Success/error tracking
✅ Mobile-friendly design

---

Ready to go! 🎉