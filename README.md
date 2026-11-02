# SixDigit — FastAPI 6-Digit URL Shortener

A clean, clutter-free web client and full-stack service for shortening long URLs into 6-digit numeric codes (`0-9`), built around the FastAPI contract in `main.py` and configured for zero-config deployment on **Vercel**.

## Deploy to Vercel

This project includes `vercel.json` and `api/index.ts` so both the Vite React frontend (`dist/`) and the API routes (`POST /shorten`, `GET /api/links`, `GET /api/resolve/:short_code`, and `GET /:short_code`) work out of the box on Vercel.

### Option 1: Deploy via Vercel Dashboard (GitHub Import)
1. Push `vercel.json` and `api/index.ts` to [https://github.com/Raunaq12/SixDigit](https://github.com/Raunaq12/SixDigit).
2. Open [https://vercel.com/new](https://vercel.com/new) and import `Raunaq12/SixDigit`.
3. Keep the auto-detected settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click **Deploy**.

### Option 2: Deploy via Vercel CLI
```bash
npx vercel --prod
```

## Running Locally

### Full-Stack Preview (Frontend + Express API Mirror on Port 3000)
```bash
npm install
npm run dev
```

### Standalone FastAPI Backend (`main.py` on Port 8000)
```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## API Endpoints

### `POST /shorten`
- **Request Body**:
  ```json
  {
    "url": "https://fastapi.tiangolo.com/tutorial/"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "short_url": "http://localhost:8000/482910"
  }
  ```

### `GET /{short_code}`
- **Success (`307 Temporary Redirect`)**: Redirects to the original URL stored in `url_store[short_code]`.
- **Not Found (`404 Not Found`)**:
  ```json
  {
    "detail": "URL not found."
  }
  ```
