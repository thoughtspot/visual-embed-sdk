import React from 'react';
import BackButtonImg from '../../assets/svg/backbtn.svg';
import './index.scss';

const BackButton = () => (
    <div className="backButtonWrapper">
        <button>
            <img src={BackButtonImg} alt="BackButton" />
        </button>
        <p>SpotDev Home</p>
    </div>
);

export default BackButton;
