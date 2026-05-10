// Immediate theme initialization
(function initializeTheme() {
  const storedTheme = localStorage.getItem("theme");
  if (storedTheme) {
    document.documentElement.setAttribute("data-theme", storedTheme);
  } else {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }
})();

const rnbwFooterTemplate = `
<footer class="padding-xl flex width-full">
  <div class="gap-s row align-start flex width-full">
    <div class="gap-xl row justify-between flex width-full">
            <a href="https://bicycle.systems" target="_blank">
              <span>bicycle.systems</span>
            </a>

      <div class="column gap-s">
        <div class="row gap-xl">
          <div class="column gap-s">
            <a href="https://github.com/bicyclecomputer" target="_blank">
              <span>github</span>
            </a>
          </div>
        
           <div class="column align-start gap-s">

            <a href="#" id="theme-toggle">
              <span id="theme-name" class="opacity-s">system</span>
            </a>
          </div>
        </div>
        </div>
      </div>
    </div> 
  </div>
</footer>
`;

function updateThemeElementsVisibility() {
  const theme = document.documentElement.getAttribute("data-theme");
  const lightElements = document.querySelectorAll(".light");
  const darkElements = document.querySelectorAll(".dark");

  lightElements.forEach((element) => {
    element.style.display = theme === "dark" ? "none" : "";
  });

  darkElements.forEach((element) => {
    element.style.display = theme === "dark" ? "" : "none";
  });

  try {
    updateThemeImageNew(theme);
  } catch (error) {
    console.error('Error in updateThemeImageNew:', error);
  } finally {
    updateThemeImage(theme);
  }
}

function handleSystemThemeChange(e) {
  const storedTheme = localStorage.getItem("theme");
  if (storedTheme) return; // Don't override user preference

  const theme = e.matches ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", theme);
  updateThemeElementsVisibility();
  switchFavicon(theme);
}

const setSystemTheme = () => {
  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = isDark ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", theme);
  updateThemeElementsVisibility();
  switchFavicon(theme);
};

class RnbwFooter extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    this.innerHTML = rnbwFooterTemplate;
    this.initializeThemeToggle();
  }

  initializeThemeToggle() {
    const themeToggle = this.querySelector('#theme-toggle');
    const themeName = this.querySelector('#theme-name');

    if (themeToggle && themeName) {
      const storedTheme = localStorage.getItem("theme");
      themeName.textContent = storedTheme || "system";

      themeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        toggleTheme();
      });
    }

    updateThemeElementsVisibility();
  }
}

customElements.define("rnbw-footer", RnbwFooter);

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", handleSystemThemeChange);

const currentYear = new Date().getFullYear();
try {
  document.getElementById("year").innerHTML += currentYear;
} catch (error) {
  console.error('Error in setting year:', error);
}

document.addEventListener('DOMContentLoaded', function () {
  const themeName = document.querySelector("#theme-name");
  if (themeName) {
    const storedTheme = localStorage.getItem("theme");
    themeName.textContent = storedTheme || "system";
  }
});

function toggleTheme() {
  const themeName = document.querySelector("#theme-name");
  if (!themeName) return;

  switch (themeName.textContent) {
    case "system":
      document.documentElement.setAttribute("data-theme", "light");
      themeName.textContent = "light";
      localStorage.setItem("theme", "light");
      break;
    case "light":
      document.documentElement.setAttribute("data-theme", "dark");
      themeName.textContent = "dark";
      localStorage.setItem("theme", "dark");
      break;
    case "dark":
      localStorage.removeItem("theme");
      themeName.textContent = "system";
      setSystemTheme();
      break;
  }
  updateThemeElementsVisibility();
}

function switchFavicon(theme) {
  const link = document.querySelector("link[rel*='icon']");
  if (link) {
    link.type = 'image/png';
    link.rel = 'shortcut icon';
    link.href = `https://rnbw.design/images/favicon-${theme}.png`;
  }
}

function updateThemeImage(theme) {
  const image = document.getElementById('theme-image');
  if (image) {
    image.src = theme === 'dark' ? 'images/guide-dark.png' : 'images/guide-light.png';
  }
}

function updateThemeImageNew(theme) {
  const image = document.getElementById('theme-image-new');
  if (image) {
    if (theme === 'dark') {
      image.src = 'images/new-dark.svg';
    } else {
      image.src = 'images/new-light.svg';
    }
  }
} 