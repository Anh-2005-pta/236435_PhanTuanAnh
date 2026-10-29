import React, { useEffect, useRef, useState } from 'react';

const rawApiUrl =
  (typeof window !== 'undefined' && window.__APP_CONFIG__ && window.__APP_CONFIG__.API_URL) ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';

const API_BASE_URL = String(rawApiUrl).replace(/\/+$/, '');

const EMPTY_FORM = {
  foodId: '',
  name: '',
  category: '',
  cuisine: '',
  ingredientsText: '',
  price: '',
  quantity: '',
  description: '',
  imageUrl: '',
};

function formatCurrency(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0 ₫';
  return `${num.toLocaleString('vi-VN')} ₫`;
}

function shortText(value) {
  const text = String(value || '');
  return text.length > 48 ? `${text.slice(0, 48)}…` : text;
}

export default function App() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  const [selectedFood, setSelectedFood] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const deleteDialog = useRef(null);
  const listRequest = useRef(0);
  const newestRow = useRef(null);
  const [newestId, setNewestId] = useState(null);
  const [revealId, setRevealId] = useState(null);

  useEffect(() => {
    if (revealId && !loading && newestRow.current) {
      newestRow.current.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        block: 'center', inline: 'nearest',
      });
      setRevealId(null);
    }
  }, [foods, loading, revealId]);

  useEffect(() => {
    const dialog = deleteDialog.current;
    if (pendingDelete && !dialog.open) dialog.showModal();
    if (!pendingDelete && dialog.open) dialog.close();
  }, [pendingDelete]);

  async function fetchFoods(keyword = activeSearch, { quiet = false, created = null } = {}) {
    const request = ++listRequest.current;
    if (!quiet) setLoading(true);
    setErrorMsg('');
    try {
      const query = keyword.trim()
        ? `?search=${encodeURIComponent(keyword.trim())}`
        : '';
      const response = await fetch(`${API_BASE_URL}/api/foods${query}`);
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          (payload && payload.message) || `Không thể tải danh sách món ăn (HTTP ${response.status}).`
        );
      }
      if (request !== listRequest.current) return;
      const list = Array.isArray(payload) ? payload : (payload && payload.data) || [];
      const refreshed = created ? [created, ...list.filter(food => food._id !== created._id)] : list;
      refreshed.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setFoods(refreshed);
    } catch (err) {
      if (request === listRequest.current) setErrorMsg(err.message || 'Không thể kết nối đến Backend API.');
    } finally {
      if (request === listRequest.current) setLoading(false);
    }
  }

  useEffect(() => {
    fetchFoods('');
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setSuccessMsg('');
    setActiveSearch(searchInput);
    fetchFoods(searchInput);
  }

  function handleClearSearch() {
    setSearchInput('');
    setActiveSearch('');
    setSuccessMsg('');
    fetchFoods('');
  }

  async function handleViewDetail(food) {
    setDetailLoading(true);
    setErrorMsg('');
    try {
      const idOrCode = food._id || food.foodId;
      const response = await fetch(`${API_BASE_URL}/api/foods/${encodeURIComponent(idOrCode)}`);
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          (payload && payload.message) || `Không thể tải chi tiết món ăn (HTTP ${response.status}).`
        );
      }
      setSelectedFood(payload);
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi khi xem chi tiết món ăn.');
    } finally {
      setDetailLoading(false);
    }
  }

  function handleStartEdit(food) {
    setErrorMsg('');
    setSuccessMsg('');
    setEditingId(food._id || food.foodId);
    setFormData({
      foodId: food.foodId || '',
      name: food.name || '',
      category: food.category || '',
      cuisine: food.cuisine || '',
      ingredientsText: Array.isArray(food.ingredients) ? food.ingredients.join(', ') : '',
      price: food.price !== undefined && food.price !== null ? String(food.price) : '',
      quantity: food.quantity !== undefined && food.quantity !== null ? String(food.quantity) : '',
      description: food.description || '',
      imageUrl: food.imageUrl || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setErrorMsg('');
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const ingredients = formData.ingredientsText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const body = {
      foodId: formData.foodId.trim(),
      name: formData.name.trim(),
      category: formData.category.trim(),
      cuisine: formData.cuisine.trim(),
      ingredients,
      price: formData.price === '' ? '' : Number(formData.price),
      quantity: formData.quantity === '' ? '' : Number(formData.quantity),
      description: formData.description.trim(),
      imageUrl: formData.imageUrl.trim(),
    };

    setSubmitting(true);
    try {
      const isEditing = Boolean(editingId);
      const url = isEditing
        ? `${API_BASE_URL}/api/foods/${encodeURIComponent(editingId)}`
        : `${API_BASE_URL}/api/foods`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const detail =
          payload && Array.isArray(payload.errors) && payload.errors.length > 0
            ? payload.errors.join(' ')
            : payload && payload.message;
        throw new Error(detail || `Thao tác thất bại (HTTP ${response.status}).`);
      }

      setSuccessMsg(
        isEditing
          ? `Đã cập nhật món ăn "${shortText(payload.name)}" thành công.`
          : `Đã thêm món ăn "${shortText(payload.name)}" thành công.`
      );
      setEditingId(null);
      setFormData(EMPTY_FORM);

      if (selectedFood && (selectedFood._id === payload._id || selectedFood.foodId === payload.foodId)) {
        setSelectedFood(payload);
      }

      if (isEditing) {
        await fetchFoods(activeSearch);
      } else {
        // Show the confirmed server record immediately, even with a previous search in flight.
        ++listRequest.current;
        setSearchInput('');
        setActiveSearch('');
        setFoods(previous => [payload, ...previous.filter(food => food._id !== payload._id)]);
        setLoading(false);
        setNewestId(payload._id);
        setRevealId(payload._id);
        void fetchFoods('', { quiet: true, created: payload });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Không thể lưu thông tin món ăn.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(food) {
    if (deleting) return;
    setDeleting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const idOrCode = food._id || food.foodId;
      const response = await fetch(`${API_BASE_URL}/api/foods/${encodeURIComponent(idOrCode)}`, {
        method: 'DELETE',
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          (payload && payload.message) || `Không thể xóa món ăn (HTTP ${response.status}).`
        );
      }

      setSuccessMsg(
        `Đã xóa món ăn "${shortText(food.name)}" thành công.`
      );
      if (selectedFood && (selectedFood._id === food._id || selectedFood.foodId === food.foodId)) {
        setSelectedFood(null);
      }
      if (editingId && (editingId === food._id || editingId === food.foodId)) {
        setEditingId(null);
        setFormData(EMPTY_FORM);
      }
      await fetchFoods(activeSearch);
      setPendingDelete(null);
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi khi xóa món ăn.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Hệ Thống Quản Lý Món Ăn</h1>
        </div>
      </header>

      <main className="main-container">
        {errorMsg && (
          <div className="alert alert-error" role="alert">
            <span>{errorMsg}</span>
            <button type="button" className="alert-close" onClick={() => setErrorMsg('')}>
              ×
            </button>
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success" role="status">
            <span>{successMsg}</span>
            <button type="button" className="alert-close" onClick={() => setSuccessMsg('')}>
              ×
            </button>
          </div>
        )}

        <div className="layout-grid">
          <section className="card form-section">
            <h2>{editingId ? 'Cập Nhật Thông Tin Món Ăn' : 'Thêm Món Ăn Mới'}</h2>
            <form onSubmit={handleFormSubmit} className="food-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="foodId">Mã món ăn (foodId) *</label>
                  <input
                    id="foodId"
                    name="foodId"
                    type="text"
                    placeholder="VD: FD006"
                    value={formData.foodId}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="name">Tên món ăn *</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="VD: Bánh Mì Thịt Nướng"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category">Loại món ăn *</label>
                  <input
                    id="category"
                    name="category"
                    type="text"
                    placeholder="VD: Món khô / Món nước / Khai vị"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="cuisine">Ẩm thực / Vùng miền *</label>
                  <input
                    id="cuisine"
                    name="cuisine"
                    type="text"
                    placeholder="VD: Miền Bắc / Miền Trung / Miền Nam"
                    value={formData.cuisine}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="price">Giá bán (VNĐ) *</label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="VD: 45000"
                    value={formData.price}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="quantity">Số lượng hiện có *</label>
                  <input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="VD: 25"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="ingredientsText">
                  Nguyên liệu (dấu phẩy) *
                </label>
                <input
                  id="ingredientsText"
                  name="ingredientsText"
                  type="text"
                  placeholder="VD: Bánh mì giòn, Thịt heo nướng, Đồ chua, Rau mùi"
                  value={formData.ingredientsText}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="imageUrl">Đường dẫn hình ảnh (imageUrl)</label>
                <input
                  id="imageUrl"
                  name="imageUrl"
                  type="url"
                  placeholder="https://example.com/food.jpg"
                  value={formData.imageUrl}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Mô tả món ăn</label>
                <textarea
                  id="description"
                  name="description"
                  rows="3"
                  placeholder="Mô tả hương vị và đặc trưng của món ăn..."
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting
                    ? 'Đang lưu...'
                    : editingId
                    ? 'Lưu cập nhật'
                    : 'Thêm món ăn'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCancelEdit}
                    disabled={submitting}
                  >
                    Hủy chỉnh sửa
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="card list-section">
            <div className="list-toolbar">
              <h2>
                Danh Sách Món Ăn{' '}
                <span className="count-badge">{foods.length} món</span>
              </h2>
              <form onSubmit={handleSearchSubmit} className="search-bar">
                <input
                  type="text"
                  placeholder="Tìm theo tên, loại món hoặc vùng miền (VD: pho)..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  aria-label="Từ khóa tìm kiếm món ăn"
                />
                <button type="submit" className="btn btn-primary">
                  Tìm kiếm
                </button>
                {(searchInput || activeSearch) && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleClearSearch}
                  >
                    Tất cả
                  </button>
                )}
              </form>
            </div>

            {activeSearch && (
              <p className="search-indicator">
                Kết quả lọc theo từ khóa: <strong>"{activeSearch}"</strong>
              </p>
            )}

            {loading ? (
              <div className="state-box">Đang tải dữ liệu món ăn từ máy chủ...</div>
            ) : foods.length === 0 ? (
              <div className="state-box">
                Không có món ăn nào phù hợp. Hãy thử từ khóa khác hoặc thêm món ăn mới.
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="food-table">
                  <thead>
                    <tr>
                      <th>Mã</th>
                      <th>Món ăn</th>
                      <th>Loại</th>
                      <th>Vùng miền</th>
                      <th>Giá bán</th>
                      <th>Số lượng</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {foods.map((food) => (
                      <tr key={food._id || food.foodId}
                        ref={food._id === newestId ? newestRow : null}
                        className={food._id === newestId ? 'new-food-row' : undefined}>
                        <td className="code-cell"><span className="cell-text" title={food.foodId}>{food.foodId}</span></td>
                        <td>
                          <div className="food-title-cell">
                            {food.imageUrl && (
                              <img
                                src={food.imageUrl}
                                alt={food.name}
                                className="food-thumb"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            <span className="cell-text" title={food.name}>{food.name}</span>
                            {food._id === newestId && <span className="new-food-badge">Vừa thêm</span>}
                          </div>
                        </td>
                        <td><span className="cell-text" title={food.category}>{food.category}</span></td>
                        <td><span className="cell-text" title={food.cuisine}>{food.cuisine}</span></td>
                        <td className="price-cell">{formatCurrency(food.price)}</td>
                        <td>{food.quantity}</td>
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="btn btn-small btn-info"
                              onClick={() => handleViewDetail(food)}
                            >
                              Chi tiết
                            </button>
                            <button
                              type="button"
                              className="btn btn-small btn-warning"
                              onClick={() => handleStartEdit(food)}
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              className="btn btn-small btn-danger"
                              onClick={() => setPendingDelete(food)}
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {(detailLoading || selectedFood) && (
          <div
            className="modal-backdrop"
            onClick={() => {
              if (!detailLoading) setSelectedFood(null);
            }}
          >
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Chi Tiết Món Ăn</h3>
                <button
                  type="button"
                  className="alert-close"
                  onClick={() => setSelectedFood(null)}
                >
                  ×
                </button>
              </div>
              {detailLoading ? (
                <div className="state-box">Đang tải thông tin chi tiết...</div>
              ) : (
                selectedFood && (
                  <div className="detail-body">
                    {selectedFood.imageUrl && (
                      <img
                        src={selectedFood.imageUrl}
                        alt={selectedFood.name}
                        className="detail-image"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <dl className="detail-grid">
                      <div>
                        <dt>Mã món ăn (foodId)</dt>
                        <dd>{selectedFood.foodId}</dd>
                      </div>
                      <div>
                        <dt>Tên món ăn</dt>
                        <dd>{selectedFood.name}</dd>
                      </div>
                      <div>
                        <dt>Loại món ăn</dt>
                        <dd>{selectedFood.category}</dd>
                      </div>
                      <div>
                        <dt>Ẩm thực / Vùng miền</dt>
                        <dd>{selectedFood.cuisine}</dd>
                      </div>
                      <div>
                        <dt>Giá bán</dt>
                        <dd className="price-cell">{formatCurrency(selectedFood.price)}</dd>
                      </div>
                      <div>
                        <dt>Số lượng hiện có</dt>
                        <dd>{selectedFood.quantity}</dd>
                      </div>
                    </dl>
                    <div className="detail-block">
                      <h4>Danh sách nguyên liệu</h4>
                      <div className="tag-list">
                        {Array.isArray(selectedFood.ingredients) &&
                          selectedFood.ingredients.map((ing, idx) => (
                            <span key={`${ing}-${idx}`} className="tag">
                              {ing}
                            </span>
                          ))}
                      </div>
                    </div>
                    <div className="detail-block">
                      <h4>Mô tả món ăn</h4>
                      <p>{selectedFood.description || 'Chưa có mô tả chi tiết.'}</p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
        <dialog ref={deleteDialog} className="delete-dialog" aria-labelledby="delete-title"
          aria-describedby="delete-description" onCancel={(e) => {
            if (deleting) e.preventDefault();
            else setPendingDelete(null);
          }}>
          <h2 id="delete-title">Xóa món ăn?</h2>
          <p id="delete-description">Món <strong>{pendingDelete?.name}</strong> (<span>{pendingDelete?.foodId}</span>) sẽ bị xóa khỏi danh sách.</p>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" autoFocus disabled={deleting}
              onClick={() => setPendingDelete(null)}>Hủy</button>
            <button type="button" className="btn btn-danger" disabled={deleting}
              onClick={() => handleDelete(pendingDelete)}>{deleting ? 'Đang xóa…' : 'Xác nhận xóa'}</button>
          </div>
        </dialog>
      </main>
    </div>
  );
}
