import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Plus, X, Check } from 'lucide-react';
import { apiPost, apiPut, apiDelete } from '../../hooks/useApi';
import './ShoppingList.css';

export default function ShoppingList({ items, onRefresh }) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editQty, setEditQty] = useState('');
  const inputRef = useRef(null);

  const unchecked = (items || []).filter(i => !i.checked);
  const checked = (items || []).filter(i => i.checked);

  useEffect(() => {
    if (adding && inputRef.current) inputRef.current.focus();
  }, [adding]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);
    try {
      await apiPost('/api/life/shopping', {
        name: newName.trim(),
        quantity: newQty ? parseInt(newQty) : undefined,
      });
      setNewName('');
      setNewQty('');
      onRefresh();
      // Keep input open for rapid entry
      if (inputRef.current) inputRef.current.focus();
    } catch (err) {
      console.error('Failed to add item:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (item) => {
    try {
      await apiPut(`/api/life/shopping/${item.id}`, { checked: !item.checked });
      onRefresh();
    } catch (err) {
      console.error('Failed to toggle item:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiDelete(`/api/life/shopping/${id}`);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const handleClearChecked = async () => {
    try {
      await apiDelete('/api/life/shopping/checked');
      onRefresh();
    } catch (err) {
      console.error('Failed to clear checked:', err);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditQty(item.quantity != null ? String(item.quantity) : '');
  };

  const saveEdit = async () => {
    if (!editName.trim()) return;
    try {
      await apiPut(`/api/life/shopping/${editingId}`, {
        name: editName.trim(),
        quantity: editQty ? parseInt(editQty) : null,
      });
      setEditingId(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to edit item:', err);
    }
  };

  const handleEditKey = (e) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') setEditingId(null);
  };

  const renderItem = (item) => {
    const isEditing = editingId === item.id;

    return (
      <motion.div
        key={item.id}
        className={`shopping__item ${item.checked ? 'shopping__item--checked' : ''}`}
        layout
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
      >
        <button
          className={`shopping__check ${item.checked ? 'shopping__check--done' : ''}`}
          onClick={() => handleToggle(item)}
        >
          {item.checked ? <Check size={14} /> : <div className="shopping__check-circle" />}
        </button>

        {isEditing ? (
          <div className="shopping__edit-row">
            <input
              className="shopping__edit-input"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onKeyDown={handleEditKey}
              onBlur={saveEdit}
              autoFocus
            />
            <input
              className="shopping__edit-qty"
              type="number"
              value={editQty}
              onChange={e => setEditQty(e.target.value)}
              onKeyDown={handleEditKey}
              placeholder="Qty"
              min="1"
            />
          </div>
        ) : (
          <span className="shopping__name" onClick={() => !item.checked && startEdit(item)}>
            {item.name}
            {item.quantity != null && <span className="shopping__qty">&times;{item.quantity}</span>}
          </span>
        )}

        <button className="shopping__delete" onClick={() => handleDelete(item.id)}>
          <X size={14} />
        </button>
      </motion.div>
    );
  };

  return (
    <div className="shopping card">
      <div className="shopping__header">
        <h3 className="shopping__title">
          <ShoppingCart size={16} />
          Shopping List
        </h3>
        <button
          className="shopping__add-btn"
          onClick={() => setAdding(!adding)}
          title="Add item"
        >
          <Plus size={16} />
        </button>
      </div>

      {adding && (
        <form className="shopping__add-form" onSubmit={handleAdd}>
          <input
            ref={inputRef}
            className="shopping__add-input"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Item name..."
            disabled={submitting}
          />
          <input
            className="shopping__add-qty"
            type="number"
            value={newQty}
            onChange={e => setNewQty(e.target.value)}
            placeholder="Qty"
            min="1"
            disabled={submitting}
          />
          <button className="shopping__add-submit" type="submit" disabled={submitting || !newName.trim()}>
            Add
          </button>
        </form>
      )}

      <div className="shopping__list">
        {unchecked.length === 0 && checked.length === 0 && !adding && (
          <div className="shopping__empty">
            <ShoppingCart size={20} />
            <span>Nothing on the list</span>
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {unchecked.map(renderItem)}
        </AnimatePresence>
      </div>

      {checked.length > 0 && (
        <div className="shopping__checked-section">
          <div className="shopping__checked-divider">
            <span>Checked off</span>
          </div>
          <AnimatePresence mode="popLayout">
            {checked.map(renderItem)}
          </AnimatePresence>
          <button className="shopping__clear-btn" onClick={handleClearChecked}>
            Clear checked
          </button>
        </div>
      )}
    </div>
  );
}
