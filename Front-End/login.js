const email = document.getElementById("email");
const password = document.getElementById("password");
const responseMessage = document.getElementById("responseMessage");


async function login(event) {
    event.preventDefault();

    // Reset messages
    responseMessage.textContent = '';

    const emailValue = email.value.trim();
    const passwordValue = password.value.trim();

    const formData = {
        email: emailValue,
        password: passwordValue
    };

    try {
        const response = await fetch('http://localhost:3001/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorText = await response.json();
            responseMessage.textContent = errorText.message;
            return;
        }

        const data = await response.json();
        responseMessage.textContent = data.message;

        email.value = '';
        password.value = '';

        // Create an <a> tag and simulate click
        const link = document.createElement("a");
        link.href = "/admin-dashboard.html";
        link.click();


    } catch (error) {
        console.error('Error:', error);
        responseMessage.textContent = 'Oops!! Something Went Wrong!';
    }
    function logout() {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
}
}
