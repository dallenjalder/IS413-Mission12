import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// API base URL -- uses environment variable if set, otherwise defaults to localhost
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5214";

// Shape of a book matching the backend model
interface Book {
  bookID: number;
  title: string;
  author: string;
  publisher: string;
  isbn: string;
  classification: string;
  category: string;
  pageCount: number;
  price: number;
}

// Blank book template used for the "Add" form
const EMPTY_BOOK: Omit<Book, "bookID"> = {
  title: "",
  author: "",
  publisher: "",
  isbn: "",
  classification: "",
  category: "",
  pageCount: 0,
  price: 0,
};

// AdminBooks -- full CRUD admin page for managing books in the database
function AdminBooks() {
  const navigate = useNavigate();

  // ---- State ----
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state -- null means the form is hidden
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Omit<Book, "bookID">>(EMPTY_BOOK);

  // Delete confirmation state
  const [deletingBookId, setDeletingBookId] = useState<number | null>(null);

  // ---- Fetch all books (no pagination -- admin sees everything) ----
  async function fetchBooks() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/books?pageSize=1000`);
      if (!res.ok) throw new Error("Failed to fetch books");
      const data = await res.json();
      setBooks(data.books);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  // Load books on mount
  useEffect(() => {
    fetchBooks();
  }, []);

  // ---- Add a new book ----
  async function handleAdd() {
    try {
      const res = await fetch(`${API_URL}/api/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, bookID: 0 }),
      });
      if (!res.ok) throw new Error("Failed to add book");

      // Refresh the list and close the form
      await fetchBooks();
      setIsAdding(false);
      setFormData(EMPTY_BOOK);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  // ---- Update an existing book ----
  async function handleUpdate() {
    if (!editingBook) return;

    const updated = { ...formData, bookID: editingBook.bookID };

    try {
      const res = await fetch(`${API_URL}/api/books/${editingBook.bookID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error("Failed to update book");

      // Refresh the list and close the form
      await fetchBooks();
      setEditingBook(null);
      setFormData(EMPTY_BOOK);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  // ---- Delete a book ----
  async function handleDelete(id: number) {
    try {
      const res = await fetch(`${API_URL}/api/books/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete book");

      // Refresh the list and close the confirmation
      await fetchBooks();
      setDeletingBookId(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  // ---- Open the edit form pre-filled with an existing book's data ----
  function startEdit(book: Book) {
    setIsAdding(false);
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      isbn: book.isbn,
      classification: book.classification,
      category: book.category,
      pageCount: book.pageCount,
      price: book.price,
    });
  }

  // ---- Open a blank form for adding a new book ----
  function startAdd() {
    setEditingBook(null);
    setIsAdding(true);
    setFormData(EMPTY_BOOK);
  }

  // ---- Cancel the current form ----
  function cancelForm() {
    setEditingBook(null);
    setIsAdding(false);
    setFormData(EMPTY_BOOK);
  }

  // ---- Handle form field changes ----
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  }

  // ---- Submit handler for the form (add or edit) ----
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isAdding) {
      handleAdd();
    } else {
      handleUpdate();
    }
  }

  return (
    <>
      {/* Navigation bar with link back to the bookstore */}
      <nav className="navbar navbar-dark bg-dark mb-4">
        <div className="container">
          <span className="navbar-brand fw-semibold">ð Bookstore Admin</span>
          <button
            className="btn btn-outline-light btn-sm"
            onClick={() => navigate("/")}
          >
            &larr; Back to Store
          </button>
        </div>
      </nav>

      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="h3 fw-bold mb-0">Manage Books</h1>
          <button className="btn btn-success" onClick={startAdd}>
            + Add New Book
          </button>
        </div>

        {/* Error alert */}
        {error && (
          <div className="alert alert-danger" role="alert">
            Error: {error}
          </div>
        )}

        {/* Add / Edit form -- shown when isAdding or editingBook is set */}
        {(isAdding || editingBook) && (
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-dark text-white fw-semibold">
              {isAdding ? "Add New Book" : `Edit: ${editingBook?.title}`}
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  {/* Title */}
                  <div className="col-md-6">
                    <label className="form-label">Title</label>
                    <input
                      type="text"
                      className="form-control"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Author */}
                  <div className="col-md-6">
                    <label className="form-label">Author</label>
                    <input
                      type="text"
                      className="form-control"
                      name="author"
                      value={formData.author}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Publisher */}
                  <div className="col-md-6">
                    <label className="form-label">Publisher</label>
                    <input
                      type="text"
                      className="form-control"
                      name="publisher"
                      value={formData.publisher}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* ISBN */}
                  <div className="col-md-6">
                    <label className="form-label">ISBN</label>
                    <input
                      type="text"
                      className="form-control"
                      name="isbn"
                      value={formData.isbn}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Classification */}
                  <div className="col-md-4">
                    <label className="form-label">Classification</label>
                    <input
                      type="text"
                      className="form-control"
                      name="classification"
                      value={formData.classification}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Category */}
                  <div className="col-md-4">
                    <label className="form-label">Category</label>
                    <input
                      type="text"
                      className="form-control"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Page Count */}
                  <div className="col-md-2">
                    <label className="form-label">Page Count</label>
                    <input
                      type="number"
                      className="form-control"
                      name="pageCount"
                      value={formData.pageCount}
                      onChange={handleChange}
                      min={1}
                      required
                    />
                  </div>

                  {/* Price */}
                  <div className="col-md-2">
                    <label className="form-label">Price</label>
                    <input
                      type="number"
                      className="form-control"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      step="0.01"
                      min={0}
                      required
                    />
                  </div>
                </div>

                {/* Form buttons */}
                <div className="mt-3 d-flex gap-2">
                  <button type="submit" className="btn btn-primary">
                    {isAdding ? "Add Book" : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={cancelForm}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Books table */}
        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover table-bordered mb-0 align-middle">
              <thead className="table-dark">
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th className="text-end">Price</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
                      <div
                        className="spinner-border spinner-border-sm text-secondary me-2"
                        role="status"
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      Loading books...
                    </td>
                  </tr>
                ) : books.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-muted">
                      No books in the database.
                    </td>
                  </tr>
                ) : (
                  books.map((book) => (
                    <tr key={book.bookID}>
                      <td>
                        <div className="fw-medium">{book.title}</div>
                        <div className="text-muted small">
                          {book.publisher} &bull; {book.isbn}
                        </div>
                      </td>
                      <td>{book.author}</td>
                      <td>
                        <span className="badge bg-secondary">
                          {book.category}
                        </span>
                      </td>
                      <td className="text-end">${book.price.toFixed(2)}</td>
                      <td className="text-center">
                        {/* Show delete confirmation or action buttons */}
                        {deletingBookId === book.bookID ? (
                          <div className="d-flex gap-1 justify-content-center">
                            <span className="small text-danger me-1">
                              Delete?
                            </span>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(book.bookID)}
                            >
                              Yes
                            </button>
                            <button
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => setDeletingBookId(null)}
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="d-flex gap-1 justify-content-center">
                            <button
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => startEdit(book)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => setDeletingBookId(book.bookID)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminBooks;
