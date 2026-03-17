import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, ChevronDown, ChevronRight, AlertCircle, Camera,
  Home, Shield, Scale, Heart, Wallet, FolderOpen,
} from 'lucide-react';
import './DocumentRegistry.css';

const CATEGORY_ICONS = {
  housing: Home,
  insurance: Shield,
  legal: Scale,
  medical: Heart,
  financial: Wallet,
  other: FolderOpen,
};

function getExpiryStatus(expiryDate) {
  if (!expiryDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate + 'T00:00:00');
  const diff = Math.floor((exp - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { text: 'Expired', className: 'expired' };
  if (diff <= 30) return { text: `${diff}d`, className: 'expiring' };
  return { text: exp.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), className: 'normal' };
}

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
    <div className="doc-item__fields">
      {entries.map(([key, value]) => (
        <div key={key} className="doc-item__field">
          <span className="doc-item__field-label">{formatFieldLabel(key)}</span>
          <span className="doc-item__field-value">{String(value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function DocumentRegistry({ documents }) {
  const [expanded, setExpanded] = useState(true);
  const [expandedDoc, setExpandedDoc] = useState(null);
  const [viewingPhoto, setViewingPhoto] = useState(null);

  // Group by category
  const grouped = {};
  for (const doc of documents) {
    const cat = doc.category || 'other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(doc);
  }

  return (
    <div className="doc-registry card">
      <button
        className="doc-registry__header"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="chart-title">
          <FileText size={16} />
          Documents
          <span className="doc-registry__count">{documents.length}</span>
        </h3>
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="doc-registry__body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {documents.length === 0 ? (
              <div className="doc-registry__empty">
                <FileText size={24} />
                <p>No documents tracked yet</p>
              </div>
            ) : (
              Object.entries(grouped).map(([category, docs]) => {
                const Icon = CATEGORY_ICONS[category] || FolderOpen;
                return (
                  <div key={category} className="doc-group">
                    <div className="doc-group__title">
                      <Icon size={14} />
                      <span>{category}</span>
                    </div>
                    {docs.map(doc => {
                      const expiry = getExpiryStatus(doc.expiry_date);
                      const files = doc.files || [];
                      const photoFile = files.find(f => f.file_path && f.mime_type?.startsWith('image/'));
                      const extractedData = files.reduce((acc, f) => acc || parseExtractedData(f), null);
                      const isExpanded = expandedDoc === doc.id;

                      return (
                        <div key={doc.id} className="doc-item">
                          <button
                            className="doc-item__row"
                            onClick={() => {
                              setExpandedDoc(isExpanded ? null : doc.id);
                              if (isExpanded) setViewingPhoto(null);
                            }}
                          >
                            <span className="doc-item__name">
                              {doc.name}
                              {photoFile && (
                                <span className="doc-item__photo-badge" title="Has photo">
                                  <Camera size={10} />
                                </span>
                              )}
                            </span>
                            {expiry && (
                              <span className={`doc-item__expiry doc-item__expiry--${expiry.className}`}>
                                {expiry.className === 'expired' && <AlertCircle size={10} />}
                                {expiry.text}
                              </span>
                            )}
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                className="doc-item__detail"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                              >
                                {extractedData ? (
                                  <ExtractedFields data={extractedData} />
                                ) : doc.notes ? (
                                  <div className="doc-item__notes">{doc.notes}</div>
                                ) : null}

                                {photoFile && (
                                  <button
                                    className="doc-item__view-photo"
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
                                  <div className="doc-item__photo">
                                    <img
                                      src={`/api/life/files/${photoFile.id}/view`}
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
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
