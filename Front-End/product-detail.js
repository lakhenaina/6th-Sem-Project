document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  if (!productId) {
    document.body.innerHTML = "<h2>Product not found.</h2>";
    return;
  }

  try {
    const res = await fetch(`http://localhost:3001/products/${productId}`);
    const data = await res.json();
    const product = data.data;

    const container = document.getElementById("product-detail");
    container.innerHTML = `
      <img src="${product.imageUrl}" alt="${product.title}">
      <h2>${product.title}</h2>
      <p>${product.description}</p>
      <p>Price: Rs ${product.price}</p>
      <button id="add-to-cart">Add to Cart</button>
    `;

    // add to cart
    document.getElementById("add-to-cart").addEventListener("click", () => {
      const isLoggedIn = localStorage.getItem("token");
      if (!isLoggedIn) {
        alert("You must login first to add to cart.");
        window.location.href = "login.html";
        return;
      }

      let cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const existingItem = cart.find((item) => item.productId === product._id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({ productId: product._id, quantity: 1 });
      }
      localStorage.setItem("cart", JSON.stringify(cart));
      alert("Added to cart!");
    });

  } catch (err) {
    console.error(err);
    document.body.innerHTML = "<h2>Error loading product.</h2>";
  }
});
