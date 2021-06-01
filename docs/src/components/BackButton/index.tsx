import React from 'react';
import { IconContext } from '@react-icons/all-files';
import { BsArrowLeft } from '@react-icons/all-files/bs/BsArrowLeft';
import './index.scss';

const BackButton = (props: { title: string; backLink: string }) => (
    <div className="backButtonWrapper">
        <button>
            <a href={props.backLink} target="_parent">
                <IconContext.Provider value={{ className: 'icon leftIcon' }}>
                    <BsArrowLeft />
                </IconContext.Provider>
            </a>
        </button>
        <p>{props.title}</p>
    </div>
);

export default BackButton;
