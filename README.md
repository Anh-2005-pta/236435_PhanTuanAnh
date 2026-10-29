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
- `VITE_API_URL`: `https://api-236435.onrender.com` (đích backend dự kiến; cần kiểm chứng sau khi backend được tạo).
- Frontend đã deploy Live và trả HTTP 200. Kiểm thử CRUD công khai đang chờ backend được cấu hình biến môi trường và deploy thành công.
