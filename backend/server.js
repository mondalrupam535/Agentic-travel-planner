// server.js
// Express server: accepts a prompt + optional image and returns a structured itinerary JSON

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { planTrip } = require('./agent');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

app.post('/plan-trip', upload.single('image'), async (req, res) => {
  try{
    const prompt = req.body.prompt;
    if(!prompt) return res.status(400).json({error:'Missing prompt'});

    const image = req.file;
    const imageBuffer = image ? image.buffer : null;
    const imageMime = image ? image.mimetype : null;

    const itinerary = await planTrip(prompt, imageBuffer, imageMime);

    // Validate basic shape
    if(!itinerary || !itinerary.destination) return res.status(500).json({error:'Invalid itinerary returned'});

    res.json(itinerary);
  }catch(err){
    console.error(err);
    // Pass through 503 status when Gemini is overloaded
    const status = err && err.statusCode ? err.statusCode : 500;
    const message = (err && err.message) ? err.message : 'Internal server error';
    res.status(status).json({error: message});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Agentic Travel Planner backend listening on http://localhost:${PORT}`));
