import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderKanban, Github, ChevronDown, ChevronRight, Save } from 'lucide-react';
import { useApi, apiPut } from '../../hooks/useApi';
import './ProjectsPanel.css';

const STAGE_CONFIG = {
  working_on: { label: 'Working On', order: 0 },
  mostly_polished: { label: 'Mostly Polished', order: 1 },
  scaffolding: { label: 'Scaffolding', order: 2 },
};

const STAGES = ['working_on', 'mostly_polished', 'scaffolding'];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

function ProjectCard({ project, onStageChange }) {
  const githubUrl = project.context_bucket?.github_url;
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState(project.notes || '');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => { setNotes(project.notes || ''); setDirty(false); }, [project.notes]);

  const handleNotesChange = (val) => {
    setNotes(val);
    setDirty(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveNotes(val), 2000);
  };

  const saveNotes = async (text) => {
    setSaving(true);
    try {
      await apiPut(`/api/projects/${project.id}/notes`, { notes: text });
      setDirty(false);
    } catch (e) {
      console.error('Failed to save notes:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', project.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className="project-card"
      style={{ isolation: 'isolate' }}
      draggable
      onDragStart={handleDragStart}
    >
      {project.card_html ? (
        <div dangerouslySetInnerHTML={{ __html: project.card_html }} />
      ) : (
        <div className="project-card__fallback">
          <h3 className="project-card__fallback-name">{project.name}</h3>
          <p className="project-card__fallback-desc">Card not yet generated</p>
        </div>
      )}

      {githubUrl && (
        <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="project-card__github" onClick={e => e.stopPropagation()}>
          <Github size={14} /> GitHub
        </a>
      )}

      <button
        className="project-card__notes-toggle"
        onClick={() => setNotesOpen(!notesOpen)}
      >
        {notesOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        Notes
        {dirty && <span className="project-card__notes-dirty">*</span>}
        {saving && <Save size={10} className="project-card__notes-saving" />}
      </button>

      <AnimatePresence>
        {notesOpen && (
          <motion.div
            className="project-card__notes"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <textarea
              className="project-card__notes-editor"
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Project notes..."
              rows={6}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StageTier({ stage, projects, onDrop, onStageChange }) {
  const config = STAGE_CONFIG[stage];
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const projectId = e.dataTransfer.getData('text/plain');
    if (projectId) onDrop(projectId, stage);
  };

  return (
    <motion.div
      variants={fadeUp}
      className={`projects-tier ${dragOver ? 'projects-tier--drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="projects-tier__header">
        <span className="projects-tier__label">{config.label}</span>
        <span className="projects-tier__count">{projects.length}</span>
      </div>
      {projects.length > 0 ? (
        <div className="projects-tier__cards">
          {projects.map(p => (
            <motion.div key={p.id} variants={fadeUp} className="projects-tier__card-wrap">
              <ProjectCard project={p} onStageChange={onStageChange} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="projects-tier__empty-drop">
          Drop a project here
        </div>
      )}
    </motion.div>
  );
}

export default function ProjectsPanel() {
  const { data, loading, refetch } = useApi('/api/projects');

  const handleDrop = async (projectId, newStage) => {
    try {
      await apiPut(`/api/projects/${projectId}/stage`, { stage: newStage });
      refetch();
    } catch (e) {
      console.error('Failed to move project:', e);
    }
  };

  if (loading) {
    return (
      <div className="projects-panel">
        <div className="projects-panel__header">
          <div className="projects-panel__title-group">
            <span className="projects-panel__icon"><FolderKanban size={24} /></span>
            <h2 className="projects-panel__title">Projects</h2>
          </div>
        </div>
        <div className="projects-panel__loading">
          <div className="skeleton" style={{ height: 120, width: '100%', borderRadius: 12 }} />
          <div className="skeleton" style={{ height: 120, width: '100%', borderRadius: 12 }} />
          <div className="skeleton" style={{ height: 120, width: '100%', borderRadius: 12 }} />
        </div>
      </div>
    );
  }

  const projects = data?.projects || [];
  const grouped = {};
  for (const stage of STAGES) {
    grouped[stage] = projects.filter(p => p.stage === stage);
  }

  const hasAny = projects.length > 0;

  return (
    <motion.div
      className="projects-panel"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeUp} className="projects-panel__header">
        <div className="projects-panel__title-group">
          <span className="projects-panel__icon"><FolderKanban size={24} /></span>
          <h2 className="projects-panel__title">Projects</h2>
        </div>
      </motion.div>

      {!hasAny && (
        <motion.div variants={fadeUp} className="projects-panel__empty">
          <div className="projects-panel__empty-icon"><FolderKanban size={40} /></div>
          <h3>No projects yet</h3>
          <p>Ask Claude Code to add a project to get started.</p>
        </motion.div>
      )}

      {hasAny && STAGES.map(stage => (
        <StageTier
          key={stage}
          stage={stage}
          projects={grouped[stage]}
          onDrop={handleDrop}
          onStageChange={refetch}
        />
      ))}
    </motion.div>
  );
}
