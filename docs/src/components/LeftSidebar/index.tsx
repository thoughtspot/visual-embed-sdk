import React from 'react';
import './index.scss';
import BackButton from '../BackButton';

const LeftSideBar = () => (
    <aside>
        <BackButton />
        <nav>
            <h2 className="heading">Documentation</h2>
            <div className="navWrapper">
                <h3 className="subHeading">Visual Embed</h3>
                <ul>
                    <li className="navlinks">
                        <a href="#" className="activelink navlinksAnchor">
                            Getting Started
                        </a>
                    </li>
                    <li className="navlinks">
                        <a className="navlinksAnchor" href="#">
                            Search
                        </a>
                    </li>
                    <li className="navlinks">
                        <a className="navlinksAnchor" href="#">
                            Answer
                        </a>
                    </li>
                    <li className="navlinks">
                        <a className="navlinksAnchor" href="#">
                            Pinboard
                        </a>
                    </li>
                    <li className="navlinks">
                        <a className="navlinksAnchor" href="#">
                            Full App
                        </a>
                    </li>
                </ul>
            </div>
            <div className="navWrapper">
                <h3 className="subHeading">Rest API</h3>
                <ul>
                    <li className="navlinks">
                        <a className="navlinksAnchor" href="#">
                            Getting Started
                        </a>
                    </li>
                    <li className="navlinks">
                        <a className="navlinksAnchor" href="#">
                            Search
                        </a>
                    </li>
                    <li className="navlinks">
                        <a className="navlinksAnchor" href="#">
                            Answer/Pinboard
                        </a>
                    </li>
                    <li className="navlinks">
                        <a className="navlinksAnchor" href="#">
                            Pinboard
                        </a>
                    </li>
                    <li className="navlinks">
                        <a className="navlinksAnchor" href="#">
                            App Refrence
                        </a>
                    </li>
                </ul>
            </div>
        </nav>
    </aside>
);

export default LeftSideBar;
