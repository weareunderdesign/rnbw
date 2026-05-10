const rnbwEditor = `
<div class="row radius-s border border" id="rnbw-editor"
style="height: 950px">
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
                <span class="text-s opacity-m">/</span><span class="text-s">...</span><span
                    class="text-s opacity-m">/</span>
                <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#page"/></svg>
                <span class="text-s">File</span>
            </div>
        </div>
        <div class="border-bottom">
            <div class="justify-between padding-xs">
                <div class="gap-s padding-xs">
                    <div class="icon-xs"></div>
                    <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#image"/></svg>
                    <span class="text-s">Image</span>
                </div>
            </div>
            <div class="justify-between padding-xs">
                <div class="gap-s padding-xs">
                    <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#down"/></svg>
                    <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#div"/></svg>
                    <span class="text-s">Div</span>
                </div>
            </div>
            <div>
                <div class="justify-between padding-xs">
                    <div class="gap-s padding-xs">
                        <div class="icon-xs"></div>
                        <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#down"/></svg>
                        <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#div"/></svg>
                        <span class="text-s">Element</span>
                    </div>
                </div>
                <div>
                    <div class="justify-between padding-xs background-secondary" id="logo">
                        <div class="gap-s padding-xs">
                            <div class="icon-xs"></div>
                            <div class="icon-xs"></div>
                            <div class="icon-xs"></div>
                            <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#image"/></svg>
                            <span class="text-s">Logo</span>
                        </div>
                    </div>
                    <div class="justify-between padding-xs background-secondary hide" id="anim4">
                         <div class="gap-s padding-xs">
                            <div class="icon-xs"></div>
                            <div class="icon-xs"></div>
                            <div class="icon-xs"></div>
                            <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#heading"/></svg>
                            <span class="text-s">Heading 1</span>
                        </div>
                    </div>
                    <div class="justify-between padding-xs">
                        <div class="gap-s padding-xs">
                            <div class="icon-xs"></div>
                            <div class="icon-xs"></div>
                            <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#right"/></svg>
                            <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#div"/></svg>
                            <span class="text-s">Element</span>
                        </div>
                    </div>
                    <div class="justify-between padding-xs">
                        <div class="gap-s padding-xs">
                            <div class="icon-xs"></div>
                            <div class="icon-xs"></div>
                            <div class="icon-xs"></div>
                            <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#div"/></svg>
                            <span class="text-s">Element</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="justify-between padding-xs">
                <div class="gap-s padding-xs">
                    <div class="icon-xs"></div>
                    <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#right"/></svg>
                    <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#div"/></svg>
                    <span class="text-s">Element</span>
                </div>
            </div>
        </div>
    </div>
  
</div>

<div class="flex-1 column gap-m padding-m">
    <h4 class="border">
        "The first web browser was also an editor. The idea
        being that not only could everyone read content on
        the web, but they could also help create it. It was
        to be a collaborative space for everyone."
        <br>
    </h4>
    <img src="./images/tim_berners.png" style="width: 34vw; height: 22vw;">
    <i>Sir Tim Berners-Lee</i>

    <h1 class="border" style="display:none;" id="anim-heading">Write Something</h1>
    <div class="gap-s column flex width-50">
        <div class="flex width-full size-dropdown gap-xs" >
        <span class="cursor"></span><span class="anim opacity-m" id="anim1" style="opacity:0.5";>
            Press '/' for commands </span>
            
        </div>

        <div class="size-dropdown shadow column radius-xs background-primary border anim" id="anim2" style="opacity:0;width:100%;">
            <div class="border-bottom flex width-full column" id ="anim3">
                <div class="align-start padding-s background-secondary-onhover gap-s">
                    <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#code-js"/></svg>
                    <span class="text-s">Page</span>
                </div>
                <div class="align-start padding-s background-secondary-onhover gap-s" id="filtered-option">
                    <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#heading"/></svg>
                    <span class="text-s">Heading</span>
                </div>
                <div class="align-start padding-s background-secondary-onhover gap-s">
                    <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#text"/></svg>
                    <span class="text-s">Span</span>
                </div>
                <div class="align-start padding-s background-secondary-onhover gap-s">
                    <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#image"/></svg>
                    <span class="text-s">Image</span>
                </div>
                <div class="align-start padding-s background-secondary-onhover gap-s">
                    <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#link"/></svg>
                    <span class="text-s">Link</span>
                </div>
            </div>
            <div class="flex width-full column">
                <div class="padding-s justify-start">
                    <div class="gap-s align-center justify-center">
                        <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#bullet"/></svg>
                        <div class="text-s">
                            <span class="text-m">Create...</span>
                        </div>
                    </div>
                </div>
                <div class="padding-s justify-start">
                    <div class="gap-s align-center justify-center">
                        <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#brush"/></svg>
                        <div class="text-s">
                            <span class="opacity-m text-m">Stylesheet1/</span><span
                                class="text-m">Style1</span>
                        </div>
                    </div>
                </div>
                <div class="padding-s justify-start">
                    <div class="gap-s align-center justify-center">
                        <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#component"/></svg>
                        <span class="text-m">Component 1</span>
                    </div>
                </div>
                <div class="gap-s padding-s">
                    <div class="gap-s align-center justify-center">
                        <div class="text-s">
                            <span class="opacity-m text-m">images/</span><span
                                class="text-m">image1.png</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
</div>`;

class RnbwEditor extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = rnbwEditor;
  }
}

customElements.define("rnbw-editor", RnbwEditor);
// Add CSS styles
const style = document.createElement("style");
style.innerHTML = `
    rnbw-editor .anim {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.5s, transform 0.5s;
    }

    rnbw-editor .hide{
        display: none;
        transition: opacity 0.5s, transform 0.5s;
    }


    rnbw-editor .anim.is-visible {
        opacity: 1;
        transform: translateY(0);
        }
      rnbw-editor .cursor {
      display: inline-block;
      width: 0.01em;
      height: 1em;
      // margin-right: 0.1em;
      background-color: var(--color-primary-foreground);
      
      position: absolute;
      animation: blink 0.2s infinite;
    }

  `;
document.head.appendChild(style);
document.addEventListener("DOMContentLoaded", () => {
  const rnbwMapElement = document.querySelector("rnbw-editor");

  function getAnimationSection() {
    let anim1Div = rnbwMapElement.querySelectorAll("#anim1")[0];
    let anim2Div = rnbwMapElement.querySelectorAll("#anim2")[0];
    let anim3Div = rnbwMapElement.querySelectorAll("#anim3")[0];
    let anim4Div = rnbwMapElement.querySelectorAll("#anim4")[0];
    return { anim1Div, anim2Div, anim3Div, anim4Div };
  }

  const { anim1Div, anim2Div, anim3Div } = getAnimationSection();
  const fadeInSections = [anim1Div, anim2Div, anim3Div];

  let delay = 0;
  let charIndex = 0;
  let index = 0;

  const fadeInOnScroll = (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      setTimeout(async () => {
        await entry.target.classList.add("is-visible");
        setTimeout(() => {
          let cursor = document.querySelectorAll("rnbw-editor .cursor")[0];
          let opacity = cursor.style.opacity;
          if (opacity == 0) {
            cursor.style.opacity = 1;
          } else {
            cursor.style.opacity = 0;
          }
        }, 400);

        if (entry.target.id == "anim2") {
          let cursor = document.querySelectorAll("rnbw-editor .cursor")[0];
          setTimeout(() => {
            setAnim1();
            cursor.style.opacity = 0;
          }, 1000);
          setTimeout(() => {
            type();
          }, 2000);

          setTimeout(() => {
            let anim1 = document.querySelectorAll("rnbw-editor #anim1");
            anim1.forEach((span) => (span.textContent = "/h"));
            filterAndSelectDiv();
          }, 2000);
        }
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
  function setAnim1() {
    let anim1 = document.querySelectorAll("rnbw-editor #anim1");
    anim1.forEach((span) => span.setAttribute("data-text", "/"));
    anim1.forEach((span) => (span.textContent = "/"));
    document.getElementById("anim2").style.opacity = 1;
  }

  function type() {
    if (index < anim1.length) {
      anim1[index].classList.remove("hidden");
      const originalText = anim1[index].getAttribute("data-text");
      if (!!originalText && charIndex < originalText.length) {
        anim1[index].textContent = originalText.slice(0, charIndex + 1);
        charIndex++;

        setTimeout(type, delay);
        delay += 30;
      } else {
        charIndex = 0;
        index++;
        setTimeout(type, delay);
        delay += 30;
      }
    }
  }

  function filterAndSelectDiv() {
    const { anim1Div, anim2Div, anim3Div, anim4Div } = getAnimationSection();
    let anim3DivChildren = anim3Div.children;
    for (let i = 0; i < anim3DivChildren.length; i++) {
      let delay = 0;
      if (anim3DivChildren[i].id == "filtered-option") {
        setTimeout(() => {
          anim3DivChildren[i].classList.add("background-secondary");
        }, delay);
        delay += 10;
        continue;
      }
      setTimeout(() => {
        anim3DivChildren[i].classList.add("hide");
      }, delay);
      delay += 50;
    }
    setTimeout(() => {
      const animHeading = document.getElementById("anim-heading");
      animHeading.style.display = "block";
    }, delay);

    setTimeout(() => {
      anim1Div.classList.add("hide");
      anim2Div.classList.add("hide");
      document.getElementById("logo").classList.remove("background-secondary");
      anim4Div.classList.remove("hide");

      setTimeout(() => {
        reset();

        setTimeout(() => {
          const { anim1Div, anim2Div, anim3Div } = getAnimationSection();
          const fadeInSections = [anim1Div, anim2Div, anim3Div];
          delay = 0;
          charIndex = 0;
          index = 0;
          //   restart intersection observer
          fadeInSections.forEach((section) => {
            observer.observe(section);
          });
        }, 1000);
      }, 1000);
    }, delay);
  }

  function reset() {
    const { anim1Div, anim2Div, anim3Div, anim4Div } = getAnimationSection();
    const element = document.getElementById("rnbw-editor");
    element.style.transition = "opacity 0.5s ease-in-out";
    // element.style.opacity = 0;
    setTimeout(() => {
      anim4Div.classList.add("hide");
      anim1Div.classList.remove("hide");
      anim2Div.classList.remove("hide");
      document.getElementById("logo").classList.remove("background-secondary");
      const animHeading = document.getElementById("anim-heading");
      animHeading.style.display = "none";
      let anim3DivChildren = anim3Div.children;
      for (let i = 0; i < anim3DivChildren.length; i++) {
        if (anim3DivChildren[i].id == "filtered-option") {
          anim3DivChildren[i].classList.remove("background-secondary");
          continue;
        }
        anim3DivChildren[i].classList.remove("hide");
      }

      let anim1 = document.querySelectorAll("rnbw-editor #anim1");
      document.getElementById("anim2").style.opacity = 0;
      anim1.forEach((span) => {
        span.textContent = "Press '/' for commands";
        span.removeAttribute("data-text");
      });
    }, 500);
  }
  fadeInSections.forEach((section) => {
    observer.observe(section);
  });
});
