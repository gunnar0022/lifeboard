import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, ChevronDown, ChevronRight, Check, Plus, X, BookMarked,
} from 'lucide-react';
import './ReadingLog.css';

export default function ReadingLog({ books, onRefresh }) {
  const [expanded, setExpanded] = useState(true);
  const [expandedBook, setExpandedBook] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ title: '', author: '', status: 'to_read', recommended_by: '' });

  const reading = books.filter(b => b.status === 'reading');
  const toRead = books.filter(b => b.status === 'to_read');
  const finished = books.filter(b => b.status === 'finished');
  const [showFinished, setShowFinished] = useState(false);

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

  const handleStatusChange = async (bookId, newStatus) => {
    const body = { status: newStatus };
    if (newStatus === 'finished') {
      body.date_finished = new Date().toISOString().split('T')[0];
    }
    await fetch(`/api/reading_creative/books/${bookId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    onRefresh();
  };

  const handleDelete = async (bookId) => {
    await fetch(`/api/reading_creative/books/${bookId}`, { method: 'DELETE' });
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
                    <button className="book-item__action" onClick={() => handleStatusChange(book.id, 'finished')} title="Mark finished">
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
                            className="book-item__info"
                            onClick={() => setExpandedBook(expandedBook === book.id ? null : book.id)}
                            style={{ cursor: book.reflection ? 'pointer' : 'default' }}
                          >
                            <span className="book-item__title">{book.title}</span>
                            {book.author && <span className="book-item__author">{book.author}</span>}
                            {book.date_finished && (
                              <span className="book-item__date mono">{book.date_finished}</span>
                            )}
                          </button>
                          <AnimatePresence>
                            {expandedBook === book.id && book.reflection && (
                              <motion.p
                                className="book-item__reflection"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                              >
                                {book.reflection}
                              </motion.p>
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
    </div>
  );
}
