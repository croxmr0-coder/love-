const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;
const ANSWERS_FILE = path.join(__dirname, 'answers.json');

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json'
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;
    
    // API endpoint to save answers
    if (pathname === '/api/save-answers' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const answers = JSON.parse(body);
                
                // Read existing answers
                let allAnswers = [];
                if (fs.existsSync(ANSWERS_FILE)) {
                    const data = fs.readFileSync(ANSWERS_FILE, 'utf8');
                    allAnswers = JSON.parse(data);
                }
                
                // Add new answer
                allAnswers.push(answers);
                
                // Save to file
                fs.writeFileSync(ANSWERS_FILE, JSON.stringify(allAnswers, null, 2));
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
        return;
    }
    
    // API endpoint to get all answers (for admin panel)
    if (pathname === '/api/get-answers' && req.method === 'GET') {
        try {
            let allAnswers = [];
            if (fs.existsSync(ANSWERS_FILE)) {
                const data = fs.readFileSync(ANSWERS_FILE, 'utf8');
                allAnswers = JSON.parse(data);
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(allAnswers));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
        return;
    }
    
    // Default to index.html
    if (pathname === '/') {
        pathname = '/index.html';
    }
    
    const filePath = path.join(__dirname, pathname);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('File not found');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Server error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Main site: http://localhost:${PORT}/`);
    console.log(`Admin panel: http://localhost:${PORT}/admin.html`);
    console.log(`Answers will be saved to: ${ANSWERS_FILE}`);
});
