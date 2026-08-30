function avisoLogin() {
  const div = document.createElement("div");
  div.innerText = "Precisa iniciar sessão!";
  div.style.position = "fixed";
  div.style.top = "20px";
  div.style.right = "20px";
  div.style.background = "red";
  div.style.color = "#fff";
  div.style.padding = "10px";
  div.style.borderRadius = "5px";
  document.body.appendChild(div);

  setTimeout(() => {
    window.location.href = "auth.html";
  }, 1500);
}

function protegerPagina() {
  const token = localStorage.getItem("token");

  if (!token) {
    avisoLogin();
  }
}

function getToken() {
  return localStorage.getItem("token");
}