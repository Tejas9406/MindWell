import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

const milestoneThresholds = [2, 4, 6];

const fallbackMilestones = [
    { key: 'starter', title: 'On The Right Track', description: 'Finish both tasks in any 2 categories.' },
    { key: 'builder', title: 'You Rock', description: 'Finish both tasks in any 4 categories.' },
    { key: 'legend', title: 'You Slayed It', description: 'Finish both tasks in all 6 categories.' },
];

const ChallengeBoard = ({
    weeklyChallenges = [],
    challengeMilestones = [],
    onToggleTask,
    savingTaskId = null,
}) => {
    const [activeCategory, setActiveCategory] = useState('all');

    const totalTaskCount = useMemo(() => {
        return weeklyChallenges.reduce((total, category) => total + (category.tasks || []).length, 0);
    }, [weeklyChallenges]);

    const completedTaskCount = useMemo(() => {
        return weeklyChallenges.reduce((total, category) => {
            return total + (category.tasks || []).filter((task) => task.completed).length;
        }, 0);
    }, [weeklyChallenges]);

    const completedCategories = useMemo(() => {
        return weeklyChallenges.filter((category) => {
            const tasks = category.tasks || [];
            return tasks.length > 0 && tasks.every((task) => task.completed);
        }).length;
    }, [weeklyChallenges]);

    const filteredChallenges = useMemo(() => {
        if (activeCategory === 'all') {
            return weeklyChallenges;
        }
        return weeklyChallenges.filter((category) => category.key === activeCategory);
    }, [activeCategory, weeklyChallenges]);

    const completionRate = totalTaskCount ? Math.round((completedTaskCount * 100) / totalTaskCount) : 0;
    const activeMilestones = challengeMilestones.length ? challengeMilestones : fallbackMilestones;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-purple-300">Weekly Challenge Board</p>
                    <h3 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                        Turn your plan into visible recovery wins.
                    </h3>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-300">
                        Pick off small actions across the week, unlock category milestones, and keep your momentum gentle
                        but real.
                    </p>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-5 py-4 shadow-xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Plan progress</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{completionRate}%</p>
                    <p className="text-sm text-gray-400">{completedTaskCount} of {totalTaskCount} tasks completed</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-3">
                <FilterPill
                    active={activeCategory === 'all'}
                    label={`All Categories (${weeklyChallenges.length})`}
                    onClick={() => setActiveCategory('all')}
                />
                {weeklyChallenges.map((category) => {
                    const categoryCount = (category.tasks || []).filter((task) => task.completed).length;
                    const totalCount = (category.tasks || []).length;
                    return (
                        <FilterPill
                            key={category.key}
                            active={activeCategory === category.key}
                            label={`${category.label} (${categoryCount}/${totalCount})`}
                            onClick={() => setActiveCategory(category.key)}
                        />
                    );
                })}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {activeMilestones.map((milestone, index) => {
                    const unlocked = completedCategories >= milestoneThresholds[index];
                    return (
                        <motion.div
                            key={milestone.key}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className={`rounded-[1.6rem] border p-5 transition-all ${unlocked
                                ? 'border-green-400/30 bg-green-500/10 shadow-xl'
                                : 'border-white/10 bg-white/5'
                                }`}
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                                        Milestone {index + 1}
                                    </p>
                                    <h4 className="mt-2 text-xl font-semibold text-white">{milestone.title}</h4>
                                </div>
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${unlocked ? 'bg-green-500 text-white' : 'bg-white/10 text-gray-300'}`}>
                                    {unlocked ? 'Unlocked' : 'Locked'}
                                </span>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-gray-300">{milestone.description}</p>
                        </motion.div>
                    );
                })}
            </div>

            {filteredChallenges.length === 0 ? (
                <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-8 text-center text-sm text-gray-300">
                    No weekly categories are available right now.
                </div>
            ) : (
                <div className="grid gap-5 xl:grid-cols-2">
                    {filteredChallenges.map((category, index) => {
                        const tasks = category.tasks || [];
                        const completedInCategory = tasks.filter((task) => task.completed).length;
                        const categoryComplete = tasks.length > 0 && completedInCategory === tasks.length;
                        const progressWidth = tasks.length ? `${(completedInCategory / tasks.length) * 100}%` : '0%';

                        return (
                            <motion.div
                                key={category.key}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.04, duration: 0.35 }}
                                className={`rounded-[1.8rem] border p-6 shadow-xl transition-all ${categoryComplete
                                    ? 'border-green-400/30 bg-green-500/10'
                                    : 'border-white/10 bg-white/5'
                                    }`}
                            >
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-purple-300">
                                            {category.label}
                                        </p>
                                        <h4 className="mt-2 text-2xl font-semibold text-white">{category.objective}</h4>
                                        <p className="mt-3 text-sm leading-6 text-gray-300">
                                            {completedInCategory} of {tasks.length} tasks finished
                                        </p>
                                    </div>
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${categoryComplete ? 'bg-green-500 text-white' : 'bg-white/10 text-gray-300'}`}>
                                        {categoryComplete ? 'Category done' : 'In progress'}
                                    </span>
                                </div>

                                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                                    <div
                                        className={`h-full rounded-full ${categoryComplete ? 'bg-gradient-to-r from-green-400 to-emerald-300' : 'bg-gradient-to-r from-blue-500 to-purple-600'}`}
                                        style={{ width: progressWidth }}
                                    />
                                </div>

                                <div className="mt-6 space-y-4">
                                    {tasks.map((task) => {
                                        const done = !!task.completed;
                                        const saving = savingTaskId === task.id;

                                        return (
                                            <button
                                                key={task.id}
                                                type="button"
                                                onClick={() => onToggleTask?.(task, !done)}
                                                disabled={saving}
                                                className={`w-full rounded-[1.4rem] border p-4 text-left transition-all ${done
                                                    ? 'border-green-400/30 bg-green-500/10'
                                                    : 'border-white/10 bg-white/5 hover:border-purple-400/30 hover:bg-white/10'
                                                    } ${saving ? 'cursor-wait opacity-70' : ''}`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <span className={`mt-1 inline-flex h-6 w-6 flex-shrink-0 rounded-full border ${done ? 'border-green-500 bg-green-500' : 'border-white/20 bg-white/5'}`}>
                                                        <span className={`m-auto h-2.5 w-2.5 rounded-full bg-white ${done ? 'opacity-100' : 'opacity-0'}`} />
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h5 className="text-base font-semibold text-white">{task.title}</h5>
                                                            <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-300">
                                                                {task.minutes} min
                                                            </span>
                                                            <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-300">
                                                                {task.intensity}
                                                            </span>
                                                            {done && (
                                                                <span className="rounded-full bg-green-500/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-green-200">
                                                                    Completed
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="mt-2 text-sm leading-6 text-gray-300">{task.description}</p>
                                                        <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-purple-300">
                                                            {task.reason}
                                                        </p>
                                                        {task.completed_at && (
                                                            <p className="mt-2 text-xs text-gray-400">
                                                                Saved on {formatDate(task.completed_at)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const FilterPill = ({ active, label, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-all ${active
            ? 'border-purple-400/40 bg-purple-500/15 text-purple-200'
            : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:bg-white/10'
            }`}
    >
        {label}
    </button>
);

function formatDate(value) {
    if (!value) {
        return '';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return '';
    }

    return parsed.toLocaleString([], {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default ChallengeBoard;
