import React from 'react';
import './index.scss';

const ToggleButton = (props: {
    setDarkMode: Function;
    isDarkMode: boolean;
}) => {
    return (
        <label className="switch">
            <input
                type="checkbox"
                id="togBtn"
                onChange={(e) => props.setDarkMode(e.target.checked)}
                checked={props.isDarkMode}
            />
            <div className="slider round"></div>
        </label>
    );
};

export default ToggleButton;
