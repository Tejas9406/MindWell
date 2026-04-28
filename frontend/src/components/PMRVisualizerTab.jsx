import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const pmrSteps = [
    { title: "Preparation", instruction: "Find a comfortable position. Close your eyes. Take a deep breath in... and out.", duration: 5000 },
    { title: "Hands & Arms", instruction: "Clench both fists tightly. Feel the tension in your hands and forearms. Hold it...", duration: 5000 },
    { title: "Release", instruction: "Let go completely. Let your hands and arms become totally loose and relaxed. Notice the difference.", duration: 5000 },
    { title: "Shoulders", instruction: "Pull your shoulders up to your ears. Hold them tight...", duration: 5000 },
    { title: "Release", instruction: "Drop your shoulders. Let them sink down completely. Feel the relaxation.", duration: 5000 },
    { title: "Face", instruction: "Squeeze your eyes shut and scrunch up your face. Hold the tension...", duration: 5000 },
    { title: "Release", instruction: "Relax your entire face. Let your jaw drop slightly.", duration: 5000 },
    { title: "Legs & Feet", instruction: "Point your toes downward, tensing your calves and thighs. Hold...", duration: 5000 },
    { title: "Release", instruction: "Release your legs. Let them become heavy and relaxed.", duration: 5000 },
    { title: "Whole Body", instruction: "Take one final deep breath. Enjoy the feeling of complete relaxation.", duration: 5000 },
];

const PMRVisualizerTab = () => {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let interval;
        if (isActive && currentStep < pmrSteps.length) {
            const stepDuration = pmrSteps[currentStep].duration;
            const startTime = Date.now();

            interval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const newProgress = Math.min((elapsed / stepDuration) * 100, 100);
                setProgress(newProgress);

                if (elapsed >= stepDuration) {
                    if (currentStep < pmrSteps.length - 1) {
                        setCurrentStep(prev => prev + 1);
                        setProgress(0);
                    } else {
                        setIsActive(false);
                    }
                }
            }, 50);
        } else {
            setProgress(0);
        }

        return () => clearInterval(interval);
    }, [isActive, currentStep]);

    const handleStart = () => {
        setCurrentStep(0);
        setIsActive(true);
    };

    const handleStop = () => {
        setIsActive(false);
        setCurrentStep(0);
    };

    const isTenseStep = pmrSteps[currentStep]?.title !== "Release" && pmrSteps[currentStep]?.title !== "Preparation" && pmrSteps[currentStep]?.title !== "Whole Body";

    return (
        <div className="max-w-3xl mx-auto text-center space-y-8 animate-fade-in-up flex flex-col items-center justify-center min-h-[60vh]">
            {!isActive && currentStep === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 shadow-2xl backdrop-blur-xl w-full">
                    <h2 className="text-4xl font-bold text-white mb-4">Progressive Muscle Relaxation</h2>
                    <p className="text-gray-400 text-lg mb-8 max-w-lg mx-auto">
                        PMR is a clinical technique that involves tensing and releasing muscle groups to drastically lower physical anxiety and stress.
                    </p>
                    <button 
                        onClick={handleStart}
                        className="bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600 text-white text-xl font-bold px-10 py-4 rounded-full shadow-[0_0_20px_rgba(52,211,153,0.4)] transition-all transform hover:scale-105"
                    >
                        Start Session
                    </button>
                </div>
            ) : (
                <div className="w-full flex flex-col items-center relative">
                    <button 
                        onClick={handleStop}
                        className="absolute top-0 right-0 text-gray-400 hover:text-white bg-white/5 p-2 rounded-full transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="h-8 mb-4">
                        <AnimatePresence mode="wait">
                            <motion.h3 
                                key={currentStep}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={`text-2xl font-bold uppercase tracking-widest ${isTenseStep ? 'text-red-400' : 'text-emerald-400'}`}
                            >
                                {pmrSteps[currentStep]?.title || "Complete"}
                            </motion.h3>
                        </AnimatePresence>
                    </div>

                    <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center my-8">
                        <motion.div 
                            animate={{ 
                                scale: isTenseStep ? [1, 0.8, 0.85, 0.75] : [0.75, 1.2, 1],
                                borderRadius: isTenseStep ? ["50%", "30%", "40%", "25%"] : "50%",
                                backgroundColor: isTenseStep ? "rgba(248, 113, 113, 0.8)" : "rgba(52, 211, 153, 0.4)",
                                boxShadow: isTenseStep ? "0 0 40px rgba(248, 113, 113, 0.6)" : "0 0 60px rgba(52, 211, 153, 0.8)"
                            }}
                            transition={{ duration: pmrSteps[currentStep]?.duration / 1000 || 1, ease: "easeInOut" }}
                            className="absolute inset-0"
                        />
                        <div className="absolute inset-4 bg-black/40 rounded-full backdrop-blur-sm flex items-center justify-center border border-white/10 z-10 p-6 text-center">
                            <AnimatePresence mode="wait">
                                <motion.p 
                                    key={currentStep}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-white text-lg font-medium"
                                >
                                    {pmrSteps[currentStep]?.instruction || "Session Complete."}
                                </motion.p>
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="w-full max-w-md h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                        <motion.div 
                            className={`h-full ${isTenseStep ? 'bg-red-500' : 'bg-emerald-500'}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    
                    <div className="text-gray-500 text-sm">
                        Step {Math.min(currentStep + 1, pmrSteps.length)} of {pmrSteps.length}
                    </div>

                    {!isActive && currentStep >= pmrSteps.length && (
                        <button 
                            onClick={handleStart}
                            className="mt-8 bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl transition-colors"
                        >
                            Restart Session
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default PMRVisualizerTab;
