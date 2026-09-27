const accountDetails = [
  { side: "신랑 측", bank: "은행명 입력", number: "", holder: "예금주 입력" },
  { side: "신부 측", bank: "은행명 입력", number: "", holder: "예금주 입력" }
];
const NAVER_MAP_CLIENT_ID = "pdxf1mih2z";
const backgroundMusic = document.getElementById("background-music");
const musicToggle = document.getElementById("music-toggle");
const musicToggleLabel = document.getElementById("music-toggle-label");

const galleryPhotos = [];
const galleryGrid = document.getElementById("gallery-grid");
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightbox-image");
const lightboxCaption = document.getElementById("lightbox-caption");
const thumbnailStrip = document.getElementById("lightbox-thumbnails");
let activePhotoIndex = 0;
let lastFocusedElement = null;

function renderCalendar() {
  const daysContainer = document.getElementById("calendar-days");
  const firstWeekday = new Date(2027, 0, 1).getDay();
  const dayCount = new Date(2027, 1, 0).getDate();

  for (let blank = 0; blank < firstWeekday; blank += 1) {
    daysContainer.append(document.createElement("span"));
  }

  for (let day = 1; day <= dayCount; day += 1) {
    const dateCell = document.createElement("span");
    dateCell.textContent = String(day);
    if (day === 17) {
      dateCell.className = "wedding-day";
      dateCell.setAttribute("aria-label", "1월 17일 결혼식");
    }
    daysContainer.append(dateCell);
  }
}

function updateCountdown() {
  const now = new Date();
  const wedding = new Date(2027, 0, 17, 15, 10, 0);
  const difference = Math.max(0, wedding.getTime() - now.getTime());
  const totalSeconds = Math.floor(difference / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  document.getElementById("count-days").textContent = String(days).padStart(2, "0");
  document.getElementById("count-hours").textContent = String(hours).padStart(2, "0");
  document.getElementById("count-minutes").textContent = String(minutes).padStart(2, "0");
  document.getElementById("count-seconds").textContent = String(seconds).padStart(2, "0");
  document.getElementById("days-remaining").textContent = String(days).padStart(2, "0");
}

function photoPath(number) {
  return `images/photo${number}.jpg`;
}

function buildGallery() {
  const rotations = [-4, 2, -2, 3, -3, 1, 4, -1, 2, -3, 1, -2, 3, -1, 2, -4, 1, -2];

  const loadPhoto = (number) => {
    const image = document.createElement("img");
    image.alt = `${number}번 사진`;
    image.loading = "eager";

    image.addEventListener("load", () => {
      const stamp = document.createElement("div");
      const landscape = image.naturalWidth > image.naturalHeight;
      const photoIndex = galleryPhotos.length;
      stamp.className = "stamp";
      stamp.style.transform = `rotate(${rotations[(number - 1) % rotations.length]}deg)`;
      stamp.classList.add(landscape ? "stamp--landscape" : "stamp--portrait");
      stamp.dataset.photoNumber = String(number);
      galleryPhotos.push({ number, source: image.src, alt: image.alt });
      stamp.append(image);
      stamp.addEventListener("click", () => openLightbox(photoIndex, stamp));
      galleryGrid.append(stamp);
      loadPhoto(number + 1);
    }, { once: true });

    image.addEventListener("error", () => {}, { once: true });
    image.src = photoPath(number);
  };

  loadPhoto(1);
}

function renderLightbox() {
  const photo = galleryPhotos[activePhotoIndex];
  if (!photo) return;

  lightboxImage.src = photo.source;
  lightboxImage.alt = photo.alt;
  lightboxCaption.textContent = `${photo.number} / ${galleryPhotos.length}`;
  thumbnailStrip.replaceChildren();

  galleryPhotos.forEach((item, index) => {
    const thumbnailButton = document.createElement("button");
    thumbnailButton.type = "button";
    thumbnailButton.className = "lightbox-thumbnail";
    thumbnailButton.setAttribute("aria-label", `${item.number}번 사진 보기`);
    thumbnailButton.setAttribute("aria-current", String(index === activePhotoIndex));
    const thumbnailImage = document.createElement("img");
    thumbnailImage.src = item.source;
    thumbnailImage.alt = "";
    thumbnailButton.append(thumbnailImage);
    thumbnailButton.addEventListener("click", () => {
      activePhotoIndex = index;
      renderLightbox();
    });
    thumbnailStrip.append(thumbnailButton);
  });

  thumbnailStrip.querySelector('[aria-current="true"]')?.scrollIntoView({ block: "nearest", inline: "center" });
}

function openLightbox(index, focusedElement) {
  activePhotoIndex = index;
  lastFocusedElement = focusedElement;
  renderLightbox();
  lightbox.hidden = false;
  document.body.style.overflow = "hidden";
  document.getElementById("lightbox-close").focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  document.body.style.overflow = "";
  lastFocusedElement?.focus();
}

function movePhoto(direction) {
  activePhotoIndex = (activePhotoIndex + direction + galleryPhotos.length) % galleryPhotos.length;
  renderLightbox();
}

function setupGalleryControls() {
  document.getElementById("lightbox-close").addEventListener("click", closeLightbox);
  document.getElementById("lightbox-previous").addEventListener("click", () => movePhoto(-1));
  document.getElementById("lightbox-next").addEventListener("click", () => movePhoto(1));

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (event) => {
    if (lightbox.hidden) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") movePhoto(-1);
    if (event.key === "ArrowRight") movePhoto(1);
  });

  let touchStartX = 0;
  lightbox.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });
  lightbox.addEventListener("touchend", (event) => {
    const distance = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(distance) > 45) movePhoto(distance < 0 ? 1 : -1);
  }, { passive: true });
}

const detailTitles = ["안내 1", "안내 2", "안내 3", "안내 4"];
const detailRotations = [3, 0, -3, 0];
let activeDetailIndex = 0;

function renderDetailSlide() {
  const slide = document.getElementById("detail-slide");
  const fileNumber = activeDetailIndex + 1;
  const placeholder = document.createElement("div");
  placeholder.className = "detail-placeholder";
  placeholder.textContent = `${detailTitles[activeDetailIndex]} 이미지 자리`;
  placeholder.style.transform = `rotate(${detailRotations[activeDetailIndex]}deg)`;
  slide.replaceChildren(placeholder);

  document.querySelectorAll(".carousel-dot").forEach((dot, index) => {
    dot.setAttribute("aria-current", String(index === activeDetailIndex));
  });
}

function moveDetail(direction) {
  activeDetailIndex = (activeDetailIndex + direction + detailTitles.length) % detailTitles.length;
  renderDetailSlide();
}

function setupDetailCarousel() {
  const dots = document.getElementById("carousel-dots");
  detailTitles.forEach((title, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "carousel-dot";
    dot.setAttribute("aria-label", `${title} 보기`);
    dot.addEventListener("click", () => {
      activeDetailIndex = index;
      renderDetailSlide();
    });
    dots.append(dot);
  });

  document.querySelector(".carousel-arrow.previous").addEventListener("click", () => moveDetail(-1));
  document.querySelector(".carousel-arrow.next").addEventListener("click", () => moveDetail(1));

  const carousel = document.getElementById("detail-carousel");
  let touchStartX = 0;
  carousel.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });
  carousel.addEventListener("touchend", (event) => {
    const distance = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(distance) > 45) moveDetail(distance < 0 ? 1 : -1);
  }, { passive: true });
  renderDetailSlide();
}

function renderAccounts() {
  const accountList = document.getElementById("account-list");
  const status = document.createElement("p");
  status.className = "copy-status";
  status.setAttribute("aria-live", "polite");
  accountList.after(status);

  accountDetails.forEach((account) => {
    const details = document.createElement("details");
    details.className = "account-item";
    const summary = document.createElement("summary");
    summary.textContent = account.side;
    const content = document.createElement("div");
    content.className = "account-content";
    const row = document.createElement("div");
    row.className = "account-row";
    const meta = document.createElement("div");
    meta.className = "account-meta";

    [account.bank, account.number || "계좌번호 입력", account.holder].forEach((value) => {
      const item = document.createElement("span");
      item.textContent = value;
      if (value === account.number && account.number) item.className = "account-number";
      meta.append(item);
    });

    const copyButton = document.createElement("button");
    copyButton.className = "copy-button";
    copyButton.type = "button";
    copyButton.textContent = "복사";
    copyButton.disabled = !account.number;
    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(account.number);
        status.textContent = `${account.side} 계좌번호를 복사했습니다.`;
      } catch {
        const temporaryInput = document.createElement("textarea");
        temporaryInput.value = account.number;
        temporaryInput.setAttribute("readonly", "");
        temporaryInput.style.position = "fixed";
        temporaryInput.style.opacity = "0";
        document.body.append(temporaryInput);
        temporaryInput.select();
        const copied = document.execCommand("copy");
        temporaryInput.remove();
        status.textContent = copied ? "계좌번호를 복사했습니다." : "계좌번호를 복사하지 못했습니다.";
      }
    });

    row.append(meta, copyButton);
    content.append(row);
    details.append(summary, content);
    accountList.append(details);
  });
}

function showNaverMapFallback() {
  document.getElementById("map-fallback").hidden = false;
}

function initNaverMap() {
  if (!window.naver?.maps) {
    showNaverMapFallback();
    return;
  }

  const venuePosition = new naver.maps.LatLng(37.506227, 126.88545);
  const map = new naver.maps.Map("naver-map", {
    center: venuePosition,
    zoom: 16,
    zoomControl: true,
    zoomControlOptions: { position: naver.maps.Position.TOP_RIGHT }
  });

  new naver.maps.Marker({
    map,
    position: venuePosition,
    title: "라마다 서울 신도림 호텔 5층 세인트그레이스홀"
  });
}

function loadNaverMap() {
  window.navermap_authFailure = showNaverMapFallback;
  const mapScript = document.createElement("script");
  mapScript.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(NAVER_MAP_CLIENT_ID)}`;
  mapScript.async = true;
  mapScript.addEventListener("load", initNaverMap, { once: true });
  mapScript.addEventListener("error", showNaverMapFallback, { once: true });
  document.head.append(mapScript);
}

function setMusicState(isPlaying) {
  musicToggle.setAttribute("aria-pressed", String(isPlaying));
  musicToggle.setAttribute("aria-label", `배경음악 ${isPlaying ? "끄기" : "켜기"}`);
  musicToggle.title = `배경음악 ${isPlaying ? "끄기" : "켜기"}`;
  musicToggleLabel.textContent = `음악 ${isPlaying ? "끄기" : "켜기"}`;
}

musicToggle.addEventListener("click", async () => {
  if (backgroundMusic.paused) {
    try {
      await backgroundMusic.play();
    } catch {
      setMusicState(false);
    }
    return;
  }
  backgroundMusic.pause();
});

backgroundMusic.volume = 0.4;
backgroundMusic.addEventListener("play", () => setMusicState(true));
backgroundMusic.addEventListener("pause", () => setMusicState(false));
backgroundMusic.addEventListener("error", () => {
  musicToggle.disabled = true;
  musicToggleLabel.textContent = "음악 파일 확인";
  musicToggle.setAttribute("aria-label", "음악 파일을 재생할 수 없습니다");
});
backgroundMusic.play().catch(() => setMusicState(false));

renderCalendar();
updateCountdown();
window.setInterval(updateCountdown, 1000);
buildGallery();
setupGalleryControls();
setupDetailCarousel();
renderAccounts();
loadNaverMap();
