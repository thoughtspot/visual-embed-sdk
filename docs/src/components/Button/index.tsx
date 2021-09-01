import React from 'react';
import './index.scss';

const Button = (props: { label: string; type: string }) => (
    <button data-testid="btn" className={`button ${props.type}`}>{props.label}</button>
);

export default Button;
