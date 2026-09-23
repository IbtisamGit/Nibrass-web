import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  Shield, Code, BrainCircuit, BarChart3, Cloud, Database, 
  Server, Wifi, Palette, Smartphone, Cpu, Link, 
  Gamepad2, Terminal, Briefcase, Atom, X, Loader2, Sparkles,
  ArrowRight
} from 'lucide-react';

const CATEGORIES = [
  { id: 'cybersecurity', title: 'Cybersecurity', desc: 'Network defense, cryptography, and ethical hacking basics.', icon: Shield, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/30', topics: ['Anatomy of Ransomware', 'SQL Injection Mechanics', 'Zero-Day Vulnerabilities'] },
  { id: 'software-eng', title: 'Software Engineering', desc: 'Architecture, design patterns, and system scalability.', icon: Code, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/30', topics: ['SOLID Principles Explained', 'Microservices vs Monoliths', 'Test-Driven Development (TDD)'] },
  { id: 'ai-ml', title: 'AI & ML', desc: 'Neural networks, NLP, and deep learning algorithms.', icon: BrainCircuit, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-900/30', topics: ['Neural Networks from Scratch', 'Natural Language Processing (NLP)', 'Reinforcement Learning Basics'] },
  { id: 'data-science', title: 'Data Science', desc: 'Data analytics, statistics, and predictive modeling.', icon: BarChart3, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-900/30', topics: ['Exploratory Data Analysis', 'A/B Testing Methodologies', 'Time Series Forecasting'] },
  { id: 'cloud-devops', title: 'Cloud & DevOps', desc: 'CI/CD, containerization, and cloud infrastructure.', icon: Cloud, color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-50 dark:bg-cyan-900/30', topics: ['CI/CD Pipelines with GitHub Actions', 'Docker Containerization', 'Kubernetes Orchestration'] },
  { id: 'database-systems', title: 'Database Systems', desc: 'SQL, NoSQL, and database performance tuning.', icon: Database, color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-900/30', topics: ['ACID Properties in RDBMS', 'NoSQL vs Relational Databases', 'Database Indexing Strategies'] },
  { id: 'info-systems', title: 'Information Systems', desc: 'Enterprise systems, BI, and IT project management.', icon: Server, color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-50 dark:bg-indigo-900/30', topics: ['Enterprise Resource Planning (ERP)', 'Management Information Systems', 'Business Intelligence Tools'] },
  { id: 'networks', title: 'Networks', desc: 'Routing, switching, and internet protocols (TCP/IP).', icon: Wifi, color: 'text-sky-600 dark:text-sky-400', bgColor: 'bg-sky-50 dark:bg-sky-900/30', topics: ['OSI Model Demystified', 'TCP/IP Protocols', 'Subnetting and IP Addressing'] },
  { id: 'ui-ux', title: 'UI/UX Design', desc: 'User research, wireframing, and interactive prototyping.', icon: Palette, color: 'text-pink-600 dark:text-pink-400', bgColor: 'bg-pink-50 dark:bg-pink-900/30', topics: ['Wireframing and Prototyping', 'User-Centered Design', 'Color Theory and Typography'] },
  { id: 'mobile-dev', title: 'Mobile Development', desc: 'iOS, Android, and cross-platform app development.', icon: Smartphone, color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-50 dark:bg-teal-900/30', topics: ['React Native Fundamentals', 'iOS App Architecture', 'State Management in Flutter'] },
  { id: 'iot', title: 'Internet of Things', desc: 'Sensors, edge computing, and smart connected devices.', icon: Cpu, color: 'text-lime-600 dark:text-lime-400', bgColor: 'bg-lime-50 dark:bg-lime-900/30', topics: ['MQTT Protocol Basics', 'Edge Computing', 'Sensor Data Processing'] },
  { id: 'blockchain', title: 'Blockchain', desc: 'Smart contracts, Web3, and decentralized apps.', icon: Link, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-900/30', topics: ['Smart Contracts with Solidity', 'Consensus Mechanisms', 'Decentralized Finance (DeFi)'] },
  { id: 'game-dev', title: 'Game Development', desc: 'Game engines, graphics, and physics programming.', icon: Gamepad2, color: 'text-violet-600 dark:text-violet-400', bgColor: 'bg-violet-50 dark:bg-violet-900/30', topics: ['Unity Physics Engine', 'Game Loop Architecture', 'Shader Graph Basics'] },
  { id: 'operating-systems', title: 'Operating Systems', desc: 'Memory management, concurrency, and kernels.', icon: Terminal, color: 'text-slate-600 dark:text-slate-400', bgColor: 'bg-slate-100 dark:bg-slate-800', topics: ['CPU Scheduling Algorithms', 'Virtual Memory Management', 'Concurrency and Deadlocks'] },
  { id: 'it-project-management', title: 'IT Project Mgmt', desc: 'Agile methodologies, Scrum, and technical leadership.', icon: Briefcase, color: 'text-yellow-600 dark:text-yellow-500', bgColor: 'bg-yellow-50 dark:bg-yellow-900/30', topics: ['Agile Scrum Methodology', 'Kanban Boards in Practice', 'Risk Management Strategies'] },
  { id: 'quantum-computing', title: 'Quantum Computing', desc: 'Qubits, quantum algorithms, and cryptography.', icon: Atom, color: 'text-fuchsia-600 dark:text-fuchsia-400', bgColor: 'bg-fuchsia-50 dark:bg-fuchsia-900/30', topics: ['Quantum Superposition', 'Shor\'s Algorithm', 'Quantum Cryptography'] }
];

const CUSTOM_CATEGORY = {
  id: 'custom',
  title: 'Custom Topic',
  icon: Sparkles,
  color: 'text-indigo-600 dark:text-indigo-400',
  bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
  topics: [] 
};

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
    <React.Fragment>
    <div className="w-full pb-12 font-sans animate-in fade-in duration-500">
      
      {/* Transformed Hero Section */}
      <div className="text-center mb-16 mt-8">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-5 tracking-tight text-gray-900 dark:text-white">
          What do you want to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">master</span> today?
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed mb-10">
          Generate a personalized, interactive lesson on absolutely any topic, or explore our curated fields below.
        </p>

        {/* Smart Command Bar (Custom Lesson Trigger) */}
        <div 
          onClick={() => setSelectedCategory(CUSTOM_CATEGORY)}
          className="relative max-w-2xl mx-auto group cursor-text px-4 sm:px-0"
        >
          {/* Soft Glow */}
          <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none"></div>
          
          <div className="relative flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-[0_0_40px_-15px_rgba(79,70,229,0.3)] rounded-full p-2 pl-6 transition-all duration-300 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-[0_0_40px_-10px_rgba(79,70,229,0.4)] hover:-translate-y-0.5">
            <Sparkles className="w-6 h-6 text-indigo-500 dark:text-indigo-400 shrink-0" />
            
            <div className="flex-1 text-left px-4 overflow-hidden">
              <span className="text-gray-400 dark:text-gray-500 font-medium text-sm sm:text-base truncate block">
                Type any topic (e.g., React Hooks, Black Holes)...
              </span>
            </div>
            
            <button className="shrink-0 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-indigo-600 dark:hover:bg-indigo-500 font-bold py-3.5 px-5 sm:px-7 rounded-full shadow-md transition-all duration-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400 dark:text-indigo-600 group-hover:text-white transition-colors" />
              <span className="hidden sm:inline">Generate Lesson</span>
              <span className="sm:hidden">Generate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Smooth Transition (Divider) */}
      <div className="relative max-w-4xl mx-auto mb-12 mt-16 px-4">
        <div className="absolute inset-0 flex items-center px-4" aria-hidden="true">
          <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="px-4 text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-gray-50 dark:bg-gray-900">
            Or explore curated fields
          </span>
        </div>
      </div>

      {/* Categories Grid - Ultra Premium Redesign */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat)}
            className="group relative bg-white dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700/80 p-7 rounded-[2rem] transition-all duration-500 text-left flex flex-col items-start shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.15)] hover:border-indigo-300 dark:hover:border-indigo-500/30 hover:-translate-y-2 overflow-hidden w-full"
          >
            {/* تأثير الوهج السحري في الخلفية عند التمرير */}
            <div className={`absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 ${cat.bgColor} rounded-full blur-3xl opacity-0 group-hover:opacity-60 transition-opacity duration-700 pointer-events-none`}></div>

            {/* الأيقونة بحجم فخم */}
            <div className={`relative p-4 rounded-2xl ${cat.bgColor} ${cat.color} group-hover:scale-110 transition-transform duration-500 ease-out mb-6 ring-1 ring-black/5 dark:ring-white/10 shadow-sm`}>
              <cat.icon className="w-7 h-7" />
            </div>
            
            {/* العناوين والنصوص */}
            <h3 className="relative text-xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
              {cat.title}
            </h3>
            
            <p className="relative text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium mb-8 line-clamp-2">
              {cat.desc}
            </p>

            {/* شريط الإجراء السفلي (البديل الفخم للسهم العلوي) */}
            <div className="relative mt-auto w-full flex items-center text-sm font-bold text-gray-400 dark:text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
              <span className="opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                Explore Topic
              </span>
              <ArrowRight className="w-5 h-5 ml-auto transform group-hover:translate-x-1 transition-transform duration-300" />
            </div>
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
              {selectedCategory.topics && selectedCategory.topics.length > 0 && (
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
              )}

              {/* Custom Topic Input */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
                  {selectedCategory.id === 'custom' ? 'What exactly would you like to learn?' : 'Or Specify Your Own Topic'}
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder={selectedCategory.id === 'custom' ? 'E.g., How does the human heart work?' : `E.g., What is ... in ${selectedCategory.title}?`}
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
            {/* Loading Overlay - Premium AI Experience */}
      {isGenerating && (
        <div className="fixed inset-0 z-[100] bg-white/80 dark:bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
          
          {/* Animated AI Core */}
          <div className="relative mb-12 flex items-center justify-center">
            {/* Outer pulsing rings */}
            <div className="absolute w-32 h-32 bg-indigo-500/20 dark:bg-indigo-500/30 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
            <div className="absolute w-24 h-24 bg-purple-500/20 dark:bg-purple-500/30 rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }}></div>
            
            {/* Inner glowing AI Brain */}
            <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(79,70,229,0.5)] animate-pulse" style={{ animationDuration: '2s' }}>
              <BrainCircuit className="w-8 h-8 text-white" />
            </div>
            
            {/* Spinning tech ring */}
            <svg className="absolute w-28 h-28 text-indigo-500/60 animate-spin" viewBox="0 0 100 100" style={{ animationDuration: '8s' }}>
              <circle cx="50" cy="50" r="48" fill="none" strokeWidth="1.5" strokeDasharray="60 40 10 40" strokeLinecap="round" stroke="currentColor" />
            </svg>
          </div>

          <h2 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 mb-4 tracking-tight animate-pulse" style={{ animationDuration: '3s' }}>
            Crafting Your Lesson...
          </h2>
          
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-lg mx-auto leading-relaxed">
            Nibras AI is structuring content, generating flashcards, and building quizzes for:
          </p>
          
          {/* Elegant Topic Badge */}
          <div className="mt-8 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-30 animate-pulse" style={{ animationDuration: '4s' }}></div>
            <div className="relative bg-white dark:bg-gray-900 border border-indigo-100 dark:border-indigo-800/60 px-8 py-4 rounded-2xl shadow-sm flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              <span className="font-extrabold text-2xl text-gray-900 dark:text-white capitalize tracking-tight">
                {generatingTopic}
              </span>
            </div>
          </div>

          {/* UX Waiting Hint */}
          <div className="mt-16 flex items-center gap-3 text-sm font-bold text-gray-400 dark:text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
            <span>This usually takes 10-15 seconds...</span>
          </div>

        </div>
      )}
    </div>
    </React.Fragment>
  );
};

export default Homepage;