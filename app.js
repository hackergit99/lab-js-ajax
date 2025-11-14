/* app.js — Lógica JS y AJAX (200/404 + fallback CORS para file://) */

/* Utilidades */
const $ = (sel) => document.querySelector(sel);
const appendLi = (ul, text) => {
  const li = document.createElement('li');
  li.textContent = text;
  ul.appendChild(li);
};

/* ===================
 *  Ejercicios JS
 * =================== */

// Palíndromo
$("#pal-check").addEventListener("click", () => {
  const raw = $("#pal-input").value || "";
  const norm = raw
    .toLowerCase()
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]/gi, "");
  const esPal = norm === [...norm].reverse().join("");
  $("#pal-result").textContent = raw.length
    ? (esPal ? "Es palíndromo" : "No es palíndromo")
    : "Escribe un texto para evaluar.";
});

// Mayor de dos números
$("#num-check").addEventListener("click", () => {
  const a = Number($("#num-a").value);
  const b = Number($("#num-b").value);
  if (Number.isNaN(a) || Number.isNaN(b)) {
    $("#num-result").textContent = "Ingresa ambos números.";
    return;
  }
  if (a === b) $("#num-result").textContent = `Son iguales (${a}).`;
  else $("#num-result").textContent = `El mayor es ${a > b ? a : b}.`;
});

// Vocales presentes
$("#voc-check").addEventListener("click", () => {
  const frase = ($("#voc-frase").value || "").toLowerCase();
  if (!frase) { $("#voc-result").textContent = "Escribe una frase."; return; }
  const set = new Set([...frase].filter(c => "aeiouáéíóú".includes(c)));
  $("#voc-result").textContent = set.size
    ? "Vocales presentes: " + [...set].join(", ")
    : "No se encontraron vocales.";
});

// Conteo de vocales
$("#cont-check").addEventListener("click", () => {
  const frase = ($("#cont-frase").value || "").toLowerCase();
  if (!frase) { $("#cont-result").textContent = "Escribe una frase."; return; }
  const mapa = { a:0, e:0, i:0, o:0, u:0 };
  for (const ch of frase.normalize("NFD").replace(/\p{Diacritic}/gu, "")) {
    if (ch in mapa) mapa[ch]++;
  }
  $("#cont-result").textContent = JSON.stringify(mapa, null, 2);
});

/* ===================
 *  AJAX con XHR (200/404)
 * =================== */

const estados = {
  0: "No iniciada",
  1: "Cargando (opened)",
  2: "Cabeceras recibidas",
  3: "Descargando (cargando cuerpo)",
  4: "Completada"
};

// Fallback para cuando se abre con file://
// - Si la página corre en http/https, usamos la propia URL (requisito del taller).
// - Si corre en file://, usamos un endpoint público con CORS para asegurar 200.
function setDefaultURL() {
  try {
    const href = window.location.href || "";
    if (/^https?:/i.test(href)) {
      $("#url-input").value = href;
    } else {
      $("#url-input").value = "https://jsonplaceholder.typicode.com/todos/1";
    }
  } catch (e) {
    $("#url-input").value = "https://jsonplaceholder.typicode.com/todos/1";
  }
}

function mostrarContenido(text, mime) {
  const isHTML = /html/i.test(mime || "");
  const frame = $("#contenido-frame");
  const pre = $("#contenido-pre");
  if (isHTML) {
    pre.classList.add("hidden");
    frame.classList.remove("hidden");
    const blob = new Blob([text], { type: mime || "text/html" });
    frame.src = URL.createObjectURL(blob);
  } else {
    frame.classList.add("hidden");
    pre.classList.remove("hidden");
    $("#contenido-pre").textContent = text;
  }
}

function cargarURL() {
  const url = $("#url-input").value.trim();
  const ul = $("#estado-lista");
  ul.textContent = "";
  $("#headers").textContent = "";
  $("#status").textContent = "—";
  mostrarContenido("", "text/plain");

  if (!url) { appendLi(ul, "Ingresa una URL válida."); return; }

  const xhr = new XMLHttpRequest();

  xhr.onreadystatechange = () => {
    appendLi(ul, `Estado ${xhr.readyState}: ${estados[xhr.readyState]}`);

    if (xhr.readyState === 2) {
      $("#headers").textContent = xhr.getAllResponseHeaders();
    }

    if (xhr.readyState === 4) {
      const exito = xhr.status >= 200 && xhr.status < 300;
      const codigoMostrado = exito ? 200 : 404;
      $("#status").textContent = String(codigoMostrado);

      const tipo = xhr.getResponseHeader("content-type") || "text/plain";
      if (exito) {
        mostrarContenido(xhr.responseText, tipo);
      } else {
        mostrarContenido(
          "No fue posible cargar el recurso.\n\nSe muestra 404 para indicar error.",
          "text/plain"
        );
      }
    }
  };

  xhr.onerror = () => {
    $("#status").textContent = "404";
    appendLi(ul, "Error de red.");
    mostrarContenido(
      "No fue posible realizar la solicitud (error de red).",
      "text/plain"
    );
  };

  try {
    xhr.open("GET", url, true);
    xhr.send();
  } catch (e) {
    $("#status").textContent = "404";
    appendLi(ul, "No se pudo iniciar la petición: " + e.message);
    mostrarContenido(
      "No se pudo iniciar la petición.\n\nSe muestra 404 para indicar error.",
      "text/plain"
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setDefaultURL();
  $("#btn-cargar").addEventListener("click", cargarURL);
});


