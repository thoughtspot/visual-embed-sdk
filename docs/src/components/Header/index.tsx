import React from 'react';
import Button from '../Button';
import ThoughtspotLogo from '../../static/svg/ThoughtspotLogo.svg';
import './index.scss';

const Header = () => (
    <header>
        <section className="container">
            <div className="headerWrapper">
                <div>
                    <h1 className="m-0">
                        <a href="#" title="logo">
                            <img
                                src={ThoughtspotLogo}
                                alt="logo"
                                className="thoughtspotLogo"
                            />
                        </a>
                    </h1>
                </div>
                <div>
                    <Button label="Sign In" type="secondary" />
                    <Button label="Sign up" type="primary" />
                </div>
            </div>
        </section>
    </header>
);

export default Header;
