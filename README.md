# Hệ Thống Quản Lý Món Ăn Trên Nền Tảng Đám Mây

- **Sinh viên thực hiện:** Phan Tuấn Anh
- **Mã số sinh viên:** `236435`
- **Lớp:** `DH23TIN08`
- **Học phần:** Điện toán đám mây

## 1. Giới thiệu đề tài

Ứng dụng web quản lý danh mục món ăn trực tuyến được xây dựng theo kiến trúc tách biệt **Frontend (React)** — **Backend RESTful API (Node.js/Express)** — **Cơ sở dữ liệu đám mây (MongoDB Atlas)**, đóng gói bằng **Docker**, lưu trữ image trên **Docker Hub** và triển khai công khai trên nền tảng **Render**.

Các chức năng cốt lõi của hệ thống:
- Hiển thị danh sách món ăn từ MongoDB Atlas (`236435_PhanTuanAnh` / collection `foods`).
- Tìm kiếm món ăn theo từ khóa (tên món ăn, loại món ăn, ẩm thực/vùng miền).
- Xem thông tin chi tiết của từng món ăn.
- Thêm món ăn mới (kiểm tra hợp lệ dữ liệu và chống trùng mã `foodId`).
- Cập nhật thông tin món ăn.
- Xóa món ăn khỏi hệ thống.

## 2. Công nghệ sử dụng

- **Frontend:** React 18, Vite, Fetch API, CSS Responsive.
- **Backend:** Node.js, Express, Mongoose, CORS, Dotenv.
- **Cơ sở dữ liệu:** MongoDB Atlas (`Database: 236435_PhanTuanAnh`, `Collection: foods`).
- **Quản lý mã nguồn:** Git & GitHub (`Anh-2005-pta/236435_PhanTuanAnh`).
- **Container hóa:** Docker, Docker Compose, Nginx, Docker Hub.
- **Triển khai đám mây:** Render (`api-236435` và `web-236435`).

## 3. Cấu trúc thư mục dự án

```text
236435_PhanTuanAnh/
├── backend/                  # Mã nguồn Backend RESTful API (Node.js + Express + Mongoose)
│   ├── src/
│   │   ├── models/           # Mongoose Schema cho collection foods
│   │   ├── routes/           # Các route CRUD & tìm kiếm /api/foods
│   │   ├── seed.js           # Khởi tạo dữ liệu món ăn mẫu lên MongoDB Atlas
│   │   └── server.js         # Điểm vào ứng dụng Express & endpoint /health
│   ├── .env.example          # Mẫu biến môi trường Backend (không chứa bí mật)
│   └── package.json
├── frontend/                 # Mã nguồn giao diện người dùng (React + Vite)
│   ├── src/                  # Giao diện danh sách, tìm kiếm, chi tiết, thêm/sửa/xóa món ăn
│   ├── .env.example          # Mẫu cấu hình địa chỉ Backend API
│   └── package.json
├── .gitignore                # Loại trừ node_modules, dist, .env và tệp tạm
└── README.md                 # Tài liệu hướng dẫn cài đặt, Docker và URL triển khai
```

## 4. Hướng dẫn cài đặt và chạy chương trình (Môi trường Local)

### Bước 1: Clone repository

```bash
git clone https://github.com/Anh-2005-pta/236435_PhanTuanAnh.git
cd 236435_PhanTuanAnh
```

### Bước 2: Cấu hình và chạy Backend API

1. Di chuyển vào thư mục `backend` và cài đặt thư viện:
   ```bash
   cd backend
   npm install
   ```
2. Tạo tệp `.env` cục bộ từ `.env.example` và điền chuỗi kết nối MongoDB Atlas (tuyệt đối không commit tệp `.env`):
   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://<db_username>:<db_password>@<cluster_host>/236435_PhanTuanAnh?retryWrites=true&w=majority
   CORS_ORIGIN=*
   ```
3. Khởi tạo dữ liệu mẫu (nếu cần) và chạy server:
   ```bash
   npm run seed
   npm start
   ```
   Backend chạy mặc định tại `http://localhost:5000` (kiểm tra trạng thái tại `http://localhost:5000/health`).

### Bước 3: Cấu hình và chạy Frontend React

1. Mở terminal mới, di chuyển vào thư mục `frontend` và cài đặt thư viện:
   ```bash
   cd frontend
   npm install
   ```
2. Tạo tệp `.env` (tùy chọn, mặc định trỏ về `http://localhost:5000`):
   ```env
   VITE_API_URL=http://localhost:5000
   ```
3. Khởi chạy giao diện phát triển:
   ```bash
   npm run dev
   ```
   Truy cập giao diện tại `http://localhost:5173`.

## 5. Chạy backend bằng Docker

Image: [phantuananhnct/backend](https://hub.docker.com/r/phantuananhnct/backend).

```bash
docker build -t phantuananhnct/backend:latest ./backend
docker run --name foods-236435-api --env-file ./backend/.env -e PORT=5000 -p 5000:5000 phantuananhnct/backend:latest
```

Tạo `backend/.env` riêng theo mẫu trước khi chạy. Image chỉ chứa mã nguồn ứng dụng và thư viện, không chứa `.env`. Kiểm tra `http://localhost:5000/health` và `http://localhost:5000/api/foods`.

## 6. Chạy frontend bằng Docker

Image: [phantuananhnct/frontend](https://hub.docker.com/r/phantuananhnct/frontend).

```bash
docker build -t phantuananhnct/frontend:latest ./frontend
docker run --name foods-236435-web -p 5173:80 -e API_URL=http://localhost:5000 phantuananhnct/frontend:latest
```

Truy cập `http://localhost:5173`. `API_URL` là địa chỉ backend mà trình duyệt truy cập được. Khi triển khai cloud, đặt URL HTTPS công khai của backend; cấu hình được nạp lúc container khởi động.

Có thể chạy hai container bằng `docker compose up -d --build` sau khi cấu hình biến `MONGODB_URI` qua môi trường máy. Compose dùng project name riêng `foods-236435-phantuananh`.

## 7. Frontend trên Render

URL frontend: [web-236435.onrender.com](https://web-236435.onrender.com).

- Static Site: `web-236435`, branch `main`, root directory `frontend`.
- Build command: `npm ci && npm run build`; publish directory: `dist`.
- `VITE_API_URL`: `https://api-236435.onrender.com`.
- Frontend đã deploy Live và trả HTTP 200, kết nối API công khai và hiển thị dữ liệu Atlas.

## 8. Backend trên Render

URL API: [api-236435.onrender.com](https://api-236435.onrender.com); [kiểm tra health](https://api-236435.onrender.com/health).

- Web Service `api-236435`, gói Free, Singapore, branch `main`, runtime Docker, root directory `backend`.
- Biến riêng của service: `PORT`, `MONGODB_URI`, `CORS_ORIGIN=https://web-236435.onrender.com`.
- MongoDB Atlas: Project `Project_236435_PhanTuanAnh`, cluster Free `Cluster0`, database `236435_PhanTuanAnh`, collection `foods`.
- API công khai đã qua kiểm thử health, danh sách 5 món mẫu, chi tiết, tìm kiếm, thêm/sửa/xóa và mã lỗi 400/404/409.
- Gói Free có thể cần thời gian khởi động lại sau khi không có truy cập.

## 9. Thông tin nộp bài và kiểm thử

| Trường | Đường dẫn / định danh |
|---|---|
| Link_GitHub | https://github.com/Anh-2005-pta/236435_PhanTuanAnh |
| Link_Docker_Backend | https://hub.docker.com/r/phantuananhnct/backend |
| Link_Docker_Frontend | https://hub.docker.com/r/phantuananhnct/frontend |
| Link_Render_App | https://web-236435.onrender.com |
| Link_Render_API | https://api-236435.onrender.com |
| Link_Data_MongoDB | https://cloud.mongodb.com/v2/6ae2e9540a48fbd3acd5f31f#/explorer — database `236435_PhanTuanAnh`, collection `foods` |

Trang quản lý Atlas cần tài khoản được cấp quyền; không công khai chuỗi kết nối hoặc mật khẩu để nộp bài.

Kết quả kiểm tra ngày 29/10/2026:

- API công khai: health, danh sách, chi tiết, tìm kiếm, thêm, sửa, xóa; lỗi 400/404/409 đều đạt. Dữ liệu được lưu trên Atlas.
- Giao diện Render: hiển thị dữ liệu thật, thêm món thử, xem chi tiết, sửa và tìm kiếm đều đạt. Hộp xác nhận xóa chưa được xác nhận tự động do công cụ trình duyệt bị chặn ở hộp thoại; thao tác xóa qua API đã đạt và bản ghi thử đã được dọn.
- Docker backend chạy thật với biến môi trường; frontend container trả HTTP 200 và nạp API_URL lúc khởi động. Cả hai image đã push, trang Docker Hub trả HTTP 200.
- Repository công khai; lịch sử có commit riêng theo 9 câu. Git guard kiểm tra allowlist và bí mật trước mỗi lần commit/push.

Biểu mẫu nộp bài: https://docs.google.com/forms/d/e/1FAIpQLSc6p2I6a-D8EhovwGKEsi4jxoUC7RtcSRQps8_VysECi5jziw/viewform
