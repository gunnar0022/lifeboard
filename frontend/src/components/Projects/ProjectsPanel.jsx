import { useState } from 'react';
import { motion } from 'framer-motion';
import { FolderKanban, Github } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
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

function ProjectCard({ project }) {
  const githubUrl = project.context_bucket?.github_url;

  if (!project.card_html) {
    return (
      <div className="project-card project-card--placeholder">
        <h3 className="project-card__fallback-name">{project.name}</h3>
        <p className="project-card__fallback-desc">Card not yet generated</p>
        {githubUrl && (
          <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="project-card__github">
            <Github size={14} /> GitHub
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="project-card" style={{ isolation: 'isolate' }}>
      <div dangerouslySetInnerHTML={{ __html: project.card_html }} />
      {githubUrl && (
        <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="project-card__github">
          <Github size={14} /> GitHub
        </a>
      )}
    </div>
  );
}

function StageTier({ stage, projects }) {
  const config = STAGE_CONFIG[stage];
  if (!projects || projects.length === 0) return null;

  return (
    <motion.div variants={fadeUp} className="projects-tier">
      <div className="projects-tier__header">
        <span className="projects-tier__label">{config.label}</span>
        <span className="projects-tier__count">{projects.length}</span>
      </div>
      <div className="projects-tier__cards">
        {projects.map(p => (
          <motion.div
            key={p.id}
            variants={fadeUp}
            className="projects-tier__card-wrap"
          >
            <ProjectCard project={p} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default function ProjectsPanel() {
  const { data, loading } = useApi('/api/projects');

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
        />
      ))}
    </motion.div>
  );
}
