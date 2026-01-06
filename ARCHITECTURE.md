# Application Architecture

## System Flow

```
┌─────────────┐
│   Browser   │
│   (User)    │
└──────┬──────┘
       │
       │ HTTP Request
       ▼
┌──────────────────────────────────────────┐
│         Flask Application (app.py)        │
│                                          │
│  Routes:                                 │
│  • GET  /                → index.html   │
│  • GET  /api/room-types  → Room types   │
│  • GET  /api/rates       → Get rates    │
│  • POST /api/copy-rates  → Copy rates   │
└──────┬───────────────────────────────────┘
       │
       │ API Requests
       ▼
┌──────────────────────────────────────────┐
│      Cloudbeds API (v1.2)                │
│                                          │
│  Endpoints:                              │
│  • GET  /getRoomTypes                    │
│  • GET  /getRate                         │
│  • POST /putRate                         │
└──────────────────────────────────────────┘
```

## Data Flow: Copying Rates

```
1. User Selects Date & Property
        ↓
2. Load Room Types
        ↓
   ┌────────────────┐
   │ GET /getRoomTypes │  → Cloudbeds API
   └────────────────┘
        ↓
3. For Each Room Type: Load Current Rate
        ↓
   ┌────────────────┐
   │  GET /getRate  │  → Cloudbeds API
   └────────────────┘
        ↓
4. User Selects Years (2026-2029)
        ↓
5. Click "Copy Rates"
        ↓
6. For Each Selected Year:
        ↓
   ┌────────────────┐
   │  POST /putRate │  → Cloudbeds API
   └────────────────┘
        ↓
7. Display Results (Success/Failure)
```

## Component Structure

```
Frontend (HTML/CSS/JavaScript)
├── Configuration Panel
│   ├── Property ID Input
│   └── Date Picker
├── Room Types List
│   ├── Room Type Card 1
│   │   ├── Rate Display
│   │   ├── Year Checkboxes
│   │   └── Copy Button
│   ├── Room Type Card 2
│   └── ...
└── Results Panel
    └── Copy Results

Backend (Flask/Python)
├── API Routes
│   ├── /api/room-types
│   ├── /api/rates
│   └── /api/copy-rates
├── API Integration
│   ├── get_room_types()
│   ├── get_rate()
│   └── copy_rate_to_year()
└── Helper Functions
    └── get_headers()
```

## Deployment Architecture

### Local Development
```
Developer Machine
└── Python Virtual Environment
    └── Flask Dev Server (localhost:5000)
```

### Production (Heroku)
```
Internet
  ↓
Heroku Router
  ↓
Heroku Dyno
  ├── Gunicorn Server
  │   └── Flask Application
  └── Environment Variables
      └── CLOUDBEDS_TOKEN
```

## Authentication Flow

```
1. User requests data
        ↓
2. Flask app retrieves Bearer Token
   from environment variable
        ↓
3. Add token to request header:
   Authorization: Bearer {token}
        ↓
4. Send request to Cloudbeds API
        ↓
5. API validates token
        ↓
6. Return data to Flask
        ↓
7. Flask processes and sends to user
```

## Error Handling

```
API Request
    ↓
┌───────────────┐
│ Try API Call  │
└───────┬───────┘
        │
    ┌───▼───┐
    │Success?│
    └───┬───┘
        │
   Yes  │  No
    ┌───▼───────────┐
    │ Return Data   │
    └───────────────┘
        │           │
        │           └──→ Log Error
        │                     │
        │                     ▼
        │           Return Error Message
        │                     │
        └─────────────────────┘
                      │
                      ▼
              Display to User
```

## File Organization

```
rate_copier/
│
├── Backend (Python)
│   ├── app.py                    # Main application
│   ├── requirements.txt          # Dependencies
│   └── Procfile                  # Heroku process
│
├── Frontend (Templates & Static)
│   ├── templates/
│   │   └── index.html           # Main UI
│   └── static/
│       └── css/
│           └── style.css        # Styling
│
├── Configuration
│   ├── .env.example             # Env template
│   ├── .gitignore               # Git exclusions
│   └── runtime.txt              # Python version
│
└── Documentation
    ├── README.md                 # Main docs
    ├── DEPLOYMENT.md             # Deploy guide
    └── QUICK_START.md            # Quick ref
```

## Key Technologies

- **Backend**: Python 3.11, Flask 3.0
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **API Client**: Python Requests library
- **Server**: Gunicorn (production)
- **Hosting**: Heroku
- **Version Control**: Git/GitHub
- **API**: Cloudbeds REST API v1.2

## Security Considerations

```
┌─────────────────────────────────────┐
│ Environment Variables (Secure)      │
│ • CLOUDBEDS_TOKEN                   │
│ • Stored in .env (local)            │
│ • Stored in Heroku Config (prod)    │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ .gitignore                          │
│ • Prevents .env from being committed│
│ • Protects sensitive data           │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ HTTPS Communication                 │
│ • All API calls use HTTPS           │
│ • Bearer token in header            │
└─────────────────────────────────────┘
```

## Scalability Notes

**Current Capacity:**
- Single Heroku dyno
- Synchronous processing
- Sequential API calls

**For Higher Volume:**
- Add background job queue (Celery)
- Implement async API calls
- Add caching layer (Redis)
- Scale dynos horizontally

**Rate Limiting:**
- Cloudbeds API has rate limits
- Current implementation: Sequential calls
- Consider batch operations for large datasets