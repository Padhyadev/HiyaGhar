const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const imageDir = path.join(__dirname, 'hiya2.client', 'public', 'image');
const searchDirs = [
    path.join(__dirname, 'hiya2.client', 'src'),
    path.join(__dirname, 'hiya2.client', 'index.html'),
    path.join(__dirname, 'Hiya2.Server')
];

const images = fs.readdirSync(imageDir, { withFileTypes: true })
    .filter(dirent => dirent.isFile())
    .map(dirent => dirent.name);

const unused = [];

for (const img of images) {
    let found = false;
    for (const dir of searchDirs) {
        try {
            if (fs.existsSync(dir) && fs.statSync(dir).isFile()) {
                const content = fs.readFileSync(dir, 'utf8');
                if (content.includes(img)) {
                    found = true;
                    break;
                }
            } else {
                // search with git grep or just ripgrep if available, but let's just use node to read recursively
                // Actually, let's just use a simple recursive find
                const files = getAllFiles(dir);
                for (const file of files) {
                    if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.jsx') || file.endsWith('.html') || file.endsWith('.css') || file.endsWith('.cs') || file.endsWith('.json')) {
                        const content = fs.readFileSync(file, 'utf8');
                        if (content.includes(img)) {
                            found = true;
                            break;
                        }
                    }
                }
            }
        } catch (e) {
            // ignore
        }
        if (found) break;
    }
    if (!found) {
        unused.push(img);
    }
}

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath)
    arrayOfFiles = arrayOfFiles || []
    files.forEach(function(file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            // ignore node_modules, obj, bin
            if (file !== 'node_modules' && file !== 'obj' && file !== 'bin' && file !== '.git') {
                arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
            }
        } else {
            arrayOfFiles.push(path.join(dirPath, "/", file))
        }
    })
    return arrayOfFiles
}

console.log(JSON.stringify(unused, null, 2));
