# Agentic-travel-planner
**AI-Powered Travel Itinerary Generator using Gemini API**

---

## 🚀 Overview

Agentic Travel Planner is a full-stack web application that generates **personalized, day-wise travel itineraries** using Google’s **Gemini Generative AI API**.
Users can describe a trip in natural language, choose preferences like duration and travel style, optionally upload an image for inspiration, and instantly receive a structured travel plan.

The application works as an **AI travel agent**, transforming a single prompt into a complete itinerary with activities, food suggestions, travel tips, and map visualization.

---

## ✨ Features

* Natural language trip planning
* Day-wise structured itinerary generation
* Optional image-based inspiration
* Interactive maps using OpenStreetMap
* Travel history stored locally
* Modern UI with glassmorphism & dark mode
* Fully deployed and shareable

---

## 🛠 Tech Stack

### Frontend

* HTML, CSS, JavaScript
* Leaflet.js (Maps)
* Hosted on **GitHub Pages**

### Backend

* Node.js & Express.js
* Multer (image uploads)
* Hosted on **Render**

### AI

* **Google Gemini API**
---
## 🌐 Deployment

### Frontend

* Deploy using **GitHub Pages**
* Select root or `/docs` as required

### Backend

* Deploy using **Render**
* Set **Environment Variables** in Render dashboard:

  * `GEMINI_API_KEY`
  * `PORT`

---

## 🔐 Mandatory API Key Usage Disclaimer

> **Important Notice**

This project uses the **Google Gemini API**, which requires a **personal API key**.

* ❌ **DO NOT** upload your `.env` file to GitHub
* ❌ **DO NOT** expose your API key in frontend code
* ✅ Always use environment variables for API keys
* ✅ Use `.env.example` for reference only

Each user or developer must:

1. Create their own Gemini API key from Google AI Studio
2. Add the key as an environment variable before running or deploying the backend

Any misuse, leakage, or unauthorized sharing of API keys is the **sole responsibility of the user**.
