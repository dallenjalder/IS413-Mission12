import { useState } from "react";
import { CartProvider, useCart } from "./context/CartContext";
import BookList from "./components/BookList";
import CartPage from "./components/CartPage";

// BookListState -- the full view state we save so "Continue Shopping" restores it exactly
export interface BookListState {
  currentPage: number;
  pageSize: number;
  sortOrder: "asc" | "desc";
  selectedCategory: string;
}

const DEFAULT_STATE: BookListState = {
  currentPage: 1,
  pageSize: 5,
  sortOrder: "asc",
  selectedCategory: "",
};

// NavBar -- rendered inside CartProvider so it can read cart state
function NavBar({
  view,
  onGoToCart,
  onContinueShopping,
}: {
  view: "books" | "cart";
  onGoToCart: () => void;
  onContinueShopping: () => void;
}) {
  const { totalItems } = useCart();

  return (
    <nav className="navbar navbar-dark bg-dark">
      <div className="container">
        {/* Brand */}
        <span className="navbar-brand fw-semibold">📚 Bookstore</span>

        {/* Cart / Continue Shopping button -- Badge is NEW Bootstrap feature #1 */}
        {view === "cart" ? (
          <button
            className="btn btn-outline-light btn-sm"
            onClick={onContinueShopping}
          >
            &larr; Continue Shopping
          </button>
        ) : (
          <button
            className="btn btn-outline-light btn-sm position-relative"
            onClick={onGoToCart}
          >
            🛒 Cart
            {/* Badge shows item count -- NEW Bootstrap feature #1 */}
            {totalItems > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {totalItems}
                <span className="visually-hidden">items in cart</span>
              </span>
            )}
          </button>
        )}
      </div>
    </nav>
  );
}

// Inner app -- uses the cart context, handles view switching
function AppInner() {
  let [view, setView] = useState<"books" | "cart">("books");
  // Saved book list state so "Continue Shopping" returns to exact position
  let [bookListState, setBookListState] = useState<BookListState>(DEFAULT_STATE);

  function goToCart(savedState: BookListState) {
    setBookListState(savedState);
    setView("cart");
  }

  function continueShopping() {
    setView("books");
  }

  return (
    <>
      <NavBar
        view={view}
        onGoToCart={() => goToCart(bookListState)}
        onContinueShopping={continueShopping}
      />

      <div className="container my-4">
        {view === "books" ? (
          <>
            <div className="mb-3">
              <h1 className="h3 fw-bold mb-1">Browse Books</h1>
              <p className="text-muted mb-0">
                Filter by category, sort by title, or adjust results per page.
              </p>
            </div>
            <BookList
              initialState={bookListState}
              onStateChange={setBookListState}
              onGoToCart={goToCart}
            />
          </>
        ) : (
          <CartPage onContinueShopping={continueShopping} />
        )}
      </div>
    </>
  );
}

// App -- wraps everything in CartProvider so all components share cart state
function App() {
  return (
    <CartProvider>
      <AppInner />
    </CartProvider>
  );
}

export default App;
