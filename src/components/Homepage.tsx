import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  Shield, Code, BrainCircuit, BarChart3, Cloud, Database, 
  Server, Wifi, Palette, Smartphone, Cpu, Link, 
  Gamepad2, Terminal, Briefcase, Atom, X, Loader2, Sparkles,
  ArrowRight
} from 'lucide-react';

// الألوان تم ضبطها لتعمل بامتياز في الفاتح والداكن
const CATEGORIES = [
  { id: 'cybersecurity', title: 'Cybersecurity', icon: Shield, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30', topics: ['Anatomy of Ransomware', 'SQL Injection Mechanics', 'Zero-Day Vulnerabilities'] },
  { id: 'software-eng', title: 'Software Engineering', icon: Code, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30', topics: ['SOLID Principles Explained', 'Microservices vs Monoliths', 'Test-Driven Development (TDD)'] },
  { id: 'ai-ml', title: 'AI & ML', icon: BrainCircuit, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30', topics: ['Neural Networks from Scratch', 'Natural Language Processing (NLP)', 'Reinforcement Learning Basics'] },
  { id: 'data-science', title: 'Data Science', icon: BarChart3, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', topics: ['Exploratory Data Analysis', 'A/B Testing Methodologies', 'Time Series Forecasting'] },
  { id: 'cloud-devops', title: 'Cloud & DevOps', icon: Cloud, color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', topics: ['CI/CD Pipelines with GitHub Actions', 'Docker Containerization', 'Kubernetes Orchestration'] },
  { id: 'database-systems', title: 'Database Systems', icon: Database, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-900/30', topics: ['ACID Properties in RDBMS', 'NoSQL vs Relational Databases', 'Database Indexing Strategies'] },
  { id: 'info-systems', title: 'Information Systems', icon: Server, color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30', topics: ['Enterprise Resource Planning (ERP)', 'Management Information Systems', 'Business Intelligence Tools'] },
  { id: 'networks', title: 'Networks', icon: Wifi, color: 'text-sky-600 dark:text-sky-400', bgColor: 'bg-sky-100 dark:bg-sky-900/30', topics: ['OSI Model Demystified', 'TCP/IP Protocols', 'Subnetting and IP Addressing'] },
  { id: 'ui-ux', title: 'UI/UX Design', icon: Palette, color: 'text-pink-600 dark:text-pink-400', bgColor: 'bg-pink-100 dark:bg-pink-900/30', topics: ['Wireframing and Prototyping', 'User-Centered Design', 'Color Theory and Typography'] },
  { id: 'mobile-dev', title: 'Mobile Development', icon: Smartphone, color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-100 dark:bg-teal-900/30', topics: ['React Native Fundamentals', 'iOS App Architecture', 'State Management in Flutter'] },
  { id: 'iot', title: 'Internet of Things', icon: Cpu, color: 'text-lime-600 dark:text-lime-400', bgColor: 'bg-lime-100 dark:bg-lime-900/30', topics: ['MQTT Protocol Basics', 'Edge Computing', 'Sensor Data Processing'] },
  { id: 'blockchain', title: 'Blockchain', icon: Link, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30', topics: ['Smart Contracts with Solidity', 'Consensus Mechanisms', 'Decentralized Finance (DeFi)'] },
  { id: 'game-dev', title: 'Game Development', icon: Gamepad2, color: 'text-violet-600 dark:text-violet-400', bgColor: 'bg-violet-100 dark:bg-violet-900/30', topics: ['Unity Physics Engine', 'Game Loop Architecture', 'Shader Graph Basics'] },
  { id: 'operating-systems', title: 'Operating Systems', icon: Terminal, color: 'text-slate-600 dark:text-slate-400', bgColor: 'bg-slate-200 dark:bg-slate-800', topics: ['CPU Scheduling Algorithms', 'Virtual Memory Management', 'Concurrency and Deadlocks'] },
  { id: 'it-project-management', title: 'IT Project Mgmt', icon: Briefcase, color: 'text-yellow-600 dark:text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', topics: ['Agile Scrum Methodology', 'Kanban Boards in Practice', 'Risk Management Strategies'] },
  { id: 'quantum-computing', title: 'Quantum Computing', icon: Atom, color: 'text-fuchsia-600 dark:text-fuchsia-400', bgColor: 'bg-fuchsia-100 dark:bg-fuchsia-900/30', topics: ['Quantum Superposition', 'Shor\'s Algorithm', 'Quantum Cryptography'] }
];

const Homepage = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'Beginner' | 'Medium' | 'Hard'>('Medium');
  const [customTopic, setCustomTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingTopic, setGeneratingTopic] = useState('');

  const handleGenerate = async (topic: string) => {
    if (!topic.trim()) return;
    
    setGeneratingTopic(topic);
    setIsGenerating(true);
    const categoryTitle = selectedCategory?.title;
    setSelectedCategory(null);
    setCustomTopic('');
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      
      const { data, error } = await supabase.functions.invoke('generate-lesson', { 
        body: { 
          category: categoryTitle, 
          topic: topic, 
          difficulty_level: selectedDifficulty, 
          user_id: userId 
        } 
      });

      if (error) throw error;
      if (data?.lesson_id) navigate(`/dashboard/lessons/${data.lesson_id}`);
      else throw new Error('Lesson ID not found in response');
    } catch (err: any) {
      console.error(err);
      alert('Failed to generate lesson: ' + err.message);
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full pb-12 font-sans animate-in fade-in duration-500">
      
      {/* Hero Section */}
      <div className="text-center mb-12 mt-4">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight text-gray-900 dark:text-white">
          What do you want to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">master</span> today?
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
          Select a field below to explore curated topics or let our AI generate a personalized, interactive lesson tailored to your skill level.
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {CATEGORIES.map((cat, idx) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat)}
            className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-2xl transition-all duration-300 text-left flex flex-col items-start hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:-translate-y-1"
          >
            <div className={`p-3 rounded-xl mb-5 ${cat.bgColor} ${cat.color} group-hover:scale-110 transition-transform duration-300 ease-out`}>
              <cat.icon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {cat.title}
            </h3>
          </button>
        ))}
      </div>

      {/* Exploration Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 z-[60] bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 transition-opacity">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl ${selectedCategory.bgColor} ${selectedCategory.color}`}>
                  <selectedCategory.icon className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">{selectedCategory.title}</h2>
              </div>
              <button 
                onClick={() => { setSelectedCategory(null); setCustomTopic(''); }}
                className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 overflow-y-auto">
              
              {/* Difficulty */}
              <div className="mb-10">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
                  Select Difficulty
                </label>
                <div className="flex bg-gray-100 dark:bg-gray-900 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
                  {['Beginner', 'Medium', 'Hard'].map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(diff as any)}
                      className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${
                        selectedDifficulty === diff 
                          ? diff === 'Beginner' ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 shadow-sm' :
                            diff === 'Medium' ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 shadow-sm' :
                            'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 shadow-sm'
                          : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Curated Topics */}
              <div className="mb-10">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
                  Curated Topics
                </label>
                <div className="space-y-3">
                  {selectedCategory.topics.map((topic: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => handleGenerate(topic)}
                      className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-500/50 rounded-xl transition-all duration-200 group text-left"
                    >
                      <span className="font-semibold text-gray-700 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-300">{topic}</span>
                      <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transform group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Topic Input */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
                  Or Specify Your Own Topic
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder={`E.g., What is ... in ${selectedCategory.title}?`}
                    className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-5 py-3.5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium shadow-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate(customTopic)}
                  />
                  <button
                    onClick={() => handleGenerate(customTopic)}
                    disabled={!customTopic.trim()}
                    className="bg-indigo-600 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Sparkles className="w-4 h-4" /> Generate
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 z-[100] bg-white/90 dark:bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-indigo-500 blur-[40px] opacity-20 dark:opacity-40 rounded-full animate-pulse"></div>
            <Loader2 className="w-16 h-16 text-indigo-600 dark:text-indigo-400 animate-spin relative z-10" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">Crafting Your Lesson</h2>
          <p className="text-xl text-gray-600 dark:text-indigo-200/80 max-w-lg mx-auto">
            Generating personalized content, flashcards, and quizzes on <br/>
            <span className="font-bold text-gray-900 dark:text-white leading-relaxed inline-block mt-3 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
              "{generatingTopic}"
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default Homepage;