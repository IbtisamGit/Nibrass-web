import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ArrowLeft, BookOpen, Layers, CheckSquare, Loader2, AlertCircle, RotateCcw, Clock, PlayCircle, Keyboard } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const LessonView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // غيرنا الافتراضي من summary إلى content
  const [activeTab, setActiveTab] = useState('content');
  
  // حالة القسم الفعال في محتوى الدرس (Table of Contents)
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  
  // حالة البطاقات التعليمية
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // حالات (States) الاختبار والسجل الشامل
  const [quizHistory, setQuizHistory] = useState<any[]>([]);
  const [quizMode, setQuizMode] = useState<'history' | 'taking' | 'reviewing'>('taking');
  const [selectedAttempt, setSelectedAttempt] = useState<any>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // جلب بيانات الدرس وسجل الاختبارات
  const fetchLessonAndHistory = async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;

      const { data: lessonData, error: fetchError } = await supabase
        .from('lessons')
        .select(`*, flashcards (*), mcq_questions (*)`)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      if (!lessonData) throw new Error('Lesson not found');
      setLesson(lessonData);

      if (userId && id) {
        const { data: historyData, error: historyError } = await supabase
          .from('test_results')
          .select('*')
          .eq('lesson_id', id)
          .eq('user_id', userId)
          .order('completed_at', { ascending: false });

        if (!historyError && historyData) {
          setQuizHistory(historyData);
          if (historyData.length > 0) {
            setQuizMode('history');
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load the lesson.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchLessonAndHistory();
  }, [id]);

  // دعم اختصارات الكيبورد للبطاقات التعليمية
  useEffect(() => {
    if (activeTab !== 'flashcards' || !lesson?.flashcards) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        if (currentCard < lesson.flashcards.length - 1) {
          setIsFlipped(false);
          setTimeout(() => setCurrentCard(prev => prev + 1), 150);
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentCard > 0) {
          setIsFlipped(false);
          setTimeout(() => setCurrentCard(prev => prev - 1), 150);
        }
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault(); // منع نزول الصفحة عند ضغط المسافة
        setIsFlipped(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, currentCard, lesson?.flashcards]);

  const checkIsCorrect = (optionText: string, correctAnswer: any, optIndex: number) => {
    if (!correctAnswer) return false;
    const correctStr = String(correctAnswer).trim();
    const optStr = String(optionText).trim();

    if (optStr === correctStr) return true;
    if (String(optIndex) === correctStr) return true;
    
    const letter = String.fromCharCode(65 + optIndex);
    if (correctStr.toUpperCase() === letter || correctStr.toUpperCase() === `OPTION ${letter}`) return true;

    const cleanOpt = optStr.replace(/^[a-zA-Z][.:)]\s*/, '').trim().toLowerCase();
    const cleanCorrect = correctStr.replace(/^[a-zA-Z][.:)]\s*/, '').trim().toLowerCase();
    
    if (cleanOpt === cleanCorrect) return true;
    if (cleanOpt.length > 5 && cleanCorrect.length > 5) {
      if (cleanOpt.includes(cleanCorrect) || cleanCorrect.includes(cleanOpt)) return true;
    }
    return false;
  };

  const handleSubmitQuiz = async () => {
    setIsSubmitting(true);
    const quiz = lesson.mcq_questions || [];
    
    const correctCount = Object.keys(selectedAnswers).filter(k => {
      const qIndex = parseInt(k);
      const optIndex = selectedAnswers[qIndex];
      const optText = quiz[qIndex].options[optIndex];
      return checkIsCorrect(optText, quiz[qIndex].correct_answer, optIndex);
    }).length;
    
    const scorePercentage = Math.round((correctCount / quiz.length) * 100);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      
      if (userId && id) {
        const { error: dbError } = await supabase.from('test_results').insert({
          lesson_id: id,
          user_id: userId,
          score: scorePercentage,
          user_answers: selectedAnswers
        });
        
        if (dbError) throw dbError;
        await fetchLessonAndHistory();
      }
    } catch (err) {
      console.error("Failed to save score:", err);
      alert("Something went wrong while saving your test.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartNewQuiz = () => {
    setSelectedAnswers({});
    setQuizMode('taking');
  };

  const handleReviewAttempt = (attempt: any) => {
    setSelectedAttempt(attempt);
    setQuizMode('reviewing');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading your AI-generated lesson...</p>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center max-w-lg mx-auto mt-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Lesson</h3>
        <p className="text-red-600 mb-6">{error}</p>
        <button onClick={() => navigate('/dashboard/lessons')} className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-colors font-medium">
          Go Back
        </button>
      </div>
    );
  }

  const summary = lesson.summary_text || 'No summary available.';
  const flashcards = lesson.flashcards || [];
  const quiz = lesson.mcq_questions || [];
  const contentSections = lesson.content_sections || [];

  return (
    <React.Fragment>
    <div className="w-full px-6 lg:px-12 pb-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard/lessons')} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">{lesson.topic || 'Untitled Topic'}</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Category: {lesson.category || 'General'}</p>
          </div>
        </div>
      </div>

      <div className="flex max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl p-1.5 shadow-sm border border-gray-100 dark:border-gray-700 mb-8 overflow-x-auto whitespace-nowrap">
        <button onClick={() => setActiveTab('content')} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all min-w-[150px] ${activeTab === 'content' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
          <BookOpen className="w-4 h-4" /> Lesson Content
        </button>
        <button onClick={() => setActiveTab('flashcards')} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all min-w-[150px] ${activeTab === 'flashcards' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
          <Layers className="w-4 h-4" /> Flashcards ({flashcards.length})
        </button>
        <button onClick={() => setActiveTab('quiz')} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all min-w-[150px] ${activeTab === 'quiz' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
          <CheckSquare className="w-4 h-4" /> Quiz ({quiz.length})
        </button>
      </div>

      <div className="w-full bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8 h-auto min-h-[500px]">        {activeTab === 'content' && (
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 lg:gap-12 relative items-start">
            <style>{`
              @keyframes fadeInSlideUp {
                from { opacity: 0; transform: translateY(8px); }
                to { opacity: 1; transform: translateY(0); }
              }
              .animate-fade-in-up {
                animation: fadeInSlideUp 0.5s ease-out forwards;
              }
            `}</style>
            
            {contentSections && contentSections.length > 0 ? (
              <>
                {/* Left Sidebar (Journey Stepper) */}
                <div className="w-full">
                  <div className="sticky top-28">
                    <h3 className="text-xs font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" /> Learning Path
                    </h3>
                    <div className="flex flex-col relative">
                      {/* Vertical line connecting steps */}
                      <div className="absolute left-[15px] top-6 bottom-6 w-px bg-gray-200 dark:bg-gray-700 -z-10"></div>
                      
                      {contentSections.map((section: any, index: number) => {
                        const isActive = activeSectionIndex === index;
                        const stepNumber = String(index + 1).padStart(2, '0');
                        
                        return (
                          <button
                            key={index}
                            onClick={() => setActiveSectionIndex(index)}
                            className={`group flex items-start gap-4 p-3 -ml-3 rounded-2xl transition-all duration-300 text-left ${
                              isActive 
                                ? 'bg-indigo-50/80 dark:bg-indigo-900/20' 
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                            }`}
                          >
                            <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold transition-all duration-300 ${
                              isActive 
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none scale-110' 
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 group-hover:bg-gray-200 dark:group-hover:bg-gray-700 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                            }`}>
                              {stepNumber}
                            </span>
                            <span className={`pt-1.5 text-sm font-bold line-clamp-2 leading-snug transition-colors duration-300 ${
                              isActive 
                                ? 'text-indigo-900 dark:text-indigo-300' 
                                : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'
                            }`}>
                              {section.section_title}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Area (Premium Prose) */}
                  <div className="w-full min-w-0">
                    <div className="w-full max-w-5xl">
                    <div key={activeSectionIndex} className="animate-fade-in-up">
                      <div className="mb-8 pt-2">
                        <span className="inline-block px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-extrabold uppercase tracking-widest rounded-full mb-4">
                          Section {activeSectionIndex + 1} of {contentSections.length}
                        </span>
                        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight py-1">
                          {contentSections[activeSectionIndex]?.section_title}
                        </h2>
                      </div>
                      
                      <div className="prose prose-lg prose-indigo max-w-none dark:prose-invert prose-p:leading-relaxed prose-headings:font-extrabold prose-a:text-indigo-600 prose-code:text-indigo-600 dark:prose-code:text-indigo-400 prose-pre:bg-slate-900 prose-pre:shadow-sm rounded-xl">
                        <ReactMarkdown
                          components={{
                            h1: ({ node, ...props }) => <h1 className="text-3xl font-extrabold mt-8 mb-4 text-gray-900 dark:text-white leading-tight" {...props} />,
                            h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2 leading-snug" {...props} />,
                            h3: ({ node, ...props }) => <h3 className="text-xl font-bold mt-6 mb-3 text-gray-900 dark:text-white leading-snug" {...props} />,
                            p: ({ node, ...props }) => <p className="mb-4 leading-relaxed text-gray-600 dark:text-gray-300" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4 space-y-1.5 text-gray-600 dark:text-gray-300 marker:text-indigo-500" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-4 space-y-1.5 text-gray-600 dark:text-gray-300 marker:text-indigo-500" {...props} />,
                            li: ({ node, ...props }) => <li className="leading-relaxed pl-1" {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-extrabold text-indigo-900 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-900/20 px-1 rounded" {...props} />,
                            code: ({ node, inline, className, children, ...props }: any) => {
                              const match = /language-(\w+)/.exec(className || '');
                              return !inline ? (
                                <div className="my-4 rounded-xl overflow-hidden bg-[#0d1117] shadow-lg border border-gray-800">
                                  <div className="px-4 py-2 bg-[#161b22] border-b border-gray-800 text-xs font-mono text-gray-400 flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                                    <span className="ml-2 uppercase tracking-wider">{match ? match[1] : 'Code'}</span>
                                  </div>
                                  <pre className="p-5 overflow-x-auto text-sm text-gray-100 font-mono leading-relaxed">
                                    <code className={className} {...props}>{children}</code>
                                  </pre>
                                </div>
                              ) : (
                                <code className="bg-gray-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md text-sm font-mono border border-gray-200 dark:border-gray-700" {...props}>
                                  {children}
                                </code>
                              );
                            }
                          }}
                        >
                          {contentSections[activeSectionIndex]?.content || ''}
                        </ReactMarkdown>
                      </div>

                      {/* Pagination Footer */}
                      <div className="mt-16 pt-8 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                        {activeSectionIndex > 0 ? (
                          <button
                            onClick={() => {
                              setActiveSectionIndex(activeSectionIndex - 1);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all w-full sm:w-auto justify-center group"
                          >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
                            Previous Section
                          </button>
                        ) : (
                          <div></div> /* Placeholder for layout balance */
                        )}

                        {activeSectionIndex < contentSections.length - 1 && (
                          <button
                            onClick={() => {
                              setActiveSectionIndex(activeSectionIndex + 1);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 border-2 border-transparent hover:border-indigo-200 dark:hover:border-indigo-800/50 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all w-full sm:w-auto justify-center ml-auto group"
                          >
                            Next Section 
                            <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Fallback gracefully to old summary_text if content_sections is missing */
              <div className="w-full">
                <div className="prose prose-lg prose-indigo max-w-none w-full dark:prose-invert prose-p:leading-relaxed prose-headings:font-extrabold prose-a:text-indigo-600 prose-code:text-indigo-600 dark:prose-code:text-indigo-400 prose-pre:bg-slate-900 prose-pre:shadow-sm rounded-xl">
                  <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-indigo-600" /> Lesson Content
                  </h2>
                  <div className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{summary}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== FLASHCARDS TAB ===================== */}
        {activeTab === 'flashcards' && flashcards.length > 0 && (
          <div className="flex flex-col items-center">
            <div className="w-full max-w-lg mb-6">
              <div className="flex justify-between items-end mb-2">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Study Flashcards
                </h2>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full">
                  {currentCard + 1} / {flashcards.length}
                </span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full transition-all duration-300 ease-out" 
                  style={{ width: `${((currentCard + 1) / flashcards.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="w-full max-w-lg h-72 perspective-1000 cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
              <div className={`relative w-full h-full transition-transform duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                <div className="absolute w-full h-full backface-hidden bg-white dark:bg-gray-800 border-2 border-indigo-50 dark:border-gray-700 group-hover:border-indigo-100 dark:group-hover:border-indigo-500/50 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-colors">
                  <span className="absolute top-5 right-6 text-xs font-bold text-indigo-300 dark:text-indigo-500 tracking-wider">FRONT</span>
                  <p className="text-2xl font-semibold text-gray-800 dark:text-white leading-snug">{flashcards[currentCard].front_text}</p>
                  <p className="text-sm text-gray-400 mt-6 flex items-center gap-1 opacity-70"><RotateCcw className="w-4 h-4"/> Click to flip</p>
                </div>
                <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-lg rotate-y-180">
                  <span className="absolute top-5 right-6 text-xs font-bold text-indigo-200 tracking-wider">BACK</span>
                  <p className="text-2xl font-medium text-white leading-snug">{flashcards[currentCard].back_text}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center mt-8">
              <div className="flex items-center gap-4">
                <button onClick={() => { setIsFlipped(false); setTimeout(() => setCurrentCard((prev) => Math.max(0, prev - 1)), 150); }} disabled={currentCard === 0} className="px-6 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 transition-colors">
                  Previous
                </button>
                <button onClick={() => { setIsFlipped(false); setTimeout(() => setCurrentCard((prev) => Math.min(flashcards.length - 1, prev + 1)), 150); }} disabled={currentCard === flashcards.length - 1} className="px-6 py-3 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-40 shadow-sm transition-colors">
                  Next Card
                </button>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                <Keyboard className="w-4 h-4" />
                <span>Use <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-gray-500 dark:text-gray-400 font-mono text-[10px]">Space</kbd> to flip, and <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-gray-500 dark:text-gray-400 font-mono text-[10px]">Arrows</kbd> to navigate</span>
              </div>
            </div>
          </div>
        )}

        {/* ===================== QUIZ TAB ===================== */}
        {activeTab === 'quiz' && quiz.length > 0 && (
          <div className="max-w-5xl mx-auto w-full">
            {quizMode === 'history' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Quiz History
                  </h2>
                  <button onClick={handleStartNewQuiz} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2">
                    <PlayCircle className="w-4 h-4" /> Take New Quiz
                  </button>
                </div>
                
                <div className="grid gap-4">
                  {quizHistory.map((attempt, index) => (
                    <div key={attempt.id} className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 flex items-center justify-between hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-all">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">Attempt {quizHistory.length - index}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(attempt.completed_at).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Score</p>
                          <p className={`text-lg font-bold ${attempt.score >= 80 ? 'text-green-600 dark:text-green-400' : attempt.score >= 50 ? 'text-orange-500 dark:text-orange-400' : 'text-red-500 dark:text-red-400'}`}>
                            {attempt.score}%
                          </p>
                        </div>
                        <button 
                          onClick={() => handleReviewAttempt(attempt)}
                          disabled={!attempt.user_answers}
                          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(quizMode === 'taking' || quizMode === 'reviewing') && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    {quizHistory.length > 0 && (
                      <button 
                        onClick={() => setQuizMode('history')} 
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm"
                      >
                        <ArrowLeft className="w-4 h-4" /> Back to History
                      </button>
                    )}
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2 ml-2">
                      <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      {quizMode === 'reviewing' ? 'Reviewing Attempt' : 'Knowledge Check'}
                    </h2>
                  </div>

                  {quizMode === 'reviewing' && (
                    <span className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
                      Score: {selectedAttempt.score}%
                    </span>
                  )}
                </div>

                <div className="space-y-8">
                  {quiz.map((q: any, index: number) => {
                    const chosenAnswerIndex = quizMode === 'reviewing' && selectedAttempt.user_answers 
                        ? selectedAttempt.user_answers[index] 
                        : selectedAnswers[index];

                    return (
                      <div key={index} className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                        <p className="font-semibold text-gray-800 dark:text-white mb-4">{index + 1}. {q.question_text}</p>
                        <div className="space-y-2">
                          {(q.options || []).map((opt: string, optIndex: number) => {
                            const isSelected = chosenAnswerIndex === optIndex;
                            const isCorrect = checkIsCorrect(opt, q.correct_answer, optIndex);
                            
                            let btnClass = "w-full text-left px-4 py-3 rounded-xl border transition-all text-sm font-medium ";
                            
                            if (quizMode === 'taking') {
                              btnClass += isSelected ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-600 dark:border-indigo-500 text-indigo-700 dark:text-indigo-400 shadow-sm" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-500/50";
                            } 
                            else if (quizMode === 'reviewing') {
                              if (isCorrect) {
                                btnClass += "bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-600 text-green-700 dark:text-green-400";
                              } else if (isSelected && !isCorrect) {
                                btnClass += "bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-600 text-red-700 dark:text-red-400";
                              } else {
                                btnClass += "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 opacity-50";
                              }
                            }

                            return (
                              <button
                                key={optIndex}
                                onClick={() => quizMode === 'taking' && setSelectedAnswers({...selectedAnswers, [index]: optIndex})}
                                disabled={quizMode === 'reviewing'}
                                className={btnClass}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {quizMode === 'taking' && Object.keys(selectedAnswers).length === quiz.length && (
                  <div className="mt-8 flex justify-end">
                    <button 
                      onClick={handleSubmitQuiz}
                      disabled={isSubmitting}
                      className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md flex items-center gap-2 disabled:opacity-70"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Answers'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty States */}
        {activeTab === 'flashcards' && flashcards.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-center py-12">No flashcards generated for this lesson.</p>}
        {activeTab === 'quiz' && quiz.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-center py-12">No quiz generated for this lesson.</p>}

      </div>
    </div>
    </React.Fragment>
  );
};

export default LessonView;