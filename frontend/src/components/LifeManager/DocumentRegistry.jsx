import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, ChevronDown, ChevronRight, AlertCircle, Paperclip,
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

export default function DocumentRegistry({ documents, files }) {
  const [expanded, setExpanded] = useState(true);
  const [expandedDoc, setExpandedDoc] = useState(null);

  // Group by category
  const grouped = {};
  for (const doc of documents) {
    const cat = doc.category || 'other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(doc);
  }

  // Count files per document
  const filesByDoc = {};
  if (files) {
    for (const f of files) {
      const docId = f.linked_document_id;
      if (docId) {
        if (!filesByDoc[docId]) filesByDoc[docId] = [];
        filesByDoc[docId].push(f);
      }
    }
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
                      const docFiles = filesByDoc[doc.id] || [];
                      const isExpanded = expandedDoc === doc.id;

                      return (
                        <div key={doc.id} className="doc-item">
                          <button
                            className="doc-item__row"
                            onClick={() => setExpandedDoc(isExpanded ? null : doc.id)}
                          >
                            <span className="doc-item__name">
                              {doc.name}
                              {docFiles.length > 0 && (
                                <span className="doc-item__file-badge" title={`${docFiles.length} file${docFiles.length > 1 ? 's' : ''}`}>
                                  <Paperclip size={10} />
                                  {docFiles.length}
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
                            {isExpanded && doc.notes && (
                              <motion.div
                                className="doc-item__notes"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                              >
                                {doc.notes}
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
