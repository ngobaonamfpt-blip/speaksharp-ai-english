# 🎙️ SpeakSharp - Nền tảng Luyện nói, Phản biện Tiếng Anh AI & Thế giới 3D Voxel
### 🚀 EdTech Web App • Lộ trình Duolingo • AI Debate Coach • Thế giới 3D Geminisland

![SpeakSharp Badge](https://img.shields.io/badge/SpeakSharp-AI_English_Coach-F5BD33?style=for-the-badge&logo=sparkles&logoColor=141517)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=141517)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Three.js](https://img.shields.io/badge/3D_World-Three.js_Voxel-141517?style=for-the-badge&logo=threedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Build-Vite_5-646CFF?style=for-the-badge&logo=vite&logoColor=white)

---

## 📖 1. Giới thiệu Dự án

**SpeakSharp** là nền tảng học tiếng Anh giao tiếp và rèn luyện tư duy phản biện tích hợp **AI Coach**, kết hợp giữa **Lộ trình học gamification chuẩn Duolingo**, **Đấu trường Phản biện AI tương tác trực tiếp** và **Thế giới Đô thị 3D Voxel (Geminisland)** cho phép học viên dạo chơi, tùy chỉnh nhân vật 3D và bước vào các gian hàng luyện nói tiếng Anh theo ngữ cảnh thực tế.

### 💡 Bối cảnh & Giải pháp:
Phần lớn người học tiếng Anh gặp rào cản **ngại nói, thiếu môi trường giao tiếp thực tế và không có phản hồi ngữ pháp – lập luận tức thì**. SpeakSharp giải quyết bài toán này bằng sự kết hợp giữa:
- **Học qua trò chơi (Gamification):** Lộ trình bài học dạng bản đồ stepping-stone, chuỗi ngày học (Streak), điểm XP và nhiệm vụ hàng ngày.
- **Luyện nói & Phản biện cùng AI:** Sửa lỗi ngữ pháp, chấm điểm lập luận và trò chuyện hai chiều với SpeakSharp AI Coach.
- **Không gian 3D Voxel sống động:** Khám phá hòn đảo đô thị 3D quy mô lớn (`164 × 164`), tương tác với 27+ công trình biểu tượng và giao lưu cùng cộng đồng học viên trực tuyến.

---

## ⚙️ 2. Kiến trúc Hệ thống & Cấu trúc Mã nguồn

Dự án được xây dựng theo kiến trúc Frontend hiện đại với **React 18 + TypeScript + Vite + Three.js**:

```
[ SpeakSharp Web Application ]
  ├── src/App.tsx                         # Điều hướng chính, Auth Modal, Duolingo Shell & LocalStorage
  ├── src/styles.css                      # Thiết kế Đen Than (#141517) + Vàng Nghệ (#F5BD33) + Kem Ấm (#F8F7F4)
  ├── src/components/
  │     ├── LandingPage.tsx               # Trang chủ Dark Hero tương tác + hiệu ứng Scroll Reveal
  │     ├── LearningPath.tsx              # Lộ trình học Duolingo (Unit 1 & Unit 2 + Daily Quests)
  │     ├── PracticeArena.tsx             # Bài tập 5 dạng tương tác + SpeakSharp AI Chatbot
  │     ├── World3D.tsx                   # Thế giới 3D Geminisland (Pan/Orbit/Walk, Character 3D, +Add)
  │     ├── TopicLibrary.tsx              # Thư viện chủ đề giao tiếp & Trình tạo chủ đề tùy chỉnh
  │     ├── PricingView.tsx               # Cửa hàng gói cước (Freemium/Pro/B2B) & Đổi thưởng XP
  │     ├── StudentProfile.tsx            # Hồ sơ học viên, biểu đồ tiến độ & thành tích
  │     ├── TeacherDashboard.tsx          # Bảng điều khiển quản lý lớp học cho Trường học (B2B)
  │     └── OnboardingSurveyModal.tsx     # Khảo sát 4 bước cá nhân hóa lộ trình đầu vào
  ├── src/world/
  │     └── voxelIslandBuilder.ts         # Engine dựng đảo Voxel 164×164, 27+ công trình, xe đua & nhân vật 3D
  ├── src/engine/
  │     └── debateEngine.ts               # Bộ máy phản hồi AI Debate & chấm điểm lập luận
  └── src/data/
        ├── lessonQuestions.ts            # Ngân hàng câu hỏi đa dạng (MCQ, Word Bank, Listening, Speaking)
        ├── topics.ts                     # Danh sách chủ đề luyện nói & tranh biện
        └── b2bData.ts                    # Dữ liệu mẫu quản trị lớp học & học sinh
```

### Công nghệ sử dụng:
- **Core UI:** React 18, TypeScript 5.6, Vite 5
- **Đồ họa 3D:** Three.js (`@types/three`) với hệ thống texture lưới khối Voxel sắc nét
- **Biểu tượng:** Lucide React (`lucide-react`)
- **Lưu trữ trạng thái:** `localStorage` cho tài khoản, XP, Streak và tiến độ bài học

---

## 🧠 3. Các Tính năng Nổi bật

1. **Trang chủ Hiện đại & Hiệu ứng Chuyển động (`LandingPage`):**
   - Giao diện Dark Hero với mô phỏng điện thoại tương tác, hiệu ứng xuất hiện mượt mà hai chiều (`IntersectionObserver`).
2. **Lộ trình Học chuẩn Duolingo (`LearningPath`):**
   - Bản đồ bài học uốn lượn với các nút bấm 3D nổi khối (`duo-btn-3d`), chia theo Unit và thanh nhiệm vụ hàng ngày (Daily Quests).
3. **Đấu trường Luyện tập & Phản biện AI (`PracticeArena`):**
   - 5 dạng bài tập tương tác (Trắc nghiệm, Ghép từ Word Bank, Luyện nghe, Sửa lỗi ngữ pháp, Thử thách Nói) đi kèm khung chat SpeakSharp AI Coach hỗ trợ trực tiếp.
4. **Thế giới Đô thị 3D Voxel – Geminisland (`World3D`):**
   - Hòn đảo Voxel `164 × 164` với đại dương xanh thẫm, bọt biển chuyển động, đường đua nhựa với 8 xe thể thao *Porsche GT3 RS*, 56 cây Voxel, 18 cư dân đi bộ và **27+ công trình biểu tượng** (*The Grand Lattice Tower*, *Grand Dome Academy*, *Snowy Matterhorn Peak*, *S.S. Meadow Ferry*, *Crimson Heart Fountain*, *Giant Dancing Robot*, *Registan Golden Pagoda*,...).
   - Tích hợp trình **AI Voxel Builder (`+ Add`)** cho phép gõ mô tả để dựng thêm công trình mới trực tiếp trên đảo.
   - **Tùy chỉnh Nhân vật 3D (`Character`)**: Xem trước nhân vật Voxel 3D xoay trực tiếp trên bệ cỏ, tùy biến `Name`, `Head`, `Hat`, `Face`, `Outfit`, `Gear`, màu sắc và hành động `Wave`.
5. **Thư viện Chủ đề, Cửa hàng & Quản trị Trường học:**
   - Lọc chủ đề theo trình độ, tự tạo chủ đề mới, đổi thưởng bằng XP tại Cửa hàng và theo dõi thống kê học sinh ở tab Trường học.

---

## 🚀 4. Hướng dẫn Cài đặt & Khởi chạy

Yêu cầu môi trường: **Node.js >= 18** và **npm**.

### Bước 1: Clone dự án và cài đặt thư viện
```bash
# Clone kho lưu trữ
git clone https://github.com/ngobaonamfpt-blip/speaksharp-ai-english.git

# Di chuyển vào thư mục dự án
cd speaksharp-ai-english

# Cài đặt các gói phụ thuộc
npm install
```

### Bước 2: Khởi chạy máy chủ phát triển (Development)
```bash
npm run dev
```

Mở trình duyệt truy cập: **`http://localhost:5173`**

### Bước 3: Đóng gói bản Production (Build)
```bash
npm run build
npm run preview
```

---

## 🎯 5. Hướng dẫn Trải nghiệm Thế giới 3D Geminisland

Khi truy cập tab **Thế giới 3D**, sử dụng thanh điều khiển nổi ở góc trên bên phải:

1. **Chế độ `Pan` / `Orbit`:**
   - Kéo chuột để trượt hoặc xoay góc nhìn toàn cảnh hòn đảo, lăn chuột để thu phóng từ cận cảnh từng khối Voxel đến toàn bộ đại đô thị.
   - Rê chuột vào bất kỳ công trình hay xe đua nào để hiện **Hover Card** giới thiệu và bấm trực tiếp để mở Gian hàng Luyện nói Tiếng Anh.
2. **Chế độ `Walk` (Đi bộ góc nhìn thứ nhất):**
   - Dùng phím `W / A / S / D` hoặc phím mũi tên để di chuyển quanh đảo, kéo chuột để quan sát xung quanh.
   - Tiến gần các công trình và nhấn phím `[E]` để bước vào gian hàng, nhấn `[Esc]` để thoát chế độ đi bộ.
3. **Nút `Recenter`:** Đưa camera mượt mà về góc nhìn toàn cảnh trung tâm đảo.
4. **Nút `Character`:** Mở bảng tùy chỉnh nhân vật Voxel 3D với nút `Randomize`, `Wave` và `Save`.
5. **Nút `🟢 49`:** Bật/tắt khung chat giao lưu trực tiếp với các học viên đang online trên đảo.
6. **Nút `+ Add` (Chính giữa phía dưới):** Nhập mô tả công trình muốn xây để AI tự động dựng khối Voxel ngay trên bản đồ.

---

## 👥 Tác giả & Liên hệ
- **Repository:** [ngobaonamfpt-blip/speaksharp-ai-english](https://github.com/ngobaonamfpt-blip/speaksharp-ai-english)
- **Chủ đề:** *Ứng dụng AI, Gamification và Thế giới 3D Voxel trong rèn luyện giao tiếp & phản biện tiếng Anh.*
