import React, { useState, useEffect, useRef } from 'react';
import { BookUser, Library } from 'lucide-react';

export default function AuthorAutocomplete({ value, onChange, existingAuthors, isBangla, inputStyle }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => { setQuery(value || ''); }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Get the segment currently being typed (supports multiple authors separated by commas)
  const getCurrentSegment = (text) => {
    const parts = text.split(',');
    return parts[parts.length - 1].trim();
  };

  const fetchSuggestions = async (segment) => {
    setLoading(true);
    const segLower = segment.toLowerCase();

    // 1. Local matches — authors already in the user's own library
    const localMatches = (existingAuthors || [])
      .filter(a => a.toLowerCase().includes(segLower))
      .slice(0, 5);

    // 2. External matches — Open Library's author database (global coverage)
    let externalMatches = [];
    try {
      const res = await fetch(`https://openlibrary.org/search/authors.json?q=${encodeURIComponent(segment)}&limit=8`);
      const data = await res.json();
      if (data.docs) {
        externalMatches = data.docs
          .map(d => d.name)
          .filter(name => name && !localMatches.some(l => l.toLowerCase() === name.toLowerCase()));
      }
    } catch {}

    // Dedupe external list itself
    const seen = new Set();
    externalMatches = externalMatches.filter(n => {
      const k = n.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    setSuggestions([
      ...localMatches.map(a => ({ name: a, source: 'library' })),
      ...externalMatches.slice(0, 6).map(a => ({ name: a, source: 'external' })),
    ]);
    setLoading(false);
  };

  const handleChange = (e) => {
    const newVal = e.target.value;
    setQuery(newVal);
    onChange(newVal);
    setActiveIndex(-1);

    const segment = getCurrentSegment(newVal);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (segment.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setShowDropdown(true);
    debounceRef.current = setTimeout(() => fetchSuggestions(segment), 300);
  };

  const selectSuggestion = (name) => {
    const parts = query.split(',');
    if (parts.length === 1) {
      setQuery(name);
      onChange(name);
    } else {
      const cleaned = parts.map((p, i) => i === parts.length - 1 ? name : p.trim()).join(', ');
      setQuery(cleaned);
      onChange(cleaned);
    }
    setShowDropdown(false);
    setSuggestions([]);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex].name);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (suggestions.length) setShowDropdown(true); }}
        placeholder={isBangla ? 'লেখকের নাম' : 'Author name(s), comma separated'}
        style={inputStyle}
        autoComplete="off"
      />

      {showDropdown && (loading || suggestions.length > 0) && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
          background: 'var(--paper-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)',
          zIndex: 50, maxHeight: 240, overflowY: 'auto'
        }}>
          {loading && suggestions.length === 0 && (
            <div style={{ padding: '10px 14px', fontSize: 13, color: 'var(--ink-faint)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 12, height: 12, border: '2px solid var(--border)', borderTopColor: 'var(--sepia)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Searching authors…
            </div>
          )}
          {suggestions.map((s, i) => (
            <div
              key={`${s.source}-${s.name}-${i}`}
              onClick={() => selectSuggestion(s.name)}
              onMouseEnter={() => setActiveIndex(i)}
              style={{
                padding: '9px 14px', fontSize: 13.5, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                background: activeIndex === i ? 'var(--sepia-pale)' : 'transparent',
                color: 'var(--ink)', borderBottom: i < suggestions.length - 1 ? '1px solid var(--border-soft)' : 'none',
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
              {s.source === 'library' ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 600, color: 'var(--sepia)', flexShrink: 0 }}>
                  <Library size={11} /> Your library
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--ink-faint)', flexShrink: 0 }}>
                  <BookUser size={11} /> Open Library
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
