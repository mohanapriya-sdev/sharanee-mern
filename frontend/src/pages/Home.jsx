import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { productApi, categoryApi } from "../api/endpoints";
import { imageUrl } from "../api/client";
import ProductCard from "../components/ProductCard";
import { Icon } from "../components/Icons";

const HERO = "/images/inskirts-pins-hero.png";
const CAT_FALLBACK = [
  {
    name: "Cotton Inskirts",
    img: "/images/cotton-inskirt.png",
  },
  {
    name: "Silk Inskirts",
    img: "/images/silk-inskirt.jpeg",
  },
  {
    name: "Mermaid Inskirts",
    img: "/images/mermaid-inskirt.jpg",
  },
  {
    name: "Fish Cut Inskirts",
    img: "/images/fishcut-inskirt.png",
  },
  {
    name: "Bridal Inskirts",
    img: "/images/bridal-inskirt.jpg",
  },
];

const PIN_CATEGORIES = [
  {
    name: "Safety Pins",
    img: "/images/safety-pin.png",
  },
  {
    name: "Pleat Pins",
    img: "/images/pleat-pin.png",
  },
  {
    name: "Pallu Pins",
    img: "/images/pallu-pin.png",
  },
  {
    name: "Decorative Pins",
    img: "/images/decorative-pin.png",
  },
  {
    name: "Brooch Pins",
    img: "/images/brooch-pin.png",
  },
];

const SPLIT1 = "/images/majestic-inskirts.png";

const SPLIT2 = "/images/pins-banner.png";

const TESTIMONIALS = [
  { name: "Sophia Williams", date: "March 11, 2026", text: "Beautiful floral embroidered inskirt with a soft pastel color that gives a very elegant look. The finish and flow feel truly premium." },
  { name: "Grace Turner", date: "December 11, 2025", text: "Absolutely stunning drape with vibrant color and elegant flare. The stitching and fall give it a very royal feel." },
  { name: "Charlotte Davis", date: "September 21, 2025", text: "This piece is absolutely gorgeous with its rich color and refined detailing. It adds a modern, stylish touch." },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [latest, setLatest] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [f, l, c] = await Promise.all([
          productApi.list({ featured: "true" }),
          productApi.list({ sort: "newest" }),
          categoryApi.list(),
        ]);
        setFeatured((f.data.products || []).slice(0, 4));
        setLatest((l.data.products || []).slice(0, 8));
        setCats(c.data.categories || []);
      } catch {
        /* backend offline — sections gracefully empty */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const mostLoved = featured.length ? featured : latest.slice(0, 4);
  const vogue = latest.slice(4, 8);

const COLOR_ORDER = [
  "Yellow",
  "Red",
  "Green",
  "Blue",
  "Pink",
];
const COLOR_IMAGES = {
  Yellow: "/images/yellow.png",
  Red: "/images/red.png",
  Green: "/images/green.png",
  Blue: "/images/blue.png",
  Pink: "/images/pink.png",
};
  const PIN_ORDER = [
    "Safety Pins",
    "Pleat Pins",
    "Pallu Pins",
    "Decorative Pins",
    "Brooch Pins",
  ];

  const makeTile = (category, fallbackList) => ({
    id: category._id,
    name: category.categoryName,
    img: category.categoryImage
      ? imageUrl(category.categoryImage)
      : fallbackList.find(
        (item) => item.name === category.categoryName
      )?.img,
  });

 const colorTiles = COLOR_ORDER.map((color) => ({
  name: color,
  img: COLOR_IMAGES[color],
}));

  /* PINS FROM BACKEND */
  /* PINS */
  const backendPinTiles = cats
    .filter((category) =>
      PIN_ORDER.includes(category.categoryName)
    )
    .sort(
      (a, b) =>
        PIN_ORDER.indexOf(a.categoryName) -
        PIN_ORDER.indexOf(b.categoryName)
    )
    .map((category) => makeTile(category, PIN_CATEGORIES));

  const pinTiles = PIN_ORDER.map((pinName, index) => {
    const backendCategory = cats.find(
      (category) =>
        category.categoryName?.trim().toLowerCase() ===
        pinName.trim().toLowerCase()
    );

    const fallback = PIN_CATEGORIES.find(
      (pin) =>
        pin.name.trim().toLowerCase() ===
        pinName.trim().toLowerCase()
    );

    return {
      id: backendCategory?._id || `pin-${index}`,
      name: backendCategory?.categoryName || pinName,
      img:
        backendCategory?.categoryImage
          ? imageUrl(backendCategory.categoryImage)
          : fallback?.img,
    };
  });


  return (
    <>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          <clipPath id="catArch" clipPathUnits="objectBoundingBox">
            <path d="M0.5,0 C0.62,0.055 0.65,0.090 0.585,0.105 C0.645,0.085 0.725,0.115 0.735,0.18 C0.805,0.17 0.885,0.205 0.885,0.275 C0.945,0.285 1,0.325 1,0.395 L1,1 L0,1 L0,0.395 C0,0.325 0.055,0.285 0.115,0.275 C0.115,0.205 0.195,0.17 0.265,0.18 C0.275,0.115 0.355,0.085 0.415,0.105 C0.35,0.090 0.38,0.055 0.5,0 Z" />
          </clipPath>
        </defs>
      </svg>
      {/* HERO */}
      <section className="hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(63,35,23,0.55), rgba(63,35,23,0.1)), url(${HERO})` }}>
        <div className="container">
          <div className="hero-inner">
            <span className="eyebrow" style={{ color: "var(--gold-pale)" }}>
              Crafted for Complete Elegance
            </span>
            <h1>Begins With Perfect Essentials</h1>
            <p>Smooth, comfortable inskirts and elegant pins—thoughtfully designed to support, secure, and complete your saree look for every celebration.</p>
            <Link to="/shop" className="btn btn-gold">
              Explore <Icon.Arrow />
            </Link>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="feature-row">
          <div className="cell">
            <span className="fi">✦</span>
            <div><h4>Perfect Comfort</h4><p>Smooth and comfortable essentials for every saree look.</p></div>
          </div>
          <div className="cell">
            <span className="fi">✧</span>
            <div><h4>Elegant Details</h4><p>Beautiful finishing touches that complete your saree style.</p></div>
          </div>
          <div className="cell">
            <span className="fi">❉</span>
            <div><h4>Every Occasion</h4><p>Thoughtfully designed essentials for every celebration.</p></div>
          </div>
        </div>
      </div>

      {/* CATEGORIES */}
      <section className="section">
        <div className="container">
          <div className="section-head category-heading">
            <h2>Shop By Colors</h2>

            <div className="section-divider">
              <span>❖ &nbsp; SAREE INSKIRTS &nbsp; ❖</span>
            </div>
          </div>

          <div className="cat-grid">
            {colorTiles.map((c, i) => (
              <Link
               to={`/shop?color=${encodeURIComponent(c.name)}`}
                className="cat-tile"
                key={i}
              >
                <div className="cat-arch-frame">
                  <div className="cat-arch-inner">
                    <img src={c.img} alt={c.name} />
                  </div>
                </div>
                {/* <span>{c.name}</span> */}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SAREE PINS */}
      <section className="section pins-section">
        <div className="container">

          <div className="section-head category-heading">
            <div className="section-divider">
              <span>❖ &nbsp; SAREE PINS &nbsp; ❖</span>
            </div>
          </div>

          <div className="cat-grid">
            {pinTiles.map((pin, i) => (
              <Link
                to={`/shop?group=pins&category=${encodeURIComponent(pin.name)}`}
                className="cat-tile"
                key={pin.id || i}
              >
                <div className="cat-arch-frame">
                  <div className="cat-arch-inner">
                    <img
                      src={pin.img}
                      alt={pin.name}
                    />
                  </div>
                </div>

                {/*  <span>{pin.name}</span>  */}
              </Link>
            ))}
          </div>

        </div>
      </section>


      {/* SPLIT BANNER 1 */}
      <section className="section" style={{ background: "var(--ivory)", paddingTop: 40 }}>
        <div className="container">
          <div className="split">
            <div className="split-media"><img src={SPLIT1} alt="Where moments turn majestic" /></div>
            <div className="split-copy">
              <span className="eyebrow">In Sharanee</span>
              <h2>Where Comfort Meets Confidence</h2>
              <p>Thoughtfully crafted inskirts, designed for a smooth, comfortable fit beneath every saree.</p>
              <Link to="/shop?group=inskirts" className="btn btn-gold">
                Explore Now <Icon.Arrow />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* MOST LOVED 
      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Bestsellers</span>
            <h2>Most Loved Styles</h2>
            <p>Signature creations shaped by heritage, refined for the contemporary muse.</p>
          </div>
          {loading ? <div className="spinner" /> : (
            <div className="grid-cards">
              {mostLoved.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          )}
          {!loading && mostLoved.length === 0 && (
            <p style={{ textAlign: "center", color: "var(--muted)" }}>
              No products yet — add some from the admin panel.
            </p>
          )}
        </div>
      </section> */}

      {/* SPLIT BANNER 2 */}
      <section className="section" style={{ background: "var(--ivory)" }}>
        <div className="container">
          <div className="split rev">
            <div className="split-media"><img src={SPLIT2} alt="Timeless Banarasi elegance" /></div>
            <div className="split-copy">
              <span className="eyebrow">Saree Pins Collection</span>
              <h2>Elegant Details, Timeless Charm</h2>
              <p>Discover beautifully crafted saree and pallu pins, designed to add the perfect finishing touch and elevate every wedding and festive look.</p>
              <Link to="/shop?group=pins" className="btn">
                Discover More <Icon.Arrow />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CURRENTLY IN VOGUE 
      {vogue.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-head">
              <span className="eyebrow">New Arrivals</span>
              <h2>Currently in Vogue</h2>
              <p>Contemporary designs redefining modern Indian elegance, crafted for every special occasion.</p>
            </div>
            <div className="grid-cards">
              {vogue.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      */}

      {/* TESTIMONIALS */}
      <section className="section" style={{ background: "var(--ivory)" }}>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Testimonials</span>
            <h2>What Our Customers Say</h2>
            <p>Experiences shared by those who chose timeless craftsmanship and refined style.</p>
          </div>
          <div className="testi-grid">
            {TESTIMONIALS.map((t, i) => (
              <div className="testi" key={i}>
                <div className="testi-top">
                  <div className="testi-name">{t.name}<small>{t.date}</small></div>
                  <div className="testi-stars">
                    {[...Array(5)].map((_, s) => <Icon.Star key={s} fill />)}
                  </div>
                </div>
                <p>"{t.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}