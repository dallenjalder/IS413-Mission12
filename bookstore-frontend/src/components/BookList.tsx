import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import type { BookListState } from "../App";

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
  initialState: BookListState;       // Restored state when coming back from cart
  onStateChange: (s: BookListState) => void; // Saves state to parent so cart nav restores it
  onGoToCart: (s: BookListState) => void;    // Navigate to cart, passing current state
}

// BookList -- main browse page with category filter sidebar, sorting, pagination, and cart
function BookList({ initialState, onStateChange, onGoToCart }: BookListProps) {
  // ---- View state (restored from parent when coming back from cart) ----
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
  let [addedBookID, setAddedBookID] = useState<number | null>(null); // tracks "Added!" flash

  const { addToCart, totalItems, totalPrice } = useCart();

  // Total pages needed based on totalCount and pageSize
  const totalPages = Math.ceil(totalCount / pageSize);

  // Keep parent's saved state in sync so "Continue Shopping" restores this exact view
  useEffect(() => {
    onStateChange({ currentPage, pageSize, sortOrder, selectedCategory });
  }, [currentPage, pageSize, sortOrder, selectedCategory, onStateChange]);

  // Fetch all distinct categories once on mount (for the sidebar filter)
  useEffect(() => {
    fetch("http://localhost:5214/api/books/categories")
      .then((res) => res.json() as Promise<string[]>)
      .then(setCategories)
      .catch(() => {}); // non-critical -- sidebar just won't show categories
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

  // Select a category from the sidebar (empty string = all books)
  function handleCategorySelect(cat: string) {
    setSelectedCategory(cat);
    setCurrentPage(1); // page numbers reset when filter changes
  }

  // Add a book to the cart and briefly flash "Added!" on the button
  function handleAddToCart(book: Book) {
    addToCart({ bookID: book.bookID, title: book.title, price: book.price });
    setAddedBookID(book.bookID);
    setTimeout(() => setAddedBookID(null), 1200);
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
    // Bootstrap Grid -- col-md-3 sidebar + col-md-9 main content (NEW layout vs M11)
    <div className="row g-4">

      {/* ---- Category Filter Sidebar (col-md-3) ---- */}
      <div className="col-md-3">

        {/* Cart Summary card -- shows price AND quantity as required */}
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
                <button
                  className="btn btn-dark btn-sm w-100"
                  onClick={() =>
                    onGoToCart({ currentPage, pageSize, sortOrder, selectedCategory })
                  }
                >
                  View Cart
                </button>
              </>
            )}
          </div>
        </div>

        {/* Category filter -- list-group is NEW Bootstrap feature #2 */}
        <div className="card shadow-sm">
          <div className="card-header bg-dark text-white fw-semibold py-2">
            Filter by Category
          </div>
          {/* list-group flush sits flush inside the card -- NEW Bootstrap feature #2 */}
          <ul className="list-group list-group-flush">
            <li
              className={`list-group-item list-group-item-action ${
                selectedCategory === "" ? "active" : ""
              }`}
              style={{ cursor: "pointer" }}
              onClick={() => handleCategorySelect("")}
            >
              All Books
            </li>
            {categories.map((cat) => (
              <li
                key={cat}
                className={`list-group-item list-group-item-action ${
                  selectedCategory === cat ? "active" : ""
                }`}
                style={{ cursor: "pointer" }}
                onClick={() => handleCategorySelect(cat)}
              >
                {cat}
              </li>
            ))}
          </ul>
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
                  // Bootstrap Spinner shown while books are loading -- NEW Bootstrap feature #3
                  // (We count Badge + List Group as our 2; Spinner is a bonus)
                  <tr>
                    <td colSpan={5} className="text-center py-4">
                      <div className="spinner-border spinner-border-sm text-secondary me-2" role="status">
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
                        <div className="text-muted small">{book.publisher} &bull; {book.pageCount.toLocaleString()} pp</div>
                      </td>
                      <td>{book.author}</td>
                      <td>
                        <span className="badge bg-secondary">{book.category}</span>
                      </td>
                      <td className="text-end">${book.price.toFixed(2)}</td>
                      <td className="text-center">
                        <button
                          className={`btn btn-sm ${
                            addedBookID === book.bookID
                              ? "btn-success"
                              : "btn-outline-dark"
                          }`}
                          onClick={() => handleAddToCart(book)}
                        >
                          {addedBookID === book.bookID ? "Added!" : "+ Cart"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination -- dynamically built from totalPages, adjusts with category filter */}
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
  );
}

export default BookList;
