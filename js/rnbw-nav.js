const navTemplate = `
                <div class="row flex width-full gap-m align-center justify-center">
                        <a id="nav-item-1"
                            href="https://rnbw.design"
                            class="align-center justify-center nav justify-start padding-l gap-m radius-s background-primary border">
                            <svg class="icon-s" viewBox="0 0 12 12" fill="currentColor"><use href="#oval"/></svg>
                            <div>
                                <p class="text-l">start</p>
                            </div>
                        </a>
                        <a id="nav-item-3"
                            href="https://rnbw.design/guide"
                            class="align-center justify-center nav justify-start padding-l gap-m radius-s background-primary border">
                            <svg class="icon-s" viewBox="0 0 12 12" fill="currentColor"><use href="#library"/></svg>
                            <div>
                                <p class="text-l">guide</p>
                            </div>
                        </a>

                        <a id="nav-item-5"
                            href="https://github.com/weareunderdesign/rnbw"
                            target="_blank"
                            class="align-center justify-center nav justify-start padding-l gap-m radius-s background-primary border">
                            <svg class="icon-s" viewBox="0 0 12 12" fill="currentColor"><use href="#github"/></svg>
                            <div>
                                <p class="text-l">GitHub ↗</p>
                            </div>
                        </a>
                </div>
`;

class RnbwNav extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = navTemplate;
  }

  connectedCallback() {
    this.applyHoverEffect();
    this.applyResponsiveStyles();
    window.addEventListener("resize", this.applyResponsiveStyles.bind(this));
  }

  applyHoverEffect() {
    const navItems = this.querySelectorAll(".nav");

    navItems.forEach((navItem) => {
      navItem.addEventListener("mouseover", function () {
        navItem.classList.add("background-secondary");
      });

      navItem.addEventListener("mouseout", function () {
        navItem.classList.remove("background-secondary");
      });
    });
  }

  applyResponsiveStyles() {
    const navItems = this.querySelectorAll(".align-center justify-center");
    const isPhone = window.matchMedia("(max-width: 768px)").matches;

    navItems.forEach((navItem) => {
      if (isPhone) {
        navItem.style.width = "100%";
        navItem.style.display = "flex";
        navItem.style.justifyContent = "space-between"; 
      } else {
        navItem.style.width = "";
        navItem.style.display = "";
        navItem.style.justifyContent = ""; 
      }
    });
  }
}

customElements.define("rnbw-nav", RnbwNav);

