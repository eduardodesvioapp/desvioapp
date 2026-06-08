const https = require('https');
require('dotenv').config({ path: '.env.local' });

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;

function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
  
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        if (parsed.models) {
          console.log('\n=== MODELOS DISPONÍVEIS (FILTRADO) ===\n');
          parsed.models.forEach(m => {
            if (m.name.includes('flash') || m.name.includes('pro')) {
              console.log(`- ${m.name}`);
            }
          });
        }
      } catch (e) {
        console.error(e);
      }
    });
  });
}

listModels();
