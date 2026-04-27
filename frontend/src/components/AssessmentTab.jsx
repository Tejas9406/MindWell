import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { API_BASE_URL } from '../lib/api';

const supportOptions = [
    { value: 'gentle', label: 'Gentle Guide', detail: 'Softer language and calming next steps.' },
    { value: 'direct', label: 'Direct Coach', detail: 'Clear action-first recommendations.' },
];

const sleepOptions = [
    { value: 'restless', label: 'Restless', detail: 'Sleep has been broken or unrefreshing.' },
    { value: 'mixed', label: 'Mixed', detail: 'Some nights are okay, some are not.' },
    { value: 'recharging', label: 'Recharging', detail: 'Sleep is mostly helping right now.' },
];

const energyOptions = [
    { value: 'low', label: 'Low', detail: 'You need lighter tasks this week.' },
    { value: 'steady', label: 'Steady', detail: 'You can handle moderate consistency.' },
    { value: 'high', label: 'High', detail: 'You can take on deeper tasks if useful.' },
];

const timeOptions = [
    { value: 10, label: '10 min/day' },
    { value: 15, label: '15 min/day' },
    { value: 25, label: '25 min/day' },
    { value: 35, label: '35 min/day' },
];

const cardMotion = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45 },
};

const AssessmentTab = ({ userEmail, currentProfileType, onComplete }) => {
    const [profiles, setProfiles] = useState([]);
    const [selectedProfile, setSelectedProfile] = useState(currentProfileType || 'professional');
    const [template, setTemplate] = useState(null);
    const [answers, setAnswers] = useState({});
    const [supportStyle, setSupportStyle] = useState('gentle');
    const [sleepQuality, setSleepQuality] = useState('mixed');
    const [energyLevel, setEnergyLevel] = useState('low');
    const [availableMinutes, setAvailableMinutes] = useState(15);
    const [step, setStep] = useState(0);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [loadingProfiles, setLoadingProfiles] = useState(true);
    const [loadingTemplate, setLoadingTemplate] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let ignore = false;

        const loadProfiles = async () => {
            setLoadingProfiles(true);
            try {
                const res = await fetch(`${API_BASE_URL}/api/assessment/profiles`);
                const data = await res.json();
                if (!ignore) {
                    setProfiles(data);
                    if (!currentProfileType && data[0]?.key) {
                        setSelectedProfile(data[0].key);
                    }
                }
            } catch (loadError) {
                if (!ignore) {
                    setError('Unable to load assessment profiles right now.');
                }
            } finally {
                if (!ignore) {
                    setLoadingProfiles(false);
                }
            }
        };

        loadProfiles();
        return () => {
            ignore = true;
        };
    }, [currentProfileType]);

    useEffect(() => {
        if (!selectedProfile) {
            return;
        }

        let ignore = false;

        const loadTemplate = async () => {
            setLoadingTemplate(true);
            setError('');
            try {
                const params = new URLSearchParams({ profileType: selectedProfile });
                const res = await fetch(`${API_BASE_URL}/api/assessment/template?${params.toString()}`);
                const data = await res.json();
                if (!ignore) {
                    setTemplate(data);
                    setQuestionIndex(0);
                    setAnswers({});
                }
            } catch (loadError) {
                if (!ignore) {
                    setError('Unable to load the guided assessment right now.');
                }
            } finally {
                if (!ignore) {
                    setLoadingTemplate(false);
                }
            }
        };

        loadTemplate();
        return () => {
            ignore = true;
        };
    }, [selectedProfile]);

    const questions = template?.questions ?? [];
    const currentQuestion = questions[questionIndex];
    const completion = questions.length ? Math.round((questionIndex / questions.length) * 100) : 0;
    const isQuestionAnswered = currentQuestion ? answers[currentQuestion.id] !== undefined : false;
    const isLastQuestion = questions.length > 0 && questionIndex === questions.length - 1;

    const handleSubmit = async () => {
        if (!userEmail) {
            setError('Please sign in before taking the assessment.');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const payload = {
                email: userEmail,
                profileType: selectedProfile,
                supportStyle,
                sleepQuality,
                energyLevel,
                availableMinutes,
                answers: questions.map((question) => ({
                    questionId: question.id,
                    value: answers[question.id] ?? 1,
                })),
            };

            const res = await fetch(`${API_BASE_URL}/api/assessment/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Unable to submit assessment');
            }

            onComplete?.(data);
        } catch (submitError) {
            setError(submitError.message || 'Unable to submit assessment.');
        } finally {
            setSubmitting(false);
        }
    };

    const nextQuestion = async () => {
        if (!currentQuestion) {
            return;
        }

        if (!isQuestionAnswered) {
            setError('Pick the option that feels closest to your last 7 days.');
            return;
        }

        setError('');
        if (isLastQuestion) {
            await handleSubmit();
            return;
        }

        setQuestionIndex((index) => index + 1);
    };

    if (!userEmail) {
        return (
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 text-white shadow-xl">
                Sign in to begin your guided wellness intake.
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <motion.section
                {...cardMotion}
                className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-8 text-white shadow-xl backdrop-blur-xl"
            >
                <div className="absolute inset-y-0 right-0 hidden w-56 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.3),transparent_62%)] md:block" />
                <div className="relative z-10 max-w-3xl space-y-4">
                    <span className="inline-flex rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-blue-300">
                        Initial Assessment
                    </span>
                    <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
                        Complete your first-time assessment before entering the dashboard.
                    </h2>
                    <p className="max-w-2xl text-sm leading-7 text-gray-300 md:text-base">
                        These questions are only for your initial setup. We use them to create your first wellness analysis,
                        personalized recommendations, and weekly challenge plan.
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-300">
                        <span className="rounded-full bg-white/10 px-3 py-1">One-time guided setup</span>
                        <span className="rounded-full bg-white/10 px-3 py-1">Profile-based question set</span>
                        <span className="rounded-full bg-white/10 px-3 py-1">Personalized weekly plan afterward</span>
                    </div>
                </div>
            </motion.section>

            <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
                <motion.section
                    {...cardMotion}
                    transition={{ duration: 0.45, delay: 0.05 }}
                    className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur-xl"
                >
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">Step 1</p>
                            <h3 className="mt-2 text-2xl font-semibold text-white">Choose your life context</h3>
                        </div>
                        <span className="rounded-full bg-white/10 px-4 py-1 text-xs font-medium text-white">
                            {loadingProfiles ? 'Loading...' : `${profiles.length} profiles`}
                        </span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {profiles.map((profile) => {
                            const active = selectedProfile === profile.key;
                            return (
                                <button
                                    key={profile.key}
                                    type="button"
                                    onClick={() => setSelectedProfile(profile.key)}
                                    className={`rounded-[1.5rem] border p-5 text-left transition-all ${active
                                        ? 'border-purple-400/40 bg-purple-500/10 shadow-xl'
                                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h4 className="text-lg font-semibold text-white">{profile.label}</h4>
                                            <p className="mt-2 text-sm leading-6 text-gray-300">{profile.description}</p>
                                        </div>
                                        {active && (
                                            <span className="rounded-full bg-purple-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                                                Selected
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-8 grid gap-4 md:grid-cols-2">
                        <PreferenceGroup
                            title="Support style"
                            items={supportOptions}
                            value={supportStyle}
                            onChange={setSupportStyle}
                        />
                        <PreferenceGroup
                            title="Sleep quality"
                            items={sleepOptions}
                            value={sleepQuality}
                            onChange={setSleepQuality}
                        />
                        <PreferenceGroup
                            title="Energy level"
                            items={energyOptions}
                            value={energyLevel}
                            onChange={setEnergyLevel}
                        />
                        <div>
                            <p className="mb-3 text-sm font-semibold text-white">Daily time budget</p>
                            <div className="grid grid-cols-2 gap-3">
                                {timeOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setAvailableMinutes(option.value)}
                                        className={`rounded-2xl border px-4 py-4 text-sm font-medium transition-all ${availableMinutes === option.value
                                            ? 'border-blue-400/40 bg-blue-500/10 text-blue-200'
                                            : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:bg-white/10'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center gap-4">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            disabled={!template || loadingTemplate}
                            className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loadingTemplate ? 'Preparing questions...' : 'Start first assessment'}
                        </button>
                        <p className="text-sm text-gray-400">This is a support tool, not a medical diagnosis.</p>
                    </div>
                </motion.section>

                <motion.section
                    {...cardMotion}
                    transition={{ duration: 0.45, delay: 0.1 }}
                    className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur-xl"
                >
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">Step 2</p>
                            <h3 className="mt-2 text-2xl font-semibold text-white">Question flow</h3>
                        </div>
                        {template && (
                            <span className="rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
                                {template.question_count} questions
                            </span>
                        )}
                    </div>

                    {step === 0 ? (
                        <div className="space-y-5">
                            <p className="text-sm leading-7 text-gray-300">
                                This one-time setup creates your initial report. After it finishes, the dashboard will use the
                                results to generate recommendations, insights, and your weekly challenge plan automatically.
                            </p>
                            <div className="grid gap-3">
                                <div className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-400">
                                                Profile
                                            </h4>
                                            <p className="mt-1 text-sm text-white">{template?.profile_label || 'Loading...'}</p>
                                        </div>
                                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-gray-300">
                                            Personalized
                                        </span>
                                    </div>
                                </div>
                                <div className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-400">
                                                Estimated time
                                            </h4>
                                            <p className="mt-1 text-sm text-white">{template?.estimated_minutes || 6} minutes</p>
                                        </div>
                                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-gray-300">
                                            First time only
                                        </span>
                                    </div>
                                </div>
                                <div className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-400">
                                                Outcome
                                            </h4>
                                            <p className="mt-1 text-sm text-white">Initial analysis, chatbot context, and weekly tasks</p>
                                        </div>
                                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-gray-300">
                                            Generated after submit
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                                    <span>Question progress</span>
                                    <span>{questionIndex + 1} / {questions.length}</span>
                                </div>
                                <div className="h-3 overflow-hidden rounded-full bg-white/10">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${completion + (questions.length ? 100 / questions.length : 0)}%` }}
                                        transition={{ duration: 0.35 }}
                                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                                    />
                                </div>
                            </div>

                            <AnimatePresence mode="wait">
                                {currentQuestion && (
                                    <motion.div
                                        key={currentQuestion.id}
                                        initial={{ opacity: 0, x: 30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -30 }}
                                        transition={{ duration: 0.25 }}
                                        className="space-y-6"
                                    >
                                        <div className="rounded-[1.7rem] border border-white/10 bg-white/5 p-6">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <span className="rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-300">
                                                    {currentQuestion.dimension_label}
                                                </span>
                                                <span className="rounded-full bg-white/10 px-4 py-1 text-xs text-gray-300">
                                                    {template?.profile_label}
                                                </span>
                                            </div>
                                            <h4 className="mt-5 text-2xl font-semibold leading-9 text-white">
                                                {currentQuestion.prompt}
                                            </h4>
                                            <p className="mt-3 text-sm leading-7 text-gray-300">
                                                {currentQuestion.helper_text}
                                            </p>
                                        </div>

                                        <div className="grid gap-3">
                                            {currentQuestion.options.map((option) => {
                                                const active = answers[currentQuestion.id] === option.value;
                                                return (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        onClick={() => {
                                                            setAnswers((prev) => ({
                                                                ...prev,
                                                                [currentQuestion.id]: option.value,
                                                            }));
                                                            setError('');
                                                        }}
                                                        className={`rounded-[1.4rem] border p-5 text-left transition-all ${active
                                                            ? 'border-purple-400/40 bg-purple-500/10 shadow-xl'
                                                            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                                                            }`}
                                                    >
                                                        <div className="flex items-start gap-4">
                                                            <span className={`mt-1 inline-flex h-5 w-5 flex-shrink-0 rounded-full border ${active ? 'border-purple-500 bg-purple-500' : 'border-white/20 bg-white/5'}`}>
                                                                <span className={`m-auto h-2 w-2 rounded-full bg-white ${active ? 'opacity-100' : 'opacity-0'}`} />
                                                            </span>
                                                            <div>
                                                                <p className="text-base font-semibold text-white">{option.label}</p>
                                                                <p className="mt-1 text-sm leading-6 text-gray-300">{option.detail}</p>
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setError('');
                                        if (questionIndex === 0) {
                                            setStep(0);
                                            return;
                                        }
                                        setQuestionIndex((index) => Math.max(0, index - 1));
                                    }}
                                    className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-gray-300 transition hover:border-white/20 hover:bg-white/10"
                                >
                                    {questionIndex === 0 ? 'Back to setup' : 'Previous'}
                                </button>
                                <button
                                    type="button"
                                    onClick={nextQuestion}
                                    disabled={submitting}
                                    className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {submitting ? 'Generating your plan...' : isLastQuestion ? 'Finish initial assessment' : 'Next question'}
                                </button>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                            {error}
                        </div>
                    )}
                </motion.section>
            </div>
        </div>
    );
};

const PreferenceGroup = ({ title, items, value, onChange }) => (
    <div>
        <p className="mb-3 text-sm font-semibold text-white">{title}</p>
        <div className="grid gap-3">
            {items.map((item) => (
                <button
                    key={item.value}
                    type="button"
                    onClick={() => onChange(item.value)}
                    className={`rounded-[1.3rem] border p-4 text-left transition-all ${value === item.value
                        ? 'border-purple-400/40 bg-purple-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                        }`}
                >
                    <p className="text-sm font-semibold text-white">{item.label}</p>
                    <p className="mt-1 text-xs leading-5 text-gray-300">{item.detail}</p>
                </button>
            ))}
        </div>
    </div>
);

export default AssessmentTab;
