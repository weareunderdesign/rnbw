const rnbwFiles = `
<div class="hidden-on-mobile row radius-s border" style="position:relative; min-height:600px;">
<div class="column justify-between border-right" style="width:calc(var(--base-size)*60)">
  <div class="column" style="width:calc(var(--base-size)*60)">
    <div class="justify-between padding-s border-bottom">
      <div class="gap-s align-center justify-center">
        <div
          class="radius-l icon-s align-center justify-center background-secondary"
        ></div>
        <span class="text-s opacity-m">/</span>
        <div class="gap-s align-center justify-center radius-s">
          <div
            class="radius-l icon-s align-center justify-center background-secondary"
          ></div>
          <span class="text-s">Project</span>
        </div>
      </div>
    </div>
    <div id="reset">
      <div class="justify-between padding-xs background-secondary" id="anim-1">
        <div class="gap-s padding-xs">
          <div class="icon-xs"></div>
          <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#page"/></svg>
          <span class="text-s">Page</span>
        </div>
        <div class="row"></div>
      </div>
      <div class="justify-between padding-xs" id="anim-2">
      <div class="justify-start gap-s padding-xs" style="display: flex; align-items: center;">
        <div class="icon-xs"></div>
        <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#brush"/></svg>
        <span class="text-s">Stylesheet</span>
        <div class="radius-s inverse-primary" style="
            width: 6px;
            height: 6px;
            margin-bottom: -0.116vw;
        "></div>
        </div>
      </div>
      <div class="justify-between padding-xs" id="anim-3">
        <div class="gap-s padding-xs">
          <div class="icon-xs"></div>
          <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#code-js"/></svg>
          <span class="text-s">Script</span>
        </div>
        <div class="row"></div>
      </div>
      <div class="gap-s justify-start padding-s">
        <div class="icon-xs"></div>
        <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#component"/></svg>
        <span class="text-s">Component</span>
      </div>
      <div>
        <div>
          <div class="gap-s justify-start padding-s">
            <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#down"/></svg>
            <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#folder"/></svg>
            <span class="text-s">Folder</span>
          </div>
        </div>
        <div>
          <div class="gap-s justify-start padding-s">
            <div class="icon-xs"></div>
            <div class="icon-xs"></div>
            <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#brush"/></svg>
            <span class="text-s">Stylesheet</span>
          </div>
        </div>
        <div>
          <div class="gap-s justify-start padding-s">
            <div class="icon-xs"></div>
            <div class="icon-xs"></div>
            <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#code-js"/></svg>
            <span class="text-s">Script</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<div class="flex-1 align-stretch" style="display: flex;">
  <div id="image-container" class="gap-m row align-center justify-center" style="flex-grow: 1;">
  <style>
    .svg-image{
      width: 12.27rem; 
      height: 13.36rem;
    }
  </style>
    <img class="svg-image" src="https://rnbw.design/images/HTML.svg">
  </div>
    <div
      class="flex width-25 row padding-l border-left background-primary opacity-m"
      style="opacity:1; flex-grow: 0; flex-shrink: 0; width: 40%;"
    >
      <code id="code_text_block" style="width: 100%; box-sizing: border-box;">
      </code>
    </div>
</div>
`;

class RnbwFiles extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = rnbwFiles;
  }
}

customElements.define("rnbw-files", RnbwFiles);

document.addEventListener("DOMContentLoaded", function () {
  const rnbwFilesElement = document.querySelector("rnbw-files");

  var spanElement = document.querySelector('.box h3 span');
  // spanElement.textContent += " by adopting open standards and using files as the core, you can easily open and edit any HTML/CSS/JS project visually, enjoying the benefits of files without the 'meh'.";

  const сodeTextElement = document.getElementById("code_text_block");

  const codeStrings = [
    ["&lt;div class=\"box align-stretch padding-m column\"&gt;",
      "&lt;div class=\"box gap-m row\"&gt;",
      "&lt;img class=\"svg-image\"&gt;",
      "&lt;img class=\"svg-image\"&gt;",
      "&lt;img class=\"svg-image\"&gt;",
      "&lt;/div&gt;",
      "&lt;h3&gt;",
      "&lt;span&gt;",
      "&lt;/span&gt;",
      "&lt;/h3&gt;",
      "&lt;/div&gt;"],
    ["&lt;style&gt;",
      ".svg-image{",
      "width: 13.64vw;",
      "height: 14.85vw;",
      "}",
      "&lt;/style&gt;"],
    ["const getAnims = () => {",
      "let anim1 = rnbwFilesElement. querySelector(\"#anim-1\");",
      "let anim2 = rnbwFilesElement. querySelector(\"#anim-2\");",
      "let anim3 = rnbwFilesElement. querySelector(\"#anim-3\");",
      "return { anim1, anim2, anim3 };",
      "};"]
  ];

  const marginValues = [
    ["0rem", "0.578rem", "1.156rem", "1.156rem", "1.156rem", "0.578rem", "0.578rem", "1.156rem", "1.156rem", "0.578rem", "0rem"],
    ["0rem", "0.578rem", "1.156rem", "1.156rem", "0.578rem", "0rem"],
    ["0rem", "0.578rem", "0.578rem", "0.578rem", "0.578rem", "0rem"]
  ];

  const imageSourcesLight = [
    "https://rnbw.design/images/HTML.svg",
    "https://rnbw.design/images/CSS.svg",
    "https://rnbw.design/images/JS.svg"
  ];

  const preloadedImages = document.createElement("div");
  preloadedImages.style.display = "none";
  
  imageSourcesLight.forEach(src => {
    const img = document.createElement("img");
    img.src = src;
    preloadedImages.appendChild(img);
  });

  document.body.appendChild(preloadedImages);
  
  let darkTheme;
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    darkTheme = true;
  } else {
    darkTheme = false;
  }

  function updateImages() {
    const images = rnbwFilesElement.querySelectorAll(".svg-image");
    images.forEach((image, index) => {
        image.src = imageSourcesLight[index];
    });
  }

  updateImages();

  function highlightCharacters() {

    const keywords = {
      'div': '#95261F',
      'style': '#95261F',
      'h3': '#95261F',
      'span': '#95261F',
      '"#anim-1"': '#95261F',
      '"#anim-2"': '#95261F',
      '"#anim-3"': '#95261F',
      '.svg-image': '#95261F',
      'class': '#FF0000',
      'width': '#FF0000',
      'height': '#FF0000',
      '{ anim1, anim2, anim3 }': '#10865A',
      '13.64vw': '#10865A',
      '14.85vw': '#10865A',
      'img': '#95261F',
      '"svg-image"': '#0000FF',
      '{': '#0000FF',
      '(': '#10865A',
      ')': '#10865A',
      '}': '#0000FF',
      '()': '#0000FF',
      'let': '#0000FF',
      'return': '#0000FF',
      'const': '#0000FF',
      '"flex-1 gap-m row"': '#0000FF',
      '"flex-1 align-stretch padding-m column"': '#0000FF'
    };

    const darkKeywords = {
      'div': '#569CD6',
      'style': '#569CD6',
      'h3': '#569CD6',
      'span': '#569CD6',
      '"#anim-1"': '#569CD6',
      '"#anim-2"': '#569CD6',
      '"#anim-3"': '#569CD6',
      '.svg-image': '#569CD6',
      'class': '#9CDCFE',
      'width': '#9CDCFE',
      'height': '#9CDCFE',
      '{ anim1, anim2, anim3 }': '#DA70D6',
      '13.64vw': '#DA70D6',
      '14.85vw': '#DA70D6',
      'img': '#E9B0A8',
      '"svg-image"': '#CE9178',
      '{': '#CE9178',
      '(': '#DA70D6',
      ')': '#DA70D6',
      '}': '#CE9178',
      '()': '#CE9178',
      'let': '#CE9178',
      'return': '#CE9178',
      'const': '#CE9178',
      '"flex-1 gap-m row"': '#CE9178',
      '"flex-1 align-stretch padding-m column"': '#CE9178'
    };

    const currentKeywords = darkTheme ? darkKeywords : keywords;

    const highlightedCodeStrings = [];

    for (let i = 0; i < codeStrings.length; i++) {
      const codeStringArray = [];
      for (let j = 0; j < codeStrings[i].length; j++) {
        let str = codeStrings[i][j];
        let newStr = '';
        for (let k = 0; k < str.length; k++) {
          let matched = false;
          for (const keyword in currentKeywords) {
            if (str.slice(k, k + keyword.length) === keyword) {
              if (keyword === '{ anim1, anim2, anim3 }') {
                newStr += `<span style="color:${currentKeywords[keyword]};">${str[k]}</span>`;
                newStr += str.slice(k + 1, k + keyword.length - 1);
                newStr += `<span style="color:${currentKeywords[keyword]};">${str[k + keyword.length - 1]}</span>`;
              } else {
                newStr += `<span style="color:${currentKeywords[keyword]};">${str.slice(k, k + keyword.length)}</span>`;
              }
              k += keyword.length - 1;
              matched = true;
              break;
            }
          }
          if (!matched) {
            newStr += str[k];
          }
        }
        codeStringArray.push(newStr);
      }
      highlightedCodeStrings.push(codeStringArray);
    }

    return highlightedCodeStrings;
  }


  function updateCodeText() {
    const highlightedCodeStrings = highlightCharacters();

    сodeTextElement.innerHTML = highlightedCodeStrings[0].map((item, index) => {
      return `<div style="margin-left: ${marginValues[0][index]};">${item}</div>`;
    }).join(' ');
  }


  updateCodeText();

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    darkTheme = event.matches;
    updateImages();
    updateCodeText();
  });

  const images = rnbwFilesElement.querySelectorAll(".svg-image");

  images.forEach((image, index) => {
    if (index === 0) {
      image.style.display = "block";
    } else {
      image.style.display = "none";
    }
  });

  const getAnims = () => {
    let anim1 = rnbwFilesElement.querySelector("#anim-1");
    let anim2 = rnbwFilesElement.querySelector("#anim-2");
    let anim3 = rnbwFilesElement.querySelector("#anim-3");
    return { anim1, anim2, anim3 };
  };

  const { anim1 } = getAnims();
  let delay = 1000;
  const options = {
    root: null,
    rootMargin: "0px",
    threshold: 1,
  };

  const observer = new IntersectionObserver(animateOnIntersect, options);
  observer.observe(anim1);

  function animateOnIntersect(entries, observer) {
    const { anim1, anim2, anim3 } = getAnims();
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          const highlightedCodeStrings = highlightCharacters();
          сodeTextElement.innerHTML = highlightedCodeStrings[1].map((item, index) => {
              if (index === 0) {
                return `<div style="width: 60%; height: 37.5%; margin-left: 50%; transform: translateX(-50%);"><img src="${imageSourcesLight[1]}"></div><div style="margin-left: ${marginValues[0][index]};">${item}</div>`;
              } else {
                return `<div style="margin-left: ${marginValues[1][index]};">${item}</div>`;
              }
          }).join(' ');
          anim1.classList.remove("background-secondary");
          anim2.classList.add("background-secondary");
          setTimeout(() => {
            const highlightedCodeStrings = highlightCharacters();
            сodeTextElement.innerHTML = highlightedCodeStrings[2].map((item, index) => {
                if (index === 0) {
                  return `<div style="width: 60%; height: 37.5%; margin-left: 50%; transform: translateX(-50%);"><img src="${imageSourcesLight[2]}"></div><div style="margin-left: ${marginValues[0][index]};">${item}</div>`;
                } else {
                  return `<div style="margin-left: ${marginValues[2][index]};">${item}</div>`;
                }
            }).join(' ');
            anim2.classList.remove("background-secondary");
            anim3.classList.add("background-secondary");
            setTimeout(() => {
              const highlightedCodeStrings = highlightCharacters();
              сodeTextElement.innerHTML = highlightedCodeStrings[1].map((item, index) => {
                  if (index === 0) {
                    return `<div style="width: 60%; height: 37.5%; margin-left: 50%; transform: translateX(-50%);"><img src="${imageSourcesLight[1]}"></div><div style="margin-left: ${marginValues[0][index]};">${item}</div>`;
                  } else {
                    return `<div style="margin-left: ${marginValues[1][index]};">${item}</div>`;
                  }
              }).join(' ');
              anim3.classList.remove("background-secondary");
              anim2.classList.add("background-secondary");
              setTimeout(() => {
                const highlightedCodeStrings = highlightCharacters();
                сodeTextElement.innerHTML = highlightedCodeStrings[0].map((item, index) => {
                  return `<div style="margin-left: ${marginValues[0][index]};">${item}</div>`;
                }).join(' ');
                anim2.classList.remove("background-secondary");
                anim1.classList.add("background-secondary");
                reset();
              }, delay);
            }, delay);
          }, delay);
        }, delay);

        observer.unobserve(entry.target);
      }
    });
  }

  function reset() {
    const { anim1, anim2, anim3 } = getAnims();
    delay = 1000;
    observer.observe(anim1);
  }
});