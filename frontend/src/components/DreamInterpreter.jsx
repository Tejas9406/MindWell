import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { API_BASE_URL, authenticatedFetch } from '../lib/api';
import TypingEffect from './TypingEffect';

const DreamInterpreter = ({ userEmail }) => {
    const [dreamText, setDreamText] = useState('');
    const [interpretation, setInterpretation] = useState('');
    const [dreamImageUrl, setDreamImageUrl] = useState(null);
    const [loadingText, setLoadingText] = useState(false);
    const [loadingImage, setLoadingImage] = useState(false);
    const [error, setError] = useState('');

    const generateImage = async (prompt) => {
        setLoadingImage(true);
        try {
            const encodedPrompt = encodeURIComponent(prompt);
            const response = await authenticatedFetch(`${API_BASE_URL}/api/dream-image?prompt=${encodedPrompt}`, {
                method: "GET",
            });
            if (!response.ok) throw new Error("Image generation failed");
            const blob = await response.blob();
            setDreamImageUrl(URL.createObjectURL(blob));
        } catch (err) {
            console.error('Image Generation Error:', err);
        } finally {
            setLoadingImage(false);
        }
    };

    const handleAnalyze = async () => {
        if (!dreamText.trim()) return;
        setLoadingText(true);
        setInterpretation('');
        setDreamImageUrl(null);
        setError('');

        // Fire image generation in parallel
        generateImage(dreamText);
        
        try {
            const prompt = `Act as an expert Jungian psychoanalyst. Interpret the following dream and explain what underlying real-life stressors or subconscious thoughts might be causing it. Keep your explanation very simple, easy to understand, and empathetic. Do not use high-level or complicated English words. Dream: "${dreamText}"`;
            
            const res = await authenticatedFetch(`${API_BASE_URL}/api/chat`, {
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
            setLoadingText(false);
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
            setDreamText(prev => prev + (prev ? ' ' : '') + '(Listening...)');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setDreamText(prev => prev.replace('(Listening...)', '').trim() + (prev.replace('(Listening...)', '').trim() ? ' ' : '') + transcript);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            setDreamText(prev => prev.replace('(Listening...)', '').trim());
        };

        recognition.start();
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
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
                <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 backdrop-blur-xl shadow-xl flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-white">Your Dream</h3>
                        <button
                            type="button"
                            onClick={handleVoiceInput}
                            title="Voice Input"
                            className="p-2 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 rounded-full transition-colors flex-shrink-0"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </button>
                    </div>
                    <textarea
                        value={dreamText}
                        onChange={(e) => setDreamText(e.target.value)}
                        placeholder="I was running through an endless hallway, and the doors kept disappearing..."
                        className="w-full h-64 bg-black/20 border border-white/10 rounded-2xl p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all"
                    />
                    <button
                        onClick={handleAnalyze}
                        disabled={loadingText || !dreamText.trim()}
                        className="w-full mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                    >
                        {(loadingText || loadingImage) ? 'Analyzing Subconscious...' : 'Interpret Dream'}
                    </button>
                    {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}
                </div>

                <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 backdrop-blur-xl shadow-xl flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-4">The Interpretation</h3>
                    <div className="flex-1 flex flex-col gap-4">
                        {(loadingImage || dreamImageUrl) && (
                            <div className="w-full h-48 md:h-64 rounded-2xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center relative shadow-inner">
                                {loadingImage ? (
                                    <div className="text-indigo-300 animate-pulse flex flex-col items-center">
                                        <svg className="animate-spin h-8 w-8 mb-3 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span className="text-sm tracking-widest uppercase font-semibold">Visualizing Dream...</span>
                                    </div>
                                ) : (
                                    <img src={dreamImageUrl} alt="Dream Visualization" className="w-full h-full object-cover transition-opacity duration-1000" />
                                )}
                            </div>
                        )}

                        <div className="flex-1 bg-black/20 border border-white/10 rounded-2xl p-6 overflow-y-auto min-h-[16rem]">
                            {loadingText ? (
                                <div className="flex items-center justify-center h-full text-indigo-300 animate-pulse">
                                    Connecting to the dream realm...
                                </div>
                            ) : interpretation ? (
                                <div className="prose prose-invert max-w-none text-gray-200">
                                    <p className="whitespace-pre-wrap leading-relaxed"><TypingEffect text={interpretation} /></p>
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
        </div>
    );
};

export default DreamInterpreter;
