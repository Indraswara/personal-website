document.addEventListener("DOMContentLoaded", function () {
  function validateEmpty(inputElement, errorElement) {
    inputElement.addEventListener("change", function () {
      if (inputElement.value.trim() !== "") {
        errorElement.classList.add("display-none");
      }
    });
  }
  const loginForm = document.getElementById("loginForm");

  const emailInput = document.getElementById("auth-email");
  const passwordInput = document.getElementById("auth-password");
  const errorEmail = document.getElementById("error-email");
  const errorPassword = document.getElementById("error-password");

  validateEmpty(emailInput, errorEmail);
  validateEmpty(passwordInput, errorPassword);

  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();
    let isValid = true;
    const formData = new FormData(loginForm);
    const formObject = {};
    formData.forEach((value, key) => {
      formObject[key] = value;
    });

    if (formObject["email"].trim() == "") {
      errorEmail.classList.remove("display-none");
      isValid = false;
    } else {
      errorEmail.classList.add("display-none");
    }

    if (formObject["password"].trim() == "") {
      errorPassword.classList.remove("display-none");
      isValid = false;
    } else {
      errorPassword.classList.add("display-none");
    }

    if (isValid) {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/login", true);
      xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

      // Prepare data to send
      const formDataParam = new URLSearchParams();
      formDataParam.append("email", formObject["email"]);
      formDataParam.append("password", formObject["password"]);

      xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          const response = JSON.parse(xhr.responseText);
          if (response.status === "success") {
            window.location.href = "/";
          } else {
            if (response.data === "Email or password wrong") {
              const errorToast = document.getElementById("error-toast");
              const errorMessage = document.getElementById(
                "error-message-content"
              );
              if (errorToast) {
                errorMessage.innerText = response.data;
                errorToast.classList.add("show-initial"); // Ensure it slides in properly
                errorToast.classList.remove("hide"); // Ensure it's visible
                setTimeout(() => {
                  errorToast.classList.add("hide");
                }, 5000);
              }
            }
          }
        }
      };

      xhr.send(formDataParam.toString());
    } else {
    }
  });
});
