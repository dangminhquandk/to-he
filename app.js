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

  // Multimedia, 3D & Bilingual refs
  const tabBtnImage = document.getElementById("tab-btn-image");
  const tabBtnVideo = document.getElementById("tab-btn-video");
  const tabBtn3d = document.getElementById("tab-btn-3d");
  const detailImageBox = document.getElementById("detail-image-box");
  const detailVideoBox = document.getElementById("detail-video-box");
  const detail3dBox = document.getElementById("detail-3d-box");
  const morphology3dCanvas = document.getElementById("morphology-3d-canvas");
  const stageBtn1 = document.getElementById("stage-btn-1");
  const stageBtn2 = document.getElementById("stage-btn-2");
  const stageBtn3 = document.getElementById("stage-btn-3");
  const wireframeToggle = document.getElementById("wireframe-toggle");
  const webarLaunchBtn = document.getElementById("webar-launch-btn");
  const detailVideoFrame = document.getElementById("detail-video-frame");
  const mediaCaptionText = document.getElementById("media-caption-text");
  const detailEnBox = document.getElementById("detail-en-box");
  const detailEnTermTitle = document.getElementById("detail-en-term-title");
  const detailEnIpa = document.getElementById("detail-en-ipa");
  const detailEnDefinitionText = document.getElementById("detail-en-definition-text");
  const detailEnDefinitionCard = document.getElementById("detail-en-definition-card");
  const audioPronounceEnBtn = document.getElementById("audio-pronounce-en-btn");
  const audioWavesEn = document.getElementById("audio-waves-en");

  // Academic Action refs & Fieldwork note
  const termCiteBtn = document.getElementById("term-cite-btn");
  const termExportBtn = document.getElementById("term-export-btn");
  const detailFieldworkText = document.getElementById("detail-fieldwork-text");
  const headerCiteBtn = document.getElementById("header-cite-btn");
  const headerExportBtn = document.getElementById("header-export-btn");
  const sideLinkCite = document.getElementById("side-link-cite");

  // Academic Views: Knowledge Graph & Fieldwork Map
  const knowledgeGraphSection = document.getElementById("knowledge-graph-section");
  const fieldworkMapSection = document.getElementById("fieldwork-map-section");
  const navBtnGraph = document.getElementById("nav-btn-graph");
  const sideLinkGraph = document.getElementById("side-link-graph");
  const graphBackBtn = document.getElementById("graph-back-btn");
  const graphResetZoomBtn = document.getElementById("graph-reset-zoom-btn");
  const graphCategoryChips = document.getElementById("graph-category-chips");
  const graphSearchInput = document.getElementById("graph-search-input");
  const heritageGraphCanvas = document.getElementById("heritage-graph-canvas");
  const graphTooltip = document.getElementById("graph-tooltip");
  const graphStatsSummary = document.getElementById("graph-stats-summary");

  const navBtnMap = document.getElementById("nav-btn-map");
  const sideLinkMap = document.getElementById("side-link-map");
  const mapBackBtn = document.getElementById("map-back-btn");
  const landmarkPins = document.querySelectorAll(".map-landmark-pin");
  const spatialTitle = document.getElementById("spatial-title");
  const spatialBadge = document.getElementById("spatial-badge");
  const spatialCoords = document.getElementById("spatial-coords");
  const spatialContent = document.getElementById("spatial-content");
  const spatialTermsTags = document.getElementById("spatial-terms-tags");

  // Citation & Open Data Modal refs
  const citationModal = document.getElementById("citation-modal");
  const citationModalCloseBtn = document.getElementById("citation-modal-close-btn");
  const citationOutputText = document.getElementById("citation-output-text");
  const copyCitationBtn = document.getElementById("copy-citation-btn");
  const exportJsonldBtn = document.getElementById("export-jsonld-btn");
  const exportCsvBtn = document.getElementById("export-csv-btn");
  const citationTabBtns = document.querySelectorAll(".citation-tab-btn");

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

  // --- MEDIA TAB SWITCHER (Ảnh, Video & Mô hình 3D) ---
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
      if (tabBtn3d) {
        tabBtn3d.classList.remove("active");
        tabBtn3d.setAttribute("aria-selected", "false");
      }
      if (detailImageBox) detailImageBox.style.display = "none";
      if (detailVideoBox) detailVideoBox.style.display = "block";
      if (detail3dBox) detail3dBox.style.display = "none";

      if (detailVideoFrame && term.videoUrl) {
        if (!detailVideoFrame.src || detailVideoFrame.src === "about:blank" || !detailVideoFrame.src.includes(term.videoUrl.split('?')[0])) {
          detailVideoFrame.src = term.videoUrl;
        }
      }
    } else if (tab === "3d") {
      if (tabBtn3d) {
        tabBtn3d.classList.add("active");
        tabBtn3d.setAttribute("aria-selected", "true");
      }
      if (tabBtnImage) {
        tabBtnImage.classList.remove("active");
        tabBtnImage.setAttribute("aria-selected", "false");
      }
      if (tabBtnVideo) {
        tabBtnVideo.classList.remove("active");
        tabBtnVideo.setAttribute("aria-selected", "false");
      }
      if (detailImageBox) detailImageBox.style.display = "none";
      if (detailVideoBox) detailVideoBox.style.display = "none";
      if (detail3dBox) detail3dBox.style.display = "flex";
      if (detailVideoFrame) detailVideoFrame.src = "";
      initOrRender3DMorphology();
    } else {
      if (tabBtnImage) {
        tabBtnImage.classList.add("active");
        tabBtnImage.setAttribute("aria-selected", "true");
      }
      if (tabBtnVideo) {
        tabBtnVideo.classList.remove("active");
        tabBtnVideo.setAttribute("aria-selected", "false");
      }
      if (tabBtn3d) {
        tabBtn3d.classList.remove("active");
        tabBtn3d.setAttribute("aria-selected", "false");
      }
      if (detailImageBox) detailImageBox.style.display = "block";
      if (detailVideoBox) detailVideoBox.style.display = "none";
      if (detail3dBox) detail3dBox.style.display = "none";
      if (detailVideoFrame) detailVideoFrame.src = "";
    }
  }

  if (tabBtnImage) tabBtnImage.addEventListener("click", () => switchMediaTab("image"));
  if (tabBtnVideo) tabBtnVideo.addEventListener("click", () => switchMediaTab("video"));
  if (tabBtn3d) tabBtn3d.addEventListener("click", () => switchMediaTab("3d"));

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

    if (detailFieldworkText) {
      if (term.fieldworkNote) {
        detailFieldworkText.textContent = term.fieldworkNote;
      } else {
        detailFieldworkText.textContent = `Thu thập và đối sánh trực tiếp qua phỏng vấn sâu nghệ nhân làng Xuân La (đợt khảo sát dân tộc học 2026). Phân loại: ${term.categoryLabel} • Chuyên đề: ${term.sectionTitle || 'Di sản làng nghề'}.`;
      }
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

  // =========================================================================
  // --- CHUYỂN ĐỔI GIAO DIỆN HỌC THUẬT & ĐIỀU HƯỚNG VIEW (VIEW ROUTING) ---
  // =========================================================================
  function hideAllViews() {
    if (termDetailSection) termDetailSection.style.display = "none";
    if (resultsListSection) resultsListSection.style.display = "none";
    if (knowledgeGraphSection) knowledgeGraphSection.style.display = "none";
    if (fieldworkMapSection) fieldworkMapSection.style.display = "none";
  }

  function switchToDetailView() {
    state.currentView = "detail";
    hideAllViews();
    if (termDetailSection) {
      termDetailSection.style.display = "flex";
      termDetailSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function switchToListAndView(titleText = "Danh sách thuật ngữ") {
    state.currentView = "list";
    renderTermsList();
    if (resultsHeading) resultsHeading.textContent = titleText;
    hideAllViews();
    if (resultsListSection) {
      resultsListSection.style.display = "flex";
      resultsListSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function switchToGraphView() {
    state.currentView = "graph";
    hideAllViews();
    if (knowledgeGraphSection) {
      knowledgeGraphSection.style.display = "flex";
      initOrUpdateKnowledgeGraph();
      knowledgeGraphSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function switchToMapView() {
    state.currentView = "map";
    hideAllViews();
    if (fieldworkMapSection) {
      fieldworkMapSection.style.display = "flex";
      initSpatialMap();
      fieldworkMapSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  if (backToListBtn) {
    backToListBtn.addEventListener("click", () => {
      switchToListAndView("Danh sách thuật ngữ");
    });
  }

  if (viewAllTermsBtn) {
    viewAllTermsBtn.addEventListener("click", () => {
      resetAllFilters();
      switchToListAndView("Toàn bộ Từ điển Tò he");
    });
  }

  if (graphBackBtn) graphBackBtn.addEventListener("click", switchToDetailView);
  if (mapBackBtn) mapBackBtn.addEventListener("click", switchToDetailView);

  // --- 8. SIDEBAR & ACCORDION NAVIGATION ---
  if (categoryAccordionBtn) {
    categoryAccordionBtn.addEventListener("click", () => {
      const isOpen = categoryAccordionBtn.classList.toggle("open");
      categoryAccordionBtn.setAttribute("aria-expanded", isOpen);
      if (sidebarSublinks) sidebarSublinks.style.display = isOpen ? "flex" : "none";
    });
  }

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
  const navGraphButtons = [navBtnGraph, sideLinkGraph].filter(Boolean);
  const navMapButtons = [navBtnMap, sideLinkMap].filter(Boolean);
  const citeButtons = [headerCiteBtn, sideLinkCite, termCiteBtn].filter(Boolean);
  const exportButtons = [headerExportBtn, termExportBtn].filter(Boolean);

  navHomeButtons.forEach(btn => {
    btn?.addEventListener("click", () => {
      resetAllFilters();
      renderTermDetail("ga-trong");
      switchToDetailView();
      document.getElementById("top-header")?.scrollIntoView({ behavior: "smooth" });
    });
  });

  navDictButtons.forEach(btn => {
    btn?.addEventListener("click", () => {
      switchToListAndView("Toàn bộ Từ điển");
    });
  });

  navCatButtons.forEach(btn => {
    btn?.addEventListener("click", () => {
      document.getElementById("categories-section")?.scrollIntoView({ behavior: "smooth" });
    });
  });

  navAboutButtons.forEach(btn => {
    btn?.addEventListener("click", () => {
      openAboutModal();
    });
  });

  navGraphButtons.forEach(btn => {
    btn?.addEventListener("click", () => {
      switchToGraphView();
    });
  });

  navMapButtons.forEach(btn => {
    btn?.addEventListener("click", () => {
      switchToMapView();
    });
  });

  citeButtons.forEach(btn => {
    btn?.addEventListener("click", () => {
      openCitationModal();
    });
  });

  exportButtons.forEach(btn => {
    btn?.addEventListener("click", () => {
      openCitationModal();
      document.querySelector(".open-data-export-box")?.scrollIntoView({ behavior: "smooth" });
    });
  });

  document.getElementById("header-search-trigger")?.addEventListener("click", () => {
    if (searchInput) {
      searchInput.focus();
      searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });

  // =========================================================================
  // --- MODULE 1: 3D CRAFT MORPHOLOGY ENGINE (GIẢI PHẪU TẠO HÌNH DÂN GIAN) ---
  // =========================================================================
  let morphologyState = {
    stage: 1,
    isWireframe: false,
    rotX: 0.35,
    rotY: -0.45,
    zoom: 1.0,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    initialized: false
  };

  function initOrRender3DMorphology() {
    if (!morphology3dCanvas) return;
    const canvas = morphology3dCanvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!morphologyState.initialized) {
      morphologyState.initialized = true;

      // Stage buttons
      const stageButtons = [stageBtn1, stageBtn2, stageBtn3];
      stageButtons.forEach((btn, idx) => {
        if (!btn) return;
        btn.addEventListener("click", () => {
          stageButtons.forEach(b => b?.classList.remove("active"));
          btn.classList.add("active");
          morphologyState.stage = idx + 1;
          render3DMorphologyFrame();
        });
      });

      // Wireframe toggle
      if (wireframeToggle) {
        wireframeToggle.addEventListener("change", (e) => {
          morphologyState.isWireframe = !!e.target.checked;
          render3DMorphologyFrame();
        });
      }

      // WebAR Launch
      if (webarLaunchBtn) {
        webarLaunchBtn.addEventListener("click", () => {
          showToast("Khám phá WebAR: Khởi động camera và neo đối tượng Tò he 3D vào mặt phẳng thực tế qua chuẩn WebXR/ARCore.", "info");
        });
      }

      // Canvas Mouse Dragging & Wheel Zoom
      canvas.addEventListener("mousedown", (e) => {
        morphologyState.isDragging = true;
        morphologyState.lastX = e.clientX;
        morphologyState.lastY = e.clientY;
      });

      window.addEventListener("mousemove", (e) => {
        if (!morphologyState.isDragging) return;
        const dx = e.clientX - morphologyState.lastX;
        const dy = e.clientY - morphologyState.lastY;
        morphologyState.rotY += dx * 0.01;
        morphologyState.rotX += dy * 0.01;
        morphologyState.lastX = e.clientX;
        morphologyState.lastY = e.clientY;
        render3DMorphologyFrame();
      });

      window.addEventListener("mouseup", () => {
        morphologyState.isDragging = false;
      });

      canvas.addEventListener("wheel", (e) => {
        e.preventDefault();
        morphologyState.zoom = Math.max(0.5, Math.min(2.2, morphologyState.zoom - e.deltaY * 0.0015));
        render3DMorphologyFrame();
      }, { passive: false });
    }

    render3DMorphologyFrame();
  }

  function render3DMorphologyFrame() {
    if (!morphology3dCanvas) return;
    const canvas = morphology3dCanvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const { rotX, rotY, zoom, stage, isWireframe } = morphologyState;

    // 3D Matrix Projection helpers
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);

    function project(x, y, z) {
      // Y-axis rotation
      const x1 = x * cosY + z * sinY;
      const z1 = -x * sinY + z * cosY;
      // X-axis rotation
      const y2 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;

      const fov = 380;
      const s = (fov / (fov + z2 + 200)) * zoom;
      return {
        px: cx + x1 * s,
        py: cy + y2 * s,
        pz: z2,
        scale: s
      };
    }

    // Draw Bamboo stick (que tre cắm tò he)
    ctx.beginPath();
    const stickTop = project(0, 20, 0);
    const stickBottom = project(0, 160, 0);
    ctx.moveTo(stickTop.px, stickTop.py);
    ctx.lineTo(stickBottom.px, stickBottom.py);
    ctx.strokeStyle = "#c29b61";
    ctx.lineWidth = 6 * stickTop.scale;
    ctx.lineCap = "round";
    ctx.stroke();

    // Model Geometries based on Stage
    if (stage === 1) {
      // GIAI ĐOẠN 1: Phôi cầu (Raw Dough Spheroid)
      drawSphere(ctx, 0, -20, 0, 48, "#e86147", isWireframe, project);
    } else if (stage === 2) {
      // GIAI ĐOẠN 2: Vuốt thân (Torso Elongation & Neck Pull)
      drawEllipsoid(ctx, 0, -10, 0, 45, 65, 38, "#e86147", isWireframe, project);
      // Small head bud
      drawSphere(ctx, 0, -70, 10, 22, "#f97316", isWireframe, project);
    } else {
      // GIAI ĐOẠN 3: Hoàn thiện (Finished Folk Rooster / Con giống)
      // Main Body
      drawEllipsoid(ctx, 0, -10, 0, 44, 58, 40, "#e86147", isWireframe, project);
      // Head
      drawSphere(ctx, 0, -68, 14, 22, "#f97316", isWireframe, project);
      // Comb (Mào gà cờ - red)
      drawComb(ctx, project, isWireframe);
      // Beak (Mỏ gà - yellow)
      drawBeak(ctx, project, isWireframe);
      // Tail Feathers (Lông đuôi uốn lượn - 3 colorful arcs)
      drawTailFeathers(ctx, project, isWireframe);
      // Wings (Cánh khía lược hai bên)
      drawWings(ctx, project, isWireframe);
    }
  }

  function drawSphere(ctx, cx, cy, cz, radius, color, isWireframe, project) {
    const latLines = 8;
    const lonLines = 12;

    for (let i = 0; i <= latLines; i++) {
      const theta = (i / latLines) * Math.PI;
      const r = radius * Math.sin(theta);
      const y = cy + radius * Math.cos(theta);

      ctx.beginPath();
      for (let j = 0; j <= lonLines; j++) {
        const phi = (j / lonLines) * 2 * Math.PI;
        const x = cx + r * Math.cos(phi);
        const z = cz + r * Math.sin(phi);
        const p = project(x, y, z);
        if (j === 0) ctx.moveTo(p.px, p.py);
        else ctx.lineTo(p.px, p.py);
      }
      ctx.strokeStyle = isWireframe ? "#38bdf8" : color;
      ctx.lineWidth = isWireframe ? 1 : 1.5;
      if (!isWireframe && (i === Math.floor(latLines / 2))) {
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.4;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
      ctx.stroke();
    }
  }

  function drawEllipsoid(ctx, cx, cy, cz, rx, ry, rz, color, isWireframe, project) {
    const latLines = 8;
    const lonLines = 12;

    for (let i = 0; i <= latLines; i++) {
      const theta = (i / latLines) * Math.PI;
      const y = cy + ry * Math.cos(theta);
      const curRx = rx * Math.sin(theta);
      const curRz = rz * Math.sin(theta);

      ctx.beginPath();
      for (let j = 0; j <= lonLines; j++) {
        const phi = (j / lonLines) * 2 * Math.PI;
        const x = cx + curRx * Math.cos(phi);
        const z = cz + curRz * Math.sin(phi);
        const p = project(x, y, z);
        if (j === 0) ctx.moveTo(p.px, p.py);
        else ctx.lineTo(p.px, p.py);
      }
      ctx.strokeStyle = isWireframe ? "#38bdf8" : color;
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
  }

  function drawComb(ctx, project, isWireframe) {
    // 3 spikes of rooster comb on head
    const spikes = [
      { x: 0, y: -94, z: 12 },
      { x: 0, y: -100, z: 8 },
      { x: 0, y: -92, z: 2 }
    ];
    ctx.beginPath();
    const pBase = project(0, -82, 10);
    ctx.moveTo(pBase.px, pBase.py);
    spikes.forEach(s => {
      const p = project(s.x, s.y, s.z);
      ctx.lineTo(p.px, p.py);
    });
    ctx.closePath();
    ctx.fillStyle = "#dc2626";
    ctx.strokeStyle = isWireframe ? "#38bdf8" : "#991b1b";
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
  }

  function drawBeak(ctx, project, isWireframe) {
    ctx.beginPath();
    const p1 = project(0, -70, 28);
    const p2 = project(-4, -66, 20);
    const p3 = project(4, -66, 20);
    ctx.moveTo(p1.px, p1.py);
    ctx.lineTo(p2.px, p2.py);
    ctx.lineTo(p3.px, p3.py);
    ctx.closePath();
    ctx.fillStyle = "#eab308";
    ctx.strokeStyle = isWireframe ? "#38bdf8" : "#ca8a04";
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();
  }

  function drawWings(ctx, project, isWireframe) {
    // Left wing and Right wing notches
    [-1, 1].forEach(side => {
      ctx.beginPath();
      const p1 = project(side * 36, -24, 0);
      const p2 = project(side * 52, -10, -12);
      const p3 = project(side * 32, 10, -20);
      ctx.moveTo(p1.px, p1.py);
      ctx.lineTo(p2.px, p2.py);
      ctx.lineTo(p3.px, p3.py);
      ctx.closePath();
      ctx.fillStyle = "#10b981";
      ctx.strokeStyle = isWireframe ? "#38bdf8" : "#047857";
      ctx.lineWidth = 1.8;
      ctx.fill();
      ctx.stroke();
    });
  }

  function drawTailFeathers(ctx, project, isWireframe) {
    const tails = [
      { yEnd: -85, zEnd: -55, color: "#f59e0b" },
      { yEnd: -75, zEnd: -65, color: "#ef4444" },
      { yEnd: -60, zEnd: -60, color: "#10b981" }
    ];
    tails.forEach(t => {
      ctx.beginPath();
      const start = project(0, 10, -32);
      const ctrl = project(0, -40, -70);
      const end = project(0, t.yEnd, t.zEnd);
      ctx.moveTo(start.px, start.py);
      ctx.quadraticCurveTo(ctrl.px, ctrl.py, end.px, end.py);
      ctx.strokeStyle = isWireframe ? "#38bdf8" : t.color;
      ctx.lineWidth = 5 * start.scale;
      ctx.stroke();
    });
  }

  // =========================================================================
  // --- MODULE 2: INTERACTIVE KNOWLEDGE GRAPH ENGINE (177 THUẬT NGỮ) ---
  // =========================================================================
  let graphEngine = {
    canvas: null,
    ctx: null,
    nodes: [],
    links: [],
    filterCat: "all",
    searchQuery: "",
    hoverNode: null,
    dragNode: null,
    scale: 1.0,
    panX: 0,
    panY: 0,
    isPanning: false,
    panStartX: 0,
    panStartY: 0,
    animFrameId: null,
    initialized: false
  };

  const CAT_COLORS = {
    ky_thuat_nan: "#C24A35",
    nguyen_lieu: "#E89234",
    san_pham: "#2E7D32",
    dung_cu: "#8E44AD"
  };

  function initOrUpdateKnowledgeGraph() {
    if (!heritageGraphCanvas) return;
    graphEngine.canvas = heritageGraphCanvas;
    graphEngine.ctx = heritageGraphCanvas.getContext("2d");

    // Dynamic sizing to parent container
    const container = document.getElementById("graph-canvas-container");
    if (container) {
      graphEngine.canvas.width = container.clientWidth || 800;
      graphEngine.canvas.height = container.clientHeight || 540;
    }

    if (!graphEngine.initialized) {
      graphEngine.initialized = true;

      // Build Graph Data from TOHE_DICTIONARY_DATA
      buildGraphData();

      // Category Chips
      const chips = document.querySelectorAll(".graph-chip");
      chips.forEach(chip => {
        chip.addEventListener("click", () => {
          chips.forEach(c => c.classList.remove("active"));
          chip.classList.add("active");
          graphEngine.filterCat = chip.getAttribute("data-graph-cat");
          updateGraphVisibility();
        });
      });

      // Search input
      if (graphSearchInput) {
        graphSearchInput.addEventListener("input", (e) => {
          graphEngine.searchQuery = normalizeVietnamese(e.target.value.trim());
        });
      }

      // Reset zoom
      if (graphResetZoomBtn) {
        graphResetZoomBtn.addEventListener("click", () => {
          graphEngine.scale = 1.0;
          graphEngine.panX = 0;
          graphEngine.panY = 0;
        });
      }

      // Canvas Mouse Events
      setupGraphCanvasEvents();
    }

    startGraphLoop();
  }

  function buildGraphData() {
    const width = graphEngine.canvas.width;
    const height = graphEngine.canvas.height;
    const cx = width / 2;
    const cy = height / 2;

    // Create 177 Nodes
    graphEngine.nodes = TOHE_DICTIONARY_DATA.map((term, i) => {
      const angle = (i / TOHE_DICTIONARY_DATA.length) * 2 * Math.PI;
      const dist = 140 + Math.random() * 120;
      return {
        id: term.id,
        term: term.term,
        enTerm: term.enTerm || "",
        category: term.category,
        categoryLabel: term.categoryLabel,
        ipa: term.ipaVi || term.ipa,
        x: cx + Math.cos(angle) * dist + (Math.random() - 0.5) * 40,
        y: cy + Math.sin(angle) * dist + (Math.random() - 0.5) * 40,
        vx: 0,
        vy: 0,
        radius: 6,
        color: CAT_COLORS[term.category] || "#C24A35",
        degree: 0,
        visible: true
      };
    });

    // Create Edges (Cross-referenced Semantic Links)
    graphEngine.links = [];
    const nodeMap = new Map();
    graphEngine.nodes.forEach(n => nodeMap.set(n.id, n));

    TOHE_DICTIONARY_DATA.forEach(source => {
      const sNode = nodeMap.get(source.id);
      if (!sNode) return;

      if (source.relatedIds && Array.isArray(source.relatedIds)) {
        source.relatedIds.forEach(targetId => {
          const tNode = nodeMap.get(targetId);
          if (tNode && sNode !== tNode) {
            graphEngine.links.push({ source: sNode, target: tNode });
            sNode.degree++;
            tNode.degree++;
          }
        });
      }
    });

    // Scale radius by connectivity degree
    graphEngine.nodes.forEach(n => {
      n.radius = 5 + Math.min(10, Math.sqrt(n.degree) * 2.2);
    });

    if (graphStatsSummary) {
      graphStatsSummary.textContent = `${graphEngine.nodes.length} Nút thuật ngữ • ${graphEngine.links.length} Cạnh liên kết ngữ nghĩa thực địa`;
    }
  }

  function updateGraphVisibility() {
    const cat = graphEngine.filterCat;
    graphEngine.nodes.forEach(n => {
      n.visible = (cat === "all" || n.category === cat);
    });
  }

  function setupGraphCanvasEvents() {
    const canvas = graphEngine.canvas;

    canvas.addEventListener("mousedown", (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - graphEngine.panX) / graphEngine.scale;
      const mouseY = (e.clientY - rect.top - graphEngine.panY) / graphEngine.scale;

      const hit = graphEngine.nodes.find(n => {
        if (!n.visible) return false;
        const dx = n.x - mouseX;
        const dy = n.y - mouseY;
        return (dx * dx + dy * dy) <= (n.radius + 6) * (n.radius + 6);
      });

      if (hit) {
        graphEngine.dragNode = hit;
      } else {
        graphEngine.isPanning = true;
        graphEngine.panStartX = e.clientX - graphEngine.panX;
        graphEngine.panStartY = e.clientY - graphEngine.panY;
      }
    });

    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - graphEngine.panX) / graphEngine.scale;
      const mouseY = (e.clientY - rect.top - graphEngine.panY) / graphEngine.scale;

      if (graphEngine.dragNode) {
        graphEngine.dragNode.x = mouseX;
        graphEngine.dragNode.y = mouseY;
        graphEngine.dragNode.vx = 0;
        graphEngine.dragNode.vy = 0;
      } else if (graphEngine.isPanning) {
        graphEngine.panX = e.clientX - graphEngine.panStartX;
        graphEngine.panY = e.clientY - graphEngine.panStartY;
      } else {
        // Detect Hover Node
        const hover = graphEngine.nodes.find(n => {
          if (!n.visible) return false;
          const dx = n.x - mouseX;
          const dy = n.y - mouseY;
          return (dx * dx + dy * dy) <= (n.radius + 5) * (n.radius + 5);
        });

        graphEngine.hoverNode = hover || null;
        if (graphTooltip) {
          if (hover) {
            graphTooltip.style.display = "block";
            graphTooltip.style.left = `${e.clientX - rect.left}px`;
            graphTooltip.style.top = `${e.clientY - rect.top - 12}px`;
            graphTooltip.innerHTML = `
              <strong>${escapeHTML(hover.term)}</strong> ${hover.enTerm ? `<em>(${escapeHTML(hover.enTerm)})</em>` : ''}<br>
              <span style="color:#f59e0b; font-size:0.75rem;">${escapeHTML(hover.categoryLabel)}</span> • <span style="font-size:0.75rem;">${escapeHTML(hover.ipa)}</span><br>
              <small>Liên kết: ${hover.degree} thuật ngữ</small>
            `;
          } else {
            graphTooltip.style.display = "none";
          }
        }
      }
    });

    window.addEventListener("mouseup", () => {
      graphEngine.dragNode = null;
      graphEngine.isPanning = false;
    });

    canvas.addEventListener("click", (e) => {
      if (graphEngine.hoverNode) {
        renderTermDetail(graphEngine.hoverNode.id);
        switchToDetailView();
      }
    });

    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      graphEngine.scale = Math.max(0.4, Math.min(3.0, graphEngine.scale * zoomFactor));
    }, { passive: false });
  }

  function startGraphLoop() {
    if (graphEngine.animFrameId) cancelAnimationFrame(graphEngine.animFrameId);

    const cx = graphEngine.canvas.width / 2;
    const cy = graphEngine.canvas.height / 2;

    function step() {
      if (state.currentView !== "graph") return;

      const nodes = graphEngine.nodes;
      const links = graphEngine.links;
      const damping = 0.85;

      // 1. Coulomb Repulsion
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        if (!n1.visible) continue;
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          if (!n2.visible) continue;
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const distSq = dx * dx + dy * dy + 0.1;
          if (distSq < 40000) {
            const dist = Math.sqrt(distSq);
            const f = 160 / distSq;
            const fx = (dx / dist) * f;
            const fy = (dy / dist) * f;
            n1.vx -= fx;
            n1.vy -= fy;
            n2.vx += fx;
            n2.vy += fy;
          }
        }
      }

      // 2. Hooke Spring Attraction
      for (let k = 0; k < links.length; k++) {
        const link = links[k];
        if (!link.source.visible || !link.target.visible) continue;
        const dx = link.target.x - link.source.x;
        const dy = link.target.y - link.source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
        const desiredDist = 70;
        const f = (dist - desiredDist) * 0.035;
        const fx = (dx / dist) * f;
        const fy = (dy / dist) * f;
        link.source.vx += fx;
        link.source.vy += fy;
        link.target.vx -= fx;
        link.target.vy -= fy;
      }

      // 3. Center Gravity & Position update
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n === graphEngine.dragNode) continue;
        n.vx += (cx - n.x) * 0.008;
        n.vy += (cy - n.y) * 0.008;
        n.vx *= damping;
        n.vy *= damping;
        n.x += n.vx;
        n.y += n.vy;
      }

      // 4. Render
      renderGraph();
      graphEngine.animFrameId = requestAnimationFrame(step);
    }

    graphEngine.animFrameId = requestAnimationFrame(step);
  }

  function renderGraph() {
    const ctx = graphEngine.ctx;
    const canvas = graphEngine.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(graphEngine.panX, graphEngine.panY);
    ctx.scale(graphEngine.scale, graphEngine.scale);

    // Draw Links
    ctx.lineWidth = 1;
    for (let i = 0; i < graphEngine.links.length; i++) {
      const link = graphEngine.links[i];
      if (!link.source.visible || !link.target.visible) continue;

      const isHighlighted = (graphEngine.hoverNode === link.source || graphEngine.hoverNode === link.target);
      ctx.strokeStyle = isHighlighted ? "rgba(194, 74, 53, 0.85)" : "rgba(180, 180, 180, 0.22)";
      ctx.lineWidth = isHighlighted ? 2.2 : 0.8;

      ctx.beginPath();
      ctx.moveTo(link.source.x, link.source.y);
      ctx.lineTo(link.target.x, link.target.y);
      ctx.stroke();
    }

    // Draw Nodes
    const query = graphEngine.searchQuery;
    for (let i = 0; i < graphEngine.nodes.length; i++) {
      const n = graphEngine.nodes[i];
      if (!n.visible) continue;

      const matchesSearch = query && normalizeVietnamese(n.term).includes(query);
      const isHovered = (graphEngine.hoverNode === n);

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.radius, 0, 2 * Math.PI);
      ctx.fillStyle = n.color;
      ctx.fill();

      if (matchesSearch || isHovered) {
        ctx.strokeStyle = matchesSearch ? "#eab308" : "#ffffff";
        ctx.lineWidth = 3.5;
        ctx.stroke();

        // Glow halo
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius + 6, 0, 2 * Math.PI);
        ctx.strokeStyle = matchesSearch ? "rgba(234, 179, 8, 0.4)" : "rgba(255, 255, 255, 0.35)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Label when zoom is high or node is hovered / searched
      if (graphEngine.scale > 1.2 || isHovered || matchesSearch) {
        ctx.font = isHovered ? "bold 12px sans-serif" : "10px sans-serif";
        ctx.fillStyle = isHovered ? "#ffffff" : "var(--color-text-main, #374151)";
        ctx.textAlign = "center";
        ctx.fillText(n.term, n.x, n.y + n.radius + 12);
      }
    }

    ctx.restore();
  }

  // =========================================================================
  // --- MODULE 3: FIELDWORK SPATIAL GIS CARTOGRAPHY ENGINE (XUÂN LA) ---
  // =========================================================================
  const LANDMARKS_DATA = {
    dinh_lang: {
      badge: "Di tích Lịch sử - Tín ngưỡng",
      title: "Đình Làng Xuân La",
      coords: "Tọa độ: 20.7756° N, 105.8542° E",
      content: "Nơi thờ các vị Thành hoàng làng và tổ nghề nặn tò he truyền thống. Hàng năm vào ngày rằm tháng Giêng âm lịch, làng tổ chức hội thi nặn tò he để các nghệ nhân tranh tài, nặn các con giống chim cò dâng lễ cửa đình.",
      terms: ["to-he", "chim-co", "mam-le"]
    },
    khong_gian: {
      badge: "Không gian Bảo tồn Thực nghiệm",
      title: "Nhà Trưng bày Di sản Làng nghề Xuân La",
      coords: "Tọa độ: 20.7761° N, 105.8550° E",
      content: "Không gian bảo tồn và trưng bày hơn 500 mẫu hiện vật tò he qua các thời kỳ lịch sử. Nơi lưu giữ các con giống chim cò cổ truyền và tổ chức các buổi truyền dạy kỹ năng nặn tò he cho thế hệ trẻ.",
      terms: ["con-giong", "nghe-nhan", "ve-tron", "ve-dai"]
    },
    nguyen_lieu: {
      badge: "Địa bàn Canh tác & Nguyên liệu",
      title: "Vùng Lúa Nếp Cái Hoa Vàng Phượng Dực",
      coords: "Tọa độ: 20.7738° N, 105.8510° E",
      content: "Cánh đồng phù sa màu mỡ cung cấp giống lúa nếp cái hoa vàng dẻo thơm trứ danh - linh hồn của bột tò he Xuân La. Bột tò he truyền thống đạt độ dẻo mịn tuyệt đối nhờ tỷ lệ pha chế 10 phần nếp và 1 phần gạo tẻ từ vùng đất này.",
      terms: ["bot-gao-nep", "bot-gao-te", "ty-le-bot", "luoc-bot"]
    },
    song_nhue: {
      badge: "Địa lý Văn hóa Cố truyền",
      title: "Bến Cổ Làng Nghề (Lưu vực Sông Nhuệ)",
      coords: "Tọa độ: 20.7770° N, 105.8565° E",
      content: "Dòng sông Nhuệ lịch sử gắn liền với bến lấy nước nguồn luộc bột và là thủy lộ cho các chuyến đi bán dạo tò he của các cụ nghệ nhân Xuân La xưa qua khắp các chợ quê đồng bằng Bắc Bộ và đất kinh kỳ Thăng Long - Hà Nội.",
      terms: ["que-tre", "hinh-tuong-dan-gian", "mau-tu-nhien"]
    }
  };

  function initSpatialMap() {
    landmarkPins.forEach(pin => {
      pin.addEventListener("click", () => {
        landmarkPins.forEach(p => p.classList.remove("active"));
        pin.classList.add("active");

        const pinKey = pin.getAttribute("data-pin");
        const data = LANDMARKS_DATA[pinKey];
        if (!data) return;

        if (spatialBadge) spatialBadge.textContent = data.badge;
        if (spatialTitle) spatialTitle.textContent = data.title;
        if (spatialCoords) spatialCoords.textContent = data.coords;
        if (spatialContent) spatialContent.textContent = data.content;

        if (spatialTermsTags) {
          spatialTermsTags.innerHTML = "";
          data.terms.forEach(termId => {
            const matched = TOHE_DICTIONARY_DATA.find(t => t.id === termId);
            const btn = document.createElement("button");
            btn.className = "related-tag-chip";
            btn.textContent = matched ? matched.term : termId;
            btn.addEventListener("click", () => {
              if (matched) {
                renderTermDetail(matched.id);
                switchToDetailView();
              }
            });
            spatialTermsTags.appendChild(btn);
          });
        }
      });
    });
  }

  // =========================================================================
  // --- MODULE 4: ACADEMIC CITATION & OPEN SCIENCE DATA EXPORTER ---
  // =========================================================================
  let activeCitationFormat = "apa";

  function getCitationString(format = "apa") {
    const term = TOHE_DICTIONARY_DATA.find(t => t.id === state.selectedTermId) || TOHE_DICTIONARY_DATA[0];

    switch (format) {
      case "mla":
        return `Đặng, Minh Quân, và Nhóm Khảo cứu Dân tộc học. "${term.term}." Từ điển Thuật ngữ Điền dã Nghệ thuật Tò he Xuân La, CSDL Di sản Văn hóa Phi vật thể Việt Nam, 2026, tohexuanla.vn/terms/${term.id}.`;
      case "chicago":
        return `Đặng, Minh Quân, và Nhóm Khảo cứu Dân tộc học. 2026. "${term.term}." Trong Từ điển Thuật ngữ Điền dã Nghệ thuật Tò he Xuân La: Bảo tồn Tri thức Bản địa & Di sản Văn hóa Phi vật thể. Hà Nội: Di sản Văn hóa Số. https://tohexuanla.vn/terms/${term.id}.`;
      case "bibtex":
        return `@dataset{tohe_fieldwork_term_${term.id.replace(/-/g, '_')},
  author    = {Dang, Minh Quan and Fieldwork Research Team},
  title     = {{${term.term}} (${term.enTerm || ''})},
  booktitle = {Xuan La Folk Toy (To He) Fieldwork Heritage Dataset},
  year      = {2026},
  category  = {${term.categoryLabel}},
  phonetics = {${term.ipaVi || term.ipa}},
  publisher = {Digital Humanities & Intangible Cultural Heritage Archive},
  url       = {https://tohexuanla.vn/terms/${term.id}}
}`;
      case "apa":
      default:
        return `Đặng, M. Q., & Nhóm Khảo cứu Dân tộc học. (2026). "${term.term}" [Mục từ điền dã số ${term.id}]. Trong Từ điển Thuật ngữ Điền dã Nghệ thuật Tò he Xuân La: Bảo tồn Di sản Văn hóa Phi vật thể (177 mục từ). Hà Nội: CSDL Di sản Số. https://tohexuanla.vn/terms/${term.id}`;
    }
  }

  function openCitationModal() {
    if (!citationModal) return;
    citationModal.style.display = "flex";
    updateCitationDisplay();
  }

  function closeCitationModal() {
    if (!citationModal) return;
    citationModal.style.display = "none";
  }

  function updateCitationDisplay() {
    if (citationOutputText) {
      citationOutputText.textContent = getCitationString(activeCitationFormat);
    }
  }

  if (citationModalCloseBtn) {
    citationModalCloseBtn.addEventListener("click", closeCitationModal);
  }

  if (citationModal) {
    citationModal.addEventListener("click", (e) => {
      if (e.target === citationModal) closeCitationModal();
    });
  }

  citationTabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      citationTabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeCitationFormat = btn.getAttribute("data-cite-format") || "apa";
      updateCitationDisplay();
    });
  });

  if (copyCitationBtn) {
    copyCitationBtn.addEventListener("click", () => {
      const text = getCitationString(activeCitationFormat);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          showToast("Đã sao chép trích dẫn học thuật vào bộ nhớ tạm!", "info");
        }).catch(() => {
          showToast("Trích dẫn: " + text.slice(0, 50) + "...", "info");
        });
      } else {
        showToast("Đã chọn trích dẫn học thuật!", "info");
      }
    });
  }

  // Export JSON-LD
  if (exportJsonldBtn) {
    exportJsonldBtn.addEventListener("click", () => {
      const jsonLdData = {
        "@context": "https://schema.org",
        "@type": "DefinedTermSet",
        "name": "Từ điển Thuật ngữ Điền dã Nghệ thuật Tò he Xuân La",
        "alternateName": "Xuan La Folk Toy (To He) Fieldwork Terminology Dataset",
        "description": "Kho ngữ liệu số 177 thuật ngữ điền dã làng nghề tò he Xuân La, Phú Xuyên, Hà Nội.",
        "inLanguage": ["vi", "en"],
        "license": "https://creativecommons.org/licenses/by-nc-sa/4.0/",
        "creator": {
          "@type": "Person",
          "name": "Đặng Minh Quân"
        },
        "spatialCoverage": {
          "@type": "Place",
          "name": "Làng Xuân La, xã Phượng Dực, huyện Phú Xuyên, Hà Nội",
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": 20.7756,
            "longitude": 105.8542
          }
        },
        "hasDefinedTerm": TOHE_DICTIONARY_DATA.map(t => ({
          "@type": "DefinedTerm",
          "termCode": t.id,
          "name": t.term,
          "alternateName": t.enTerm || "",
          "description": t.definition,
          "disambiguatingDescription": t.enDefinition || "",
          "inDefinedTermSet": "https://tohexuanla.vn/dataset",
          "category": t.categoryLabel,
          "pronunciation": {
            "vi": t.ipaVi || t.ipa,
            "en": t.enIpa || ""
          },
          "url": `https://tohexuanla.vn/terms/${t.id}`
        }))
      };

      const blob = new Blob([JSON.stringify(jsonLdData, null, 2)], { type: "application/ld+json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tohe_heritage_dataset.jsonld";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Đang tải xuống bộ dữ liệu JSON-LD Schema.org (177 mục từ)", "info");
    });
  }

  // Export CSV
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener("click", () => {
      const headers = [
        "id", "term", "enTerm", "ipaVi", "enIpa", "category",
        "categoryLabel", "subCategory", "sectionTitle",
        "definition", "enDefinition", "tags", "related"
      ];

      const escapeCsv = (str) => {
        if (str === null || str === undefined) return '""';
        return '"' + String(str).replace(/"/g, '""') + '"';
      };

      const rows = TOHE_DICTIONARY_DATA.map(t => [
        escapeCsv(t.id),
        escapeCsv(t.term),
        escapeCsv(t.enTerm || ""),
        escapeCsv(t.ipaVi || t.ipa || ""),
        escapeCsv(t.enIpa || ""),
        escapeCsv(t.category),
        escapeCsv(t.categoryLabel),
        escapeCsv(t.subCategory),
        escapeCsv(t.sectionTitle || ""),
        escapeCsv(t.definition),
        escapeCsv(t.enDefinition || ""),
        escapeCsv(Array.isArray(t.tags) ? t.tags.join("; ") : ""),
        escapeCsv(Array.isArray(t.related) ? t.related.join("; ") : "")
      ].join(","));

      const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "tohe_fieldwork_177_terms.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Đang tải xuống bảng tổng hợp 177 thuật ngữ (UTF-8 CSV)", "info");
    });
  }

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
      closeCitationModal();
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
