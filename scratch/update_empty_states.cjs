const fs = require('fs');
const path = require('path');
const dir = 'd:/AG/desvio/src/pages';

const files = ['Visitors.jsx', 'Matches.jsx', 'LikedMe.jsx'];

files.forEach(file => {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf-8');
    const original = content;
    
    // Replace the container
    content = content.replace(
        /className="w-20 h-20 bg-white\/5 rounded flex items-center justify-center mb-6"/g, 
        'className="w-20 h-20 bg-primary/10 rounded flex items-center justify-center mb-6 border border-primary/20"'
    );
    
    // Replace the icon color
    content = content.replace(
        /className="material-symbols-outlined text-4xl text-white\/20"/g,
        'className="material-symbols-outlined text-4xl text-primary opacity-80"'
    );
    
    if (content !== original) {
        fs.writeFileSync(p, content, 'utf-8');
        console.log(`Updated ${file}`);
    }
});
