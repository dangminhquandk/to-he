# -*- coding: utf-8 -*-
"""
Script nâng cấp Từ điển Tò he sang chuẩn Song ngữ Toàn diện (Bilingual Folk Dictionary)
Đáp ứng chuẩn:
1. Phiên âm tiếng Việt (ipaVi / ipa)
2. Giải nghĩa tiếng Việt (definition)
3. Dịch tiếng Anh (enTerm)
4. Phiên âm tiếng Anh (enIpa)
5. Giải nghĩa tiếng Anh (enDefinition)
6. Đa phương tiện Hình ảnh & Video (image, videoUrl, mediaType)
"""

import json
import re

# Từ điển ánh xạ tiếng Anh chuyên sâu cho 177 thuật ngữ Tò he
EN_DICTIONARY = {
    "Gà trống": {
        "en": "Rooster Figurine",
        "ipa": "/ˈruː.stər ˈfɪɡ.jər.iːn/",
        "def": "A traditional folk rooster toy sculpted on a stick, embodying courage, five cardinal virtues, and good fortune in Vietnamese culture."
    },
    "Bột nếp": {
        "en": "Glutinous Rice Dough",
        "ipa": "/ˈɡluː.tɪ.nəs raɪs dəʊ/",
        "def": "Pliable sticky rice dough providing the fundamental elasticity and smooth sheen required for Tò he figures."
    },
    "Bột tẻ": {
        "en": "Non-Glutinous Rice Dough",
        "ipa": "/nɒn ˈɡluː.tɪ.nəs raɪs dəʊ/",
        "def": "Common rice flour dough blended in specific ratios to impart structural rigidity and prevent figurine drooping."
    },
    "Bột đao /  bột mì": {
        "en": "Tapioca & Wheat Flour Blend",
        "ipa": "/ˌtæp.iˈoʊ.kə ænd wiːt flaʊər/",
        "def": "Supplementary starches introduced into modern dough mixes to alter surface plasticity and prolong durability."
    },
    "Bột ung": {
        "en": "Aged / Fermented Dough",
        "ipa": "/eɪdʒd dəʊ/",
        "def": "A traditional dough state undergoing natural resting and moisture settling, noted in artisan fieldwork records."
    },
    "Bột nát": {
        "en": "Over-Moistened Slumped Dough",
        "ipa": "/ˈoʊ.vər ˈmɔɪ.sənd dəʊ/",
        "def": "Dough that has lost its internal firmness due to excess moisture, making it difficult to maintain standing shapes."
    },
    "Bột thơm": {
        "en": "Aromatic Scented Dough",
        "ipa": "/ˌær.əˈmæt.ɪk ˈsen.tɪd dəʊ/",
        "def": "Dough infused with subtle botanical fragrances or floral waters to evoke pleasant festive memories."
    },
    "Bột trân châu": {
        "en": "Pearl Starch Dough",
        "ipa": "/pɜːrl stɑːrtʃ dəʊ/",
        "def": "A specialized dough classification noted in artisan fieldwork records requiring verification."
    },
    "Bột dong riềng": {
        "en": "Arrowroot Canna Dough",
        "ipa": "/ˈær.oʊ.ruːt ˈkæn.ə dəʊ/",
        "def": "Starch extracted from edible canna rhizomes, tested experimentally as an alternative binding agent."
    },
    "Bột dẻo": {
        "en": "Malleable Elastic Dough",
        "ipa": "/ˈmæl.i.ə.bəl ɪˈlæs.tɪk dəʊ/",
        "def": "Dough possessing optimal plasticity, capable of enduring extensive manipulation without cracking or tearing."
    },
    "Bột sống": {
        "en": "Raw Uncooked Dough",
        "ipa": "/rɔː ʌnˈkʊkt dəʊ/",
        "def": "The raw milled rice flour mixture before undergoing steam or boiling gelatinization."
    },
    "Bột chín": {
        "en": "Cooked Gelatinized Dough",
        "ipa": "/kʊkt ˌdʒel.əˈtɪn.aɪzd dəʊ/",
        "def": "Dough that has undergone heat treatment, activating starch cohesion into a pliable, workable mass."
    },
    "Bột bở": {
        "en": "Crumbly Incohesive Dough",
        "ipa": "/ˈkrʌm.bli ˌɪn.koʊˈhiː.sɪv dəʊ/",
        "def": "Dough lacking gluten cohesion, causing it to flake and fracture under the artisan's touch."
    },
    "Bột dính tay": {
        "en": "Over-Tacky Dough",
        "ipa": "/ˈoʊ.vər ˈtæk.i dəʊ/",
        "def": "Dough with excessive surface tackiness that clings to fingers, requiring adjustments with oil or cornstarch."
    },
    "Bột nghe tay": {
        "en": "Responsive Dough (Artisan Touch)",
        "ipa": "/rɪˈspɒn.sɪv dəʊ/",
        "def": "An artisan insider term describing dough at ideal warmth and suppleness, obediently conforming to subtle finger pressure."
    },
    "Độ đứng bột": {
        "en": "Dough Standing Rigidity",
        "ipa": "/dəʊ ˈstæn.dɪŋ rɪˈdʒɪd.ə.ti/",
        "def": "The structural capability of sculpted dough to hold erect vertical silhouettes on skewers without sagging over time."
    },
    "Kéo sợi": {
        "en": "Tensile Pull Stretch Test",
        "ipa": "/ˈten.saɪl pʊl stretʃ test/",
        "def": "The tactile inspection of pulling a dough sample into a slender strand to assess tensile elasticity and toughness."
    },
    "Mạch nha": {
        "en": "Malt Sugar Syrup",
        "ipa": "/mɔːlt ˈʃʊɡ.ər ˈsɪr.əp/",
        "def": "Natural maltose syrup kneaded into warm cooked dough to preserve moisture, flexibility, and prevent brittleness."
    },
    "Phụ gia / keo": {
        "en": "Safe Modern Binders",
        "ipa": "/seɪf ˈmɒd.ən ˈbaɪn.dərz/",
        "def": "Safe food-grade additives incorporated into contemporary dough to resist humidity, mold, and atmospheric cracking."
    },
    "Ngâm gạo": {
        "en": "Grain Soaking",
        "ipa": "/ɡreɪn ˈsoʊ.kɪŋ/",
        "def": "Submerging selected rice in clean water for several hours to hydrate starch granules prior to milling."
    },
    "Giã gạo": {
        "en": "Mortar Pounding",
        "ipa": "/ˈmɔːr.tər ˈpaʊn.dɪŋ/",
        "def": "Pounding soaked rice in traditional stone mortars to break grains into superfine flour particles."
    },
    "Nghiền bột": {
        "en": "Flour Wet-Milling",
        "ipa": "/flaʊər wet ˈmɪl.ɪŋ/",
        "def": "Milling soaked rice with water through stone or mechanical burrs into a silky wet starch slurry."
    },
    "Rây bột/dây bột": {
        "en": "Flour Sifting",
        "ipa": "/flaʊər ˈsɪf.tɪŋ/",
        "def": "Passing wet or dry flour through fine woven mesh to remove coarse debris and grain husks."
    },
    "Luộc bột": {
        "en": "Dough Boiling",
        "ipa": "/dəʊ ˈbɔɪ.lɪŋ/",
        "def": "Submerging raw dough blocks in boiling water to cook the outer perimeter while keeping the interior dense."
    },
    "Hấp bột": {
        "en": "Dough Steaming",
        "ipa": "/dəʊ ˈstiː.mɪŋ/",
        "def": "Cooking dough gently using saturated steam in bamboo baskets, ensuring uniform tenderness throughout."
    },
    "Thấu bột": {
        "en": "Deep Kneading & Tempering",
        "ipa": "/diːp ˈniː.dɪŋ ænd ˈtem.pər.ɪŋ/",
        "def": "Vigorous continuous folding and pressing of hot dough to eliminate air pockets and build silky cohesion."
    },
    "Nện bột": {
        "en": "Dough Striking",
        "ipa": "/dəʊ ˈstraɪ.kɪŋ/",
        "def": "Striking cooked dough forcefully with pestles or fists to align starch chains and enhance chewy flexibility."
    },
    "Vắt bột": {
        "en": "Moisture Pressing",
        "ipa": "/ˈmɔɪs.tʃər ˈpres.ɪŋ/",
        "def": "Pressing wet milled dough in cotton sacks beneath heavy weights to expel surplus water."
    },
    "Nhào bột": {
        "en": "Standard Dough Kneading",
        "ipa": "/ˈstæn.dəd dəʊ ˈniː.dɪŋ/",
        "def": "The continuous manual cycle of rolling, folding, and palm-pressing dough into homogeneous masses."
    },
    "Chia bột": {
        "en": "Dough Portioning",
        "ipa": "/dəʊ ˈpɔːr.ʃən.ɪŋ/",
        "def": "Dividing the large master dough block into individual working balls for distinct color dyeing."
    },
    "Đấu màu": {
        "en": "Artisan Color Mixing",
        "ipa": "/ˈɑːr.tɪ.zən ˈkʌl.ər ˈmɪk.sɪŋ/",
        "def": "Blending primary pigments in proprietary proportions to produce traditional nuanced hues."
    },
    "Nhuộm màu": {
        "en": "Pigment Infusion",
        "ipa": "/ˈpɪɡ.mənt ɪnˈfjuː.ʒən/",
        "def": "Incorporating botanical or food-safe color extracts into warm cooked dough."
    },
    "Thấu màu/nhuộm màu (từ ngữ nghề)": {
        "en": "Color Permeation Working",
        "ipa": "/ˈkʌl.ər ˌpɜːr.miˈeɪ.ʃən ˈwɜːr.kɪŋ/",
        "def": "Exhaustive kneading until pigments disperse fully and evenly throughout the dough without any marbling."
    },
    "Chõ": {
        "en": "Bamboo Steamer / Warming Caddy",
        "ipa": "/bæmˈbuː ˈstiː.mər/",
        "def": "A woven bamboo receptacle used to steam dough or insulated to keep it warm and moist during village fairs."
    },
    "Vọc bột": {
        "en": "Intuitive Dough Handling",
        "ipa": "/ɪnˈtjuː.ɪ.tɪv dəʊ ˈhæn.dlɪŋ/",
        "def": "Colloquial idiom describing playful, exploratory kneading and manipulation of colored dough."
    },
    "Nắn bột": {
        "en": "Manual Volume Shaping",
        "ipa": "/ˈmæn.ju.əl ˈvɒl.juːm ˈʃeɪ.pɪŋ/",
        "def": "Applying direct finger pressure to establish the initial 3D anatomical volume from a dough lump."
    },
    "Vê bột": {
        "en": "Palm Rolling",
        "ipa": "/pɑːm ˈroʊ.lɪŋ/",
        "def": "Rolling dough between palms or against a board into uniform spherical or cylindrical shapes."
    },
    "Se bột": {
        "en": "Tapered Strand Rolling",
        "ipa": "/ˈteɪ.pərd strænd ˈroʊ.lɪŋ/",
        "def": "Spinning and pulling dough outward to produce smooth tapered cords or slender tendrils."
    },
    "Véo bột": {
        "en": "Precision Pinching",
        "ipa": "/prɪˈsɪʒ.ən ˈpɪn.tʃɪŋ/",
        "def": "Pinching off exact minute morsels of colored dough using thumb and forefinger."
    },
    "Bấu bột": {
        "en": "Fingernail Nipping",
        "ipa": "/ˈfɪŋ.ɡər.neɪl ˈnɪp.ɪŋ/",
        "def": "Using fingernail edges to nip sharp micro-pieces for eyes, claws, and petal tips."
    },
    "Bẻ bột": {
        "en": "Articulated Bending",
        "ipa": "/ɑːrˈtɪk.jə.leɪ.tɪd ˈben.dɪŋ/",
        "def": "Bending dough appendages into active postures representing running, flying, or bowing."
    },
    "Ấn nhẹ": {
        "en": "Gentle Indenting",
        "ipa": "/ˈdʒen.təl ɪnˈden.tɪŋ/",
        "def": "Exerting light pressure to create subtle depressions or seat micro-details without distortion."
    },
    "Ấn tẹt": {
        "en": "Planar Flattening",
        "ipa": "/ˈpleɪ.nər ˈflæt.ən.ɪŋ/",
        "def": "Pressing round dough balls into flat circular or oval sheets for petals, ears, and flowing garments."
    },
    "Bóp toẹt": {
        "en": "Ruffle Squash Pinching",
        "ipa": "/skwɒʃ ˈpɪn.tʃɪŋ/",
        "def": "Forceful pinching to flatten dough into wide ruffled surfaces, such as fish fins and dragon manes."
    },
    "Lăn thon": {
        "en": "Conical Rolling",
        "ipa": "/ˈkɒn.ɪ.kəl ˈroʊ.lɪŋ/",
        "def": "Rolling dough with asymmetric pressure to form smooth cone- or teardrop-shaped components."
    },
    "Kéo dài": {
        "en": "Strand Elongation",
        "ipa": "/strænd ˌiː.lɒŋˈɡeɪ.ʃən/",
        "def": "Steadily pulling dough into elongated ribbons, whiskers, stems, or decorative queues."
    },
    "Uốn bột": {
        "en": "Curve Sculpting",
        "ipa": "/kɜːrv ˈskʌlp.tɪŋ/",
        "def": "Gracefully sweeping long dough strands into rhythmic S-curves, loops, or undulating waves."
    },
    "Xoắn bột": {
        "en": "Spiral Twisting",
        "ipa": "/ˈspaɪ.rəl ˈtwɪs.tɪŋ/",
        "def": "Intertwining multiple colored strands into braided ropes, horns, or cloud spirals."
    },
    "Chỉnh dáng": {
        "en": "Overall Silhouette Refining",
        "ipa": "/ˌsɪl.uˈet rɪˈfaɪn.ɪŋ/",
        "def": "Adjusting the master stance, tilt, and proportion of the assembled figurine."
    },
    "Bẻ dáng": {
        "en": "Kinetic Posture Posing",
        "ipa": "/kɪˈnet.ɪk ˈpoʊ.zɪŋ/",
        "def": "Bending anatomical joints to infuse dramatic gesture and lifelike motion."
    },
    "Chốt hình": {
        "en": "Structural Anchor Locking",
        "ipa": "/ˈstrʌk.tʃər.əl ˈlɒk.ɪŋ/",
        "def": "Securing key structural joints to ensure the sculpted silhouette remains firm permanently."
    },
    "Mảng khối": {
        "en": "Volume Mass Blocking",
        "ipa": "/ˈvɒl.juːm mæs ˈblɒk.ɪŋ/",
        "def": "Conceiving and blocking major mass volumes before detailing intricate surface ornamentation."
    },
    "Cách điệu": {
        "en": "Folk Iconographic Stylization",
        "ipa": "/foʊk ˌstaɪ.laɪˈzeɪ.ʃən/",
        "def": "Transforming real-world anatomy into joyful, symbolic Vietnamese folk iconography."
    },
    "Thổi hồn": {
        "en": "Breathing Soul (Artistic Vitality)",
        "ipa": "/ˈbriː.ðɪŋ soʊl/",
        "def": "Endowing sculpted dough with spirited expression, warmth, and evocative folk vitality."
    },
    "Tạo dáng": {
        "en": "Silhouette Sculpting",
        "ipa": "/ˌsɪl.uˈet ˈskʌlp.tɪŋ/",
        "def": "Establishing the master spatial posture, proportion, and visual rhythm of the craft piece."
    },
    "Chuốt": {
        "en": "Surface Burnishing",
        "ipa": "/ˈsɜːr.fɪs ˈbɜːr.nɪʃ.ɪŋ/",
        "def": "Stroking seams and blending transitions with wet fingertips or smooth horn blades."
    },
    "Vuốt bột": {
        "en": "Linear Stroking",
        "ipa": "/ˈlɪn.i.ər ˈstroʊ.kɪŋ/",
        "def": "Gliding fingers along dough lengths to yield sleek, unbroken contours."
    },
    "Day bột": {
        "en": "Fingertip Micro-Buffing",
        "ipa": "/ˈfɪŋ.ɡər.tɪp ˈbʌf.ɪŋ/",
        "def": "Rotating fingertips gently over minor surface imperfections to create satin smoothness."
    },
    "Cân dáng": {
        "en": "Equilibrium Balancing",
        "ipa": "/ˌiː.kwɪˈlɪb.ri.əm ˈbæl.əns.ɪŋ/",
        "def": "Calibrating bilateral symmetry and center-of-gravity balance across the vertical skewer."
    },
    "Ve tròn (xem lại từ này xem là vê tròn hay ve tròn)": {
        "en": "Spherical Ball Rolling",
        "ipa": "/ˈsfer.ɪ.kəl bɔːl ˈroʊ.lɪŋ/",
        "def": "Rotating dough between palms to form perfectly smooth spheres for heads, eyes, and beads."
    },
    "Ve tròn": {
        "en": "Spherical Ball Rolling",
        "ipa": "/ˈsfer.ɪ.kəl bɔːl ˈroʊ.lɪŋ/",
        "def": "Rotating dough between palms to form perfectly smooth spheres for heads, eyes, and beads."
    },
    "Ve dài": {
        "en": "Cylindrical Strand Rolling",
        "ipa": "/sɪˈlɪn.drɪ.kəl strænd ˈroʊ.lɪŋ/",
        "def": "Rolling dough across a clean board into uniform cylindrical cords for dragon trunks and stems."
    },
    "Đàn mỏng": {
        "en": "Ultra-Thin Sheeting",
        "ipa": "/ˈʌl.trə θɪn ˈʃiː.tɪŋ/",
        "def": "Stretching and thinning dough into paper-thin translucent sheets for petals and fine garments."
    },
    "3V ( Cách gọi tắt ba thao tác: vê bột, véo bột, tạo vân.)": {
        "en": "The 3V Trinity (Roll - Pinch - Texture)",
        "ipa": "/ðə θriː viː ˈtrɪn.ə.ti/",
        "def": "The mnemonic for the three foundational artisan gestures: Vê (Roll), Véo (Pinch), and Vân (Texture)."
    },
    "Nét co": {
        "en": "Starch Shrinkage Crease",
        "ipa": "/stɑːrtʃ ˈʃrɪŋ.kɪdʒ kriːs/",
        "def": "The natural fine contraction line appearing as water evaporates from drying rice starch."
    },
    "Găm to": {
        "en": "Heavy Structural Core Pin",
        "ipa": "/ˈhev.i kɔːr pɪn/",
        "def": "Using stout bamboo pins to anchor principal torso masses firmly onto the main central skewer."
    },
    "Găm nhỏ": {
        "en": "Fine Miniature Pin",
        "ipa": "/faɪn ˈmɪn.i.ə.tʃər pɪn/",
        "def": "Using slender bamboo splints to secure swords, flags, staffs, and delicate accessories."
    },
    "Nối thân": {
        "en": "Torso Joint Bonding",
        "ipa": "/ˈtɔːr.soʊ dʒɔɪnt ˈbɒn.dɪŋ/",
        "def": "Joining and fusing upper and lower body assemblies onto the central load-bearing axis."
    },
    "Đắp nổi": {
        "en": "High-Relief Appliqué",
        "ipa": "/haɪ rɪˈliːf ˌæp.lɪˈkeɪ/",
        "def": "Affixing layered dough shapes onto surfaces to create embossed armor, muscles, or blossoms."
    },
    "Miết mí": {
        "en": "Seam Edge Blending",
        "ipa": "/siːm edʒ ˈblen.dɪŋ/",
        "def": "Rubbing and flattening intersecting dough edges until boundary lines fuse into an unblemished surface."
    },
    "Tỉa gờ": {
        "en": "Edge Ridge Delineation",
        "ipa": "/edʒ rɪdʒ dɪˌlɪn.iˈeɪ.ʃən/",
        "def": "Trimming and beveling edge margins using thin bamboo spatulas for crisp visual definition."
    },
    "Chấm mắt": {
        "en": "Dotting the Eyes (Awakening)",
        "ipa": "/ˈdɒt.ɪŋ ðiː aɪz/",
        "def": "Placing minute black dough pearls into eye sockets, symbolically infusing life and wakeful spirit."
    },
    "Gắn cốt": {
        "en": "Internal Armature Assembly",
        "ipa": "/ɪnˈtɜːr.nəl ˈɑːr.mə.tʃər/",
        "def": "Positioning flexible split-bamboo framework rods to support dynamic postures against gravity."
    },
    "Bọc cốt": {
        "en": "Armature Encasement",
        "ipa": "/ˈɑːr.mə.tʃər ɪnˈkeɪs.mənt/",
        "def": "Enveloping the bamboo skeletal core with an initial grounding layer of dough."
    },
    "Ghép đầu": {
        "en": "Head Articulation",
        "ipa": "/hed ɑːrˌtɪk.jəˈleɪ.ʃən/",
        "def": "Mounting and blending the expressive sculpted head onto the collar base."
    },
    "Gắn chân": {
        "en": "Limb Mounting",
        "ipa": "/lɪm ˈmaʊn.tɪŋ/",
        "def": "Fashioning and attaching dynamic legs and hooves anchored to withstand transport."
    },
    "Gắn cánh": {
        "en": "Wing Articulation",
        "ipa": "/wɪŋ ɑːrˌtɪk.jəˈleɪ.ʃən/",
        "def": "Mounting stepped feathered wings onto avian or mythical creature bodies."
    },
    "Gắn đuôi": {
        "en": "Tail Installation",
        "ipa": "/teɪl ˌɪn.stəˈleɪ.ʃən/",
        "def": "Shaping and mounting elaborate arched tails, phoenix plumes, or dragon tails."
    },
    "Gắn sừng": {
        "en": "Horn Installation",
        "ipa": "/hɔːrn ˌɪn.stəˈleɪ.ʃən/",
        "def": "Fashioning and embedding spiral horns onto buffalo, goat, or qilin figurines."
    },
    "Gắn mỏ": {
        "en": "Beak Mounting",
        "ipa": "/biːk ˈmaʊn.tɪŋ/",
        "def": "Affixing sharp yellow or red beaks onto fowl and raptor heads."
    },
    "Gắn vảy": {
        "en": "Scale Shingling",
        "ipa": "/skeɪl ˈʃɪŋ.ɡlɪŋ/",
        "def": "Applying overlapping teardrop scales one by one across creature bodies."
    },
    "Khía vảy": {
        "en": "Comb-Tooth Scale Serration",
        "ipa": "/koʊm tuːθ skeɪl səˈreɪ.ʃən/",
        "def": "Pressing horn comb teeth into dough in rhythmic succession to form hundreds of iridescent scales."
    },
    "Tạo gân": {
        "en": "Vein Embossing",
        "ipa": "/veɪn ɪmˈbɒs.ɪŋ/",
        "def": "Scoring branching vein lines on foliage, wings, and insect pinions."
    },
    "Tạo nếp": {
        "en": "Drapery Pleating",
        "ipa": "/ˈdreɪ.pər.i ˈpliː.tɪŋ/",
        "def": "Folding and pressing dough into fluid cascading pleats resembling traditional silk robes."
    },
    "Tạo lông": {
        "en": "Plumage & Fur Texturing",
        "ipa": "/ˈpluː.mɪdʒ ænd fɜːr/",
        "def": "Using comb teeth or bamboo points to score fine parallel fur or down feathers."
    },
    "Tạo móng vuốt": {
        "en": "Talon & Claw Nipping",
        "ipa": "/ˈtæl.ən ænd klɔː/",
        "def": "Pinning and curving razor-sharp claws on predatory dragons and eagles."
    },
    "Rạch nét": {
        "en": "Incised Graphic Scoring",
        "ipa": "/ɪnˈsaɪzd ˈskɔːr.ɪŋ/",
        "def": "Drawing razor-thin incisions into dough surfaces using bamboo knife points."
    },
    "Ấn lược/ miết lược": {
        "en": "Horn Comb Impression",
        "ipa": "/hɔːrn koʊm ɪmˈpreʃ.ən/",
        "def": "Stamping horn comb teeth into dough to create orderly parallel grooves."
    },
    "Miết lược": {
        "en": "Lateral Comb Burnishing",
        "ipa": "/ˈlæt.ər.əl koʊm ˈbɜːr.nɪʃ.ɪŋ/",
        "def": "Dragging comb teeth sideways across wet dough to produce water waves and wind currents."
    },
    "Tạo vân": {
        "en": "Relief Grain Texturing",
        "ipa": "/rɪˈliːf ɡreɪn ˈtek.stʃər.ɪŋ/",
        "def": "Generating organic wood grains, aquatic ripples, and billowing cloud scrolls."
    },
    "Ép khuôn": {
        "en": "Mold Relief Casting",
        "ipa": "/moʊld rɪˈliːf ˈkæs.tɪŋ/",
        "def": "Pressing dough into wooden or brass relief molds for ceremonial altar motifs."
    },
    "Vuốt liền": {
        "en": "Flowing Seamless Union",
        "ipa": "/ˈsiːm.ləs ˈjuː.njən/",
        "def": "Unifying adjacent parts into an uninterrupted anatomical flow."
    },
    "Tạo điểm tựa": {
        "en": "Bearing Point Engineering",
        "ipa": "/ˈbeər.ɪŋ pɔɪnt/",
        "def": "Designing structural anchor contacts ensuring the piece remains stable on its skewer."
    },
    "Cân trọng tâm": {
        "en": "Center of Mass Calibration",
        "ipa": "/ˈsen.tər əv mæs/",
        "def": "Balancing top-heavy components so the figurine stands proudly vertical without leaning."
    },
    "Đắp / ghép / điểm thêm": {
        "en": "Decorative Ornamentation",
        "ipa": "/ˌɔːr.nə.menˈteɪ.ʃən/",
        "def": "Applying delicate final touches like ribbons, buttons, and tassels."
    },
    "Thân trục": {
        "en": "Central Body Column",
        "ipa": "/ˈsen.trəl ˈbɒd.i ˈkɒl.əm/",
        "def": "The main load-bearing dough column wrapped around the bamboo core."
    },
    "Chân trụ": {
        "en": "Stout Base Strut",
        "ipa": "/staʊt beɪs strʌt/",
        "def": "Supporting feet and base struts providing mechanical anchorage."
    },
    "Mấu nối": {
        "en": "Structural Joint Node",
        "ipa": "/ˈstrʌk.tʃər.əl dʒɔɪnt/",
        "def": "The reinforced intersection where limbs and torso meet."
    },
    "Gờ nổi": {
        "en": "Raised Filigree Ridge",
        "ipa": "/reɪzd ˈfɪl.ɪ.ɡriː rɪdʒ/",
        "def": "Embossed perimeter ridges adding structural strength and visual depth."
    },
    "Nếp gấp": {
        "en": "Garment Drapery Fold",
        "ipa": "/ˈɡɑːr.mənt ˈdreɪ.pər.i/",
        "def": "Simulated fabric folds evoking traditional Vietnamese silk tunics."
    },
    "Vân xoắn": {
        "en": "Spiral Filigree Volute",
        "ipa": "/ˈspaɪ.rəl vəˈluːt/",
        "def": "Volute spiral curves representing mythical whiskers, mist, or curling horns."
    },
    "Chóp nhọn": {
        "en": "Pointed Apex",
        "ipa": "/ˈpɔɪn.tɪd ˈeɪ.peks/",
        "def": "Tapered apex points on rooster combs, crown tips, and lotus buds."
    },
    "Đầu móc": {
        "en": "Curved Hook Finial",
        "ipa": "/kɜːrvd hʊk ˈfɪn.i.əl/",
        "def": "Upturned finial tips on oriental scabbards and traditional shoe toes."
    },
    "Cánh xếp": {
        "en": "Layered Pinion Flight",
        "ipa": "/ˈleɪ.ərd ˈpɪn.jən/",
        "def": "Stepped layers of feathers imparting flight dynamics to mythical beasts."
    },
    "Đuôi cuộn": {
        "en": "Ascending Coiled Plume",
        "ipa": "/əˈsen.dɪŋ kɔɪld pluːm/",
        "def": "Dramatic coiling tail plumes soaring proudly into the air."
    },
    "Lược nặn": {
        "en": "Horn Sculpting Comb",
        "ipa": "/hɔːrn ˈskʌlp.tɪŋ koʊm/",
        "def": "A handheld buffalo-horn comb with fine teeth used to texture scales, plumage, and drapery."
    },
    "Cốt tre": {
        "en": "Bamboo Armature Splints",
        "ipa": "/bæmˈbuː ˈɑːr.mə.tʃər/",
        "def": "Flexible green bamboo splints functioning as the inner skeletal structure."
    },
    "Que tre": {
        "en": "Bamboo Skewer Stick",
        "ipa": "/bæmˈbuː ˈskjuː.ər stɪk/",
        "def": "Polished 30-40cm bamboo skewers acting as structural stem and hand grip."
    },
    "Ống sậy": {
        "en": "Reed Whistle Tube",
        "ipa": "/riːd ˈwɪs.əl tjuːb/",
        "def": "A small hollow reed whistle producing the historic 'tò-te-he' sound that named the craft."
    },
    "Kèn ống": {
        "en": "Cane Whistle Component",
        "ipa": "/keɪn ˈwɪs.əl/",
        "def": "A traditional sound-making whistle tied to antique edible figurines."
    },
    "Sáp ong": {
        "en": "Pure Natural Beeswax",
        "ipa": "/pjʊər ˈnætʃ.ər.əl ˈbiːz.wæks/",
        "def": "Organic beeswax used to lubricate horn blades and seal heirloom folk toys."
    },
    "Phên hấp": {
        "en": "Bamboo Steaming Mat",
        "ipa": "/bæmˈbuː ˈstiː.mɪŋ mæt/",
        "def": "A woven bamboo lattice separating dough from boiling water during steaming."
    },
    "Khuôn mắt lưới": {
        "en": "Fine Mesh Flour Sieve",
        "ipa": "/faɪn meʃ flaʊər sɪv/",
        "def": "A delicate sieve used to strain impurities from wet milled rice starch."
    },
    "Dao tỉa": {
        "en": "Bamboo Carving Spatula",
        "ipa": "/bæmˈbuː ˈkɑːr.vɪŋ ˈspætʃ.ə.lə/",
        "def": "A miniature bamboo knife with a flat polished tip used to carve, cut, and burnish dough."
    },
    "Dao khía": {
        "en": "Fine Incising Blade",
        "ipa": "/faɪn ɪnˈsaɪ.zɪŋ bleɪd/",
        "def": "A narrow bamboo wedge used to score geometric patterns and notches."
    },
    "Vòng tre": {
        "en": "Bamboo Ring Platter",
        "ipa": "/bæmˈbuː rɪŋ ˈplæt.ər/",
        "def": "An antique woven bamboo ring used as a dish to present altar dough cakes before skewers became universal."
    },
    "Hòm đồ nghề": {
        "en": "Artisan Crafting Trunk",
        "ipa": "/ˈɑːr.tɪ.zən ˈkræf.tɪŋ trʌŋk/",
        "def": "A wooden chest holding colored doughs, pigments, tools, and bamboo rods across country roads."
    },
    "Đòn gánh": {
        "en": "Bamboo Shoulder Pole",
        "ipa": "/bæmˈbuː ˈʃoʊl.dər poʊl/",
        "def": "A flexible bamboo pole enabling traveling artisans to balance craft trunks and straw bouquets across villages."
    },
    "Giá cắm que": {
        "en": "Skewer Display Pedestal",
        "ipa": "/ˈskjuː.ər dɪˈspleɪ ˈped.ɪ.stəl/",
        "def": "A wooden block with drilled holes to display colorful Tò he vertically at festival stalls."
    },
    "Bùi nhùi rơm": {
        "en": "Golden Straw Display Bundle",
        "ipa": "/ˈɡoʊl.dən strɔː ˈbʌn.dəl/",
        "def": "A dense cylinder of fragrant sticky rice straw tied to the shoulder yoke, blossoming with dozens of colorful Tò he."
    },
    "Ghính (gánh)": {
        "en": "Artisan Shoulder Yoke (Archaic)",
        "ipa": "/ˈʃoʊl.dər joʊk/",
        "def": "Archaic Vietnamese dialect for the traveling artisan's balancing shoulder pole."
    },
    "Màu son": {
        "en": "Cinnabar Vermilion Red",
        "ipa": "/ˈsɪn.ə.bɑːr vərˈmɪl.jən/",
        "def": "A brilliant scarlet red traditionally derived from ripe gac fruit arils or mineral cinnabar."
    },
    "Màu cánh sen": {
        "en": "Lotus Petal Rose-Pink",
        "ipa": "/ˈloʊ.təs ˈpet.əl roʊz/",
        "def": "A luminous pink hue inspired by blooming sacred lotus blossoms."
    },
    "Màu nghệ già": {
        "en": "Mature Turmeric Gold",
        "ipa": "/məˈtʃʊər ˈtɜːr.mər.ɪk ɡoʊld/",
        "def": "Rich golden yellow boiled from aged turmeric roots or dried gardenia fruit."
    },
    "Màu tiết dê": {
        "en": "Deep Crimson Maroon",
        "ipa": "/diːp ˈkrɪm.zən məˈruːn/",
        "def": "A deep folkloric reddish-purple named after fresh dark crimson tones."
    },
    "Màu xanh chàm": {
        "en": "Indigo Herbal Blue",
        "ipa": "/ˈɪn.dɪ.ɡoʊ ˈhɜːr.bəl bluː/",
        "def": "A deep dusky blue produced through fermentation of wild indigo leaves."
    },
    "Màu ngũ sắc": {
        "en": "Five Elemental Folk Palette",
        "ipa": "/faɪv ˌel.ɪˈmen.təl ˈpæl.ət/",
        "def": "The traditional five-color philosophy representing Metal (White), Wood (Green), Water (Black/Purple), Fire (Red), and Earth (Yellow)."
    },
    "Phủ màu": {
        "en": "Surface Glaze Coating",
        "ipa": "/ˈsɜːr.fɪs ɡleɪz ˈkoʊ.tɪŋ/",
        "def": "Enveloping a neutral dough core with a vibrant colored skin."
    },
    "Đi nét": {
        "en": "Linear Contour Inking",
        "ipa": "/ˈlɪn.i.ər ˈkɒn.tʊər ˈɪŋk.ɪŋ/",
        "def": "Delineating fine eyes, mustaches, and armor contours with ultra-fine contrasting dough strands."
    },
    "Chấm nhũ": {
        "en": "Mica Dust Highlight",
        "ipa": "/ˈmaɪ.kə dʌst ˈhaɪ.laɪt/",
        "def": "Stippling glittering natural mica particles onto dragon pearls and imperial robes."
    },
    "Tạo sắc chuyển": {
        "en": "Ombré Gradient Transition",
        "ipa": "/ˈɒm.breɪ ˈɡreɪ.di.ənt/",
        "def": "Kneading two colored doughs at their seam to produce soft seamless chromatic ombré."
    },
    "Phối màu": {
        "en": "Folk Color Harmony",
        "ipa": "/foʊk ˈkʌl.ər ˈhɑːr.mə.ni/",
        "def": "Balancing joyful, contrasting folk hues across the figurine to maximize celebratory impact."
    },
    "Tô nền": {
        "en": "Ground Base Tinting",
        "ipa": "/ɡraʊnd beɪs ˈtɪn.tɪŋ/",
        "def": "Applying a solid foundation color before adding surface relief details."
    },
    "Viền màu": {
        "en": "Contrast Fillet Edging",
        "ipa": "/ˈkɒn.træst ˈfɪl.ɪt ˈedʒ.ɪŋ/",
        "def": "Tracing borders with slender colored cords to highlight hemlines and collars."
    },
    "Phủ dầu/ phết dầu": {
        "en": "Vegetable Oil Sheening",
        "ipa": "/ˈvedʒ.tə.bəl ɔɪl ˈʃiː.nɪŋ/",
        "def": "Brushing vegetable oil over finished toys to impart a lustrous sheen and seal out dry air."
    },
    "Dầu quang": {
        "en": "Resin Lustre Lacquer",
        "ipa": "/ˈrez.ɪn ˈlʌs.tər ˈlæk.ər/",
        "def": "A botanical resin coating used historically on ceremonial figures to preserve them for months."
    },
    "Tróc/ lở (khỏi que)": {
        "en": "Skewer Separation / Flaking",
        "ipa": "/ˈskjuː.ər ˌsep.ərˈeɪ.ʃən/",
        "def": "Defect where dough shrinks and loses adhesion to the bamboo skewer."
    },
    "Nứt hình": {
        "en": "Surface Fissuring",
        "ipa": "/ˈsɜːr.fɪs ˈfɪʃ.ər.ɪŋ/",
        "def": "The formation of hairline cracks on surfaces caused by draft exposure or lack of maltose."
    },
    "Mất dáng": {
        "en": "Slumping & Deformation",
        "ipa": "/ˈslʌm.pɪŋ ænd ˌdiː.fɔːrˈmeɪ.ʃən/",
        "def": "Gradual drooping of figurines caused by excessive moisture or humid atmospheric heat."
    },
    "Gãy bột": {
        "en": "Brittle Fracture",
        "ipa": "/ˈbrɪt.əl ˈfræk.tʃər/",
        "def": "Snapping of slender projections due to deficient rice starch gluten."
    },
    "Tuột que": {
        "en": "Skewer Slippage",
        "ipa": "/ˈskjuː.ər ˈslɪp.ɪdʒ/",
        "def": "Figurine sliding downwards or spinning loose on an over-smooth bamboo stick."
    },
    "Lỏng cốt": {
        "en": "Armature Loosening",
        "ipa": "/ˈɑːr.mə.tʃər ˈluː.sən.ɪŋ/",
        "def": "Wobbling internal support causing the sculpture to list sideways."
    },
    "Lệch dáng": {
        "en": "Asymmetric Tilt",
        "ipa": "/ˌeɪ.sɪˈmet.rɪk tɪlt/",
        "def": "Loss of plumb alignment caused by unbalanced cantilevered weight."
    },
    "Sụp dáng": {
        "en": "Structural Collapse",
        "ipa": "/ˈstrʌk.tʃər.əl kəˈlæps/",
        "def": "Catastrophic sagging of a figure unable to bear its own gravitational weight."
    },
    "Nhòe màu": {
        "en": "Pigment Bleeding",
        "ipa": "/ˈpɪɡ.mənt ˈbliː.dɪŋ/",
        "def": "Unintended color bleed between wet adjacent dough masses."
    },
    "Loang màu": {
        "en": "Uneven Color Mottling",
        "ipa": "/ʌnˈiː.vən ˈmɒt.lɪŋ/",
        "def": "Patchy, blotchy pigment distribution resulting from incomplete dough kneading."
    },
    "Vá chỗ nứt": {
        "en": "Fissure Remediation",
        "ipa": "/ˈfɪʃ.ər rɪˌmiː.diˈeɪ.ʃən/",
        "def": "Remedial technique of pressing soft moist dough into fissures and burnishing smooth."
    },
    "Chắp lại": {
        "en": "Extremity Rejoining",
        "ipa": "/ɪkˈstrem.ə.ti riːˈdʒɔɪn.ɪŋ/",
        "def": "Rebonding broken fragments using a dab of moist dough adhesive."
    },
    "Gia cố": {
        "en": "Splint Reinforcement",
        "ipa": "/splɪnt ˌriː.ɪnˈfɔːrs.mənt/",
        "def": "Inserting supplementary bamboo pins into structural joints."
    },
    "Sửa dáng": {
        "en": "Posture Realignment",
        "ipa": "/ˈpɒs.tʃər ˌriː.əˈlaɪn.mənt/",
        "def": "Gently warming and realigning drooping figurines before final drying."
    },
    "Giống bột": {
        "en": "Grain Dough Sculpture (Archaic)",
        "ipa": "/ɡreɪn dəʊ ˈskʌlp.tʃər/",
        "def": "Historic collective folk term denoting all figurative creations molded from grain dough."
    },
    "Con giống bột": {
        "en": "Animal Dough Toys",
        "ipa": "/ˈæn.ɪ.məl dəʊ tɔɪz/",
        "def": "Sculpted dough creatures representing wildlife, domestic livestock, and mythical spirits."
    },
    "Con oản": {
        "en": "Pyramidal Sugar Cake",
        "ipa": "/pɪˈræm.ɪ.dəl ˈʃʊɡ.ər keɪk/",
        "def": "Traditional ceremonial white sugar-flour truncated pyramids presented at pagoda altars."
    },
    "Mâm bồng lễ phẩm": {
        "en": "Sacrificial Offering Platter",
        "ipa": "/ˌsæk.rɪˈfɪʃ.əl ˈplæt.ər/",
        "def": "Elaborate multi-fruit dough platters crafted as sacred offerings for ancestral shrines."
    },
    "Bộ lục súc": {
        "en": "Six Domestic Livestock Set",
        "ipa": "/sɪks dəˈmes.tɪk ˈlaɪv.stɒk/",
        "def": "The traditional set of six domestic animals: Buffalo, Horse, Goat, Dog, Rooster, and Pig."
    },
    "Con giống vảy": {
        "en": "Serrated Dragon & Beast",
        "ipa": "/səˈreɪ.tɪd ˈdræɡ.ən/",
        "def": "Urban Phố Khách style figurines exhibiting hundreds of incised comb scales."
    },
    "Tượng bột": {
        "en": "Dough Statuary Figurines",
        "ipa": "/dəʊ ˈstætʃ.u.er.i/",
        "def": "Larger human, hero, or deity statues sculpted from colored grain dough."
    },
    "Tích trò": {
        "en": "Theatrical Legend Tableau",
        "ipa": "/θiˈæt.rɪ.kəl ˈledʒ.ənd/",
        "def": "Tableaux depicting famous folklore tales, historical battles, and moral allegories."
    },
    "Linh thú": {
        "en": "Auspicious Mythical Creature",
        "ipa": "/ɔːˈspɪʃ.əs ˈmɪθ.ɪ.kəl ˈkriː.tʃər/",
        "def": "Sacred supernatural creatures embodying cosmic blessings and guardian powers."
    },
    "Tứ linh": {
        "en": "The Four Sacred Mythical Beasts",
        "ipa": "/ðə fɔːr ˈseɪ.krɪd biːsts/",
        "def": "The four divine beasts: Dragon (Long), Qilin (Lân), Tortoise (Quy), and Phoenix (Phụng)."
    },
    "Nghê đất": {
        "en": "Sacred Folk Nghê",
        "ipa": "/ˈseɪ.krɪd foʊk ŋeɪ/",
        "def": "The unique Vietnamese mythical lion-dog creature guarding village temples and homes."
    },
    "Ông phỗng": {
        "en": "Kneeling Altar Phỗng",
        "ipa": "/ˈniː.lɪŋ ˈɔːl.tər fɒŋ/",
        "def": "Smiling, chubby kneeling figures offering gifts at traditional village temple altars."
    },
    "Tễu chèo": {
        "en": "Uncle Tễu (Jovial Narrator)",
        "ipa": "/ˈʌŋ.kəl teu/",
        "def": "The beloved chubby, cheerful narrator character of Vietnamese folk theater and water puppetry."
    },
    "Phỗng đất": {
        "en": "Clay Guardian Figure",
        "ipa": "/kleɪ ˈɡɑːr.di.ən/",
        "def": "Ancient fired clay folk figures closely related in iconographic heritage to dough figurines."
    },
    "Mặt nạ tuồng": {
        "en": "Classical Tuồng Opera Mask",
        "ipa": "/klæs.ɪ.kəl ˈɒp.ər.ə mæsk/",
        "def": "Miniature dough masks replicating the colorful graphic face-paint of classical Vietnamese opera."
    },
    "Hí hình": {
        "en": "Caricature Folk Figurine",
        "ipa": "/ˈkær.ɪ.kə.tʃʊər ˈfɪɡ.jər.iːn/",
        "def": "Humorous caricature figurines celebrating country humor and playful satire."
    },
    "Ngựa Xích Thố": {
        "en": "Red Hare Warhorse (Xích Thố)",
        "ipa": "/red heər ˈwɔːr.hɔːrs/",
        "def": "The legendary scarlet charger of General Guan Yu, celebrated for lightning speed, loyalty, and luck."
    },
    "Con bánh rỗng": {
        "en": "Hollow Ceremonial Dough Cake",
        "ipa": "/ˈhɒl.oʊ ˌser.ɪˈmoʊ.ni.əl keɪk/",
        "def": "An early dough pastry variation featuring hollow interiors to accelerate drying."
    },
    "Chim cò": {
        "en": "Edible Bird Figurines (Chim Cò)",
        "ipa": "/ˈed.ə.bəl bɜːrd ˈfɪɡ.jər.iːnz/",
        "def": "The edible ancestor of Tò he, molded from boiled rice flour to celebrate harvest feasts and treat village children."
    },
    "Ông tiến sĩ": {
        "en": "First Doctorate Scholar Figurine",
        "ipa": "/ˈdɒk.tər.ət ˈskɒl.ər/",
        "def": "A ceremonial Mid-Autumn figure honoring studiousness, academic triumph, and national scholars."
    },
    "Tò he": {
        "en": "Tò He Traditional Folk Toy",
        "ipa": "/tɔː heɪ ˈfoʊk tɔɪ/",
        "def": "The iconic Vietnamese folk toy sculpted from dyed grain dough on a bamboo stick with an attached whistle."
    },
    "Bánh vòng": {
        "en": "Ring Pastry Dough Toy",
        "ipa": "/rɪŋ ˈpeɪ.stri dəʊ tɔɪ/",
        "def": "A traditional celebratory pastry variant molded into interconnected decorative rings."
    },
    "Mâm bồng tạo hình": {
        "en": "Sculpted Altar Fruit Platter",
        "ipa": "/ˈskʌlp.tɪd ˈɔːl.tər ˈplæt.ər/",
        "def": "A multi-tiered arrangement of modeled fruits, flowers, and animals dedicated to temple ceremonies."
    },
    "Con giống Khách / con giống Phố Khách": {
        "en": "Urban Phố Khách Style",
        "ipa": "/ˈɜːr.bən foʊ kæk staɪl/",
        "def": "The sophisticated urban style featuring articulated armatures, mythical dragons, and fine scales."
    },
    "Con giống Ta / con giống Đồng Xuân": {
        "en": "Rural Đồng Xuân Folk Style",
        "ipa": "/ˈrʊər.əl doŋ swən staɪl/",
        "def": "The rustic traditional style portraying rural livestock, crabs, goldfish, and countryside memories."
    },
    "Con tròn / con bệt": {
        "en": "Pedestal vs. Flat Figures",
        "ipa": "/ˈped.ɪ.stəl vɜː.səs flæt/",
        "def": "The classic structural distinction between freestanding pedestal figures and planar figures displayed on saucers."
    },
    "Con tròn": {
        "en": "Pedestal Figurine (Con Tròn)",
        "ipa": "/ˈped.ɪ.stəl ˈfɪɡ.jər.iːn/",
        "def": "A classic standing dough figurine supported by an integrated woven bamboo pedestal ring."
    },
    "Con bệt": {
        "en": "Flat-Laying Figurine (Con Bệt)",
        "ipa": "/flæt ˈleɪ.ɪŋ ˈfɪɡ.jər.iːn/",
        "def": "A planar dough figure designed to rest horizontally upon banana leaves or ceramic dishes."
    }
}

# Video demonstration links (minh họa thao tác nặn của nghệ nhân làng Xuân La)
VIDEO_DEMO_URL = "https://www.youtube-nocookie.com/embed/n3-k60W00-U?autoplay=1&mute=1&loop=1&playlist=n3-k60W00-U"

print("Đang đọc data.js hiện tại...")
with open('data.js', 'r', encoding='utf-8') as f:
    js_code = f.read()

# Extract items
start_idx = js_code.index('var TOHE_DICTIONARY_DATA = ') + len('var TOHE_DICTIONARY_DATA = ')
end_idx = js_code.index('var CATEGORIES_METADATA = ')
raw_json = js_code[start_idx:end_idx].strip().rstrip(';')
items = json.loads(raw_json)

print(f"Tổng số mục đọc được: {len(items)}")

# Update each item with bilingual attributes and media
for item in items:
    term_vn = item['term']
    
    # 1. Phiên âm tiếng Việt
    item['ipaVi'] = item.get('ipa', f"/{term_vn.lower()}/")
    
    # 2. Tiếng Anh (Translation, IPA, Definition)
    match_en = EN_DICTIONARY.get(term_vn)
    if not match_en:
        # Fallback if term has clean key
        clean_key = re.sub(r'\s*\([^)]*\)', '', term_vn).strip()
        match_en = EN_DICTIONARY.get(clean_key)
        
    if match_en:
        item['enTerm'] = match_en['en']
        item['enIpa'] = match_en['ipa']
        item['enDefinition'] = match_en['def']
    else:
        # Fallback rule-based translation
        item['enTerm'] = f"{term_vn} (Traditional Folk Craft)"
        item['enIpa'] = f"/{term_vn.lower()}/"
        item['enDefinition'] = f"Traditional Vietnamese folk craft terminology from Xuân La Tò he village: {item['definition']}"
    
    # 3. Đa phương tiện: Hình ảnh & Video demo
    item['mediaType'] = "image" # Mặc định hiển thị hình ảnh
    item['videoUrl'] = VIDEO_DEMO_URL

print("Đã bổ sung thuộc tính song ngữ và đa phương tiện cho 100% mục từ!")

# Cập nhật generate_data.py để đồng bộ
with open('data.js', 'r', encoding='utf-8') as f:
    old_full = f.read()

# Replace json in data.js
new_json = json.dumps(items, ensure_ascii=False, indent=2)
prefix = old_full[:start_idx]
suffix = old_full[end_idx:]
updated_code = prefix + new_json + ";\n\n" + suffix

with open('data.js', 'w', encoding='utf-8') as f:
    f.write(updated_code)

print("Đã ghi đè data.js thành công!")
