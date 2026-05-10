const rnbwMapTemplate = `
<div class="row flex-1 border radius-s border" style="min-height: 600px">
  <style>
  .shortcut{
    width: 3.5rem;
    margin-left: 0.5rem;
  }
  .shortcutbox{
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
  }
  </style>
  <div
    id="anim4"
    class="hidden-on-mobile column column justify-between gap-xl border-right" style="width:calc(var(--base-size)*60)"
  >
    <div>
      <div class="border-bottom padding-m shortcutbox">
        <a href="https://rnbw.design/quick-start#guide-files">
          <span class="text-l">
            <div class="row gap-s align-end">
              1.2 Files
            </div>
          </span>
          <p class="text-s">Navigate files and subfolders.</p>
        </a>
        <div>
          <img src="./images/files.svg">
        </div>
      </div>
      <div class="border-bottom padding-m flex-1 shortcutbox">
        <a href="https://rnbw.design/quick-start#elements">
          <span class="text-l">
            <div class="row gap-s align-end">
              1.3 Elements
            </div>
          </span>
          <p class="text-s">View and control objects</p>
        </a>
        <div>
          <img src="./images/open.svg">
        </div>
      </div>
    </div>
    <div>
      <div class="padding-m gap-s border-bottom opacity-s">
        <a href="https://rnbw.design/quick-start#settings">
          <span class="text-l">
            <div class="row gap-s align-end">
              1.4 Settings
            </div>
          </span>
          <p class="text-s">Control the properties and values of nodes.</p>
        </a>
      </div>
      <div class="padding-m gap-s opacity-s">
        <a href="https://rnbw.design/quick-start#styles">
          <span class="text-l">Styles</span>
          <p class="text-s">Apply and create styles for your elements.</p>
        </a>
      </div>
    </div>
  </div>
  <div class="flex width-50 column gap-m padding-m">
    <div class="shortcutbox">
    <div class="column gap-m">
    <a id="anim2" href="https://rnbw.design/quick-start#design">
      <span class="text-l">
        1.5 Design
      </span>
      <p class="text-s">
        Visualize and manipulate objects and their composition.
      </p>
    </a>
    </div>
    <div>
        <img src="./images/toggle.svg">
        </div>
    </div>
    <div
      id="anim1"
      class="row border radius-s flex width-75 align-stretch"
      style="align-self: center;"
    >
      <div class="flex width-full padding-m border-bottom shortcutbox">
        <a href="https://rnbw.design/quick-start#jumpstart">
          <span class="text-l">
            <div class="row gap-s align-end">
              1.1 Jumpstart
            </div>
          </span>
          <p class="text-s">
            Start and open projects, control settings and get help.
          </p>
        </a>
        <div>
        <img src="./images/jumpstart.svg">
        </div>
      </div>
      <div class="border-bottom flex width-full padding-m shortcutbox">
        <a href="https://rnbw.design/quick-start#add-something">
          <span class="text-l">
            <div class="row gap-s align-end">
              1.6 Add something
            </div>
          </span>
          <p class="text-s">Add different things in different contexts.</p>
        </a>
        <div>
        <img src="./images/add.svg">
        </div>
      </div>
      <div class="flex width-full padding-m border-bottom shortcutbox">
        <a href="https://rnbw.design/quick-start#do-something">
          <span class="text-l">
            <div class="row gap-s align-end">
              1.7 Do something
            </div>
          </span>
          <p class="text-s">All of the actions offered by rnbw.</p>
        </a>
        <div>
        <img src="./images/do.svg">
        </div>
      </div>
      <div class="flex width-full padding-m border-bottom shortcutbox">
        <a href="https://rnbw.design/quick-start#ask-something">
          <span class="text-l">
            <div class="row gap-s align-end">
              1.8 Ask something
            </div>
          </span>
          <p class="text-s">let AI do the work and unleash your creativity.</p>
        </a>
        <div>
        <img src="./images/ask.svg">
        </div>
      </div>
      <div class="flex width-full padding-m shortcutbox">
        <a href="https://rnbw.design/quick-start#search-something">
          <span class="text-l">
            <div class="row gap-s align-end">
              1.9 Search something
            </div>
          </span>
          <p class="text-s">Find anything you need quickly and efficiently.</p>
        </a>
        <div>
        <img src="./images/search.svg">
        </div>
      </div>
    </div>
  </div>
  <div
    id="anim3"
    class="hidden-on-mobile flex-1 border-left padding-m shortcutbox"
  >
    <a href="https://rnbw.design/quick-start#code">
      <span class="text-l">
        1.9 Code
      </span>
      <p class="text-s">Edit your code. The real thing.</p>
    </a>
    <div>
      <img src="./images/code.svg">
    </div>
  </div>
</div>
`;

class RnbwMap extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = rnbwMapTemplate;
    updateThemeElementsVisibility();
  }
}

customElements.define("rnbw-map", RnbwMap);

document.addEventListener("DOMContentLoaded", () => {
  const rnbwMapElement = document.querySelector("rnbw-map");
  const fadeInSections = rnbwMapElement.querySelectorAll("div");

  // Add CSS styles
  const style = document.createElement("style");
  style.innerHTML = `
    rnbw-map div {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.5s, transform 0.5s;
    }

    rnbw-map div.is-visible {
      opacity: 1;
      transform: translateY(0);
    }
  `;
  document.head.appendChild(style);

  const fadeInOnScroll = (entries, observer) => {
    let delay = 0;

    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      setTimeout(() => {
        entry.target.classList.add("is-visible");      
      }, delay);

      delay += 250;
      observer.unobserve(entry.target);
    });
  };

  const options = {
    root: null,
    rootMargin: "0px",
    threshold: 0.1,
  };

  const observer = new IntersectionObserver(fadeInOnScroll, options);
  fadeInSections.forEach((section) => {
    observer.observe(section);
  });

});

