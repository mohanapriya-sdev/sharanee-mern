import { useEffect, useState } from "react";
import { productApi, categoryApi } from "../../api/endpoints";
import { imageUrl } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { Icon } from "../../components/Icons";
import { COLOR_OPTIONS } from "../../constants/colors";
const OCCASION_OPTIONS = [
  "Daily Wear",
  "Casual",
  "Office Wear",
  "Party Wear",
  "Wedding",
  "Festival",
  "Traditional",
];

const FABRIC_OPTIONS = [
  "Cotton",
  "Silk",
  "Kanchipuram Silk",
  "Soft Silk",
  "Art Silk",
  "Linen",
  "Georgette",
  "Chiffon",
  "Rayon",
  "Satin",
  "Poly Cotton",
];

const SIZE_OPTIONS = [
  "Free Size",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "3XL",
];

const PATTERN_OPTIONS = [
  "Plain",
  "Printed",
  "Floral",
  "Striped",
  "Checked",
  "Embroidered",
  "Woven",
  "Jacquard",
];

const EMPTY = {
  productType: "Inskirts",
  parentProduct: "",
  productName: "",
  description: "",
  category: "",
  price: "",
  discountPrice: "",
  stock: "",
  fabric: "",
  material: "",
  occasion: "",
  pattern: "",
  size: [],
  featured: false,
  colorVariants: [
    {
      colorFamily: "",
      colorName: "",
      colorCode: "",
      images: [],
      sizes: [],
      stock: "",
    },
  ],
};
const MAX_IMAGES = 5;

export default function AdminProducts() {
  const toast = useToast();

  const [products, setProducts] = useState([]);
  const [cats, setCats] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const isPin = form.productType === "Pins";
  const [openColorVariant, setOpenColorVariant] = useState(0);

  // Existing image paths kept for the product being edited
  const [existingImages, setExistingImages] = useState([]);
  // Newly added image files (not yet uploaded)
  const [newFiles, setNewFiles] = useState([]);

  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [sortBy, setSortBy] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 5;

  const load = () =>
    productApi
      .list()
      .then((response) => {
        setProducts(response.data.products || []);
      })
      .catch(() => { });

  useEffect(() => {
    load();

    categoryApi
      .list()
      .then((response) => {
        setCats(response.data.categories || []);
      })
      .catch(() => { });
  }, []);

  const f = (key) => ({
    value: form[key],
    onChange: (event) =>
      setForm((currentForm) => ({
        ...currentForm,
        [key]: event.target.value,
      })),
  });

  const totalImageCount = existingImages.length + newFiles.length;

  const toggleSize = (size) => {
    setForm((currentForm) => {
      const current = Array.isArray(currentForm.size) ? currentForm.size : [];
      const next = current.includes(size)
        ? current.filter((s) => s !== size)
        : [...current, size];
      return { ...currentForm, size: next };
    });
  };

  const addColorVariant = () => {
    setForm((prev) => ({
      ...prev,
      colorVariants: [
        ...prev.colorVariants,
        {
          colorFamily: "",
          colorName: "",
          colorCode: "",
          images: [],
          sizes: [],
          stock: "",
        },
      ],
    }));

    setOpenColorVariant(form.colorVariants.length);
  };

  const removeColorVariant = (index) => {
    setForm((prev) => ({
      ...prev,
      colorVariants: prev.colorVariants.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const updateColorVariant = (
    index,
    field,
    value
  ) => {
    setForm((prev) => {
      const updated = [...prev.colorVariants];

      updated[index][field] = value;

      return {
        ...prev,
        colorVariants: updated,
      };
    });
  };
  const toggleVariantSize = (colorIndex, size) => {
    setForm((prev) => {
      const updated = prev.colorVariants.map((variant, index) => {
        if (index !== colorIndex) return variant;

        const currentSizes = Array.isArray(variant.sizes)
          ? variant.sizes
          : [];

        return {
          ...variant,
          sizes: currentSizes.includes(size)
            ? currentSizes.filter((s) => s !== size)
            : [...currentSizes, size],
        };
      });

      return {
        ...prev,
        colorVariants: updated,
      };
    });
  };

  const openNew = () => {
    setForm(EMPTY);
    setEditing(null);
    setExistingImages([]);
    setNewFiles([]);
    setOpenColorVariant(0);
    setOpen(true);
  };


  const openEdit = (product) => {
    setForm({
      productType: product.productType || "Inskirts",
      parentProduct: product.parentProduct?._id || product.parentProduct || "",
      productName: product.productName || "",
      description: product.description || "",
      category: product.category?._id || product.category || "",
      price: product.price ?? "",
      discountPrice: product.discountPrice ?? "",
      stock: product.stock ?? "",
      fabric: product.fabric || "",
      material: product.material || "",
      occasion: product.occasion || "",
      pattern: product.pattern || "",
      size: Array.isArray(product.size)
        ? product.size
        : product.size
          ? [product.size]
          : [],
      featured: Boolean(product.featured),

      colorVariants:
        product.colorVariants?.length > 0
          ? product.colorVariants.map((variant) => ({
            colorFamily: variant.colorFamily || "",
            colorName: variant.colorName || "",
            colorCode: variant.colorCode || "#000000",
            images: variant.images || [],
            sizes: Array.isArray(variant.sizes) ? variant.sizes : [],
            stock: variant.stock ?? 0,
          }))
          : [
            {

              colorFamily: "",
              colorName: "",
              colorCode: "",
              images: [],
              sizes: [],
              stock: "",
            }
          ],
    });

    setEditing(product._id);
    setExistingImages(
      Array.isArray(product.images) ? product.images : []
    );
    setNewFiles([]);
    setOpenColorVariant(0);
    setOpen(true);
  };
  const addImages = (event) => {
    const picked = Array.from(event.target.files || []);

    console.log("===== PIN IMAGE DEBUG =====");
    console.log("picked:", picked.length);
    console.log("existingImages:", existingImages.length);
    console.log("newFiles:", newFiles.length);
    console.log(
      "TOTAL:",
      existingImages.length + newFiles.length + picked.length
    );

    if (picked.length === 0) {
      event.target.value = "";
      return;
    }

    if (picked.length > 5) {
      toast.error("Maximum 5 images only allowed.");
      event.target.value = "";
      return;
    }

    setNewFiles(picked);

    event.target.value = "";
  };
  const removeNewFile = (index) => {
    setNewFiles((current) => current.filter((_, i) => i !== index));
  };

  const save = async (event) => {
    event.preventDefault();
    if (!isPin) {
      const hasImages = form.colorVariants.some(
        (variant) => variant.images && variant.images.length > 0
      );

      if (!hasImages) {
        toast.error("Please upload at least one image for a color variant.");
        return;
      }

      const missingSize = form.colorVariants.some(
        (variant) =>
          !Array.isArray(variant.sizes) ||
          variant.sizes.length === 0
      );

      if (missingSize) {
        toast.error("Please select at least one size for every color.");
        return;
      }
    } else {
      if (newFiles.length === 0 && existingImages.length === 0) {
        toast.error("Please upload at least one product image.");
        return;
      }
    }
    setBusy(true);

    try {
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        // Skip Inskirts-only fields when adding Pins
        if (
          isPin &&
          (key === "fabric" ||
            key === "pattern" ||
            key === "size" ||
            key === "colorVariants")
        ) {
          return;
        }

        if (key === "size") {
          value.forEach((s) => formData.append("size", s));
        } else if (key === "colorVariants") {
          formData.append(
            "colorVariants",
            JSON.stringify(
              value.map((v) => ({
                colorFamily: v.colorFamily,
                colorName: v.colorName,
                colorCode: v.colorCode,
                sizes: v.sizes || [],
                stock: Number(v.stock || 0),
              }))
            )
          );
        } else if (key === "parentProduct") {
          if (value && value.trim() !== "") {
            formData.append("parentProduct", value);
          }
        } else {
          formData.append(key, value);
        }
      });

      if (!isPin) {
        form.colorVariants.forEach((variant, index) => {
          variant.images.forEach((file) => {
            formData.append(`colorImages_${index}`, file);
          });
        });
      } else {
        newFiles.forEach((file) => {
          formData.append("images", file);
        });
      }

      for (const [key, value] of formData.entries()) {
        console.log(key, value);
      }

      if (editing) {
        formData.append("existingImages", JSON.stringify(existingImages));
      }



      if (editing) {
        await productApi.update(editing, formData);
        toast.success("Product updated.");
      } else {
        await productApi.create(formData);
        toast.success("Product created.");
      }

      setOpen(false);
      setEditing(null);
      setForm(EMPTY);
      setExistingImages([]);
      setNewFiles([]);
      load();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not save product."
      );
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this product?")) return;

    try {
      await productApi.remove(id);
      toast.success("Product deleted.");
      load();
    } catch {
      toast.error("Could not delete.");
    }
  };
  // ================= FILTER + SORT + PAGINATION =================

  let filteredProducts = [...products];

  // Search
  if (search.trim()) {
    filteredProducts = filteredProducts.filter((product) =>
      product.productName
        ?.toLowerCase()
        .includes(search.toLowerCase())
    );
  }

  // Product Type
  if (categoryFilter) {
    filteredProducts = filteredProducts.filter(
      (product) => product.productType === categoryFilter
    );
  }

  // Stock
  if (stockFilter) {
    filteredProducts = filteredProducts.filter(
      (product) => product.stockStatus === stockFilter
    );
  }

  // Sort
  if (sortBy === "low") {
    filteredProducts.sort((a, b) => a.price - b.price);
  }

  if (sortBy === "high") {
    filteredProducts.sort((a, b) => b.price - a.price);
  }

  if (sortBy === "name") {
    filteredProducts.sort((a, b) =>
      a.productName.localeCompare(b.productName)
    );
  }

  // Pagination
  const lastIndex = currentPage * productsPerPage;
  const firstIndex = lastIndex - productsPerPage;

  const currentProducts = filteredProducts.slice(
    firstIndex,
    lastIndex
  );

  const totalPages = Math.ceil(
    filteredProducts.length / productsPerPage
  );
  return (
    <>
      <div className="admin-toolbar">

        <h1>Products</h1>

        <div className="product-toolbar products-toolbar">
          <div className="search-box">



            <input
              type="text"
              placeholder="Search Product..."
              className="toolbar-input"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />

          </div>

          <select
            className="toolbar-select"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Product Type</option>
            <option value="Inskirts">Inskirts</option>
            <option value="Pins">Pins</option>
          </select>

          <select
            className="toolbar-select"
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">Stock Filter</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>

          <select
            className="toolbar-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="">Sort</option>
            <option value="low">Price Low → High</option>
            <option value="high">Price High → Low</option>
            <option value="name">Product Name</option>
          </select>

          <button
            className="btn btn-gold"
            onClick={openNew}
          >
            + Add Product
          </button>

        </div>

      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Product Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>stock</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {currentProducts.map((product) => (
            <tr key={product._id}>
              <td>
                <img
                  src={
                    product.productType === "Pins"
                      ? (
                        product.images?.[0]
                          ? imageUrl(product.images[0])
                          : "https://placehold.co/44x56/efe6d5/3f2317?text=P"
                      )
                      : (
                        product.colorVariants?.[0]?.images?.[0]
                          ? imageUrl(product.colorVariants[0].images[0])
                          : "https://placehold.co/44x56/efe6d5/3f2317?text=S"
                      )
                  }
                  alt={product.productName || "Product"}
                />
              </td>

              <td>{product.productName}</td>

              <td>{product.category?.categoryName || "—"}</td>

              <td>
                Rs. {product.price?.toLocaleString("en-IN")}
              </td>

              <td>{product.stock}</td>

              <td>
                <span
                  className={`tag ${product.stockStatus === "In Stock"
                    ? "tag-green"
                    : product.stockStatus === "Low Stock"
                      ? "tag-orange"
                      : "tag-red"
                    }`}
                >
                  {product.stockStatus}
                </span>
              </td>

              <td style={{ whiteSpace: "nowrap" }}>
                <button
                  className="icon-btn"
                  title="Edit"
                  aria-label="Edit"
                  onClick={() => openEdit(product)}
                >
                  <Icon.Edit size={16} />
                </button>

                <button
                  className="icon-btn danger"
                  title="Delete"
                  aria-label="Delete"
                  onClick={() => remove(product._id)}
                >
                  <Icon.Trash size={16} />
                </button>
              </td>
            </tr>
          ))}

          {products.length === 0 && (
            <tr>
              <td
                colSpan="7"
                style={{ color: "var(--muted)" }}
              >
                No products yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="pagination">

        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          Previous
        </button>

        {Array.from(
          { length: totalPages },
          (_, index) => (
            <button
              key={index}
              className={
                currentPage === index + 1
                  ? "active-page"
                  : ""
              }
              onClick={() =>
                setCurrentPage(index + 1)
              }
            >
              {index + 1}
            </button>
          )
        )}

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          Next
        </button>

      </div>

      {open && (
        <div
          className="modal-back"
          onClick={(event) =>
            event.target === event.currentTarget && setOpen(false)
          }
        >
          <div className="modal">

            <div className="admin-product-modal-header">
              <h2>{editing ? "Edit" : "Add"} Product</h2>

              <button
                type="button"
                className="admin-product-close"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={save}>
              <div className="field">
                <label>Product Type</label>

                <select
                  value={form.productType}
                  onChange={(e) => {
                    const type = e.target.value;

                    setForm((prev) => ({
                      ...prev,
                      productType: type,
                      category: "",
                    }));

                    setExistingImages([]);
                    setNewFiles([]);
                  }}
                >
                  <option value="Inskirts">Inskirts</option>
                  <option value="Pins">Pins</option>
                </select>
              </div>

              <div className="field">
                <label>Product Name</label>
                <input required {...f("productName")} />
              </div>
              {!isPin && (
                <div className="field">
                  <label>Main Product</label>

                  <select
                    value={form.parentProduct}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        parentProduct: e.target.value,
                      }))
                    }
                  >
                    <option value="">Main Product / No Parent</option>

                    {products
                      .filter(
                        (product) =>
                          product.productType === "Inskirts" &&
                          product._id !== editing
                      )
                      .map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.productName}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="field">
                <label>Description</label>
                <textarea rows="3" {...f("description")} />
              </div>

              <div className="form-2col">
                <div className="field">
                  <label>Colors</label>

                  <select required {...f("category")}>
                    <option value="">Select category</option>

                    {cats
                      .filter((category) => category.categoryGroup === form.productType)
                      .map((category) => (
                        <option
                          key={category._id}
                          value={category._id}
                        >
                          {category.categoryName}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="field">
                  <label>Occasion</label>

                  <select required {...f("occasion")}>
                    <option value="">Select occasion</option>

                    {OCCASION_OPTIONS.map((occasion) => (
                      <option key={occasion} value={occasion}>
                        {occasion}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-2col">
                <div className="field">
                  <label>Price (Rs.)</label>

                  <input
                    type="number"
                    min="0"
                    required
                    {...f("price")}
                  />
                </div>

                <div className="field">
                  <label>Discount Price (Rs.)</label>

                  <input
                    type="number"
                    min="0"
                    {...f("discountPrice")}
                  />
                </div>
              </div>

              <div className="form-2col">

                {isPin && (
                  <div className="field">
                    <label>Stock</label>

                    <input
                      type="number"
                      min="0"
                      required
                      {...f("stock")}
                    />
                  </div>
                )}

                {!isPin && (
                  <div className="field">
                    <label>Fabric</label>

                    <select required {...f("fabric")}>
                      <option value="">Select fabric</option>

                      {FABRIC_OPTIONS.map((fabric) => (
                        <option key={fabric} value={fabric}>
                          {fabric}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {!isPin && (
                  <div className="field">
                    <label>Pattern</label>

                    <select required {...f("pattern")}>
                      <option value="">Select pattern</option>

                      {PATTERN_OPTIONS.map((pattern) => (
                        <option key={pattern} value={pattern}>
                          {pattern}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

              </div>
              {isPin && (
                <div className="field">
                  <label>Material</label>

                  <select required {...f("material")}>
                    <option value="">Select Material</option>
                    <option value="Metal">Metal</option>
                    <option value="Brass">Brass</option>
                    <option value="Stainless Steel">Stainless Steel</option>
                    <option value="Alloy">Alloy</option>
                    <option value="Plastic">Plastic</option>
                  </select>
                </div>
              )}
              {isPin && (
                <div className="field">
                  <label>Product Images</label>

                  <label className="upload-box">

                    <Icon.Plus size={28} />

                    <span>Click to Upload Images</span>

                    <small>Maximum 5 Images</small>

                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      hidden
                      onChange={addImages}
                    />

                  </label>
                  {(existingImages.length > 0 || newFiles.length > 0) && (
                    <div className="image-manager">

                      {/* Already saved Pin images */}
                      {existingImages.map((img, index) => (
                        <div className="image-thumb" key={`existing-${index}`}>
                          <img
                            src={imageUrl(img)}
                            alt={`Product ${index + 1}`}
                          />

                          <button
                            type="button"
                            title="Remove image"
                            onClick={() =>
                              setExistingImages((current) =>
                                current.filter((_, i) => i !== index)
                              )
                            }
                          >
                            <Icon.Close size={12} />
                          </button>
                        </div>
                      ))}

                      {/* Newly selected Pin images */}
                      {newFiles.map((file, index) => (
                        <div className="image-thumb" key={`new-${index}`}>
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`New Product ${index + 1}`}
                          />

                          <button
                            type="button"
                            title="Remove image"
                            onClick={() => removeNewFile(index)}
                          >
                            <Icon.Close size={12} />
                          </button>
                        </div>
                      ))}

                    </div>
                  )}
                </div>
              )}
              {/*
              {!isPin && (
                <div className="form-2col">

                  <div className="field">
                    <label>Pattern</label>

                    <select required {...f("pattern")}>
                      <option value="">Select pattern</option>

                      {PATTERN_OPTIONS.map((pattern) => (
                        <option key={pattern} value={pattern}>
                          {pattern}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>
              )}
*/}
              {!isPin && (
                <>
                  <h3 className="section-title">Color Variants</h3>

                  <div className="color-variants-wrapper">

                    {form.colorVariants.map((variant, index) => {
                      const isVariantOpen = openColorVariant === index;

                      return (
                        <div className="color-card" key={index}>

                          {/* COLLAPSED / EXPANDED HEADER */}
                          <button
                            type="button"
                            className="color-card-header"
                            onClick={() =>
                              setOpenColorVariant(
                                isVariantOpen ? -1 : index
                              )
                            }
                          >
                            <span>
                              Color Variant {index + 1}
                              {variant.colorName
                                ? ` — ${variant.colorName}`
                                : ""}
                            </span>

                            <span className="color-card-arrow">
                              {isVariantOpen ? "−" : "+"}
                            </span>
                          </button>

                          {/* ONLY OPEN VARIANT SHOWS FULL CONTENT */}
                          {isVariantOpen && (
                            <div className="color-card-content">

                              {/* YOUR CURRENT COLOR FAMILY FIELD */}
                              <div className="field">
                                <label>Color Family</label>

                                <select
                                  value={variant.colorFamily}
                                  onChange={(e) => {
                                    updateColorVariant(
                                      index,
                                      "colorFamily",
                                      e.target.value
                                    );
                                    updateColorVariant(
                                      index,
                                      "colorName",
                                      ""
                                    );
                                    updateColorVariant(
                                      index,
                                      "colorCode",
                                      ""
                                    );
                                  }}
                                >
                                  <option value="">
                                    Select Family
                                  </option>

                                  {[...new Set(COLOR_OPTIONS.map((c) => c.family))]
                                    .sort((a, b) => a.localeCompare(b))
                                    .map((family) => (
                                      <option key={family} value={family}>
                                        {family}
                                      </option>
                                    ))}
                                </select>
                              </div>

                              {/* BASE COLOR */}
                              <div className="field">
                                <label>Base Color</label>

                                <select
                                  value={variant.colorName}
                                  onChange={(e) => {
                                    const selected = COLOR_OPTIONS.find(
                                      (c) => c.name === e.target.value
                                    );

                                    if (!selected) return;

                                    updateColorVariant(
                                      index,
                                      "colorName",
                                      selected.name
                                    );

                                    updateColorVariant(
                                      index,
                                      "colorCode",
                                      selected.code
                                    );
                                  }}
                                >
                                  <option value="">
                                    Select Base Color
                                  </option>

                                  {COLOR_OPTIONS
                                    .filter((c) => c.family === variant.colorFamily)
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map((color) => (
                                      <option
                                        key={color.name}
                                        value={color.name}
                                      >
                                        {color.name}
                                      </option>
                                    ))}
                                </select>
                              </div>

                              {/* SIZES */}
                              <div className="field">
                                <label>
                                  Available Sizes for{" "}
                                  {variant.colorName ||
                                    `Color ${index + 1}`}
                                </label>

                                <div className="size-check-grid">
                                  {SIZE_OPTIONS.map((size) => (
                                    <label
                                      className="size-check"
                                      key={`${index}-${size}`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={
                                          (variant.sizes || []).includes(size)
                                        }
                                        onChange={() =>
                                          toggleVariantSize(index, size)
                                        }
                                      />
                                      {size}
                                    </label>
                                  ))}
                                </div>
                              </div>

                              {/* STOCK */}
                              <div className="field">
                                <label>
                                  Stock for{" "}
                                  {variant.colorName ||
                                    `Color ${index + 1}`}
                                </label>

                                <input
                                  type="number"
                                  min="0"
                                  required
                                  value={variant.stock ?? ""}
                                  onChange={(e) =>
                                    updateColorVariant(
                                      index,
                                      "stock",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>

                              {/* IMAGE UPLOAD */}
                              <div className="field">
                                <label>
                                  Upload Images (Maximum 5)
                                </label>

                                <label className="upload-box">
                                  <Icon.Plus size={28} />

                                  <span>
                                    Click to Upload Images
                                  </span>

                                  <small>
                                    Maximum 5 images
                                  </small>

                                  <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    hidden
                                    onChange={(e) => {
                                      const files = Array.from(
                                        e.target.files || []
                                      );

                                      const updated = [
                                        ...form.colorVariants,
                                      ];

                                      const currentImages =
                                        updated[index].images || [];

                                      const mergedImages = [
                                        ...currentImages,
                                        ...files,
                                      ];

                                      if (mergedImages.length > 5) {
                                        toast.error(
                                          "You can upload up to 5 images for this color."
                                        );
                                        e.target.value = "";
                                        return;
                                      }

                                      updated[index] = {
                                        ...updated[index],
                                        images: mergedImages,
                                      };

                                      setForm((prev) => ({
                                        ...prev,
                                        colorVariants: updated,
                                      }));

                                      e.target.value = "";
                                    }}
                                  />
                                </label>
                              </div>

                              {/* EXISTING / NEW IMAGES */}
                              {variant.images?.length > 0 && (
                                <div className="image-manager">
                                  {variant.images.map(
                                    (img, imageIndex) => {
                                      const isFile = img instanceof File;

                                      return (
                                        <div
                                          className="image-thumb"
                                          key={`${index}-${imageIndex}`}
                                        >
                                          <img
                                            src={
                                              isFile
                                                ? URL.createObjectURL(img)
                                                : imageUrl(img)
                                            }
                                            alt={`${variant.colorName} ${imageIndex + 1
                                              }`}
                                          />

                                          <button
                                            type="button"
                                            title="Remove image"
                                            aria-label="Remove color image"
                                            onClick={() => {
                                              const updated = [
                                                ...form.colorVariants,
                                              ];

                                              updated[index] = {
                                                ...updated[index],
                                                images:
                                                  updated[index].images.filter(
                                                    (_, i) =>
                                                      i !== imageIndex
                                                  ),
                                              };

                                              setForm((prev) => ({
                                                ...prev,
                                                colorVariants: updated,
                                              }));
                                            }}
                                          >
                                            <Icon.Close size={12} />
                                          </button>
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              )}

                              {/* REMOVE COLOR */}
                              <button
                                type="button"
                                className="remove-color-btn"
                                onClick={() => {
                                  removeColorVariant(index);

                                  setOpenColorVariant((current) => {
                                    if (current === index) return -1;
                                    if (current > index) return current - 1;
                                    return current;
                                  });
                                }}
                              >
                                <Icon.Trash size={16} />
                                Remove Color
                              </button>

                            </div>
                          )}

                        </div>
                      );
                    })}

                    <button
                      type="button"
                      className="btn btn-outline add-color-btn"
                      onClick={addColorVariant}
                    >
                      + Add Color
                    </button>


                  </div>
                </>
              )}

              {!isPin && (
                <div className="field">
                  <label>Size</label>

                  <div className="size-check-grid">
                    {SIZE_OPTIONS.map((size) => (
                      <label className="size-check" key={size}>
                        <input
                          type="checkbox"
                          checked={form.size.includes(size)}
                          onChange={() => toggleSize(size)}
                        />
                        {size}
                      </label>
                    ))}
                  </div>
                </div>
              )}



              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button
                  className="btn btn-gold"
                  disabled={busy}
                >
                  {busy ? "Saving…" : "Save Product"}
                </button>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form >
          </div >
        </div >
      )
      }
    </>
  );
}