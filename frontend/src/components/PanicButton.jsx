import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PanicButton = () => {
    const [isActive, setIsActive] = useState(false);
    const [step, setStep] = useState(0);
    const [breatheMode, setBreatheMode] = useState('in'); // 'in', 'hold', 'out'

    const steps = [
        { title: "Breathe", text: "Let's take a deep breath together. Follow the circle." },
        { title: "5 Things", text: "Look around you. Name 5 things you can see." },
        { title: "4 Things", text: "Name 4 things you can physically feel right now." },
        { title: "3 Things", text: "Name 3 things you can hear right now." },
        { title: "2 Things", text: "Name 2 things you can smell right now." },
        { title: "1 Thing", text: "Name 1 good thing you can taste, or 1 good thing about yourself." },
        { title: "Better?", text: "You did great. You are safe. Close this when you're ready." }
    ];

    useEffect(() => {
        if (!isActive || step !== 0) return;

        const breatheCycle = () => {
            setBreatheMode('in');
            setTimeout(() => {
                setBreatheMode('hold');
                setTimeout(() => {
                    setBreatheMode('out');
                }, 2000);
            }, 4000);
        };

        breatheCycle();
        const interval = setInterval(breatheCycle, 10000); // 4s in, 2s hold, 4s out

        return () => clearInterval(interval);
    }, [isActive, step]);

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(prev => prev + 1);
        } else {
            setIsActive(false);
            setStep(0);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsActive(true)}
                className="fixed bottom-8 left-8 z-50 bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:bg-red-500/40 hover:scale-110 transition-all group backdrop-blur-md flex items-center gap-2"
                title="Panic SOS / Grounding"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="hidden group-hover:inline-block font-bold pr-2 tracking-widest text-sm uppercase">SOS</span>
            </button>

            <AnimatePresence>
                {isActive && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center"
                    >
                        <h2 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500 mb-4 tracking-wider">
                            {steps[step].title}
                        </h2>
                        <p className="text-2xl text-blue-100 max-w-2xl leading-relaxed mb-16 h-20">
                            {steps[step].text}
                        </p>

                        {step === 0 ? (
                            <div className="relative w-64 h-64 flex items-center justify-center mb-16">
                                <motion.div
                                    animate={{
                                        scale: breatheMode === 'in' ? 2 : breatheMode === 'out' ? 1 : 2,
                                        opacity: breatheMode === 'hold' ? 0.8 : 0.4
                                    }}
                                    transition={{
                                        duration: breatheMode === 'hold' ? 2 : 4,
                                        ease: "easeInOut"
                                    }}
                                    className="absolute inset-0 bg-teal-400/30 rounded-full blur-xl"
                                />
                                <motion.div
                                    animate={{
                                        scale: breatheMode === 'in' ? 1.5 : breatheMode === 'out' ? 0.8 : 1.5,
                                    }}
                                    transition={{
                                        duration: breatheMode === 'hold' ? 2 : 4,
                                        ease: "easeInOut"
                                    }}
                                    className="relative z-10 w-32 h-32 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center shadow-2xl shadow-teal-500/50"
                                >
                                    <span className="text-white font-bold text-xl uppercase tracking-widest">
                                        {breatheMode === 'in' ? 'Breathe In' : breatheMode === 'out' ? 'Breathe Out' : 'Hold'}
                                    </span>
                                </motion.div>
                            </div>
                        ) : (
                            <div className="w-64 h-64 flex items-center justify-center mb-16">
                                <div className="text-9xl opacity-20">
                                    {6 - step}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4">
                            {step > 0 && (
                                <button
                                    onClick={() => setStep(prev => prev - 1)}
                                    className="px-8 py-3 rounded-full border border-white/20 text-white hover:bg-white/10 transition-colors"
                                >
                                    Back
                                </button>
                            )}
                            <button
                                onClick={handleNext}
                                className="px-8 py-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-bold transition-colors shadow-lg shadow-blue-500/20"
                            >
                                {step === steps.length - 1 ? 'End Exercise' : 'Continue'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default PanicButton;
