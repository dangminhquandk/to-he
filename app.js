/**
 * ỨNG DỤNG TỪ ĐIỂN TÒ HE - LOGIC ĐIỀU KHIỂN & TƯƠNG TÁC
 * Ngôn ngữ: JavaScript ES6+
 * Thiết kế phòng thủ (Defensive Programming Standards)
 */

// --- 0. TIỆN ÍCH PHÒNG THỦ & CHUẨN HÓA DỮ LIỆU ---
if (typeof window !== "undefined") {
  window.__currentUtterance = null;
}

/**
 * Thoát ký tự đặc biệt chống vỡ layout và XSS Injection
 * @param {any} str 
 * @returns {string} Chuỗi an toàn
 */
function escapeHTML(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Chuẩn hóa triệt để chuỗi ký tự theo tiêu chuẩn phòng thủ (Defensive Unicode Normalization)
 * - Null-safety: trả về "" nếu input không phải string.
 * - Ép chuẩn Unicode dựng sẵn: str.normalize('NFC').
 * - Chuyển chữ thường, cắt bỏ khoảng trắng thừa (.trim().toLowerCase().replace(/\s+/g, ' ')).
 * - Xử lý độc lập cả hai tầng so khớp: tầng có dấu chuẩn và tầng bóc tách dấu (loại bỏ \u0300-\u036f, đ/Đ -> d).
 * @param {any} input 
 * @param {boolean} foldAccents 
 * @returns {string} Chuỗi đã chuẩn hóa an toàn
 */
function normalizeString(input, foldAccents = false) {
  if (typeof input !== "string" || !input) return "";
  let norm = input.normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim();
  if (foldAccents) {
    norm = norm
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "d")
      .normalize("NFC");
  }
  return norm;
}

function normalizeVietnamese(input) {
  return normalizeString(input, true);
}

document.addEventListener("DOMContentLoaded", () => {
  // Đóng băng bất biến dữ liệu tại runtime nếu chưa được đóng băng
  if (typeof deepFreeze === "function" && typeof TOHE_DICTIONARY_DATA !== "undefined" && !Object.isFrozen(TOHE_DICTIONARY_DATA)) {
    deepFreeze(TOHE_DICTIONARY_DATA);
  }

  // --- TRẠNG THÁI ỨNG DỤNG (STATE) ---
  const state = {
    theme: localStorage.getItem("tohe_theme") || "light",
    activeCategory: null,
    activeSubCategory: null,
    activeLetter: null,
    searchQuery: "",
    selectedTermId: "ga-trong", // Mặc định mở Gà trống như mockup
    currentView: "detail" // "detail" hoặc "list"
  };

  // --- CÁC PHẦN TỬ DOM (ELEMENT REFS) ---
  const themeToggleBtn = document.getElementById("theme-toggle");
  const sunIcon = themeToggleBtn.querySelector(".sun-icon");
  const moonIcon = themeToggleBtn.querySelector(".moon-icon");

  const searchInput = document.getElementById("search-input");
  const searchBtn = document.getElementById("search-btn");
  const clearSearchBtn = document.getElementById("clear-search-btn");
  const quickTagChips = document.querySelectorAll(".quick-tag-chip");

  const categoriesGrid = document.getElementById("categories-grid");
  const subcategoriesChips = document.getElementById("subcategories-chips");
  const alphabetMatrix = document.getElementById("alphabet-matrix");
  const filterStatusBanner = document.getElementById("filter-status-banner");
  const filterStatusText = document.getElementById("filter-status-text");
  const resetFilterBtn = document.getElementById("reset-filter-btn");

  const termDetailSection = document.getElementById("term-detail-section");
  const resultsListSection = document.getElementById("results-list-section");
  const termsGrid = document.getElementById("terms-grid");
  const resultsHeading = document.getElementById("results-heading");
  const resultsCount = document.getElementById("results-count");
  const backToListBtn = document.getElementById("back-to-list-btn");
  const viewAllTermsBtn = document.getElementById("view-all-terms-btn");

  // Detail View refs
  const detailImage = document.getElementById("detail-term-image");
  const detailCategoryBadge = document.getElementById("detail-category-badge");
  const detailSectionBadge = document.getElementById("detail-section-badge");
  const detailMediaBadge = document.getElementById("detail-media-badge");
  const detailTitle = document.getElementById("detail-term-title");
  const detailIpa = document.getElementById("detail-term-ipa");
  const detailDefinition = document.getElementById("detail-term-definition");
  const detailTechniqueNote = document.getElementById("detail-technique-note");
  const detailRelatedTags = document.getElementById("detail-related-tags");
  const audioPronounceBtn = document.getElementById("audio-pronounce-btn");
  const audioWaves = document.getElementById("audio-waves");

  // Multimedia & Bilingual refs
  const tabBtnImage = document.getElementById("tab-btn-image");
  const tabBtnVideo = document.getElementById("tab-btn-video");
  const detailImageBox = document.getElementById("detail-image-box");
  const detailVideoBox = document.getElementById("detail-video-box");
  const detailVideoFrame = document.getElementById("detail-video-frame");
  const mediaCaptionText = document.getElementById("media-caption-text");
  const detailEnBox = document.getElementById("detail-en-box");
  const detailEnTermTitle = document.getElementById("detail-en-term-title");
  const detailEnIpa = document.getElementById("detail-en-ipa");
  const detailEnDefinitionText = document.getElementById("detail-en-definition-text");
  const detailEnDefinitionCard = document.getElementById("detail-en-definition-card");
  const audioPronounceEnBtn = document.getElementById("audio-pronounce-en-btn");
  const audioWavesEn = document.getElementById("audio-waves-en");

  // Sidebar refs
  const sidebarRelatedList = document.getElementById("sidebar-related-list");
  const sideSublinks = document.querySelectorAll(".sidebar-sublinks .sublink");
  const categoryAccordionBtn = document.getElementById("side-link-cat");
  const sidebarSublinks = document.getElementById("sidebar-sublinks");

  // Modals
  const aboutModal = document.getElementById("about-modal");
  const modalCloseBtn = document.getElementById("modal-close-btn");
  const modalExploreBtn = document.getElementById("modal-explore-btn");
  const lightboxModal = document.getElementById("lightbox-modal");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const lightboxClose = document.getElementById("lightbox-close");

  // --- 1. KHỞI TẠO THEME (DARK / LIGHT MODE) ---
  function applyTheme(theme) {
    document.body.setAttribute("data-theme", theme);
    state.theme = theme;
    localStorage.setItem("tohe_theme", theme);
    if (theme === "dark") {
      sunIcon.style.display = "none";
      moonIcon.style.display = "block";
    } else {
      sunIcon.style.display = "block";
      moonIcon.style.display = "none";
    }
  }

  themeToggleBtn.addEventListener("click", () => {
    applyTheme(state.theme === "light" ? "dark" : "light");
  });

  applyTheme(state.theme);

  // --- 2. RENDER DANH MỤC THUẬT NGỮ (4 CARDS) ---
  function renderCategories() {
    categoriesGrid.innerHTML = "";
    CATEGORIES_METADATA.forEach((cat) => {
      // Đếm số từ thực tế trong data (pure reference count)
      const actualCount = TOHE_DICTIONARY_DATA.filter(item => item.category === cat.id).length;
      const countLabel = `(${actualCount || cat.countText.replace(/\D/g, '')} từ)`;

      const card = document.createElement("div");
      card.className = `category-card ${escapeHTML(cat.bgClass)} ${state.activeCategory === cat.id ? "active" : ""}`;
      card.setAttribute("data-category-id", cat.id);
      card.innerHTML = `
        <div class="cat-thumb-box">
          <img src="${escapeHTML(cat.image)}" alt="${escapeHTML(cat.title)}" class="cat-thumb-img" loading="lazy">
        </div>
        <div class="cat-bottom-row">
          <div class="cat-info">
            <span class="cat-title">${escapeHTML(cat.title)}</span>
            <span class="cat-count">${escapeHTML(countLabel)}</span>
          </div>
          <button class="cat-arrow-btn" aria-label="Xem danh mục ${escapeHTML(cat.title)}">→</button>
        </div>
      `;

      card.addEventListener("click", () => {
        handleCategorySelect(cat.id);
      });

      categoriesGrid.appendChild(card);
    });
  }

  // --- 2.1 RENDER CHUYÊN MỤC ĐIỀN DÃ (8 SUB-CATEGORIES) ---
  function renderSubcategories() {
    if (!subcategoriesChips || typeof SUBCATEGORIES_METADATA === "undefined") return;
    subcategoriesChips.innerHTML = "";

    // Nút "Tất cả"
    const allBtn = document.createElement("button");
    allBtn.className = `subcat-chip ${!state.activeSubCategory && !state.activeCategory ? "active" : ""}`;
    allBtn.innerHTML = `<span>Tất cả</span> <span class="count">${TOHE_DICTIONARY_DATA.length}</span>`;
    allBtn.addEventListener("click", () => {
      resetAllFilters();
      switchToListAndView("Toàn bộ 177 thuật ngữ điền dã");
    });
    subcategoriesChips.appendChild(allBtn);

    SUBCATEGORIES_METADATA.forEach(sub => {
      const count = TOHE_DICTIONARY_DATA.filter(item => item.subCategory === sub.id).length;
      const btn = document.createElement("button");
      btn.className = `subcat-chip ${state.activeSubCategory === sub.id ? "active" : ""}`;
      btn.innerHTML = `<span>${escapeHTML(sub.title)}</span> <span class="count">${count}</span>`;
      btn.addEventListener("click", () => {
        handleSubCategorySelect(sub.id);
      });
      subcategoriesChips.appendChild(btn);
    });
  }

  function handleSubCategorySelect(subId) {
    if (state.activeSubCategory === subId) {
      state.activeSubCategory = null;
    } else {
      state.activeSubCategory = subId;
      state.activeCategory = null; // Ưu tiên lọc theo chuyên đề
    }
    renderCategories();
    renderSubcategories();
    updateFilterBanner();
    const subMeta = SUBCATEGORIES_METADATA.find(s => s.id === subId);
    switchToListAndView(subMeta ? subMeta.title : "Chuyên đề điền dã");
  }

  // --- 3. RENDER BẢNG CHỮ CÁI TRA CỨU (A - Z MATRIX) ---
  function renderAlphabetMatrix() {
    alphabetMatrix.innerHTML = "";
    ALPHABET_LIST.forEach((letter) => {
      const hasTerms = TOHE_DICTIONARY_DATA.some(
        item => item.letter.toUpperCase() === letter.toUpperCase() ||
                item.term.trim().toUpperCase().startsWith(letter.toUpperCase())
      );

      const btn = document.createElement("button");
      btn.className = `letter-btn ${state.activeLetter === letter ? "active" : ""} ${!hasTerms ? "disabled" : ""}`;
      btn.textContent = letter;
      btn.setAttribute("title", hasTerms ? `Xem các từ bắt đầu bằng ${letter}` : `Chưa có từ bắt đầu bằng ${letter}`);

      if (hasTerms) {
        btn.addEventListener("click", () => {
          handleAlphabetSelect(letter);
        });
      }

      alphabetMatrix.appendChild(btn);
    });
  }

  // --- MEDIA TAB SWITCHER (Ảnh & Video) ---
  function switchMediaTab(tab) {
    const term = TOHE_DICTIONARY_DATA.find(item => item.id === state.selectedTermId);
    if (!term) return;

    if (tab === "video") {
      if (tabBtnVideo) {
        tabBtnVideo.classList.add("active");
        tabBtnVideo.setAttribute("aria-selected", "true");
      }
      if (tabBtnImage) {
        tabBtnImage.classList.remove("active");
        tabBtnImage.setAttribute("aria-selected", "false");
      }
      if (detailImageBox) detailImageBox.style.display = "none";
      if (detailVideoBox) detailVideoBox.style.display = "block";

      if (detailVideoFrame && term.videoUrl) {
        if (!detailVideoFrame.src || detailVideoFrame.src === "about:blank" || !detailVideoFrame.src.includes(term.videoUrl.split('?')[0])) {
          detailVideoFrame.src = term.videoUrl;
        }
      }
    } else {
      if (tabBtnImage) {
        tabBtnImage.classList.add("active");
        tabBtnImage.setAttribute("aria-selected", "true");
      }
      if (tabBtnVideo) {
        tabBtnVideo.classList.remove("active");
        tabBtnVideo.setAttribute("aria-selected", "false");
      }
      if (detailImageBox) detailImageBox.style.display = "block";
      if (detailVideoBox) detailVideoBox.style.display = "none";
      if (detailVideoFrame) detailVideoFrame.src = "";
    }
  }

  if (tabBtnImage) tabBtnImage.addEventListener("click", () => switchMediaTab("image"));
  if (tabBtnVideo) tabBtnVideo.addEventListener("click", () => switchMediaTab("video"));

  // --- 4. RENDER CHI TIẾT THUẬT NGỮ (BILINGUAL DETAIL VIEW) ---
  function renderTermDetail(termId) {
    const term = TOHE_DICTIONARY_DATA.find(item => item.id === termId) || TOHE_DICTIONARY_DATA[0];
    state.selectedTermId = term.id;

    // 1. Tiếng Việt: Thuật ngữ, phiên âm & giải nghĩa
    detailTitle.textContent = term.term;
    detailIpa.textContent = term.ipaVi || term.ipa;
    detailDefinition.textContent = term.definition;
    detailCategoryBadge.textContent = term.categoryLabel;

    // 2. Tiếng Anh: Dịch thuật ngữ, phiên âm tiếng Anh & giải nghĩa tiếng Anh
    if (detailEnTermTitle) {
      detailEnTermTitle.textContent = term.enTerm || term.term;
    }
    if (detailEnIpa) {
      detailEnIpa.textContent = term.enIpa || "";
    }
    if (detailEnDefinitionText) {
      detailEnDefinitionText.textContent = term.enDefinition || term.definition;
    }

    // 3. Đa phương tiện: Hình ảnh & Video nghệ nhân
    detailImage.src = term.image;
    detailImage.alt = `${term.term} (${term.enTerm || ''}) - Nghệ thuật Tò he Xuân La`;

    if (mediaCaptionText) {
      mediaCaptionText.textContent = `Tư liệu điền dã: ${term.term} — ${term.enTerm || ''} (Xuân La, Phú Xuyên)`;
    }

    // Reset về tab ảnh khi chuyển mục từ
    switchMediaTab("image");

    if (detailSectionBadge) {
      if (term.sectionTitle) {
        detailSectionBadge.textContent = term.sectionTitle;
        detailSectionBadge.style.display = "inline-block";
      } else {
        detailSectionBadge.style.display = "none";
      }
    }

    if (term.techniqueSummary) {
      detailTechniqueNote.style.display = "block";
      detailTechniqueNote.querySelector("span").textContent = term.techniqueSummary;
    } else {
      detailTechniqueNote.style.display = "none";
    }

    // Badge styling theo category
    const catMeta = CATEGORIES_METADATA.find(c => c.id === term.category);
    if (catMeta) {
      detailCategoryBadge.className = `category-pill-badge ${catMeta.bgClass}`;
    }

    // Render Related Tags bên dưới bài
    detailRelatedTags.innerHTML = "";
    if (term.related && term.related.length > 0) {
      term.related.forEach((relName, idx) => {
        const chip = document.createElement("button");
        chip.className = "related-tag-chip";
        chip.textContent = relName.toLowerCase();

        // Tìm term ID tương ứng nếu có
        const matchedItem = TOHE_DICTIONARY_DATA.find(
          t => t.term.toLowerCase() === relName.toLowerCase() ||
               (term.relatedIds && term.relatedIds[idx] === t.id)
        );

        chip.addEventListener("click", () => {
          if (matchedItem) {
            renderTermDetail(matchedItem.id);
            switchToDetailView();
          } else {
            // Thực hiện tìm kiếm từ khóa đó
            performSearch(relName);
          }
        });

        detailRelatedTags.appendChild(chip);
      });
    }

    // Cập nhật Widget "Các thuật ngữ liên quan" ở Sidebar phải
    renderSidebarRelated(term);

    // Zoom ảnh lightbox
    detailImage.onclick = () => {
      openLightbox(term.image, `${term.term} (${term.enTerm || ''}) - Nghệ thuật Tò he truyền thống`);
    };
  }

  // --- 5. RENDER WIDGET THUẬT NGỮ LIÊN QUAN (SIDEBAR PHẢI) ---
  function renderSidebarRelated(currentTerm) {
    sidebarRelatedList.innerHTML = "";

    // Lấy các term liên quan từ currentTerm hoặc lấy các term cùng category
    let relatedItems = [];
    if (currentTerm.relatedIds && currentTerm.relatedIds.length > 0) {
      relatedItems = TOHE_DICTIONARY_DATA.filter(t => currentTerm.relatedIds.includes(t.id));
    }

    if (relatedItems.length === 0) {
      relatedItems = TOHE_DICTIONARY_DATA.filter(
        t => t.category === currentTerm.category && t.id !== currentTerm.id
      ).slice(0, 4);
    }

    // Đảm bảo có ít nhất 4 mục để hiển thị đẹp như mockup
    if (relatedItems.length < 4) {
      const extra = TOHE_DICTIONARY_DATA.filter(t => t.id !== currentTerm.id && !relatedItems.includes(t));
      relatedItems = [...relatedItems, ...extra].slice(0, 4);
    }

    relatedItems.forEach(item => {
      const li = document.createElement("li");
      li.className = "related-term-item";
      li.innerHTML = `
        <span>${escapeHTML(item.term)}</span>
        <span class="arrow">›</span>
      `;
      li.addEventListener("click", () => {
        renderTermDetail(item.id);
        switchToDetailView();
      });
      sidebarRelatedList.appendChild(li);
    });
  }

  // --- HÀM THÔNG BÁO TOAST THÂN THIỆN ---
  function showToast(message, type = "info") {
    let toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "toast-container";
      toastContainer.className = "toast-container";
      document.body.appendChild(toastContainer);
    }
    const toast = document.createElement("div");
    toast.className = `toast-message toast-${escapeHTML(type)}`;
    toast.textContent = String(message || "");
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 350);
    }, 3200);
  }

  // --- 6. PHÁT ÂM TIẾNG VIỆT & TIẾNG ANH (DEFENSIVE WEB SPEECH SYNTHESIS API) ---
  audioPronounceBtn.addEventListener("click", () => {
    const term = TOHE_DICTIONARY_DATA.find(item => item.id === state.selectedTermId);
    if (!term) return;

    if (!("speechSynthesis" in window)) {
      showToast("Trình duyệt không hỗ trợ Web Speech API. Thuật ngữ: " + term.term, "warning");
      return;
    }

    try {
      // Trước khi phát âm: luôn gọi window.speechSynthesis.cancel() để dọn sạch hàng đợi
      window.speechSynthesis.cancel();
      window.__currentUtterance = null;

      const utterance = new SpeechSynthesisUtterance(term.term);
      window.__currentUtterance = utterance;
      utterance.lang = "vi-VN";
      utterance.rate = 0.9;
      utterance.pitch = 1.0;

      // Hiệu ứng sóng âm thanh
      audioWaves.classList.add("active");

      const cleanupSpeech = () => {
        window.__currentUtterance = null;
        audioWaves.classList.remove("active");
      };

      utterance.onend = cleanupSpeech;

      utterance.onerror = (e) => {
        cleanupSpeech();
        // Fallback nhẹ nhàng qua Toast UI, tuyệt đối không quăng unhandled exception
        showToast("Không thể phát âm thanh tiếng Việt: " + (e.error || "quyền truy cập bị từ chối"), "warning");
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      window.__currentUtterance = null;
      audioWaves.classList.remove("active");
      showToast("Lỗi âm thanh: " + err.message, "warning");
    }
  });

  // PHÁT ÂM TIẾNG ANH (ENGLISH PRONUNCIATION)
  if (audioPronounceEnBtn) {
    audioPronounceEnBtn.addEventListener("click", () => {
      const term = TOHE_DICTIONARY_DATA.find(item => item.id === state.selectedTermId);
      if (!term) return;
      const textToSpeak = term.enTerm || term.term;

      if (!("speechSynthesis" in window)) {
        showToast("Trình duyệt không hỗ trợ Web Speech API. Từ tiếng Anh: " + textToSpeak, "warning");
        return;
      }

      try {
        window.speechSynthesis.cancel();
        window.__currentUtterance = null;

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        window.__currentUtterance = utterance;
        utterance.lang = "en-US";
        utterance.rate = 0.9;
        utterance.pitch = 1.0;

        if (audioWavesEn) audioWavesEn.classList.add("active");

        const cleanupSpeechEn = () => {
          window.__currentUtterance = null;
          if (audioWavesEn) audioWavesEn.classList.remove("active");
        };

        utterance.onend = cleanupSpeechEn;

        utterance.onerror = (e) => {
          cleanupSpeechEn();
          showToast("Không thể phát âm tiếng Anh: " + (e.error || "quyền truy cập bị từ chối"), "warning");
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        window.__currentUtterance = null;
        if (audioWavesEn) audioWavesEn.classList.remove("active");
        showToast("Lỗi âm thanh tiếng Anh: " + err.message, "warning");
      }
    });
  }

  // --- 7. TÌM KIẾM & BỘ LỌC THUẬT NGỮ (MULTI-FACET INTERSECTION - PURE FUNCTION) ---
  function getFilteredTerms() {
    // Luôn trả về mảng tham chiếu mới, bảo toàn bất biến tuyệt đối của TOHE_DICTIONARY_DATA
    return [...TOHE_DICTIONARY_DATA].filter(item => {
      // 0. Lọc theo chuyên đề điền dã (subCategory)
      if (state.activeSubCategory && item.subCategory !== state.activeSubCategory) {
        return false;
      }
      // 1. Lọc theo macro category
      if (state.activeCategory && item.category !== state.activeCategory) {
        return false;
      }
      // 2. Lọc theo chữ cái (hỗ trợ cả có dấu và không dấu qua normalizeString)
      if (state.activeLetter) {
        const targetLetter = normalizeString(state.activeLetter, true).toUpperCase();
        const firstLetter = normalizeString(item.term.trim()[0] || "", true).toUpperCase();
        const itemLetter = normalizeString(item.letter || "", true).toUpperCase();
        const matchesLetter = itemLetter === targetLetter || firstLetter === targetLetter;
        if (!matchesLetter) return false;
      }
      // 3. Lọc theo từ khóa tìm kiếm (so khớp độc lập 2 tầng: tầng có dấu NFC & tầng bóc tách dấu NFD)
      if (state.searchQuery && state.searchQuery.trim()) {
        const rawQ = state.searchQuery.trim();
        const qNfc = normalizeString(rawQ, false);
        const qFolded = normalizeString(rawQ, true);

        const matchField = (val) => {
          if (!val) return false;
          if (typeof val === "string") {
            const vNfc = normalizeString(val, false);
            if (vNfc.includes(qNfc)) return true;
            const vFolded = normalizeString(val, true);
            return vFolded.includes(qFolded);
          }
          if (Array.isArray(val)) {
            return val.some(matchField);
          }
          return false;
        };

        const inTerm = matchField(item.term);
        const inEnTerm = matchField(item.enTerm);
        const inDef = matchField(item.definition);
        const inEnDef = matchField(item.enDefinition);
        const inIpaVi = matchField(item.ipaVi);
        const inEnIpa = matchField(item.enIpa);
        const inCat = matchField(item.categoryLabel);
        const inSec = matchField(item.sectionTitle);
        const inTags = matchField(item.tags);
        const inRelated = matchField(item.related);

        if (!inTerm && !inEnTerm && !inDef && !inEnDef && !inIpaVi && !inEnIpa && !inCat && !inSec && !inTags && !inRelated) {
          return false;
        }
      }
      return true;
    });
  }

  function renderTermsList() {
    const filtered = getFilteredTerms();
    termsGrid.innerHTML = "";
    resultsCount.textContent = `${filtered.length} thuật ngữ`;

    if (filtered.length === 0) {
      termsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--color-text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 12px;">🌾</div>
          <div style="font-weight: 700; font-size: 1.1rem; margin-bottom: 6px;">Không tìm thấy thuật ngữ nào</div>
          <div>Hãy thử tìm từ khóa khác hoặc bấm nút "Đặt lại bộ lọc" ở trên.</div>
        </div>
      `;
      return;
    }

    filtered.forEach(term => {
      const catMeta = CATEGORIES_METADATA.find(c => c.id === term.category);
      const card = document.createElement("article");
      card.className = "term-card";
      card.innerHTML = `
        <div class="term-card-thumb">
          <img src="${escapeHTML(term.image)}" alt="${escapeHTML(term.term)}" loading="lazy">
        </div>
        <span class="term-card-badge ${catMeta ? escapeHTML(catMeta.bgClass) : ''}">
          ${escapeHTML(term.categoryLabel)}
        </span>
        <h4 class="term-card-title">${escapeHTML(term.term)}</h4>
        ${term.enTerm ? `<div class="term-card-en">🇬🇧 ${escapeHTML(term.enTerm)}</div>` : ''}
        <div class="term-card-ipa">${escapeHTML(term.ipaVi || term.ipa || '')}</div>
        <p class="term-card-excerpt">${escapeHTML(term.definition)}</p>
      `;

      card.addEventListener("click", () => {
        renderTermDetail(term.id);
        switchToDetailView();
      });

      termsGrid.appendChild(card);
    });
  }

  function updateFilterBanner() {
    let filterTexts = [];
    if (state.activeSubCategory && typeof SUBCATEGORIES_METADATA !== "undefined") {
      const sub = SUBCATEGORIES_METADATA.find(s => s.id === state.activeSubCategory);
      if (sub) filterTexts.push(`Chuyên đề: "${escapeHTML(sub.title)}"`);
    }
    if (state.activeCategory) {
      const cat = CATEGORIES_METADATA.find(c => c.id === state.activeCategory);
      if (cat) filterTexts.push(`Danh mục: "${escapeHTML(cat.title)}"`);
    }
    if (state.activeLetter) {
      filterTexts.push(`Bắt đầu bằng chữ cái: "${escapeHTML(state.activeLetter)}"`);
    }
    if (state.searchQuery && state.searchQuery.trim()) {
      filterTexts.push(`Từ khóa: "${escapeHTML(state.searchQuery.trim())}"`);
    }

    if (filterTexts.length > 0) {
      filterStatusBanner.style.display = "flex";
      filterStatusText.textContent = `Đang lọc theo: ${filterTexts.join(" • ")}`;
    } else {
      filterStatusBanner.style.display = "none";
    }
  }

  function resetAllFilters() {
    clearTimeout(searchDebounceTimer);
    state.activeCategory = null;
    state.activeSubCategory = null;
    state.activeLetter = null;
    state.searchQuery = "";
    searchInput.value = "";
    clearSearchBtn.style.display = "none";

    // Cập nhật UI
    renderCategories();
    renderSubcategories();
    renderAlphabetMatrix();
    updateFilterBanner();
    sideSublinks.forEach(btn => btn.classList.remove("active"));

    // Nếu đang ở list view thì reload list, còn không thì về detail
    renderTermsList();
  }

  resetFilterBtn.addEventListener("click", resetAllFilters);

  function handleCategorySelect(catId) {
    state.activeSubCategory = null; // Bỏ lọc chuyên đề khi chọn danh mục chính
    if (state.activeCategory === catId) {
      state.activeCategory = null; // Toggle bỏ lọc
    } else {
      state.activeCategory = catId;
    }
    renderCategories();
    renderSubcategories();
    updateFilterBanner();
    switchToListAndView(`${CATEGORIES_METADATA.find(c => c.id === catId)?.title || "Danh mục"}`);

    // Update sidebar active sublink
    sideSublinks.forEach(btn => {
      if (btn.getAttribute("data-cat") === state.activeCategory) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }

  function handleAlphabetSelect(letter) {
    if (state.activeLetter === letter) {
      state.activeLetter = null;
    } else {
      state.activeLetter = letter;
    }
    renderAlphabetMatrix();
    updateFilterBanner();
    switchToListAndView(`Ký tự bắt đầu: ${letter}`);
  }

  function performSearch(query) {
    state.searchQuery = typeof query === "string" ? query : "";
    searchInput.value = state.searchQuery;
    clearSearchBtn.style.display = state.searchQuery.trim() ? "block" : "none";
    updateFilterBanner();
    switchToListAndView(`Kết quả tìm kiếm cho: "${state.searchQuery}"`);
  }

  // --- XỬ LÝ TÌM KIẾM CHỐNG RACE CONDITION VÀ SPAM PHÍM (INPUT DEBOUNCING) ---
  let searchDebounceTimer = null;

  function triggerSearch(immediate = false) {
    clearTimeout(searchDebounceTimer);
    const query = searchInput.value;
    clearSearchBtn.style.display = query.length > 0 ? "block" : "none";

    if (immediate) {
      performSearch(query);
    } else {
      searchDebounceTimer = setTimeout(() => {
        // Luôn đồng bộ với giá trị cuối cùng trong ô input
        performSearch(searchInput.value);
      }, 100);
    }
  }

  searchBtn.addEventListener("click", () => {
    triggerSearch(true);
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      triggerSearch(true);
    }
  });

  searchInput.addEventListener("input", () => {
    triggerSearch(false);
  });

  clearSearchBtn.addEventListener("click", () => {
    clearTimeout(searchDebounceTimer);
    searchInput.value = "";
    clearSearchBtn.style.display = "none";
    performSearch("");
  });

  // Quick chips
  quickTagChips.forEach(chip => {
    chip.addEventListener("click", () => {
      const termName = chip.getAttribute("data-search");
      const matched = TOHE_DICTIONARY_DATA.find(t => t.term.toLowerCase() === termName.toLowerCase());
      if (matched) {
        renderTermDetail(matched.id);
        switchToDetailView();
      } else {
        performSearch(termName);
      }
    });
  });

  // Chuyển đổi giữa Detail View và List View
  function switchToDetailView() {
    state.currentView = "detail";
    termDetailSection.style.display = "flex";
    resultsListSection.style.display = "none";
    termDetailSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function switchToListAndView(titleText = "Danh sách thuật ngữ") {
    state.currentView = "list";
    renderTermsList();
    resultsHeading.textContent = titleText;
    termDetailSection.style.display = "none";
    resultsListSection.style.display = "flex";
    resultsListSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  backToListBtn.addEventListener("click", () => {
    switchToListAndView("Danh sách thuật ngữ");
  });

  viewAllTermsBtn.addEventListener("click", () => {
    resetAllFilters();
    switchToListAndView("Toàn bộ Từ điển Tò he");
  });

  // --- 8. SIDEBAR & ACCORDION NAVIGATION ---
  categoryAccordionBtn.addEventListener("click", () => {
    const isOpen = categoryAccordionBtn.classList.toggle("open");
    categoryAccordionBtn.setAttribute("aria-expanded", isOpen);
    sidebarSublinks.style.display = isOpen ? "flex" : "none";
  });

  sideSublinks.forEach(sub => {
    sub.addEventListener("click", (e) => {
      e.stopPropagation();
      const cat = sub.getAttribute("data-cat");
      handleCategorySelect(cat);
    });
  });

  // Header Nav links and Sidebar Nav links
  const navHomeButtons = [document.getElementById("nav-btn-home"), document.getElementById("side-link-home")];
  const navDictButtons = [document.getElementById("nav-btn-dictionary"), document.getElementById("side-link-dict")];
  const navCatButtons = [document.getElementById("nav-btn-categories")];
  const navAboutButtons = [document.getElementById("nav-btn-about"), document.getElementById("side-link-about")];

  navHomeButtons.forEach(btn => {
    btn?.addEventListener("click", () => {
      resetAllFilters();
      renderTermDetail("ga-trong");
      switchToDetailView();
      document.getElementById("top-header").scrollIntoView({ behavior: "smooth" });
    });
  });

  navDictButtons.forEach(btn => {
    btn?.addEventListener("click", () => {
      switchToListAndView("Toàn bộ Từ điển");
    });
  });

  navCatButtons.forEach(btn => {
    btn?.addEventListener("click", () => {
      document.getElementById("categories-section").scrollIntoView({ behavior: "smooth" });
    });
  });

  navAboutButtons.forEach(btn => {
    btn?.addEventListener("click", () => {
      openAboutModal();
    });
  });

  document.getElementById("header-search-trigger")?.addEventListener("click", () => {
    searchInput.focus();
    searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  // --- 9. MODAL VỀ CHÚNG TÔI ---
  function openAboutModal() {
    aboutModal.style.display = "flex";
  }

  function closeAboutModal() {
    aboutModal.style.display = "none";
  }

  modalCloseBtn.addEventListener("click", closeAboutModal);
  modalExploreBtn.addEventListener("click", () => {
    closeAboutModal();
    switchToListAndView("Toàn bộ từ điển");
  });

  aboutModal.addEventListener("click", (e) => {
    if (e.target === aboutModal) closeAboutModal();
  });

  // --- 10. LIGHTBOX PHÓNG TO ẢNH ---
  function openLightbox(imgSrc, captionText) {
    lightboxImg.src = imgSrc;
    lightboxCaption.textContent = captionText;
    lightboxModal.style.display = "flex";
  }

  function closeLightbox() {
    lightboxModal.style.display = "none";
  }

  lightboxClose.addEventListener("click", closeLightbox);
  lightboxModal.addEventListener("click", (e) => {
    if (e.target === lightboxModal) closeLightbox();
  });

  // Phím Esc đóng modal
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAboutModal();
      closeLightbox();
    }
  });

  // --- KHỞI CHẠY LẦN ĐẦU ---
  renderCategories();
  renderSubcategories();
  renderAlphabetMatrix();
  renderTermDetail(state.selectedTermId);
  switchToDetailView();
});

// Xuất các hàm thuần túy phục vụ unit test và automation test
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    normalizeString,
    normalizeVietnamese,
    escapeHTML
  };
}
