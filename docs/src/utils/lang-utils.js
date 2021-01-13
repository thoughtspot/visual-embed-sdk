import { useIntl } from "gatsby-plugin-intl";

export const _translation = (slag_id) => {
    const intl = useIntl();
    return intl.formatMessage({ id: slag_id });
}

export default _translation;