# Cloudbeds Rate Copier

A web application to copy hotel room type rates from the current year to future years using the Cloudbeds API.

## Features

- 🏨 Load all room types for a property
- 💰 View current rates for a specific date
- 📅 Copy rates to multiple future years (2026-2029)
- ✨ Modern, intuitive user interface
- 🔄 Real-time feedback on copy operations

## Prerequisites

- Python 3.11+
- Cloudbeds API Bearer Token
- Property ID from your Cloudbeds account

## Local Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd rate_copier
```

### 2. Create a virtual environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the application

```bash
python app.py
```

The application will be available at `http://localhost:5000`

### 5. Configure in the UI

Open your browser and enter:
- **Bearer Token**: Your Cloudbeds API Bearer Token
- **Property ID**: Your Cloudbeds property ID

No need to set up environment variables - everything is entered directly in the web interface!

## Using the Application

1. **Enter Bearer Token**: Enter your Cloudbeds API Bearer Token (from Cloudbeds API Console)
2. **Enter Property ID**: Enter your Cloudbeds property ID
3. **Select Reference Date**: Choose the date you want to copy rates from (default is current date in 2025)
4. **Load Room Types**: Click "Load Room Types" to fetch all room types and their rates
5. **Select Years**: For each room type, check the years you want to copy rates to (2026-2029)
6. **Copy Rates**: Click "Copy Rates" to execute the copy operation
7. **View Results**: See the results of the copy operation with success/failure indicators

## GitHub Setup

### 1. Initialize Git repository

```bash
git init
git add .
git commit -m "Initial commit: Cloudbeds Rate Copier"
```

### 2. Create GitHub repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Don't initialize with README (we already have one)

### 3. Connect and push

```bash
git remote add origin https://github.com/yourusername/rate-copier.git
git branch -M main
git push -u origin main
```

## Heroku Deployment

### 1. Install Heroku CLI

Download and install from [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)

### 2. Login to Heroku

```bash
heroku login
```

### 3. Create Heroku app

```bash
heroku create your-app-name
```

### 4. Set environment variables

```bash
heroku config:set CLOUDBEDS_TOKEN=your_bearer_token_here
```

### 5. Deploy to Heroku

```bash
git push heroku main
```

### 6. Open your application

```bash
heroku open
```

### 7. View logs (if needed)

```bash
heroku logs --tail
```

## Environment Variables

The Bearer Token can be entered directly in the UI or set as an environment variable:

| Variable | Description | Required |
|----------|-------------|----------|
| `CLOUDBEDS_TOKEN` | Your Cloudbeds API Bearer Token (optional - can be entered in UI) | No |
| `PORT` | Port number (set automatically by Heroku) | No |

**Note:** For production/Heroku deployment, it's recommended to set `CLOUDBEDS_TOKEN` as an environment variable for security. For local development, you can simply enter it in the web interface.

## API Endpoints Used

- **GET** `/getRate`: Fetch rates for a room type on a specific date
- **POST** `/putRate`: Create/update rates for a room type
- **GET** `/getRoomTypes`: Fetch all room types for a property

## Project Structure

```
rate_copier/
├── app.py                  # Main Flask application
├── templates/
│   └── index.html         # Frontend UI
├── static/
│   └── css/
│       └── style.css      # Styling
├── requirements.txt       # Python dependencies
├── Procfile              # Heroku configuration
├── runtime.txt           # Python version for Heroku
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## Troubleshooting

### Local Development

**Issue**: "Module not found" error
- **Solution**: Make sure you've activated your virtual environment and installed dependencies

**Issue**: "Bearer token not found"
- **Solution**: Set the `CLOUDBEDS_TOKEN` environment variable

### Heroku Deployment

**Issue**: Application crashes on Heroku
- **Solution**: Check logs with `heroku logs --tail`
- Verify environment variables are set: `heroku config`

**Issue**: "No web processes running"
- **Solution**: Scale your dynos: `heroku ps:scale web=1`

## Security Notes

- Never commit your `.env` file or Bearer token to Git
- The `.gitignore` file is configured to exclude sensitive files
- Always use environment variables for API credentials

## API Rate Limits

Be aware of Cloudbeds API rate limits when copying rates for multiple room types and years.

## License

MIT

## Support

For issues with the Cloudbeds API, refer to:
- [Cloudbeds API Documentation](https://developers.cloudbeds.com/)
- [API Reference](https://developers.cloudbeds.com/reference)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request