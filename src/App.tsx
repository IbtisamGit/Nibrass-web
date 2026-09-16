import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import LessonForm from './components/LessonForm';
import LessonView from './components/LessonView';
import { GraduationCap, LayoutDashboard, LogOut, Settings, BookOpen, ChevronLeft, ChevronRight, Loader2, BrainCircuit } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

// استيراد مكتبة الرسوم البيانية Chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// --- Real Dashboard Overview Component with Charts ---
const DashboardOverview = () => {
  const [stats, setStats] = useState({ totalLessons: 0 });
  const [recentLessons, setRecentLessons] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data, error } = await supabase
          .from('lessons')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          setStats({ totalLessons: data.length });
          setRecentLessons(data.slice(0, 4));

          // تحليل التصنيفات للرسم البياني
          const categoryCounts = data.reduce((acc: any, lesson: any) => {
            const cat = lesson.category || 'Uncategorized';
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
          }, {});

          setChartData({
            labels: Object.keys(categoryCounts),
            datasets: [
              {
                label: 'Lessons Generated',
                data: Object.values(categoryCounts),
                backgroundColor: 'rgba(79, 70, 229, 0.85)',
                borderRadius: 6,
                hoverBackgroundColor: 'rgba(67, 56, 202, 1)',
              },
            ],
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

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
  };

  return (
    <div className="space-y-8 pb-8">
      {/* قسم الإحصائيات السريعة */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Total Lessons</p>
            <p className="text-2xl font-extrabold text-gray-900">{stats.totalLessons}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
            <BrainCircuit className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">AI Generations</p>
            <p className="text-2xl font-extrabold text-gray-900">{stats.totalLessons}</p>
          </div>
        </div>
      </div>

      {/* قسم الرسم البياني والنشاطات */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* الرسم البياني */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Lessons by Category</h3>
          <div className="flex-1 min-h-[250px]">
            {chartData && stats.totalLessons > 0 ? (
              <Bar data={chartData} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                Not enough data for charts yet.
              </div>
            )}
          </div>
        </div>

        {/* أحدث النشاطات */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-800">Recent Activity</h3>
            <button 
              onClick={() => navigate('/dashboard/lessons')} 
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
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
                  <button 
                    onClick={() => navigate(`/dashboard/lessons/${lesson.id}`)}
                    className="px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors ml-2"
                  >
                    Review
                  </button>
                </div>
              ))
            )}
          </div>
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

    fetchMyLessons();
  }, []);

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
        <div key={lesson.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {lesson.category}
            </span>
            <span className="text-xs text-gray-400 font-medium">
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

const SettingsPage = () => (
  <div className="bg-white border border-gray-200 rounded-2xl h-64 flex flex-col items-center justify-center shadow-sm">
    <Settings className="w-12 h-12 text-gray-300 mb-4" />
    <p className="text-gray-400 font-medium text-lg">User preferences and account settings.</p>
  </div>
);

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
      
      <aside 
        className={`relative bg-white border-r border-gray-200 hidden md:flex flex-col transition-all duration-300 ${
          isSidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-8 bg-white border border-gray-200 rounded-full p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors z-20 shadow-sm"
        >
          {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <div className={`p-6 flex items-center text-indigo-600 border-b border-gray-100 transition-all ${
          isSidebarOpen ? 'gap-3' : 'justify-center'
        }`}>
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
            className={`flex items-center py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-all overflow-hidden w-full ${
              isSidebarOpen ? 'px-4 gap-3' : 'justify-center'
            }`}
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
        <Route 
          path="/" 
          element={session ? <Navigate to="/dashboard" replace /> : <Auth />} 
        />
        <Route 
          path="/learn" 
          element={session ? <LearnLayout /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/dashboard" 
          element={session ? <DashboardLayout session={session} /> : <Navigate to="/" replace />} 
        >
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