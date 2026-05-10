// --------------- jumpstart Icons--------------//

const newIconSvg = `  
<svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#plus"/></svg>`;

const folderIconSvg = `
<svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#folder"/></svg>`;

const githubIconSvg = ` 
<svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#github"/></svg>`;

const guideIconSvg = `
<svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#help"/></svg>`;

const supportIconSvg = `
<svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#person"/></svg>`;

const communityIconSvg = `
<svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#people"/></svg>`;

// --------------- addSomething Icons--------------//

const pageIconSvg = `                            
<svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#page"/></svg>`;

const codeJSIconSvg = `
<svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#code-js"/></svg>`;

const linkIconSvg = ` 
<svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#link"/></svg>
`;
const divIconSvg = `
<svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#div"/></svg>`;
const textIconSvg = `
<svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#text"/></svg>`;
const imageIconSvg = `
<svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#image"/></svg>`;
const videoIconSvg = `
<svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#link"/></svg>`;

const brushIconSvg = `
<svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#brush"/></svg>`;

const componentIconSvg = `
<svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#component"/></svg>`;

// --------------- doSomething Icons--------------//

const plusIconSvg = `  
 <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#plus"/></svg>
 `;

const codeHtmlIconSvg = `
 <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#code-html"/></svg>
 `;

const playIconSvg = ` 
<svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#play"/></svg>
`;

const editIconSvg = `
<svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#edit"/></svg>
`;

const cloudUploadIconSvg = `
<svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#cloud-upload"/></svg>
`;

const shareIconSvg = `
<svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#share"/></svg>
`;

const copyIconSvg = `
<svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#copy"/></svg>
`;

const crossIconSvg = ` 
<svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#cross"/></svg>
`;
// ------------- components --------------//
const searchBox = (searchText = "") => `
<div class="gap-m flex width-full border-bottom padding-m justify-start radius-xs">
    <div class="justify-start gap-s padding-s">
        <div>
            <span class="text-l opacity-m">${searchText}</span>
        </div>
    </div>
</div>
`;

const subMenus = (menuConfigs) => {
  const {
    menuTitle = "",
    options = [
      {
        icon: "",
        name: "",
        shortcut: "",
      },
    ],
  } = menuConfigs;
  return `

    <div class="column align-stretch">
      <div class="padding-m gap-s">
        <span class="text-s opacity-m">${menuTitle}</span>
      </div>

      ${options
      ?.map(
        (option) => `
        <div class="padding-m justify-between ${option.disabled &&"opacity-m"
          } ${option.isHighlighted && "background-secondary radius-xs"}">
          <div class="gap-s align-center justify-center">
            ${option.icon}
            <span class="text-m">${option.name}</span>
          </div>
          <div class="gap-s">
            <span class="text-m">${option.shortcut}</span>
          </div>
       </div>    
      `
      )
      .join(" ")}
      </div> 
`;
};

const doSomething = () => {
  const menuWrapper = `
  <div class="flex width-full column align-stretch" style="align-items:stretch;">
    <div class="column align-stretch">
        <div class="flex width-full padding-m column align-stretch" style="align-items:stretch;">
            ${subMenus({
    menuTitle: "Project",
    options: [
      {
        icon: plusIconSvg,
        name: "Add",
        shortcut: "A",
        isHighlighted: true,
      },
      {
        icon: codeHtmlIconSvg,
        name: "Code",
        shortcut: "C",
      },
      {
        icon: playIconSvg,
        name: "Run",
        shortcut: "R",
      },
      {
        icon: editIconSvg,
        name: "Design",
        shortcut: "/",
      },
      {
        icon: cloudUploadIconSvg,
        name: "Publish",
        shortcut: "P",
        disabled: true,
      },
      {
        icon: shareIconSvg,
        name: "Share",
        shortcut: "O",
        disabled: true,
      },
    ],
  })}
            ${subMenus({
    menuTitle: "Actions",
    options: [
      {
        icon: copyIconSvg,
        name: "Cut",
        shortcut: "",
      },
      {
        icon: copyIconSvg,
        name: "Copy",
        shortcut: "",
      },
      {
        icon: copyIconSvg,
        name: "Paste",
        shortcut: "",
      },
    ],
  })}

            ${subMenus({
    menuTitle: "Other",
    options: [
      {
        icon: componentIconSvg,
        name: "Create Component",
        shortcut: "",
      },
      {
        icon: crossIconSvg,
        name: `
                  <span class="text-m">Remove unused styles</span>
                  <span class="text-m">(28)</span>
                  `,
        shortcut: "",
      },
      {
        icon: copyIconSvg,
        name: "Copy class names",
        shortcut: "",
      },
    ],
  })}
        </div>
    </div>
  </div>`;
  return `
  <div class="background-secondary flex-1 align-center justify-center padding-l radius-s border hidden" style="min-height: 705px"
  id="do-something-menu">
    <div class="flex width-50 row align-stretch shadow background-primary radius-s border"> 
      ${searchBox("Do Something")}
      ${menuWrapper}
    </div>
  </div>`;
};

const jumpstartMenu = () => {
  const menuWrapper = `
  
  <div class="flex width-full column align-stretch" style="align-items:stretch;">
    <div class="column align-stretch">
        <div class="flex width-full padding-m column align-stretch" style="align-items:stretch;">
            ${subMenus({
    menuTitle: "Projects",
    options: [
      {
        icon: newIconSvg,
        name: "New",
        shortcut: "N",
      },
      {
        icon: folderIconSvg,
        name: "Open",
        shortcut: "O",
        isHighlighted: true,
      },
    ],
  })}
            ${subMenus({
    menuTitle: "Recent",
    options: [
      {
        icon: folderIconSvg,
        name: "Project",
        shortcut: "",
      },
      {
        icon: githubIconSvg,
        name: "Project",
        shortcut: "",
      },
      {
        icon: folderIconSvg,
        name: "Project",
        shortcut: "",
      },
    ],
  })}
            ${subMenus({
    menuTitle: "Help",
    options: [
      {
        icon: guideIconSvg,
        name: "Guide",
        shortcut: "",
      },
      {
        icon: supportIconSvg,
        name: "Support",
        shortcut: "",
      },
      {
        icon: communityIconSvg,
        name: "Community",
        shortcut: "",
      },
    ],
  })}
            
            ${subMenus({
    menuTitle: "Settings",
    options: [
      {
        icon: `  <div class="padding-xs">
                    <div class="radius-l icon-xs align-center justify-center background-secondary"></div>
                </div>`,
        name: `<span class="text-m opacity-m">Theme</span>
                    <span class="text-s opacity-m">/</span>
                    <span class="text-m">System</span>`,
        shortcut: "",
      },
    ],
  })} 
        </div>
    </div>
  </div>`;

  return `
    <div class="background-secondary flex-1 align-center justify-center padding-l radius-s border" style="min-height: 705px"
    id="jumpstart-menu">
      <div class="flex width-50 row align-stretch shadow background-primary radius-s border">
      
        ${searchBox("Jumpstart...")}
        ${menuWrapper}
      </div>
    </div>`;
};

const addSomething = () => {
  const menuWrapper = `
  <div class="flex width-full column align-stretch" style="align-items:stretch;">
    <div class="column align-stretch">
        <div class="flex width-full padding-m column align-stretch" style="align-items:stretch;">
            ${subMenus({
    menuTitle: "Files",
    options: [
      {
        icon: pageIconSvg,
        name: "Page",
        shortcut: "",
      },
      {
        icon: codeJSIconSvg,
        name: "Script",
        shortcut: "",
      },
    ],
  })}
            ${subMenus({
    menuTitle: "Elements",
    options: [
      {
        icon: divIconSvg,
        name: "Div",
        shortcut: "",
        isHighlighted: true,
      },
      {
        icon: textIconSvg,
        name: "Text",
        shortcut: "",
      },
      {
        icon: imageIconSvg,
        name: "Image",
        shortcut: "",
      },
      {
        icon: linkIconSvg,
        name: "Link",
        shortcut: "",
      },
    ],
  })}

            ${subMenus({
    menuTitle: "Recent",
    options: [
      {
        icon: brushIconSvg,
        name: `
                  <span class="opacity-m text-m">
                  Stylesheet1/</span>
                  <span class="text-m">Style1</span>
                  `,
        shortcut: "",
      },
      {
        icon: componentIconSvg,
        name: "Component 1",
        shortcut: "",
      },
      {
        icon: `<div class="icon-s radius-l border"></div>`,
        name: ` 
                  <span class="opacity-m text-m">images/</span><span class="text-m">image1.png</span>
                  `,
        shortcut: "",
      },
    ],
  })}
        </div>
    </div>
  </div>`;
  // change here
  return `
  <div class="background-secondary flex-1 align-center justify-center padding-l radius-s border hidden" style="min-height: 705px"
  id="add-something-menu">
    <div class="flex width-50 row align-stretch shadow background-primary radius-s border"> 
      ${searchBox("Add something...")}
      ${menuWrapper}
    </div>
  </div>`;
};


const keyboardImages = () => {
  return `<img class="keyboard" src="https://rnbw.design/images/jumpstart.svg">
  <img class="keyboard" src="https://rnbw.design/images/add.svg">
  <img class="keyboard" src="https://rnbw.design/images/do.svg">`;
};

const hideKeyboardOnMobilePortrait = () => {
  const mediaQuery = window.matchMedia('(max-width: 767px) and (orientation: portrait)');

  const toggleKeyboardVisibility = () => {
    const keyboards = document.querySelectorAll('.keyboard');
    if (mediaQuery.matches) {
      keyboards.forEach(keyboard => {
        keyboard.style.display = 'none';
      });
    } else {
      keyboards.forEach(keyboard => {
        keyboard.style.display = 'block';
      });
    }
  };

  toggleKeyboardVisibility();
  mediaQuery.addEventListener('change', toggleKeyboardVisibility);
};
hideKeyboardOnMobilePortrait();


const getLeftValue = () => {
  const isTabletPortrait = window.matchMedia("(min-device-width: 768px) and (max-device-width: 1024px) and (orientation: portrait)").matches;
  return isTabletPortrait ? '10%' : '15%';
};

const rnbwKeyboardTemplate = `
<div class="gap-l" id="keyboard-wrapper" style="position: relative;">
<div style="position: absolute; top: 0; left: ${getLeftValue()}; display: flex; flex-direction: column; height: 100%; justify-content: center; align-items: center;">
    ${keyboardImages()}
  </div>
${doSomething()}
${jumpstartMenu()}
${addSomething()}
</div>`;

class RnbwKeyobard extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = rnbwKeyboardTemplate;
  }
}

customElements.define("rnbw-keyboard", RnbwKeyobard);

document.addEventListener("DOMContentLoaded", function () {
  const options = {
    root: null,
    rootMargin: "0px",
    threshold: 0.1,
  };
  const rnbwKeyboardElement = document.querySelector("rnbw-keyboard");

  const observer = new IntersectionObserver(toggleOnIntersect, options);
  let keyboardToggleIntervalId = "";
  const mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === "data-theme") {
        i = 0;
        clearInterval(keyboardToggleIntervalId);
        keyboardToggleIntervalId = setInterval(toggleVisibility, 1500);

      }
    });
  });

  let target = document.getElementById("keyboard-wrapper");
  observer.observe(target);

  let i = 0;

  function toggleVisibility() {
    let keyboards = document.querySelectorAll(`.keyboard`);

    for (let j = 0; j < keyboards.length; j++) {
      const jumpstartMenu = document.getElementById("jumpstart-menu");
      const doSomethingMenu = document.getElementById("do-something-menu");
      const addSomethingMenu = document.getElementById("add-something-menu");
      keyboards[j].style.opacity = j === i ? "1" : "0.3";
      if (i === 0) {
        jumpstartMenu.classList.remove("hidden");
        doSomethingMenu.classList.add("hidden");
        addSomethingMenu.classList.add("hidden");
      } else if (i === 1) {
        jumpstartMenu.classList.add("hidden");
        doSomethingMenu.classList.add("hidden");
        addSomethingMenu.classList.remove("hidden");
      } else if (i === 2) {
        jumpstartMenu.classList.add("hidden");
        doSomethingMenu.classList.remove("hidden");
        addSomethingMenu.classList.add("hidden");
      }
    }
    i = (i + 1) % keyboards.length;
  }

  function toggleOnIntersect(entries, observer) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        keyboardToggleIntervalId = setInterval(toggleVisibility, 1500);
        observer.unobserve(entry.target);
      }
    });
  }

  const keyboards = document.querySelectorAll(".keyboard");

  keyboards.forEach((keyboard, index) => {
    keyboard.addEventListener("click", () => {
      clearInterval(keyboardToggleIntervalId);
      const jumpstartMenu = document.getElementById("jumpstart-menu");
      const doSomethingMenu = document.getElementById("do-something-menu");
      const addSomethingMenu = document.getElementById("add-something-menu");

      keyboards.forEach((kb, idx) => {
        kb.style.opacity = idx === index ? "1" : "0.3";
      });

      if (index === 0 || index === 3) {
        jumpstartMenu.classList.remove("hidden");
        doSomethingMenu.classList.add("hidden");
        addSomethingMenu.classList.add("hidden");
      } else if (index === 1 || index === 4) {
        jumpstartMenu.classList.add("hidden");
        doSomethingMenu.classList.add("hidden");
        addSomethingMenu.classList.remove("hidden");
      } else if (index === 2 || index === 5) {
        jumpstartMenu.classList.add("hidden");
        doSomethingMenu.classList.remove("hidden");
        addSomethingMenu.classList.add("hidden");
      }
    });
  });

});