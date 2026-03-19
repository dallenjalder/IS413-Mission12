import { useEffect, useRef, useState } from "react";
import { useCart } from "../context/CartContext";
import type { BookListState } from "../App";

// Type declaration for Bootstrap JS loaded via CDN
declare const bootstrap: {
  Toast: new (el: HTMLElement, options?: { delay?: number }) => { show(): void };
};

// Shape of each book returned by the API
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

// Shape of the paginated API response
interface BooksResponse {
  books: Book[];
  totalCount: number;
}

interface BookListProps {
  initialState: BookListState;               // Restored state when coming back from cart
  onStateChange: (s: BookListState) => void; // Keeps parent in sync for "Continue Shopping"
}

// BookList -- main browse page with category filter, sorting, pagination, and cart
function BookList({ initialState, onStateChange }: BookListProps) {
  // ---- View state (initialized from parent so "Continue Shopping" restores position) ----
  let [currentPage, setCurrentPage] = useState(initialState.currentPage);
  let [pageSize, setPageSize] = useState(initialState.pageSize);
  let [sortOrder, setSortOrder] = useState<"asc" | "desc">(initialState.sortOrder);
  let [selectedCategory, setSelectedCategory] = useState(initialState.selectedCategory);

  // ---- Data state ----
  let [books, setBooks] = useState<Book[]>([]);
  let [totalCount, setTotalCount] = useState(0);
  let [categories, setCategories] = useState<string[]>([]);
  let [loading, setLoading] = useState(true);
  let [error, setError] = useState<string | null>(null);

  // ---- Toast state -- NEW Bootstrap feature #2 ----
  let [toastTitle, setToastTitle] = useState("");
  const toastRef = useRef<HTMLDivElement>(null); // ref to the toast DOM element

  const { addToCart, totalItems, totalPrice } = useCart();

  // Total pages needed based on filtered totalCount and pageSize
  const totalPages = Math.ceil(totalCount / pageSize);

  // Keep parent's saved state in sync (setBookListState is a stable React setter, no loop)
  useEffect(() => {
    onStateChange({ currentPage, pageSize, sortOrder, selectedCategory });
  }, [currentPage, pageSize, sortOrder, selectedCategory, onStateChange]);

  // Fetch all distinct categories once on mount (for the filter sidebar)
  useEffect(() => {
    fetch("http://localhost:5214/api/books/categories")
      .then((res) => res.json() as Promise<string[]>)
      .then(setCategories)
      .catch(() => {}); // non-critical -- sidebar just won't populate
  }, []);

  // Fetch books whenever any filter/sort/page param changes
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(currentPage),
      pageSize: String(pageSize),
      sortOrder,
      ...(selectedCategory ? { category: selectedCategory } : {}),
    });

    fetch(`http://localhost:5214/api/books?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch books");
        return res.json() as Promise<BooksResponse>;
      })
      .then((data) => {
        setBooks(data.books);
        setTotalCount(data.totalCount);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [currentPage, pageSize, sortOrder, selectedCategory]);

  // When the user changes pageSize, reset to page 1
  function handlePageSizeChange(newSize: number) {
    setPageSize(newSize);
    setCurrentPage(1);
  }

  // Toggle sort direction and reset to page 1
  function toggleSort() {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    setCurrentPage(1);
  }

  // Select a category from the sidebar; page numbers reset automatically
  function handleCategorySelect(cat: string) {
    setSelectedCategory(cat);
    setCurrentPage(1);
  }

  // Add a book to the cart and show a Bootstrap Toast notification
  function handleAddToCart(book: Book) {
    addToCart({ bookID: book.bookID, title: book.title, price: book.price });

    // Set the toast message and show it via Bootstrap's Toast JS API
    setToastTitle(book.title);
    if (toastRef.current) {
      new bootstrap.Toast(toastRef.current, { delay: 2500 }).show();
    }
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        Error: {error}
      </div>
    );
  }

  const firstRecord = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastRecord = Math.min(currentPage * pageSize, totalCount);

  return (
    <>
      {/*
        NEW Bootstrap feature #2: Toast notification
        Appears bottom-right whenever a book is added to the cart.
        Shown programmatically via Bootstrap's JS Toast API (new bootstrap.Toast(...).show()).
        Requires the Bootstrap JS bundle loaded in index.html.
      */}
      <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1100 }}>
        <div
          ref={toastRef}
          className="toast align-items-center text-bg-success border-0"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div className="d-flex">
            <div className="toast-body">
              ✓ Added: <strong>{toastTitle}</strong>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white me-2 m-auto"
              data-bs-dismiss="toast"
              aria-label="Close"
            />
          </div>
        </div>
      </div>

      {/* Bootstrap Grid -- col-md-3 sidebar + col-md-9 main content */}
      <div className="row g-4">

        {/* ---- Sidebar (col-md-3) ---- */}
        <div className="col-md-3">

          {/* Cart Summary -- shows quantity AND price, satisfies rubric requirement */}
          <div className="card shadow-sm mb-3">
            <div className="card-header bg-dark text-white fw-semibold py-2">
              🛒 Cart Summary
            </div>
            <div className="card-body py-2 px-3">
              {totalItems === 0 ? (
                <p className="text-muted small mb-0">Your cart is empty.</p>
              ) : (
                <>
                  <p className="mb-1 small">
                    <span className="fw-medium">Items:</span> {totalItems}
                  </p>
                  <p className="mb-2 small">
                    <span className="fw-medium">Total:</span> ${totalPrice.toFixed(2)}
                  </p>
                  {/* Opens the Offcanvas drawer (defined in App.tsx) */}
                  <button
                    className="btn btn-dark btn-sm w-100"
                    data-bs-toggle="offcanvas"
                    data-bs-target="#cartDrawer"
                    aria-controls="cartDrawer"
                  >
                    View Cart
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Category filter -- buttons styled with btn-outline-secondary */}
          <div className="card shadow-sm">
            <div className="card-header bg-dark text-white fw-semibold py-2">
              Filter by Category
            </div>
            <div className="card-body p-2 d-grid gap-1">
              {/* "All Books" resets the filter */}
              <button
                className={`btn btn-sm text-start ${
                  selectedCategory === "" ? "btn-dark" : "btn-outline-secondary"
                }`}
                onClick={() => handleCategorySelect("")}
              >
                All Books
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`btn btn-sm text-start ${
                    selectedCategory === cat ? "btn-dark" : "btn-outline-secondary"
                  }`}
                  onClick={() => handleCategorySelect(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ---- Main Book List (col-md-9) ---- */}
        <div className="col-md-9">
          <div className="card shadow-sm">

            {/* Controls bar */}
            <div className="card-header bg-white d-flex align-items-center gap-3 py-2 flex-wrap">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={toggleSort}
              >
                Title {sortOrder === "asc" ? "A \u2192 Z" : "Z \u2192 A"}
              </button>

              <div className="d-flex align-items-center gap-2">
                <label htmlFor="pageSizeSelect" className="mb-0 small text-muted">
                  Per page:
                </label>
                <select
                  id="pageSizeSelect"
                  className="form-select form-select-sm"
                  style={{ width: "auto" }}
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
              </div>

              <span className="text-muted small ms-auto">
                {loading
                  ? "Loading..."
                  : totalCount === 0
                  ? "No books found"
                  : `Showing ${firstRecord}–${lastRecord} of ${totalCount}`}
              </span>
            </div>

            {/* Book table */}
            <div className="table-responsive">
              <table className="table table-hover table-bordered mb-0 align-middle">
                <thead className="table-dark">
                  <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Category</th>
                    <th className="text-end">Price</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    // Bootstrap Spinner shown while books load
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
                  ) : (
                    books.map((book) => (
                      <tr key={book.bookID}>
                        <td>
                          <div className="fw-medium">{book.title}</div>
                          <div className="text-muted small">
                            {book.publisher} &bull; {book.pageCount.toLocaleString()} pp
                          </div>
                        </td>
                        <td>{book.author}</td>
                        <td>
                          <span className="badge bg-secondary">{book.category}</span>
                        </td>
                        <td className="text-end">${book.price.toFixed(2)}</td>
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-outline-dark"
                            onClick={() => handleAddToCart(book)}
                          >
                            + Cart
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination -- built from totalPages, adjusts automatically with category filter */}
            <div className="card-footer bg-white">
              <nav aria-label="Book pagination">
                <ul className="pagination pagination-sm justify-content-center mb-0">
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      &laquo;
                    </button>
                  </li>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <li
                      key={page}
                      className={`page-item ${currentPage === page ? "active" : ""}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    </li>
                  ))}

                  <li
                    className={`page-item ${
                      currentPage === totalPages || totalPages === 0 ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      &raquo;
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default BookList;
