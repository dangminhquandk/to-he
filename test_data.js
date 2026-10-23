/**
 * SCRIPT KIỂM THỬ TÍNH TOÀN VẸN DỮ LIỆU ĐIỀN DÃ (DATA INTEGRITY AUDIT)
 * Thực thi: node test_data.js
 */

const data = require('./data.js');
const TOHE_DATA = data.TOHE_DICTIONARY_DATA;
const SUBCAT_META = data.SUBCATEGORIES_METADATA;

console.log("==================================================================");
console.log("       DATA INTEGRITY & SCHEMA AUDIT - TỪ ĐIỂN TÒ HE");
console.log("==================================================================\n");

let errors = 0;

// 1. Tổng số lượng
console.log(`[1] Tổng số lượng thuật ngữ: ${TOHE_DATA.length}`);
if (TOHE_DATA.length !== 177) {
  console.error(` ❌ LỖI: Kỳ vọng 177 thuật ngữ, thực tế có ${TOHE_DATA.length}`);
  errors++;
} else {
  console.log(" ✅ ĐẠT: Chính xác 177 thuật ngữ.\n");
}

// 2. Tính duy nhất của ID & Term
const idSet = new Set();
const termSet = new Set();
let dupIds = 0;
let dupTerms = 0;

TOHE_DATA.forEach(t => {
  if (idSet.has(t.id)) {
    console.error(` ❌ Trùng lặp ID: ${t.id}`);
    dupIds++;
  }
  idSet.add(t.id);

  const norm = t.term.toLowerCase().trim();
  if (termSet.has(norm)) {
    console.error(` ❌ Trùng lặp tên thuật ngữ: ${t.term}`);
    dupTerms++;
  }
  termSet.add(norm);
});

if (dupIds === 0 && dupTerms === 0) {
  console.log(" ✅ ĐẠT: Không có ID hoặc tên thuật ngữ nào bị trùng lặp (100% độc bản).\n");
} else {
  errors += dupIds + dupTerms;
}

// 3. Phân bổ 4 danh mục chính
const counts = { ky_thuat_nan: 0, nguyen_lieu: 0, san_pham: 0, dung_cu: 0 };
TOHE_DATA.forEach(t => {
  if (counts[t.category] !== undefined) counts[t.category]++;
});
console.log("[2] Phân bổ 4 danh mục chính:");
console.log(` - Kỹ thuật nặn: ${counts.ky_thuat_nan}/99`);
console.log(` - Nguyên liệu:   ${counts.nguyen_lieu}/33`);
console.log(` - Sản phẩm:     ${counts.san_pham}/29`);
console.log(` - Dụng cụ:       ${counts.dung_cu}/16`);

if (counts.ky_thuat_nan === 99 && counts.nguyen_lieu === 33 && counts.san_pham === 29 && counts.dung_cu === 16) {
  console.log(" ✅ ĐẠT: Tỷ lệ phân bổ danh mục chính xác 100%.\n");
} else {
  console.error(" ❌ LỖI: Sai lệch tỷ lệ phân bổ danh mục.");
  errors++;
}

// 4. Phân bổ 8 chuyên đề điền dã
const validSubcatIds = new Set(SUBCAT_META.map(s => s.id));
const invalidSubcat = TOHE_DATA.filter(t => !t.subCategory || !validSubcatIds.has(t.subCategory));
console.log(`[3] Kiểm tra 8 chuyên đề điền dã (subCategory):`);
if (invalidSubcat.length === 0) {
  console.log(" ✅ ĐẠT: 100% phần tử thuộc về 8 chuyên đề điền dã hợp lệ.\n");
} else {
  console.error(` ❌ LỖI: Có ${invalidSubcat.length} mục không có chuyên đề hợp lệ.`);
  errors += invalidSubcat.length;
}

// 5. Schema Validation (bắt buộc: id, term, ipa, category, subCategory, definition, tags, related)
const reqFields = ['id', 'term', 'ipa', 'category', 'subCategory', 'definition', 'tags', 'related'];
let missingCount = 0;
TOHE_DATA.forEach(t => {
  reqFields.forEach(f => {
    if (!t[f] || (Array.isArray(t[f]) && t[f].length === 0)) {
      missingCount++;
    }
  });
});
console.log(`[4] Kiểm tra cấu trúc Schema thực thể:`);
if (missingCount === 0) {
  console.log(" ✅ ĐẠT: 100% thực thể có đầy đủ các trường bắt buộc (id, term, ipa, category, subCategory, definition, tags, related).\n");
} else {
  console.error(` ❌ LỖI: Thiếu trường dữ liệu ở ${missingCount} vị trí.`);
  errors += missingCount;
}

// 6. Semantic Graph (Đồ thị ngữ nghĩa - Broken links)
const allTerms = new Set(TOHE_DATA.map(t => t.term.toLowerCase().trim()));
let brokenCount = 0;
TOHE_DATA.forEach(t => {
  (t.related || []).forEach(rel => {
    if (!allTerms.has(rel.toLowerCase().trim())) {
      console.error(` ❌ Broken Link: Từ [${t.term}] trỏ đến [${rel}] không tồn tại.`);
      brokenCount++;
    }
  });
});
console.log(`[5] Kiểm tra liên kết chéo đồ thị ngữ nghĩa (Cross-referencing):`);
if (brokenCount === 0) {
  console.log(" ✅ ĐẠT: Không có liên kết hỏng (0 broken links). Mọi từ liên quan đều tồn tại.\n");
} else {
  console.error(` ❌ LỖI: Phát hiện ${brokenCount} liên kết hỏng.`);
  errors += brokenCount;
}

console.log("==================================================================");
if (errors === 0) {
  console.log("🎉 KẾT QUẢ: 100% TIÊU CHÍ TOÀN VẸN DỮ LIỆU ĐÃ VƯỢT QUA KIỂM THỬ!");
  process.exit(0);
} else {
  console.error(`💥 KẾT QUẢ: PHÁT HIỆN ${errors} LỖI DỮ LIỆU.`);
  process.exit(1);
}
