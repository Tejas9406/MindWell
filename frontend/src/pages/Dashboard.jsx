import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import ThreeBackground from '../components/ThreeBackground';
import MusicTab from '../components/MusicTab';
import ArticlesTab from '../components/ArticlesTab';
import AssessmentTab from '../components/AssessmentTab';
import DreamInterpreter from '../components/DreamInterpreter';
import GoalChallengeTab from '../components/GoalChallengeTab';
import PanicButton from '../components/PanicButton';
import CBTDiaryTab from '../components/CBTDiaryTab';
import PMRVisualizerTab from '../components/PMRVisualizerTab';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { API_BASE_URL } from '../lib/api';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [messages, setMessages] = useState([
        { id: 1, text: "Hello! I'm your AI Mental Health Assistant. How are you feeling today?", sender: 'ai' }
    ]);
    const [inputText, setInputText] = useState('');
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userEmail, setUserEmail] = useState(null);
    const [loadingInsights, setLoadingInsights] = useState(false);
    const [insightsData, setInsightsData] = useState(null);
    const insightsRef = useRef(null);
    const mainRef = useRef(null);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [showCrisisModal, setShowCrisisModal] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [vocalAnalysis, setVocalAnalysis] = useState(null);

    const smoothScrollTo = (element, target, duration) => {
        const start = element.scrollTop;
        const change = target - start;
        const startTime = performance.now();

        const animateScroll = (currentTime) => {
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            const ease = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            element.scrollTop = start + (change * ease);

            if (timeElapsed < duration) {
                requestAnimationFrame(animateScroll);
            }
        };

        requestAnimationFrame(animateScroll);
    };

    const handleScroll = (event) => {
        const { scrollTop, clientHeight } = event.target;

        if (insightsRef.current) {
            const insightsTop = insightsRef.current.offsetTop;
            const threshold = insightsTop + (clientHeight * 0.5);
            setShowScrollTop(scrollTop > threshold);
        } else {
            setShowScrollTop(false);
        }
    };

    const scrollToInsightsTop = () => {
        if (mainRef.current && insightsRef.current) {
            const top = insightsRef.current.offsetTop - 40;
            smoothScrollTo(mainRef.current, top, 800);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setLoading(false);
                setUserData(null);
                setUserEmail(null);
                return;
            }

            const email = user.email?.toLowerCase() || '';
            setUserEmail(email);
            await fetchUserData(email);
        });

        return () => unsubscribe();
    }, []);

    const fetchUserData = async (email) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/user-data?email=${encodeURIComponent(email)}`);
            if (res.status === 404) {
                setUserData(null);
                setActiveTab('overview');
                setMessages([
                    { id: 1, text: "Let's complete your first assessment so I can personalize everything for you.", sender: 'ai' }
                ]);
                return;
            }

            const data = await res.json();
            if (!res.ok) {
                if (res.status === 500) {
                    throw new Error('Database connection timed out. Please check your MongoDB Atlas IP whitelist.');
                }
                throw new Error(data.error || 'Unable to load user data');
            }

            setUserData(data);
            await fetchChatHistory(email, data);
        } catch (error) {
            console.error('Error loading user data:', error);
            if (error.message.includes('Database connection timed out') || error.message.includes('MongoDB')) {
                setUserData({ 
                    error: true, 
                    message: "Cannot connect to the database. If you are using MongoDB Atlas, make sure your current IP address is whitelisted in the Network Access settings." 
                });
            } else {
                setUserData(null);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchChatHistory = async (email, data) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/chat-history?email=${encodeURIComponent(email)}`);
            const history = await res.json();

            if (res.ok && Array.isArray(history.messages) && history.messages.length > 0) {
                setMessages(history.messages.map((message, index) => ({
                    id: `history-${index}`,
                    text: message.text,
                    sender: message.role === 'user' ? 'user' : 'ai',
                })));
            } else {
                setMessages([
                    {
                        id: 1,
                        text: `Hello! I'm your AI Mental Health Assistant. I can use your ${formatProfileType(data?.profile_type)} assessment context whenever you're ready.`,
                        sender: 'ai',
                    }
                ]);
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    };

    const maxScore = userData?.answers?.length ? userData.answers.length * 3 : 48;
    const stressData = {
        labels: ['Assessment Result', 'Max Potential', 'Recovery Space'],
        datasets: [
            {
                label: 'Stress Score',
                data: userData ? [userData.total_score, maxScore, Math.max(maxScore - userData.total_score, 0)] : [0, 0, 0],
                backgroundColor: [
                    userData?.color_code === 'green' ? 'rgba(74, 222, 128, 0.6)' :
                        userData?.color_code === 'yellow' ? 'rgba(250, 204, 21, 0.6)' :
                            'rgba(248, 113, 113, 0.6)',
                    'rgba(255, 255, 255, 0.1)',
                    'rgba(96, 165, 250, 0.25)'
                ],
                borderColor: 'rgba(255, 255, 255, 0.5)',
                borderWidth: 1,
                borderRadius: 5,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: { position: 'top', labels: { color: 'white' } },
            title: { display: true, text: 'Your Stress Analysis', color: 'white' },
        },
        scales: {
            x: { ticks: { color: 'gray' }, grid: { color: 'rgba(255,255,255,0.1)' } },
            y: { ticks: { color: 'gray' }, grid: { color: 'rgba(255,255,255,0.1)' } },
        }
    };

    const handleAssessmentComplete = async (data) => {
        setUserData(data);
        setActiveTab('overview');
        setInsightsData(null);
        setMessages([
            {
                id: 1,
                text: `Your first assessment is ready. I can now help using your ${formatProfileType(data?.profile_type)} context.`,
                sender: 'ai',
            }
        ]);
    };

    const handleUserDataRefresh = (data) => {
        setUserData(data);
    };

    const handleSendMessage = async (event) => {
        event.preventDefault();
        if (!inputText.trim()) return;

        const newMessage = { 
            id: Date.now(), 
            text: inputText, 
            sender: 'user',
            vocalAnalysis: vocalAnalysis 
        };
        setMessages((prev) => [...prev, newMessage]);
        
        const currentInput = inputText;
        const currentAnalysis = vocalAnalysis;
        
        setInputText('');
        setVocalAnalysis(null);

        const crisisKeywords = ['suicide', 'kill myself', 'kill me', 'want to die', 'end it', 'self harm', 'self-harm', 'no reason to live', 'i want to die', 'can\'t do this anymore'];
        if (crisisKeywords.some(kw => currentInput.toLowerCase().includes(kw))) {
            setShowCrisisModal(true);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: "I'm detecting that you might be in immediate distress. Please, let's get you connected with real human support right away.",
                sender: 'ai'
            }]);
            return; // Stop AI from generating a standard response
        }

        try {
            // Append the vocal biomarker context so the AI knows how the user "sounded"
            let finalMessagePayload = currentInput;
            if (currentAnalysis) {
                finalMessagePayload += `\n\n[System Note - Vocal Biomarker Analysis: The user's voice sounded ${currentAnalysis.toLowerCase()}. Please be extra empathetic.]`;
            }

            const res = await fetch(`${API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: finalMessagePayload,
                    email: userEmail
                }),
            });

            const data = await res.json();

            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: data.response || 'I am having trouble connecting right now.',
                sender: 'ai'
            }]);

        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: 'Error connecting to AI server. Please make sure the backend is running.',
                sender: 'ai'
            }]);
        }
    };

    const handleViewInsights = async () => {
        if (!userData || !userEmail) return;
        setLoadingInsights(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/insights`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail })
            });
            const data = await res.json();
            if (res.ok) {
                setInsightsData(data);
                setTimeout(() => {
                    insightsRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            } else {
                console.error('Failed to fetch insights:', data.error);
            }
        } catch (error) {
            console.error('Error fetching insights:', error);
        } finally {
            setLoadingInsights(false);
        }
    };

    const handleVoiceInput = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Your browser does not support speech recognition. Try Google Chrome.');
            return;
        }
        
        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsRecording(true);
            setInputText('Listening... Speak now.');
        };

        recognition.onresult = (event) => {
            setIsRecording(false);
            const transcript = event.results[0][0].transcript;
            
            // Mock Vocal Biomarker Analysis
            setInputText('Analyzing Vocal Biomarkers...');
            setTimeout(() => {
                const isNegative = ['sad', 'bad', 'stress', 'tired', 'exhausted', 'kill', 'die'].some(w => transcript.toLowerCase().includes(w));
                const mockAnalysis = isNegative ? 'High Stress / Fatigue Tone Detected' : 'Neutral / Calm Tone Detected';
                setVocalAnalysis(mockAnalysis);
                setInputText(transcript);
            }, 1500);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            setIsRecording(false);
            setInputText('');
        };

        recognition.start();
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-white"><ThreeBackground />Loading...</div>;
    }

    if (userData && userData.error) {
        return (
            <div className="min-h-screen relative text-white font-sans overflow-hidden flex items-center justify-center p-6">
                <ThreeBackground />
                <div className="relative z-10 max-w-lg bg-red-500/10 border border-red-500/30 p-8 rounded-3xl backdrop-blur-xl text-center shadow-2xl">
                    <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h2 className="text-2xl font-bold text-red-300 mb-4">Database Connection Error</h2>
                    <p className="text-red-200/80 mb-6">{userData.message}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl transition-colors"
                    >
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="min-h-screen relative text-white font-sans overflow-hidden">
                <ThreeBackground />
                <main className="relative z-10 max-w-6xl mx-auto px-6 py-10">
                    <AssessmentTab
                        userEmail={userEmail}
                        currentProfileType={null}
                        onComplete={handleAssessmentComplete}
                    />
                </main>
            </div>
        );
    }

    return (
        <div className="h-screen relative text-white font-sans overflow-hidden flex">
            <ThreeBackground />
            <PanicButton />

            <aside className="w-64 bg-white/5 backdrop-blur-lg border-r border-white/10 hidden md:flex flex-col p-6 z-10">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-3">
                    MindWell AI
                </h1>
                <p className="text-xs uppercase tracking-[0.24em] text-gray-400 mb-8">
                    {formatProfileType(userData?.profile_type)}
                </p>
                <nav className="space-y-4">
                    <button onClick={() => setActiveTab('overview')} className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30' : 'hover:bg-white/10 text-gray-400'}`}>
                        Overview
                    </button>
                    <button onClick={() => setActiveTab('chat')} className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === 'chat' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30' : 'hover:bg-white/10 text-gray-400'}`}>
                        AI Assistant
                    </button>
                    <button onClick={() => setActiveTab('dreams')} className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === 'dreams' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30' : 'hover:bg-white/10 text-gray-400'}`}>
                        Dream Interpreter
                    </button>
                    <button onClick={() => setActiveTab('music')} className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === 'music' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30' : 'hover:bg-white/10 text-gray-400'}`}>
                        Relaxation Music
                    </button>
                    <button onClick={() => setActiveTab('goal-challenge')} className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === 'goal-challenge' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30' : 'hover:bg-white/10 text-gray-400'}`}>
                        Weekly Task
                    </button>
                    <button onClick={() => setActiveTab('cbt-diary')} className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === 'cbt-diary' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30' : 'hover:bg-white/10 text-gray-400'}`}>
                        CBT Thought Diary
                    </button>
                    <button onClick={() => setActiveTab('pmr')} className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === 'pmr' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30' : 'hover:bg-white/10 text-gray-400'}`}>
                        Muscle Relaxation
                    </button>
                    <button onClick={() => setActiveTab('articles')} className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === 'articles' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30' : 'hover:bg-white/10 text-gray-400'}`}>
                        Related Articles
                    </button>
                </nav>
            </aside>

            <main ref={mainRef} className="flex-1 p-8 z-10 overflow-y-auto scroll-smooth" onScroll={handleScroll}>
                <div className="mb-6 flex gap-3 overflow-x-auto md:hidden">
                    {[
                        ['overview', 'Overview'],
                        ['chat', 'AI Assistant'],
                        ['dreams', 'Dream Interpreter'],
                        ['music', 'Relaxation Music'],
                        ['goal-challenge', 'Weekly Task'],
                        ['cbt-diary', 'CBT Thought Diary'],
                        ['pmr', 'Muscle Relaxation'],
                        ['articles', 'Related Articles'],
                    ].map(([key, label]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setActiveTab(key)}
                            className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-all ${activeTab === key
                                ? 'border-purple-500/30 bg-purple-600/30 text-purple-200'
                                : 'border-white/10 bg-white/5 text-gray-300'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-5xl mx-auto"
                >
                    {activeTab === 'overview' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl">
                                <h3 className="text-gray-400 mb-2">Current Stress Score</h3>
                                <div className={`text-4xl font-bold ${userData.stress_level === 'Low Stress' ? 'text-green-400' :
                                    userData.stress_level === 'Medium Stress' ? 'text-yellow-400' : 'text-red-400'
                                    }`}>
                                    {userData.stress_level} ({userData.total_score})
                                </div>
                                <p className="text-sm text-gray-500 mt-2">
                                    Based on your initial assessment responses.
                                </p>
                            </div>

                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl">
                                <h3 className="text-gray-400 mb-2">Wellness Signals</h3>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                        <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Mental Weather</p>
                                        <p className="mt-2 text-lg font-semibold text-blue-200">
                                            {userData.wellness_signals?.mental_weather || 'Balanced'}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                        <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Energy Band</p>
                                        <p className="mt-2 text-lg font-semibold text-purple-200">
                                            {userData.wellness_signals?.energy_band || userData.energy_level || 'Steady'}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                        <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Sleep Debt</p>
                                        <p className="mt-2 text-lg font-semibold text-amber-200">
                                            {userData.wellness_signals?.sleep_debt || userData.sleep_quality || 'Moderate'}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 mt-3">
                                    A quick status view from your initial assessment and current wellness profile.
                                </p>
                            </div>

                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl col-span-1 md:col-span-2">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-semibold text-gray-200">Stress Analysis Chart</h3>
                                    <button
                                        onClick={handleViewInsights}
                                        disabled={loadingInsights}
                                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-xl text-sm font-medium transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50"
                                    >
                                        {loadingInsights ? 'Analyzing...' : 'View Full Insights'}
                                    </button>
                                </div>
                                <Bar options={options} data={stressData} />
                            </div>

                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl col-span-1 md:col-span-2">
                                <div className="flex flex-wrap gap-6">
                                    <div className="flex-1 min-w-[220px]">
                                        <h3 className="text-lg font-semibold text-purple-200 mb-4">Top Triggers</h3>
                                        <div className="flex flex-wrap gap-3">
                                            {(userData.top_triggers || []).map((trigger) => (
                                                <span key={trigger} className="px-4 py-2 rounded-full bg-red-500/15 text-red-200 text-sm border border-red-400/20">
                                                    {trigger}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-[220px]">
                                        <h3 className="text-lg font-semibold text-blue-200 mb-4">Protective Strengths</h3>
                                        <div className="space-y-3">
                                            {(userData.strengths || []).slice(0, 2).map((strength, idx) => (
                                                <div key={idx} className="p-3 rounded-2xl bg-blue-500/10 border border-blue-400/20 text-sm text-blue-100">
                                                    {strength}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {userData.dimension_breakdown?.length > 0 && (
                                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl col-span-1 md:col-span-2">
                                    <h3 className="text-xl font-semibold text-gray-200 mb-5">Focus Areas</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        {userData.dimension_breakdown.slice(0, 4).map((dimension) => (
                                            <div key={dimension.key} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                                <div className="flex justify-between items-start gap-4 mb-3">
                                                    <div>
                                                        <h4 className="text-lg font-medium text-gray-100">{dimension.label}</h4>
                                                        <p className="text-sm text-gray-400 mt-1">{dimension.insight}</p>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${dimension.score >= 70 ? 'bg-red-500/20 text-red-300' : dimension.score >= 45 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'}`}>
                                                        {dimension.score}
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${dimension.score >= 70 ? 'bg-gradient-to-r from-red-500 to-orange-400' : dimension.score >= 45 ? 'bg-gradient-to-r from-yellow-500 to-amber-300' : 'bg-gradient-to-r from-green-400 to-emerald-300'}`}
                                                        style={{ width: `${dimension.score}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {insightsData && (
                                <div ref={insightsRef} className="col-span-1 md:col-span-2 space-y-6 animate-fade-in-up">
                                    <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">
                                        Detailed Insights & Recommendations
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        {insightsData.map((item, index) => (
                                            <div key={index} className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-colors">
                                                <div className="flex justify-between items-start gap-4 mb-2">
                                                    <h4 className="text-lg font-medium text-gray-200">{item.question}</h4>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.score === 0 ? 'bg-green-500/20 text-green-300' :
                                                        item.score <= 1 ? 'bg-yellow-500/20 text-yellow-300' :
                                                            'bg-red-500/20 text-red-300'
                                                        }`}>
                                                        Score: {item.score}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-400 mb-2">
                                                    Your Answer: <span className="text-white italic">"{item.answer}"</span>
                                                </div>
                                                {item.insight && (
                                                    <div className="mt-3 p-3 bg-purple-900/20 border border-purple-500/20 rounded-xl">
                                                        <p className="text-purple-200 text-sm">
                                                            <b>AI Insight:</b> {item.insight}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'goal-challenge' ? (
                        <GoalChallengeTab userData={userData} />
                    ) : activeTab === 'cbt-diary' ? (
                        <CBTDiaryTab userEmail={userEmail} />
                    ) : activeTab === 'pmr' ? (
                        <PMRVisualizerTab />
                    ) : activeTab === 'dreams' ? (
                        <DreamInterpreter userEmail={userEmail} />
                    ) : activeTab === 'chat' ? (
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl h-[80vh] flex flex-col overflow-hidden">
                            <div className="p-4 border-b border-white/10 bg-white/5">
                                <h3 className="font-semibold text-purple-300">Dr. Gemini (AI Support)</h3>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className={`max-w-[70%] p-4 rounded-2xl ${msg.sender === 'user' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-white/10 text-gray-200 rounded-bl-none border border-white/10'}`}>
                                            {msg.text}
                                        </div>
                                        {msg.vocalAnalysis && (
                                            <div className="mt-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-purple-300/80 bg-purple-900/30 px-2 py-1 rounded-full border border-purple-500/20">
                                                <svg className="w-3 h-3 animate-pulse text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                                </svg>
                                                Vocal Marker: {msg.vocalAnalysis}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-white/5 flex gap-4 items-center">
                                <button
                                    type="button"
                                    onClick={handleVoiceInput}
                                    title="Voice Input"
                                    className={`p-3 rounded-full transition-colors flex-shrink-0 ${isRecording ? 'bg-red-500 animate-pulse text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                </button>
                                <label htmlFor="chat-input" className="sr-only">Type your message</label>
                                <input
                                    id="chat-input"
                                    name="message"
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    disabled={isRecording || inputText === 'Analyzing Vocal Biomarkers...'}
                                    className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-purple-500 text-white placeholder-gray-500 disabled:opacity-50"
                                    placeholder={isRecording ? "Listening..." : "Type or speak your message..."}
                                    autoComplete="off"
                                />
                                <button type="submit" className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-medium transition-colors">
                                    Send
                                </button>
                            </form>
                        </div>
                    ) : activeTab === 'music' ? (
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl p-6 min-h-[80vh]">
                            <h2 className="text-2xl font-bold mb-6 text-purple-100">Relaxation Zone</h2>
                            <MusicTab stressLevel={userData?.stress_level} />
                        </div>
                    ) : (
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl p-6 min-h-[80vh]">
                            <h2 className="text-2xl font-bold mb-6 text-purple-100">Helpful Articles</h2>
                            <ArticlesTab email={userEmail} profileType={userData?.profile_type} />
                        </div>
                    )}
                </motion.div>

                {showScrollTop && activeTab === 'overview' && insightsData && (
                    <button
                        onClick={scrollToInsightsTop}
                        className="fixed bottom-8 right-8 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-2xl transition-all animate-bounce z-50 group"
                        title="Back to Insights Top"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:-translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                    </button>
                )}

                {showCrisisModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
                        <div className="bg-red-900/90 border border-red-500/50 rounded-3xl max-w-lg w-full p-8 text-center shadow-[0_0_50px_rgba(239,68,68,0.5)]">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-red-400 mb-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <h2 className="text-3xl font-bold text-white mb-2">You are not alone.</h2>
                            <p className="text-red-200 mb-8 text-lg">
                                We are here for you, but an AI cannot provide the critical care you deserve right now. Please reach out to someone who can help immediately.
                            </p>
                            
                            <div className="space-y-4 mb-8">
                                <a href="tel:988" className="block w-full bg-white text-red-900 font-bold py-4 rounded-xl text-xl hover:bg-gray-100 transition-colors">
                                    Call 988 (Suicide & Crisis Lifeline)
                                </a>
                                <a href="sms:741741" className="block w-full bg-red-800 text-white font-bold py-4 rounded-xl text-xl hover:bg-red-700 transition-colors border border-red-500">
                                    Text HOME to 741741
                                </a>
                            </div>

                            <button onClick={() => setShowCrisisModal(false)} className="text-red-300/50 hover:text-red-300 text-sm transition-colors">
                                I am safe. Return to Dashboard.
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

function formatProfileType(value) {
    if (!value) {
        return 'Wellness';
    }

    return value
        .split('_')
        .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
        .join(' ');
}

export default Dashboard;
