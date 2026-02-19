import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const ArticlesTab = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://127.0.0.1:5000/api/articles')
            .then(res => res.json())
            .then(data => {
                setArticles(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching articles:", err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="text-white text-center mt-10">Loading curated articles...</div>;

    return (
        <div className="space-y-6 p-4">
            {articles.map((article, index) => (
                <motion.a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    key={article.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="flex flex-col md:flex-row bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg border border-white/20 hover:bg-white/15 transition-all group"
                >
                    <div className="md:w-1/3 h-48 md:h-auto overflow-hidden">
                        <img
                            src={article.image}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    </div>
                    <div className="p-6 md:w-2/3 flex flex-col justify-center">
                        <div className="flex items-center space-x-2 mb-2">
                            <span className="text-xs uppercase tracking-wider text-blue-300 font-bold">{article.source}</span>
                            <div className="h-1 w-1 rounded-full bg-white/40"></div>
                            <span className="text-xs text-white/60">Read Now</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-200 transition-colors">{article.title}</h3>
                        <p className="text-white/80 line-clamp-2">{article.summary}</p>
                    </div>
                </motion.a>
            ))}
        </div>
    );
};

export default ArticlesTab;
