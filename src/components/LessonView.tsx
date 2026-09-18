import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ArrowLeft, BookOpen, Layers, CheckSquare, Loader2, AlertCircle, RotateCcw, Clock, PlayCircle, ChevronLeft, Keyboard } from 'lucide-react';

const LessonView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState('summary');
  
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

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard/lessons')} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">{lesson.topic || 'Untitled Topic'}</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Category: {lesson.category || 'General'}</p>
          </div>
        </div>
      </div>

      <div className="flex bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 mb-8">
        <button onClick={() => setActiveTab('summary')} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${activeTab === 'summary' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
          <BookOpen className="w-4 h-4" /> Summary
        </button>
        <button onClick={() => setActiveTab('flashcards')} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${activeTab === 'flashcards' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
          <Layers className="w-4 h-4" /> Flashcards ({flashcards.length})
        </button>
        <button onClick={() => setActiveTab('quiz')} className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${activeTab === 'quiz' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
          <CheckSquare className="w-4 h-4" /> Quiz ({quiz.length})
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 h-auto min-h-[400px]">
        
        {/* ===================== SUMMARY TAB ===================== */}
        {activeTab === 'summary' && (
          <div className="prose prose-indigo max-w-none">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" /> Lesson Summary
            </h2>
            <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">{summary}</div>
          </div>
        )}

        {/* ===================== FLASHCARDS TAB ===================== */}
        {activeTab === 'flashcards' && flashcards.length > 0 && (
          <div className="flex flex-col items-center">
            <div className="w-full max-w-lg mb-6">
              <div className="flex justify-between items-end mb-2">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" /> Study Flashcards
                </h2>
                <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                  {currentCard + 1} / {flashcards.length}
                </span>
              </div>
              {/* شريط التقدم الجديد */}
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div 
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
                  style={{ width: `${((currentCard + 1) / flashcards.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="w-full max-w-lg h-72 perspective-1000 cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
              <div className={`relative w-full h-full transition-transform duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                <div className="absolute w-full h-full backface-hidden bg-white border-2 border-indigo-50 group-hover:border-indigo-100 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-colors">
                  <span className="absolute top-5 right-6 text-xs font-bold text-indigo-300 tracking-wider">FRONT</span>
                  <p className="text-2xl font-semibold text-gray-800 leading-snug">{flashcards[currentCard].front_text}</p>
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
                <button onClick={() => { setIsFlipped(false); setTimeout(() => setCurrentCard((prev) => Math.max(0, prev - 1)), 150); }} disabled={currentCard === 0} className="px-6 py-3 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 disabled:opacity-40 transition-colors">
                  Previous
                </button>
                <button onClick={() => { setIsFlipped(false); setTimeout(() => setCurrentCard((prev) => Math.min(flashcards.length - 1, prev + 1)), 150); }} disabled={currentCard === flashcards.length - 1} className="px-6 py-3 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-40 shadow-sm transition-colors">
                  Next Card
                </button>
              </div>
              {/* تلميحة الكيبورد */}
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                <Keyboard className="w-4 h-4" />
                <span>Use <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded-md text-gray-500 font-mono text-[10px]">Space</kbd> to flip, and <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded-md text-gray-500 font-mono text-[10px]">Arrows</kbd> to navigate</span>
              </div>
            </div>
          </div>
        )}

        {/* ===================== QUIZ TAB ===================== */}
        {activeTab === 'quiz' && quiz.length > 0 && (
          <div>
            {quizMode === 'history' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600" /> Quiz History
                  </h2>
                  <button onClick={handleStartNewQuiz} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2">
                    <PlayCircle className="w-4 h-4" /> Take New Quiz
                  </button>
                </div>
                
                <div className="grid gap-4">
                  {quizHistory.map((attempt, index) => (
                    <div key={attempt.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-5 flex items-center justify-between hover:border-indigo-100 hover:bg-indigo-50/30 transition-all">
                      <div>
                        <p className="font-bold text-gray-900">Attempt {quizHistory.length - index}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(attempt.completed_at).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</p>
                          <p className={`text-lg font-bold ${attempt.score >= 80 ? 'text-green-600' : attempt.score >= 50 ? 'text-orange-500' : 'text-red-500'}`}>
                            {attempt.score}%
                          </p>
                        </div>
                        <button 
                          onClick={() => handleReviewAttempt(attempt)}
                          disabled={!attempt.user_answers}
                          className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium text-sm rounded-lg hover:bg-gray-50 hover:text-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm"
                      >
                        <ArrowLeft className="w-4 h-4" /> Back to History
                      </button>
                    )}
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 ml-2">
                      <CheckSquare className="w-5 h-5 text-indigo-600" />
                      {quizMode === 'reviewing' ? 'Reviewing Attempt' : 'Knowledge Check'}
                    </h2>
                  </div>

                  {quizMode === 'reviewing' && (
                    <span className="bg-indigo-100 text-indigo-800 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm">
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
                      <div key={index} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                        <p className="font-semibold text-gray-800 mb-4">{index + 1}. {q.question_text}</p>
                        <div className="space-y-2">
                          {(q.options || []).map((opt: string, optIndex: number) => {
                            const isSelected = chosenAnswerIndex === optIndex;
                            const isCorrect = checkIsCorrect(opt, q.correct_answer, optIndex);
                            
                            let btnClass = "w-full text-left px-4 py-3 rounded-xl border transition-all text-sm font-medium ";
                            
                            if (quizMode === 'taking') {
                              btnClass += isSelected ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm" : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300";
                            } 
                            else if (quizMode === 'reviewing') {
                              if (isCorrect) {
                                btnClass += "bg-green-50 border-green-500 text-green-700";
                              } else if (isSelected && !isCorrect) {
                                btnClass += "bg-red-50 border-red-500 text-red-700";
                              } else {
                                btnClass += "bg-white border-gray-200 text-gray-400 opacity-50";
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
        {activeTab === 'flashcards' && flashcards.length === 0 && <p className="text-gray-500 text-center py-12">No flashcards generated for this lesson.</p>}
        {activeTab === 'quiz' && quiz.length === 0 && <p className="text-gray-500 text-center py-12">No quiz generated for this lesson.</p>}

      </div>
    </div>
  );
};

export default LessonView;