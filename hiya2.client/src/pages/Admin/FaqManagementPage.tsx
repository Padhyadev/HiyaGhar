import React, { useState, useEffect } from 'react';
import { FaqService, type FaqItem } from '../../services/faqService';
import { showToast } from '../../utils/alertService';
import './FaqManagementPage.css';

const CATEGORY_OPTIONS = [
  { value: 'general', label: 'About HIYAGHAR (General)' },
  { value: 'products', label: 'Products & Ingredients' },
  { value: 'orders', label: 'Orders & Shipping' },
  { value: 'gifting', label: 'Gifting & Combos' },
];

export const FaqManagementPage: React.FC = () => {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [formCategory, setFormCategory] = useState<string>('general');
  const [formQuestion, setFormQuestion] = useState<string>('');
  const [formAnswer, setFormAnswer] = useState<string>('');
  const [formDisplayOrder, setFormDisplayOrder] = useState<number>(0);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchFaqs = async () => {
    setLoading(true);
    const res = await FaqService.getAdminFaqs(categoryFilter, searchTerm);
    if (res.success) {
      setFaqs(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFaqs();
  }, [categoryFilter, searchTerm]);

  const handleOpenAddModal = () => {
    setEditingFaq(null);
    setFormCategory('general');
    setFormQuestion('');
    setFormAnswer('');
    setFormDisplayOrder(faqs.length + 1);
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: FaqItem) => {
    setEditingFaq(item);
    setFormCategory(item.category);
    setFormQuestion(item.question);
    setFormAnswer(item.answer);
    setFormDisplayOrder(item.displayOrder);
    setFormIsActive(item.isActive !== false);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestion.trim() || !formAnswer.trim()) {
      showToast('Please enter both question and answer', 'error');
      return;
    }

    setSubmitting(true);
    if (editingFaq) {
      const res = await FaqService.updateFaq(editingFaq.id, {
        category: formCategory,
        question: formQuestion.trim(),
        answer: formAnswer.trim(),
        displayOrder: Number(formDisplayOrder),
        isActive: formIsActive,
      });
      if (res.success) {
        showToast('FAQ updated successfully!', 'success');
        setIsModalOpen(false);
        fetchFaqs();
      } else {
        showToast(res.message, 'error');
      }
    } else {
      const res = await FaqService.createFaq({
        category: formCategory,
        question: formQuestion.trim(),
        answer: formAnswer.trim(),
        displayOrder: Number(formDisplayOrder),
        isActive: formIsActive,
      });
      if (res.success) {
        showToast('FAQ added successfully!', 'success');
        setIsModalOpen(false);
        fetchFaqs();
      } else {
        showToast(res.message, 'error');
      }
    }
    setSubmitting(false);
  };

  const handleToggleStatus = async (id: number) => {
    const res = await FaqService.toggleStatus(id);
    if (res.success) {
      showToast(res.message, 'success');
      setFaqs((prev) =>
        prev.map((f) => (f.id === id ? { ...f, isActive: res.isActive } : f))
      );
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this FAQ question?')) return;
    const res = await FaqService.deleteFaq(id);
    if (res.success) {
      showToast(res.message, 'success');
      setFaqs((prev) => prev.filter((f) => f.id !== id));
    } else {
      showToast(res.message, 'error');
    }
  };

  return (
    <div className="faq-mgmt-page">
      {/* Header */}
      <div className="faq-mgmt-header">
        <div className="faq-mgmt-title">
          <h1>FAQ Management</h1>
          <p>Create, edit, and organize frequently asked questions for the storefront.</p>
        </div>
        <button type="button" className="faq-mgmt-btn-primary" onClick={handleOpenAddModal}>
          <i className="fa-solid fa-plus"></i> Add New FAQ
        </button>
      </div>

      {/* Filters */}
      <div className="faq-mgmt-filters">
        <div className="faq-mgmt-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by question or answer keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="faq-mgmt-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          {CATEGORY_OPTIONS.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="faq-mgmt-table-card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Loading FAQs...
          </div>
        ) : faqs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            No FAQs found. Click "Add New FAQ" to create one.
          </div>
        ) : (
          <table className="faq-mgmt-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Order</th>
                <th style={{ width: '160px' }}>Category</th>
                <th>Question & Answer</th>
                <th style={{ width: '120px' }}>Status</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {faqs.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: '#64748b' }}>#{item.displayOrder}</span>
                  </td>
                  <td>
                    <span className={`faq-cat-badge faq-cat-${item.category}`}>
                      {item.category}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                      {item.question}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
                      {item.answer}
                    </div>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`faq-status-toggle ${item.isActive !== false ? 'active' : 'inactive'}`}
                      onClick={() => handleToggleStatus(item.id)}
                      title="Click to toggle status"
                    >
                      <i className={`fa-solid ${item.isActive !== false ? 'fa-check' : 'fa-xmark'}`}></i>
                      {item.isActive !== false ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td>
                    <div className="faq-actions-cell" style={{ justifyContent: 'center' }}>
                      <button
                        type="button"
                        className="faq-action-btn"
                        onClick={() => handleOpenEditModal(item)}
                        title="Edit FAQ"
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>
                      <button
                        type="button"
                        className="faq-action-btn delete"
                        onClick={() => handleDelete(item.id)}
                        title="Delete FAQ"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="faq-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="faq-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="faq-modal-header">
              <h2>{editingFaq ? 'Edit FAQ' : 'Add New FAQ'}</h2>
              <button
                type="button"
                className="faq-modal-close"
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="faq-modal-body">
                <div className="faq-form-row">
                  <div className="faq-form-group">
                    <label>Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                    >
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="faq-form-group">
                    <label>Display Order</label>
                    <input
                      type="number"
                      value={formDisplayOrder}
                      onChange={(e) => setFormDisplayOrder(Number(e.target.value))}
                      min="0"
                    />
                  </div>
                </div>

                <div className="faq-form-group">
                  <label>Question</label>
                  <input
                    type="text"
                    placeholder="e.g., What are the ingredients of Shahi Pan Mukhwas?"
                    value={formQuestion}
                    onChange={(e) => setFormQuestion(e.target.value)}
                    required
                  />
                </div>

                <div className="faq-form-group">
                  <label>Answer</label>
                  <textarea
                    rows={4}
                    placeholder="Provide a clear, helpful explanation..."
                    value={formAnswer}
                    onChange={(e) => setFormAnswer(e.target.value)}
                    required
                  />
                </div>

                <label className="faq-checkbox-group">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                  />
                  <span>Active (Visible on website)</span>
                </label>
              </div>

              <div className="faq-modal-footer">
                <button
                  type="button"
                  className="faq-btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="faq-mgmt-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : editingFaq ? 'Save Changes' : 'Create FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
