import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, FileText, ChevronDown, ChevronRight, ExternalLink, X, AlertCircle,
  Tag, Pencil, Save,
} from 'lucide-react';
import './DocumentSearch.css';

function DocEditModal({ doc, onClose, onSave }) {
  const [form, setForm] = useState({
    title: doc.title || '',
    summary: doc.summary || '',
    category: doc.category || 'life',
    provider: doc.provider || '',
    date: doc.date || '',
    tags: (doc.tags || []).join(', '),
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const body = {
      title: form.title,
      summary: form.summary,
      category: form.category,
      provider: form.provider || null,
      date: form.date || null,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) { onSave(); onClose(); }
    } catch { /* ignore */ }
    setSaving(false);
  };

  return (
    <div className="doc-edit-overlay" onClick={onClose}>
      <div className="doc-edit-modal" onClick={e => e.stopPropagation()}>
        <div className="doc-edit-modal__header">
          <h3>Edit Document</h3>
          <button onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="doc-edit-modal__form">
          <label><span>Title</span>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          </label>
          <label><span>Summary</span>
            <textarea value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} rows={4} />
          </label>
          <div className="doc-edit-modal__row">
            <label><span>Category</span>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="life">Life</option>
                <option value="finance">Finance</option>
                <option value="health">Health</option>
                <option value="investing">Investing</option>
              </select>
            </label>
            <label><span>Date</span>
              <input type="date" value={form.date || ''} onChange={e => setForm({ ...form, date: e.target.value })} />
            </label>
          </div>
          <label><span>Provider</span>
            <input value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })} placeholder="Organization, clinic, company..." />
          </label>
          <label><span>Tags (comma-separated)</span>
            <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="contract, legal, insurance..." />
          </label>
          <div className="doc-edit-modal__actions">
            <button type="button" className="doc-edit-modal__cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="doc-edit-modal__save" disabled={saving}>
              <Save size={14} /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
  const [editingDoc, setEditingDoc] = useState(null);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Load available tags on mount
  useEffect(() => {
    fetch('/api/documents/tags')
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
      const res = await fetch(`/api/documents?${params}`);
      if (res.ok) setDocuments(await res.json());
    } catch { /* ignore */ }
    setSearching(false);
  };

  // Show all docs when user clicks search with no filter
  const showAll = async () => {
    setSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch('/api/documents');
      if (res.ok) setDocuments(await res.json());
    } catch { /* ignore */ }
    setSearching(false);
  };

  const handleDelete = async (docId) => {
    if (!confirm('Delete this document permanently?')) return;
    await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
    setDocuments(prev => prev.filter(d => d.id !== docId));
  };

  const viewFile = (doc) => {
    window.open(`/api/documents/${doc.id}/view`, '_blank');
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
                            <button className="doc-item__edit-btn" onClick={() => setEditingDoc(doc)}>
                              <Pencil size={13} /> Edit
                            </button>
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

      {editingDoc && (
        <DocEditModal
          doc={editingDoc}
          onClose={() => setEditingDoc(null)}
          onSave={() => { setEditingDoc(null); performSearch(); }}
        />
      )}
    </div>
  );
}
