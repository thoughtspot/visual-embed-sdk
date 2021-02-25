import hljs from "highlight.js"
import Copy from '../../assets/svg/copy.svg';

export const addEventListner = () => {
  document.querySelectorAll('.listingblock>.content>.highlight>.wrapperContainer>button').forEach((btn, index) => {
      btn.addEventListener('click', () => {
          const textareaElement = document.createElement("textarea");
          textareaElement.value = (document.querySelectorAll('.listingblock>.content>.highlight>code')[index] as HTMLElement).innerText;
          btn.parentElement.appendChild(textareaElement);
          textareaElement.select();
          document.execCommand("copy");
          btn.parentElement.removeChild(textareaElement);
          const divElement = document.createElement('div');
          divElement.classList.add('tooltip');
          const spanElement = document.createElement('span');
          spanElement.classList.add('tooltiptext');
          spanElement.innerText = 'Copied!';
          divElement.appendChild(spanElement);
          btn.parentElement.appendChild(divElement);
          /* To remove copy tooltip */
          setTimeout(() => {
              btn.parentElement.removeChild(divElement);
          }, 500);
      })
  });
};

export const customizeDocContent = (divElement: HTMLElement, setDocContent: Function) => {
    const allTags = divElement.querySelectorAll('.listingblock>.content>.highlight>code');
    if (allTags.length > 0) {
        divElement.querySelectorAll('.listingblock>.content>.highlight>code').forEach((tag) => {
            const buttonElement = document.createElement('button');
            buttonElement.setAttribute('class', 'copyButton');
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
    divElement.querySelectorAll("pre code").forEach(block => {
        hljs.highlightBlock(block as HTMLElement);
    })
    setDocContent(divElement.innerHTML)
    setTimeout(() => {
        addEventListner();
    }, 500);
};
