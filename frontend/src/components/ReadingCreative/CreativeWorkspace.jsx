import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft, Folder, FileText, FolderPlus, FilePlus, ChevronRight, ChevronDown,
  Search, X, Trash2, Pencil, Save, MoreHorizontal, Plus, FolderOpen,
} from 'lucide-react';
import './CreativeWorkspace.css';

/* ── Markdown Preview (simple) ── */
function MarkdownPreview({ content }) {
  const html = content
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hulo])(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '');
  return <div className="workspace__preview-content" dangerouslySetInnerHTML={{ __html: html }} />;
}

/* ── Context Menu ── */
function ContextMenu({ x, y, items, onClose }) {
  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener('click', handler);
    window.addEventListener('contextmenu', handler);
    return () => {
      window.removeEventListener('click', handler);
      window.removeEventListener('contextmenu', handler);
    };
  }, [onClose]);

  return (
    <div className="ctx-menu" style={{ left: x, top: y }}>
      {items.map((item, i) =>
        item.separator ? (
          <div key={i} className="ctx-menu__sep" />
        ) : (
          <button
            key={i}
            className={`ctx-menu__item ${item.danger ? 'ctx-menu__item--danger' : ''}`}
            onClick={() => { item.action(); onClose(); }}
          >
            {item.icon && <span className="ctx-menu__icon">{item.icon}</span>}
            {item.label}
          </button>
        )
      )}
    </div>
  );
}

/* ── File Tree Node ── */
function FileTreeNode({ entry, depth, onFileClick, activeProject, onContextMenu, dragState, onDragStart, onDragOver, onDrop }) {
  const [expanded, setExpanded] = useState(entry.name === '_ideas');
  const [children, setChildren] = useState(null);
  const [loading, setLoading] = useState(false);
  const nodeRef = useRef(null);

  const loadChildren = async () => {
    if (entry.type !== 'dir') return;
    const pathPart = entry.path.split('/').slice(1).join('/');
    setLoading(true);
    const res = await fetch(`/api/reading_creative/files?project_slug=${activeProject}&path=${encodeURIComponent(pathPart)}`);
    if (res.ok) setChildren(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    if (expanded && entry.type === 'dir' && children === null) loadChildren();
  }, [expanded]);

  // Refresh children when tree refreshes
  useEffect(() => {
    if (expanded && entry.type === 'dir') loadChildren();
  }, [entry._refreshKey]);

  const handleClick = () => {
    if (entry.type === 'dir') setExpanded(!expanded);
    else onFileClick(entry);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(e, entry);
  };

  const handleDragStart = (e) => {
    e.stopPropagation();
    onDragStart(entry);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    if (entry.type === 'dir') {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.classList.add('tree-node__row--drop-target');
    }
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('tree-node__row--drop-target');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('tree-node__row--drop-target');
    if (entry.type === 'dir') onDrop(entry);
  };

  return (
    <div className="tree-node">
      <button
        ref={nodeRef}
        className="tree-node__row"
        style={{ paddingLeft: 12 + depth * 16 }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {entry.type === 'dir' ? (
          <>
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <FolderOpen size={13} className="tree-node__icon tree-node__icon--dir" />
          </>
        ) : (
          <FileText size={13} className="tree-node__icon" />
        )}
        <span className="tree-node__name">{entry.name}</span>
      </button>
      {expanded && entry.type === 'dir' && (
        <div className="tree-node__children">
          {loading && <div className="tree-node__loading">...</div>}
          {children && children.map(child => (
            <FileTreeNode
              key={child.path}
              entry={{ ...child, _refreshKey: entry._refreshKey }}
              depth={depth + 1}
              onFileClick={onFileClick}
              activeProject={activeProject}
              onContextMenu={onContextMenu}
              dragState={dragState}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main Workspace ── */
export default function CreativeWorkspace({ onBack }) {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [fileContents, setFileContents] = useState({});
  const [dirtyFiles, setDirtyFiles] = useState(new Set());
  const [saveStatus, setSaveStatus] = useState('');
  const [viewMode, setViewMode] = useState('split');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [inlineCreate, setInlineCreate] = useState(null); // { parentPath, type: 'file'|'dir' }
  const [inlineCreateName, setInlineCreateName] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [treeKey, setTreeKey] = useState(0);
  const [dragItem, setDragItem] = useState(null);
  const saveTimerRef = useRef(null);

  const refreshTree = () => setTreeKey(k => k + 1);

  // Load projects (sorted by updated_at desc)
  useEffect(() => {
    fetch('/api/reading_creative/projects')
      .then(r => r.json())
      .then(ps => {
        const sorted = ps.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
        setProjects(sorted);
        if (!activeProject && sorted.length > 0) setActiveProject(sorted[0].slug);
      })
      .catch(() => {});
  }, [treeKey]);

  // File tree entries for current project
  const [treeEntries, setTreeEntries] = useState([]);
  useEffect(() => {
    if (!activeProject) { setTreeEntries([]); return; }
    fetch(`/api/reading_creative/files?project_slug=${activeProject}&path=`)
      .then(r => r.json())
      .then(setTreeEntries)
      .catch(() => setTreeEntries([]));
  }, [activeProject, treeKey]);

  // Open file
  const openFile = async (entry) => {
    if (entry.type !== 'file') return;
    const slug = entry.path.split('/')[0];
    const filePath = entry.path.split('/').slice(1).join('/');
    if (tabs.find(t => t.path === entry.path)) { setActiveTab(entry.path); return; }
    const res = await fetch(`/api/reading_creative/files/read?project_slug=${slug}&path=${encodeURIComponent(filePath)}`);
    if (!res.ok) return;
    const data = await res.json();
    setFileContents(prev => ({ ...prev, [entry.path]: data.content }));
    setTabs(prev => [...prev, { path: entry.path, name: entry.name }]);
    setActiveTab(entry.path);
  };

  const closeTab = (path) => {
    setTabs(prev => prev.filter(t => t.path !== path));
    setDirtyFiles(prev => { const n = new Set(prev); n.delete(path); return n; });
    if (activeTab === path) {
      const remaining = tabs.filter(t => t.path !== path);
      setActiveTab(remaining.length > 0 ? remaining[remaining.length - 1].path : null);
    }
  };

  const handleContentChange = (path, newContent) => {
    setFileContents(prev => ({ ...prev, [path]: newContent }));
    setDirtyFiles(prev => new Set(prev).add(path));
    setSaveStatus('Unsaved');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveFile(path, newContent), 3000);
  };

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
    } catch { setSaveStatus('Save failed'); }
  };

  // Ctrl+S
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (activeTab && fileContents[activeTab] !== undefined) {
          if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
          saveFile(activeTab, fileContents[activeTab]);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeTab, fileContents]);

  // Search
  const handleSearch = async (q) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults(null); return; }
    const res = await fetch(`/api/reading_creative/files/search?q=${encodeURIComponent(q)}`);
    if (res.ok) setSearchResults(await res.json());
  };

  // ── Context menu actions ──

  const handleTreeContextMenu = (e, entry) => {
    const items = [];
    if (entry.type === 'file') {
      items.push({ label: 'Open', icon: <FileText size={13} />, action: () => openFile(entry) });
      items.push({ separator: true });
      items.push({ label: 'Rename', icon: <Pencil size={13} />, action: () => startRename(entry) });
      items.push({ label: 'Delete', icon: <Trash2 size={13} />, danger: true, action: () => deleteEntry(entry) });
    } else {
      items.push({ label: 'New File', icon: <FilePlus size={13} />, action: () => startInlineCreate(entry.path, 'file') });
      items.push({ label: 'New Folder', icon: <FolderPlus size={13} />, action: () => startInlineCreate(entry.path, 'dir') });
      items.push({ separator: true });
      items.push({ label: 'Rename', icon: <Pencil size={13} />, action: () => startRename(entry) });
      items.push({ label: 'Delete All Contents', icon: <Trash2 size={13} />, danger: true, action: () => {
        if (confirm(`Delete "${entry.name}" and everything inside it?`)) deleteEntry(entry);
      }});
    }
    setContextMenu({ x: e.clientX, y: e.clientY, items });
  };

  const handleEmptyContextMenu = (e) => {
    e.preventDefault();
    if (!activeProject) return;
    setContextMenu({
      x: e.clientX, y: e.clientY,
      items: [
        { label: 'New File', icon: <FilePlus size={13} />, action: () => startInlineCreate('', 'file') },
        { label: 'New Folder', icon: <FolderPlus size={13} />, action: () => startInlineCreate('', 'dir') },
      ],
    });
  };

  const handleProjectContextMenu = (e, project) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX, y: e.clientY,
      items: [
        { label: 'New File', icon: <FilePlus size={13} />, action: () => { setActiveProject(project.slug); startInlineCreate('', 'file'); } },
        { label: 'New Folder', icon: <FolderPlus size={13} />, action: () => { setActiveProject(project.slug); startInlineCreate('', 'dir'); } },
        { separator: true },
        { label: 'Delete Project', icon: <Trash2 size={13} />, danger: true, action: async () => {
          if (confirm(`Delete "${project.name}" and ALL its files? This cannot be undone.`)) {
            await fetch(`/api/reading_creative/projects/${project.id}`, { method: 'DELETE' });
            if (activeProject === project.slug) setActiveProject(null);
            refreshTree();
          }
        }},
      ],
    });
  };

  // Rename
  const startRename = (entry) => {
    setRenaming(entry.path);
    setRenameValue(entry.name);
  };

  const finishRename = async () => {
    if (!renaming || !renameValue.trim()) { setRenaming(null); return; }
    const slug = renaming.split('/')[0];
    const oldPath = renaming.split('/').slice(1).join('/');
    await fetch('/api/reading_creative/files/rename', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_slug: slug, old_path: oldPath, new_name: renameValue }),
    });
    setRenaming(null);
    refreshTree();
  };

  // Inline create
  const startInlineCreate = (parentPath, type) => {
    setInlineCreate({ parentPath, type });
    setInlineCreateName(type === 'file' ? '' : '');
  };

  const finishInlineCreate = async () => {
    if (!inlineCreate || !inlineCreateName.trim() || !activeProject) { setInlineCreate(null); return; }
    let name = inlineCreateName.trim();
    if (inlineCreate.type === 'file' && !name.endsWith('.md')) name += '.md';
    const fullPath = inlineCreate.parentPath ? `${inlineCreate.parentPath}/${name}` : name;
    // parentPath is relative to project, but might include project slug at start from entry.path
    const cleanPath = fullPath.startsWith(activeProject + '/') ? fullPath.slice(activeProject.length + 1) : fullPath;
    await fetch('/api/reading_creative/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_slug: activeProject, path: cleanPath, type: inlineCreate.type, content: '' }),
    });
    setInlineCreate(null);
    setInlineCreateName('');
    refreshTree();
  };

  // Delete
  const deleteEntry = async (entry) => {
    const slug = entry.path.split('/')[0];
    const filePath = entry.path.split('/').slice(1).join('/');
    await fetch(`/api/reading_creative/files?project_slug=${slug}&path=${encodeURIComponent(filePath)}`, { method: 'DELETE' });
    closeTab(entry.path);
    refreshTree();
  };

  // Drag and drop
  const handleDrop = async (targetEntry) => {
    if (!dragItem || dragItem.path === targetEntry.path) { setDragItem(null); return; }
    const slug = dragItem.path.split('/')[0];
    const oldPath = dragItem.path.split('/').slice(1).join('/');
    const targetDir = targetEntry.path.split('/').slice(1).join('/');
    const newPath = targetDir ? `${targetDir}/${dragItem.name}` : dragItem.name;
    await fetch('/api/reading_creative/files/move', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_slug: slug, old_path: oldPath, new_path: newPath }),
    });
    setDragItem(null);
    refreshTree();
  };

  // Create project
  const createProject = async () => {
    if (!newProjectName.trim()) return;
    const res = await fetch('/api/reading_creative/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newProjectName }),
    });
    if (res.ok) {
      const p = await res.json();
      setActiveProject(p.slug);
    }
    setNewProjectName('');
    setShowNewProject(false);
    refreshTree();
  };

  const activeContent = activeTab ? (fileContents[activeTab] || '') : '';
  const wordCount = activeContent.trim() ? activeContent.trim().split(/\s+/).length : 0;

  return (
    <div className="workspace">
      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Project tabs bar */}
      <div className="workspace__project-bar">
        <button className="workspace__back" onClick={onBack}>
          <ArrowLeft size={16} />
        </button>
        <div className="workspace__project-tabs">
          {projects.map(p => (
            <button
              key={p.slug}
              className={`workspace__project-tab ${activeProject === p.slug ? 'workspace__project-tab--active' : ''}`}
              onClick={() => setActiveProject(p.slug)}
              onContextMenu={(e) => handleProjectContextMenu(e, p)}
            >
              {p.name}
            </button>
          ))}
          {showNewProject ? (
            <div className="workspace__project-tab-create">
              <input
                autoFocus
                placeholder="Project name"
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') createProject(); if (e.key === 'Escape') setShowNewProject(false); }}
                onBlur={() => { if (!newProjectName.trim()) setShowNewProject(false); }}
              />
            </div>
          ) : (
            <button className="workspace__project-tab workspace__project-tab--add" onClick={() => setShowNewProject(true)}>
              <Plus size={14} />
            </button>
          )}
        </div>
      </div>

      {/* File tabs bar */}
      <div className="workspace__topbar">
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
            <button key={m} className={viewMode === m ? 'active' : ''} onClick={() => setViewMode(m)}>
              {m === 'editor' ? 'Edit' : m === 'split' ? 'Split' : 'Read'}
            </button>
          ))}
        </div>
      </div>

      <div className="workspace__main">
        {/* Sidebar */}
        <div className="workspace__sidebar">
          <div
            className="workspace__tree"
            key={`${activeProject}-${treeKey}`}
            onContextMenu={handleEmptyContextMenu}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('workspace__tree--drop-target'); }}
            onDragLeave={(e) => { e.currentTarget.classList.remove('workspace__tree--drop-target'); }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('workspace__tree--drop-target');
              if (dragItem) handleDrop({ path: activeProject, name: activeProject, type: 'dir' });
            }}
          >
            {!activeProject ? (
              <div className="workspace__tree-empty">Select or create a project</div>
            ) : (
              <>
                {treeEntries.map(entry => {
                  if (renaming === entry.path) {
                    return (
                      <div key={entry.path} className="workspace__inline-form" style={{ paddingLeft: 12 }}>
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') finishRename(); if (e.key === 'Escape') setRenaming(null); }}
                          onBlur={finishRename}
                        />
                      </div>
                    );
                  }
                  return (
                    <FileTreeNode
                      key={entry.path}
                      entry={{ ...entry, _refreshKey: treeKey }}
                      depth={0}
                      onFileClick={openFile}
                      activeProject={activeProject}
                      onContextMenu={handleTreeContextMenu}
                      dragState={dragItem}
                      onDragStart={setDragItem}
                      onDragOver={() => {}}
                      onDrop={handleDrop}
                    />
                  );
                })}
                {inlineCreate && (
                  <div className="workspace__inline-form" style={{ paddingLeft: 12 }}>
                    {inlineCreate.type === 'dir' ? <FolderPlus size={13} /> : <FilePlus size={13} />}
                    <input
                      autoFocus
                      placeholder={inlineCreate.type === 'file' ? 'filename.md' : 'folder name'}
                      value={inlineCreateName}
                      onChange={e => setInlineCreateName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') finishInlineCreate(); if (e.key === 'Escape') setInlineCreate(null); }}
                      onBlur={() => { if (!inlineCreateName.trim()) setInlineCreate(null); }}
                    />
                  </div>
                )}
              </>
            )}
            {/* Empty space filler — catches right-click and drops for project root */}
            <div
              className="workspace__tree-spacer"
              onContextMenu={handleEmptyContextMenu}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('workspace__tree--drop-target'); }}
              onDragLeave={(e) => { e.currentTarget.classList.remove('workspace__tree--drop-target'); }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('workspace__tree--drop-target');
                if (dragItem && activeProject) handleDrop({ path: activeProject, name: activeProject, type: 'dir' });
              }}
            />
          </div>

          <div className="workspace__sidebar-actions">
            <div className="workspace__search">
              <Search size={13} />
              <input
                placeholder="Search files..."
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
              />
              {searchQuery && <button onClick={() => { setSearchQuery(''); setSearchResults(null); }}><X size={12} /></button>}
            </div>
            {searchResults && (
              <div className="workspace__search-results">
                {searchResults.length === 0 ? (
                  <div className="workspace__search-empty">No results</div>
                ) : searchResults.map((r, i) => (
                  <button key={i} className="workspace__search-result" onClick={() => {
                    openFile({ path: r.file_path, name: r.file_name, type: 'file' });
                    setSearchQuery(''); setSearchResults(null);
                  }}>
                    <FileText size={12} />
                    <span>{r.file_name}</span>
                    <span className="workspace__search-project">{r.project_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Editor area */}
        <div className="workspace__editor-area">
          {!activeTab ? (
            <div className="workspace__empty">
              <FileText size={32} />
              <p>{activeProject ? 'Select a file from the sidebar to start editing' : 'Select a project above to get started'}</p>
            </div>
          ) : (
            <div className={`workspace__panes workspace__panes--${viewMode}`}>
              {(viewMode === 'editor' || viewMode === 'split') && (
                <textarea
                  className="workspace__editor"
                  value={fileContents[activeTab] || ''}
                  onChange={e => handleContentChange(activeTab, e.target.value)}
                  spellCheck={true}
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
        <span>{activeProject || 'No project'}</span>
        <span>{wordCount} words</span>
        <span>{saveStatus}</span>
      </div>
    </div>
  );
}
