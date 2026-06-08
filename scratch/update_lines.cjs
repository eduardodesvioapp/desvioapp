const fs = require('fs');
const path = require('path');
const dir = 'd:/AG/desvio/src/pages';

const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf-8');
    const original = content;
    
    content = content.replace(/className="h-\[1px\] flex-1 bg-white\/10"/g, 'className="h-[1px] flex-1 bg-[#FF5500]"');
    
    if (content !== original) {
        fs.writeFileSync(p, content, 'utf-8');
        console.log(`Updated ${file}`);
    }
});
