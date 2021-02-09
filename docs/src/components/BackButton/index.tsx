import React from 'react';
import BackButtonImg from '../../assets/svg/backbtn.svg';
import './index.scss';

const BackButton = (props: { title: string }) => (
    <div className="backButtonWrapper">
        <button>
            <img src={BackButtonImg} alt="BackButton" />
        </button>
        <p>{props.title}</p>
    </div>
);

export default BackButton;
