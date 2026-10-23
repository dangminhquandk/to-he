/**
 * ỨNG DỤNG TỪ ĐIỂN TÒ HE - LOGIC ĐIỀU KHIỂN & TƯƠNG TÁC
 * Ngôn ngữ: JavaScript ES6+
 */

document.addEventListener("DOMContentLoaded", () => {
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
  const detailTitle = document.getElementById("detail-term-title");
  const detailIpa = document.getElementById("detail-term-ipa");
  const detailDefinition = document.getElementById("detail-term-definition");
  const detailTechniqueNote = document.getElementById("detail-technique-note");
  const detailRelatedTags = document.getElementById("detail-related-tags");
  const audioPronounceBtn = document.getElementById("audio-pronounce-btn");
  const audioWaves = document.getElementById("audio-waves");

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
      // Đếm số từ thực tế trong data
      const actualCount = TOHE_DICTIONARY_DATA.filter(item => item.category === cat.id).length;
      const countLabel = `(${actualCount || cat.countText.replace(/\D/g, '')} từ)`;

      const card = document.createElement("div");
      card.className = `category-card ${cat.bgClass} ${state.activeCategory === cat.id ? "active" : ""}`;
      card.setAttribute("data-category-id", cat.id);
      card.innerHTML = `
        <div class="cat-thumb-box">
          <img src="${cat.image}" alt="${cat.title}" class="cat-thumb-img" loading="lazy">
        </div>
        <div class="cat-bottom-row">
          <div class="cat-info">
            <span class="cat-title">${cat.title}</span>
            <span class="cat-count">${countLabel}</span>
          </div>
          <button class="cat-arrow-btn" aria-label="Xem danh mục ${cat.title}">→</button>
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
      btn.innerHTML = `<span>${sub.title}</span> <span class="count">${count}</span>`;
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

  // --- 4. RENDER CHI TIẾT THUẬT NGỮ (DETAIL VIEW) ---
  function renderTermDetail(termId) {
    const term = TOHE_DICTIONARY_DATA.find(item => item.id === termId) || TOHE_DICTIONARY_DATA[0];
    state.selectedTermId = term.id;

    detailTitle.textContent = term.term;
    detailIpa.textContent = term.ipa;
    detailDefinition.textContent = term.definition;
    detailCategoryBadge.textContent = term.categoryLabel;
    detailImage.src = term.image;
    detailImage.alt = term.term;

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
      openLightbox(term.image, `${term.term} - Nghệ thuật Tò he truyền thống`);
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
        <span>${item.term}</span>
        <span class="arrow">›</span>
      `;
      li.addEventListener("click", () => {
        renderTermDetail(item.id);
        switchToDetailView();
      });
      sidebarRelatedList.appendChild(li);
    });
  }

  // --- HÀM TIỆN ÍCH: CHUẨN HÓA TIẾNG VIỆT & BỎ DẤU (ACCENT-FOLDING) ---
  function normalizeVietnamese(str) {
    if (!str) return "";
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
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
    toast.className = `toast-message toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 350);
    }, 3200);
  }

  // --- 6. PHÁT ÂM TIẾNG VIỆT (WEB SPEECH SYNTHESIS API) ---
  audioPronounceBtn.addEventListener("click", () => {
    const term = TOHE_DICTIONARY_DATA.find(item => item.id === state.selectedTermId);
    if (!term) return;

    if (!("speechSynthesis" in window)) {
      showToast("Trình duyệt không hỗ trợ Web Speech API. Thuật ngữ: " + term.term, "warning");
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Dừng câu trước nếu có

      const utterance = new SpeechSynthesisUtterance(term.term);
      utterance.lang = "vi-VN";
      utterance.rate = 0.9;
      utterance.pitch = 1.0;

      // Hiệu ứng sóng âm thanh
      audioWaves.classList.add("active");

      utterance.onend = () => {
        audioWaves.classList.remove("active");
      };

      utterance.onerror = (e) => {
        audioWaves.classList.remove("active");
        showToast("Không thể phát âm thanh: " + (e.error || "quyền truy cập bị từ chối"), "warning");
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      audioWaves.classList.remove("active");
      showToast("Lỗi âm thanh: " + err.message, "warning");
    }
  });

  // --- 7. TÌM KIẾM & BỘ LỌC THUẬT NGỮ (MULTI-FACET INTERSECTION) ---
  function getFilteredTerms() {
    return TOHE_DICTIONARY_DATA.filter(item => {
      // 0. Lọc theo chuyên đề điền dã (subCategory)
      if (state.activeSubCategory && item.subCategory !== state.activeSubCategory) {
        return false;
      }
      // 1. Lọc theo macro category
      if (state.activeCategory && item.category !== state.activeCategory) {
        return false;
      }
      // 2. Lọc theo chữ cái (hỗ trợ cả có dấu và không dấu)
      if (state.activeLetter) {
        const targetLetter = state.activeLetter.toUpperCase();
        const firstLetterAscii = normalizeVietnamese(item.term.trim()[0] || "").toUpperCase();
        const matchesLetter = item.letter.toUpperCase() === targetLetter || firstLetterAscii === targetLetter;
        if (!matchesLetter) return false;
      }
      // 3. Lọc theo từ khóa tìm kiếm (hỗ trợ không dấu, có dấu, normalize khoảng trắng)
      if (state.searchQuery.trim()) {
        const rawQ = state.searchQuery.trim();
        const qLower = rawQ.toLowerCase().replace(/\s+/g, " ");
        const qFolded = normalizeVietnamese(rawQ);

        const matchField = (val) => {
          if (!val) return false;
          if (typeof val === "string") {
            const vLower = val.toLowerCase();
            if (vLower.includes(qLower)) return true;
            const vFolded = normalizeVietnamese(val);
            return vFolded.includes(qFolded);
          }
          if (Array.isArray(val)) {
            return val.some(matchField);
          }
          return false;
        };

        const inTerm = matchField(item.term);
        const inDef = matchField(item.definition);
        const inCat = matchField(item.categoryLabel);
        const inSec = matchField(item.sectionTitle);
        const inTags = matchField(item.tags);
        const inRelated = matchField(item.related);

        if (!inTerm && !inDef && !inCat && !inSec && !inTags && !inRelated) return false;
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
          <img src="${term.image}" alt="${term.term}" loading="lazy">
        </div>
        <span class="term-card-badge ${catMeta ? catMeta.bgClass : ''}">
          ${term.categoryLabel}
        </span>
        <h4 class="term-card-title">${term.term}</h4>
        <div class="term-card-ipa">${term.ipa}</div>
        <p class="term-card-excerpt">${term.definition}</p>
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
      if (sub) filterTexts.push(`Chuyên đề: "${sub.title}"`);
    }
    if (state.activeCategory) {
      const cat = CATEGORIES_METADATA.find(c => c.id === state.activeCategory);
      if (cat) filterTexts.push(`Danh mục: "${cat.title}"`);
    }
    if (state.activeLetter) {
      filterTexts.push(`Bắt đầu bằng chữ cái: "${state.activeLetter}"`);
    }
    if (state.searchQuery.trim()) {
      filterTexts.push(`Từ khóa: "${state.searchQuery.trim()}"`);
    }

    if (filterTexts.length > 0) {
      filterStatusBanner.style.display = "flex";
      filterStatusText.textContent = `Đang lọc theo: ${filterTexts.join(" • ")}`;
    } else {
      filterStatusBanner.style.display = "none";
    }
  }

  function resetAllFilters() {
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
    state.searchQuery = query;
    searchInput.value = query;
    clearSearchBtn.style.display = query.trim() ? "block" : "none";
    updateFilterBanner();
    switchToListAndView(`Kết quả tìm kiếm cho: "${query}"`);
  }

  // Sự kiện Search Input & Button
  searchBtn.addEventListener("click", () => {
    performSearch(searchInput.value);
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      performSearch(searchInput.value);
    }
  });

  searchInput.addEventListener("input", () => {
    clearSearchBtn.style.display = searchInput.value.length > 0 ? "block" : "none";
  });

  clearSearchBtn.addEventListener("click", () => {
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
