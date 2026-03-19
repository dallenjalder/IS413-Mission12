import { createContext, useContext, useState } from "react";

// Shape of a single item in the cart
export interface CartItem {
  bookID: number;
  title: string;
  price: number;
  quantity: number;
}

// Shape of the context value exposed to consumers
interface CartContextType {
  items: CartItem[];
  addToCart: (book: { bookID: number; title: string; price: number }) => void;
  updateQuantity: (bookID: number, quantity: number) => void;
  removeFromCart: (bookID: number) => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | null>(null);

// Load cart from localStorage so it persists for the duration of the session
function loadCart(): CartItem[] {
  try {
    const stored = localStorage.getItem("bookstore-cart");
    return stored ? (JSON.parse(stored) as CartItem[]) : [];
  } catch {
    return [];
  }
}

// Save cart to localStorage whenever it changes
function saveCart(items: CartItem[]) {
  localStorage.setItem("bookstore-cart", JSON.stringify(items));
}

// CartProvider -- wraps the app and gives all children access to cart state
export function CartProvider({ children }: { children: React.ReactNode }) {
  let [items, setItems] = useState<CartItem[]>(loadCart);

  // Helper that updates state AND persists to localStorage
  function updateItems(next: CartItem[]) {
    setItems(next);
    saveCart(next);
  }

  // Add a book to the cart -- increments quantity if it already exists
  function addToCart(book: { bookID: number; title: string; price: number }) {
    const existing = items.find((i) => i.bookID === book.bookID);
    if (existing) {
      updateItems(
        items.map((i) =>
          i.bookID === book.bookID ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      updateItems([...items, { ...book, quantity: 1 }]);
    }
  }

  // Set a specific quantity for a cart item
  function updateQuantity(bookID: number, quantity: number) {
    if (quantity < 1) return;
    updateItems(items.map((i) => (i.bookID === bookID ? { ...i, quantity } : i)));
  }

  // Remove a book from the cart entirely
  function removeFromCart(bookID: number) {
    updateItems(items.filter((i) => i.bookID !== bookID));
  }

  // Derived values
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, updateQuantity, removeFromCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Custom hook -- components call useCart() instead of useContext(CartContext) directly
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
