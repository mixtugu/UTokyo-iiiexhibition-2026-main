const root = document.documentElement;
const sections = [...document.querySelectorAll(".concept-section")];
const scanimation = document.querySelector("#scanimation");
const scanimationMask = document.querySelector(".scanimation-mask");
let targetProgress = 0;
let smoothProgress = 0;
let ticking = false;

function readScroll() {
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  targetProgress = Math.min(1, Math.max(0, scrollY / max));
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(render);
  }
}

function render() {
  smoothProgress += (targetProgress - smoothProgress) * .09;
  root.style.setProperty("--p", smoothProgress.toFixed(4));
  const scale = scanimation.getBoundingClientRect().width / 1600;
  const cycle = 40 * scale;
  const stripe = 5 * scale;
  const maskOffset = cycle + smoothProgress * (cycle - stripe);
  scanimationMask.style.setProperty("--mask-top", `${(-cycle).toFixed(3)}px`);
  scanimationMask.style.setProperty("--mask-y", `${maskOffset.toFixed(3)}px`);
  if (Math.abs(targetProgress - smoothProgress) > .0005) requestAnimationFrame(render);
  else ticking = false;
}

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) document.body.dataset.step = entry.target.dataset.step;
  });
}, { rootMargin: "-35% 0px -35%", threshold: 0 });

sections.forEach((section) => sectionObserver.observe(section));
addEventListener("scroll", readScroll, { passive: true });
addEventListener("resize", readScroll);
readScroll();
