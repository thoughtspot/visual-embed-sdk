import React from 'react';
import ThoughtspotLogo from '../../assets/svg/ThoughtspotLogo.svg';
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
                    <button className="signin headerButtonStyle">
                        Sign In
                    </button>
                    <button className="signup headerButtonStyle">
                        Sign up
                    </button>
                </div>
            </div>
        </section>
    </header>
);

export default Header;
