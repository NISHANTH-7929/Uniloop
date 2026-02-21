import React from "react";
import "./Loader.css";

const Loader = ({ fullScreen = false }) => {
    return (
        <div className={`loader-wrapper ${fullScreen ? 'fullscreen' : ''}`}>
            <div className="cosmic-spinner">
                <div className="ring ring-1"></div>
                <div className="ring ring-2"></div>
                <div className="ring ring-3"></div>
                <div className="core"></div>
            </div>
            {fullScreen && <p className="loader-text text-gradient mt-4">Initializing Cosmos...</p>}
        </div>
    );
};

export default Loader;
