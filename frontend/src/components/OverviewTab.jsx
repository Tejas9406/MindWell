import React from 'react';
import { motion } from 'framer-motion';
import ChallengeBoard from './ChallengeBoard';

const scoreAccent = {
    green: 'text-teal-700 bg-teal-50 border-teal-200',
    yellow: 'text-amber-700 bg-amber-50 border-amber-200',
    red: 'text-rose-700 bg-rose-50 border-rose-200',
};

const OverviewTab = ({
    userData,
    onRetakeAssessment,
    onViewInsights,
    loadingInsights,
    insightsData,
}) => {
    const profileLabel = formatProfile(userData?.profile_type);
    const signals = userData?.wellness_signals || {};

    return (
        <div className="space-y-8">
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-[linear-gradient(135deg,rgba(249,252,255,0.96),rgba(236,253,245,0.92))] p-8 shadow-[0_30px_120px_rgba(15,23,42,0.1)]"
            >
                <div className="absolute inset-y-0 right-0 hidden w-72 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.24),transparent_62%)] md:block" />
                <div className="relative z-10 space-y-5">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-white/90 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
                            {profileLabel}
                        </span>
                        <span className={`rounded-full border px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${scoreAccent[userData?.color_code] || scoreAccent.yellow}`}>
                            {userData?.stress_level}
                        </span>
                    </div>
                    <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
                        <div className="space-y-4">
                            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                                Your current mind map is more than a score.
                            </h2>
                            <p className="max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
                                {userData?.summary}
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={onViewInsights}
                                    disabled={loadingInsights}
                                    className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                                >
                                    {loadingInsights ? 'Analyzing responses...' : 'View detailed insights'}
                                </button>
                                <button
                                    type="button"
                                    onClick={onRetakeAssessment}
                                    className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                >
                                    Retake assessment
                                </button>
                            </div>
                        </div>

                        <div className="rounded-[1.8rem] border border-white/80 bg-white/85 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Overall load</p>
                            <div className="mt-4 flex items-end gap-3">
                                <span className="text-5xl font-semibold tracking-tight text-slate-900">
                                    {userData?.total_score}
                                </span>
                                <span className="pb-2 text-sm text-slate-500">score points</span>
                            </div>
                            <p className="mt-4 text-sm leading-7 text-slate-600">
                                Weekly focus: <span className="font-semibold text-slate-900">{userData?.weekly_focus}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </motion.section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {Object.entries({
                    'Mind weather': signals.mental_weather,
                    'Energy band': signals.energy_band,
                    'Sleep debt': signals.sleep_debt,
                    'Social battery': signals.social_battery,
                }).map(([label, value], index) => (
                    <motion.div
                        key={label}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: index * 0.05 }}
                        className={`rounded-[1.7rem] border p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] ${getSignalTone(value).card}`}
                    >
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
                        <p className={`mt-4 text-3xl font-semibold ${getSignalTone(value).text}`}>
                            {value || 'Steady'}
                        </p>
                    </motion.div>
                ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
                <div className="rounded-[2rem] border border-white/80 bg-white/82 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Dimension breakdown</p>
                            <h3 className="mt-2 text-2xl font-semibold text-slate-900">Where the pressure is landing</h3>
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        {(userData?.dimension_breakdown || []).map((dimension) => (
                            <div key={dimension.key} className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-lg font-semibold text-slate-900">{dimension.label}</h4>
                                            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                                {dimension.severity}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-sm leading-6 text-slate-600">{dimension.insight}</p>
                                    </div>
                                    <div className="min-w-[88px] rounded-2xl bg-white px-4 py-3 text-center shadow-sm">
                                        <p className="text-2xl font-semibold text-slate-900">{dimension.score}</p>
                                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">score</p>
                                    </div>
                                </div>
                                <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
                                    <div
                                        className={`h-full rounded-full ${dimension.accent === 'coral' ? 'bg-[linear-gradient(90deg,#fb7185,#f97316)]' : dimension.accent === 'amber' ? 'bg-[linear-gradient(90deg,#f59e0b,#facc15)]' : 'bg-[linear-gradient(90deg,#14b8a6,#38bdf8)]'}`}
                                        style={{ width: `${dimension.score}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-[2rem] border border-white/80 bg-white/82 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
                        <div className="flex items-center gap-4">
                            <motion.div
                                animate={{ scale: [1, 1.08, 1] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                className="flex h-16 w-16 items-center justify-center rounded-full bg-[radial-gradient(circle,rgba(20,184,166,0.18),rgba(56,189,248,0.12))]"
                            >
                                <div className="h-8 w-8 rounded-full bg-[linear-gradient(135deg,#0f766e,#38bdf8)]" />
                            </motion.div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Rescue Mode</p>
                                <h3 className="mt-1 text-2xl font-semibold text-slate-900">Two-minute calm reset</h3>
                            </div>
                        </div>

                        <div className="mt-6 space-y-3">
                            {(userData?.rescue_plan || []).map((step, index) => (
                                <div key={step.title} className="rounded-[1.3rem] border border-slate-200 bg-slate-50/80 p-4">
                                    <div className="flex items-start gap-4">
                                        <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-900">{step.title}</h4>
                                            <p className="mt-1 text-sm leading-6 text-slate-600">{step.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-white/80 bg-white/82 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
                        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-1">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Top triggers</p>
                                <div className="mt-4 flex flex-wrap gap-3">
                                    {(userData?.top_triggers || []).map((trigger) => (
                                        <span key={trigger} className="rounded-full bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700">
                                            {trigger}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Protective strengths</p>
                                <div className="mt-4 space-y-3">
                                    {(userData?.strengths || []).map((strength) => (
                                        <div key={strength} className="rounded-[1.2rem] border border-teal-100 bg-teal-50/80 p-4 text-sm leading-6 text-teal-900">
                                            {strength}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="rounded-[2rem] border border-white/80 bg-white/82 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
                <ChallengeBoard
                    weeklyChallenges={userData?.weekly_challenges || []}
                    challengeMilestones={userData?.challenge_milestones || []}
                />
            </section>

            {insightsData?.length > 0 && (
                <section className="rounded-[2rem] border border-white/80 bg-white/82 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Response insights</p>
                            <h3 className="mt-2 text-2xl font-semibold text-slate-900">Question-by-question guidance</h3>
                        </div>
                        <span className="rounded-full bg-slate-900 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                            {insightsData.length} items
                        </span>
                    </div>

                    <div className="mt-6 grid gap-4">
                        {insightsData.map((item, index) => (
                            <div key={`${item.question}-${index}`} className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <h4 className="text-lg font-semibold text-slate-900">{item.question}</h4>
                                        <p className="mt-2 text-sm text-slate-500">
                                            Your answer: <span className="font-medium text-slate-700">{item.answer}</span>
                                        </p>
                                    </div>
                                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                        Score {item.score}
                                    </span>
                                </div>
                                <p className="mt-4 text-sm leading-7 text-slate-600">{item.insight}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

function formatProfile(value) {
    if (!value) {
        return 'Guided Wellness';
    }

    return value
        .split('_')
        .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
        .join(' ');
}

function getSignalTone(value) {
    switch (value) {
        case 'Stormy':
        case 'Low':
            return {
                card: 'border-rose-100 bg-[linear-gradient(135deg,rgba(255,241,242,0.95),rgba(255,250,250,0.95))]',
                text: 'text-rose-700',
            };
        case 'Cloudy':
        case 'Moderate':
        case 'Medium':
            return {
                card: 'border-amber-100 bg-[linear-gradient(135deg,rgba(255,251,235,0.95),rgba(255,247,237,0.95))]',
                text: 'text-amber-700',
            };
        case 'High':
            return {
                card: 'border-sky-100 bg-[linear-gradient(135deg,rgba(240,249,255,0.95),rgba(239,246,255,0.95))]',
                text: 'text-sky-700',
            };
        default:
            return {
                card: 'border-teal-100 bg-[linear-gradient(135deg,rgba(240,253,250,0.95),rgba(248,250,252,0.95))]',
                text: 'text-teal-700',
            };
    }
}

export default OverviewTab;
