const accountDetails = [
  { side: "신랑 측", bank: "카카오뱅크", number: "3333 05 0183009", holder: "황성현" },
  { side: "신부 측", bank: "우리은행", number: "1002 948 015 989", holder: "육지현" }
];
const NAVER_MAP_CLIENT_ID = "pdxf1mih2z";
const backgroundMusic = document.getElementById("background-music");
const musicToggle = document.getElementById("music-toggle");

const galleryPhotos = [];
const galleryGrid = document.getElementById("gallery-grid");
const lightbox = document.getElementById("lightbox");
const lightboxCaption = document.getElementById("lightbox-caption");
const gallerySwiperElement = document.getElementById("gallery-swiper");
const gallerySwiperWrapper = document.getElementById("gallery-swiper-wrapper");
const galleryPagination = document.getElementById("lightbox-pagination");
let activePhotoIndex = 0;
let lastFocusedElement = null;
let scrollRevealObserver = null;
let lightboxCloseTimer = null;
let gallerySwiper = null;

function observeScrollReveal(element, delay = 0) {
  if (!scrollRevealObserver) return;
  element.classList.add("scroll-reveal");
  element.style.setProperty("--reveal-delay", `${delay}ms`);
  scrollRevealObserver.observe(element);
}

function setupScrollReveals() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;

  scrollRevealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-revealed");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

  document.querySelectorAll(".section-inner").forEach((section) => {
    [...section.children].forEach((element, index) => {
      observeScrollReveal(element, Math.min(index * 70, 280));
    });
  });
}

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

function escapeCalendarText(value) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function foldCalendarLine(line) {
  const segments = [];
  let currentSegment = "";
  let currentBytes = 0;

  for (const character of line) {
    const characterBytes = new TextEncoder().encode(character).length;
    if (currentBytes + characterBytes > 75) {
      segments.push(currentSegment);
      currentSegment = character;
      currentBytes = characterBytes + 1;
    } else {
      currentSegment += character;
      currentBytes += characterBytes;
    }
  }

  segments.push(currentSegment);
  return segments.join("\r\n ");
}

function downloadWeddingCalendarEvent() {
  const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const eventLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wedding Invitation//KO",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    "UID:wedding-20270117T061000Z@sh-jh-wedding",
    `DTSTAMP:${timestamp}`,
    "DTSTART:20270117T061000Z",
    `SUMMARY:${escapeCalendarText("황성현 · 육지현 결혼식")}`,
    `LOCATION:${escapeCalendarText("서울특별시 구로구 경인로 624, 라마다 서울 신도림 호텔 5층 세인트그레이스홀")}`,
    `DESCRIPTION:${escapeCalendarText("황성현과 육지현의 결혼식에 초대합니다.")}`,
    "URL:https://naver.me/G9r5RXWh",
    "END:VEVENT",
    "END:VCALENDAR"
  ];
  const calendarFile = new Blob(["\uFEFF", `${eventLines.map(foldCalendarLine).join("\r\n")}\r\n`], {
    type: "text/calendar;charset=utf-8"
  });
  const downloadLink = document.createElement("a");
  const downloadUrl = URL.createObjectURL(calendarFile);
  downloadLink.href = downloadUrl;
  downloadLink.download = "wedding-2027-01-17.ics";
  document.body.append(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 60000);
}

function updateCountdownNumber(element, value) {
  const hasPreviousValue = element.dataset.countInitialized === "true";
  const previousDigits = (element.dataset.countValue || value).padStart(value.length, "0").split("");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const digitColumns = [...value].map((digit, index) => {
    const column = document.createElement("span");
    column.className = "count-digit";

    if (!hasPreviousValue || reduceMotion || previousDigits[index] === digit) {
      column.classList.add("count-digit-static");
      column.textContent = digit;
      column.setAttribute("aria-hidden", "true");
      return column;
    }

    const previousDigit = document.createElement("span");
    previousDigit.className = "count-digit-old";
    previousDigit.textContent = previousDigits[index];
    previousDigit.setAttribute("aria-hidden", "true");
    const nextDigit = document.createElement("span");
    nextDigit.className = "count-digit-new";
    nextDigit.textContent = digit;
    nextDigit.setAttribute("aria-hidden", "true");
    column.append(previousDigit, nextDigit);
    return column;
  });

  element.replaceChildren(...digitColumns);
  element.dataset.countValue = value;
  element.dataset.countInitialized = "true";
  element.setAttribute("role", "img");
  element.setAttribute("aria-label", value);
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

  updateCountdownNumber(document.getElementById("count-days"), String(days).padStart(2, "0"));
  updateCountdownNumber(document.getElementById("count-hours"), String(hours).padStart(2, "0"));
  updateCountdownNumber(document.getElementById("count-minutes"), String(minutes).padStart(2, "0"));
  updateCountdownNumber(document.getElementById("count-seconds"), String(seconds).padStart(2, "0"));
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
      observeScrollReveal(stamp, ((number - 1) % 5) * 55);
      loadPhoto(number + 1);
    }, { once: true });

    image.addEventListener("error", () => {}, { once: true });
    image.src = photoPath(number);
  };

  loadPhoto(1);
}

function setupGalleryMotion() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  galleryGrid.addEventListener("animationend", (event) => {
    if (event.target.classList.contains("stamp")) event.target.classList.remove("is-nudging");
  });

  window.setInterval(() => {
    if (document.visibilityState !== "visible" || !lightbox.hidden) return;
    const galleryBounds = galleryGrid.getBoundingClientRect();
    if (galleryBounds.bottom <= 0 || galleryBounds.top >= window.innerHeight) return;

    const stamps = galleryGrid.querySelectorAll(".stamp");
    if (!stamps.length) return;
    stamps.forEach((stamp) => stamp.classList.remove("is-nudging"));
    void galleryGrid.offsetWidth;
    stamps.forEach((stamp) => stamp.classList.add("is-nudging"));
  }, 1000);
}

function updateLightboxCaption() {
  const photo = galleryPhotos[activePhotoIndex];
  if (photo) lightboxCaption.textContent = `${photo.number}번째 사진`;
  const selectedIndex = gallerySwiper?.realIndex ?? activePhotoIndex;
  galleryPagination.querySelectorAll(".swiper-pagination-bullet").forEach((bullet, index) => {
    bullet.setAttribute("aria-current", String(index === selectedIndex));
  });
}

function renderLightbox() {
  if (!galleryPhotos.length || !window.Swiper) return;

  if (!gallerySwiper) {
    galleryPhotos.forEach((photo) => {
      const slide = document.createElement("div");
      const image = document.createElement("img");
      slide.className = "swiper-slide";
      image.src = photo.source;
      image.alt = photo.alt;
      image.draggable = false;
      slide.append(image);
      gallerySwiperWrapper.append(slide);
    });

    gallerySwiper = new window.Swiper(gallerySwiperElement, {
      effect: "cards",
      grabCursor: true,
      loop: true,
      speed: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 150 : 520,
      cardsEffect: {
        perSlideOffset: 12,
        perSlideRotate: 2,
        rotate: true,
        slideShadows: false
      },
      pagination: {
        el: galleryPagination,
        clickable: true,
        renderBullet(index, className) {
          return `<button class="${className}" type="button" aria-label="${index + 1}번째 사진 보기"></button>`;
        }
      },
      on: {
        slideChange(swiper) {
          activePhotoIndex = swiper.realIndex;
          updateLightboxCaption();
        }
      }
    });
    gallerySwiper.slideToLoop(activePhotoIndex, 0, false);
  } else {
    gallerySwiper.update();
    gallerySwiper.slideToLoop(activePhotoIndex, 0, false);
  }

  updateLightboxCaption();
}

function openLightbox(index, focusedElement) {
  window.clearTimeout(lightboxCloseTimer);
  activePhotoIndex = index;
  lastFocusedElement = focusedElement;
  lightbox.hidden = false;
  document.body.style.overflow = "hidden";
  renderLightbox();
  window.setTimeout(() => lightbox.classList.add("is-open"), 20);
  document.getElementById("lightbox-close").focus();
}

function closeLightbox() {
  if (lightbox.hidden || !lightbox.classList.contains("is-open")) return;
  lightbox.classList.remove("is-open");
  lightboxCloseTimer = window.setTimeout(() => {
    if (lightbox.classList.contains("is-open")) return;
    lightbox.hidden = true;
    document.body.style.overflow = "";
    lastFocusedElement?.focus();
  }, 320);
}

function movePhoto(direction) {
  if (!gallerySwiper) return;
  if (direction > 0) gallerySwiper.slideNext();
  else gallerySwiper.slidePrev();
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
}

const detailTitles = ["안내 1", "안내 2", "안내 3", "안내 4"];
const detailRotations = [3, 0, -3, 0];
let activeDetailIndex = 0;

function renderDetailSlide() {
  const slide = document.getElementById("detail-slide");
  const fileNumber = activeDetailIndex + 1;
  const image = document.createElement("img");
  image.src = `images/안내${fileNumber}.png`;
  image.alt = `${detailTitles[activeDetailIndex]} 이미지`;
  image.style.transform = `rotate(${detailRotations[activeDetailIndex]}deg)`;
  slide.replaceChildren(image);

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

function showIntroScreen() {
  const introScreen = document.getElementById("intro-screen");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.body.classList.add("intro-active");

  window.setTimeout(() => {
    introScreen.classList.add("is-fading");
    introScreen.addEventListener("transitionend", () => {
      introScreen.remove();
      document.body.classList.remove("intro-active");
    }, { once: true });
  }, prefersReducedMotion ? 650 : 1700);
}

function setMusicState(isPlaying) {
  musicToggle.setAttribute("aria-pressed", String(isPlaying));
  musicToggle.setAttribute("aria-label", `배경음악 ${isPlaying ? "끄기" : "켜기"}`);
  musicToggle.title = `배경음악 ${isPlaying ? "끄기" : "켜기"}`;
}

function startMusicFromPageGesture(event) {
  if (!(event.target instanceof Element) || event.target.closest("#music-toggle")) return;
  if (backgroundMusic.paused) backgroundMusic.play().catch(() => setMusicState(false));
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
document.addEventListener("pointerdown", startMusicFromPageGesture, { passive: true });
backgroundMusic.addEventListener("play", () => {
  setMusicState(true);
  document.removeEventListener("pointerdown", startMusicFromPageGesture);
});
backgroundMusic.addEventListener("pause", () => setMusicState(false));
backgroundMusic.addEventListener("error", () => {
  document.removeEventListener("pointerdown", startMusicFromPageGesture);
  setMusicState(false);
  musicToggle.disabled = true;
  musicToggle.setAttribute("aria-label", "음악 파일을 재생할 수 없습니다");
  musicToggle.title = "음악 파일을 재생할 수 없습니다";
});
backgroundMusic.play().catch(() => setMusicState(false));

renderCalendar();
document.getElementById("calendar-add-button").addEventListener("click", downloadWeddingCalendarEvent);
updateCountdown();
window.setInterval(updateCountdown, 1000);
setupScrollReveals();
buildGallery();
setupGalleryMotion();
setupGalleryControls();
setupDetailCarousel();
renderAccounts();
loadNaverMap();
showIntroScreen();
