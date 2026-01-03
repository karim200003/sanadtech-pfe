# User Directory - Large List Virtual Scroll Application

A high-performance web application that efficiently loads and displays a very large sorted list (up to 10 million usernames) without causing browser freezing. Built with React, Vite, and Node.js.

## 🚀 Features

- **Virtual Scrolling**: Only renders visible items (~30 at a time) instead of the entire list
- **Infinite Scroll**: Automatically loads more data as user scrolls
- **Alphabet Navigation**: Quick jump to any letter section via sidebar menu
- **Binary Search**: O(log n) search performance for prefix matching
- **Memory Efficient**: Uses Map-based caching instead of sparse arrays

## 📋 Technical Approach

### Backend (Node.js + Express)

1. **Efficient Data Loading**: Uses `readline` streaming to load the file line-by-line, avoiding memory spikes
2. **Pre-computed Alphabet Index**: Builds an index mapping each letter to its starting position for O(1) navigation
3. **Pagination API**: Returns data in small chunks (default 50-100 items) to minimize network transfer
4. **Binary Search for Search**: Implements binary search for prefix-based search queries

### Frontend (React + Vite)

1. **Virtual Scrolling**: 
   - Calculates visible viewport range based on scroll position
   - Only renders items currently visible (+ small buffer)
   - Uses absolute positioning within a container sized to represent all items

2. **Lazy Loading**: 
   - Tracks loaded ranges to avoid duplicate requests
   - Pre-fetches data as user approaches unloaded regions

3. **Throttled Scroll Handler**: Prevents excessive re-renders during fast scrolling

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm

### Backend Setup

```bash
cd backend
npm install
npm start
```

The backend server will start on `http://localhost:3000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 📁 Project Structure

```
├── backend/
│   ├── server.js        # Express API server
│   ├── usernames.txt    # User data file
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.jsx      # Main application component
    │   ├── main.jsx     # React entry point
    │   └── index.css    # Tailwind imports
    ├── index.html
    └── package.json
```

## 🔌 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/count` | Returns total number of users |
| `GET /api/index` | Returns alphabet index (letter → starting position) |
| `GET /api/users?offset=0&limit=50` | Paginated user list |
| `GET /api/users/letter/:letter` | Users starting with specific letter |
| `GET /api/search?q=john&limit=100` | Prefix search with binary search |
| `GET /health` | Health check endpoint |

## 🧠 Scalability Considerations

### Current Implementation
- **Backend Memory**: Loads all users into memory (~1-2GB for 10M users)
- **Frontend Memory**: Uses Map with ~1000 cached items max in viewport area

### For Production Scale (10M+ users)
Possible improvements:
1. **Database**: Use indexed database (PostgreSQL, MongoDB) instead of in-memory array
2. **Streaming**: Implement file-based binary search without loading entire file
3. **Caching**: Add Redis layer for frequently accessed ranges
4. **CDN**: Pre-generate static JSON chunks for alphabet sections

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express 5, CORS
- **Architecture**: REST API with pagination

## 📊 Performance

| Metric | Value |
|--------|-------|
| Initial Load | ~100 items |
| Scroll Render | ~30 visible items |
| Search Complexity | O(log n) |
| Navigation Jump | O(1) lookup |

## 👤 Author

**SADIKI ABDELKARIM**

---

*Built for Sanadtech PFE Internship Technical Test*
