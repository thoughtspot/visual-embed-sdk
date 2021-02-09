import React from 'react';
import './index.scss';
import data from './data';
import BackButton from '../BackButton';

const LeftSideBar = () => (
    <aside>
        <BackButton title="SpotDev Home" />
        <nav>
            <h2 className="heading">Documentation</h2>
            {data.map((content) => (
                <div className="navWrapper" key={content.title}>
                    <h3 className="subHeading">{content.title}</h3>
                    <ul>
                        {content.links.map((link) => (
                            <li className="navlinks" key={link.label}>
                                <a
                                    href="#"
                                    className={`navlinksAnchor ${
                                        link.isActive ? 'activelink' : ''
                                    }`}
                                >
                                    {link.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </nav>
    </aside>
);

export default LeftSideBar;
