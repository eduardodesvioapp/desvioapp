const https = require('https');
require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.VITE_GEMINI_API_KEY;

function main() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
  
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      try {
        const obj = JSON.parse(data);
        const filtered = (obj.models || [])
          .filter(m => m.supportedGenerationMethods.includes('generateContent'))
          .map(m => m.name);
        console.log('Modelos com generateContent:', filtered);
      } catch (e) {
        console.log(data);
      }
    });
  }).on('error', console.error);
}

main();
