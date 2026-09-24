const works = [
  { title: "Memory Landscapes", jp: "記憶の風景を歩くVR", artist: "野原 春菜 / 渡邊研究室", media: "VR INSTALLATION", place: "工学部2号館 92 A/B — 9F", image: "./../assets/works/memory-landscapes.png" },
  { title: "Mollusk", jp: "やわらかな境界の標本", artist: "雨宮研究室", media: "MIXED MEDIA", place: "オープンスタジオ — 地下1F", image: "./../assets/works/mollusk.png" }
];

const shell = document.querySelector(".orbit-shell");
const orbitA = document.querySelector("#orbit-a");
const orbitB = document.querySelector("#orbit-b");
const groupA = document.querySelector(".orbit-group-a");
const groupB = document.querySelector(".orbit-group-b");
const browser = document.querySelector("#spatial-browser");
const detail = document.querySelector("#work-detail");
const statusIndex = document.querySelector(".orbit-status b");
const statusText = document.querySelector(".orbit-status span");

const rings = [
  { element: groupA, orbit: orbitA, indices: [], spin: .25, targetSpin: .25, direction: 1, speed: .00013 },
  { element: groupB, orbit: orbitB, indices: [], spin: 2.4, targetSpin: 2.4, direction: -1, speed: .00010 }
];
let pointerX = 0;
let pointerY = 0;
let proximity = 0;
let targetProximity = 0;
let lastTime = performance.now();
let selectedIndex = 0;
let selectedCardIndex = 0;
let detailOpen = false;

const cardsPerRing = 14;
rings.forEach((ring, workIndex) => {
  const work = works[workIndex];
  for (let instance = 0; instance < cardsPerRing; instance += 1) {
    const cardIndex = workIndex * cardsPerRing + instance;
    const card = document.createElement("button");
    card.className = "work-card";
    card.type = "button";
    card.dataset.index = cardIndex;
    card.dataset.workIndex = workIndex;
    card.setAttribute("aria-label", `${work.title}の詳細を見る`);
    card.innerHTML = `<img src="${work.image}" alt="" draggable="false">`;
    card.addEventListener("click", () => openDetail(workIndex, cardIndex));
    card.addEventListener("focus", () => focusCard(cardIndex));
    card.addEventListener("blur", clearCardFocus);
    ring.indices.push(cardIndex);
    ring.orbit.append(card);
  }
});

const cards = [...document.querySelectorAll(".work-card")];

function render(time) {
  const dt = Math.min(32, time - lastTime);
  lastTime = time;
  proximity += (targetProximity - proximity) * .075;

  let nearest = { index: -1, distance: Infinity };
  const pointerClientX = pointerX * innerWidth / 2 + innerWidth / 2;
  const pointerClientY = pointerY * innerHeight / 2 + innerHeight / 2;

  rings.forEach((ring) => {
    const rect = ring.element.getBoundingClientRect();
    const centerDistance = Math.hypot(pointerClientX - (rect.left + rect.width / 2), pointerClientY - (rect.top + rect.height / 2));
    const localNear = targetProximity * Math.max(0, 1 - centerDistance / (rect.width * .82));
    if (!detailOpen && localNear <= .08) ring.targetSpin += dt * ring.speed * ring.direction;
    ring.spin += (ring.targetSpin - ring.spin) * .045;
    ring.element.classList.toggle("is-near", localNear > .08);
    ring.element.classList.toggle("has-focus", localNear > .23);

    const radiusX = rect.width * (.37 + localNear * .055);
    const radiusY = rect.height * (.36 + localNear * .045);
    const depthRadius = rect.width * (.17 - localNear * .15);
    ring.indices.forEach((index, ringIndex) => {
      const card = cards[index];
      const angle = ring.spin + ringIndex / ring.indices.length * Math.PI * 2;
      const sidePull = pointerX * localNear * rect.width * .06;
      const x = Math.cos(angle) * radiusX + sidePull;
      const y = Math.sin(angle) * radiusY + Math.sin(angle * 2) * rect.height * .025 + pointerY * localNear * 13;
      const z = Math.sin(angle) * depthRadius;
      const depth = (z / Math.max(1, depthRadius) + 1) / 2;
      const face = Math.cos(angle) * 14 * (1 - localNear * .96);
      const scale = .86 + depth * .12 + localNear * .025;
      card.style.setProperty("--depth", depth.toFixed(3));
      card.style.transform = `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), ${z}px) rotateY(${face}deg) scale(${scale})`;
      card.style.zIndex = String(Math.round(depth * 20));
      const cardX = rect.left + rect.width / 2 + x;
      const cardY = rect.top + rect.height / 2 + y;
      const distance = Math.hypot(pointerClientX - cardX, pointerClientY - cardY);
      if (localNear > .1 && distance < nearest.distance) nearest = { index, distance };
    });
  });

  cards.forEach((card, index) => card.classList.toggle("is-nearest", targetProximity > .1 && index === nearest.index));
  if (targetProximity > .1 && nearest.index >= 0) {
    const workIndex = Number(cards[nearest.index].dataset.workIndex);
    statusIndex.textContent = String(workIndex + 1).padStart(2, "0");
    statusText.textContent = works[workIndex].title.toUpperCase();
  }
  requestAnimationFrame(render);
}

browser.addEventListener("pointermove", (event) => {
  if (event.pointerType === "touch" || detailOpen) return;
  pointerX = event.clientX / innerWidth * 2 - 1;
  pointerY = event.clientY / innerHeight * 2 - 1;
  const rect = shell.getBoundingClientRect();
  const nx = Math.abs((event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2));
  const ny = Math.abs((event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2));
  targetProximity = Math.max(0, Math.min(1, 1.28 - Math.hypot(nx * .72, ny * .95)));
});

browser.addEventListener("pointerleave", () => {
  targetProximity = 0;
  rings.forEach((ring) => ring.element.classList.remove("is-near", "has-focus"));
  statusIndex.textContent = "00";
  statusText.textContent = "DRIFTING IN SPACE";
});

function focusCard(index) {
  targetProximity = 1;
  const ring = rings[Number(cards[index].dataset.workIndex)];
  ring.element.classList.add("is-near", "has-focus");
  cards.forEach((card, cardIndex) => card.classList.toggle("is-nearest", cardIndex === index));
  const workIndex = Number(cards[index].dataset.workIndex);
  statusIndex.textContent = String(workIndex + 1).padStart(2, "0");
  statusText.textContent = works[workIndex].title.toUpperCase();
}

function clearCardFocus() {
  if (detailOpen) return;
  targetProximity = 0;
  rings.forEach((ring) => ring.element.classList.remove("is-near", "has-focus"));
}

function fillDetail(index) {
  const work = works[index];
  document.querySelector(".detail-visual img").src = work.image;
  document.querySelector(".detail-index").textContent = String(index + 1).padStart(2, "0");
  document.querySelector(".detail-title").textContent = work.title;
  document.querySelector(".detail-jp-title").textContent = work.jp;
  document.querySelector(".detail-place").textContent = work.place;
  document.querySelector(".detail-artist").textContent = work.artist;
  document.querySelector(".detail-media").textContent = work.media;
}

function openDetail(index, cardIndex = index * cardsPerRing) {
  selectedIndex = index;
  selectedCardIndex = cardIndex;
  detailOpen = true;
  fillDetail(index);
  detail.setAttribute("aria-hidden", "false");
  document.body.classList.add("detail-open");
  window.setTimeout(() => document.querySelector(".detail-close").focus(), 620);
}

function closeDetail() {
  detailOpen = false;
  detail.setAttribute("aria-hidden", "true");
  document.body.classList.remove("detail-open");
  targetProximity = 0;
  cards[selectedCardIndex].focus();
}

function stepDetail(direction) {
  selectedIndex = (selectedIndex + direction + works.length) % works.length;
  fillDetail(selectedIndex);
}

document.querySelector(".detail-close").addEventListener("click", closeDetail);
document.querySelector(".detail-prev").addEventListener("click", () => stepDetail(-1));
document.querySelector(".detail-next").addEventListener("click", () => stepDetail(1));
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && detailOpen) closeDetail();
  if (event.key === "ArrowLeft" && detailOpen) stepDetail(-1);
  if (event.key === "ArrowRight" && detailOpen) stepDetail(1);
});

requestAnimationFrame(render);
