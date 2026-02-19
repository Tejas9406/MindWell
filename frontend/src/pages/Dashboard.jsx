import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ThreeBackground from '../components/ThreeBackground';
import MusicTab from '../components/MusicTab';
import ArticlesTab from '../components/ArticlesTab';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { db, auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

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

    // Custom Smooth Scroll Helper
    const smoothScrollTo = (element, target, duration) => {
        const start = element.scrollTop;
        const change = target - start;
        const startTime = performance.now();

        const animateScroll = (currentTime) => {
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);

            // Easing function (easeInOutQuad)
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

    const handleScroll = (e) => {
        const { scrollTop, clientHeight } = e.target;

        if (insightsRef.current) {
            // Show button only after scrolling 50% of the viewport HEIGHT past the start of Insights
            const insightsTop = insightsRef.current.offsetTop;
            const threshold = insightsTop + (clientHeight * 0.5);
            setShowScrollTop(scrollTop > threshold);
        } else {
            setShowScrollTop(false);
        }
    };

    const scrollToInsightsTop = () => {
        if (mainRef.current && insightsRef.current) {
            const top = insightsRef.current.offsetTop - 40; // Subtract padding
            // Use custom smooth scroll with 800ms duration for visible animation
            smoothScrollTo(mainRef.current, top, 800);
        }
    };

    useEffect(() => {
        const initDashboard = async (user) => {
            // 1. Trigger Sync (Sheets -> Firestore) to get latest data
            try {
                await fetch('http://127.0.0.1:5000/api/sync-responses', { method: 'POST' });
                console.log("✅ Sync triggered");
            } catch (e) {
                console.error("Sync failed", e);
            }

            // 2. Fetch User Data
            if (user) {
                setUserEmail(user.email);
                await fetchUserData(user.email.toLowerCase());
            } else {
                setLoading(false);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            await initDashboard(user);
        });

        return () => unsubscribe();
    }, []);

    const fetchUserData = async (email) => {
        try {
            const docRef = doc(db, "users", email);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setUserData(docSnap.data());
            } else {
                // Document not found
            }
        } catch (error) {
            console.error("Error getting document:", error);
        } finally {
            setLoading(false);
        }
    };

    // Prepare Chart Data
    const stressData = {
        labels: ['Survey Result', 'Max Potential', 'Previous'],
        datasets: [
            {
                label: 'Stress Score',
                data: userData ? [userData.total_score, 48, 0] : [0, 0, 0],
                backgroundColor: [
                    userData?.color_code === 'green' ? 'rgba(74, 222, 128, 0.6)' :
                        userData?.color_code === 'yellow' ? 'rgba(250, 204, 21, 0.6)' :
                            'rgba(248, 113, 113, 0.6)',
                    'rgba(255, 255, 255, 0.1)',
                    'rgba(255, 255, 255, 0.1)'
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

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const newMessage = { id: Date.now(), text: inputText, sender: 'user' };
        setMessages([...messages, newMessage]);
        const currentInput = inputText;
        setInputText('');

        try {
            const res = await fetch('http://127.0.0.1:5000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: currentInput,
                    email: userEmail
                }),
            });

            const data = await res.json();

            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: data.response || "I having trouble connecting right now.",
                sender: 'ai'
            }]);

        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: "Error connecting to AI server. Please make sure the backend is running.",
                sender: 'ai'
            }]);
        }
    };

    const handleViewInsights = async () => {
        if (!userData || !userEmail) return;
        setLoadingInsights(true);
        try {
            const res = await fetch('http://127.0.0.1:5000/api/insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail })
            });
            const data = await res.json();
            if (res.ok) {
                setInsightsData(data);
                // Scroll after render
                setTimeout(() => {
                    insightsRef.current?.scrollIntoView({ behavior: "smooth" });
                }, 100);
            } else {
                console.error("Failed to fetch insights:", data.error);
                alert("Could not load insights. Please try syncing data again.");
            }
        } catch (error) {
            console.error("Error fetching insights:", error);
        } finally {
            setLoadingInsights(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-white"><ThreeBackground />Loading...</div>;
    }



    return (
        <div className="h-screen relative text-white font-sans overflow-hidden flex">
            <ThreeBackground />

            {/* Sidebar */}
            <aside className="w-64 bg-white/5 backdrop-blur-lg border-r border-white/10 hidden md:flex flex-col p-6 z-10">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-10">
                    MindWell AI
                </h1>
                <nav className="space-y-4">
                    <button onClick={() => setActiveTab('overview')} className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30' : 'hover:bg-white/10 text-gray-400'}`}>
                        Overview
                    </button>
                    <button onClick={() => setActiveTab('chat')} className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === 'chat' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30' : 'hover:bg-white/10 text-gray-400'}`}>
                        AI Assistant
                    </button>
                    <button onClick={() => setActiveTab('music')} className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === 'music' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30' : 'hover:bg-white/10 text-gray-400'}`}>
                        Relaxation Music
                    </button>
                    <button onClick={() => setActiveTab('articles')} className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeTab === 'articles' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30' : 'hover:bg-white/10 text-gray-400'}`}>
                        Related Articles
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main ref={mainRef} className="flex-1 p-8 z-10 overflow-y-auto scroll-smooth" onScroll={handleScroll}>
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-5xl mx-auto"
                >
                    {activeTab === 'overview' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Stats Cards */}
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl">
                                <h3 className="text-gray-400 mb-2">Current Stress Score</h3>
                                {userData ? (
                                    <>
                                        <div className={`text-4xl font-bold ${userData.stress_level === 'Low Stress' ? 'text-green-400' :
                                            userData.stress_level === 'Medium Stress' ? 'text-yellow-400' : 'text-red-400'
                                            }`}>
                                            {userData.stress_level} ({userData.total_score})
                                        </div>
                                        <p className="text-sm text-gray-500 mt-2">
                                            Based on your latest survey responses.
                                        </p>
                                    </>
                                ) : (
                                    <div className="text-xl text-gray-400">
                                        No Data Found. Please ensure your email matches the survey.
                                    </div>
                                )}
                            </div>

                            {/* Chart */}
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl col-span-1 md:col-span-2">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-semibold text-gray-200">Stress Analysis Chart</h3>
                                    <button
                                        onClick={handleViewInsights}
                                        disabled={loadingInsights}
                                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-xl text-sm font-medium transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50"
                                    >
                                        {loadingInsights ? "Analyzing..." : "View Full Insights"}
                                    </button>
                                </div>
                                <Bar options={options} data={stressData} />
                            </div>

                            {/* Detailed Insights Section */}
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
                                                            ✨ <b>AI Insight:</b> {item.insight}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'chat' ? (
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl h-[80vh] flex flex-col overflow-hidden">
                            {/* Chat Header */}
                            <div className="p-4 border-b border-white/10 bg-white/5">
                                <h3 className="font-semibold text-purple-300">Dr. Gemini (AI Support)</h3>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] p-4 rounded-2xl ${msg.sender === 'user' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-white/10 text-gray-200 rounded-bl-none border border-white/10'}`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Input */}
                            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-white/5 flex gap-4">
                                <label htmlFor="chat-input" className="sr-only">Type your message</label>
                                <input
                                    id="chat-input"
                                    name="message"
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-purple-500 text-white placeholder-gray-500"
                                    placeholder="Type your message..."
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
                            <ArticlesTab />
                        </div>
                    )}
                </motion.div>

                {/* Scroll to Top of Insights Button */}
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
            </main>
        </div >
    );
};

export default Dashboard;
