import React from 'react';
import LeftArrow from '../../assets/svg/leftArrow.svg';
import './index.scss';

const BackButton = (props: { title: string; backLink: string }) => (
    <div className="backButtonWrapper">
        <button>
            <a href={props.backLink} target="_parent">
                <img src={LeftArrow} alt="Left Arrow" />
            </a>
        </button>
        <p>{props.title}</p>
    </div>
);

export default BackButton;
