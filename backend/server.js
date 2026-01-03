const express = require('express');
const fs = require('fs');
const readline = require('readline');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;


app.use(cors());
app.use(express.json());


let users = [];
let alphabetIndex = {};
let isLoaded = false;


async function loadUsers() {
  console.log('Loading usernames from file...');
  const startTime = Date.now();
  
  const fileStream = fs.createReadStream('usernames.txt');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let currentLetter = '';
  let count = 0;

  for await (const line of rl) {
    const name = line.trim();
    if (name) {
      users.push(name);
      

      const firstLetter = name[0].toUpperCase();
      if (firstLetter !== currentLetter) {
        if (!alphabetIndex[firstLetter]) {
          alphabetIndex[firstLetter] = count;
          console.log(`Letter ${firstLetter} starts at index ${count}`);
        }
        currentLetter = firstLetter;
      }
      
      count++;
      

      if (count % 100000 === 0) {
        console.log(`Loaded ${count.toLocaleString()} users...`);
      }
    }
  }

  const loadTime = Date.now() - startTime;
  console.log(`✓ Loaded ${users.length.toLocaleString()} users in ${loadTime}ms`);
  console.log('Alphabet index:', alphabetIndex);
  
  isLoaded = true;
}


app.get('/api/count', (req, res) => {
  res.json({ count: users.length });
});


app.get('/api/index', (req, res) => {
  res.json({
    index: alphabetIndex,
    totalUsers: users.length
  });
});


app.get('/api/users', (req, res) => {
  const offset = parseInt(req.query.offset) || 0;
  const limit = parseInt(req.query.limit) || 50;
  
  if (!isLoaded) {
    return res.status(503).json({ error: 'Data still loading, please wait...' });
  }

  if (offset < 0 || offset >= users.length) {
    return res.status(400).json({ error: 'Invalid offset' });
  }

  const results = users.slice(offset, offset + limit);
  
  res.json({
    data: results.map((name, idx) => ({
      id: offset + idx,
      name: name
    })),
    offset,
    limit,
    total: users.length,
    hasMore: offset + limit < users.length
  });
});


app.get('/api/users/letter/:letter', (req, res) => {
  const letter = req.params.letter.toUpperCase();
  const offset = parseInt(req.query.offset) || 0;
  const limit = parseInt(req.query.limit) || 50;

  if (!isLoaded) {
    return res.status(503).json({ error: 'Data still loading, please wait...' });
  }

  const startIndex = alphabetIndex[letter];
  if (startIndex === undefined) {
    return res.status(404).json({ error: `No users found starting with ${letter}` });
  }

  const actualOffset = startIndex + offset;
  const results = [];
  
  for (let i = actualOffset; i < users.length && results.length < limit; i++) {
    if (users[i][0].toUpperCase() !== letter) break;
    results.push({
      id: i,
      name: users[i]
    });
  }

  res.json({
    data: results,
    letter,
    offset,
    limit,
    startIndex,
    total: users.length
  });
});


app.get('/api/search', (req, res) => {
  const query = req.query.q?.toLowerCase() || '';
  const limit = parseInt(req.query.limit) || 100;

  if (!isLoaded) {
    return res.status(503).json({ error: 'Data still loading, please wait...' });
  }

  if (!query || query.length < 1) {  
    return res.status(400).json({ error: 'Query must be at least 1 character' });
  }


  let left = 0;
  let right = users.length - 1;
  let firstMatch = -1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const name = users[mid].toLowerCase();

    if (name.startsWith(query)) {
      firstMatch = mid;
      right = mid - 1; 
    } else if (name < query) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  if (firstMatch === -1) {
    return res.json({ data: [], query });
  }


  const results = [];
  for (let i = firstMatch; i < users.length && results.length < limit; i++) {
    if (!users[i].toLowerCase().startsWith(query)) break;
    results.push({
      id: i,
      name: users[i]
    });
  }

  res.json({
    data: results,
    query,
    resultsCount: results.length
  });
});


app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    loaded: isLoaded,
    userCount: users.length
  });
});


async function start() {
  console.log('🚀 Starting server...');
  

  await loadUsers();
  
  app.listen(PORT, () => {
    console.log(`\n✓ Server running on http://localhost:${PORT}`);
    console.log(`✓ API ready with ${users.length.toLocaleString()} users\n`);
    console.log('Available endpoints:');
    console.log(`  GET /api/count - Get total user count`);
    console.log(`  GET /api/index - Get alphabet index`);
    console.log(`  GET /api/users?offset=0&limit=50 - Get paginated users`);
    console.log(`  GET /api/users/letter/:letter?offset=0&limit=50 - Get users by letter`);
    console.log(`  GET /api/search?q=john&limit=100 - Search users by prefix`);
    console.log(`  GET /health - Health check\n`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});