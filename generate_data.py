# -*- coding: utf-8 -*-
import zipfile
import re
import json
import unicodedata

docx_path = 'Tổng hợp thuật ngữ thu thập được trong chuyến đi điền dã_.docx'
with zipfile.ZipFile(docx_path) as z:
    xml_content = z.read('word/document.xml').decode('utf-8')
    paragraphs = re.findall(r'<w:p[ >].*?</w:p>', xml_content)
    raw_texts = []
    for p in paragraphs:
        t_matches = re.findall(r'<w:t(?: [^>]*)?>(.*?)</w:t>', p)
        if t_matches:
            txt = ''.join(t_matches).strip()
            if txt:
                raw_texts.append(txt)

def remove_accents(input_str):
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    return ''.join([c for c in nfkd_form if not unicodedata.combining(c)]).replace('đ', 'd').replace('Đ', 'D')

def make_id(term, index):
    clean = remove_accents(term.lower())
    clean = re.sub(r'[^a-z0-9]+', '-', clean).strip('-')
    if not clean:
        clean = f'term-{index}'
    return clean

# Custom definitions for short entries
SHORT_DEFS = {
    "mạch nha": "Chất tạo ngọt tự nhiên từ mầm lúa giúp khối bột giữ độ dẻo mềm lâu, không bị khô giòn khi gặp gió.",
    "chõ": "Dụng cụ dùng để hấp chín khối bột bằng hơi nước hoặc cơi tre ủ ẩm giữ nhiệt cho bột suốt ngày dài.",
    "ve tròn": "Thao tác đặt khối bột vào lòng bàn tay xoay tròn đều để tạo viên bi bột tròn mịn, làm đầu hoặc mắt con giống.",
    "ve dài": "Lăn khối bột tròn thành sợi thon dài trên mặt phẳng, dùng làm thân rồng, cành hoa, đuôi sam.",
    "đàn mỏng": "Kỹ thuật dùng ngón tay hoặc dao nẹp miết dàn mỏng phiến bột thành lớp đều như lụa.",
    "3v": "Cách gọi tắt ba thao tác cốt lõi của nghề tò he: Vê bột, Véo bột và Tạo vân bằng lược sừng.",
    "nét co": "Độ co rút tự nhiên của khối bột nếp khi tiếp xúc với không khí trong quá trình khô dần.",
    "đắp / ghép / điểm thêm": "Thao tác gắn thêm các chi tiết phụ nhỏ li ti lên bề mặt sản phẩm để hoàn thiện thần thái.",
    "thân trục": "Trục thân chính của con giống, là trụ đỡ chịu lực gắn liền với que tre.",
    "chân trụ": "Bộ phận chân chịu lực giúp con giống đứng vững hoặc bám chặt vào que tre.",
    "mấu nối": "Điểm tiếp giáp liên kết giữa hai bộ phận khác nhau của con tò he.",
    "gờ nổi": "Đường nổi nhô lên tạo khối cơ bắp, đai giáp hoặc nếp gấp trang phục.",
    "nếp gấp": "Đường gấp mô phỏng nếp vải áo dài, vạt áo tứ thân của nhân vật.",
    "vân xoắn": "Họa tiết xoắn ốc tạo sừng, râu hoặc mây cuộn trên linh vật.",
    "chóp nhọn": "Đầu mút vuốt nhọn của mào gà, tai thú, đuôi rồng hoặc búp hoa sen.",
    "đầu móc": "Chi tiết uốn cong móc ngược ở đầu đuôi hoặc mũi hài của tượng dân gian.",
    "cánh xếp": "Kỹ thuật xếp các lớp cánh hoa hoặc cánh chim so le nhiều tầng tạo chiều sâu.",
    "đuôi cuộn": "Đuôi con giống được uốn lượn cong tròn mềm mại vút lên không trung.",
    "con bánh rỗng": "Một dạng tạo hình bánh con bột truyền thống có kết cấu rỗng bên trong.",
    "chim cò": "Tiền thân của tò he, làm hoàn toàn bằng gạo tẻ luộc chín, ăn được, dùng dâng cúng thần hoàng hoặc làm đồ chơi trẻ nhỏ xưa.",
    "ông tiến sĩ": "Hình tượng tôn vinh đạo học trong Tết Trung Thu, xuất hiện sau thời chim cò, làm từ gạo tẻ pha gạo nếp.",
    "tò he": "Sản phẩm đồ chơi dân gian gắn còi sậy thổi 'tò te he', sử dụng phụ gia bảo quản, phong phú về tạo hình, không ăn được.",
    "bánh vòng": "Một tên gọi dân gian của sản phẩm bột tạo hình truyền thống làng Xuân La.",
    "ghính": "Cách phát âm cổ của từ 'gánh', chỉ chiếc đòn gánh tre mang vác hòm đồ nghề tò he.",
    "con tròn": "Phân loại bánh con bột xưa có đế khung nứa đỡ bên dưới cho vững chãi.",
    "con bệt": "Phân loại bánh con bột xưa không có đế, đặt nằm trực tiếp trên đĩa hoặc mẹt lá chuối."
}

subcategories_meta = [
    {"id": "nguyen_lieu_bot", "title": "Nguyên liệu & Trạng thái bột", "cat": "nguyen_lieu"},
    {"id": "che_bien_bot", "title": "Công đoạn chế biến bột", "cat": "ky_thuat_nan"},
    {"id": "thao_tac_nan", "title": "Thao tác nặn & Tạo hình", "cat": "ky_thuat_nan"},
    {"id": "ghep_noi", "title": "Ghép nối & Tạo chi tiết", "cat": "ky_thuat_nan"},
    {"id": "dung_cu_nghe", "title": "Dụng cụ & Vật liệu phụ trợ", "cat": "dung_cu"},
    {"id": "mau_sac", "title": "Màu sắc & Hoàn thiện", "cat": "nguyen_lieu"},
    {"id": "loi_ky_thuat", "title": "Lỗi kỹ thuật & Khắc phục", "cat": "ky_thuat_nan"},
    {"id": "hinh_tuong", "title": "Sản phẩm & Hình tượng dân gian", "cat": "san_pham"}
]

subcat_title_map = {s['id']: s['title'] for s in subcategories_meta}

sections = [
    ('I. Nguyên liệu và trạng thái của bột', 'nguyen_lieu', 'nguyen_lieu_bot', 'Nguyên liệu', 'assets/cat_nguyen_lieu.jpg', 'Nhóm nguyên liệu tinh bột tự nhiên và trạng thái vật lý của khối bột.'),
    ('II. Các công đoạn chế biến bột', 'ky_thuat_nan', 'che_bien_bot', 'Kỹ thuật nặn', 'assets/cat_ky_thuat_nan.jpg', 'Các công đoạn xay, giã, luộc, hấp, thấu và luyện bột gia truyền.'),
    ('III. Thao tác nặn và tạo hình', 'ky_thuat_nan', 'thao_tac_nan', 'Kỹ thuật nặn', 'assets/cat_ky_thuat_nan.jpg', 'Các thao tác cơ bản và kỹ năng bàn tay để định hình khối bột.'),
    ('IV. Ghép nối và tạo chi tiết', 'ky_thuat_nan', 'ghep_noi', 'Kỹ thuật nặn', 'assets/cat_ky_thuat_nan.jpg', 'Kỹ thuật găm cốt, miết mí, tỉa gờ, khía vảy và hoàn thiện chi tiết tinh xảo.'),
    ('V. Dụng cụ và vật liệu phụ trợ', 'dung_cu', 'dung_cu_nghe', 'Dụng cụ', 'assets/cat_dung_cu.jpg', 'Bộ dụng cụ hành nghề: que tre, lược sừng, dao nẹp, đòn gánh, bùi nhùi rơm.'),
    ('VI. Màu sắc và hoàn thiện sản phẩm', 'nguyen_lieu', 'mau_sac', 'Nguyên liệu', 'assets/cat_nguyen_lieu.jpg', 'Nghệ thuật nhuộm màu ngũ sắc thảo mộc và phủ bóng hoàn thiện.'),
    ('VII. Lỗi kỹ thuật và cách khắc phục', 'ky_thuat_nan', 'loi_ky_thuat', 'Kỹ thuật nặn', 'assets/cat_ky_thuat_nan.jpg', 'Các hiện tượng lỗi hư hại thường gặp và kinh nghiệm khắc phục của thợ giỏi.'),
    ('VIII. Sản phẩm và hình tượng truyền thống', 'san_pham', 'hinh_tuong', 'Sản phẩm', 'assets/cat_san_pham.jpg', 'Các linh vật, bộ lục súc, con giống Ta - Khách và dòng chảy lịch sử tò he.')
]

current_sec = None
items = []
seen_ids = set()
seen_terms = set()
mam_bong_count = 0

# Insert Gà trống first as the iconic cornerstone product
items.append({
    "id": "ga-trong",
    "term": "Gà trống",
    "category": "san_pham",
    "subCategory": "hinh_tuong",
    "categoryLabel": "Sản phẩm",
    "sectionTitle": "VIII. Sản phẩm và hình tượng truyền thống",
    "ipa": "/gà trống/",
    "letter": "G",
    "image": "assets/detail_ga_trong.jpg",
    "definition": "Là một trong những hình tượng phổ biến và tiêu biểu nhất trong tò he, thường được nặn từ khối bột màu, tạo hình với các chi tiết như mào, đuôi, cánh, chân... Gà trống tượng trưng cho ngũ đức, sự mạnh mẽ, may mắn và thường xuất hiện trong các dịp lễ, Tết.",
    "fieldNote": "Tư liệu thực địa điền dã làng nghề Tò he Xuân La.",
    "tags": ["Sản phẩm", "Linh vật", "Bộ lục súc", "Làng nghề Xuân La"],
    "techniqueSummary": "Tạo hình từ khối bột màu, kỹ thuật ấn mào, khía lông cánh bằng lược và uốn cong lông đuôi."
})
seen_ids.add("ga-trong")
seen_terms.add("gà trống")

for line_idx, line in enumerate(raw_texts):
    # Check section title
    sec_match = False
    for s_title, cat, subcat, cat_lbl, img, s_desc in sections:
        if line.startswith(s_title[:4]):
            current_sec = (s_title, cat, subcat, cat_lbl, img, s_desc)
            sec_match = True
            break
    if sec_match:
        continue
    if not current_sec:
        continue

    # Clean bullet/prefix
    clean_line = re.sub(r'^[+\-*•\s]+', '', line).strip()
    if not clean_line:
        continue

    # Parse term and defn
    if ':' in clean_line:
        parts = clean_line.split(':', 1)
        term_raw = parts[0].strip()
        defn = parts[1].strip()
    elif '(' in clean_line and ')' in clean_line and clean_line.index('(') > 0:
        idx1 = clean_line.index('(')
        idx2 = clean_line.rindex(')')
        term_raw = clean_line[:idx1].strip()
        defn = clean_line[idx1+1:idx2].strip()
    else:
        term_raw = clean_line
        defn = ""

    # Clean term_raw parentheticals
    term = re.sub(r'\s*\([^)]*\)', '', term_raw).strip()
    if not term:
        term = term_raw

    # Handle duplicates in field notes (e.g. Mâm bồng appeared twice)
    if term.lower() == 'mâm bồng':
        mam_bong_count += 1
        if mam_bong_count == 1:
            term = 'Mâm bồng lễ phẩm'
            if not defn:
                defn = 'Nhóm sản phẩm hoặc hình tượng liên quan đến đồ bày lễ truyền thống.'
        else:
            term = 'Mâm bồng tạo hình'
            if not defn:
                defn = 'Nhóm sản phẩm tạo hình bánh con bột dùng để bày lễ cúng trang trọng.'

    # Capitalize term appropriately
    term_cap = term[:1].upper() + term[1:]

    # Match short defs if definition is empty or generic
    lower_t = term.lower()
    if not defn or len(defn) < 10:
        for sk, sv in SHORT_DEFS.items():
            if sk in lower_t:
                defn = sv
                break
        if not defn:
            defn = f'Thuật ngữ chuyên môn ngành tò he làng Xuân La ghi nhận trong đợt điền dã thực địa.'

    # First Letter
    first_char = term_cap[0].upper()
    first_char_ascii = remove_accents(first_char).upper()
    if not ('A' <= first_char_ascii <= 'Z'):
        first_char_ascii = 'T'

    # ID
    tid = make_id(term_cap, line_idx)
    if tid in seen_ids:
        tid = f'{tid}-{line_idx}'
    seen_ids.add(tid)
    seen_terms.add(term_cap.lower())

    # IPA
    ipa = f'/{term_cap.lower()}/'

    # Image
    img = current_sec[4]
    if 'gà trống' in lower_t:
        img = 'assets/detail_ga_trong.jpg'
    elif any(k in lower_t for k in ['rồng', 'thỏ', 'ngựa', 'lục súc', 'tứ linh', 'khách', 'bùi nhùi']):
        img = 'assets/hero_banner.jpg'
    elif 'nghệ nhân' in lower_t or 'gánh' in lower_t or 'hòm' in lower_t:
        img = 'assets/artisan_sketch.jpg'

    sub_title = subcat_title_map.get(current_sec[2], current_sec[3])
    tags = [current_sec[3], sub_title, "Làng nghề Xuân La", "Dân gian"]

    items.append({
        "id": tid,
        "term": term_cap,
        "category": current_sec[1],
        "subCategory": current_sec[2],
        "categoryLabel": current_sec[3],
        "sectionTitle": current_sec[0],
        "ipa": ipa,
        "letter": first_char_ascii,
        "image": img,
        "definition": defn,
        "fieldNote": "Tư liệu thực địa điền dã làng nghề Tò he Xuân La.",
        "tags": tags
    })

# Compute 100% valid, existing related links
term_lookup = {it['term']: it for it in items}
id_lookup = {it['id']: it for it in items}

for item in items:
    # Find others in same subcategory
    same_sub = [other['term'] for other in items if other['subCategory'] == item['subCategory'] and other['id'] != item['id']]
    # If not enough, find others in same macro category
    if len(same_sub) < 4:
        same_cat = [other['term'] for other in items if other['category'] == item['category'] and other['id'] != item['id'] and other['term'] not in same_sub]
        candidates = same_sub + same_cat
    else:
        candidates = same_sub
    
    selected_related = candidates[:4]
    # Verify all selected terms exist
    valid_related = [t for t in selected_related if t in term_lookup]
    item['related'] = valid_related
    item['relatedIds'] = [term_lookup[t]['id'] for t in valid_related]

# Calculate Category counts
categories_meta = [
  {
    "id": "ky_thuat_nan",
    "title": "Kỹ thuật nặn",
    "countText": f"{len([it for it in items if it['category'] == 'ky_thuat_nan'])} từ",
    "image": "assets/cat_ky_thuat_nan.jpg",
    "bgClass": "card-pastel-orange",
    "color": "#E2583E",
    "description": "Các kỹ thuật vê, nắn, ấn, tỉa bột, ghép nối và xử lý lỗi gia truyền của nghệ nhân làng Xuân La."
  },
  {
    "id": "nguyen_lieu",
    "title": "Nguyên liệu",
    "countText": f"{len([it for it in items if it['category'] == 'nguyen_lieu'])} từ",
    "image": "assets/cat_nguyen_lieu.jpg",
    "bgClass": "card-pastel-green",
    "color": "#4A934A",
    "description": "Bột nếp, bột tẻ, các trạng thái lý tính của bột và màu sắc ngũ sắc thảo mộc thiên nhiên."
  },
  {
    "id": "san_pham",
    "title": "Sản phẩm",
    "countText": f"{len([it for it in items if it['category'] == 'san_pham'])} từ",
    "image": "assets/cat_san_pham.jpg",
    "bgClass": "card-pastel-blue",
    "color": "#3F87B5",
    "description": "Con giống Ta (Đồng Xuân), con giống Khách, linh vật, tứ linh, bộ lục súc và dòng chảy lịch sử tò he."
  },
  {
    "id": "dung_cu",
    "title": "Dụng cụ",
    "countText": f"{len([it for it in items if it['category'] == 'dung_cu'])} từ",
    "image": "assets/cat_dung_cu.jpg",
    "bgClass": "card-pastel-purple",
    "color": "#8359A8",
    "description": "Bộ que tre, lược sừng, dao nẹp, còi sậy, hòm đồ nghề và bùi nhùi rơm huyền thoại."
  }
]

alphabet_list = [
  "A", "B", "C", "D", "E", "F", "G",
  "H", "I", "J", "K", "L", "M", "N",
  "O", "P", "Q", "R", "S", "T", "U",
  "V", "W", "X", "Y", "Z"
]

js_code = f"""/**
 * BỘ TỪ ĐIỂN TÒ HE XUÂN LA TOÀN TẬP
 * Nguồn tư liệu: Điền dã thực địa làng nghề Tò he Xuân La, Phú Xuyên, Hà Nội
 * Tổng số mục từ vựng: {len(items)} thuật ngữ
 */

var TOHE_DICTIONARY_DATA = {json.dumps(items, ensure_ascii=False, indent=2)};

var CATEGORIES_METADATA = {json.dumps(categories_meta, ensure_ascii=False, indent=2)};

var SUBCATEGORIES_METADATA = {json.dumps(subcategories_meta, ensure_ascii=False, indent=2)};

var ALPHABET_LIST = {json.dumps(alphabet_list, ensure_ascii=False, indent=2)};

if (typeof window !== "undefined") {{
  window.TOHE_DICTIONARY_DATA = TOHE_DICTIONARY_DATA;
  window.CATEGORIES_METADATA = CATEGORIES_METADATA;
  window.SUBCATEGORIES_METADATA = SUBCATEGORIES_METADATA;
  window.ALPHABET_LIST = ALPHABET_LIST;
}}

if (typeof module !== "undefined" && module.exports) {{
  module.exports = {{ TOHE_DICTIONARY_DATA, CATEGORIES_METADATA, SUBCATEGORIES_METADATA, ALPHABET_LIST }};
}}
"""

with open('data.js', 'w', encoding='utf-8') as f:
    f.write(js_code)

print(f'Successfully regenerated data.js with {len(items)} items!')
