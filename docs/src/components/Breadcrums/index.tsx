import React from 'react';
import { HOME_PAGE_ID } from '../../configs/doc-configs';
import { getBreadcrumsPath } from '../../utils/doc-utils';
import './index.scss';

type BreadcrumsProps = {
    pageid?: string;
    breadcrumsData: any;
};

const Breadcrums: React.FC<BreadcrumsProps> = (props: BreadcrumsProps) => {
    const breadcrums = getBreadcrumsPath(props.breadcrumsData, props.pageid);

    return (
        <>
            {breadcrums.length ? (
                <div className="breadcrumsWrapper">
                    <ul className="breadcrumb">
                        <li>
                            <a href={`?pageid=${HOME_PAGE_ID}`}>
                                Developer Guides
                            </a>
                        </li>
                        {breadcrums.map(({ name, href }) => (
                            <li key={`${name}-${href}`}>
                                {href ? <a href={href}>{name}</a> : name}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}
        </>
    );
};

export default Breadcrums;
