export const passThroughHandler = (html, params) => {
    let parsedHtml = html;
    const paramKeys = Object.keys(params);
    if (!html && paramKeys.length === 0) return parsedHtml;
    const customPassThroughStart = '{{';
    const customPassThroughEnd = '}}';

    paramKeys.map((key) => {
        parsedHtml = parsedHtml.replace(
            new RegExp(
                `${customPassThroughStart}${key}${customPassThroughEnd}`,
                'g',
            ),
            params[key] || '',
        );
    });

    return parsedHtml;
};

export default passThroughHandler;
