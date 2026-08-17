import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { productApi } from "../api/endpoints";
import { imageUrl } from "../api/client";
import { Icon } from "./Icons";


export default function SearchOverlay({ onClose }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
    const esc = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Live preview (debounced)
  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(() => {
      productApi.list({ search: q.trim() })
        .then((r) => setResults((r.data.products || []).slice(0, 5)))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  // Submitting only ever routes to the shop page with the query


  return (
    <div
      className="search-overlay"
      onMouseDown={(e) =>
        e.target === e.currentTarget && onClose()
      }
    >
      <div className="search-panel">

        {/* CLOSE BUTTON */}
        <button
          className="search-x"
          onClick={onClose}
          aria-label="Close search"
        >
          <Icon.Close size={22} />
        </button>

        <span className="search-eyebrow">
          Search Sharanee
        </span>


        <form
          className="search-box"
          onSubmit={(e) => e.preventDefault()}
        >
          <Icon.Search size={22} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search for products, categories, fabric, color..."
            aria-label="Search products"
          />
          {q && <button type="button" className="search-clear" onClick={() => setQ("")}><Icon.Close size={18} /></button>}
        </form>


        {q && (
          <div className="search-results">
            {loading && <div className="spinner" style={{ margin: "24px auto" }} />}
            {!loading && results.length === 0 && (
              <p className="search-none">
                No products found for “{q}”.
              </p>
            )}
            {!loading && results.map((p) => (
              <button key={p._id} className="search-hit" onClick={() => { navigate(`/product/${p._id}`); onClose(); }}>
                <img
                  src={
                    p.colorVariants?.[0]?.images?.[0]
                      ? imageUrl(p.colorVariants[0].images[0])
                      : p.images?.[0]
                        ? imageUrl(p.images[0])
                        : "https://placehold.co/60x76/efe6d5/3f2317?text=S"
                  }
                  alt={p.productName}
                />
                <div>
                  <b>{p.productName}</b>
                  <small>{p.category?.categoryName || p.occasion || "Sharanee"}</small>
                </div>
                <span className="price">Rs. {(p.discountPrice > 0 ? p.discountPrice : p.price)?.toLocaleString("en-IN")}</span>
              </button>
            ))}

          </div>
        )}
      </div>
    </div>
  );
}
