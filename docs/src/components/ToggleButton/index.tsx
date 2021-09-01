import React from 'react';
import './index.scss';

const ToggleButton = (props: {
    setDarkMode: Function;
    isDarkMode: boolean;
}) => {
    return (
        <label className="switch">
            <input
                data-testid="toggle-btn"
                type="checkbox"
                id="togBtn"
                onChange={(e) => props.setDarkMode(e.target.checked)}
                checked={props.isDarkMode}
            />
            <div data-testid="slider" className="slider round"></div>
        </label>
    );
};

export default ToggleButton;
