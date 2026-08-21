document.addEventListener("DOMContentLoaded", function () {
  function validateEmpty(inputElement, errorElement) {
    inputElement.addEventListener("change", function () {
      if (inputElement.value.trim() !== "") {
        errorElement.classList.add("display-none");
      }
    });
  }
  const registerForm = document.getElementById("registerForm");

  const roleSelect = document.getElementById("auth-role");
  const nameInput = document.getElementById("auth-name");
  const emailInput = document.getElementById("auth-email");
  const passwordInput = document.getElementById("auth-password");
  const confirmPasswordInput = document.getElementById("auth-confirm-password");
  const locationInput = document.getElementById("location-fields");
  const aboutInput = document.getElementById("about-fields");
  const locationInputs = document.getElementById("auth-location");
  const aboutInputs = document.getElementById("auth-about");

  const errorRole = document.getElementById("error-role");
  const errorName = document.getElementById("error-name");
  const errorEmail = document.getElementById("error-email");
  const errorEmailUsed = document.getElementById("error-email-used");
  const errorPassword = document.getElementById("error-password");
  const errorPassword2 = document.getElementById("error-password-2");
  const errorConfirmPassword = document.getElementById(
    "error-confirm-password"
  );
  const errorLocation = document.getElementById("error-location");
  const errorAbout = document.getElementById("error-about");

  roleSelect.addEventListener("change", function () {
    if (roleSelect.value != "") {
      errorRole.classList.add("display-none");
    } else {
      isValid = false;
      errorRole.classList.remove("display-none");
    }
    if (roleSelect.value === "company") {
      locationInput.classList.remove("display-none");
      aboutInput.classList.remove("display-none");
      errorName.classList.add("display-none");
      errorEmail.classList.add("display-none");
      errorPassword.classList.add("display-none");
      errorPassword2.classList.add("display-none");
    } else {
      errorName.classList.add("display-none");
      errorEmail.classList.add("display-none");
      errorPassword.classList.add("display-none");
      errorPassword2.classList.add("display-none");
      locationInput.classList.add("display-none");
      aboutInput.classList.add("display-none");
    }
  });

  validateEmpty(nameInput, errorName);
  validateEmpty(emailInput, errorEmail);
  validateEmpty(passwordInput, errorPassword);
  validateEmpty(confirmPasswordInput, errorPassword2);
  validateEmpty(locationInputs, errorLocation);
  validateEmpty(aboutInputs, errorAbout);

  registerForm.addEventListener("submit", function (event) {
    let isValid = true;
    event.preventDefault();
    const formData = new FormData(registerForm);
    const formObject = {};
    formData.forEach((value, key) => {
      formObject[key] = value;
    });
    if (formObject["role"] == null) {
      isValid = false;
      errorRole.classList.remove("display-none");
    } else {
      errorRole.classList.add("display-none");
    }
    if (formObject["name"].trim() == "") {
      isValid = false;
      errorName.classList.remove("display-none");
    }
    if (formObject["email"].trim() == "") {
      isValid = false;
      errorEmail.classList.remove("display-none");
    }
    if (formObject["password"].trim() == "") {
      isValid = false;
      errorPassword.classList.remove("display-none");
    }
    if (formObject["confirm-password"].trim() == "") {
      isValid = false;
      errorPassword2.classList.remove("display-none");
    }
    if (formObject["confirm-password"] !== formObject["password"]) {
      isValid = false;
      errorConfirmPassword.classList.remove("display-none");
    } else {
      errorConfirmPassword.classList.add("display-none");
    }
    if (formObject["role"] == "company") {
      if (formObject["location"].trim() == "") {
        isValid = false;

        errorLocation.classList.remove("display-none");
      }
      if (formObject["about"].trim() == "") {
        isValid = false;

        errorAbout.classList.remove("display-none");
      }
    }

    if (isValid) {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/register", true);
      xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

      // Prepare data to send
      const formDataParam = new URLSearchParams();
      formDataParam.append("role", formObject["role"]);
      formDataParam.append("name", formObject["name"]);
      formDataParam.append("email", formObject["email"]);
      formDataParam.append("password", formObject["password"]);
      formDataParam.append("location", formObject["location"]);
      formDataParam.append("about", formObject["about"]);

      xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          const response = JSON.parse(xhr.responseText);

          if (response.status === "success") {
            errorEmailUsed.classList.add("display-none");
            window.location.href = "/login";
          } else {
            if (response.data === "The email has been used") {
              errorEmailUsed.classList.remove("display-none");
            }
          }
        }
      };

      xhr.send(formDataParam.toString());
    }
  });
});
