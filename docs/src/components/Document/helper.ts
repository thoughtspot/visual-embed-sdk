import hljs from "highlight.js"
import Copy from '../../assets/svg/copy.svg';

export const addEventListner = (element: HTMLElement, ...args: HTMLElement[]) => {
    element.addEventListener('click', () => {
        const textareaElement = document.createElement("textarea");
        textareaElement.value = (args[0] as HTMLElement).innerText;
        element.parentElement.appendChild(textareaElement);
        textareaElement.select();
        document.execCommand("copy");
        element.parentElement.removeChild(textareaElement);
        const divElement = document.createElement('div');
        divElement.classList.add('tooltip');
        const spanElement = document.createElement('span');
        spanElement.classList.add('tooltiptext');
        spanElement.innerText = 'Copied!';
        divElement.appendChild(spanElement);
        element.parentElement.appendChild(divElement);
        /* To remove copy tooltip */
        setTimeout(() => {
            element.parentElement.removeChild(divElement);
        }, 500);
    })
};

export const customizeDocContent = () => {
    const allCodeTags = document.querySelectorAll('.listingblock>.content>.highlight>code');
    if (allCodeTags.length > 0) {
        document.querySelectorAll('.listingblock>.content>.highlight>code').forEach((tag) => {
            const buttonElement = document.createElement('button');
            buttonElement.setAttribute('class', 'copyButton');
            addEventListner(buttonElement, tag as HTMLElement);
            const imageElement = document.createElement('img');
            imageElement.src = Copy;
            imageElement.alt = 'Copy';
            imageElement.title = 'Copy';
            buttonElement.appendChild(imageElement);
            const spanElement = document.createElement('span');
            spanElement.innerText = tag.getAttribute('data-lang');
            spanElement.classList.add('lang');
            const wrapperDiv = document.createElement('div');
            wrapperDiv.classList.add('wrapperContainer');
            wrapperDiv.appendChild(spanElement);
            wrapperDiv.appendChild(buttonElement);
            tag.parentElement.appendChild(wrapperDiv);
        });
    }
    document.querySelectorAll("pre code").forEach(block => {
        hljs.highlightBlock(block as HTMLElement);
    })
};
