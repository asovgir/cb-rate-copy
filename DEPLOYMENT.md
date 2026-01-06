# Deployment Guide - Cloudbeds Rate Copier

## Table of Contents
1. [Local Development](#local-development)
2. [GitHub Setup](#github-setup)
3. [Heroku Deployment](#heroku-deployment)
4. [Troubleshooting](#troubleshooting)

---

## Local Development

### Quick Start (Recommended)

**Linux/Mac:**
```bash
./start.sh
```

**Windows:**
```cmd
start.bat
```

### Manual Setup

#### Step 1: Create Virtual Environment
```bash
python -m venv venv
```

#### Step 2: Activate Virtual Environment
**Linux/Mac:**
```bash
source venv/bin/activate
```

**Windows:**
```cmd
venv\Scripts\activate
```

#### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

#### Step 4: Configure Environment Variables
Create `.env` file:
```
CLOUDBEDS_TOKEN=your_bearer_token_here
```

#### Step 5: Run Application
```bash
python app.py
```

Visit: http://localhost:5000

---

## GitHub Setup

### First Time Setup

#### Step 1: Initialize Repository
```bash
cd rate_copier
git init
```

#### Step 2: Add Files
```bash
git add .
git commit -m "Initial commit: Cloudbeds Rate Copier"
```

#### Step 3: Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `cloudbeds-rate-copier` (or your choice)
3. Don't initialize with README
4. Create repository

#### Step 4: Connect and Push
```bash
git remote add origin https://github.com/YOUR_USERNAME/cloudbeds-rate-copier.git
git branch -M main
git push -u origin main
```

### Future Updates

```bash
git add .
git commit -m "Description of changes"
git push
```

---

## Heroku Deployment

### Prerequisites
- Heroku account (free tier is fine)
- Heroku CLI installed
- Git repository initialized

### Step 1: Install Heroku CLI

**Mac:**
```bash
brew tap heroku/brew && brew install heroku
```

**Windows:**
Download from: https://devcenter.heroku.com/articles/heroku-cli

**Linux:**
```bash
curl https://cli-assets.heroku.com/install.sh | sh
```

### Step 2: Login to Heroku
```bash
heroku login
```
(This will open your browser for authentication)

### Step 3: Create Heroku App
```bash
heroku create your-app-name
```
Note: App name must be unique across all Heroku. If your choice is taken, try:
- `your-name-rate-copier`
- `cloudbeds-rate-copier-yourname`

### Step 4: Set Environment Variables
```bash
heroku config:set CLOUDBEDS_TOKEN=your_bearer_token_here
```

Verify:
```bash
heroku config
```

### Step 5: Deploy Application

#### Option A: Deploy from Local Repository
```bash
git push heroku main
```

#### Option B: Connect to GitHub (Recommended)
1. Go to https://dashboard.heroku.com/apps/your-app-name
2. Click "Deploy" tab
3. Choose "GitHub" as deployment method
4. Connect to your GitHub repository
5. Enable "Automatic Deploys" from main branch
6. Click "Deploy Branch" for manual deploy

### Step 6: Open Application
```bash
heroku open
```

Or visit: https://your-app-name.herokuapp.com

### Step 7: Monitor Logs
```bash
heroku logs --tail
```

---

## Heroku Management Commands

### View App Info
```bash
heroku info
```

### Restart App
```bash
heroku restart
```

### Scale Dynos
```bash
heroku ps:scale web=1
```

### View Current Dynos
```bash
heroku ps
```

### Update Environment Variable
```bash
heroku config:set CLOUDBEDS_TOKEN=new_token_here
```

### Remove Environment Variable
```bash
heroku config:unset CLOUDBEDS_TOKEN
```

---

## Troubleshooting

### Local Development Issues

#### "Module not found" Error
**Problem:** Missing Python packages
**Solution:**
```bash
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

#### "Bearer token not found"
**Problem:** Environment variable not set
**Solution:**
```bash
# Create .env file
echo "CLOUDBEDS_TOKEN=your_token" > .env

# Or set in terminal
export CLOUDBEDS_TOKEN=your_token  # Linux/Mac
set CLOUDBEDS_TOKEN=your_token     # Windows
```

#### Port Already in Use
**Problem:** Port 5000 is being used
**Solution:**
```bash
export PORT=8000  # Linux/Mac
set PORT=8000     # Windows
```

### GitHub Issues

#### Authentication Failed
**Problem:** Can't push to GitHub
**Solution:**
```bash
# Use Personal Access Token instead of password
# Generate at: https://github.com/settings/tokens
```

#### Wrong Remote URL
**Problem:** Pushing to wrong repository
**Solution:**
```bash
git remote -v  # Check current remote
git remote set-url origin https://github.com/YOUR_USERNAME/REPO_NAME.git
```

### Heroku Issues

#### Application Error (H10)
**Problem:** Application crashed on startup
**Solution:**
```bash
heroku logs --tail
# Check for:
# - Missing environment variables
# - Incorrect Procfile
# - Missing dependencies
```

#### No Web Processes Running
**Problem:** Dyno not started
**Solution:**
```bash
heroku ps:scale web=1
```

#### Build Failed
**Problem:** Deployment build errors
**Solution:**
```bash
# Check runtime.txt Python version
# Ensure all dependencies in requirements.txt
# Verify Procfile exists and is correct
```

#### Environment Variable Not Set
**Problem:** App can't find CLOUDBEDS_TOKEN
**Solution:**
```bash
heroku config:set CLOUDBEDS_TOKEN=your_token_here
heroku restart
```

---

## Best Practices

### Security
- ✅ Never commit `.env` file to Git
- ✅ Use environment variables for all secrets
- ✅ Rotate API tokens periodically
- ✅ Use HTTPS in production

### Development
- ✅ Always work in virtual environment
- ✅ Keep requirements.txt updated
- ✅ Test locally before deploying
- ✅ Use meaningful commit messages

### Deployment
- ✅ Enable automatic deploys from GitHub
- ✅ Monitor application logs
- ✅ Set up error tracking (optional)
- ✅ Keep dependencies updated

---

## Quick Reference

### Local URLs
- Application: http://localhost:5000
- Alternative port: http://localhost:8000

### Heroku URLs
- Dashboard: https://dashboard.heroku.com
- App URL: https://your-app-name.herokuapp.com
- Logs: `heroku logs --tail`

### Important Files
- `app.py` - Main application
- `requirements.txt` - Python dependencies
- `Procfile` - Heroku process configuration
- `runtime.txt` - Python version
- `.env` - Local environment variables (don't commit!)
- `.env.example` - Template for .env

---

## Support Resources

- Cloudbeds API Docs: https://developers.cloudbeds.com
- Heroku Dev Center: https://devcenter.heroku.com
- Flask Documentation: https://flask.palletsprojects.com
- Git Documentation: https://git-scm.com/doc

---

## Updating the Application

### Pull Latest Changes
```bash
git pull origin main
pip install -r requirements.txt  # if dependencies changed
```

### Make Changes
```bash
# Edit files
git add .
git commit -m "Description of changes"
git push
```

### Deploy to Heroku
If automatic deploys enabled: Changes deploy automatically
If manual: `git push heroku main`

---

## Cost Estimates

### Free Tier (Both GitHub and Heroku Free)
- ✅ GitHub: Unlimited public/private repos
- ✅ Heroku: 550-1000 free dyno hours/month
- ✅ Enough for development and light production use

### Paid Tier (If Needed)
- Heroku Hobby: $7/month (never sleeps)
- Heroku Standard: $25-50/month (more resources)

---

Good luck with your deployment! 🚀