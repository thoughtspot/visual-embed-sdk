import { useIntl } from 'gatsby-plugin-intl';

/**
 * Used to get string translation based on slag_id and selected language.
 * @param {string} slag_id - string_id or slag_id to get translations
 * @returns {string} string translation based on currently selected language and slag_id
 */
export const t = (slag_id) => {
    const intl = useIntl();
    return intl.formatMessage({ id: slag_id });
};

export default t;
