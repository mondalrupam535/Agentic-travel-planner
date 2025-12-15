// functions.js
// Defines the function schema for the agent's function-calling interface.

const generateItinerarySchema = {
  name: 'generate_itinerary',
  description: 'Generate a structured travel itinerary JSON using the prompt and image aesthetics',
  parameters: {
    type: 'object',
    properties: {
      destination: { type: 'string', description: 'Primary destination or region' },
      trip_style: { type: 'string', description: 'Trip vibe / style (e.g., romantic, adventure, foodie)' },
      total_days: { type: 'number', description: 'Total number of days' },
      daily_itinerary: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            day: { type: 'number' },
            city: { type: 'string' },
            activities: { type: 'array', items: { type: 'string' } },
            food_recommendations: { type: 'array', items: { type: 'string' } },
            travel_tips: { type: 'array', items: { type: 'string' } }
          },
          required: ['day','city','activities']
        }
      }
    },
    required: ['destination','trip_style','total_days','daily_itinerary']
  }
};

module.exports = { generateItinerarySchema };
