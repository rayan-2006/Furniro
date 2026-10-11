const CATEGORIES_URL = `http://${location.hostname}:3000/api/categories`;
const FETCH_TIMEOUT_MS = 15000;

let activeController = null;
let carouselTeardown = null;

function waitForElement(id, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(id);

    if (existing) {
      resolve(existing);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.getElementById(id);

      if (!element) return;

      clearTimeout(timer);
      observer.disconnect();
      resolve(element);
    });

    const timer = setTimeout(() => {
      observer.disconnect();
      reject(
        new Error(`Element "#${id}" was not found within ${timeoutMs}ms.`)
      );
    }, timeoutMs);

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  });
}

function setSectionState(section, mode) {
  section.classList.toggle("category-cards-section--state", mode !== "carousel");
}

function showLoading(section) {
  if (carouselTeardown) {
    carouselTeardown();
    carouselTeardown = null;
  }

  setSectionState(section, "loading");
  section.replaceChildren();

  const wrap = document.createElement("div");
  wrap.className = "category-cards-state category-cards-state--loading";

  const spinner = document.createElement("div");
  spinner.className = "category-cards-state__spinner";
  spinner.setAttribute("aria-hidden", "true");

  const text = document.createElement("p");
  text.className = "category-cards-state__text";
  text.textContent = "در حال بارگذاری دسته‌بندی‌ها…";

  wrap.setAttribute("role", "status");
  wrap.setAttribute("aria-live", "polite");
  wrap.setAttribute("aria-busy", "true");

  wrap.append(spinner, text);
  section.append(wrap);
}

function showError(section, onRetry) {
  if (carouselTeardown) {
    carouselTeardown();
    carouselTeardown = null;
  }

  setSectionState(section, "error");
  section.replaceChildren();

  const wrap = document.createElement("div");
  wrap.className = "category-cards-state category-cards-state--error";
  wrap.setAttribute("role", "alert");

  const text = document.createElement("p");
  text.className = "category-cards-state__text";
  text.textContent = "بارگذاری دسته‌بندی‌ها ناموفق بود.";

  const retryBtn = document.createElement("button");
  retryBtn.type = "button";
  retryBtn.className = "category-cards-state__retry button-m";
  retryBtn.textContent = "تلاش مجدد";

  retryBtn.addEventListener("click", () => {
    retryBtn.disabled = true;
    onRetry();
  });

  wrap.append(text, retryBtn);
  section.append(wrap);
}

async function fetchCategories() {
  if (activeController) {
    activeController.abort();
  }

  const controller = new AbortController();
  activeController = controller;

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(CATEGORIES_URL, {
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const categories = await response.json();

    if (!Array.isArray(categories) || categories.length === 0) {
      throw new Error("No categories were returned by the API.");
    }

    return categories;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Categories request timed out or was cancelled.");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);

    if (activeController === controller) {
      activeController = null;
    }
  }
}

function mountCarousel(section, categories) {
  setSectionState(section, "carousel");
  section.replaceChildren();

  const btnMoveLeft = document.createElement("button");
  btnMoveLeft.type = "button";
  btnMoveLeft.className = "btn-move btn-move-left";
  btnMoveLeft.setAttribute("aria-label", "Previous category");
  btnMoveLeft.innerHTML =
    '<img src="assets/content/images/svg/angle-left-solid-full.svg" alt="">';

  const track = document.createElement("div");
  track.className = "category-cards-track";

  const btnMoveRight = document.createElement("button");
  btnMoveRight.type = "button";
  btnMoveRight.className = "btn-move btn-move-right";
  btnMoveRight.setAttribute("aria-label", "Next category");
  btnMoveRight.innerHTML =
    '<img src="assets/content/images/svg/angle-right-solid-full.svg" alt="">';

  section.append(btnMoveLeft, track, btnMoveRight);

  function createCard(category) {
    const card = document.createElement("div");
    card.className = "category-card";

    const img = document.createElement("img");
    img.className = "category-card__image";
    img.src = category.image_url;
    img.alt = category.name ?? "";

    const title = document.createElement("p");
    title.className = "category-card__title";
    title.textContent = category.name ?? "";

    card.append(img, title);

    return card;
  }

  const originalCards = categories.map(createCard);
  const originalCount = originalCards.length;

  track.append(...originalCards);

  if (originalCount < 2) {
    carouselTeardown = null;
    return;
  }

  function getGap() {
    const styles = getComputedStyle(track);

    return (
      parseFloat(styles.columnGap) ||
      parseFloat(styles.gap) ||
      0
    );
  }

  function getStep() {
    const firstCard = track.querySelector(".category-card");

    if (!firstCard) return 0;

    return firstCard.getBoundingClientRect().width + getGap();
  }

  let cloneCount = 1;
  let currentIndex = 0;
  let isMoving = false;
  let moveTimer = null;
  let resizeTimer = null;

  function jumpToIndex(index) {
    const step = getStep();

    if (!step) return;

    track.style.scrollBehavior = "auto";
    track.scrollLeft = index * step;

    requestAnimationFrame(() => {
      track.style.scrollBehavior = "";
    });
  }

  function setupCarousel() {
    track.replaceChildren(...originalCards);

    const step = getStep();

    if (!step) return;

    const visibleCount = Math.max(
      1,
      Math.ceil(track.clientWidth / step)
    );

    cloneCount = Math.min(
      originalCount,
      visibleCount + 1
    );

    const leadingClones = originalCards
      .slice(-cloneCount)
      .map(card => card.cloneNode(true));

    const trailingClones = originalCards
      .slice(0, cloneCount)
      .map(card => card.cloneNode(true));

    track.prepend(...leadingClones);
    track.append(...trailingClones);

    currentIndex = cloneCount;
    jumpToIndex(currentIndex);
  }

  function finishMove() {
    if (!isMoving) return;

    clearTimeout(moveTimer);
    moveTimer = null;

    const step = getStep();

    if (step > 0) {
      currentIndex = Math.round(track.scrollLeft / step);
    }

    if (currentIndex >= cloneCount + originalCount) {
      currentIndex -= originalCount;
      jumpToIndex(currentIndex);
    } else if (currentIndex < cloneCount) {
      currentIndex += originalCount;
      jumpToIndex(currentIndex);
    }

    isMoving = false;
  }

  function move(direction) {
    if (isMoving) return;

    const step = getStep();

    if (!step) return;

    isMoving = true;
    currentIndex += direction;

    track.scrollTo({
      left: currentIndex * step,
      behavior: "smooth"
    });

    clearTimeout(moveTimer);

    moveTimer = setTimeout(() => {
      finishMove();
    }, 1500);
  }

  const onMoveLeft = () => move(-1);
  const onMoveRight = () => move(1);

  btnMoveLeft.addEventListener("click", onMoveLeft);
  btnMoveRight.addEventListener("click", onMoveRight);
  track.addEventListener("scrollend", finishMove);

  const onResize = () => {
    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(() => {
      if (isMoving) return;

      setupCarousel();
    }, 150);
  };

  window.addEventListener("resize", onResize);

  requestAnimationFrame(() => {
    setupCarousel();
    console.log(
      "Category carousel initialized:",
      originalCount,
      "categories"
    );
  });

  carouselTeardown = () => {
    clearTimeout(moveTimer);
    clearTimeout(resizeTimer);
    moveTimer = null;
    resizeTimer = null;
    isMoving = false;

    btnMoveLeft.removeEventListener("click", onMoveLeft);
    btnMoveRight.removeEventListener("click", onMoveRight);
    track.removeEventListener("scrollend", finishMove);
    window.removeEventListener("resize", onResize);
  };
}

async function loadCategories(section) {
  showLoading(section);

  try {
    const categories = await fetchCategories();
    mountCarousel(section, categories);
  } catch (error) {
    console.error("Could not load categories:", error);
    showError(section, () => {
      loadCategories(section);
    });
  }
}

async function categoriesFunction() {
  let section;

  try {
    section = await waitForElement("categoryCardsSection");
  } catch (error) {
    console.error(error.message);
    return;
  }

  loadCategories(section);
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    categoriesFunction,
    { once: true }
  );
} else {
  categoriesFunction();
}
