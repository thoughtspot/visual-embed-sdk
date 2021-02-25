const addCopyFeature = () => {
  document.querySelectorAll('.listingblock>.content>.highlight>button').forEach((btn, index) => {
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
          setTimeout(() => {
              btn.parentElement.removeChild(divElement);
          }, 500);
      })
  });
};

export default addCopyFeature;
