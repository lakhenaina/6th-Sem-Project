document.addEventListener('DOMContentLoaded', () => {
  loadProducts();

  document.querySelectorAll(".dropdown-content a").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const category = link.textContent.trim();
      loadProducts(category);
    });
  });
});

function loadProducts(category = "All") {
  fetch("http://localhost:3001/products")
    .then((res) => res.json())
    .then((data) => {
      const products = data.data;  // <-- FIXED
      const grid = document.getElementById("products-grid");
      grid.innerHTML = "";

      const filtered = products.filter(product => {
        if (category === "All") return true;
        return product.category?.toLowerCase().replace(/\s+/g, '') === category.toLowerCase().replace(/\s+/g, '');
      });

      if (filtered.length === 0) {
        grid.innerHTML = "<p>No products found in this category.</p>";
        return;
      }

      filtered.forEach((product) => {
        const card = document.createElement("a");
        card.href = `product_detail.html?id=${product._id}`;
        card.style.textDecoration = "none";
        card.style.color = "inherit";
        card.innerHTML = `
          <div class="product-card">
            <div class="image-container" style="position: relative;">
              <img src="${product.imageUrl}" alt="${product.title}">
              <button class="cart-icon" onclick="event.stopPropagation(); event.preventDefault(); addToCart('${product._id}')" style="position: absolute; top: 8px; right: 8px;">🛒</button>
            </div>
            <h3>${product.title}</h3>
            <p>${product.description || ""}</p>
            <strong>Rs. ${product.price}</strong>
          </div>
        `;
        grid.appendChild(card);
      });
    })
    .catch((err) => {
      console.error("Error fetching products", err);
      document.getElementById("products-grid").innerHTML = "<p>Failed to load products.</p>";
    });
}

function addToCart(productId) {
  const token = localStorage.getItem("userToken");
  if (!token) {
    window.location.href = "login.html";
    return;
  }
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const existingItem = cart.find(item => item.productId === productId || item === productId);
  if(existingItem){
    if(typeof existingItem === 'string'){
      const index = cart.indexOf(existingItem);
      cart[index] = { productId: productId, quantity: 2 };
    } else {
      existingItem.quantity = (existingItem.quantity || 1) + 1;
    }
  } else {
    cart.push({ productId: productId, quantity: 1 });
  }
  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Added to cart!");
}
