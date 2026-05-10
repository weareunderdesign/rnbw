const menu = document.querySelector("aside");
let lastScrollTop = 0;

function createMenuLinks() {
    const articles = document.querySelectorAll("div.row > div.view > div");
    const headerCounts = {};
    let currentLevel = 0;
    let levelStack = [];

    articles.forEach(article => {
        const headers = article.querySelectorAll("h1, h2, h3, h4, h5, h6");

        headers.forEach(header => {
            if (header.closest('design') !== null) {
                return;
            }

            const text = header.textContent.trim();
            let id = text.toLowerCase().replace(/\s+/g, "-");

            if (headerCounts[id] === undefined) {
                headerCounts[id] = 0;
            } else {
                headerCounts[id]++;
                id += `-${headerCounts[id] + 1}`;
            }

            const link = document.createElement("a");
            link.href = `#${id}`;
            link.style.display = "block";
            link.textContent = text;

            const menuItem = document.createElement("div");
            menuItem.classList.add("menu-item", "text-m");
            menuItem.appendChild(link);

            const headerLevel = parseInt(header.tagName.charAt(1));

            while (levelStack.length > 0 && levelStack[levelStack.length - 1] >= headerLevel) {
                levelStack.pop();
                currentLevel--;
            }

            if (levelStack.length === 0 || headerLevel > levelStack[levelStack.length - 1]) {
                currentLevel++;
                levelStack.push(headerLevel);
            }

            menuItem.style.paddingLeft = `${(currentLevel - 1) * 20}px`;
            menu.appendChild(menuItem);
            header.id = id;
        });
    });
}

createMenuLinks();

function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;

    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= windowHeight &&
        rect.right <= windowWidth
    );
}

let scrollTimer;
let headerVisibleFlag = false;

function highlightMenuLink() {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(function () {
        const menuLinks = document.querySelectorAll("aside .menu-item a");

        let st = window.scrollY || document.documentElement.scrollTop;
        if (st > lastScrollTop) {
            headerVisibleFlag = false;
            let newActiveLink = null;

            menuLinks.forEach(link => {
                const targetId = link.getAttribute("href").substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement && isElementInViewport(targetElement)) {
                    newActiveLink = link;
                    headerVisibleFlag = false;
                }
            });

            if (newActiveLink) {
                if (!newActiveLink.classList.contains("active")) {
                    menuLinks.forEach(link => {
                        link.classList.remove("active");
                        link.style.textDecoration = "";
                        link.style.textDecorationThickness = "";
                    });
                    newActiveLink.classList.add("active");
                    newActiveLink.style.textDecoration = "underline";
                    newActiveLink.style.textDecorationThickness = "1.5px";
                    const hash = newActiveLink.getAttribute("href").substring(1);
                    history.replaceState(null, null, `#${hash}`);
                }
            }
        }
        else if (st < lastScrollTop) {
            let newActiveIndex = null;
            menuLinks.forEach((link, index) => {
                const targetId = link.getAttribute("href").substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement && isElementInViewport(targetElement)) {
                    newActiveIndex = index;
                    headerVisibleFlag = true;
                }
            });

            menuLinks.forEach(link => {
                link.classList.remove("active");
                link.style.textDecoration = "";
                link.style.textDecorationThickness = "";
            });

            if (newActiveIndex !== null) {
                menuLinks[newActiveIndex].classList.add("active");
                menuLinks[newActiveIndex].style.textDecoration = "underline";
                menuLinks[newActiveIndex].style.textDecorationThickness = "1.5px";
                lastActiveIndex = newActiveIndex;
                const hash = menuLinks[newActiveIndex].getAttribute("href").substring(1);
                history.replaceState(null, null, `#${hash}`);
            } else {
                if (headerVisibleFlag && lastActiveIndex > 0) {
                    menuLinks[lastActiveIndex - 1].classList.add("active");
                    menuLinks[lastActiveIndex - 1].style.textDecoration = "underline";
                    menuLinks[lastActiveIndex - 1].style.textDecorationThickness = "1.5px";
                    const hash = menuLinks[lastActiveIndex - 1].getAttribute("href").substring(1);
                    history.replaceState(null, null, `#${hash}`);
                }
                else if (!headerVisibleFlag && lastActiveIndex > 0) {
                    menuLinks[lastActiveIndex].classList.add("active");
                    menuLinks[lastActiveIndex].style.textDecoration = "underline";
                    menuLinks[lastActiveIndex].style.textDecorationThickness = "1.5px";
                    const hash = menuLinks[lastActiveIndex].getAttribute("href").substring(1);
                    history.replaceState(null, null, `#${hash}`);
                }
            }
        }

        lastScrollTop = st <= 0 ? 0 : st;
    }, 5);
}

function activateOnHover() {
    const menuLinks = document.querySelectorAll("aside .menu-item a");

    menuLinks.forEach(link => {
        link.addEventListener("mouseenter", function () {
            this.classList.add("active");
            this.style.textDecoration = "underline";
            this.style.textDecorationThickness = "1.5px";
        });
        link.addEventListener("mouseleave", function () {
            const hash = window.location.hash.substring(1);
            if (hash !== this.getAttribute("href").substring(1)) {
                this.classList.remove("active");
                this.style.textDecoration = "";
                this.style.textDecorationThickness = "";
            }
        });

        link.addEventListener("click", function (event) {
            event.preventDefault();
            menuLinks.forEach(otherLink => {
                if (otherLink !== link) {
                    otherLink.classList.remove("active");
                    otherLink.style.textDecoration = "";
                    otherLink.style.textDecorationThickness = "";
                }
            });
            link.classList.add("active");
            link.style.textDecoration = "underline";
            link.style.textDecorationThickness = "1.5px";

            const targetId = link.getAttribute("href").substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                const offsetPercent = 40;
                const offsetVH = (window.innerHeight * offsetPercent) / 100;

                const targetPosition = targetElement.offsetTop - offsetVH;
                window.scrollTo({
                    top: targetPosition,
                    behavior: "smooth"
                });
                history.pushState(null, null, `#${targetId}`);
            }
        });
    });
}

activateOnHover();
window.addEventListener("scroll", highlightMenuLink);
window.addEventListener("hashchange", function () {
    const hash = window.location.hash.substring(1);
    const targetLink = document.querySelector(`aside .menu-item a[href="#${hash}"]`);
    if (targetLink) {
        document.querySelectorAll("aside .menu-item a").forEach(link => {
            link.classList.remove("active");
        });
        targetLink.classList.add("active");
    }
});