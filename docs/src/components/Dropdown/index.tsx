import React, { useState, useEffect } from 'react';
import { AiOutlineCaretDown } from '@react-icons/all-files/ai/AiOutlineCaretDown';
import { VERSION_DROPDOWN } from '../../configs/doc-configs';
import './index.scss';

const Dropdown = (props: { location: Location }) => {
    const { location } = props;
    const [currentVersion, setCurrentVersion] = useState({});
    const options = VERSION_DROPDOWN;
    useEffect(() => {
        const pathname = location.pathname;
        const selectedOption = options.find(({ link }) => {
            return pathname.includes(link);
        });
        setCurrentVersion(selectedOption);
    }, []);

    const handelClick = (link) => {
        if (currentVersion?.link) {
            const previousLink = currentVersion.link;
            const url = location.href.replace(previousLink, link);
            window.open(url, '_self');
        }
    };

    if (!currentVersion?.link) {
        return <div />;
    }

    return (
        <div className="dropdownWrapper">
            <div className="dropdown">
                <button className="dropbtn">
                    {currentVersion?.label}
                    <AiOutlineCaretDown className="arrowDown" />
                </button>
                <div className="dropdownContent">
                    {options.map(({ label, link }) => {
                        return (
                            <div data-testid={`option-${label}`} key={link} onClick={() => handelClick(link)}>
                                {label}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Dropdown;
