const https = require('https');
require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.VITE_GEMINI_API_KEY;

async function testModel(model) {
  return new Promise((resolve) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
    
    const payload = JSON.stringify({
      contents: [{
        role: 'user',
        parts: [{ text: 'Oi, tudo bem?' }]
      }]
    });

    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`\n=== TESTE MODELO: ${model} ===`);
        console.log(`Status: ${res.statusCode}`);
        try {
          const obj = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log('✅ SUCESSO:', obj.candidates[0].content.parts[0].text.trim());
            resolve(true);
          } else {
            console.error('❌ ERRO:', obj.error.message);
            resolve(false);
          }
        } catch (e) {
          console.log(data);
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.error(e);
      resolve(false);
    });
    req.write(payload);
    req.end();
  });
}

async function main() {
  await testModel('gemini-flash-lite-latest');
  await testModel('gemini-2.5-flash-lite');
  await testModel('gemini-3.1-flash-lite');
}

main();
