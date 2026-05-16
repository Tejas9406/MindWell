import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL, authenticatedFetch } from '../lib/api';
import TypingEffect from './TypingEffect';

const CBTDiaryTab = ({ userEmail }) => {
    const [step, setStep] = useState(1);
    const [situation, setSituation] = useState('');
    const [thought, setThought] = useState('');
    const [emotion, setEmotion] = useState('');
    const [intensity, setIntensity] = useState(50);
    const [aiReframe, setAiReframe] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const prompt = `Act as an expert Cognitive Behavioral Therapist (CBT). The user had this negative thought: "${thought}", in this situation: "${situation}". They are feeling ${emotion} with an intensity of ${intensity}/100. 
            Identify the cognitive distortion (e.g., catastrophizing, black-and-white thinking) and provide a healthier, more balanced reframed thought. Keep it extremely empathetic, practical, and under 4 sentences.`;

            const res = await authenticatedFetch(`${API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: prompt }),
            });

            const data = await res.json();
            if (res.ok) {
                setAiReframe(data.response);
                setStep(4);
            } else {
                setAiReframe("I'm having trouble connecting to my therapy engine right now. But remember, a thought is just a thought, it is not a fact. Try to breathe and let it pass.");
                setStep(4);
            }
        } catch (error) {
            console.error(error);
            setAiReframe("Network error. Please try again later.");
            setStep(4);
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setStep(1);
        setSituation('');
        setThought('');
        setEmotion('');
        setIntensity(50);
        setAiReframe('');
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in-up">
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
                
                <h2 className="text-3xl font-bold text-white mb-2 relative z-10">CBT Thought Diary</h2>
                <p className="text-gray-400 mb-8 relative z-10">Cognitive Behavioral Therapy (CBT) helps you identify and challenge negative thoughts to improve your mood.</p>

                <div className="relative z-10 bg-black/20 p-6 rounded-2xl border border-white/5 mb-8">
                    <div className="flex justify-between items-center mb-6">
                        {[1, 2, 3, 4].map((s) => (
                            <div key={s} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= s ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-white/10 text-gray-500'}`}>
                                    {s}
                                </div>
                                {s < 4 && (
                                    <div className={`w-12 md:w-24 h-1 mx-2 rounded ${step > s ? 'bg-purple-500/50' : 'bg-white/10'}`} />
                                )}
                            </div>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                <h3 className="text-xl font-semibold text-white">1. The Situation</h3>
                                <p className="text-sm text-gray-400">What triggered the negative thought? Where were you, or what were you doing?</p>
                                <textarea 
                                    value={situation}
                                    onChange={(e) => setSituation(e.target.value)}
                                    placeholder="e.g., I was looking at my upcoming project deadline..."
                                    className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <button onClick={() => setStep(2)} disabled={!situation.trim()} className="mt-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-2 rounded-xl transition-colors float-right">Next</button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                                <h3 className="text-xl font-semibold text-white">2. The Automatic Thought</h3>
                                <p className="text-sm text-gray-400">What exactly went through your mind? What was the negative thought?</p>
                                <textarea 
                                    value={thought}
                                    onChange={(e) => setThought(e.target.value)}
                                    placeholder="e.g., I'm going to fail completely, and everyone will think I'm a fraud."
                                    className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <div className="flex justify-between mt-4">
                                    <button onClick={() => setStep(1)} className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl transition-colors">Back</button>
                                    <button onClick={() => setStep(3)} disabled={!thought.trim()} className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-2 rounded-xl transition-colors">Next</button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                <h3 className="text-xl font-semibold text-white">3. Emotion & Intensity</h3>
                                <div>
                                    <p className="text-sm text-gray-400 mb-2">How did this make you feel? (e.g., Anxious, Sad, Angry, Overwhelmed)</p>
                                    <input 
                                        type="text"
                                        value={emotion}
                                        onChange={(e) => setEmotion(e.target.value)}
                                        placeholder="e.g., Anxious"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 mb-6"
                                    />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400 mb-2">How intense is this emotion? ({intensity}/100)</p>
                                    <input 
                                        type="range"
                                        min="1" max="100"
                                        value={intensity}
                                        onChange={(e) => setIntensity(e.target.value)}
                                        className="w-full accent-purple-500"
                                    />
                                </div>
                                <div className="flex justify-between mt-4">
                                    <button onClick={() => setStep(2)} className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl transition-colors">Back</button>
                                    <button onClick={handleAnalyze} disabled={!emotion.trim() || loading} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 text-white px-6 py-2 rounded-xl transition-all shadow-lg shadow-purple-500/20">
                                        {loading ? 'Reframing...' : 'Reframe Thought with AI'}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 4 && (
                            <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                                <div className="bg-purple-900/20 border border-purple-500/30 rounded-2xl p-6">
                                    <h3 className="text-xl font-bold text-purple-300 mb-4">Therapist's Reframe</h3>
                                    <p className="text-white text-lg leading-relaxed whitespace-pre-wrap"><TypingEffect text={aiReframe} speed={30} /></p>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Your Thought</p>
                                        <p className="text-gray-300 italic">"{thought}"</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Your Emotion</p>
                                        <p className="text-gray-300">{emotion} ({intensity}/100)</p>
                                    </div>
                                </div>

                                <button onClick={reset} className="w-full bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl transition-colors font-semibold mt-4">
                                    Start New Diary Entry
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default CBTDiaryTab;
