const rnbwBlog = `
<div
class="flex-1 align-center justify-center radius-s padding-l border"

id="blog-wrapper"
>
<div style="position: absolute; left: 24px; top: 24px; right: 24px"
>
  <article style="opacity:0; transition: opacity 0.5s; transition-delay: 0.5s;" id="anim-5">
    <h2>Blog Post Title</h2>
    <p>Posted on April 30, 2023 by Author Name</p>
    <h2>👋</h2>
    <p>
      This is the first paragraph of the blog post. It should be
      engaging and give readers an idea of what to expect in the rest
      of the article.
    </p>
    <h3>Subheading 1</h3>
    <p>
      This paragraph is part of the first section, which has a
      subheading to help organize the content.
    </p>
    <h3>Subheading 2</h3>
    <p>
      This paragraph is part of the second section, which also has a
      subheading for organization purposes.
    </p>
  </article>
</div>
<div
  class="row shadow radius-s flex width-50 border"
  style="z-index: 999"
  id="anim-6"
>
  <div class="gap-m border-bottom padding-m justify-between flex width-full">
    <div class="gap-s column">
      <div class="justify-start gap-s padding-s">
        <div>
          <span class="text-l opacity-m" id="anim-1" data-type="create a blog post layout">
          Do something...
          </span>
        </div>
      </div>
    </div>
  </div>
  <div class="column align-stretch flex width-full padding-m">
    <div class="column align-stretch" id="anim-4">
      <div class="padding-m gap-s">
        <span class="text-s opacity-m">Generate</span>
      </div>
      <div
        class="justify-between padding-s background-secondary radius-xs"
      >
        <div class="gap-s align-center justify-center">
          <div class="padding-xs">
            <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#repeat-x"/></svg>
          </div>
          <span class="text-m">Continue</span>
        </div>
      </div>
      <div class="justify-between padding-s radius-xs">
        <div class="gap-s align-center justify-center">
          <div class="padding-xs">
            <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#bullet"/></svg>
          </div>
          <span class="text-m">Create</span>
        </div>
      </div>
      <div class="justify-between padding-s radius-xs">
        <div class="gap-s align-center justify-center">
          <div class="padding-xs">
            <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#help"/></svg>
          </div>
          <span class="text-m">Explain</span>
        </div>
      </div>
      <div class="justify-between padding-s radius-xs">
        <div class="gap-s align-center justify-center">
          <div class="padding-xs">
            <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#events"/></svg>
          </div>
          <span class="text-m">Brainstorm </span>
        </div>
      </div>
      <div class="padding-m gap-s">
        <span class="text-s opacity-m">Edit</span>
      </div>
      <div class="justify-between padding-s radius-xs">
        <div class="gap-s align-center justify-center">
          <div class="padding-xs">
            <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#bubble"/></svg>
          </div>
          <span class="text-m">Change tone</span>
        </div>
      </div>
      <div class="justify-between padding-s radius-xs">
        <div class="gap-s align-center justify-center">
          <div class="padding-xs">
            <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#edit"/></svg>
          </div>
          <span class="text-m">Improve Writing </span>
        </div>
      </div>
      <div class="justify-between padding-s radius-xs">
        <div class="gap-s align-center justify-center">
          <div class="padding-xs">
            <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#location"/></svg>
          </div>
          <span class="text-m">Simplify </span>
        </div>
      </div>
      <div class="padding-m gap-s" id="anim-2">
        <span class="text-s opacity-m" >Recent</span>
      </div>
      <div class="justify-between padding-s radius-xs" id="anim-3">
        <div class="gap-s align-center justify-center">
          <div class="padding-xs">
            <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#bullet-outlined"/></svg>
          </div>
          <span class="text-m">Create a blog post layout</span>
        </div>
      </div>
      <div class="justify-between padding-s radius-xs">
        <div class="gap-s align-center justify-center">
          <div class="padding-xs">
            <svg class="icon-xs" viewBox="0 0 12 12" fill="currentColor"><use href="#bullet-outlined"/></svg>
          </div>
          <span class="text-m"
            >Create a pricing section with the active components
            libraries</span
          >
        </div>
      </div>
    </div>
  </div>
  <div class="flex width-full row align-stretch"></div>
</div>
</div>
`;

class RnbwBlog extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = rnbwBlog;
  }
}

customElements.define("rnbw-blog", RnbwBlog);
const rules = `
.fade-in {
  opacity: 0;
  transition: opacity 0.5s ease-in-out;
}

.fade-in.show {
  opacity: 1;
}

#blog-wrapper {
  min-height: 610px;
  position: relative;
}

@media (max-width: 768px) {
  #blog-wrapper {
    min-height: 850px;
  }
}
@media (max-width: 350px) {
  #blog-wrapper {
    min-height: 1000px;
  }
}
`;
if (!!style) style.innerHTML = style.innerHTML + rules;

document.addEventListener("DOMContentLoaded", function () {
  const rnbwBlogElement = document.querySelector("rnbw-blog");

  function getAnimationElements() {
    return {
      anim1: rnbwBlogElement.querySelector("#anim-1"),
      anim3: rnbwBlogElement.querySelector("#anim-3"),
      anim4: rnbwBlogElement.querySelector("#anim-4"),
      anim5: rnbwBlogElement.querySelector("#anim-5"),
      anim6: rnbwBlogElement.querySelector("#anim-6"),
    };
  }

  const { anim1 } = getAnimationElements();
  let delay = 250;

  const options = {
    root: null,
    rootMargin: "0px",
    threshold: 0.1,
  };

  const observer = new IntersectionObserver(animateOnIntersect, options);
  observer.observe(anim1);

  function makeAnim5ChildrenInvisible() {
    const { anim5 } = getAnimationElements();
    let anim5DivChildren = Array.from(anim5.children);
    anim5.style.opacity = 0;
    anim5DivChildren.forEach((child) => {
      child.style.opacity = 0;
      //add transition
      child.style.transition = "opacity 0.5s ease-in-out";
    });
  }

  function animateOnIntersect(entries, observer) {
    setTimeout(() => {
      makeAnim5ChildrenInvisible();
      type();
    }, 1000);
    observer.unobserve(entries[0].target);
  }

  const span = document.querySelector("rnbw-blog #anim-1");

  let i = 0;
  const text = span.dataset.type;
  function type() {
    if (i < text.length) {
      if (i == 0) {
        span.textContent = "";
      }
      if (i === 1) {
        filterAndSelectDiv();
      }
      span.textContent += text.charAt(i);
      i++;
      delay += 50;
      setTimeout(type, 200); // adjust the delay time as needed
    }
  }

  function filterAndSelectDiv() {
    const { anim3, anim4, anim5, anim6 } = getAnimationElements();
    let anim4DivChildren = anim4.children;
    for (let i = 0; i < anim4DivChildren.length; i++) {
      if (
        anim4DivChildren[i].id == "anim-2" ||
        anim4DivChildren[i].id == "anim-3"
      ) {
        continue;
      }

      anim4DivChildren[i].style.display = "none";

      delay += 10;
      if (i === anim4DivChildren.length - 1) {
        delay += 1500;
        anim4DivChildren[1].classList.remove("background-secondary");
        anim3.classList.add("background-secondary");
        setTimeout(() => {
          anim5.style.opacity = "1";
          anim6.style.opacity = "0";

          let anim5DivChildren = Array.from(anim5.children);
          let timer = 500;
          anim5DivChildren.forEach((child) => {
            setTimeout(() => {
              child.style.opacity = 1;
            }, timer);
            timer += 150;
          });
          setTimeout(() => {
            resetAnimation();
          }, timer + 1000);
        }, delay);
      }
    }
  }

  function resetAnimation() {
    const { anim3, anim4, anim6 } = getAnimationElements();
    let anim4DivChildren = anim4.children;
    makeAnim5ChildrenInvisible();
    anim3.classList.remove("background-secondary");
    for (let i = 0; i < anim4DivChildren.length; i++) {
      anim4DivChildren[i].style.display = "flex";
    }
    setTimeout(() => {
      anim6.style.opacity = "1";
      delay = 250;
      i = 0;
      const span = document.querySelector("rnbw-blog #anim-1");
      span.textContent = "Do something...";
      observer.observe(anim1);
    }, 500);
  }
});
