import React, { useEffect } from 'react';

const AdSenseAd = ({ client, slot, format = 'auto', responsive = 'true', test = false }) => {
    useEffect(() => {
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            } catch (e) {
                console.error('AdSense error:', e);
            }
    }, []); // Empty dependency array ensures this runs only once on mount

    return (
        <div>
            <ins
                className=""
                style={{ display: 'block' }}
                data-ad-client="ca-pub-9543978598525438"
                data-ad-slot="7882090917"
                data-ad-format="auto"
                data-full-width-responsive="true"
            />
        </div>
    );
};

export default AdSenseAd;