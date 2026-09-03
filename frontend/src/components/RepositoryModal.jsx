import React, { useState } from 'react';
import { X, Plus, Github, Folder, ArrowRight, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export default function RepositoryModal({ isOpen, onClose, repositories, onSelectRepo, onCreateRepo }) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('existing'); // 'existing' | 'new'

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !url) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onCreateRepo({ name, url, defaultBranch: branch, description });
      setName('');
      setUrl('');
      setErrorMessage(null);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to import repository. Please check URL and try again.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-surfaceBorder rounded-xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surfaceBorder">
          <h2 className="text-base font-semibold text-white flex items-center space-x-2">
            <Github className="w-5 h-5 text-primary-400" />
            <span>Repository Manager</span>
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-surfaceBorder px-4 pt-2 bg-surfaceLight/30">
          <button
            onClick={() => { setActiveTab('existing'); setErrorMessage(null); }}
            className={`pb-2 px-3 text-xs font-medium border-b-2 transition ${
              activeTab === 'existing'
                ? 'border-primary-500 text-primary-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Connected Repositories ({repositories.length})
          </button>
          <button
            onClick={() => { setActiveTab('new'); setErrorMessage(null); }}
            className={`pb-2 px-3 text-xs font-medium border-b-2 transition ${
              activeTab === 'new'
                ? 'border-primary-500 text-primary-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            + Connect New Repository
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'existing' ? (
            <div className="space-y-2">
              {repositories.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No repositories connected yet. Click "+ Connect New Repository" to start.
                </div>
              ) : (
                repositories.map((repo) => (
                  <div
                    key={repo.id}
                    onClick={() => {
                      onSelectRepo(repo);
                      onClose();
                    }}
                    className="p-3 bg-surfaceLight/40 hover:bg-surfaceLight/80 border border-surfaceBorder hover:border-primary-500/50 rounded-lg cursor-pointer transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-medium text-sm text-slate-200 group-hover:text-primary-300">
                        {repo.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate max-w-md font-mono mt-0.5">
                        {repo.url}
                      </div>
                      {repo.technologyStack && repo.technologyStack.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {repo.technologyStack.map((tech) => (
                            <span key={tech} className="text-[10px] px-1.5 py-0.5 bg-primary-600/10 text-primary-400 border border-primary-500/20 rounded">
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${
                        repo.status === 'READY' ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {repo.status}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-primary-400 transition" />
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Repository Name</label>
                <input
                  type="text"
                  placeholder="e.g. spring-petclinic or fastapi-realworld"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surfaceLight border border-surfaceBorder rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">GitHub / Git Clone URL</label>
                <input
                  type="url"
                  placeholder="https://github.com/username/repository.git"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-surfaceLight border border-surfaceBorder rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Default Branch</label>
                <input
                  type="text"
                  placeholder="main"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full bg-surfaceLight border border-surfaceBorder rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description (Optional)</label>
                <textarea
                  rows="2"
                  placeholder="Brief notes about the project architecture..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-surfaceLight border border-surfaceBorder rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Cloning & Indexing Repository...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Connect & Start Ingestion</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
