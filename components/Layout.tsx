
import React, { useState } from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  X, 
  Upload, 
  Compass, 
  Sparkles, 
  Download, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <BookOpen className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              wEpub
            </h1>
          </div>
          <nav className="flex items-center space-x-6 text-sm font-black text-slate-600">
            <button 
              onClick={() => setIsHowItWorksOpen(true)}
              className="hover:text-indigo-600 transition-colors uppercase tracking-widest"
            >
              How it works
            </button>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-indigo-600 transition-colors flex items-center uppercase tracking-widest"
            >
              <HelpCircle className="w-4 h-4 mr-1" /> Help
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-slate-50 border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500 text-sm font-medium">
          &copy; {new Date().getFullYear()} wEpub. All files processed locally with Gemini 3 Pro. Ready for Amazon KDP & Lulu.
        </div>
      </footer>

      {/* How it Works Modal */}
      {isHowItWorksOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" 
            onClick={() => setIsHowItWorksOpen(false)}
          />
          <div className="relative bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] shadow-2xl p-8 sm:p-12 animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setIsHowItWorksOpen(false)}
              className="absolute top-8 right-8 p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-900"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="mb-12">
              <h2 className="text-4xl font-black text-slate-950 tracking-tighter mb-4">Mastering wEpub</h2>
              <p className="text-xl text-slate-500 font-medium">From rough notes to published masterpiece in four professional steps.</p>
            </div>

            <div className="space-y-10">
              <div className="flex items-start space-x-6">
                <div className="bg-indigo-100 p-4 rounded-2xl shrink-0">
                  <Upload className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight mb-2">1. Import Your Vision</h3>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    Upload a raw <code className="bg-slate-100 px-2 py-0.5 rounded">.txt</code> file or paste your scattered notes into the editor. 
                    Our AI scans the contents to detect your intended structure.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-6">
                <div className="bg-violet-100 p-4 rounded-2xl shrink-0">
                  <Compass className="w-8 h-8 text-violet-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight mb-2">2. Architect the Story</h3>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    Use the **Story Architect** sidebar to define your target chapter count, the overall plot direction, and key character traits. 
                    This ensures the AI stays true to your world.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-6">
                <div className="bg-amber-100 p-4 rounded-2xl shrink-0">
                  <Sparkles className="w-8 h-8 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight mb-2">3. 20-Paragraph Ghostwriting</h3>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    This is our secret sauce. When you ask the Ghostwriter to "Write Scene", it doesn't just give you a summary. 
                    It crafts a full, immersive sequence of **at least 20 paragraphs** with deep sensory detail and dialogue.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-6">
                <div className="bg-emerald-100 p-4 rounded-2xl shrink-0">
                  <ShieldCheck className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight mb-2">4. Audit & Export</h3>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    Run the **Anti-Plagiarism Audit** to ensure originality. Once satisfied, hit **Export to EPUB**. 
                    Your file is perfectly formatted for immediate upload to Amazon KDP, Apple Books, or Lulu.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-10 border-t border-slate-100">
              <button 
                onClick={() => setIsHowItWorksOpen(false)}
                className="w-full bg-slate-950 text-white py-5 rounded-2xl font-black text-xl hover:bg-black transition-all shadow-xl flex items-center justify-center group"
              >
                <span>Ready to start?</span>
                <ChevronRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
