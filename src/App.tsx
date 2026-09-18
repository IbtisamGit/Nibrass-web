import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import LessonForm from './components/LessonForm';
import LessonView from './components/LessonView';
import { GraduationCap, LayoutDashboard, LogOut, Settings, BookOpen, ChevronLeft, ChevronRight, Loader2, BrainCircuit, Trash2, User, Mail, Trophy, Target, Activity } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

// استيراد عناصر الرسوم البيانية
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// --- Real Dashboard Overview Component with Multiple Charts & Test Stats ---
const DashboardOverview = () => {
  const [stats, setStats] = useState({ totalLessons: 0, totalCategories: 0, quizzesTaken: 0, avgScore: 0 });
  const [recentLessons, setRecentLessons] = useState<any[]>([]);
  const [barChartData, setBarChartData] = useState<any>(null);
  const [donutChartData, setDonutChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Learner');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.user_metadata?.username) {
          setUserName(userData.user.user_metadata.username);
        }

        // جلب الدروس
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .order('created_at', { ascending: false });

        if (lessonsError) throw lessonsError;

        // جلب نتائج الاختبارات
        const { data: testData, error: testError } = await supabase
          .from('test_results')
          .select('score');

        if (testError) throw testError;

        let quizzesCount = 0;
        let average = 0;

        if (testData && testData.length > 0) {
          quizzesCount = testData.length;
          const totalScore = testData.reduce((acc, curr) => acc + curr.score, 0);
          average = Math.round(totalScore / quizzesCount);
        }

        if (lessonsData) {
          setRecentLessons(lessonsData.slice(0, 5));

          const categoryCounts = lessonsData.reduce((acc: any, lesson: any) => {
            const rawCat = (lesson.category || 'Uncategorized').trim().toLowerCase();
            const cat = rawCat.charAt(0).toUpperCase() + rawCat.slice(1);
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
          }, {});

          const categories = Object.keys(categoryCounts);

          setStats({ 
            totalLessons: lessonsData.length, 
            totalCategories: categories.length,
            quizzesTaken: quizzesCount,
            avgScore: average
          });

          setBarChartData({
            labels: categories,
            datasets: [{
              label: 'Lessons',
              data: Object.values(categoryCounts),
              backgroundColor: 'rgba(79, 70, 229, 0.85)',
              borderRadius: 6,
              hoverBackgroundColor: 'rgba(67, 56, 202, 1)',
            }],
          });

          const difficultyCounts = lessonsData.reduce((acc: any, lesson: any) => {
            const diff = lesson.difficulty_level || 'Medium';
            acc[diff] = (acc[diff] || 0) + 1;
            return acc;
          }, {});

          const difficultyColors: any = {
            'Easy': 'rgba(34, 197, 94, 0.85)',
            'Medium': 'rgba(234, 179, 8, 0.85)',
            'Hard': 'rgba(239, 68, 68, 0.85)'
          };

          const diffLabels = Object.keys(difficultyCounts);
          const diffBackgrounds = diffLabels.map(label => difficultyColors[label] || 'rgba(99, 102, 241, 0.85)');

          setDonutChartData({
            labels: diffLabels,
            datasets: [{
              data: Object.values(difficultyCounts),
              backgroundColor: diffBackgrounds,
              borderWidth: 0,
              hoverOffset: 4
            }]
          });
        }
      } catch (err) {
        console.error("Error fetching overview data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
  };

  const donutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { position: 'bottom' as const, labels: { padding: 20, usePointStyle: true } }
    },
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-3xl p-8 text-white shadow-md flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold mb-2">Welcome back, {userName}!</h2>
          <p className="text-indigo-100">Ready to learn something new today?</p>
        </div>
        <button 
          onClick={() => navigate('/learn')}
          className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-indigo-50 transition-colors hidden md:block"
        >
          Create New Lesson
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-500 truncate">Total Lessons</p>
            <p className="text-2xl font-extrabold text-gray-900">{stats.totalLessons}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 shrink-0">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-500 truncate">Categories</p>
            <p className="text-2xl font-extrabold text-gray-900">{stats.totalCategories}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-500 truncate">Quizzes Taken</p>
            <p className="text-2xl font-extrabold text-gray-900">{stats.quizzesTaken}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center text-pink-600 shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-500 truncate">Avg Score</p>
            <p className="text-2xl font-extrabold text-gray-900">{stats.avgScore}%</p>
          </div>
        </div>
      </div>

      {/* Charts Section - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Knowledge Distribution</h3>
          <div className="flex-1 min-h-[250px]">
            {barChartData && stats.totalLessons > 0 ? (
              <Bar data={barChartData} options={barChartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">Not enough data.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col lg:col-span-1">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Difficulty Breakdown</h3>
          <div className="flex-1 min-h-[250px] relative">
            {donutChartData && stats.totalLessons > 0 ? (
              <Doughnut data={donutChartData} options={donutChartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">Not enough data.</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-800">Recent Activity</h3>
          <button onClick={() => navigate('/dashboard/lessons')} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            View All
          </button>
        </div>
        <div className="divide-y divide-gray-50 flex-1 overflow-y-auto">
          {recentLessons.length === 0 ? (
            <div className="p-6 text-center text-gray-500 h-full flex items-center justify-center">No lessons generated yet.</div>
          ) : (
            recentLessons.map(lesson => (
              <div key={lesson.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 flex-shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">{lesson.topic}</p>
                    <p className="text-xs text-gray-500 truncate">{lesson.category} • {new Date(lesson.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <button onClick={() => navigate(`/dashboard/lessons/${lesson.id}`)} className="px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors ml-2">
                  Review
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// --- Real MyLessons Component ---
const MyLessons = () => {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyLessons();
  }, []);

  const fetchMyLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setLessons(data);
    } catch (err) {
      console.error("Error fetching lessons:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this lesson? This action cannot be undone.")) return;
    
    try {
      const { error } = await supabase.from('lessons').delete().eq('id', id);
      if (error) throw error;
      setLessons(prev => prev.filter(lesson => lesson.id !== id));
    } catch (err) {
      console.error("Error deleting lesson:", err);
      alert("Failed to delete lesson.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl h-64 flex flex-col items-center justify-center shadow-sm">
        <BookOpen className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-400 font-medium text-lg">Your generated lessons will be saved here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {lessons.map((lesson) => (
        <div key={lesson.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col relative group">
          <button 
            onClick={(e) => handleDelete(e, lesson.id)}
            className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            title="Delete Lesson"
          >
            <Trash2 className="w-5 h-5" />
          </button>

          <div className="flex justify-between items-start mb-4 pr-10">
            <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider truncate max-w-[150px]">
              {lesson.category}
            </span>
            <span className="text-xs text-gray-400 font-medium whitespace-nowrap ml-2">
              {new Date(lesson.created_at).toLocaleDateString()}
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">{lesson.topic}</h3>
          <p className="text-sm text-gray-500 mb-6">Difficulty: {lesson.difficulty_level}</p>
          
          <div className="mt-auto">
            <button
              onClick={() => navigate(`/dashboard/lessons/${lesson.id}`)}
              className="w-full bg-gray-50 hover:bg-indigo-50 text-indigo-600 font-semibold py-2.5 rounded-xl transition-colors border border-gray-100 hover:border-indigo-100"
            >
              View Lesson
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

const SettingsPage = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setEmail(data.user.email || '');
        setUsername(data.user.user_metadata?.username || 'Learner');
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" /> Username
            </label>
            <input
              type="text"
              readOnly
              value={username}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 focus:outline-none"
            />
            <p className="text-xs text-gray-400 mt-2">Your display name across the platform.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" /> Email Address
            </label>
            <input
              type="email"
              readOnly
              value={email}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-600 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Learn Route ---
const LearnLayout = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2 text-indigo-600">
          <GraduationCap className="w-8 h-8" />
          <span className="text-xl font-bold text-gray-900">AI Learning</span>
        </div>
        <Link to="/dashboard" className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">
          Back to Dashboard
        </Link>
      </nav>
      <main className="max-w-4xl mx-auto px-6 py-12 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Generate Your Lesson</h1>
          <p className="text-lg text-gray-500 max-w-lg mx-auto">
            Select a category and topic, and our AI will generate personalized flashcards, a summary, and an MCQ test just for you.
          </p>
        </div>
        <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <LessonForm onSubmit={(data) => {
            if (data && data.lesson_id) {
              navigate(`/dashboard/lessons/${data.lesson_id}`);
            }
          }} />
        </div>
      </main>
    </div>
  );
};

// --- Protected Dashboard Route (Layout) ---
const DashboardLayout = ({ session }: { session: Session }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center py-3 rounded-xl font-medium transition-all duration-200 overflow-hidden ${
      isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
    } ${isSidebarOpen ? 'px-4 mx-4 gap-3' : 'justify-center mx-3'}`;

  const getPageTitle = () => {
    if (location.pathname.includes('/lessons/')) return 'Lesson Viewer';
    if (location.pathname.includes('/lessons')) return 'My Lessons';
    if (location.pathname.includes('/settings')) return 'Settings';
    return 'Overview';
  };

  const userEmail = session.user.email || '';
  const userInitial = userEmail.charAt(0).toUpperCase();
  const userName = session.user.user_metadata?.username || 'Learner';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className={`relative bg-white border-r border-gray-200 hidden md:flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-8 bg-white border border-gray-200 rounded-full p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors z-20 shadow-sm"
        >
          {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <div className={`p-6 flex items-center text-indigo-600 border-b border-gray-100 transition-all ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}>
          <GraduationCap className="w-8 h-8 flex-shrink-0" />
          {isSidebarOpen && <span className="text-xl font-bold text-gray-900 whitespace-nowrap">Dashboard</span>}
        </div>
        
        <nav className="flex-1 py-4 space-y-2 flex flex-col">
          <NavLink to="/dashboard" end className={navLinkClass}>
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span className="whitespace-nowrap">Overview</span>}
          </NavLink>
          <NavLink to="/dashboard/lessons" end className={navLinkClass}>
            <BookOpen className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span className="whitespace-nowrap">My Lessons</span>}
          </NavLink>
          <NavLink to="/dashboard/settings" className={navLinkClass}>
            <Settings className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span className="whitespace-nowrap">Settings</span>}
          </NavLink>
        </nav>
        
        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className={`flex items-center py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-all overflow-hidden w-full ${isSidebarOpen ? 'px-4 gap-3' : 'justify-center'}`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span className="whitespace-nowrap">Log Out</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white px-8 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10">
          <h1 className="text-2xl font-bold text-gray-800">{getPageTitle()}</h1>
          <div className="flex items-center gap-6">
            <Link to="/learn" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm text-sm whitespace-nowrap">
              + New Lesson
            </Link>
            <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
            <div className="flex items-center gap-3 cursor-default">
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500">{userEmail}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold shadow-sm flex-shrink-0">
                {userInitial}
              </div>
            </div>
          </div>
        </header>
        <div className="p-8 flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={session ? <Navigate to="/dashboard" replace /> : <Auth />} />
        <Route path="/learn" element={session ? <LearnLayout /> : <Navigate to="/" replace />} />
        <Route path="/dashboard" element={session ? <DashboardLayout session={session} /> : <Navigate to="/" replace />}>
          <Route index element={<DashboardOverview />} />
          <Route path="lessons" element={<MyLessons />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="lessons/:id" element={<LessonView />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;