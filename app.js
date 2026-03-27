(function () {
  "use strict";

  const products = [];
  let nextId = 1;

  const formatter = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const productCountEl = document.getElementById("productCount");
  const productForm = document.getElementById("productForm");
  const formErrorEl = document.getElementById("formError");

  const nameInput = document.getElementById("productName");
  const detailInput = document.getElementById("productDetail");
  const priceInput = document.getElementById("productPrice");

  const emptyStateEl = document.getElementById("emptyState");
  const catalogGridEl = document.getElementById("catalogGrid");

  function setFormError(message) {
    if (!message) {
      formErrorEl.hidden = true;
      formErrorEl.textContent = "";
      return;
    }
    formErrorEl.textContent = message;
    formErrorEl.hidden = false;
  }

  function parseCurrencyES(input) {
    // Tolera: "1.234,56", "1234,56", "1,234.56", "1234.56", con o sin "€".
    const s = String(input || "")
      .trim()
      .replace(/\s/g, "")
      .replace(/€/g, "");

    if (!s) return NaN;

    const hasComma = s.includes(",");
    const hasDot = s.includes(".");

    let normalized = s;
    if (hasComma) {
      // "1.234,56" => "1234.56"
      normalized = normalized.replace(/\./g, "");
      normalized = normalized.replace(",", ".");
    } else if (hasDot) {
      // "1,234.56" => "1234.56"
      normalized = normalized.replace(/,/g, "");
      // el '.' queda como decimal
    } else {
      // "1234" (sin separadores)
      normalized = normalized.replace(/,/g, "").replace(/\./g, "");
    }

    const n = Number(normalized);
    return Number.isFinite(n) ? n : NaN;
  }

  function formatPrice(value) {
    if (!Number.isFinite(value)) return "";
    return formatter.format(value);
  }

  function syncPriceDatasetFromInput() {
    const parsed = parseCurrencyES(priceInput.value);
    priceInput.dataset.value = Number.isFinite(parsed) ? String(parsed) : "";
  }

  function resetForm() {
    nameInput.value = "";
    detailInput.value = "";
    priceInput.value = "";
    priceInput.dataset.value = "";
    setFormError("");
    nameInput.focus();
  }

  function renderCatalog() {
    // Reset del estado visual (memoria = "products")
    productCountEl.textContent = String(products.length);
    catalogGridEl.innerHTML = "";

    const isEmpty = products.length === 0;
    emptyStateEl.style.display = isEmpty ? "block" : "none";

    if (isEmpty) return;

    products.forEach((p, index) => {
      const card = document.createElement("article");
      card.className = "productCard product--enter";
      card.style.animationDelay = `${index * 70}ms`;
      card.setAttribute("data-id", String(p.id));

      card.innerHTML = `
        <div class="productTop">
          <h3 class="productName">${escapeHtml(p.name)}</h3>
          <button
            type="button"
            class="iconBtn iconBtn--danger"
            aria-label="Eliminar producto ${escapeHtml(p.name)}"
            title="Eliminar"
            data-action="delete"
            data-id="${String(p.id)}"
          >
            <i class="fa-solid fa-trash" aria-hidden="true"></i>
          </button>
        </div>
        <p class="productDesc">${escapeHtml(p.detail)}</p>
        <div class="productPriceRow">
          <div class="productPrice">${escapeHtml(formatPrice(p.value))}</div>
          <span class="muted" style="font-size:0.85rem; font-weight:700;">
            <i class="fa-solid fa-tags" aria-hidden="true"></i>
          </span>
        </div>
      `;

      catalogGridEl.appendChild(card);
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  productForm.addEventListener("submit", function (e) {
    e.preventDefault();
    setFormError("");

    const name = nameInput.value.trim();
    const detail = detailInput.value.trim();
    const price = parseCurrencyES(priceInput.value);

    if (!name || !detail) {
      setFormError("Por favor completa nombre y detalle (sin campos vacíos).");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setFormError("El valor debe ser un número válido (>= 0).");
      return;
    }

    const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : nextId++;

    products.push({
      id,
      name,
      detail,
      value: price,
    });

    renderCatalog();
    resetForm();
  });

  // Delegate de eliminación
  catalogGridEl.addEventListener("click", function (e) {
    const btn = e.target.closest('button[data-action="delete"]');
    if (!btn) return;

    const id = btn.getAttribute("data-id");
    if (!id) return;

    const before = products.length;
    for (let i = products.length - 1; i >= 0; i--) {
      if (String(products[i].id) === String(id)) products.splice(i, 1);
    }
    if (products.length !== before) renderCatalog();
  });

  // UX: limpiar error mientras el usuario corrige campos
  [nameInput, detailInput, priceInput].forEach((el) => {
    el.addEventListener("input", () => setFormError(""));
  });

  // Formato de precio al salir del campo
  priceInput.addEventListener("input", function () {
    // Mantener dataset para validación más tolerante
    syncPriceDatasetFromInput();
  });

  priceInput.addEventListener("blur", function () {
    const parsed = parseCurrencyES(priceInput.value);
    if (!Number.isFinite(parsed)) {
      priceInput.value = "";
      priceInput.dataset.value = "";
      return;
    }
    if (parsed < 0) {
      setFormError("El valor no puede ser negativo.");
      priceInput.value = "";
      priceInput.dataset.value = "";
      return;
    }
    setFormError("");
    priceInput.value = formatPrice(parsed);
    priceInput.dataset.value = String(parsed);
  });

  // Inicial
  emptyStateEl.style.display = "block";
  renderCatalog();
})();

