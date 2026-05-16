import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BubblePopGame from './BubblePopGame';

const defaultCategories = [
    {
        id: 'personal',
        label: 'PERSONAL',
        color: 'from-blue-500 to-cyan-400',
        tasks: [
            { id: 'p1', text: 'Read at least 1 book' },
            { id: 'p2', text: 'Engage in a hobby' },
            { id: 'p3', text: 'Watch a documentary' },
            { id: 'p4', text: 'Hangout with friends' },
            { id: 'p5', text: 'Go to a spa or salon' },
            { id: 'p6', text: 'Donate old clothes' },
        ]
    },
    {
        id: 'inner_peace',
        label: 'INNER PEACE',
        color: 'from-emerald-400 to-teal-400',
        tasks: [
            { id: 'ip1', text: 'Practice meditation' },
            { id: 'ip2', text: 'Stay calm and composed' },
            { id: 'ip3', text: 'Be thankful to close friends' },
            { id: 'ip4', text: 'Focus on the good things' },
            { id: 'ip5', text: 'Listen to music' },
            { id: 'ip6', text: 'Listen to nature sounds' },
        ]
    },
    {
        id: 'health',
        label: 'HEALTH',
        color: 'from-green-400 to-emerald-500',
        tasks: [
            { id: 'h1', text: 'Go for a morning jog' },
            { id: 'h2', text: 'Dance to your favourite song' },
            { id: 'h3', text: 'Play your favourite sport' },
            { id: 'h4', text: 'Go trekking' },
            { id: 'h5', text: 'Try gardening' },
            { id: 'h6', text: 'Eat healthy & stay hydrated' },
        ]
    },
    {
        id: 'family',
        label: 'FAMILY',
        color: 'from-orange-400 to-amber-500',
        tasks: [
            { id: 'fa1', text: 'Express gratitude to parents' },
            { id: 'fa2', text: 'Plan a theme party' },
            { id: 'fa3', text: 'Have fun with cousins' },
            { id: 'fa4', text: 'Assist with household tasks' },
            { id: 'fa5', text: 'Spend time with grandparents' },
            { id: 'fa6', text: 'Click pictures with your pet' },
        ]
    },
    {
        id: 'career',
        label: 'CAREER',
        color: 'from-purple-500 to-indigo-500',
        tasks: [
            { id: 'c1', text: 'Learn a new skill' },
            { id: 'c2', text: 'Watch inspirational vlogs' },
            { id: 'c3', text: 'Research courses for higher education' },
            { id: 'c4', text: 'Attend an academic event' },
            { id: 'c5', text: 'Seek an internship' },
            { id: 'c6', text: 'Look out for a mentor' },
        ]
    },
    {
        id: 'fun',
        label: 'FUN',
        color: 'from-pink-500 to-rose-400',
        tasks: [
            { id: 'fu1', text: 'Watch a comedy movie' },
            { id: 'fu2', text: 'Dress up like a character' },
            { id: 'fu3', text: 'Attend a fun fest' },
            { id: 'fu4', text: 'Go for long drives' },
            { id: 'fu5', text: 'Learn basic cooking' },
            { id: 'fu6', text: 'Create art' },
        ]
    }
];

const generateDynamicCategories = (userData) => {
    if (!userData) return defaultCategories;

    const profile = userData.profile_type || 'student';
    const isHighStress = userData.total_score >= 45;

    return defaultCategories.map(cat => {
        let newLabel = cat.label;
        let newTasks = [...cat.tasks];

        if (cat.id === 'career') {
            newLabel = profile === 'student' ? 'ACADEMICS' : (profile === 'parent' ? 'PARENTING' : 'CAREER');
            if (profile === 'student') {
                newTasks[2].text = 'Research topics outside syllabus';
                newTasks[4].text = 'Find an online course or webinar';
            }
        }
        
        if (cat.id === 'health') {
            if (isHighStress) {
                newTasks[0].text = 'Take a slow, mindful 15-min walk';
                newTasks[1].text = 'Do gentle stretching for 10 min';
            }
        }
        
        if (cat.id === 'family') {
            if (profile === 'professional') {
                newTasks[1].text = 'Call a family member';
            }
        }

        return { ...cat, label: newLabel, tasks: newTasks };
    });
};

const ConfettiParticle = ({ delay }) => {
    const randomX = (Math.random() - 0.5) * window.innerWidth;
    const randomY = -window.innerHeight - Math.random() * 500;
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-yellow-400', 'bg-green-500'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 10 + 5;

    return (
        <motion.div
            initial={{ x: 0, y: window.innerHeight / 2, opacity: 1, scale: 0 }}
            animate={{ 
                x: randomX, 
                y: randomY, 
                opacity: 0, 
                scale: Math.random() * 2 + 1,
                rotate: Math.random() * 360
            }}
            transition={{ duration: 2.5, ease: "easeOut", delay }}
            className={`absolute ${color} rounded-sm`}
            style={{ width: size, height: size }}
        />
    );
};

const Toast = ({ message, onClose }) => (
    <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white text-gray-900 px-6 py-3 rounded-full shadow-2xl font-semibold text-sm z-50 flex items-center gap-3"
    >
        <span className="text-green-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </span>
        {message}
    </motion.div>
);

const GoalChallengeTab = ({ userData }) => {
    const [categories, setCategories] = useState(() => generateDynamicCategories(userData));
    const [completedTasks, setCompletedTasks] = useState(new Set());
    const [showCelebration, setShowCelebration] = useState(false);
    const [activeTab, setActiveTab] = useState('tasks');
    const [toastMessage, setToastMessage] = useState(null);

    const [celebrated, setCelebrated] = useState(false);

    const toggleTask = (taskId, taskText) => {
        setCompletedTasks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(taskId)) {
                newSet.delete(taskId);
            } else {
                newSet.add(taskId);
                showToast(`Awesome! You completed: "${taskText}"`);
            }
            return newSet;
        });
    };

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const categoryCompletions = categories.map(cat => {
        const count = cat.tasks.filter(t => completedTasks.has(t.id)).length;
        return { id: cat.id, count, meetsGoal: count >= 2 };
    });

    const categoriesMeetingGoal = categoryCompletions.filter(c => c.meetsGoal).length;

    useEffect(() => {
        if (categoriesMeetingGoal >= 6 && !celebrated) {
            setShowCelebration(true);
            setCelebrated(true);
            setTimeout(() => setShowCelebration(false), 3000); // hide after 3s
        } else if (categoriesMeetingGoal < 6 && celebrated) {
            setCelebrated(false);
        }
    }, [categoriesMeetingGoal, celebrated]);

    return (
        <div className="space-y-8 animate-fade-in-up relative">
            <AnimatePresence>
                {toastMessage && <Toast message={toastMessage} />}
            </AnimatePresence>

            <AnimatePresence>
                {showCelebration && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none overflow-hidden"
                    >
                        {Array.from({ length: 80 }).map((_, i) => (
                            <ConfettiParticle key={i} delay={Math.random() * 0.2} />
                        ))}
                        <motion.div 
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.5, opacity: 0 }}
                            transition={{ type: "spring", bounce: 0.5 }}
                            className="text-center bg-white/10 p-12 rounded-[3rem] backdrop-blur-xl border border-white/20 shadow-2xl"
                        >
                            <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 drop-shadow-lg mb-4">
                                YOU SLAYED IT!
                            </h1>
                            <p className="text-2xl text-white font-medium drop-shadow-md">All categories complete. Amazing job!</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex justify-center mb-6">
                <div className="bg-white/10 p-1 rounded-full flex gap-2 backdrop-blur-md border border-white/20 shadow-lg">
                    <button
                        onClick={() => setActiveTab('tasks')}
                        className={`px-6 py-2 rounded-full font-medium transition-all ${activeTab === 'tasks' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                    >
                        Weekly Tasks
                    </button>
                    <button
                        onClick={() => setActiveTab('exercises')}
                        className={`px-6 py-2 rounded-full font-medium transition-all ${activeTab === 'exercises' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                    >
                        Interactive Exercises
                    </button>
                </div>
            </div>

            {activeTab === 'tasks' ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    <motion.section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl text-center">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 pointer-events-none" />
                        <h1 className="relative z-10 text-3xl md:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 drop-shadow-sm mb-2" style={{ fontFamily: '"Comic Sans MS", "Bubblegum Sans", sans-serif' }}>
                            THE GOAL CHALLENGE!
                        </h1>
                        <p className="relative z-10 text-base md:text-lg text-blue-200 font-medium">
                            Select any 2 goals from each category to follow and make your entire week exciting.
                        </p>
                    </motion.section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {categories.map((category) => (
                            <div key={category.id} className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden shadow-lg backdrop-blur-xl flex flex-col">
                                <div className={`p-3 bg-gradient-to-r ${category.color} bg-opacity-20 backdrop-blur-sm border-b border-white/10`}>
                                    <h3 className="text-lg font-bold text-white tracking-widest text-center drop-shadow-md">
                                        {category.label}
                                    </h3>
                                </div>
                                <div className="p-4 flex-1">
                                    <ul className="space-y-2">
                                        {category.tasks.map((task) => {
                                            const isChecked = completedTasks.has(task.id);
                                            return (
                                                <li key={task.id} className="flex items-start gap-3 group/task">
                                                    <button
                                                        onClick={() => toggleTask(task.id, task.text)}
                                                        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-all ${isChecked ? 'bg-blue-500 border-blue-400' : 'bg-black/40 border-white/30 group-hover/task:border-blue-400'}`}
                                                    >
                                                        {isChecked && (
                                                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                    <span onClick={() => toggleTask(task.id, task.text)} className={`text-sm cursor-pointer transition-colors leading-tight ${isChecked ? 'text-gray-500 line-through' : 'text-gray-200 hover:text-white'}`}>
                                                        {task.text}
                                                    </span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className={`rounded-[1.5rem] border p-4 text-center shadow-lg backdrop-blur-xl transition-all duration-500 ${categoriesMeetingGoal >= 6 ? 'border-purple-500/50 bg-purple-500/20 transform scale-105' : 'border-white/10 bg-white/5 grayscale opacity-60'}`}>
                            <p className="text-xs font-medium text-gray-300 mb-1">6 categories complete</p>
                            <p className="text-lg font-bold text-white tracking-wider">You Slayed It!</p>
                        </div>
                        
                        <div className={`rounded-[1.5rem] border p-4 text-center shadow-lg backdrop-blur-xl transition-all duration-500 ${categoriesMeetingGoal >= 4 ? 'border-blue-500/50 bg-blue-500/20 transform scale-105' : 'border-white/10 bg-white/5 grayscale opacity-60'}`}>
                            <p className="text-xs font-medium text-gray-300 mb-1">4 categories complete</p>
                            <p className="text-lg font-bold text-white tracking-wider">You Rock!</p>
                        </div>

                        <div className={`rounded-[1.5rem] border p-4 text-center shadow-lg backdrop-blur-xl transition-all duration-500 ${categoriesMeetingGoal >= 2 ? 'border-emerald-500/50 bg-emerald-500/20 transform scale-105' : 'border-white/10 bg-white/5 grayscale opacity-60'}`}>
                            <p className="text-xs font-medium text-gray-300 mb-1">2 categories complete</p>
                            <p className="text-lg font-bold text-white tracking-wider">On Track</p>
                        </div>
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <BubblePopGame />
                </motion.div>
            )}
        </div>
    );
};

export default GoalChallengeTab;
