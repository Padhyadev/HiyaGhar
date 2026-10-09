const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

function processFile(filePath) {
    if (!filePath.endsWith('.css') && !filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace colors in CSS
    content = content.replace(/color:\s*#A97818/gi, 'color: var(--hiya-gold-text, #855F0F)');
    content = content.replace(/color:\s*var\(--hiya-gold-dark,\s*#A97818\)/gi, 'color: var(--hiya-gold-text, #855F0F)');
    content = content.replace(/color:\s*#CB992C/gi, 'color: var(--hiya-gold-text, #855F0F)');
    content = content.replace(/color:\s*var\(--hiya-gold,\s*#CB992C\)/gi, 'color: var(--hiya-gold-text, #855F0F)');
    content = content.replace(/color:\s*#888/gi, 'color: var(--hiya-muted, #475467)');
    content = content.replace(/color:\s*#888888/gi, 'color: var(--hiya-muted, #475467)');
    content = content.replace(/color:\s*#9CA3AF/gi, 'color: var(--hiya-muted, #475467)');
    content = content.replace(/color:\s*#667085/gi, 'color: var(--hiya-muted, #475467)');

    // Replace colors in JSX inline styles
    content = content.replace(/color:\s*'#CB992C'/gi, "color: 'var(--hiya-gold-text, #855F0F)'");
    content = content.replace(/color:\s*'var\(--hiya-gold,\s*#CB992C\)'/gi, "color: 'var(--hiya-gold-text, #855F0F)'");
    content = content.replace(/color:\s*'#A97818'/gi, "color: 'var(--hiya-gold-text, #855F0F)'");
    content = content.replace(/color:\s*'#888'/gi, "color: 'var(--hiya-muted, #475467)'");
    content = content.replace(/color:\s*'#9CA3AF'/gi, "color: 'var(--hiya-muted, #475467)'");
    content = content.replace(/color:\s*'#667085'/gi, "color: 'var(--hiya-muted, #475467)'");

    // Replace stroke in JSX SVG
    content = content.replace(/stroke="#CB992C"/gi, 'stroke="var(--hiya-gold-text, #855F0F)"');
    content = content.replace(/stroke="#888"/gi, 'stroke="var(--hiya-muted, #475467)"');
    content = content.replace(/stroke="#667085"/gi, 'stroke="var(--hiya-muted, #475467)"');
    
    // Replace font sizes
    content = content.replace(/font-size:\s*11px/gi, 'font-size: 12px');
    content = content.replace(/font-size:\s*10px/gi, 'font-size: 12px');
    content = content.replace(/font-size:\s*9(\.\d+)?px/gi, 'font-size: 12px');
    content = content.replace(/fontSize:\s*'11px'/gi, "fontSize: '12px'");
    content = content.replace(/fontSize:\s*'10px'/gi, "fontSize: '12px'");
    content = content.replace(/fontSize:\s*'9(\.\d+)?px'/gi, "fontSize: '12px'");
    content = content.replace(/font-size:\s*0\.7rem/gi, 'font-size: 0.75rem');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated', filePath);
    }
}

walkDir(path.join(__dirname, 'hiya2.client', 'src'), processFile);
console.log('Done.');
