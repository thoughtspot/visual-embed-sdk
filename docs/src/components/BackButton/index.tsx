import React from 'react';
import BackButtonImg from '../../static/svg/backbtn.svg';
import './index.scss';

const BackButton = (props: { title: string; spotDevHomeLink: string }) => (
    <div className="backButtonWrapper">
        <button>
            <a href={props.spotDevHomeLink} target="_parent">
                <img src={BackButtonImg} alt="BackButton" />
            </a>
        </button>
        <p>{props.title}</p>
    </div>
);

export default BackButton;
