const API_KEY = "3e867330616c39fa60d18a1af5d82f16";
const GEOCODING_URL = "http://api.openweathermap.org/geo/1.0/direct";

async function buscarCiudad(ciudad) {
    const url = `${GEOCODING_URL}?q=${ciudad}&limit=5&appid=${API_KEY}`;
    console.log("URL generada:", url);
    try {
        const response = await fetch(url);
        console.log("Respuesta recibida:", response);
        if (!response.ok) throw new Error("Error en la búsqueda");
        const data = await response.json();
        console.log("Datos obtenidos:", data);
        mostrarResultados(data);
    } catch (error) {
        console.error("Error al buscar ciudad:", error);
        document.getElementById("resultsList").innerHTML = "<p class='has-text-danger'>Error al buscar</p>";
    }
}

function mostrarResultados(ciudades) {
    console.log("Mostrando resultados:", ciudades);
    const resultsList = document.getElementById("resultsList");
    resultsList.innerHTML = "";
    if (ciudades.length === 0) {
        resultsList.innerHTML = "<p class='has-text-warning'>No se encontraron ciudades</p>";
        return;
    }
    ciudades.forEach(ciudad => {
        const div = document.createElement("div");
        div.className = "mb-2";
        const region = ciudad.state ? `, ${ciudad.state}` : "";
        div.innerHTML = `
            <p>${ciudad.name}${region}, ${ciudad.country} (${ciudad.lat}, ${ciudad.lon})
            <a href="index.html?lat=${ciudad.lat}&lon=${ciudad.lon}" class="button is-small is-info ml-2">Ver datos horarios</a></p>
        `;
        resultsList.appendChild(div);
    });
}

function realizarBusqueda() {
    const ciudad = document.getElementById("searchInput").value.trim();
    console.log("Búsqueda iniciada - Ciudad:", ciudad);
    if (ciudad) {
        buscarCiudad(ciudad);
    } else {
        document.getElementById("resultsList").innerHTML = "<p class='has-text-warning'>Introduce una ciudad</p>";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM cargado");
    const searchButton = document.getElementById("searchButton");
    const searchInput = document.getElementById("searchInput");

    if (searchButton) {
        searchButton.addEventListener("click", () => {
            console.log("Botón pulsado");
            realizarBusqueda();
        });
    } else {
        console.error("searchButton no encontrado");
    }

    if (searchInput) {
        searchInput.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                console.log("Enter en searchInput");
                realizarBusqueda();
            }
        });
    } else {
        console.error("searchInput no encontrado");
    }

    const params = new URLSearchParams(window.location.search);
    const ciudad = params.get("ciudad");
    if (ciudad) {
        console.log("Ciudad desde URL:", ciudad);
        document.getElementById("searchInput").value = ciudad;
        buscarCiudad(ciudad);
    }
});