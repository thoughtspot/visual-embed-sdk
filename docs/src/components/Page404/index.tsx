import * as React from 'react';
import { Link } from 'gatsby';
import './index.scss';

const Page404 = () => {
    return (
        <main className="pageStyles">
            <title>Not found</title>
            <h1 className="headingStyles">Page not found</h1>
            <p className="paragraphStyles">
                Sorry{' '}
                <span role="img" aria-label="Pensive emoji">
                    😔
                </span>{' '}
                we couldn’t find what you were looking for.
                <br />
                {process.env.NODE_ENV === 'development' ? (
                    <>
                        <br />
                        Try creating a page in{' '}
                        <code className="codeStyles">src/pages/</code>.
                        <br />
                    </>
                ) : null}
                <br />
                <Link to="/?pageid=introduction">Go home</Link>.
            </p>
        </main>
    );
};

export default Page404;
