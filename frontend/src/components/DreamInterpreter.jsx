import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../lib/api';

const DreamInterpreter = ({ userEmail }) => {
    const [dreamText, setDreamText] = useState('');
    const [interpretation, setInterpretation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAnalyze = async () => {
        if (!dreamText.trim()) return;
        setLoading(true);
        setError('');
        
        try {
            // We'll reuse the chat API for this hackathon feature
            const prompt = `Act as an expert Jungian psychoanalyst. Interpret the following dream and explain what underlying real-life stressors or subconscious thoughts might be causing it. Keep it empathetic and insightful. Dream: "${dreamText}"`;
            
            const res = await fetch(`${API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: prompt
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to interpret dream');
            
            setInterpretation(data.response);
        } catch (err) {
            setError('Unable to reach the dream analysis engine at the moment.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur-xl"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none" />
                <div className="relative z-10">
                    <span className="inline-flex rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-indigo-300 mb-4">
                        Subconscious Analysis
                    </span>
                    <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
                        AI Dream Interpreter
                    </h2>
                    <p className="text-gray-300 text-lg max-w-2xl">
                        Dreams are often our brain's way of processing daytime stress. Describe a recent weird or stressful dream, and our AI will act as your personal psychoanalyst to help you uncover what's really on your mind.
                    </p>
                </div>
            </motion.section>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 backdrop-blur-xl shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-4">Your Dream</h3>
                    <textarea
                        value={dreamText}
                        onChange={(e) => setDreamText(e.target.value)}
                        placeholder="I was running through an endless hallway, and the doors kept disappearing..."
                        className="w-full h-48 bg-black/20 border border-white/10 rounded-2xl p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all"
                    />
                    <button
                        onClick={handleAnalyze}
                        disabled={loading || !dreamText.trim()}
                        className="w-full mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                    >
                        {loading ? 'Analyzing Subconscious...' : 'Interpret Dream'}
                    </button>
                    {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}
                </div>

                <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 backdrop-blur-xl shadow-xl flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-4">The Interpretation</h3>
                    <div className="flex-1 bg-black/20 border border-white/10 rounded-2xl p-6 overflow-y-auto min-h-[200px]">
                        {loading ? (
                            <div className="flex items-center justify-center h-full text-indigo-300 animate-pulse">
                                Connecting to the dream realm...
                            </div>
                        ) : interpretation ? (
                            <div className="prose prose-invert max-w-none text-gray-200">
                                <p className="whitespace-pre-wrap leading-relaxed">{interpretation}</p>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500 italic text-center">
                                Your interpretation will appear here. Let's find out what your subconscious is trying to tell you.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DreamInterpreter;
