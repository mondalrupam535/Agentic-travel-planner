// agent.js
// Updated to use the official @google/genai SDK per integration manual.

const { GoogleGenAI } = require('@google/genai');
const { generateItinerarySchema } = require('./functions');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Instantiate client. The SDK will pick up GEMINI_API_KEY from env when available.
const ai = new GoogleGenAI({});

function extractJsonFromText(text){
  if(!text) return null;
  
  // Remove markdown code blocks (```json ... ```)
  let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  
  // Try direct parse
  try{ return JSON.parse(cleaned); }catch(e){}

  // Fallback: find first { and last }
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if(first !== -1 && last !== -1 && last > first){
    const sub = cleaned.substring(first, last + 1);
    try{ return JSON.parse(sub); }catch(e){}
  }
  return null;
}

async function callGeminiViaGenAI(promptText, imageBuffer, imageMime){
  if(!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set in environment');

  // Build a system prompt that enforces JSON output and mentions the function schema.
  const systemPrompt = `You are an expert travel planner. Use the user's natural-language prompt and the provided image aesthetics to craft a travel itinerary. Always produce a single JSON object that matches the generate_itinerary schema exactly (destination, trip_style, total_days, daily_itinerary). Do NOT include text, explanations, or markdown outside the JSON. The JSON must be parseable.`;

  const contents = [
    { type: 'text', text: systemPrompt },
    { type: 'text', text: promptText }
  ];

  if(imageBuffer){
    // Attach image as base64 data in the request body so the multimodal model can use aesthetics.
    const b64 = imageBuffer.toString('base64');
    contents.push({ type: 'image', image: { mime: imageMime || 'image/jpeg', b64: b64 } });
  }

  // Retry with exponential backoff for transient 503/UNAVAILABLE errors
  const maxRetries = 4;
  const baseDelay = 600; // ms

  function wait(ms){ return new Promise(r=>setTimeout(r, ms)); }

  for(let attempt=0; attempt<=maxRetries; attempt++){
    try{
      const resp = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents });
      const rawText = resp?.text || (resp?.output && Array.isArray(resp.output) ? resp.output.map(o=> (o.content||[]).map(c=>c.text||'').join('\n')).join('\n') : null) || '';
      return rawText;
    }catch(err){
      // Inspect the error message for 503/unavailable indications
      const msg = err && err.message ? String(err.message) : '';
      const isOverloaded = /\b503\b/.test(msg) || /UNAVAILABLE/.test(msg) || /model is overloaded/i.test(msg);

      // If not a transient overload, rethrow immediately
      if(!isOverloaded) throw err;

      // If last attempt, throw a controlled error with statusCode for the HTTP layer
      if(attempt === maxRetries){
        const e = new Error('Gemini model is overloaded. Please try again later.');
        e.statusCode = 503;
        throw e;
      }

      // Otherwise wait with exponential backoff + jitter then retry
      const delay = Math.round(baseDelay * Math.pow(2, attempt) * (0.7 + Math.random()*0.6));
      console.warn(`Gemini overloaded (attempt ${attempt+1}/${maxRetries}). Retrying in ${delay}ms`);
      await wait(delay);
      continue;
    }
  }
  // Should not reach here, but guard
  const e = new Error('Gemini call failed after retries');
  e.statusCode = 503;
  throw e;
}

async function planTrip(promptText, imageBuffer, imageMime){
  // Always use Gemini API (no fallback to mock generator).
  if(!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is required');

  try{
    const raw = await callGeminiViaGenAI(promptText, imageBuffer, imageMime);

    // Attempt to extract JSON from the model output.
    const parsed = extractJsonFromText(raw);
    if(!parsed) throw new Error('Model did not return valid JSON');

    // Normalize and validate the parsed itinerary to avoid undefined fields in frontend
    function normalize(itin){
      const out = Object.assign({}, itin);
      out.destination = out.destination || 'Unknown destination';
      out.trip_style = out.trip_style || 'Leisure';
      out.total_days = out.total_days || (Array.isArray(out.daily_itinerary) ? out.daily_itinerary.length : 0);
      out.daily_itinerary = Array.isArray(out.daily_itinerary) ? out.daily_itinerary : [];

      out.daily_itinerary = out.daily_itinerary.map((d, idx)=>{
        const day = Object.assign({}, d);
        day.day = typeof day.day === 'number' ? day.day : (idx+1);
        day.city = day.city || out.destination || `Day ${day.day}`;
        day.activities = Array.isArray(day.activities) ? day.activities : (day.activities ? [String(day.activities)] : []);
        day.food_recommendations = Array.isArray(day.food_recommendations) ? day.food_recommendations : (day.food_recommendations ? [String(day.food_recommendations)] : []);
        day.travel_tips = Array.isArray(day.travel_tips) ? day.travel_tips : (day.travel_tips ? [String(day.travel_tips)] : []);
        return day;
      });

      return out;
    }

    return normalize(parsed);
  }catch(err){
    console.error('Gemini API error:', err.message);
    throw err;
  }
}

module.exports = { planTrip };
