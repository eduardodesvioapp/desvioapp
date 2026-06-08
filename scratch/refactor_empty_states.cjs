const fs = require('fs');
const path = require('path');
const dir = 'd:/AG/desvio/src/pages';

const files = ['Notifications.jsx', 'Visitors.jsx', 'Matches.jsx', 'LikedMe.jsx'];

files.forEach(file => {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf-8');
    const original = content;
    
    // Check if EmptyStateCard is already imported
    if (!content.includes('EmptyStateCard')) {
        // Add to the ui import list
        content = content.replace(
            /import\s+{(.*?)}\s+from\s+['"]\.\.\/components\/ui['"];?/,
            (match, imports) => {
                return `import {${imports}, EmptyStateCard } from '../components/ui';`;
            }
        );
    }
    
    // The exact HTML to replace (varying text/icon slightly)
    // Actually, I can use a regex to capture the icon, title, and description
    const regex = /<div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-primary\/20 rounded-\[40px\] bg-primary\/5">\s*<div className="w-20 h-20 bg-primary\/10 rounded flex items-center justify-center mb-6 border border-primary\/20">\s*<span className="material-symbols-outlined text-4xl text-primary opacity-80">(.*?)<\/span>\s*<\/div>\s*<h3 className="text-xl font-bold text-primary">(.*?)<\/h3>\s*<p className="text-primary\/70 text-sm mt-2 max-w-xs">\s*(.*?)\s*<\/p>\s*<\/div>/g;

    content = content.replace(regex, (match, icon, title, description) => {
        return `<EmptyStateCard icon="${icon}" title="${title}" description="${description}" />`;
    });
    
    if (content !== original) {
        fs.writeFileSync(p, content, 'utf-8');
        console.log(`Refactored ${file}`);
    } else {
        console.log(`No changes needed for ${file}`);
    }
});
