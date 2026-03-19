import { useState } from "react";
import { CartProvider, useCart } from "./context/CartContext";
import BookList from "./components/BookList";
import CartPage from "./components/CartPage";

// Type declaration for Bootstrap JS loaded via CDN
declare const bootstrap: {
  Offcanvas: {
    getInstance(el: HTMLElement): { hide(): void } | null;
  };
};

// BookListState -- full view state saved so "Continue Shopping" restores it exactly
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

// CartOffcanvas -- NEW Bootstrap feature #1: Offcanvas sliding cart drawer
// Slides in from the right when the cart button in the navbar is clicked.
// Requires Bootstrap JS (loaded via CDN in index.html).
function CartOffcanvas({ onViewFullCart }: { onViewFullCart: () => void }) {
  const { items, updateQuantity, removeFromCart, totalPrice, totalItems } =
    useCart();

  // Close the offcanvas programmatically, then navigate to the full cart page
  function handleViewFullCart() {
    const el = document.getElementById("cartDrawer");
    if (el) {
      bootstrap.Offcanvas.getInstance(el)?.hide();
    }
    onViewFullCart();
  }

  return (
    // Offcanvas panel -- slides in from the end (right side) of the screen
    <div
      className="offcanvas offcanvas-end"
      tabIndex={-1}
      id="cartDrawer"
      aria-labelledby="cartDrawerLabel"
      style={{ width: "380px" }}
    >
      {/* Offcanvas header */}
      <div className="offcanvas-header bg-dark text-white border-bottom">
        <h5 className="offcanvas-title" id="cartDrawerLabel">
          🛒 Your Cart
          {totalItems > 0 && (
            <span className="badge bg-danger ms-2">{totalItems}</span>
          )}
        </h5>
        <button
          type="button"
          className="btn-close btn-close-white"
          data-bs-dismiss="offcanvas"
          aria-label="Close"
        />
      </div>

      {/* Offcanvas body -- cart items or empty message */}
      <div className="offcanvas-body p-3">
        {items.length === 0 ? (
          <p className="text-muted text-center mt-4">Your cart is empty.</p>
        ) : (
          <>
            {/* One row per cart item */}
            {items.map((item) => (
              <div
                key={item.bookID}
                className="d-flex align-items-start gap-2 mb-3 pb-3 border-bottom"
              >
                {/* Title and unit price */}
                <div className="flex-grow-1">
                  <div className="fw-medium small">{item.title}</div>
                  <div className="text-muted small">
                    ${item.price.toFixed(2)} &times; {item.quantity} ={" "}
                    <strong>${(item.price * item.quantity).toFixed(2)}</strong>
                  </div>
                </div>

                {/* Quantity controls and remove */}
                <div className="d-flex align-items-center gap-1">
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() =>
                      updateQuantity(item.bookID, item.quantity - 1)
                    }
                    disabled={item.quantity <= 1}
                  >
                    &minus;
                  </button>
                  <span className="px-1">{item.quantity}</span>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() =>
                      updateQuantity(item.bookID, item.quantity + 1)
                    }
                  >
                    +
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm ms-1"
                    onClick={() => removeFromCart(item.bookID)}
                    title="Remove"
                  >
                    &times;
                  </button>
                </div>
              </div>
            ))}

            {/* Grand total */}
            <div className="d-flex justify-content-between fw-bold fs-6 mb-3">
              <span>Total</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>

            {/* Navigate to the full cart page */}
            <button
              className="btn btn-dark w-100"
              onClick={handleViewFullCart}
            >
              View Full Cart &rarr;
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// NavBar -- cart button opens the Offcanvas drawer via Bootstrap data attributes
function NavBar({
  view,
  onContinueShopping,
}: {
  view: "books" | "cart";
  onContinueShopping: () => void;
}) {
  const { totalItems } = useCart();

  return (
    <nav className="navbar navbar-dark bg-dark">
      <div className="container">
        {/* Brand */}
        <span className="navbar-brand fw-semibold">📚 Bookstore</span>

        {/* On the cart page show "Continue Shopping"; on book list open the offcanvas */}
        {view === "cart" ? (
          <button
            className="btn btn-outline-light btn-sm"
            onClick={onContinueShopping}
          >
            &larr; Continue Shopping
          </button>
        ) : (
          // data-bs-toggle / data-bs-target open the Offcanvas without any JS call
          <button
            className="btn btn-outline-light btn-sm position-relative"
            data-bs-toggle="offcanvas"
            data-bs-target="#cartDrawer"
            aria-controls="cartDrawer"
          >
            🛒 Cart
            {/* Item count badge on the navbar button */}
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

// Inner app -- manages which view is shown and saves book list state
function AppInner() {
  let [view, setView] = useState<"books" | "cart">("books");
  // Always-current book list state -- updated by BookList's onStateChange callback
  let [bookListState, setBookListState] =
    useState<BookListState>(DEFAULT_STATE);

  // Navigate to full cart page
  function goToCart() {
    setView("cart");
  }

  function continueShopping() {
    setView("books");
  }

  return (
    <>
      <NavBar view={view} onContinueShopping={continueShopping} />

      {/* Offcanvas is always in the DOM so Bootstrap can find it via data-bs-target */}
      <CartOffcanvas onViewFullCart={goToCart} />

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
