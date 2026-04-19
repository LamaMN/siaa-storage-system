import React from 'react';

export default function Loader() {
    return (
        <div className="custom-loader-wrapper">
            <div className="loader-shape loader-triangle"></div>
            <div className="loader-shape loader-diamond"></div>
            <div className="loader-shape loader-circle"></div>
        </div>
    );
}
