import React from 'react';

const GoogleFormTab = () => {
    return (
        <div className="w-full h-full">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl p-6 min-h-[80vh]">
                <h2 className="text-2xl font-bold mb-6 text-purple-100">Stress Assessment Form</h2>
                <div className="text-gray-300 mb-4">
                    <p>Please take a moment to complete this stress assessment form. Your responses will help us provide personalized insights and recommendations.</p>
                </div>
                <div className="relative w-full" style={{ paddingBottom: '100vh' }}>
                    <iframe
                        src="https://docs.google.com/forms/d/e/1FAIpQLSdZvq_0Xt_cGSbcjYX4GezbtCkRSTboBYdFymInH1jSWNbiAg/viewform?embedded=true"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        marginHeight="0"
                        marginWidth="0"
                        className="absolute top-0 left-0 w-full h-full rounded-2xl"
                        title="Stress Assessment Form"
                    >
                        Loading…
                    </iframe>
                </div>
            </div>
        </div>
    );
};

export default GoogleFormTab;
