// Applies the saved or OS theme before the first paint, without inline script (CSP).
;(function () {
  var saved = localStorage.getItem("thailand-address-demo:theme")
  var dark = saved ? saved === "dark" : matchMedia("(prefers-color-scheme: dark)").matches
  document.documentElement.classList.toggle("dark", dark)
})()
