import React from 'react';
import { Cpu, Sparkles, ArrowRight, Shield, GitFork, Activity, Search, Key, GitCompare, Code2, CheckCircle2, Terminal, Network, ShieldAlert, ChevronRight, Layers, FileCode } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage({ onNavigate }) {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#060912] text-slate-100 flex flex-col font-sans selection:bg-primary-600/30 selection:text-primary-200 overflow-x-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[600px] -left-[200px] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-[800px] -right-[200px] w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-surfaceBorder/60 bg-[#060912]/80 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between px-6 lg:px-12 max-w-7xl mx-auto w-full">
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('/')}>
          <div className="p-2 bg-primary-600/20 border border-primary-500/30 rounded-xl text-primary-400 shadow-md shadow-primary-600/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-base tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              AI Codebase Architect
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-600/20 text-primary-400 font-mono font-semibold border border-primary-500/20">
              v2.0
            </span>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center space-x-8 text-xs font-medium text-slate-400">
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#architecture" className="hover:text-white transition">Architecture</a>
          <a href="#byok" className="hover:text-white transition">BYOK Models</a>
          <a href="#security" className="hover:text-white transition">Security</a>
        </nav>

        {/* Right CTA / Auth Controls */}
        <div className="flex items-center space-x-3 text-xs font-semibold">
          {isAuthenticated ? (
            <div className="flex items-center space-x-2.5">
              <button
                onClick={() => onNavigate('/profile')}
                className="px-3 py-1.5 rounded-xl bg-surfaceLight/60 hover:bg-surfaceLight border border-surfaceBorder text-slate-300 hover:text-white transition flex items-center space-x-2"
              >
                <img
                  src={user?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username}`}
                  alt="Avatar"
                  className="w-5 h-5 rounded-full bg-primary-900"
                />
                <span className="font-medium">{user?.username}</span>
              </button>
              <button
                onClick={() => onNavigate('/workspace')}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl shadow-lg shadow-primary-600/25 transition flex items-center space-x-1.5"
              >
                <span>Launch Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onNavigate('/signin')}
                className="px-3.5 py-1.5 text-slate-300 hover:text-white transition"
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate('/signup')}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl shadow-lg shadow-primary-600/25 transition flex items-center space-x-1.5"
              >
                <span>Get Started Free</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 lg:px-12 max-w-7xl mx-auto w-full flex flex-col items-center text-center relative z-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-primary-900/30 border border-primary-500/30 text-primary-300 text-xs font-medium mb-8 animate-in fade-in zoom-in-95 duration-200">
          <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
          <span>Next-Generation Codebase Intelligence & UML Architect</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.1] bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Understand Any Complex Codebase in Seconds.
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Deep polyglot AST parsing, real-time interactive UML sequence and class diagrams, multi-branch Git diff comparisons, and Bring Your Own Key (BYOK) multi-LLM reasoning.
        </p>

        {/* Hero CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          <button
            onClick={() => onNavigate('/workspace')}
            className="w-full sm:w-auto px-8 py-3.5 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-2xl shadow-xl shadow-primary-600/30 transition flex items-center justify-center space-x-2 text-sm"
          >
            <span>Open AI Architect Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigate('/signup')}
            className="w-full sm:w-auto px-6 py-3.5 bg-surfaceLight/50 hover:bg-surfaceLight border border-surfaceBorder hover:border-slate-500 text-slate-200 hover:text-white font-semibold rounded-2xl transition flex items-center justify-center space-x-2 text-sm"
          >
            <span>Create Account</span>
          </button>
        </div>

        {/* Feature Badges Banner */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-mono">
          <span className="flex items-center space-x-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Zero Hallucination Grounding</span></span>
          <span className="flex items-center space-x-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Real-Time SSE Streaming</span></span>
          <span className="flex items-center space-x-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Polyglot Tree-Sitter AST</span></span>
          <span className="flex items-center space-x-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Bring Your Own Key (BYOK)</span></span>
        </div>

        {/* Interactive App Preview Window */}
        <div className="mt-16 w-full max-w-5xl rounded-2xl border border-surfaceBorder bg-[#0B1020] shadow-2xl overflow-hidden p-2 text-left">
          <div className="h-9 px-4 border-b border-surfaceBorder/60 bg-surface/50 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-mono text-[11px] text-slate-500">ai-codebase-architect — visual-uml-preview.mermaid</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-600/20 text-primary-300">Live Workspace</span>
          </div>
          <div className="p-6 font-mono text-xs text-slate-300 bg-[#070B14] space-y-3 leading-relaxed overflow-x-auto">
            <div className="text-primary-400 font-semibold">// Step-by-Step Architecture Sequence Generation</div>
            <div className="text-slate-400">sequenceDiagram</div>
            <div className="pl-4 text-emerald-300">participant Client as "Client / Frontend"</div>
            <div className="pl-4 text-emerald-300">participant API as "FastAPI (CallService)"</div>
            <div className="pl-4 text-emerald-300">participant Worker as "ARQ Background Worker"</div>
            <div className="pl-4 text-emerald-300">participant LLM as "Multi-Provider LLM"</div>
            <div className="pl-4 text-slate-200">Client-&gt;&gt;API: POST /calls/ (Multipart Audio)</div>
            <div className="pl-4 text-slate-200">API-&gt;&gt;Worker: Enqueue job `process_transcription`</div>
            <div className="pl-4 text-slate-200">Worker-&gt;&gt;LLM: Run Multi-Stage RAG Evaluation</div>
            <div className="pl-4 text-slate-200">LLM--&gt;&gt;Client: Real-Time SSE Stream Result</div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section id="features" className="py-24 px-6 lg:px-12 max-w-7xl mx-auto w-full border-t border-surfaceBorder/40">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Engineered for Senior Architects & Engineering Teams
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            Everything you need to onboard into massive repositories, plan refactors, and audit code quality.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-surface/50 border border-surfaceBorder hover:border-primary-500/50 transition flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary-600/20 border border-primary-500/30 text-primary-400 flex items-center justify-center group-hover:scale-105 transition">
                <GitFork className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Visual UML & Sequence Diagrams</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate crisp, zoomable Mermaid UML class diagrams and request flow sequence diagrams grounded directly in source code.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-surfaceBorder/50 text-[11px] font-mono text-primary-300 flex items-center space-x-1">
              <span>Interactive SVG Canvas</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-surface/50 border border-surfaceBorder hover:border-primary-500/50 transition flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center group-hover:scale-105 transition">
                <Key className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Bring Your Own Key (BYOK)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Use your preferred LLM: Google Gemini 2.5, OpenAI GPT-4o, Anthropic Claude 3.5 Sonnet, Groq Llama 3.3, DeepSeek, or local Ollama. Zero server storage of keys.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-surfaceBorder/50 text-[11px] font-mono text-amber-300 flex items-center space-x-1">
              <span>Zero-Egress / Client Encrypted</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-surface/50 border border-surfaceBorder hover:border-primary-500/50 transition flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition">
                <Code2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Polyglot Tree-Sitter AST Indexing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Extracts classes, interfaces, methods, functions, and call graphs across Java, Python, C#, TypeScript, JavaScript, Go, and Rust.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-surfaceBorder/50 text-[11px] font-mono text-emerald-300 flex items-center space-x-1">
              <span>Precise Symbol Search</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-surface/50 border border-surfaceBorder hover:border-primary-500/50 transition flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center group-hover:scale-105 transition">
                <GitCompare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Multi-Branch Git Diff Comparator</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Compare branches side-by-side with color-coded unified diffs, additions, deletions, and architectural change summaries.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-surfaceBorder/50 text-[11px] font-mono text-purple-300 flex items-center space-x-1">
              <span>Branch Comparison</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-2xl bg-surface/50 border border-surfaceBorder hover:border-primary-500/50 transition flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center group-hover:scale-105 transition">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Autonomous Security & Audits</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Run automated specialist audits for security vulnerabilities, architectural anti-patterns, performance bottlenecks, and test coverage gaps.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-surfaceBorder/50 text-[11px] font-mono text-rose-300 flex items-center space-x-1">
              <span>Specialist Findings</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-2xl bg-surface/50 border border-surfaceBorder hover:border-primary-500/50 transition flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center group-hover:scale-105 transition">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Real-Time SSE Streaming</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tokens stream incrementally with non-blocking reactive WebFlux pipelines and live typing feedback for zero wait time.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-surfaceBorder/50 text-[11px] font-mono text-blue-300 flex items-center space-x-1">
              <span>Reactive Gateway</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="py-20 px-6 lg:px-12 max-w-5xl mx-auto w-full text-center">
        <div className="p-10 rounded-3xl bg-gradient-to-b from-primary-900/30 via-surface/80 to-surface border border-primary-500/30 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Ready to Navigate Your Codebase with Superpowers?
            </h2>
            <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              Launch into your repositories, visualize complex dependencies, and accelerate your engineering workflow today.
            </p>
            <div className="pt-4 flex justify-center">
              <button
                onClick={() => onNavigate('/workspace')}
                className="px-8 py-3.5 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-2xl shadow-xl shadow-primary-600/30 transition flex items-center space-x-2 text-sm"
              >
                <span>Launch Workspace Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-surfaceBorder/60 bg-[#060912] py-8 px-6 lg:px-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-primary-400" />
            <span className="font-semibold text-slate-400">AI Codebase Architect &copy; 2026</span>
          </div>
          <div className="flex items-center space-x-6">
            <button onClick={() => onNavigate('/signin')} className="hover:text-slate-300">Sign In</button>
            <button onClick={() => onNavigate('/signup')} className="hover:text-slate-300">Sign Up</button>
            <button onClick={() => onNavigate('/profile')} className="hover:text-slate-300">Profile</button>
            <button onClick={() => onNavigate('/workspace')} className="hover:text-primary-400 font-semibold">Workspace</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
