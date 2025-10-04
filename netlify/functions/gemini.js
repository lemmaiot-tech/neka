// Netlify Function: server-side proxy for Gemini API
// Reads GEMINI_API_KEY from process.env and forwards requests to the Gemini endpoint.
const fetch = require('node-fetch');

exports.handler = async function(event) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'GEMINI_API_KEY not configured' })
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    // Replace with actual Gemini API URL and expected payload
    const res = await fetch('https://api.example-gemini.com/v1/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    return {
      statusCode: res.status,
      body: JSON.stringify(data)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
