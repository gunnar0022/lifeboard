import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft, Folder, FileText, FolderPlus, FilePlus, ChevronRight, ChevronDown,
  Search, X, Trash2, Pencil, Save,
} from 'lucide-react';
import './CreativeWorkspace.css';

function MarkdownPreview({ content }) {
  // Simple markdown to HTML (basic rendering)
  const html = content
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hulo])(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '');

  return (
    <div
      className="workspace__preview-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function FileTreeNode({ entry, depth, onFileClick, onCreateFile, onCreateDir, onDelete }) {
  const [expanded, setExpanded] = useState(depth === 0);
  const [children, setChildren] = useState(null);
  const [loading, setLoading] = useState(false);

  const slug = entry.path.split('/')[0];

  const loadChildren = async () => {
    if (entry.type !== 'dir') return;
    setLoading(true);
    const pathPart = entry.path.split('/').slice(1).join('/');
    const res = await fetch(`/api/reading_creative/files?project_slug=${slug}&path=${encodeURIComponent(pathPart)}`);
    if (res.ok) setChildren(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    if (expanded && entry.type === 'dir' && children === null) {
      loadChildren();
    }
  }, [expanded]);

  const handleClick = () => {
    if (entry.type === 'dir') {
      setExpanded(!expanded);
    } else {
      onFileClick(entry);
    }
  };

  return (
    <div className="tree-node">
      <button
        className={`tree-node__row tree-node__row--depth-${Math.min(depth, 4)}`}
        onClick={handleClick}
        style={{ paddingLeft: 8 + depth * 16 }}
      >
        {entry.type === 'dir' ? (
          expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
        ) : (
          <FileText size={12} />
        )}
        <span className="tree-node__name">{entry.name}</span>
      </button>

      {expanded && entry.type === 'dir' && (
        <div className="tree-node__children">
          {loading && <div className="tree-node__loading">Loading...</div>}
          {children && children.map(child => (
            <FileTreeNode
              key={child.path}
              entry={child}
              depth={depth + 1}
              onFileClick={onFileClick}
              onCreateFile={onCreateFile}
              onCreateDir={onCreateDir}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CreativeWorkspace({ onBack }) {
  const [projects, setProjects] = useState([]);
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [fileContents, setFileContents] = useState({});
  const [dirtyFiles, setDirtyFiles] = useState(new Set());
  const [saveStatus, setSaveStatus] = useState('');
  const [viewMode, setViewMode] = useState('split');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [showNewFile, setShowNewFile] = useState(null); // project slug
  const [newFileName, setNewFileName] = useState('');
  const saveTimerRef = useRef(null);
  const [treeKey, setTreeKey] = useState(0);

  const refreshTree = () => setTreeKey(k => k + 1);

  // Load projects
  useEffect(() => {
    fetch('/api/reading_creative/projects')
      .then(r => r.json())
      .then(setProjects)
      .catch(() => {});
  }, [treeKey]);

  // Build file tree entries from projects
  const treeEntries = projects.map(p => ({
    name: p.name,
    type: 'dir',
    path: p.slug,
    project: p,
  }));

  // Open a file
  const openFile = async (entry) => {
    if (entry.type !== 'file') return;
    const slug = entry.path.split('/')[0];
    const filePath = entry.path.split('/').slice(1).join('/');

    // Check if tab already exists
    if (tabs.find(t => t.path === entry.path)) {
      setActiveTab(entry.path);
      return;
    }

    const res = await fetch(`/api/reading_creative/files/read?project_slug=${slug}&path=${encodeURIComponent(filePath)}`);
    if (!res.ok) return;
    const data = await res.json();

    setFileContents(prev => ({ ...prev, [entry.path]: data.content }));
    setTabs(prev => [...prev, { path: entry.path, name: entry.name }]);
    setActiveTab(entry.path);
  };

  // Close a tab
  const closeTab = (path) => {
    setTabs(prev => prev.filter(t => t.path !== path));
    setDirtyFiles(prev => { const n = new Set(prev); n.delete(path); return n; });
    if (activeTab === path) {
      const remaining = tabs.filter(t => t.path !== path);
      setActiveTab(remaining.length > 0 ? remaining[remaining.length - 1].path : null);
    }
  };

  // Handle content change
  const handleContentChange = (path, newContent) => {
    setFileContents(prev => ({ ...prev, [path]: newContent }));
    setDirtyFiles(prev => new Set(prev).add(path));
    setSaveStatus('Unsaved');

    // Auto-save after 3 seconds
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveFile(path, newContent), 3000);
  };

  // Save file
  const saveFile = async (path, content) => {
    const slug = path.split('/')[0];
    const filePath = path.split('/').slice(1).join('/');
    setSaveStatus('Saving...');

    try {
      await fetch('/api/reading_creative/files/write', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_slug: slug, path: filePath, content }),
      });
      setDirtyFiles(prev => { const n = new Set(prev); n.delete(path); return n; });
      setSaveStatus('Saved');
    } catch {
      setSaveStatus('Save failed');
    }
  };

  // Ctrl+S handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (activeTab && fileContents[activeTab] !== undefined) {
          if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
          saveFile(activeTab, fileContents[activeTab]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, fileContents]);

  // Search
  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults(null); return; }
    const res = await fetch(`/api/reading_creative/files/search?q=${encodeURIComponent(q)}`);
    if (res.ok) setSearchResults(await res.json());
  };

  // Create project
  const createProject = async () => {
    if (!newProjectName.trim()) return;
    await fetch('/api/reading_creative/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newProjectName }),
    });
    setNewProjectName('');
    setShowNewProject(false);
    refreshTree();
  };

  // Create file in project
  const createFile = async (projectSlug) => {
    if (!newFileName.trim()) return;
    const name = newFileName.endsWith('.md') ? newFileName : newFileName + '.md';
    await fetch('/api/reading_creative/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_slug: projectSlug, path: name, type: 'file', content: '' }),
    });
    setNewFileName('');
    setShowNewFile(null);
    refreshTree();
  };

  // Delete file
  const deleteFile = async (entry) => {
    const slug = entry.path.split('/')[0];
    const filePath = entry.path.split('/').slice(1).join('/');
    await fetch(`/api/reading_creative/files?project_slug=${slug}&path=${encodeURIComponent(filePath)}`, { method: 'DELETE' });
    closeTab(entry.path);
    refreshTree();
  };

  // Word count
  const activeContent = activeTab ? (fileContents[activeTab] || '') : '';
  const wordCount = activeContent.trim() ? activeContent.trim().split(/\s+/).length : 0;

  return (
    <div className="workspace">
      {/* Top bar */}
      <div className="workspace__topbar">
        <button className="workspace__back" onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="workspace__tabs">
          {tabs.map(tab => (
            <button
              key={tab.path}
              className={`workspace__tab ${activeTab === tab.path ? 'workspace__tab--active' : ''}`}
              onClick={() => setActiveTab(tab.path)}
            >
              {dirtyFiles.has(tab.path) && <span className="workspace__tab-dot" />}
              {tab.name}
              <span className="workspace__tab-close" onClick={(e) => { e.stopPropagation(); closeTab(tab.path); }}>
                <X size={12} />
              </span>
            </button>
          ))}
        </div>
        <div className="workspace__view-toggle">
          {['editor', 'split', 'preview'].map(m => (
            <button
              key={m}
              className={viewMode === m ? 'active' : ''}
              onClick={() => setViewMode(m)}
            >
              {m === 'editor' ? 'Edit' : m === 'split' ? 'Split' : 'Read'}
            </button>
          ))}
        </div>
      </div>

      <div className="workspace__main">
        {/* Sidebar */}
        <div className="workspace__sidebar">
          <div className="workspace__tree" key={treeKey}>
            {treeEntries.map(entry => (
              <div key={entry.path}>
                <FileTreeNode
                  entry={entry}
                  depth={0}
                  onFileClick={openFile}
                  onCreateFile={() => setShowNewFile(entry.path)}
                  onCreateDir={() => {}}
                  onDelete={deleteFile}
                />
                {showNewFile === entry.path && (
                  <div className="workspace__inline-form" style={{ paddingLeft: 24 }}>
                    <input
                      autoFocus
                      placeholder="filename.md"
                      value={newFileName}
                      onChange={e => setNewFileName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && createFile(entry.path)}
                    />
                    <button onClick={() => createFile(entry.path)}><FilePlus size={12} /></button>
                    <button onClick={() => setShowNewFile(null)}><X size={12} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="workspace__sidebar-actions">
            {showNewProject ? (
              <div className="workspace__inline-form">
                <input
                  autoFocus
                  placeholder="Project name"
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createProject()}
                />
                <button onClick={createProject}><FolderPlus size={12} /></button>
                <button onClick={() => setShowNewProject(false)}><X size={12} /></button>
              </div>
            ) : (
              <button className="workspace__new-project" onClick={() => setShowNewProject(true)}>
                <FolderPlus size={14} /> New Project
              </button>
            )}

            <div className="workspace__search">
              <Search size={13} />
              <input
                placeholder="Search files..."
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
              />
            </div>

            {searchResults && (
              <div className="workspace__search-results">
                {searchResults.length === 0 ? (
                  <div className="workspace__search-empty">No results</div>
                ) : (
                  searchResults.map((r, i) => (
                    <button
                      key={i}
                      className="workspace__search-result"
                      onClick={() => {
                        openFile({ path: r.file_path, name: r.file_name, type: 'file' });
                        setSearchQuery('');
                        setSearchResults(null);
                      }}
                    >
                      <FileText size={12} />
                      <span>{r.file_name}</span>
                      <span className="workspace__search-project">{r.project_name}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Editor area */}
        <div className="workspace__editor-area">
          {!activeTab ? (
            <div className="workspace__empty">
              <FileText size={32} />
              <p>Select a file from the sidebar to start editing</p>
            </div>
          ) : (
            <div className={`workspace__panes workspace__panes--${viewMode}`}>
              {(viewMode === 'editor' || viewMode === 'split') && (
                <textarea
                  className="workspace__editor"
                  value={fileContents[activeTab] || ''}
                  onChange={e => handleContentChange(activeTab, e.target.value)}
                  spellCheck={false}
                />
              )}
              {(viewMode === 'preview' || viewMode === 'split') && (
                <div className="workspace__preview">
                  <MarkdownPreview content={fileContents[activeTab] || ''} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="workspace__statusbar">
        <span>{activeTab ? activeTab.split('/')[0] : 'No file open'}</span>
        <span>{wordCount} words</span>
        <span>{saveStatus}</span>
      </div>
    </div>
  );
}
