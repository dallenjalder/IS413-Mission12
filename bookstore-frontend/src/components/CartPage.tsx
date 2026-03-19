import { useCart } from "../context/CartContext";

interface CartPageProps {
  onContinueShopping: () => void; // Goes back to the page the user was on
}

// CartPage -- shows each item in the cart with quantity controls, subtotals, and total
function CartPage({ onContinueShopping }: CartPageProps) {
  const { items, updateQuantity, removeFromCart, totalItems, totalPrice } = useCart();

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="text-center py-5">
        <p className="text-muted fs-5 mb-3">Your cart is empty.</p>
        <button className="btn btn-dark" onClick={onContinueShopping}>
          &larr; Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="row justify-content-center">
      <div className="col-lg-9">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h4 fw-bold mb-0">Your Cart</h2>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={onContinueShopping}
          >
            &larr; Continue Shopping
          </button>
        </div>

        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-dark">
                <tr>
                  <th>Book</th>
                  <th className="text-end">Price</th>
                  <th className="text-center">Quantity</th>
                  <th className="text-end">Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.bookID}>
                    {/* Book title */}
                    <td className="fw-medium">{item.title}</td>

                    {/* Unit price */}
                    <td className="text-end">${item.price.toFixed(2)}</td>

                    {/* Quantity +/- controls */}
                    <td className="text-center">
                      <div className="d-flex align-items-center justify-content-center gap-1">
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() =>
                            updateQuantity(item.bookID, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                        >
                          &minus;
                        </button>
                        <span className="px-2">{item.quantity}</span>
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() =>
                            updateQuantity(item.bookID, item.quantity + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* Line subtotal */}
                    <td className="text-end fw-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </td>

                    {/* Remove button */}
                    <td className="text-center">
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => removeFromCart(item.bookID)}
                        title="Remove from cart"
                      >
                        &times;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Cart totals footer row */}
              <tfoot className="table-light">
                <tr>
                  <td colSpan={2} className="text-muted small">
                    {totalItems} item{totalItems !== 1 ? "s" : ""} in cart
                  </td>
                  <td className="text-center fw-bold">Total</td>
                  <td className="text-end fw-bold fs-5">
                    ${totalPrice.toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
