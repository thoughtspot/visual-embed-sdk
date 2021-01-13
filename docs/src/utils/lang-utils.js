import { useIntl } from 'gatsby-plugin-intl';

export const t = (slag_id) => {
    const intl = useIntl();
    return intl.formatMessage({ id: slag_id });
};

export default t;
