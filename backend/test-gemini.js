// test-gemini.js
// Direct test of Gemini API with your key

const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function testGemini(){
  console.log('Testing Gemini API...');
  console.log('API Key:', GEMINI_API_KEY ? '✓ Found' : '✗ Missing');
  
  if(!GEMINI_API_KEY){
    console.error('❌ GEMINI_API_KEY not set in .env');
    process.exit(1);
  }

  try{
    const ai = new GoogleGenAI({});
    
    console.log('\nCalling gemini-2.5-flash with test prompt...');
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { type: 'text', text: 'Respond with JSON only: {"test": "success", "message": "Gemini is working"}' }
      ]
    });

    console.log('\n✓ API Response received!');
    console.log('Response text:', response.text);
    
    // Try to parse as JSON
    try{
      const json = JSON.parse(response.text);
      console.log('✓ Valid JSON parsed:', json);
    }catch(e){
      console.log('⚠️ Response is not JSON:', response.text);
    }
    
  }catch(err){
    console.error('\n❌ Gemini API Error:');
    console.error('Message:', err.message);
    console.error('Code:', err.code || 'N/A');
    console.error('Full error:', err);
  }
}

testGemini();
