import React, { useState } from 'react';
import { Sparkles, BrainCircuit, Book, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface LessonFormProps {
  onSubmit: (data: any) => void;
}

const LessonForm: React.FC<LessonFormProps> = ({ onSubmit }) => {
  const [category, setCategory] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !topic) return;
    
    setLoading(true);
    setError(null);

    try {
      // جلب بيانات المستخدم الحالي لربط الدرس بحسابه
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id || null;

      // المناداة السحرية لدالة الذكاء الاصطناعي
      const { data, error: functionError } = await supabase.functions.invoke('generate-lesson', {
        body: {
          category,
          topic,
          difficulty_level: difficulty,
          user_id: userId
        }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Failed to connect to the AI service.');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // إرسال البيانات المولدة بنجاح إلى الصفحة الرئيسية
      onSubmit(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while generating the lesson.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 relative overflow-hidden">
      {/* تصميم الخلفية الزخرفي */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-0 opacity-50"></div>

      <div className="relative z-10 mb-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full mb-4">
          <BrainCircuit className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">What do you want to learn?</h2>
        <p className="text-gray-500 mt-2 text-sm">Our AI will generate a complete lesson in seconds.</p>
      </div>

      <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
        {/* قسم عرض الأخطاء إن وجدت */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Book className="w-4 h-4 text-gray-400" /> Category
          </label>
          <input
            type="text"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., Computer Science, History"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white text-gray-800"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gray-400" /> Topic
          </label>
          <input
            type="text"
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Quantum Computing, World War II"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white text-gray-800"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
          <div className="grid grid-cols-3 gap-3">
            {['Easy', 'Medium', 'Hard'].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setDifficulty(level)}
                disabled={loading}
                className={`py-2 px-4 rounded-xl text-sm font-medium transition-all ${
                  difficulty === level
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || !category || !topic}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>AI is generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate Lesson</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LessonForm;