import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MusicTab = ({ stressLevel }) => {
    const [musicList, setMusicList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Audio Ref
    const audioRef = useRef(null);

    useEffect(() => {
        fetchMusic(stressLevel ? { stressLevel } : {});
    }, [stressLevel]);

    const fetchMusic = async (params) => {
        setLoading(true);
        try {
            const query = new URLSearchParams(params).toString();
            // Assuming the backend is running on port 5000
            const res = await fetch(`http://127.0.0.1:5000/api/music?${query}`);
            if (!res.ok) throw new Error('Failed to fetch music');
            const data = await res.json();
            setMusicList(data);
        } catch (err) {
            console.error("Error fetching music:", err);
            // Fallback empty list or error state could be set here
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        fetchMusic({ search: searchQuery });
    };

    const playTrack = (track) => {
        if (currentTrack?.id === track.id) {
            togglePlay();
        } else {
            setCurrentTrack(track);
            setIsPlaying(true);
            setProgress(0);
        }
    };

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const current = audioRef.current.currentTime;
            const dur = audioRef.current.duration;
            setCurrentTime(current);
            setDuration(dur);
            if (dur > 0) {
                setProgress((current / dur) * 100);
            }
        }
    };

    const handleSeek = (e) => {
        const newProgress = parseFloat(e.target.value);
        if (audioRef.current && duration) {
            const newTime = (newProgress / 100) * duration;
            audioRef.current.currentTime = newTime;
            setProgress(newProgress);
        }
    };

    // Effect to handle audio source changes and autoplay
    useEffect(() => {
        if (currentTrack && audioRef.current) {
            audioRef.current.src = currentTrack.url;
            audioRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(err => {
                    console.error("Playback failed (likely autoplay policy):", err);
                    setIsPlaying(false);
                });
        }
    }, [currentTrack]);

    const formatTime = (time) => {
        if (!time || isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <div className="relative min-h-[60vh] flex flex-col pb-10">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mb-10 relative flex gap-4 max-w-2xl mx-auto w-full">
                <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-purple-300 group-focus-within:text-purple-100 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-12 pr-4 py-4 border-2 border-white/5 rounded-full leading-5 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 focus:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all duration-300 backdrop-blur-xl"
                        placeholder="Search for vibes (e.g., cosmos, rain, zen)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button
                    type="submit"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-8 py-4 rounded-full font-bold tracking-wide transition-all shadow-lg hover:shadow-purple-500/40 transform hover:-translate-y-0.5 active:translate-y-0"
                >
                    Search
                </button>
            </form>

            {/* Header */}
            <h3 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-blue-200 mb-12">
                {searchQuery ? `Results for "${searchQuery}"` : "Soundscapes Recommended for You"}
            </h3>

            {loading ? (
                <div className="flex justify-center items-center h-40">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500/30 border-b-blue-500 rounded-full animate-spin-reverse"></div>
                    </div>
                </div>
            ) : musicList.length === 0 ? (
                <div className="text-center text-gray-400 mt-10">No sounds found. Try searching for "rain" or "ocean".</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-16 gap-x-8 px-4">
                    {musicList.map((item) => {
                        const isCurrent = currentTrack?.id === item.id;

                        return (
                            <div key={item.id} className="flex flex-col items-center group relative">
                                {/* 3D Circle Card with Surrounding Glow */}
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => playTrack(item)}
                                    animate={isCurrent && isPlaying ? {
                                        boxShadow: [
                                            // Sky Blue / Cyan Phase
                                            "0 0 20px 5px rgba(0, 255, 255, 1), 0 0 60px 20px rgba(0, 255, 255, 0.8)",
                                            "0 0 30px 10px rgba(0, 255, 255, 1), 0 0 90px 30px rgba(0, 255, 255, 0.9)", // Pulse

                                            // Green Phase
                                            "0 0 20px 5px rgba(0, 255, 0, 1), 0 0 60px 20px rgba(0, 255, 0, 0.8)",
                                            "0 0 30px 10px rgba(0, 255, 0, 1), 0 0 90px 30px rgba(0, 255, 0, 0.9)", // Pulse

                                            // Pink / Magenta Phase
                                            "0 0 20px 5px rgba(255, 0, 255, 1), 0 0 60px 20px rgba(255, 0, 255, 0.8)",
                                            "0 0 30px 10px rgba(255, 0, 255, 1), 0 0 90px 30px rgba(255, 0, 255, 0.9)", // Pulse

                                            // Loop back
                                            "0 0 20px 5px rgba(0, 255, 255, 1), 0 0 60px 20px rgba(0, 255, 255, 0.8)"
                                        ]
                                    } : {
                                        boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)"
                                    }}
                                    transition={isCurrent && isPlaying ? {
                                        duration: 9,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    } : { duration: 0.3 }}
                                    className={`relative w-40 h-40 rounded-full cursor-pointer z-10 transition-all duration-500 overflow-hidden ring-4 ${isCurrent ? 'ring-white/50' : 'ring-white/10 hover:ring-white/30'}`}
                                >
                                    {/* Laughing Buddha Image */}
                                    <div className="absolute inset-0 bg-gray-900">
                                        <img
                                            src="/music-placeholder.png"
                                            alt="Laughing Buddha"
                                            className={`w-full h-full object-cover transition-transform duration-[4s] ease-linear ${isCurrent && isPlaying ? 'animate-[spin_10s_linear_infinite]' : ''}`}
                                        />
                                        {/* Overlay Gradient for depth */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>

                                        {/* Play Icon Overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                                            {isCurrent && isPlaying ? (
                                                <svg className="w-12 h-12 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                                            ) : (
                                                <svg className="w-12 h-12 text-white drop-shadow-lg pl-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Title & Glass Gradient Seek Bar */}
                                <div className="mt-6 w-full max-w-[180px] text-center z-10">
                                    <h4 className={`text-base font-bold truncate transition-colors ${isCurrent ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-green-300' : 'text-gray-300 group-hover:text-white'}`}>{item.title}</h4>

                                    {isCurrent ? (
                                        <div className="mt-3 flex flex-col items-center gap-1 w-full relative">
                                            <div className="flex justify-between w-full text-[10px] text-gray-400 font-mono px-1">
                                                <span>{formatTime(currentTime)}</span>
                                                <span>{formatTime(duration)}</span>
                                            </div>
                                            {/* Custom Glass Gradient Slider */}
                                            <div className="relative w-full h-2 rounded-full overflow-hidden bg-white/10 backdrop-blur-sm border border-white/5">
                                                <div
                                                    className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-green-400 via-teal-400 to-sky-500 shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                                                    style={{ width: `${progress}%` }}
                                                />
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={progress}
                                                    onChange={handleSeek}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="mt-1 text-xs text-gray-500 capitalize">{item.category}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Hidden Audio Element */}
            <audio
                ref={audioRef}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
            />
        </div>
    );
};

export default MusicTab;
