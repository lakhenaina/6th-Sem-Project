document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem("adminToken");
  if (!token) {
    alert("You are not authorized");
    window.location.href = "login.html";
    return;
  }

  fetch('http://localhost:3001/admin/orders', {
    headers: {
      Authorization: "Bearer " + token
    }
  })
    .then(res => res.json())
    .then(data => {
      const orders = data.data || [];
      const tbody = document.querySelector('table tbody');
      tbody.innerHTML = "";
      if (orders.length === 0) {
        tbody.innerHTML = "<tr><td colspan='6'>No orders found</td></tr>";
      } else {
        orders.forEach(order => {
          tbody.innerHTML += `
            <tr>
              <td>${order._id}</td>
              <td>${order.user ? order.user.name : "Guest"}</td>
              <td>${order.items.map(i => i.product?.title || 'N/A').join(", ")}</td>
              <td>Rs. ${order.total}</td>
              <td>${order.status}</td>
              <td>
                <button onclick="markComplete('${order._id}')">Mark Complete</button>
              </td>
            </tr>
          `;
        });
      }
    })
    .catch(err => {
      alert("Error loading orders");
      console.error(err);
    });
});

function markComplete(orderId) {
  const token = localStorage.getItem("adminToken");
  if (!token) {
    alert("You are not authorized");
    return;
  }

  fetch(`http://localhost:3001/admin/orders/${orderId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({ status: "Completed" })
  })
    .then(res => res.json())
    .then(() => {
      alert("Order marked complete!");
      location.reload();
    })
    .catch(err => {
      alert("Error updating order status");
      console.error(err);
    });
}
