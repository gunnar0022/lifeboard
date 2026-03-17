import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, AlertTriangle, Clock, Plus } from 'lucide-react';
import { apiPost } from '../../hooks/useApi';
import './TaskBoard.css';

function getPriorityIcon(priority) {
  if (priority === 'high') return <AlertTriangle size={14} />;
  if (priority === 'medium') return <Clock size={14} />;
  return <Circle size={14} />;
}

function formatDueDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((d - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { text: `${Math.abs(diff)}d overdue`, overdue: true };
  if (diff === 0) return { text: 'Today', overdue: false };
  if (diff === 1) return { text: 'Tomorrow', overdue: false };
  if (diff <= 7) return { text: `${diff}d`, overdue: false };
  return { text: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), overdue: false };
}

export default function TaskBoard({ tasks, onRefresh }) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [completing, setCompleting] = useState(null);
  const [quickAdd, setQuickAdd] = useState('');
  const [adding, setAdding] = useState(false);

  const activeTasks = tasks.filter(t => !t.is_completed);
  const completedTasks = tasks.filter(t => t.is_completed);

  const handleComplete = async (taskId) => {
    setCompleting(taskId);
    try {
      await apiPost(`/api/life/tasks/${taskId}/complete`);
      onRefresh();
    } catch (err) {
      console.error('Failed to complete task:', err);
    } finally {
      setCompleting(null);
    }
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickAdd.trim()) return;
    setAdding(true);
    try {
      await apiPost('/api/life/tasks', { title: quickAdd.trim() });
      setQuickAdd('');
      onRefresh();
    } catch (err) {
      console.error('Failed to add task:', err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="task-board card">
      <h3 className="chart-title">Tasks</h3>

      {/* Quick add */}
      <form className="task-board__quick-add" onSubmit={handleQuickAdd}>
        <Plus size={16} className="task-board__quick-icon" />
        <input
          type="text"
          placeholder="Add a task..."
          value={quickAdd}
          onChange={(e) => setQuickAdd(e.target.value)}
          disabled={adding}
        />
      </form>

      {/* Active tasks */}
      {activeTasks.length === 0 ? (
        <div className="task-board__empty">
          <CheckCircle2 size={24} />
          <p>All caught up!</p>
        </div>
      ) : (
        <div className="task-board__list">
          <AnimatePresence>
            {activeTasks.map((task, i) => {
              const due = formatDueDate(task.due_date);
              return (
                <motion.div
                  key={task.id}
                  className={`task-item task-item--${task.priority}${due?.overdue ? ' task-item--overdue' : ''}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <button
                    className="task-item__check"
                    onClick={() => handleComplete(task.id)}
                    disabled={completing === task.id}
                    title="Complete task"
                  >
                    <Circle size={18} />
                  </button>
                  <div className="task-item__content">
                    <span className="task-item__title">{task.title}</span>
                    <span className="task-item__meta">
                      <span className={`task-priority task-priority--${task.priority}`}>
                        {getPriorityIcon(task.priority)}
                        {task.priority}
                      </span>
                      {task.category !== 'other' && (
                        <span className="task-item__category">{task.category}</span>
                      )}
                      {due && (
                        <span className={`task-item__due${due.overdue ? ' task-item__due--overdue' : ''}`}>
                          {due.text}
                        </span>
                      )}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Completed tasks toggle */}
      {completedTasks.length > 0 && (
        <>
          <button
            className="task-board__done-toggle"
            onClick={() => setShowCompleted(!showCompleted)}
          >
            <CheckCircle2 size={14} />
            {showCompleted ? 'Hide' : 'Show'} {completedTasks.length} completed
          </button>
          <AnimatePresence>
            {showCompleted && (
              <motion.div
                className="task-board__done-list"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                {completedTasks.map(task => (
                  <div key={task.id} className="task-item task-item--done">
                    <span className="task-item__check task-item__check--done">
                      <CheckCircle2 size={18} />
                    </span>
                    <span className="task-item__title task-item__title--done">
                      {task.title}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
