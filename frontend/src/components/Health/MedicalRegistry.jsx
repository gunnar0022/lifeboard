import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, ChevronDown, ChevronRight, Camera,
  Stethoscope, Syringe, Pill, FlaskConical, ScanLine, SmilePlus, Eye, FolderOpen,
  Search, ArrowUpDown, X,
} from 'lucide-react';
import './MedicalRegistry.css';

const CATEGORY_ICONS = {
  checkup: Stethoscope,
  vaccination: Syringe,
  prescription: Pill,
  lab_result: FlaskConical,
  imaging: ScanLine,
  dental: SmilePlus,
  vision: Eye,
  other: FolderOpen,
};

const CATEGORY_LABELS = {
  checkup: 'Checkup',
  vaccination: 'Vaccination',
  prescription: 'Prescription',
  lab_result: 'Lab Result',
  imaging: 'Imaging',
  dental: 'Dental',
  vision: 'Vision',
  other: 'Other',
};

function parseExtractedData(file) {
  if (!file?.extracted_data) return null;
  try {
    const data = typeof file.extracted_data === 'string'
      ? JSON.parse(file.extracted_data)
      : file.extracted_data;
    if (typeof data === 'object' && data !== null) return data;
  } catch { /* ignore */ }
  return null;
}

function formatFieldLabel(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function ExtractedFields({ data }) {
  if (!data) return null;
  const entries = Object.entries(data).filter(
    ([, v]) => v != null && v !== '' && typeof v !== 'object'
  );
  if (entries.length === 0) return null;

  return (
    <div className="med-item__fields">
      {entries.map(([key, value]) => (
        <div key={key} className="med-item__field">
          <span className="med-item__field-label">{formatFieldLabel(key)}</span>
          <span className="med-item__field-value">{String(value)}</span>
        </div>
      ))}
    </div>
  );
}

const SORT_OPTIONS = [
  { key: 'date', label: 'Date' },
  { key: 'name', label: 'Name' },
  { key: 'newest', label: 'Newest' },
];

export default function MedicalRegistry({ documents }) {
  const [expanded, setExpanded] = useState(true);
  const [expandedDoc, setExpandedDoc] = useState(null);
  const [viewingPhoto, setViewingPhoto] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const categories = useMemo(() => {
    const cats = new Set();
    for (const doc of documents) cats.add(doc.category || 'other');
    return ['all', ...Array.from(cats).sort()];
  }, [documents]);

  const filteredDocs = useMemo(() => {
    let result = [...documents];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(doc => {
        if (doc.name?.toLowerCase().includes(q)) return true;
        if (doc.provider?.toLowerCase().includes(q)) return true;
        if (doc.notes?.toLowerCase().includes(q)) return true;
        const files = doc.files || [];
        for (const f of files) {
          const data = parseExtractedData(f);
          if (data) {
            for (const v of Object.values(data)) {
              if (String(v).toLowerCase().includes(q)) return true;
            }
          }
        }
        return false;
      });
    }

    if (activeCategory !== 'all') {
      result = result.filter(doc => (doc.category || 'other') === activeCategory);
    }

    result.sort((a, b) => {
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'date') {
        const da = a.date || '0000-00-00';
        const db = b.date || '0000-00-00';
        return db.localeCompare(da); // newest date first
      }
      return (b.id || 0) - (a.id || 0);
    });

    return result;
  }, [documents, searchQuery, activeCategory, sortBy]);

  const grouped = {};
  for (const doc of filteredDocs) {
    const cat = doc.category || 'other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(doc);
  }

  const isFiltering = searchQuery || activeCategory !== 'all';
  const cycleSortBy = () => {
    const idx = SORT_OPTIONS.findIndex(o => o.key === sortBy);
    setSortBy(SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length].key);
  };

  return (
    <div className="med-registry card">
      <button
        className="med-registry__header"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="chart-title">
          <FileText size={16} />
          Medical Records
          <span className="med-registry__count">{documents.length}</span>
        </h3>
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="med-registry__body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {documents.length > 0 && (
              <div className="med-toolbar">
                <div className="med-toolbar__search">
                  <Search size={14} />
                  <input
                    type="text"
                    placeholder="Search records..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button className="med-toolbar__clear" onClick={() => setSearchQuery('')}>
                      <X size={12} />
                    </button>
                  )}
                </div>

                <div className="med-toolbar__filters">
                  <div className="med-toolbar__pills">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        className={`med-pill${activeCategory === cat ? ' med-pill--active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                      >
                        {cat === 'all' ? 'All' : (CATEGORY_LABELS[cat] || cat)}
                      </button>
                    ))}
                  </div>

                  <button className="med-toolbar__sort" onClick={cycleSortBy} title={`Sort: ${sortBy}`}>
                    <ArrowUpDown size={13} />
                    {SORT_OPTIONS.find(o => o.key === sortBy)?.label}
                  </button>
                </div>
              </div>
            )}

            {documents.length === 0 ? (
              <div className="med-registry__empty">
                <FileText size={24} />
                <p>No medical records yet</p>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="med-registry__empty">
                <Search size={20} />
                <p>No records match your filters</p>
              </div>
            ) : (
              <>
                {Object.entries(grouped).map(([category, docs]) => {
                  const Icon = CATEGORY_ICONS[category] || FolderOpen;
                  return (
                    <div key={category} className="med-group">
                      <div className="med-group__title">
                        <Icon size={14} />
                        <span>{CATEGORY_LABELS[category] || category}</span>
                        <span className="med-group__count">{docs.length}</span>
                      </div>
                      {docs.map(doc => {
                        const files = doc.files || [];
                        const photoFile = files.find(f => f.file_path && f.mime_type?.startsWith('image/'));
                        const extractedData = files.reduce((acc, f) => acc || parseExtractedData(f), null);
                        const isExpanded = expandedDoc === doc.id;

                        return (
                          <div key={doc.id} className="med-item">
                            <button
                              className="med-item__row"
                              onClick={() => {
                                setExpandedDoc(isExpanded ? null : doc.id);
                                if (isExpanded) setViewingPhoto(null);
                              }}
                            >
                              <div className="med-item__name-col">
                                <span className="med-item__name">
                                  {doc.name}
                                  {photoFile && (
                                    <span className="med-item__photo-badge" title="Has photo">
                                      <Camera size={10} />
                                    </span>
                                  )}
                                </span>
                                {doc.provider && (
                                  <span className="med-item__provider">{doc.provider}</span>
                                )}
                              </div>
                              {doc.date && (
                                <span className="med-item__date mono">
                                  {doc.date}
                                </span>
                              )}
                            </button>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  className="med-item__detail"
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                >
                                  {extractedData ? (
                                    <ExtractedFields data={extractedData} />
                                  ) : doc.notes ? (
                                    <div className="med-item__notes">{doc.notes}</div>
                                  ) : null}

                                  {photoFile && (
                                    <button
                                      className="med-item__view-photo"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setViewingPhoto(viewingPhoto === photoFile.id ? null : photoFile.id);
                                      }}
                                    >
                                      <Camera size={12} />
                                      {viewingPhoto === photoFile.id ? 'Hide photo' : 'View original'}
                                    </button>
                                  )}

                                  {viewingPhoto === photoFile?.id && (
                                    <div className="med-item__photo">
                                      <img
                                        src={`/api/health_body/files/${photoFile.id}/view`}
                                        alt={doc.name}
                                      />
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
                {isFiltering && (
                  <div className="med-registry__results-count">
                    {filteredDocs.length} of {documents.length} records
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
