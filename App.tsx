
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { BookState, Chapter, BookMetadata, Character } from './types';
import { processBookContent, refineChapter, continueWriting, verifyOriginality } from './services/geminiService';
import { generateEpub } from './services/epubService';
import { 
  Upload, 
  Settings, 
  Download, 
  Sparkles, 
  Trash2, 
  Plus,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  Eye,
  PenTool,
  ShieldCheck,
  X,
  Book as BookIcon,
  Eraser,
  Compass,
  SearchCheck,
  AlertTriangle
} from 'lucide-react';

const App: React.FC = () => {
  const [book, setBook] = useState<BookState>({
    metadata: {
      title: '',
      author: '',
      description: '',
      language: 'en',
      publisher: '',
      rights: 'All Rights Reserved',
    },
    chapters: [],
    storySettings: {
      targetChapters: 5,
      direction: '',
      characters: []
    }
  });

  const [rawInput, setRawInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [aiPrompts, setAiPrompts] = useState<Record<number, string>>({});
  const [originalityReports, setOriginalityReports] = useState<Record<number, { score: number, report: string }>>({});

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsProcessing(true);
    try {
      const text = await file.text();
      const result = await processBookContent(text, book.storySettings);
      setBook(prev => ({
        ...prev,
        metadata: { 
          ...prev.metadata, 
          title: prev.metadata.title || result.metadata.title || prev.metadata.title,
          author: prev.metadata.author || result.metadata.author || prev.metadata.author,
          description: prev.metadata.description || result.metadata.description || prev.metadata.description
        },
        chapters: result.chapters
      }));
    } catch (err) {
      console.error(err);
      alert("Error processing file with AI.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessText = async () => {
    if (!rawInput.trim()) return;
    setIsProcessing(true);
    try {
      const result = await processBookContent(rawInput, book.storySettings);
      setBook(prev => ({
        ...prev,
        metadata: { 
          ...prev.metadata, 
          title: prev.metadata.title || result.metadata.title || prev.metadata.title,
          author: prev.metadata.author || result.metadata.author || prev.metadata.author,
          description: prev.metadata.description || result.metadata.description || prev.metadata.description
        },
        chapters: result.chapters
      }));
    } catch (err) {
      console.error(err);
      alert("Error processing text with AI.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateFromScratch = () => {
    setBook(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        title: prev.metadata.title || 'My New Masterpiece',
        author: prev.metadata.author || '',
        publisher: 'wEpub Press',
      },
      chapters: [{ id: Date.now().toString(), title: 'Chapter 1', content: '' }],
    }));
    setActiveChapterIndex(0);
  };

  const updateMetadata = (field: keyof BookMetadata, value: string) => {
    setBook(prev => ({
      ...prev,
      metadata: { ...prev.metadata, [field]: value }
    }));
  };

  const updateStorySettings = (field: string, value: any) => {
    setBook(prev => ({
      ...prev,
      storySettings: { ...prev.storySettings, [field]: value }
    }));
  };

  const addCharacter = () => {
    const newChar: Character = { id: Date.now().toString(), name: '', traits: '', description: '' };
    updateStorySettings('characters', [...book.storySettings.characters, newChar]);
  };

  const updateCharacter = (id: string, field: keyof Character, value: string) => {
    const newChars = book.storySettings.characters.map(c => c.id === id ? { ...c, [field]: value } : c);
    updateStorySettings('characters', newChars);
  };

  const removeCharacter = (id: string) => {
    updateStorySettings('characters', book.storySettings.characters.filter(c => c.id !== id));
  };

  const updateChapterTitle = (index: number, title: string) => {
    const newChapters = [...book.chapters];
    newChapters[index].title = title;
    setBook(prev => ({ ...prev, chapters: newChapters }));
  };

  const updateChapterContent = (index: number, content: string) => {
    const newChapters = [...book.chapters];
    newChapters[index].content = content;
    setBook(prev => ({ ...prev, chapters: newChapters }));
  };

  const addChapter = () => {
    const newId = Date.now().toString();
    const newIndex = book.chapters.length;
    setBook(prev => ({
      ...prev,
      chapters: [...prev.chapters, { id: newId, title: `Chapter ${newIndex + 1}`, content: '' }]
    }));
    setActiveChapterIndex(newIndex);
  };

  const deleteChapter = (index: number) => {
    if (!confirm("Are you sure?")) return;
    const newChapters = book.chapters.filter((_, i) => i !== index);
    setBook(prev => ({ ...prev, chapters: newChapters }));
    if (activeChapterIndex === index) setActiveChapterIndex(null);
  };

  const refineChapterWithAI = async (index: number) => {
    const chapter = book.chapters[index];
    if (!chapter.content.trim()) return;
    setIsProcessing(true);
    try {
      const refined = await refineChapter(chapter.content);
      updateChapterContent(index, refined);
    } catch (err) {
      alert("Refining failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAiContinue = async (index: number) => {
    const prompt = aiPrompts[index];
    if (!prompt) return;
    setIsProcessing(true);
    try {
      const currentContent = book.chapters[index].content;
      const continuation = await continueWriting(currentContent, prompt, book.storySettings);
      updateChapterContent(index, currentContent + (currentContent ? "\n\n" : "") + continuation);
      setAiPrompts(prev => ({ ...prev, [index]: '' }));
    } catch (err) {
      alert("AI writing failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyOriginality = async (index: number) => {
    const content = book.chapters[index].content;
    if (!content.trim()) return;
    setIsProcessing(true);
    try {
      const report = await verifyOriginality(content);
      setOriginalityReports(prev => ({ ...prev, [index]: report }));
    } catch (err) {
      alert("Verification failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const runFullAudit = async () => {
    if (book.chapters.length === 0) return;
    setIsProcessing(true);
    try {
      for (let i = 0; i < book.chapters.length; i++) {
        if (book.chapters[i].content.trim()) {
          const report = await verifyOriginality(book.chapters[i].content);
          setOriginalityReports(prev => ({ ...prev, [i]: report }));
        }
      }
      alert("Full book plagiarism audit complete.");
    } catch (err) {
      alert("Global audit failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (book.chapters.length === 0) return;
    setIsDownloading(true);
    try {
      const blob = await generateEpub(book);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${book.metadata.title || 'Untitled'}.epub`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to generate EPUB.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Layout>
      {isPreviewMode ? (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
          <div className="flex items-center justify-between sticky top-20 z-40 bg-slate-50/90 backdrop-blur-md py-4 px-2 border-b border-slate-200">
            <button 
              onClick={() => setIsPreviewMode(false)}
              className="flex items-center text-indigo-700 font-black hover:bg-indigo-100 px-5 py-3 rounded-2xl transition-all shadow-sm bg-white"
            >
              <ChevronLeft className="w-6 h-6 mr-1" /> Exit Preview
            </button>
            <h2 className="hidden sm:block text-2xl font-black text-slate-900 tracking-tighter">Manuscript Preview</h2>
            <button 
              onClick={handleDownload}
              className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-xl hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all"
            >
              Export EPUB
            </button>
          </div>

          <div className="bg-white p-12 sm:p-24 rounded-[3rem] shadow-2xl border border-slate-200 min-h-screen font-serif">
            <div className="text-center py-20 border-b-4 border-double border-slate-100 mb-20">
              <h1 className="text-6xl font-black text-slate-950 mb-8 leading-tight tracking-tight uppercase">{book.metadata.title || 'Untitled Manuscript'}</h1>
              <p className="text-4xl text-slate-400 font-bold tracking-tight">by</p>
              <p className="text-5xl text-slate-800 font-black italic mt-4">{book.metadata.author || 'Anonymous Writer'}</p>
            </div>

            <div className="mb-24">
              <h2 className="text-3xl font-black mb-12 text-center uppercase tracking-[0.3em] text-slate-300">Table of Contents</h2>
              <ul className="max-w-lg mx-auto space-y-8">
                {book.chapters.map((ch, i) => (
                  <li key={ch.id} className="flex items-center justify-between border-b-2 border-slate-50 pb-4 group">
                    <span className="font-black text-slate-900 text-2xl group-hover:text-indigo-600 transition-colors">{ch.title || `Chapter ${i+1}`}</span>
                    <span className="text-slate-300 italic font-bold">Chapter {i + 1}</span>
                  </li>
                ))}
              </ul>
            </div>

            {book.chapters.map((ch, i) => (
              <div key={ch.id} className="mb-32 last:mb-0">
                <h3 className="text-5xl font-black text-center mb-16 text-slate-950 underline underline-offset-[16px] decoration-indigo-100 decoration-8">{ch.title || `Chapter ${i+1}`}</h3>
                <div 
                  className="prose prose-2xl max-w-none text-slate-900 leading-[1.9] whitespace-pre-wrap font-serif"
                  dangerouslySetInnerHTML={{ __html: ch.content.replace(/\n/g, '<br/>') }}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Metadata & Planning Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 ring-1 ring-slate-100">
              <div className="flex items-center space-x-3 mb-8 border-b border-slate-100 pb-5">
                <Settings className="w-6 h-6 text-indigo-600" />
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Book Identity</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 mb-2 tracking-[0.2em] uppercase">Book Title</label>
                  <input 
                    type="text" 
                    value={book.metadata.title}
                    onChange={(e) => updateMetadata('title', e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 bg-white text-slate-950 font-black focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                    placeholder="Enter Book Title"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 mb-2 tracking-[0.2em] uppercase">Author Name (By: )</label>
                  <input 
                    type="text" 
                    value={book.metadata.author}
                    onChange={(e) => updateMetadata('author', e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 bg-white text-slate-950 font-black focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                    placeholder="Enter Your Name"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 ring-1 ring-slate-100">
              <div className="flex items-center space-x-3 mb-8 border-b border-slate-100 pb-5">
                <Compass className="w-6 h-6 text-violet-600" />
                <h2 className="text-xl font-black text-slate-950 tracking-tight">Story Architect</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 mb-2 tracking-[0.2em] uppercase">Target Length (Chapters)</label>
                  <input 
                    type="number" 
                    value={book.storySettings.targetChapters === 0 ? '' : book.storySettings.targetChapters}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateStorySettings('targetChapters', val === '' ? 0 : parseInt(val) || 0);
                    }}
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 bg-white text-slate-950 font-black focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 mb-2 tracking-[0.2em] uppercase">The Grand Vision (Direction)</label>
                  <textarea 
                    value={book.storySettings.direction}
                    onChange={(e) => updateStorySettings('direction', e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 bg-white text-slate-950 font-medium focus:border-indigo-500 outline-none h-32 resize-none shadow-inner"
                    placeholder="Summarize the plot goals, themes, and twists..."
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-xs font-black text-slate-400 tracking-[0.2em] uppercase">Cast of Characters</label>
                    <button onClick={addCharacter} className="text-xs text-indigo-600 font-black hover:bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 transition-all flex items-center">
                      <Plus className="w-3 h-3 mr-1" /> Add
                    </button>
                  </div>
                  <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                    {book.storySettings.characters.map(char => (
                      <div key={char.id} className="p-5 bg-slate-50 rounded-[1.5rem] border-2 border-slate-100 space-y-3 group hover:border-indigo-200 transition-all shadow-sm">
                        <div className="flex items-center justify-between">
                          <input 
                            placeholder="Character Name" 
                            className="bg-transparent font-black text-slate-900 text-base w-full outline-none placeholder:text-slate-300"
                            value={char.name}
                            onChange={(e) => updateCharacter(char.id, 'name', e.target.value)}
                          />
                          <button onClick={() => removeCharacter(char.id)} className="text-slate-300 hover:text-red-500 transition-all p-1">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <input 
                          placeholder="Primary Traits & Description" 
                          className="bg-transparent text-sm w-full outline-none italic text-slate-500 font-bold placeholder:text-slate-300"
                          value={char.traits}
                          onChange={(e) => updateCharacter(char.id, 'traits', e.target.value)}
                        />
                      </div>
                    ))}
                    {book.storySettings.characters.length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-300 font-black text-xs tracking-widest">NO CHARACTERS DEFINED</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-4 pt-4">
              <button 
                onClick={runFullAudit}
                disabled={book.chapters.length === 0 || isProcessing}
                className="w-full flex items-center justify-center space-x-3 py-5 rounded-2xl font-black bg-amber-50 text-amber-700 border-2 border-amber-200 shadow-sm hover:bg-amber-100 transition-all disabled:opacity-50"
              >
                <ShieldCheck className="w-6 h-6" />
                <span className="text-sm tracking-widest uppercase">Global Plagiarism Audit</span>
              </button>
              <button 
                onClick={() => setIsPreviewMode(true)}
                disabled={book.chapters.length === 0}
                className="w-full flex items-center justify-center space-x-3 py-6 rounded-[2rem] font-black bg-indigo-600 text-white shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 border-4 border-indigo-400"
              >
                <Eye className="w-7 h-7" />
                <span className="text-xl tracking-tighter">PREVIEW MASTERPIECE</span>
              </button>
              <button 
                onClick={handleDownload}
                disabled={book.chapters.length === 0 || isDownloading}
                className="w-full flex items-center justify-center space-x-3 py-6 rounded-[2rem] font-black bg-slate-950 text-white shadow-xl hover:bg-black transition-all disabled:opacity-50"
              >
                {isDownloading ? <Loader2 className="w-7 h-7 animate-spin" /> : <Download className="w-7 h-7" />}
                <span className="text-xl tracking-tighter">EXPORT TO EPUB</span>
              </button>
            </div>
          </div>

          {/* Main Editor */}
          <div className="lg:col-span-8 space-y-8">
            {book.chapters.length === 0 ? (
              <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl p-20 text-center space-y-12">
                <div className="max-w-md mx-auto">
                  <div className="bg-indigo-50 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner">
                    <BookIcon className="w-16 h-16 text-indigo-600" />
                  </div>
                  <h2 className="text-5xl font-black text-slate-950 tracking-tight leading-none mb-4">Start Writing</h2>
                  <p className="text-slate-500 text-xl font-medium">Professional grade AI tools for full-length novel creation.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                  <div className="relative group cursor-pointer">
                    <input type="file" accept=".txt" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    <div className="bg-slate-50 border-4 border-dashed border-slate-200 p-12 rounded-[2.5rem] group-hover:border-indigo-500 group-hover:bg-indigo-50/50 transition-all flex flex-col items-center shadow-sm">
                      <Upload className="w-12 h-12 text-slate-300 mb-6 group-hover:text-indigo-600 transition-colors" />
                      <span className="block font-black text-slate-900 uppercase tracking-[0.2em] text-sm">Import Draft</span>
                    </div>
                  </div>
                  <button onClick={handleCreateFromScratch} className="bg-slate-50 border-4 border-dashed border-slate-200 p-12 rounded-[2.5rem] hover:border-violet-500 hover:bg-violet-50/50 transition-all group flex flex-col items-center shadow-sm">
                    <Plus className="w-12 h-12 text-slate-300 mb-6 group-hover:text-violet-600 transition-colors" />
                    <span className="block font-black text-slate-900 uppercase tracking-[0.2em] text-sm">Write From Scratch</span>
                  </button>
                </div>

                <div className="max-w-2xl mx-auto space-y-8 pt-8 border-t border-slate-50">
                  <textarea 
                    value={rawInput}
                    onChange={(e) => setRawInput(e.target.value)}
                    placeholder="Paste your raw story data, notes, or existing scenes here... We'll turn it into a book."
                    className="w-full h-60 p-10 rounded-[2.5rem] border-4 border-slate-100 bg-white text-slate-950 font-serif text-2xl focus:border-indigo-500 outline-none shadow-inner transition-all placeholder:text-slate-200"
                  />
                  <button onClick={handleProcessText} disabled={!rawInput.trim() || isProcessing} className="w-full bg-gradient-to-br from-indigo-600 to-violet-700 text-white py-6 rounded-[2rem] font-black text-2xl shadow-2xl shadow-indigo-100 flex items-center justify-center space-x-4 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
                    {isProcessing ? <Loader2 className="w-8 h-8 animate-spin" /> : <Sparkles className="w-8 h-8" />}
                    <span>CONVERT TO MANUSCRIPT</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8 pb-20">
                <div className="flex items-center justify-between px-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-xl sticky top-[4.5rem] z-40 backdrop-blur-lg bg-white/95 ring-1 ring-slate-100">
                  <div className="flex items-center space-x-6">
                    <h3 className="text-2xl font-black text-slate-950 tracking-tighter uppercase">Manuscript Editor</h3>
                    <div className="px-5 py-2 bg-indigo-600 text-white rounded-2xl text-sm font-black tracking-widest shadow-lg shadow-indigo-100">
                      {book.chapters.length} CHAPTERS
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => setIsPreviewMode(true)}
                      className="hidden md:flex items-center space-x-3 px-6 py-3 rounded-2xl text-indigo-700 font-black bg-indigo-50 hover:bg-indigo-100 transition-all border-2 border-indigo-200 shadow-sm"
                    >
                      <Eye className="w-6 h-6" />
                      <span>QUICK PREVIEW</span>
                    </button>
                    <button onClick={() => setBook(prev => ({ ...prev, chapters: [] }))} className="p-4 text-slate-300 hover:text-red-500 transition-colors" title="Wipe Manuscript"><Eraser className="w-7 h-7" /></button>
                    <button onClick={addChapter} className="bg-slate-950 text-white px-8 py-3.5 rounded-2xl font-black flex items-center text-base shadow-xl hover:bg-black transition-all hover:scale-105"><Plus className="w-5 h-5 mr-3" /> NEW CHAPTER</button>
                  </div>
                </div>

                <div className="space-y-6">
                  {book.chapters.map((chapter, index) => (
                    <div key={chapter.id} className="bg-white border-2 border-slate-100 rounded-[2.5rem] overflow-hidden shadow-lg hover:shadow-2xl transition-all group">
                      <div onClick={() => setActiveChapterIndex(activeChapterIndex === index ? null : index)} className={`p-8 flex items-center justify-between cursor-pointer transition-all ${activeChapterIndex === index ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50 text-slate-900'}`}>
                        <div className="flex items-center space-x-6 flex-1">
                          <span className={`text-xl font-black w-10 ${activeChapterIndex === index ? 'text-indigo-200' : 'text-slate-200'}`}>0{index + 1}</span>
                          <h4 className="font-black text-2xl tracking-tight truncate uppercase">{chapter.title || 'Untitled Chapter'}</h4>
                        </div>
                        <div className="flex items-center space-x-6">
                           <span className={`text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full ${activeChapterIndex === index ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                             {chapter.content.split(/\n\s*\n/).filter(Boolean).length} Paras
                           </span>
                           <ChevronRight className={`w-8 h-8 transform transition-transform duration-300 ${activeChapterIndex === index ? 'rotate-90 text-white' : 'text-slate-300'}`} />
                        </div>
                      </div>

                      {activeChapterIndex === index && (
                        <div className="p-10 bg-white space-y-10 animate-in slide-in-from-top-4 duration-500 border-t-4 border-indigo-600">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                            <div className="md:col-span-8">
                              <label className="block text-xs font-black text-slate-400 mb-3 tracking-[0.3em] uppercase">Chapter Headline</label>
                              <input 
                                type="text" value={chapter.title} onChange={(e) => updateChapterTitle(index, e.target.value)}
                                className="w-full px-6 py-4 rounded-2xl border-4 border-slate-50 bg-white text-slate-950 font-black text-3xl outline-none focus:border-indigo-500 transition-all shadow-sm"
                                placeholder="Enter Title..."
                              />
                            </div>
                            <div className="md:col-span-4 flex items-end space-x-3">
                              <button 
                                onClick={() => handleVerifyOriginality(index)} 
                                className="flex-1 py-4 bg-amber-50 text-amber-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-100 transition-all border-2 border-amber-100 shadow-sm flex items-center justify-center"
                              >
                                <ShieldCheck className="w-4 h-4 mr-1.5" /> Plagiarism Audit
                              </button>
                              <button onClick={() => refineChapterWithAI(index)} className="flex-1 py-4 bg-indigo-50 text-indigo-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-all border-2 border-indigo-100 shadow-sm flex items-center justify-center">
                                <Sparkles className="w-4 h-4 mr-1.5" /> AI Polish
                              </button>
                              <button onClick={() => deleteChapter(index)} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all shadow-sm"><Trash2 className="w-6 h-6" /></button>
                            </div>
                          </div>

                          {originalityReports[index] && (
                            <div className={`p-6 rounded-3xl border-2 flex items-start space-x-5 ${originalityReports[index].score > 80 ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-amber-50 border-amber-100 text-amber-800'} animate-in slide-in-from-left duration-300`}>
                              {originalityReports[index].score > 80 ? <CheckCircle2 className="w-8 h-8 shrink-0" /> : <AlertTriangle className="w-8 h-8 shrink-0" />}
                              <div>
                                <h5 className="font-black text-lg tracking-tight uppercase">Audit Score: {originalityReports[index].score}%</h5>
                                <p className="text-sm font-medium leading-relaxed opacity-80">{originalityReports[index].report}</p>
                              </div>
                            </div>
                          )}

                          <div className="relative group/editor">
                            <textarea 
                              value={chapter.content} onChange={(e) => updateChapterContent(index, e.target.value)}
                              className="w-full h-[700px] p-12 rounded-[3rem] border-4 border-slate-50 bg-slate-50/20 text-slate-900 font-serif text-2xl leading-[1.8] outline-none focus:bg-white transition-all shadow-inner focus:border-indigo-100"
                              placeholder="Unleash your creativity here... AI will help you fill the pages."
                            />
                            <div className="absolute bottom-8 right-8 px-6 py-3 bg-slate-900 text-white rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-2xl opacity-50 group-hover/editor:opacity-100 transition-opacity">
                              {chapter.content.length} CHARS | {chapter.content.split(/\s+/).filter(Boolean).length} WORDS
                            </div>
                          </div>

                          <div className="bg-slate-950 p-10 rounded-[3.5rem] space-y-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border-4 border-slate-900">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 text-indigo-400">
                                <PenTool className="w-8 h-8" />
                                <h5 className="font-black text-white text-2xl tracking-tighter uppercase">Ghostwriter Assistant (20+ Para)</h5>
                              </div>
                              <span className="text-[10px] text-slate-500 font-black tracking-widest uppercase">Deep Immersive Writing Engine</span>
                            </div>

                            <div className="flex flex-col space-y-6">
                              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-5">
                                <input 
                                  type="text"
                                  value={aiPrompts[index] || ''}
                                  onChange={(e) => setAiPrompts({ ...aiPrompts, [index]: e.target.value })}
                                  placeholder="What happens next? AI will generate a massive 20+ paragraph scene..."
                                  className="flex-1 px-8 py-6 rounded-[1.5rem] border-none bg-white text-black font-black placeholder:text-slate-400 focus:ring-8 focus:ring-indigo-500/30 outline-none text-xl shadow-2xl"
                                  onKeyDown={(e) => e.key === 'Enter' && handleAiContinue(index)}
                                />
                                <button 
                                  onClick={() => handleAiContinue(index)} 
                                  disabled={!aiPrompts[index] || isProcessing} 
                                  className="bg-indigo-600 text-white px-12 py-6 rounded-[1.5rem] font-black text-xl hover:bg-indigo-500 hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-50 shadow-2xl shadow-indigo-900/50 flex items-center justify-center min-w-[200px]"
                                >
                                  {isProcessing ? <Loader2 className="w-7 h-7 animate-spin" /> : 'WRITE SCENE'}
                                </button>
                              </div>
                              <p className="text-slate-500 text-sm font-bold italic text-center">Tip: Be specific about character names and plot points for better immersion.</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center z-[100] animate-in fade-in duration-500">
          <div className="bg-white p-20 rounded-[4rem] shadow-2xl text-center max-w-lg mx-auto border-8 border-indigo-50/50">
            <div className="relative mb-12">
              <div className="w-32 h-32 border-[12px] border-indigo-50 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
              <Sparkles className="w-12 h-12 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <h3 className="text-4xl font-black text-slate-950 mb-4 tracking-tighter uppercase">AI Mastercrafting...</h3>
            <p className="text-slate-500 text-2xl font-bold leading-relaxed tracking-tight px-4">
              Expanding your story with at least 20 detailed paragraphs of immersive prose. 
              Please hold for high-detail generation.
            </p>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
