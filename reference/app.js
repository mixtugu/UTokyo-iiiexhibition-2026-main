const archives = [
  { kind: "EXTRA", year: "2024", title: "なにいう展", url: "https://iii-exhibition-2024-web.vercel.app/", image: "./assets/archive/extra-2024.png", x: 25, y: 24, rotation: -17 },
  { kind: "EXTRA", year: "2023", title: "voidage", url: "https://iii-exhibition2023.vercel.app/", image: "./assets/archive/extra-2023.jpg", x: 44, y: 19, rotation: 8 },
  { kind: "EXTRA", year: "2022", title: "Emulsion", url: "https://archive.iiiexhibition.com/log/iiiEx2022", image: "./assets/archive/main-2023.png", x: 66, y: 31, rotation: 18 },
  { kind: "EXTRA", year: "2021", title: "0PUNK", url: "https://archive.iiiexhibition.com/log/iiiEx2021", image: "./assets/archive/extra-2024.png", x: 78, y: 51, rotation: 8 },
  { kind: "III EXHIBITION", year: "2023", title: "學藝運動", url: "https://iii-exhibition2023-main.vercel.app/", image: "./assets/archive/main-2023.png", x: 62, y: 69, rotation: -17 },
  { kind: "III EXHIBITION", year: "2022", title: "Emulsion", url: "https://archive.iiiexhibition.com/log/i3e24", image: "./assets/archive/extra-2023.jpg", x: 43, y: 76, rotation: -5 },
  { kind: "III EXHIBITION", year: "2021", title: "キョリブレーション", url: "https://archive.iiiexhibition.com/log/i3e23", image: "./assets/archive/extra-2024.png", x: 25, y: 66, rotation: 14 },
  { kind: "III EXHIBITION", year: "2019", title: "ああ言えば、こう言う。", url: "https://archive.iiiexhibition.com/log/i3e21", image: "./assets/archive/main-2023.png", x: 20, y: 46, rotation: -8 }
];

const stage = document.querySelector("#archive-stage");
const labelLayer = document.querySelector("#archive-labels");
const metaIndex = document.querySelector(".meta-index");
const metaKind = document.querySelector(".meta-kind");
const imageSlots = [document.querySelector(".preview-a"), document.querySelector(".preview-b")];
let activeIndex = -1;
let visibleSlot = 0;
let closeTimer;

archives.forEach((archive, index) => {
  const link = document.createElement("a");
  link.className = "archive-item";
  link.href = archive.url;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.style.setProperty("--x", `${archive.x}%`);
  link.style.setProperty("--y", `${archive.y}%`);
  link.style.setProperty("--rotation", `${archive.rotation}deg`);
  link.innerHTML = `<span class="year">${archive.year}</span><span class="title">${archive.title}</span>`;
  link.setAttribute("aria-label", `${archive.kind} ${archive.year} ${archive.title}を開く`);
  link.addEventListener("pointerenter", () => activate(index));
  link.addEventListener("focus", () => activate(index));
  link.addEventListener("blur", scheduleDeactivate);
  labelLayer.append(link);
});

const labels = [...document.querySelectorAll(".archive-item")];

function setPreviewImage(src) {
  const nextSlot = 1 - visibleSlot;
  const incoming = imageSlots[nextSlot];
  const outgoing = imageSlots[visibleSlot];
  incoming.setAttribute("href", src);
  incoming.setAttribute("preserveAspectRatio", "xMidYMid slice");
  requestAnimationFrame(() => {
    incoming.classList.add("is-visible");
    outgoing.classList.remove("is-visible");
    visibleSlot = nextSlot;
  });
}

function activate(index) {
  window.clearTimeout(closeTimer);
  if (index === activeIndex) return;
  activeIndex = index;
  const archive = archives[index];
  labels.forEach((label, labelIndex) => label.classList.toggle("is-active", labelIndex === index));
  stage.classList.add("is-previewing");
  metaIndex.textContent = String(index + 1).padStart(2, "0");
  metaKind.textContent = `${archive.kind} / ${archive.year}`;
  setPreviewImage(archive.image);
}

function deactivate() {
  activeIndex = -1;
  stage.classList.remove("is-previewing");
  labels.forEach((label) => label.classList.remove("is-active"));
  metaIndex.textContent = "00";
  metaKind.textContent = "MOVE CLOSE TO A TITLE";
}

function scheduleDeactivate() {
  window.clearTimeout(closeTimer);
  closeTimer = window.setTimeout(deactivate, 180);
}

stage.addEventListener("pointermove", (event) => {
  if (event.pointerType === "touch") return;
  let nearestIndex = -1;
  let nearestDistance = Number.POSITIVE_INFINITY;
  labels.forEach((label, index) => {
    const rect = label.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const distance = Math.hypot(event.clientX - x, event.clientY - y);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });
  const threshold = Math.min(170, stage.getBoundingClientRect().width * .14);
  if (nearestDistance <= threshold) activate(nearestIndex);
  else if (activeIndex !== -1) deactivate();
});

stage.addEventListener("pointerleave", scheduleDeactivate);
archives.forEach(({ image }) => { const preload = new Image(); preload.src = image; });

const closingSection = document.querySelector(".closing");
const closingObserver = new IntersectionObserver(
  ([entry]) => document.body.classList.toggle("closing-visible", entry.intersectionRatio > .74),
  { threshold: [0, .45, .74, 1] }
);
closingObserver.observe(closingSection);
