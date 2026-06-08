const fs = require('fs');
const path = require('path');
const dir = 'd:/AG/desvio/src/pages';

const files = ['Notifications.jsx', 'Visitors.jsx', 'Matches.jsx', 'LikedMe.jsx'];

files.forEach(file => {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf-8');
    const original = content;
    
    // Replace container border
    content = content.replace(
        /border-2 border-dashed border-white\/5 rounded-\[40px\]/g, 
        'border-2 border-dashed border-primary/20 rounded-[40px] bg-primary/5'
    );
    
    // Replace text-white/60 -> text-primary
    content = content.replace(
        /<h3 className="text-xl font-bold text-white\/60">/g,
        '<h3 className="text-xl font-bold text-primary">'
    );

    // Replace text-white/30 -> text-primary/70
    content = content.replace(
        /<p className="text-white\/30 text-sm mt-2 max-w-xs">/g,
        '<p className="text-primary/70 text-sm mt-2 max-w-xs">'
    );
    
    if (content !== original) {
        fs.writeFileSync(p, content, 'utf-8');
        console.log(`Updated ${file}`);
    }
});
