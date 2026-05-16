import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import ChallengeBoard from './ChallengeBoard';
import { API_BASE_URL, authenticatedFetch } from '../lib/api';

const moodOptions = [
    { value: 'heavy', label: 'Heavy' },
    { value: 'steady', label: 'Steady' },
    { value: 'lighter', label: 'Lighter' },
];

const energyOptions = [
    { value: 'drained', label: 'Drained' },
    { value: 'steady', label: 'Steady' },
    { value: 'strong', label: 'Strong' },
];

const WeeklyPlanTab = ({ userData, userEmail, onUserDataChange }) => {
    const [savingTaskId, setSavingTaskId] = useState(null);
    const [regenerating, setRegenerating] = useState(false);
    const [submittingCheckIn, setSubmittingCheckIn] = useState(false);
    const [selectedMood, setSelectedMood] = useState('steady');
    const [selectedEnergy, setSelectedEnergy] = useState('steady');
    const [note, setNote] = useState('');
    const [feedback, setFeedback] = useState('');
    const [error, setError] = useState('');

    const weeklyChallenges = userData?.weekly_challenges || [];
    const challengeMilestones = userData?.challenge_milestones || [];
    const rescuePlan = userData?.rescue_plan || [];
    const weeklyPlanSummary = userData?.weekly_plan_summary || {};
    const weeklyPlanMeta = userData?.weekly_plan_meta || {};
    const checkIns = userData?.weekly_check_ins || [];
    const recentCheckIns = useMemo(() => [...checkIns].reverse(), [checkIns]);

    const handleTaskToggle = async (task, completed) => {
        if (!userEmail || !task?.id) {
            return;
        }

        setSavingTaskId(task.id);
        setError('');
        setFeedback('');

        try {
            const res = await authenticatedFetch(`${API_BASE_URL}/api/weekly-plan/task`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: userEmail,
                    taskId: task.id,
                    completed,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Unable to save task progress.');
            }

            onUserDataChange?.(data);
            setFeedback(completed ? 'Task marked as completed and saved.' : 'Task moved back into your active plan.');
        } catch (requestError) {
            setError(requestError.message || 'Unable to update task.');
        } finally {
            setSavingTaskId(null);
        }
    };

    const handleRegenerate = async () => {
        if (!userEmail) {
            return;
        }

        setRegenerating(true);
        setError('');
        setFeedback('');

        try {
            const res = await authenticatedFetch(`${API_BASE_URL}/api/weekly-plan/regenerate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Unable to refresh weekly plan.');
            }

            onUserDataChange?.(data);
            setFeedback('A fresh weekly plan has been generated from the same initial assessment.');
        } catch (requestError) {
            setError(requestError.message || 'Unable to regenerate weekly plan.');
        } finally {
            setRegenerating(false);
        }
    };

    const handleCheckInSubmit = async (event) => {
        event.preventDefault();
        if (!userEmail) {
            return;
        }

        setSubmittingCheckIn(true);
        setError('');
        setFeedback('');

        try {
            const res = await authenticatedFetch(`${API_BASE_URL}/api/weekly-plan/check-in`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: userEmail,
                    mood: selectedMood,
                    energy: selectedEnergy,
                    note,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Unable to save check-in.');
            }

            onUserDataChange?.(data);
            setNote('');
            setSelectedMood('steady');
            setSelectedEnergy('steady');
            setFeedback('Check-in saved. Your weekly progress story is now more complete.');
        } catch (requestError) {
            setError(requestError.message || 'Unable to save check-in.');
        } finally {
            setSubmittingCheckIn(false);
        }
    };

    return (
        <div className="space-y-8">
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur-xl"
            >
                <div className="absolute inset-y-0 right-0 hidden w-64 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.35),transparent_62%)] md:block" />
                <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
                    <div className="max-w-3xl">
                        <span className="inline-flex rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-purple-300">
                            Weekly Plan
                        </span>
                        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                            {userData?.weekly_focus || 'Your adaptive recovery plan is ready.'}
                        </h2>
                        <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-300 md:text-base">
                            This section is generated from your initial assessment only. You can complete tasks, save progress,
                            add quick check-ins, and refresh the plan without taking the assessment again.
                        </p>
                        <div className="mt-5 flex flex-wrap gap-3 text-xs text-gray-300">
                            <span className="rounded-full bg-white/10 px-3 py-1">{weeklyPlanMeta.week_label || 'Current week'}</span>
                            <span className="rounded-full bg-white/10 px-3 py-1">
                                Mental weather: {userData?.wellness_signals?.mental_weather || 'Balanced'}
                            </span>
                            <span className="rounded-full bg-white/10 px-3 py-1">
                                Energy: {userData?.wellness_signals?.energy_band || userData?.energy_level || 'Steady'}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={handleRegenerate}
                            disabled={regenerating}
                            className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {regenerating ? 'Refreshing plan...' : 'Refresh weekly plan'}
                        </button>
                    </div>
                </div>
            </motion.section>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Tasks done" value={`${weeklyPlanSummary.completed_task_count || 0}/${weeklyPlanSummary.total_task_count || 0}`} detail="Saved to your account" />
                <StatCard label="Categories cleared" value={`${weeklyPlanSummary.completed_category_count || 0}`} detail="Milestones unlock from category wins" />
                <StatCard label="Current streak" value={`${weeklyPlanSummary.streak_days || 0} day${weeklyPlanSummary.streak_days === 1 ? '' : 's'}`} detail="Based on completed tasks" />
                <StatCard label="Done today" value={`${weeklyPlanSummary.today_completed_count || 0}`} detail="Small wins still count" />
            </div>

            {(feedback || error) && (
                <div className={`rounded-2xl border px-4 py-3 text-sm ${error
                    ? 'border-red-500/30 bg-red-500/10 text-red-200'
                    : 'border-green-500/30 bg-green-500/10 text-green-100'
                    }`}>
                    {error || feedback}
                </div>
            )}

            <div className="grid gap-8 xl:grid-cols-[1.2fr,0.8fr]">
                <div className="space-y-8">
                    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-purple-300">Next Up</p>
                                <h3 className="mt-2 text-2xl font-semibold text-white">Start with the easiest momentum wins</h3>
                            </div>
                            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-300">
                                {weeklyPlanSummary.completion_rate || 0}% complete
                            </span>
                        </div>

                        <div className="mt-6 grid gap-4">
                            {(weeklyPlanSummary.next_up || []).length > 0 ? (
                                weeklyPlanSummary.next_up.map((task) => (
                                    <div key={task.id} className="rounded-[1.4rem] border border-white/10 bg-white/5 p-5">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h4 className="text-lg font-semibold text-white">{task.title}</h4>
                                            <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-300">
                                                {task.category_label}
                                            </span>
                                            <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-300">
                                                {task.minutes} min
                                            </span>
                                        </div>
                                        <p className="mt-3 text-sm leading-6 text-gray-300">{task.reason}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-[1.4rem] border border-green-500/30 bg-green-500/10 p-5 text-sm text-green-100">
                                    You have completed every task in the current weekly plan.
                                </div>
                            )}
                        </div>
                    </div>

                    <ChallengeBoard
                        weeklyChallenges={weeklyChallenges}
                        challengeMilestones={challengeMilestones}
                        onToggleTask={handleTaskToggle}
                        savingTaskId={savingTaskId}
                    />
                </div>

                <div className="space-y-8">
                    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">Rescue Mode</p>
                        <h3 className="mt-2 text-2xl font-semibold text-white">If the day suddenly feels too much</h3>
                        <div className="mt-6 space-y-3">
                            {rescuePlan.map((step, index) => (
                                <div key={`${step.title}-${index}`} className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4">
                                    <div className="flex items-start gap-4">
                                        <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-sm font-semibold text-purple-200">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <h4 className="text-base font-semibold text-white">{step.title}</h4>
                                            <p className="mt-2 text-sm leading-6 text-gray-300">{step.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <form
                        onSubmit={handleCheckInSubmit}
                        className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl"
                    >
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">Quick Check-In</p>
                        <h3 className="mt-2 text-2xl font-semibold text-white">Log how this week is actually feeling</h3>

                        <div className="mt-6 space-y-5">
                            <OptionGroup title="Mood" options={moodOptions} value={selectedMood} onChange={setSelectedMood} />
                            <OptionGroup title="Energy" options={energyOptions} value={selectedEnergy} onChange={setSelectedEnergy} />

                            <div>
                                <label htmlFor="weekly-note" className="mb-3 block text-sm font-semibold text-white">
                                    Small note
                                </label>
                                <textarea
                                    id="weekly-note"
                                    value={note}
                                    onChange={(event) => setNote(event.target.value)}
                                    rows={4}
                                    maxLength={220}
                                    placeholder="What helped, what felt hard, or what you want to remember..."
                                    className="w-full rounded-[1.35rem] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition focus:border-purple-400/40"
                                />
                                <p className="mt-2 text-xs text-gray-400">{note.length}/220</p>
                            </div>

                            <button
                                type="submit"
                                disabled={submittingCheckIn}
                                className="w-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {submittingCheckIn ? 'Saving check-in...' : 'Save weekly check-in'}
                            </button>
                        </div>
                    </form>

                    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-purple-300">Recent Check-Ins</p>
                                <h3 className="mt-2 text-2xl font-semibold text-white">Your recovery log</h3>
                            </div>
                            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-300">
                                {weeklyPlanSummary.check_in_count || 0} saved
                            </span>
                        </div>

                        <div className="mt-6 space-y-4">
                            {recentCheckIns.length > 0 ? (
                                recentCheckIns.map((checkIn, index) => (
                                    <div key={`${checkIn.created_at}-${index}`} className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-300">
                                                Mood: {checkIn.mood}
                                            </span>
                                            <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-300">
                                                Energy: {checkIn.energy}
                                            </span>
                                            <span className="text-xs text-gray-400">{formatDate(checkIn.created_at)}</span>
                                        </div>
                                        {checkIn.note && (
                                            <p className="mt-3 text-sm leading-6 text-gray-300">{checkIn.note}</p>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
                                    Your weekly check-ins will show up here once you save one.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, detail }) => (
    <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">{label}</p>
        <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
        <p className="mt-2 text-sm text-gray-400">{detail}</p>
    </div>
);

const OptionGroup = ({ title, options, value, onChange }) => (
    <div>
        <p className="mb-3 text-sm font-semibold text-white">{title}</p>
        <div className="grid grid-cols-3 gap-3">
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(option.value)}
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${value === option.value
                        ? 'border-purple-400/40 bg-purple-500/10 text-purple-200'
                        : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:bg-white/10'
                        }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    </div>
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

export default WeeklyPlanTab;
