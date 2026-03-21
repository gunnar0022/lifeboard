import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, FileText, ChevronDown, ChevronRight, ExternalLink, X, AlertCircle,
  Tag,
} from 'lucide-react';
import './DocumentSearch.css';

const CATEGORY_LABELS = {
  finance: 'Finance',
  health: 'Health',
  investing: 'Investing',
  life: 'Life',
};

const CATEGORY_COLORS = {
  finance: 'var(--color-finance)',
  health: 'var(--color-health-body)',
  investing: 'var(--color-investing)',
  life: 'var(--color-life-manager)',
};

export default function DocumentSearch() {
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [expandedDoc, setExpandedDoc] = useState(null);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Load available tags on mount
  useEffect(() => {
    fetch('/api/life/documents/tags')
      .then(r => r.json())
      .then(setAvailableTags)
      .catch(() => {});
  }, []);

  // Search when query or tag changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!query.trim() && !activeTag) {
        setDocuments([]);
        setHasSearched(false);
        return;
      }
      performSearch();
    }, 300);
    return () => clearTimeout(timer);
  }, [query, activeTag]);

  const performSearch = async () => {
    setSearching(true);
    setHasSearched(true);
    const params = new URLSearchParams();
    if (query.trim()) params.set('query', query.trim());
    if (activeTag) params.set('tag', activeTag);
    try {
      const res = await fetch(`/api/life/documents?${params}`);
      if (res.ok) setDocuments(await res.json());
    } catch { /* ignore */ }
    setSearching(false);
  };

  // Show all docs when user clicks search with no filter
  const showAll = async () => {
    setSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch('/api/life/documents');
      if (res.ok) setDocuments(await res.json());
    } catch { /* ignore */ }
    setSearching(false);
  };

  const handleDelete = async (docId) => {
    if (!confirm('Delete this document permanently?')) return;
    await fetch(`/api/life/documents/${docId}`, { method: 'DELETE' });
    setDocuments(prev => prev.filter(d => d.id !== docId));
  };

  const viewFile = (doc) => {
    window.open(`/api/life/documents/${doc.id}/view`, '_blank');
  };

  return (
    <div className="doc-search card">
      <h3 className="chart-title">
        <FileText size={16} />
        Documents
      </h3>

      <div className="doc-search__bar">
        <Search size={14} />
        <input
          type="text"
          placeholder="Search documents by title, summary, or provider..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {query && (
          <button className="doc-search__clear" onClick={() => setQuery('')}>
            <X size={12} />
          </button>
        )}
        {!hasSearched && !query && !activeTag && (
          <button className="doc-search__show-all" onClick={showAll}>
            Show all
          </button>
        )}
      </div>

      {availableTags.length > 0 && (
        <div className="doc-search__tags">
          {availableTags.map(tag => (
            <button
              key={tag}
              className={`doc-tag ${activeTag === tag ? 'doc-tag--active' : ''}`}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {hasSearched && (
          <motion.div
            className="doc-search__results"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {searching ? (
              <div className="doc-search__loading">Searching...</div>
            ) : documents.length === 0 ? (
              <div className="doc-search__empty">
                <Search size={18} />
                <span>No documents found</span>
              </div>
            ) : (
              documents.map(doc => {
                const isExpanded = expandedDoc === doc.id;
                const tags = doc.tags || [];
                const catColor = CATEGORY_COLORS[doc.category] || 'var(--text-tertiary)';

                return (
                  <div key={doc.id} className="doc-item">
                    <button
                      className="doc-item__header"
                      onClick={() => setExpandedDoc(isExpanded ? null : doc.id)}
                    >
                      <div className="doc-item__title-row">
                        <span className="doc-item__cat-dot" style={{ background: catColor }} />
                        <span className="doc-item__title">{doc.title}</span>
                      </div>
                      <div className="doc-item__meta">
                        {doc.date && <span className="doc-item__date mono">{doc.date}</span>}
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          className="doc-item__detail"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          {doc.summary && (
                            <p className="doc-item__summary">{doc.summary}</p>
                          )}

                          <div className="doc-item__info-row">
                            {doc.provider && (
                              <span className="doc-item__provider">{doc.provider}</span>
                            )}
                            <span className="doc-item__category" style={{ color: catColor }}>
                              {CATEGORY_LABELS[doc.category] || doc.category}
                            </span>
                          </div>

                          {tags.length > 0 && (
                            <div className="doc-item__tags">
                              {tags.map(t => (
                                <span key={t} className="doc-item__tag">
                                  <Tag size={10} /> {t}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="doc-item__actions">
                            {doc.file_path ? (
                              <button className="doc-item__view-btn" onClick={() => viewFile(doc)}>
                                <ExternalLink size={13} /> View File
                              </button>
                            ) : (
                              <span className="doc-item__no-file">
                                <AlertCircle size={12} /> No file attached
                              </span>
                            )}
                            <button className="doc-item__delete-btn" onClick={() => handleDelete(doc.id)}>
                              <X size={13} /> Delete
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
