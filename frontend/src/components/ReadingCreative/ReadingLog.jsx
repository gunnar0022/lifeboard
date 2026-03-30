import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, ChevronDown, ChevronRight, Check, Plus, X, BookMarked, Star, Edit3, Trash2,
} from 'lucide-react';
import './ReadingLog.css';

function StarRating({ value, onChange, size = 18 }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-rating" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          className={`star-rating__star ${n <= (hover || value) ? 'star-rating__star--filled' : ''}`}
          onMouseEnter={() => onChange && setHover(n)}
          onClick={() => onChange && onChange(n)}
          type="button"
        >
          <Star size={size} />
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ value, size = 13 }) {
  return (
    <span className="star-display">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} size={size} className={n <= value ? 'star-display--filled' : 'star-display--empty'} />
      ))}
    </span>
  );
}

export default function ReadingLog({ books, onRefresh }) {
  const [expanded, setExpanded] = useState(true);
  const [expandedBook, setExpandedBook] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ title: '', author: '', status: 'to_read', recommended_by: '' });
  const [showFinished, setShowFinished] = useState(false);

  // Completion modal state
  const [completing, setCompleting] = useState(null); // book object or null
  const [completeRating, setCompleteRating] = useState(0);
  const [completeNotes, setCompleteNotes] = useState('');

  // Edit finished book state
  const [editingBook, setEditingBook] = useState(null); // book id or null
  const [editRating, setEditRating] = useState(0);
  const [editNotes, setEditNotes] = useState('');
  const [editDate, setEditDate] = useState('');

  const reading = books.filter(b => b.status === 'reading');
  const toRead = books.filter(b => b.status === 'to_read');
  const finished = books.filter(b => b.status === 'finished');

  const handleAdd = async () => {
    if (!addForm.title.trim()) return;
    await fetch('/api/reading_creative/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    });
    setAddForm({ title: '', author: '', status: 'to_read', recommended_by: '' });
    setShowAdd(false);
    onRefresh();
  };

  const handleStartComplete = (book) => {
    setCompleting(book);
    setCompleteRating(0);
    setCompleteNotes('');
  };

  const handleConfirmComplete = async () => {
    if (!completing) return;
    await fetch(`/api/reading_creative/books/${completing.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'finished',
        date_finished: new Date().toISOString().split('T')[0],
        rating: completeRating || null,
        reflection: completeNotes.trim() || null,
      }),
    });
    setCompleting(null);
    onRefresh();
  };

  const handleStatusChange = async (bookId, newStatus) => {
    await fetch(`/api/reading_creative/books/${bookId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    onRefresh();
  };

  const handleDelete = async (bookId) => {
    await fetch(`/api/reading_creative/books/${bookId}`, { method: 'DELETE' });
    onRefresh();
  };

  const startEditFinished = (book) => {
    setEditingBook(book.id);
    setEditRating(book.rating || 0);
    setEditNotes(book.reflection || '');
    setEditDate(book.date_finished || '');
  };

  const saveEditFinished = async (bookId) => {
    await fetch(`/api/reading_creative/books/${bookId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rating: editRating || null,
        reflection: editNotes.trim() || null,
        date_finished: editDate || null,
      }),
    });
    setEditingBook(null);
    onRefresh();
  };

  const deleteFinished = async (bookId) => {
    await fetch(`/api/reading_creative/books/${bookId}`, { method: 'DELETE' });
    setEditingBook(null);
    setExpandedBook(null);
    onRefresh();
  };

  return (
    <div className="reading-log card">
      <button className="reading-log__header" onClick={() => setExpanded(!expanded)}>
        <h3 className="chart-title">
          <BookOpen size={16} />
          Reading Log
          <span className="reading-log__count">{books.length}</span>
        </h3>
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="reading-log__body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {/* Currently Reading */}
            {reading.length > 0 && (
              <div className="reading-log__section">
                <h4 className="reading-log__section-title">Currently Reading</h4>
                {reading.map(book => (
                  <div key={book.id} className="book-item book-item--reading">
                    <BookMarked size={14} className="book-item__icon" />
                    <div className="book-item__info">
                      <span className="book-item__title">{book.title}</span>
                      {book.author && <span className="book-item__author">{book.author}</span>}
                    </div>
                    <button className="book-item__action" onClick={() => handleStartComplete(book)} title="Mark finished">
                      <Check size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* To Read */}
            <div className="reading-log__section">
              <div className="reading-log__section-header">
                <h4 className="reading-log__section-title">To Read ({toRead.length})</h4>
                <button className="reading-log__add-btn" onClick={() => setShowAdd(!showAdd)}>
                  {showAdd ? <X size={14} /> : <Plus size={14} />}
                </button>
              </div>

              {showAdd && (
                <div className="reading-log__add-form">
                  <input
                    placeholder="Title"
                    value={addForm.title}
                    onChange={e => setAddForm({ ...addForm, title: e.target.value })}
                  />
                  <input
                    placeholder="Author"
                    value={addForm.author}
                    onChange={e => setAddForm({ ...addForm, author: e.target.value })}
                  />
                  <input
                    placeholder="Recommended by"
                    value={addForm.recommended_by}
                    onChange={e => setAddForm({ ...addForm, recommended_by: e.target.value })}
                  />
                  <button onClick={handleAdd} disabled={!addForm.title.trim()}>Add</button>
                </div>
              )}

              {toRead.map(book => (
                <div key={book.id} className="book-item">
                  <div className="book-item__info">
                    <span className="book-item__title">{book.title}</span>
                    {book.author && <span className="book-item__author">{book.author}</span>}
                    {book.recommended_by && (
                      <span className="book-item__rec">rec: {book.recommended_by}</span>
                    )}
                  </div>
                  <div className="book-item__actions">
                    <button onClick={() => handleStatusChange(book.id, 'reading')} title="Start reading">
                      <BookMarked size={13} />
                    </button>
                    <button onClick={() => handleDelete(book.id)} title="Remove">
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Finished */}
            {finished.length > 0 && (
              <div className="reading-log__section">
                <button
                  className="reading-log__section-toggle"
                  onClick={() => setShowFinished(!showFinished)}
                >
                  {showFinished ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  Finished ({finished.length})
                </button>

                <AnimatePresence>
                  {showFinished && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      {finished.map(book => (
                        <div key={book.id} className="book-item book-item--finished">
                          <button
                            className="book-item__info book-item__info--clickable"
                            onClick={() => setExpandedBook(expandedBook === book.id ? null : book.id)}
                          >
                            <span className="book-item__title">{book.title}</span>
                            {book.rating && <StarDisplay value={book.rating} />}
                            {book.date_finished && (
                              <span className="book-item__date mono">{book.date_finished}</span>
                            )}
                            <ChevronDown size={12} className={`book-item__expand-icon ${expandedBook === book.id ? 'book-item__expand-icon--open' : ''}`} />
                          </button>
                          <AnimatePresence>
                            {expandedBook === book.id && (
                              <motion.div
                                className="book-item__details"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                              >
                                {editingBook === book.id ? (
                                  <div className="book-item__edit-form">
                                    <div className="book-item__edit-field">
                                      <label>Rating</label>
                                      <StarRating value={editRating} onChange={setEditRating} size={20} />
                                    </div>
                                    <div className="book-item__edit-field">
                                      <label>Date Finished</label>
                                      <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} />
                                    </div>
                                    <div className="book-item__edit-field">
                                      <label>Notes</label>
                                      <textarea
                                        value={editNotes}
                                        onChange={e => setEditNotes(e.target.value)}
                                        placeholder="Thoughts, takeaways..."
                                        rows={3}
                                      />
                                    </div>
                                    <div className="book-item__edit-actions">
                                      <button className="book-item__edit-delete" onClick={() => deleteFinished(book.id)}>
                                        <Trash2 size={13} /> Delete Book
                                      </button>
                                      <div className="book-item__edit-right">
                                        <button className="book-item__edit-cancel" onClick={() => setEditingBook(null)}>Cancel</button>
                                        <button className="book-item__edit-save" onClick={() => saveEditFinished(book.id)}>Save</button>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    {book.author && <div className="book-item__detail"><strong>Author:</strong> {book.author}</div>}
                                    {book.recommended_by && <div className="book-item__detail"><strong>Recommended by:</strong> {book.recommended_by}</div>}
                                    {book.rating && (
                                      <div className="book-item__detail">
                                        <strong>Rating:</strong> <StarDisplay value={book.rating} />
                                      </div>
                                    )}
                                    {book.reflection && <div className="book-item__detail"><strong>Notes:</strong><p className="book-item__reflection">{book.reflection}</p></div>}
                                    {!book.reflection && !book.author && !book.recommended_by && (
                                      <div className="book-item__detail book-item__detail--empty">No additional details</div>
                                    )}
                                    <button className="book-item__edit-btn" onClick={() => startEditFinished(book)}>
                                      <Edit3 size={12} /> Edit
                                    </button>
                                  </>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion Modal */}
      <AnimatePresence>
        {completing && (
          <motion.div
            className="complete-modal__overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCompleting(null)}
          >
            <motion.div
              className="complete-modal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
            >
              <h3 className="complete-modal__title">
                <Check size={18} /> Finished Reading
              </h3>
              <p className="complete-modal__book">{completing.title}</p>
              {completing.author && <p className="complete-modal__author">by {completing.author}</p>}

              <div className="complete-modal__field">
                <label>Rate it</label>
                <StarRating value={completeRating} onChange={setCompleteRating} size={24} />
              </div>

              <div className="complete-modal__field">
                <label>Notes</label>
                <textarea
                  className="complete-modal__textarea"
                  value={completeNotes}
                  onChange={e => setCompleteNotes(e.target.value)}
                  placeholder="Thoughts, takeaways, favorite parts..."
                  rows={4}
                />
              </div>

              <div className="complete-modal__actions">
                <button className="complete-modal__cancel" onClick={() => setCompleting(null)}>Cancel</button>
                <button className="complete-modal__confirm" onClick={handleConfirmComplete}>
                  <Check size={14} /> Mark Complete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
