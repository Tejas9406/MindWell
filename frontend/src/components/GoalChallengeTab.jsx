import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const defaultCategories = [
    {
        id: 'personal',
        label: 'PERSONAL',
        color: 'from-blue-500 to-cyan-400',
        tasks: [
            { id: 'p1', text: 'Read at least 1 book' },
            { id: 'p2', text: 'Engage in any hobby of your choice' },
            { id: 'p3', text: 'Watch a documentary film on social issues' },
            { id: 'p4', text: 'Hangout with your friends during the weekend' },
            { id: 'p5', text: 'Go to a spa or salon' },
            { id: 'p6', text: 'Donate your old clothes to needy people' },
        ]
    },
    {
        id: 'inner_peace',
        label: 'INNER PEACE',
        color: 'from-emerald-400 to-teal-400',
        tasks: [
            { id: 'ip1', text: 'Practice meditation' },
            { id: 'ip2', text: 'Stay calm and composed' },
            { id: 'ip3', text: 'Be thankful to your family and close friends' },
            { id: 'ip4', text: 'Focus on the good things in life' },
            { id: 'ip5', text: 'Listen to music' },
            { id: 'ip6', text: 'Listen to the sounds of nature, such as birds chirping' },
        ]
    },
    {
        id: 'health',
        label: 'HEALTH',
        color: 'from-green-400 to-emerald-500',
        tasks: [
            { id: 'h1', text: 'Go for a morning jog or engage in physical workout' },
            { id: 'h2', text: 'Dance to your favourite song' },
            { id: 'h3', text: 'Play your favourite sport' },
            { id: 'h4', text: 'Go trekking' },
            { id: 'h5', text: 'Try gardening' },
            { id: 'h6', text: 'Eat healthy and stay hydrated' },
        ]
    },
    {
        id: 'family',
        label: 'FAMILY',
        color: 'from-orange-400 to-amber-500',
        tasks: [
            { id: 'fa1', text: 'Express gratitude to your parents' },
            { id: 'fa2', text: 'Plan a theme party for your family and relatives' },
            { id: 'fa3', text: 'Have fun with your cousins' },
            { id: 'fa4', text: 'Assist your family with household tasks' },
            { id: 'fa5', text: 'Spend time with your grandparents' },
            { id: 'fa6', text: 'Make reels or click pictures with your pet' },
        ]
    },
    {
        id: 'career',
        label: 'CAREER',
        color: 'from-purple-500 to-indigo-500',
        tasks: [
            { id: 'c1', text: 'Learn a new skill' },
            { id: 'c2', text: 'Watch inspirational vlogs of successful people' },
            { id: 'c3', text: 'Research about courses for your higher education' },
            { id: 'c4', text: 'Attend any academic event in your city or town' },
            { id: 'c5', text: 'Seek out an internship opportunity' },
            { id: 'c6', text: 'Look out for a mentor' },
        ]
    },
    {
        id: 'fun',
        label: 'FUN',
        color: 'from-pink-500 to-rose-400',
        tasks: [
            { id: 'fu1', text: 'Watch a comedy movie' },
            { id: 'fu2', text: 'Dress up like your favourite celebrity/character' },
            { id: 'fu3', text: 'Attend any fun fest going on in your city' },
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
                newTasks[2].text = 'Research about interesting topics outside syllabus';
                newTasks[4].text = 'Find an online course or webinar to attend';
            }
        }
        
        if (cat.id === 'health') {
            if (isHighStress) {
                newTasks[0].text = 'Take a slow, mindful 15-minute walk';
                newTasks[1].text = 'Do gentle stretching for 10 minutes';
            }
        }
        
        if (cat.id === 'family') {
            if (profile === 'professional') {
                newTasks[1].text = 'Call a family member you haven\'t spoken to in a while';
            }
        }

        return { ...cat, label: newLabel, tasks: newTasks };
    });
};

const GoalChallengeTab = ({ userData }) => {
    const [categories, setCategories] = useState(() => generateDynamicCategories(userData));
    const [completedTasks, setCompletedTasks] = useState(new Set());
    const [showCelebration, setShowCelebration] = useState(false);

    const toggleTask = (taskId) => {
        setCompletedTasks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(taskId)) {
                newSet.delete(taskId);
            } else {
                newSet.add(taskId);
            }
            return newSet;
        });
    };

    // Calculate completions per category
    const categoryCompletions = categories.map(cat => {
        const count = cat.tasks.filter(t => completedTasks.has(t.id)).length;
        return { id: cat.id, count, meetsGoal: count >= 2 };
    });

    const categoriesMeetingGoal = categoryCompletions.filter(c => c.meetsGoal).length;

    useEffect(() => {
        if (categoriesMeetingGoal >= 6 && !showCelebration) {
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 5000); // hide after 5s
        }
    }, [categoriesMeetingGoal, showCelebration]);

    return (
        <div className="space-y-8 animate-fade-in-up relative">
            {showCelebration && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md pointer-events-none"
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/40 via-transparent to-pink-600/40 animate-pulse" />
                    <motion.div 
                        initial={{ y: 50 }}
                        animate={{ y: [0, -20, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="text-center"
                    >
                        <div className="text-8xl md:text-9xl mb-6">🎉✨👑</div>
                        <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-500 drop-shadow-[0_0_15px_rgba(236,72,153,0.8)]">
                            YOU SLAYED IT!
                        </h1>
                        <p className="mt-4 text-2xl text-white font-medium drop-shadow-md">All categories complete. You are amazing!</p>
                    </motion.div>
                </motion.div>
            )}

            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur-xl text-center"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 pointer-events-none" />
                <h1 className="relative z-10 text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 drop-shadow-sm mb-4" style={{ fontFamily: '"Comic Sans MS", "Bubblegum Sans", sans-serif' }}>
                    THE GOAL CHALLENGE!
                </h1>
                <p className="relative z-10 text-lg md:text-xl text-blue-200 font-medium">
                    Select any 2 goals from each category to follow and make your entire week exciting.
                </p>
            </motion.section>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 overflow-hidden shadow-xl backdrop-blur-xl">
                <div className="hidden md:grid grid-cols-[200px_1fr] bg-white/10 border-b border-white/10">
                    <div className="p-4 text-center font-bold text-gray-300 tracking-widest uppercase">Category</div>
                    <div className="p-4 text-center font-bold text-gray-300 tracking-widest uppercase border-l border-white/10">Goals For The Week</div>
                </div>

                <div className="flex flex-col">
                    {categories.map((category) => (
                        <div key={category.id} className="grid grid-cols-1 md:grid-cols-[200px_1fr] border-b border-white/5 last:border-b-0 group">
                            <div className={`p-6 flex items-center justify-center bg-gradient-to-br ${category.color} bg-opacity-20 backdrop-blur-sm md:bg-opacity-100 md:bg-transparent relative overflow-hidden transition-all duration-300`}>
                                <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${category.color} group-hover:opacity-40 transition-opacity`} />
                                <h3 className="text-xl font-bold text-white tracking-widest relative z-10 drop-shadow-md">
                                    {category.label}
                                </h3>
                            </div>
                            <div className="p-6 border-l border-white/5 bg-white/5">
                                <ul className="space-y-3">
                                    {category.tasks.map((task) => {
                                        const isChecked = completedTasks.has(task.id);
                                        return (
                                            <li key={task.id} className="flex items-start gap-3 group/task">
                                                <button
                                                    onClick={() => toggleTask(task.id)}
                                                    className={`mt-1 flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isChecked ? 'bg-blue-500 border-blue-400' : 'bg-black/30 border-white/20 group-hover/task:border-blue-400'}`}
                                                >
                                                    {isChecked && (
                                                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </button>
                                                <span onClick={() => toggleTask(task.id)} className={`text-base cursor-pointer transition-colors ${isChecked ? 'text-gray-400 line-through' : 'text-gray-200 hover:text-white'}`}>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`rounded-[2rem] border p-6 text-center shadow-xl backdrop-blur-xl transition-all duration-500 ${categoriesMeetingGoal >= 6 ? 'border-purple-500/50 bg-purple-500/20 transform scale-105' : 'border-white/10 bg-white/5 grayscale opacity-60'}`}>
                    <p className="text-sm font-medium text-gray-300 mb-3">If you have completed 2 activities from all 6 categories,</p>
                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500 drop-shadow-lg mb-2 transform -rotate-2">
                        OMG!
                    </div>
                    <p className="text-xl font-bold text-white tracking-wider">You Slayed It!</p>
                </div>
                
                <div className={`rounded-[2rem] border p-6 text-center shadow-xl backdrop-blur-xl transition-all duration-500 ${categoriesMeetingGoal >= 4 ? 'border-blue-500/50 bg-blue-500/20 transform scale-105' : 'border-white/10 bg-white/5 grayscale opacity-60'}`}>
                    <p className="text-sm font-medium text-gray-300 mb-3">If you have completed 2 activities from 4 categories,</p>
                    <div className="text-5xl mb-2">🤘</div>
                    <p className="text-xl font-bold text-white tracking-wider">You Rock!</p>
                </div>

                <div className={`rounded-[2rem] border p-6 text-center shadow-xl backdrop-blur-xl transition-all duration-500 ${categoriesMeetingGoal >= 2 ? 'border-emerald-500/50 bg-emerald-500/20 transform scale-105' : 'border-white/10 bg-white/5 grayscale opacity-60'}`}>
                    <p className="text-sm font-medium text-gray-300 mb-3">If you have completed 2 activities from 2 categories,</p>
                    <div className="text-5xl mb-2">👍</div>
                    <p className="text-xl font-bold text-white tracking-wider">You're on the right track</p>
                </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600/80 to-blue-800/80 rounded-2xl p-4 text-center border border-blue-400/30 shadow-lg backdrop-blur-md">
                <p className="text-white font-semibold text-lg tracking-wide">
                    You can keep going until you've completed all the tasks on the list.
                </p>
            </div>
        </div>
    );
};

export default GoalChallengeTab;
