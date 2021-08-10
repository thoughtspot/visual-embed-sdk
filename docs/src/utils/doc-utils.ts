const buildJSON = (element) => {
    const parentElement = element?.children;
    const subObj: any = {
        name: parentElement[0]?.innerText?.trim(),
        href: parentElement[0]?.querySelector('a')?.getAttribute('href'),
    };

    if (parentElement?.length > 1 && parentElement[1]?.querySelector('ul')) {
        Array.from(parentElement[1].querySelector('ul').children).forEach(
            (eachElement) => {
                if (!subObj.children) {
                    subObj.children = [];
                }
                subObj.children.push(buildJSON(eachElement));
            },
        );
    }
    return subObj;
};

export const fetchChild = (html: string) => {
    const divElement = document.createElement('div');
    divElement.innerHTML = html;
    const data = Array.from(
        divElement.querySelectorAll('ul.navSection > li'),
    ).map((element) => buildJSON(element));

    return data;
};

export const getBreadcrumsPath = (data: any, pageid?: string) => {
    if (!pageid) {
        return [];
    }
    return data.reduce((previous, current) => {
        const parentObj = [{ name: current.name, href: current.href }];
        if (current.href === `?pageid=${pageid}`) {
            return parentObj;
        }
        if (current.children) {
            const childObj = getBreadcrumsPath(current.children, pageid);
            if (childObj.length) {
                return [...parentObj, ...childObj];
            }
        }
        if (previous.length) {
            return previous;
        }
        return [];
    }, []);
};

/**
 * Used to parse html by replace all passThroughKeys with corresponding replacement values.
 * @param {string} html - raw html content
 * @param {object} params - json object containing passThroughKey: replacementValue pairs
 * @returns {string} parsed html content
 */
export const passThroughHandler = (html: string, params: object) => {
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
