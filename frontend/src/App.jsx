import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronRight, ChevronLeft, Loader, AlertCircle } from 'lucide-react';

const API_BASE = 'http://localhost:3000/api';

const VirtualScrollApp = () => {
  const [totalCount, setTotalCount] = useState(0);
  const [alphabetIndex, setAlphabetIndex] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('A');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  

  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageUsers, setCurrentPageUsers] = useState([]);
  const [totalPagesInSection, setTotalPagesInSection] = useState(0);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [usersInCurrentSection, setUsersInCurrentSection] = useState(0);
  
  const ITEMS_PER_PAGE = 100;


  useEffect(() => {
    fetchIndex();
  }, []);

  const fetchIndex = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/index`);
      const data = await res.json();
      setAlphabetIndex(data.index);
      setTotalCount(data.totalUsers);
      
      if (data.index['A'] !== undefined) {
        const letterOffset = data.index['A'];
        const sectionSize = calculateSectionSizeWithIndex(data.index, 'A', data.totalUsers);
        
        setActiveSection('A');
        setCurrentOffset(letterOffset);
        setCurrentPage(1);
        setUsersInCurrentSection(sectionSize);
        setTotalPagesInSection(Math.ceil(sectionSize / ITEMS_PER_PAGE));
        
        const response = await fetch(`${API_BASE}/users?offset=${letterOffset}&limit=${ITEMS_PER_PAGE}`);
        const userData = await response.json();
        
        const filteredUsers = userData.data.filter(user => 
          user.name[0].toUpperCase() === 'A'
        );
        
        setCurrentPageUsers(filteredUsers);
      }
    } catch (error) {
      console.error('Failed to fetch index:', error);
      setError('Failed to load user directory');
    } finally {
      setLoading(false);
    }
  };

  const calculateSectionSizeWithIndex = (index, letter, total) => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const currentIndex = alphabet.indexOf(letter);
    const currentLetterOffset = index[letter];
    
    let nextLetterOffset = total;
    for (let i = currentIndex + 1; i < alphabet.length; i++) {
      if (index[alphabet[i]] !== undefined) {
        nextLetterOffset = index[alphabet[i]];
        break;
      }
    }
    
    return nextLetterOffset - currentLetterOffset;
  };

  const calculateSectionSize = (letter) => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const currentIndex = alphabet.indexOf(letter);
    const currentLetterOffset = alphabetIndex[letter];
    
    let nextLetterOffset = totalCount;
    for (let i = currentIndex + 1; i < alphabet.length; i++) {
      if (alphabetIndex[alphabet[i]] !== undefined) {
        nextLetterOffset = alphabetIndex[alphabet[i]];
        break;
      }
    }
    
    return nextLetterOffset - currentLetterOffset;
  };

  const loadPage = async (page, letter) => {
    setLoading(true);
    try {
      const letterOffset = alphabetIndex[letter];
      const sectionSize = calculateSectionSize(letter);
      const offset = letterOffset + (page - 1) * ITEMS_PER_PAGE;
      
      const res = await fetch(`${API_BASE}/users?offset=${offset}&limit=${ITEMS_PER_PAGE}`);
      const data = await res.json();
      
      const filteredUsers = data.data.filter(user => 
        user.name[0].toUpperCase() === letter
      );
      
      setCurrentPageUsers(filteredUsers);
      setUsersInCurrentSection(sectionSize);
      setTotalPagesInSection(Math.ceil(sectionSize / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const jumpToLetter = async (letter) => {
    const offset = alphabetIndex[letter];
    
    if (offset === undefined || offset === null) {
      console.log('Letter not available:', letter);
      return;
    }
    
    setActiveSection(letter);
    setSearchQuery('');
    setSearchResults([]);
    setCurrentOffset(offset);
    setCurrentPage(1);
    
    await loadPage(1, letter);
  };

  const goToNextPage = () => {
    if (currentPage < totalPagesInSection) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      loadPage(nextPage, activeSection);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      loadPage(prevPage, activeSection);
    }
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPagesInSection) {
      setCurrentPage(page);
      loadPage(page, activeSection);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (query.length < 1) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    
    setSearching(true);
    
    setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}&limit=100`);
        
        if (!res.ok) {
          setSearchResults([]);
          setSearching(false);
          return;
        }
        
        const data = await res.json();
        setSearchResults(data.data || []);
        
        if (data.data && data.data.length > 0) {
          const firstLetter = data.data[0].name[0].toUpperCase();
          setActiveSection(firstLetter);
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 7;
    
    if (totalPagesInSection <= maxPagesToShow) {
      for (let i = 1; i <= totalPagesInSection; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPagesInSection);
      } else if (currentPage >= totalPagesInSection - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPagesInSection - 4; i <= totalPagesInSection; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPagesInSection);
      }
    }
    
    return pages;
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Alphabet Navigation Sidebar */}
      <div className="w-20 glass border-r border-indigo-100 flex flex-col items-center py-6 overflow-y-auto shadow-lg">
        <div className="text-xs font-bold text-indigo-400 mb-4 tracking-wider">A-Z</div>
        {alphabet.map(letter => {
          const isAvailable = alphabetIndex.hasOwnProperty(letter);
          const isActive = activeSection === letter;
          
          return (
            <button
              key={letter}
              onClick={() => isAvailable && jumpToLetter(letter)}
              disabled={!isAvailable}
              title={isAvailable ? `Jump to ${letter}` : `No users with ${letter}`}
              className={`w-12 h-12 rounded-xl mb-2 flex items-center justify-center text-sm font-bold transition-all hover-lift
                ${isActive
                  ? 'animated-gradient text-white shadow-lg scale-110' 
                  : isAvailable
                    ? 'bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-100'
                    : 'text-gray-300 cursor-not-allowed opacity-40'}`}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="glass border-b border-indigo-100 px-6 py-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold gradient-text">User Directory</h1>
              <p className="text-sm text-slate-600 mt-1">
                {totalCount.toLocaleString()} total users
                {!searchQuery && ` • Section ${activeSection} (${usersInCurrentSection.toLocaleString()} users)`}
              </p>
            </div>
            
            {loading && (
              <div className="flex items-center space-x-2 text-indigo-600">
                <Loader className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">Loading...</span>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-400" />
            <input
              type="text"
              placeholder="Search users by name..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-24 py-3 border-2 border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Clear
              </button>
            )}
            {searching && (
              <Loader className="absolute right-16 top-1/2 transform -translate-y-1/2 w-5 h-5 text-indigo-600 animate-spin" />
            )}
          </div>

          {searchQuery && (
            <div className="mt-2 text-sm text-slate-600">
              {searchResults.length > 0 
                ? `${searchResults.length} results for "${searchQuery}"`
                : searching 
                  ? 'Searching...'
                  : `No results found for "${searchQuery}"`
              }
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {searchQuery ? (
            <div className="space-y-2">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="bg-white p-4 rounded-xl border border-indigo-100 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer hover-lift animate-fade-up"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full animated-gradient flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {user.name[0].toUpperCase()}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="text-base font-semibold text-slate-900">{user.name}</div>
                      <div className="text-xs text-slate-500">User #{user.id.toLocaleString()}</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-indigo-400" />
                  </div>
                </div>
              ))}
              
              {!searching && searchResults.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                  <Search className="w-16 h-16 mb-4 text-indigo-200" />
                  <p className="text-lg font-medium">No users found</p>
                  <p className="text-sm">Try a different search term</p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-6">
                {currentPageUsers.map((user, index) => (
                  <div
                    key={user.id}
                    className="bg-white p-4 rounded-xl border border-indigo-100 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer hover-lift animate-fade-up"
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full animated-gradient flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {user.name[0].toUpperCase()}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="text-base font-semibold text-slate-900">{user.name}</div>
                        <div className="text-xs text-slate-500">User #{user.id.toLocaleString()}</div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-indigo-400" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPagesInSection > 1 && (
                <div className="glass rounded-xl border border-indigo-100 p-4 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-slate-600">
                      Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, usersInCurrentSection)} of {usersInCurrentSection.toLocaleString()} users
                    </div>
                    <div className="text-sm font-medium gradient-text">
                      Page {currentPage} of {totalPagesInSection}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-2">
                    {/* Previous Button */}
                    <button
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className={`p-2 rounded-lg transition-all ${
                        currentPage === 1
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-white border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover-lift'
                      }`}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center space-x-1">
                      {getPageNumbers().map((page, index) => (
                        page === '...' ? (
                          <span key={`ellipsis-${index}`} className="px-2 text-slate-400">...</span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`min-w-[40px] h-10 rounded-lg font-medium transition-all ${
                              currentPage === page
                                ? 'animated-gradient text-white shadow-lg scale-110'
                                : 'bg-white border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50 hover-lift'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      ))}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPagesInSection}
                      className={`p-2 rounded-lg transition-all ${
                        currentPage === totalPagesInSection
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-white border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover-lift'
                      }`}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VirtualScrollApp;