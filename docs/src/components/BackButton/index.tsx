import React from 'react';
import BackIcon from '../../assets/svg/backIcon.svg';
import './index.scss';

const BackButton = (props: { title: string; backLink: string }) => (
    <div className="backButtonWrapper">
        <button>
            <a href={props.backLink} target="_parent">
                <img src={BackIcon} alt="Back Icon" />
            </a>
        </button>
        <p>{props.title}</p>
    </div>
);

export default BackButton;
