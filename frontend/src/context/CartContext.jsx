import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { cartApi, wishlistApi } from "../api/endpoints";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [cartBadge, setCartBadge] = useState(0);
  const [wishlistBadge, setWishlistBadge] = useState(0);
  const refreshCart = useCallback(async () => {
    if (!user) {
      const guestCart = JSON.parse(localStorage.getItem("guestCart") || "[]");
      setCart(guestCart);
      return;
    }
    try {
      const { data } = await cartApi.get(user.id);
      setCart(data.cart || []);
    } catch { setCart([]); }
  }, [user]);

  const refreshWishlist = useCallback(async () => {
    if (!user) { setWishlist([]); return; }
    try {
      const { data } = await wishlistApi.get(user.id);
      setWishlist(data.wishlist || []);
    } catch { setWishlist([]); }
  }, [user]);

  useEffect(() => {
    refreshCart();
    refreshWishlist();
  }, [refreshCart, refreshWishlist]);

  const addToCart = async (
    product,
    qty = 1,
    selectedColor = null,
    selectedSize = null
  ) => {
    // Logged-in user
    if (user) {
      await cartApi.add(
        user.id,
        product._id,
        qty,
        selectedColor,
        selectedSize
      );

      await refreshCart();
      setCartBadge((prev) => prev + qty);
      return;
    }

    // Guest user
    const guestCart = JSON.parse(localStorage.getItem("guestCart") || "[]");

    const existing = guestCart.find(
      (item) =>
        item.product._id === product._id &&
        item.selectedColor === selectedColor &&
        item.selectedSize === selectedSize
    );

    if (existing) {
      existing.quantity += qty;
    } else {
      guestCart.push({
        _id: Date.now().toString(),
        product,
        quantity: qty,
        selectedColor,
        selectedSize,
      });
    }

    localStorage.setItem("guestCart", JSON.stringify(guestCart));

    setCart(guestCart);
    setCartBadge((prev) => prev + qty);
  };


  const updateQty = async (id, qty) => {
    await cartApi.updateQty(id, qty);
    await refreshCart();
  };
  const removeFromCart = async (id) => {
    await cartApi.remove(id);
    await refreshCart();

  };

  const addToWishlist = async (
    productId,
    selectedColor = null,
    selectedCategory = null,
    selectedSize = null
  ) => {
    await wishlistApi.add(
      user.id,
      productId,
      selectedColor,
      selectedCategory,
      selectedSize
    );

    await refreshWishlist();
    setWishlistBadge((prev) => prev + 1);
  };
  const removeFromWishlist = async (id) => {
    await wishlistApi.remove(id);
    await refreshWishlist();

  };
  const clearCartBadge = () => {
    setCartBadge(0);
  };

  const clearWishlistBadge = () => {
    setWishlistBadge(0);
  };
  const cartCount = cart.reduce((n, i) => n + (i.quantity || 0), 0);
  const cartTotal = cart.reduce((sum, i) => {
    const p = i.product;
    if (!p) return sum;

    const price = p.finalPrice || p.price;

    return sum + price * i.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        cartCount,
        cartBadge,
        wishlistBadge,
        cartTotal,
        clearCartBadge,
        clearWishlistBadge,
        addToCart, updateQty, removeFromCart, refreshCart,
        addToWishlist, removeFromWishlist, refreshWishlist,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);