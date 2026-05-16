import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BubblePopGame = () => {
    const [bubbles, setBubbles] = useState([]);
    const [score, setScore] = useState(0);

    useEffect(() => {
        // Create initial bubbles
        generateBubbles(12);
        
        const interval = setInterval(() => {
            setBubbles(prev => {
                if (prev.length < 15) {
                    return [...prev, createBubble()];
                }
                return prev;
            });
        }, 2000);
        
        return () => clearInterval(interval);
    }, []);

    const createBubble = () => {
        return {
            id: Math.random().toString(36).substring(7),
            x: Math.random() * 80 + 10, // 10% to 90%
            y: Math.random() * 80 + 10,
            size: Math.random() * 40 + 40, // 40px to 80px
            color: ['bg-blue-400', 'bg-purple-400', 'bg-pink-400', 'bg-emerald-400'][Math.floor(Math.random() * 4)]
        };
    };

    const generateBubbles = (count) => {
        const newBubbles = [];
        for (let i = 0; i < count; i++) {
            newBubbles.push(createBubble());
        }
        setBubbles(newBubbles);
    };

    const popBubble = (id) => {
        setBubbles(prev => prev.filter(b => b.id !== id));
        setScore(s => s + 1);
        
        // play a small pop sound if possible, or just visual
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 shadow-xl backdrop-blur-xl relative overflow-hidden flex flex-col items-center">
            <h2 className="text-3xl font-bold text-white mb-2 text-center">Mindful Bubble Pop</h2>
            <p className="text-gray-400 mb-6 text-center max-w-lg">
                Sometimes the best way to de-stress is a simple, repetitive action. Pop the bubbles and watch your stress drift away.
            </p>
            
            <div className="text-xl font-semibold text-purple-300 mb-4">
                Bubbles Popped: {score}
            </div>
            
            <div className="relative w-full h-[400px] bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
                <AnimatePresence>
                    {bubbles.map(bubble => (
                        <motion.div
                            key={bubble.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ 
                                scale: 1, 
                                opacity: 0.8,
                                y: [0, -20, 0, 20, 0],
                                x: [0, 10, 0, -10, 0]
                            }}
                            exit={{ scale: 1.5, opacity: 0 }}
                            transition={{ 
                                scale: { duration: 0.3 },
                                opacity: { duration: 0.3 },
                                y: { repeat: Infinity, duration: 4 + Math.random() * 2 },
                                x: { repeat: Infinity, duration: 3 + Math.random() * 2 }
                            }}
                            className={`absolute rounded-full cursor-pointer shadow-[inset_0_-10px_20px_rgba(0,0,0,0.2),0_0_15px_rgba(255,255,255,0.2)] hover:brightness-110 ${bubble.color}`}
                            style={{
                                left: `${bubble.x}%`,
                                top: `${bubble.y}%`,
                                width: bubble.size,
                                height: bubble.size,
                                backdropFilter: 'blur(4px)'
                            }}
                            onClick={() => popBubble(bubble.id)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <div className="absolute top-[15%] left-[20%] w-[30%] h-[30%] bg-white/40 rounded-full rotate-45 blur-[2px]"></div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default BubblePopGame;
