import React, { useState, useEffect } from 'react';

const TypingEffect = ({ text, speed = 20, isAnimate = true }) => {
    const [displayedText, setDisplayedText] = useState(isAnimate ? '' : text);

    useEffect(() => {
        if (!isAnimate) {
            setDisplayedText(text);
            return;
        }

        let i = 0;
        setDisplayedText('');
        const interval = setInterval(() => {
            if (i < text.length - 1) {
                setDisplayedText((prev) => prev + text[i]);
                i++;
            } else {
                setDisplayedText(text);
                clearInterval(interval);
            }
        }, speed);

        return () => clearInterval(interval);
    }, [text, speed, isAnimate]);

    return <span>{displayedText}</span>;
};

export default TypingEffect;
