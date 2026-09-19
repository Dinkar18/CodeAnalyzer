import React from 'react';
import { Cpu, ArrowRight, Shield, Activity, Search, Key, GitCompare, Code2, CheckCircle2, Terminal, Network, ShieldAlert, ChevronRight, Layers, FileCode } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage({ onNavigate }) {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background text-zinc-100 flex flex-col font-sans selection:bg-primary-500/20 selection:text-primary-300 overflow-x-hidden">
      {/* Top Subtle Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a15_1px,transparent_1px),linear-gradient(to_bottom,#27272a15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-surfaceBorder bg-background/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-6 lg:px-12 max-w-7xl mx-auto w-full">
        {/* Brand */}
        <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => onNavigate('/')}>
          <div className="p-1.5 bg-surfaceLight border border-surfaceBorder rounded-lg text-zinc-200">
            <Cpu className="w-4 h-4 text-primary-400" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-sm tracking-tight text-zinc-100">
              AI Codebase Architect
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surfaceLight text-zinc-400 font-mono font-medium border border-surfaceBorder">
              v2.0
            </span>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center space-x-6 text-xs font-medium text-zinc-400">
          <a href="#features" className="hover:text-zinc-100 transition">Features</a>
          <a href="#architecture" className="hover:text-zinc-100 transition">Architecture</a>
          <a href="#byok" className="hover:text-zinc-100 transition">BYOK Models</a>
          <a href="#security" className="hover:text-zinc-100 transition">Security</a>
        </nav>

        {/* Right CTA / Auth Controls */}
        <div className="flex items-center space-x-3 text-xs font-medium">
          {isAuthenticated ? (
            <div className="flex items-center space-x-2.5">
              <button
                onClick={() => onNavigate('/profile')}
                className="px-3 py-1.5 rounded-lg bg-surfaceLight hover:bg-zinc-800 border border-surfaceBorder text-zinc-300 hover:text-white transition flex items-center space-x-2"
              >
                <div className="w-4 h-4 rounded-full bg-primary-600 flex items-center justify-center text-[9px] font-bold text-white uppercase">
                  {user?.username?.[0] || 'U'}
                </div>
                <span className="font-medium text-xs">{user?.username}</span>
              </button>
              <button
                onClick={() => onNavigate('/workspace')}
                className="px-3.5 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition flex items-center space-x-1.5 shadow-sm font-semibold"
              >
                <span>Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onNavigate('/signin')}
                className="px-3 py-1.5 text-zinc-400 hover:text-white transition"
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate('/signup')}
                className="px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-900 font-semibold rounded-lg transition flex items-center space-x-1 shadow-sm"
              >
                <span>Get Started</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 lg:px-12 max-w-5xl mx-auto w-full flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-surfaceLight border border-surfaceBorder text-zinc-300 text-xs font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <span>AST Codebase Intelligence & UML System Architecture</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.15] text-zinc-100">
          Understand Any Complex Codebase in Seconds.
        </h1>

        <p className="mt-5 text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
          Polyglot AST parsing, real-time interactive UML sequence and class diagrams, multi-branch Git diff comparisons, and Bring Your Own Key (BYOK) multi-LLM reasoning.
        </p>

        {/* Hero CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          <button
            onClick={() => onNavigate(isAuthenticated ? '/workspace' : '/signup')}
            className="w-full sm:w-auto px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold transition shadow-sm flex items-center justify-center space-x-2"
          >
            <span>Launch Interactive Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <a
            href="#architecture"
            className="w-full sm:w-auto px-5 py-2.5 bg-surfaceLight hover:bg-zinc-800 border border-surfaceBorder text-zinc-300 hover:text-white rounded-lg text-xs font-medium transition flex items-center justify-center space-x-2"
          >
            <Terminal className="w-3.5 h-3.5 text-zinc-400" />
            <span>Explore Architecture</span>
          </a>
        </div>
      </section>

      {/* Core Capabilities Grid */}
      <section id="features" className="py-16 px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
            Engineered for Modern Software Architects
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-zinc-400">
            From low-level abstract syntax trees to high-level multi-service sequence flows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1 */}
          <div className="p-6 bg-surface border border-surfaceBorder rounded-2xl flex flex-col justify-between hover:border-zinc-700 transition">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-surfaceLight border border-surfaceBorder flex items-center justify-center text-primary-400">
                <Network className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-zinc-100">Deterministic Graph-RAG</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Extracts complete execution spines (Router &rarr; Service &rarr; Task &rarr; Model) without LLM hallucinations.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 bg-surface border border-surfaceBorder rounded-2xl flex flex-col justify-between hover:border-zinc-700 transition">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-surfaceLight border border-surfaceBorder flex items-center justify-center text-emerald-400">
                <GitCompare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-zinc-100">Multi-Branch Git Diff</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Compare AST symbol shifts and structural drift between Git branches before merging to main.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 bg-surface border border-surfaceBorder rounded-2xl flex flex-col justify-between hover:border-zinc-700 transition">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-surfaceLight border border-surfaceBorder flex items-center justify-center text-amber-400">
                <Key className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-zinc-100">BYOK Multi-LLM Engine</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Switch seamlessly between Gemini, GPT-4o, Claude 3.5, Groq, DeepSeek, and local Ollama instances.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-surfaceBorder py-8 px-6 lg:px-12 max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500">
        <div className="flex items-center space-x-2 mb-4 sm:mb-0">
          <Cpu className="w-4 h-4 text-zinc-400" />
          <span className="font-semibold text-zinc-300">AI Codebase Architect</span>
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center space-x-6">
          <button onClick={() => onNavigate('/signin')} className="hover:text-zinc-300 transition">Sign In</button>
          <button onClick={() => onNavigate('/signup')} className="hover:text-zinc-300 transition">Sign Up</button>
          <button onClick={() => onNavigate('/workspace')} className="text-primary-400 hover:text-primary-300 transition">Workspace</button>
        </div>
      </footer>
    </div>
  );
}
