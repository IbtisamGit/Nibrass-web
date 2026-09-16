import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ArrowLeft, BookOpen, Layers, CheckSquare, Loader2, AlertCircle, RotateCcw } from 'lucide-react';

const LessonView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState('summary');
  
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        // الاستعلام الجديد: يجلب الدرس، ويجلب البطاقات والأسئلة المرتبطة به في نفس الوقت
        const { data, error: fetchError } = await supabase
          .from('lessons')
          .select(`
            *,
            flashcards (*),
            mcq_questions (*)
          `)
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error('Lesson not found');

        setLesson(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load the lesson.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchLesson();
  }, [id]);

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
        <button 
          onClick={() => navigate('/dashboard/lessons')}
          className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Go Back
        </button>
      </div>
    );
  }

  // استخراج البيانات بناء على الهيكل الصحيح لقاعدة البيانات
  const summary = lesson.summary_text || 'No summary available.';
  const flashcards = lesson.flashcards || [];
  const quiz = lesson.mcq_questions || [];

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard/lessons')}
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">{lesson.topic || 'Untitled Topic'}</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Category: {lesson.category || 'General'}</p>
          </div>
        </div>
      </div>

      <div className="flex bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 mb-8">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
            activeTab === 'summary' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Summary
        </button>
        <button
          onClick={() => setActiveTab('flashcards')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
            activeTab === 'flashcards' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Layers className="w-4 h-4" /> Flashcards ({flashcards.length})
        </button>
        <button
          onClick={() => setActiveTab('quiz')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
            activeTab === 'quiz' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <CheckSquare className="w-4 h-4" /> Quiz ({quiz.length})
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 h-auto">
        
        {activeTab === 'summary' && (
          <div className="prose prose-indigo max-w-none">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" /> Lesson Summary
            </h2>
            <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">
              {summary}
            </div>
          </div>
        )}

        {activeTab === 'flashcards' && flashcards.length > 0 && (
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-bold text-gray-800 mb-8 self-start flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" /> Study Flashcards
            </h2>
            
            <div 
              className="w-full max-w-lg h-64 perspective-1000 cursor-pointer"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div className={`relative w-full h-full transition-transform duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                
                <div className="absolute w-full h-full backface-hidden bg-white border-2 border-indigo-100 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-md">
                  <span className="absolute top-4 right-4 text-xs font-bold text-indigo-300">FRONT</span>
                  <p className="text-xl font-semibold text-gray-800">{flashcards[currentCard].front_text}</p>
                  <p className="text-sm text-gray-400 mt-4 flex items-center gap-1"><RotateCcw className="w-3 h-3"/> Click to flip</p>
                </div>
                
                <div className="absolute w-full h-full backface-hidden bg-indigo-600 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-md rotate-y-180">
                  <span className="absolute top-4 right-4 text-xs font-bold text-indigo-200">BACK</span>
                  <p className="text-xl font-medium text-white">{flashcards[currentCard].back_text}</p>
                </div>

              </div>
            </div>

            <div className="flex items-center gap-6 mt-8">
              <button 
                onClick={() => {
                  setIsFlipped(false);
                  setTimeout(() => setCurrentCard((prev) => Math.max(0, prev - 1)), 150);
                }}
                disabled={currentCard === 0}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm font-bold text-gray-400">
                {currentCard + 1} / {flashcards.length}
              </span>
              <button 
                onClick={() => {
                  setIsFlipped(false);
                  setTimeout(() => setCurrentCard((prev) => Math.min(flashcards.length - 1, prev + 1)), 150);
                }}
                disabled={currentCard === flashcards.length - 1}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                Next Card
              </button>
            </div>
          </div>
        )}

        {activeTab === 'quiz' && quiz.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-600" /> Knowledge Check
              </h2>
              {showResults && (
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                  Score: {Object.keys(selectedAnswers).filter(k => quiz[parseInt(k)].options[selectedAnswers[parseInt(k)]] === quiz[parseInt(k)].correct_answer).length} / {quiz.length}
                </span>
              )}
            </div>

            <div className="space-y-8">
              {quiz.map((q: any, index: number) => (
                <div key={index} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <p className="font-semibold text-gray-800 mb-4">{index + 1}. {q.question_text}</p>
                  <div className="space-y-2">
                    {(q.options || []).map((opt: string, optIndex: number) => {
                      const isSelected = selectedAnswers[index] === optIndex;
                      const isCorrect = opt === q.correct_answer;
                      
                      let btnClass = "w-full text-left px-4 py-3 rounded-xl border transition-all text-sm font-medium ";
                      
                      if (!showResults) {
                        btnClass += isSelected ? "bg-indigo-50 border-indigo-600 text-indigo-700" : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300";
                      } else {
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
                          onClick={() => !showResults && setSelectedAnswers({...selectedAnswers, [index]: optIndex})}
                          disabled={showResults}
                          className={btnClass}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {!showResults && Object.keys(selectedAnswers).length === quiz.length && (
              <div className="mt-8 flex justify-end">
                <button 
                  onClick={() => setShowResults(true)}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md"
                >
                  Check Answers
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'flashcards' && flashcards.length === 0 && (
          <p className="text-gray-500 text-center py-12">No flashcards generated for this lesson.</p>
        )}
        {activeTab === 'quiz' && quiz.length === 0 && (
          <p className="text-gray-500 text-center py-12">No quiz generated for this lesson.</p>
        )}

      </div>
    </div>
  );
};

export default LessonView;