'use client'

import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { Group } from '../lib/types'

interface GroupSearchProps {
  groups: Group[]
  onSearchResults?: (results: Group[]) => void
  onSelectGroup?: (groupId: string) => void
  placeholder?: string
}

export default function GroupSearch({
  groups,
  onSearchResults,
  onSelectGroup,
  placeholder = "SEARCH COMMUNICATION CHANNELS..."
}: GroupSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredGroups, setFilteredGroups] = useState<Group[]>(groups)
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter groups based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredGroups(groups)
      onSearchResults?.(groups)
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timeoutId = setTimeout(() => {
      const query = searchQuery.toLowerCase().trim()
      const results = groups.filter(group =>
        group.name.toLowerCase().includes(query) ||
        (group.description && group.description.toLowerCase().includes(query))
      )

      setFilteredGroups(results)
      onSearchResults?.(results)
      setIsSearching(false)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, groups, onSearchResults])

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showResults || filteredGroups.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < filteredGroups.length - 1 ? prev + 1 : 0
        )
        break

      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : filteredGroups.length - 1
        )
        break

      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < filteredGroups.length) {
          handleSelectGroup(filteredGroups[selectedIndex])
        }
        break

      case 'Escape':
        setShowResults(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setShowResults(true)
    setSelectedIndex(-1)

    // Add to search history
    if (query.trim() && !searchHistory.includes(query.trim())) {
      setSearchHistory(prev => [query.trim(), ...prev.slice(0, 4)])
    }
  }

  const handleSelectGroup = (group: Group) => {
    setSearchQuery('')
    setShowResults(false)
    setSelectedIndex(-1)
    onSelectGroup?.(group.id)
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setFilteredGroups(groups)
    setShowResults(false)
    setSelectedIndex(-1)
    onSearchResults?.(groups)
    inputRef.current?.focus()
  }

  const handleHistoryClick = (query: string) => {
    setSearchQuery(query)
    setShowResults(true)
    inputRef.current?.focus()
  }

  const handleClearHistory = () => {
    setSearchHistory([])
  }

  return (
    <div className="relative font-mono" ref={searchRef}>
      {/* Search Container */}
      <div className="relative border border-green-800/50 bg-black/80 rounded-lg backdrop-blur-sm">
        {/* Terminal scanlines */}
        <div className="absolute inset-0 opacity-5 rounded-lg">
          <div className="h-full" style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 255, 0, 0.1) 2px,
              rgba(0, 255, 0, 0.1) 4px
            )`,
            animation: 'scan 10s linear infinite'
          }} />
        </div>

        {/* Search Input */}
        <div className="relative z-10 p-4">
          <div className="flex items-center gap-3">
            {/* Search Icon */}
            <div className="relative">
              <svg
                className="w-5 h-5 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {isSearching && (
                <div className="absolute -inset-1">
                  <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Input Field */}
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowResults(true)}
              placeholder={placeholder}
              className="flex-1 bg-transparent border-none outline-none text-green-300 placeholder-green-800 text-sm tracking-wider"
              autoComplete="off"
              spellCheck="false"
            />

            {/* Clear Button */}
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="p-1 text-green-700 hover:text-green-500 transition-colors duration-200"
                aria-label="Clear search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Search Stats */}
            {searchQuery && (
              <div className="hidden sm:flex items-center gap-2 text-green-700 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <span>{filteredGroups.length} CHANNELS</span>
              </div>
            )}
          </div>

          {/* Search Status Bar */}
          <div className="mt-3 h-1 bg-gradient-to-r from-green-900/30 via-green-700/20 to-green-900/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-500"
              style={{
                width: isSearching ? '100%' : searchQuery ? '30%' : '0%',
                opacity: isSearching ? 0.5 : 1
              }}
            />
          </div>
        </div>
      </div>

      {/* Search Results Dropdown */}
      {showResults && (searchQuery || searchHistory.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 border border-green-800/50 bg-black/95 backdrop-blur-xl rounded-lg shadow-2xl shadow-green-900/20 z-50 overflow-hidden">
          {/* Terminal border accents */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-green-700/30"></div>
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-green-700/30"></div>
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-green-700/30"></div>
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-green-700/30"></div>

          {/* Results Container */}
          <div className="relative max-h-96 overflow-y-auto">
            {/* Scanlines overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-5">
              <div className="h-full" style={{
                backgroundImage: `repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 2px,
                  rgba(0, 255, 0, 0.1) 2px,
                  rgba(0, 255, 0, 0.1) 4px
                )`
              }} />
            </div>

            {/* Search History */}
            {!searchQuery && searchHistory.length > 0 && (
              <div className="p-4 border-b border-green-900/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-green-400 text-sm tracking-wider">RECENT SEARCHES</span>
                  </div>
                  <button
                    onClick={handleClearHistory}
                    className="text-green-700 hover:text-green-500 text-xs transition-colors duration-200"
                  >
                    CLEAR
                  </button>
                </div>
                <div className="space-y-2">
                  {searchHistory.map((query, index) => (
                    <button
                      key={index}
                      onClick={() => handleHistoryClick(query)}
                      className="w-full text-left p-2 text-green-300 hover:text-green-100 hover:bg-green-900/20 rounded transition-all duration-200 flex items-center gap-2 group"
                    >
                      <svg className="w-3 h-3 text-green-700 group-hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span className="text-sm">{query}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchQuery && (
              <>
                {/* Results Header */}
                <div className="p-4 border-b border-green-900/30 bg-green-900/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-green-400 text-sm tracking-wider">
                        {filteredGroups.length === 0 ? 'NO CHANNELS FOUND' : 'CHANNEL MATCHES'}
                      </span>
                    </div>
                    <span className="text-green-700 text-xs">
                      {filteredGroups.length} OF {groups.length}
                    </span>
                  </div>
                </div>

                {/* Results List */}
                <div className="p-2">
                  {filteredGroups.length === 0 ? (
                    // No results
                    <div className="p-6 text-center">
                      <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-green-900/50 flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-green-600 text-sm mb-2">NO MATCHING CHANNELS FOUND</p>
                      <p className="text-green-800 text-xs">Try different search terms</p>
                    </div>
                  ) : (
                    // Results list
                    <div className="space-y-1">
                      {filteredGroups.map((group, index) => (
                        <button
                          key={group.id}
                          onClick={() => handleSelectGroup(group)}
                          className={`w-full text-left p-3 rounded transition-all duration-200 flex items-center gap-3 group ${
                            selectedIndex === index
                              ? 'bg-green-900/40 border border-green-700/30'
                              : 'hover:bg-green-900/20 border border-transparent'
                          }`}
                          onMouseEnter={() => setSelectedIndex(index)}
                        >
                          {/* Channel Indicator */}
                          <div className={`w-2 h-2 rounded-full ${
                            index % 3 === 0
                              ? 'bg-green-500'
                              : index % 3 === 1
                                ? 'bg-yellow-500'
                                : 'bg-blue-500'
                          } animate-pulse`}></div>

                          {/* Channel Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <span className={`text-sm font-medium truncate ${
                                selectedIndex === index ? 'text-green-200' : 'text-green-300'
                              }`}>
                                {group.name}
                              </span>
                              <span className="text-green-700 text-xs whitespace-nowrap">
                                {new Date(group.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            {group.description && (
                              <p className="text-green-600 text-xs mt-1 truncate">
                                {group.description}
                              </p>
                            )}
                          </div>

                          {/* Select Indicator */}
                          <svg
                            className={`w-4 h-4 transition-transform duration-200 ${
                              selectedIndex === index ? 'text-green-400 rotate-90' : 'text-green-800'
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Search Tips */}
                {filteredGroups.length > 0 && (
                  <div className="p-3 border-t border-green-900/30 bg-black/50">
                    <div className="flex items-center justify-between text-green-700 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <kbd className="px-1.5 py-0.5 border border-green-800/50 rounded text-xs">↑↓</kbd>
                          <span>NAVIGATE</span>
                        </span>
                        <span className="text-green-900">•</span>
                        <span className="flex items-center gap-1">
                          <kbd className="px-1.5 py-0.5 border border-green-800/50 rounded text-xs">ENTER</kbd>
                          <span>SELECT</span>
                        </span>
                        <span className="text-green-900">•</span>
                        <span className="flex items-center gap-1">
                          <kbd className="px-1.5 py-0.5 border border-green-800/50 rounded text-xs">ESC</kbd>
                          <span>CLOSE</span>
                        </span>
                      </div>
                      <span className="text-green-800">PRESS ESC TO CLOSE</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Inline styles */}
      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(4px); }
        }

        .animate-scan {
          animation: scan 10s linear infinite;
        }

        /* Custom scrollbar for results */
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }

        .overflow-y-auto::-webkit-scrollbar-track {
          background: rgba(0, 255, 0, 0.05);
          border-radius: 3px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(0, 255, 0, 0.2);
          border-radius: 3px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 255, 0, 0.3);
        }

        /* Smooth fade-in animation */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .results-enter {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}