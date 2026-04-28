import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../lib/api';

const ArticlesTab = ({ email, profileType }) => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('read'); // 'read' or 'video'

    const getVideos = () => {
        const profile = profileType ? profileType.toLowerCase() : 'student';
        const isHighStress = articles.length > 0 && articles[0].title.includes('High');

        const generalVideos = [
            { id: "v1", title: "How to make stress your friend", url: "https://www.youtube.com/embed/RcGyVTAoXEU", source: "TED" },
            { id: "v2", title: "10-Minute Guided Meditation", url: "https://www.youtube.com/embed/inpok4MKVLM", source: "Mindfulness" }
        ];

        const studentVideos = [
            { id: "v3", title: "How to study efficiently", url: "https://www.youtube.com/embed/fC1yF6f1v9Y", source: "Academics" },
            ...generalVideos
        ];

        const proVideos = [
            { id: "v4", title: "Recognizing and Preventing Burnout", url: "https://www.youtube.com/embed/c2M8bU4yQGA", source: "Career" },
            ...generalVideos
        ];

        return profile === 'student' ? studentVideos : proVideos;
    };

    useEffect(() => {
        const params = new URLSearchParams();
        if (email) {
            params.set('email', email);
        }
        if (profileType) {
            params.set('profileType', profileType);
        }

        fetch(`${API_BASE_URL}/api/articles?${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                setArticles(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching articles:", err);
                setLoading(false);
            });
    }, [email, profileType]);

    if (loading) return <div className="text-white text-center mt-10 font-serif">Curating your personalized stories...</div>;

    return (
        <div className="space-y-6 p-4">
            <div className="flex justify-center mb-8">
                <div className="bg-white/10 p-1 rounded-full flex gap-2 backdrop-blur-md border border-white/20 shadow-lg">
                    <button
                        onClick={() => setViewMode('read')}
                        className={`px-6 py-2 rounded-full font-medium transition-all ${viewMode === 'read' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                        style={{ fontFamily: '"Merriweather", "Georgia", serif' }}
                    >
                        Read Story
                    </button>
                    <button
                        onClick={() => setViewMode('video')}
                        className={`px-6 py-2 rounded-full font-medium transition-all ${viewMode === 'video' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                        style={{ fontFamily: '"Inter", sans-serif' }}
                    >
                        Watch Video
                    </button>
                </div>
            </div>

            {viewMode === 'read' ? (
                <div className="grid gap-8">
                    {articles.map((article, index) => (
                        <motion.article
                            key={article.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.6 }}
                            className="bg-white/5 backdrop-blur-lg rounded-[2rem] p-8 md:p-10 border border-white/10 shadow-2xl hover:bg-white/10 transition-colors"
                        >
                            <div className="mb-4 flex items-center gap-3">
                                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-bold uppercase tracking-widest">
                                    {article.source}
                                </span>
                                <span className="text-gray-400 text-sm">5 min read</span>
                            </div>
                            <h2 
                                className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight drop-shadow-sm" 
                                style={{ fontFamily: '"Merriweather", "Playfair Display", serif' }}
                            >
                                {article.title}
                            </h2>
                            <p 
                                className="text-gray-300 text-lg md:text-xl leading-relaxed font-light mb-8"
                                style={{ fontFamily: '"Georgia", serif', lineHeight: '1.8' }}
                            >
                                {article.summary}
                            </p>
                            <a
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                                style={{ fontFamily: '"Inter", sans-serif' }}
                            >
                                Continue Reading 
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </a>
                        </motion.article>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {getVideos().map((video, index) => (
                        <motion.div
                            key={video.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            className="bg-white/5 backdrop-blur-lg rounded-[2rem] p-6 border border-white/10 shadow-2xl overflow-hidden"
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-xs font-bold uppercase tracking-widest">
                                    {video.source}
                                </span>
                                <h3 className="text-xl font-bold text-white truncate ml-3">{video.title}</h3>
                            </div>
                            <div className="relative pt-[56.25%] rounded-xl overflow-hidden bg-black/50">
                                <iframe
                                    className="absolute inset-0 w-full h-full border-0"
                                    src={video.url}
                                    title={video.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ArticlesTab;
