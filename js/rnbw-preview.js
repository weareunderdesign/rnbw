const rnbwPreviewTemplate = `
<div class="row radius-s border" id="rnbw-preview-wrapper"
    style="flex-direction:row; flex-wrap:nowrap; min-height: 820px;">
    <div class="column hidden-on-mobile justify-between border-right" style="width:calc(var(--base-size)*60)">
        <div class="column" style="width:calc(var(--base-size)*60)">
            <div class="justify-between padding-s border-bottom">
                <div class="gap-s align-center justify-center">
                    <div class="radius-l icon-s align-center justify-center background-secondary"></div>
                    <span class="text-s opacity-m">/</span>
                    <div class="gap-s align-center justify-center radius-s">
                        <div class="radius-l icon-s align-center justify-center background-secondary"></div>
                        <span class="text-s">Project</span>
                    </div>
                </div>
            </div>
            <div class="border-bottom">
                <div class="justify-between padding-xs">
                    <div class="gap-s padding-xs">
                        <div class="icon-xs"></div>
                        <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#page"/></svg>
                        <span class="text-s">Page</span>
                    </div>
                    <div class="row"></div>
                </div>
                <div class="justify-between padding-xs">
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

                <div class="justify-between padding-xs">
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
            <div class="">
                <div class="justify-between padding-xs background-tertiary">
                    <div class="gap-s padding-xs">
                        <svg class="hidden"><use href="#down"/></svg>
                        <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#heading"/></svg>
                        <span class="text-s">Heading 3</span>
                    </div>
                </div>

                <div>
                    <div class="justify-between padding-xs background-secondary" id="span1" style="opacity:0;">
                        <div class="gap-s padding-xs">
                            <div class="icon-xs"></div>
                            <div class="icon-xs"></div>
                            <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#div"/></svg>
                            <span class="text-s">Span</span>
                        </div>
                    </div>
                    <div class="justify-between padding-xs background-secondary" id="span2" style="opacity:0;">
                        <div class="gap-s padding-xs">
                            <div class="icon-xs"></div>
                            <div class="icon-xs"></div>
                            <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#div"/></svg>
                            <span class="text-s">Span</span>
                        </div>
                    </div>

                    <div class="justify-between padding-xs background-secondary" id="span3" style="opacity:0;">
                        <div class="gap-s padding-xs">
                            <div class="icon-xs"></div>
                            <div class="icon-xs"></div>
                            <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#div"/></svg>
                            <span class="text-s">Span</span>
                        </div>
                    </div>

                    <div class="justify-between padding-xs background-secondary" id="span4" style="opacity:0;">
                        <div class="gap-s padding-xs">
                            <div class="icon-xs"></div>
                            <div class="icon-xs"></div>
                            <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#div"/></svg>
                            <span class="text-s">Span</span>
                        </div>
                    </div>

                    <div class="justify-between padding-xs background-secondary" id="span10" style="opacity:0;">
                        <div class="gap-s padding-xs">
                            <div class="icon-xs"></div>
                            <div class="icon-xs"></div>
                            <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#div"/></svg>
                            <span class="text-s">Image</span>
                        </div>
                    </div>

                    <div class="justify-between padding-xs background-secondary" id="span5" style="opacity:0;">
                        <div class="gap-s padding-xs">
                            <div class="icon-xs"></div>
                            <div class="icon-xs"></div>
                            <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#div"/></svg>
                            <span class="text-s">Span</span>
                        </div>
                    </div>

                    <div class="justify-between padding-xs background-secondary" id="span6" style="opacity:0;">
                        <div class="gap-s padding-xs">
                            <div class="icon-xs"></div>
                            <div class="icon-xs"></div>
                            <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#div"/></svg>
                            <span class="text-s">Span</span>
                        </div>
                    </div>

                    <div class="justify-between padding-xs background-secondary" id="span7" style="opacity:0;">
                        <div class="gap-s padding-xs">
                            <div class="icon-xs"></div>
                            <div class="icon-xs"></div>
                            <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#div"/></svg>
                            <span class="text-s">Span</span>
                        </div>
                    </div>

                    <div class="justify-between padding-xs background-secondary" id="span11" style="opacity:0;">
                        <div class="gap-s padding-xs">
                            <div class="icon-xs"></div>
                            <div class="icon-xs"></div>
                            <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#div"/></svg>
                            <span class="text-s">Image</span>
                        </div>
                    </div>

                    <div class="justify-between padding-xs background-secondary" id="span8" style="opacity:0;">
                        <div class="gap-s padding-xs">
                            <div class="icon-xs"></div>
                            <div class="icon-xs"></div>
                            <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#div"/></svg>
                            <span class="text-s">Span</span>
                        </div>
                    </div>

                    <div class="justify-between padding-xs background-secondary" id="span9" style="opacity:0;">
                        <div class="gap-s padding-xs">
                            <div class="icon-xs"></div>
                            <div class="icon-xs"></div>
                            <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#div"/></svg>
                            <span class="text-s">Span</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
        <div>
            <div class="padding-m gap-s column border-bottom border-top" style="width:calc(var(--base-size)*60)">
                <div class="justify-between align-center justify-center">
                    <span class="text-s">Settings</span>
                    <div class="row gap-s justify-end">
                        <div class="padding-xs radius-xs">
                            <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#plus"/></svg>
                        </div>
                    </div>
                </div>
            </div>
            <div class="column padding-m gap-s" style="width:calc(var(--base-size)*60)">
                <div class="justify-between">
                    <div class="gap-s flex-1">
                        <span class="text-s">Styles</span>
                    </div>
                    <div class="gap-s justify-end">
                        <div class="padding-xs radius-xs">
                            <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#plus"/></svg>
                        </div>
                    </div>
                </div>
                <div class="gap-s">
                    <div class="gap-xs border radius-xs padding-xs">
                        <span class="text-s">Style1</span>
                    </div>
                    <div class="gap-xs border radius-xs padding-xs inverse-secondary">
                        <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#cross"/></svg>
                        <span class="text-s">Style2</span>
                    </div>
                    <div class="padding-xs radius-xs">
                        <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#states"/></svg>
                    </div>
                    <div class="background-secondary-onhover padding-xs radius-xs">
                        <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#media"/></svg>
                    </div>
                </div>
                <div class="justify-between">
                    <div class="gap-s flex-1 justify-start align-center justify-center">
                        <div class="padding-xs radius-xs background-secondary">
                            <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#width"/></svg>
                        </div>
                        <span class="text-s">Width</span>
                    </div>
                    <div class="gap-s">
                        <span class="text-s">24px</span>
                    </div>
                </div>
                <div class="justify-between opacity-m">
                    <div class="gap-s flex-1 justify-start align-center justify-center">
                        <div class="padding-xs radius-xs">
                            <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#flex"/></svg>
                        </div>
                        <span class="text-s">Display</span>
                    </div>
                    <div class="row gap-s">
                        <span class="text-s">Flex</span>
                    </div>
                </div>
                <div class="justify-between">
                    <div class="gap-s flex-1 justify-start align-center justify-center">
                        <div class="padding-xs radius-xs background-secondary">
                            <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#relative"/></svg>
                        </div>
                        <span class="text-s">Position</span>
                    </div>
                    <div class="row gap-s">
                        <span class="text-s">Relative</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="flex width-50 gap-l column padding-m">
    <h3 style="font-size: 2.38rem;">
        <span class="hidden" style="color: #006400">rnbw 🌈 is a modern design and code editor 💻 .</span>
        <span class="hidden" style="color: #0000cd">it makes your html, css, js designable.</span>
        <span class="hidden" style="color: #800080">when the code changes,</span>
        <span class="hidden" style="color: #ee82ee">the design changes</span>
        <img class="hidden" src="https://rnbw.design/images/rnbwanimation1.png" style="width: auto; height: 2.19vw;">
        <span class="hidden" style="color: #ee82ee">.</span>
        <span class="hidden" style="color: #ff4500">when the design changes,</span>
        <span class="hidden" style="color: #ffa500">the code changes.</span>
        <img class="hidden" src="https://rnbw.design/images/rnbwanimation2.png" style="width: auto; height: 2.19vw;">
        <span class="hidden" style="color: #ffa500">and,</span>
        <span class="hidden" style="color: #ffd700">that's it!</span>
    </h3>
        <style>
        .hidden {
            display: none;
        }
        img {
            display: inline;
        }
    </style>
</div>
    <div class="hidden-on-mobile flex width-50 padding-l border-left border-left" style="word-break: break-word;">
        <code>
        </code>
    </div>
</div>
`;

class RnbwPreview extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = rnbwPreviewTemplate;
    }
}

customElements.define("rnbw-preview", RnbwPreview);

let darkTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

document.addEventListener("DOMContentLoaded", function () {
    const rnbwPreviewElement = document.querySelector("rnbw-preview");

    const options = {
        root: null,
        rootMargin: "0px",
        threshold: 0.1,
    };

    const observer = new IntersectionObserver(animateOnIntersect, options);

    let text = "";

    function animateOnIntersect(entries, observer) {
        if (entries[0].isIntersecting) {
            observer.unobserve(rnbwPreviewElement);
            const h3 = document.querySelector("h3");
            const spans = h3.querySelectorAll("span");
            let index = 0;
            let charIndex = 0;

            function type() {
                if (index < spans.length) {
                    spans[index].classList.remove("hidden");
                    const originalText = spans[index].getAttribute("data-text");
                    if (index === 0) {
                        let heading3DropdownIcon = document.getElementById(
                            "heading3-dropdown-icon"
                        );
                        if (heading3DropdownIcon) heading3DropdownIcon.classList.remove("hidden");
                    }
                    if (charIndex < originalText.length) {
                        spans[index].textContent = originalText.slice(0, charIndex + 1);
                        charIndex++;
                        setTimeout(type, 20);
                    } else {
                        charIndex = 0;
                        index++;
                        if (index === 4) {
                            setTimeout(type, 20);
                            document.getElementById("span4").style.opacity = 1;
                            document.getElementById("span10").style.opacity = 1;
                            document.getElementById("span5").style.opacity = 1;
                        } else if (index === 7) {
                            setTimeout(type, 20);
                            document.getElementById("span7").style.opacity = 1;
                            document.getElementById("span11").style.opacity = 1;
                            document.getElementById("span8").style.opacity = 1;
                        } else {
                            if (index !== 4 && index !== 7) {
                                document.getElementById("span" + (index)).style.opacity = 1;
                            }
                            setTimeout(type, 800);
                        }
                    }
                } else {
                    setTimeout(() => {
                        reset();
                    }, 4000);
                }
                if (index === 4) {
                    setTimeout(() => {
                        const firstImage = h3.querySelector("img:nth-of-type(1)");
                        firstImage.classList.remove("hidden");
                    }, 20);
                }

                if (index === 7) {
                    setTimeout(() => {
                        const secondImage = h3.querySelector("img:nth-of-type(2)");
                        secondImage.classList.remove("hidden");
                    }, 20);
                }

            }

            function updateTextColor() {
                darkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const spans = document.querySelectorAll("code span");
                spans.forEach(span => {
                    const text = span.textContent;
                    span.innerHTML = '';
                    for (let i = 0; i < text.length; i++) {
                        const charSpan = document.createElement('span');
                        charSpan.textContent = text[i];
                        if (
                            ((text[i - 1] === "<" || text[i - 1] === "/") && text[i] === "s") ||
                            ((text[i - 2] === "<" || text[i - 2] === "/") && text[i - 1] === "s" && text[i] === "p") ||
                            ((text[i - 3] === "<" || text[i - 3] === "/") && text[i - 2] === "s" && text[i - 1] === "p" && text[i] === "a") ||
                            ((text[i - 4] === "<" || text[i - 4] === "/") && text[i - 3] === "s" && text[i - 2] === "p" && text[i - 1] === "a" && text[i] === "n") ||

                            ((text[i - 1] === "<" || text[i - 1] === "/") && text[i] === "i") ||
                            ((text[i - 2] === "<" || text[i - 2] === "/") && text[i - 1] === "i" && text[i] === "m") ||
                            ((text[i - 3] === "<" || text[i - 3] === "/") && text[i - 2] === "i" && text[i - 1] === "m" && text[i] === "g") ||

                            ((text[i - 1] === "<" || text[i - 1] === "/") && text[i] === "d") ||
                            ((text[i - 2] === "<" || text[i - 2] === "/") && text[i - 1] === "d" && text[i] === "i") ||
                            ((text[i - 3] === "<" || text[i - 3] === "/") && text[i - 2] === "d" && text[i - 1] === "i" && text[i] === "v") ||

                            ((text[i - 1] === "<" || text[i - 1] === "/") && text[i] === "h") ||
                            ((text[i - 2] === "<" || text[i - 2] === "/") && text[i - 1] === "h" && text[i] === "3")
                        ) {
                            charSpan.style.color = darkTheme ? '#569CD6' : '#95261F';
                        }
                        span.appendChild(charSpan);
                    }
                });
            }

            if (window.matchMedia) {
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateTextColor);
            }

            const textArray = [
                "<div>",
                "<h3>",
                "<span>rnbw 🌈 is a modern design and code editor 💻 .</span>",
                "<span>it makes your html, css, js designable.</span>",
                "<span>when the code changes,</span>",
                "<span>the design changes</span>",
                "<img>",
                "<span>.</span>",
                "<span>when the design changes,</span>",
                "<span>the code changes.</span>",
                "<img>",
                "<span>and,</span>",
                "<span>that's it!</span>",
                "</h3>",
                "</div>"
            ];

            const marginValues = [
                "0rem",
                "0.578rem",
                "1.156rem",
                "1.156rem",
                "1.156rem",
                "1.156rem",
                "1.156rem",
                "1.156rem",
                "1.156rem",
                "1.156rem",
                "1.156rem",
                "1.156rem",
                "1.156rem",
                "0.578rem",
                "0rem"
            ];

            const code = document.querySelector("code");

            async function typeText(text, delay = 12, darkTheme) {
                return new Promise(resolve => {
                    const span = document.createElement('span');
                    span.style.display = 'block';
                    span.style.marginLeft = marginValues.shift();
                    code.appendChild(span);
                    let index = 0;
                    const intervalId = setInterval(() => {
                        if (index === text.length) {
                            clearInterval(intervalId);
                            resolve();
                        } else {
                            const charSpan = document.createElement('span');
                            charSpan.textContent = text[index];
                            if (
                                (text[index] === "s" && text[index + 1] === "p" && text[index + 2] === "a" && text[index + 3] === "n") ||
                                (text[index - 1] === "s" && text[index] === "p" && text[index + 1] === "a" && text[index + 2] === "n") ||
                                (text[index - 2] === "s" && text[index - 1] === "p" && text[index] === "a" && text[index + 1] === "n") ||
                                (text[index - 3] === "s" && text[index - 2] === "p" && text[index - 1] === "a" && text[index] === "n") ||

                                (text[index] === "i" && text[index + 1] === "m" && text[index + 2] === "g") ||
                                (text[index - 1] === "i" && text[index] === "m" && text[index + 1] === "g") ||
                                (text[index - 2] === "i" && text[index - 1] === "m" && text[index] === "g") ||

                                (text[index] === "d" && text[index + 1] === "i" && text[index + 2] === "v") ||
                                (text[index - 1] === "d" && text[index] === "i" && text[index + 1] === "v") ||
                                (text[index - 2] === "d" && text[index - 1] === "i" && text[index] === "v") ||

                                (text[index] === "h" && text[index + 1] === "3") ||
                                (text[index - 1] === "h" && text[index] === "3")
                            ) {
                                darkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
                                charSpan.style.color = darkTheme ? '#569CD6' : '#95261F';
                            }
                            span.appendChild(charSpan);
                            index++;
                        }
                    }, delay);
                });
            }

            async function typeCode() {
                for (let i = 0; i < textArray.length; i++) {
                    if (i === 0) {
                        await new Promise(resolve => setTimeout(resolve, 0));
                    } else if (i === 1 || i === 2 || i === 6 || i === 7 || i === 10 || i === 11 || i === 13 || i === 14) {
                        await new Promise(resolve => setTimeout(resolve, 12));
                    }
                    else if (i === 3 || i === 4) {
                        await new Promise(resolve => setTimeout(resolve, 950));
                    }
                    else {
                        await new Promise(resolve => setTimeout(resolve, 700));
                    }
                    await typeText(textArray[i], 12, darkTheme);
                }
            }


            typeCode();
            spans.forEach((span) => span.setAttribute("data-text", span.textContent));
            spans.forEach((span) => (span.textContent = ""));
            type();
        }
    }

    function reset() {
        const code = document.querySelector("code");
        while (code.firstChild) {
            code.removeChild(code.firstChild);
        }
        const spans = document.querySelectorAll("h3 span");
        spans.forEach((span, i) => {
            span.classList.add("hidden");
            document.getElementById("span" + (i + 1)).style.opacity = 0
            document.getElementById("span10").style.opacity = 0;
            document.getElementById("span11").style.opacity = 0;
        });

        let heading3DropdownIcon = document.getElementById(
            "heading3-dropdown-icon"
        );
        if (heading3DropdownIcon) heading3DropdownIcon.classList.add("hidden");

        const images = document.querySelectorAll("h3 img");
        images.forEach((img) => img.classList.add("hidden"));

        timer = 1500;

        setTimeout(() => {
            observer.observe(rnbwPreviewElement);
        }, 1500);
    }

    observer.observe(rnbwPreviewElement);
});
