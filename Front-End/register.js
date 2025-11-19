const fullName = document.getElementById("fullName");
const email = document.getElementById("email");
const password = document.getElementById("password");
const phoneNumber = document.getElementById("phoneNumber");
const responseMessage = document.getElementById("responseMessage");

async function register(event) {
    event.preventDefault();

    // Reset messages
    responseMessage.textContent = '';

    const fullNameValue = fullName.value.trim();
    const emailValue = email.value.trim();
    const passwordValue = password.value.trim();
    const phoneNumberValue = phoneNumber.value.trim();

    const formData = {
        name: fullNameValue,
        email: emailValue,
        password: passwordValue,
        phoneNumber: Number(phoneNumberValue)
    };

    try {
        const response = await fetch('http://localhost:3001/register', {
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

        fullName.value = '';
        email.value = '';
        password.value = '';
        phoneNumber.value = '';

        // Create an <a> tag and simulate click
        const link = document.createElement("a");
        link.href = "/index.html";
        link.click();

    } catch (error) {
        console.error('Error:', error);
        responseMessage.textContent = 'Oops!! Something went wrong';
    }
}