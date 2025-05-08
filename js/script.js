// script.js
import { iniciarMareas } from './tides.js';

const API_KEY = "3e867330616c39fa60d18a1af5d82f16";
const BASE_URL = "https://api.openweathermap.org/data/2.5/";
const FORECAST_URL = `${BASE_URL}forecast`;
const UNITS = "metric";

const DATE_TIME_OPTIONS = {
    timeZone: "Europe/Madrid",
    hour12: false,
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
};

function actualizarFechaHora() {
    document.getElementById("fechayhora").textContent = new Date().toLocaleString("es-ES", DATE_TIME_OPTIONS);
}

async function obtenerDatosTiempo(query) {
    const url = `${BASE_URL}weather?${query}&lang=es&units=${UNITS}&appid=${API_KEY}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error API: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Error al obtener datos del tiempo:", error);
        return null;
    }
}

async function obtenerPronosticoHora(query) {
    const url = `${FORECAST_URL}?${query}&lang=es&units=${UNITS}&appid=${API_KEY}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error API: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Error al obtener pronóstico:", error);
        return null;
    }
}

function mostrarPronosticoHora(forecastData) {
    const container = document.getElementById("hourlyForecast");
    container.innerHTML = "";
    
    if (!forecastData || !forecastData.list) {
        container.innerHTML = "<p class='has-text-warning'>No hay datos disponibles</p>";
        return;
    }

    const template = document.getElementById("hourlyTemplate");
    if (!template) {
        container.innerHTML = "<p class='has-text-danger'>Error: Template no encontrado</p>";
        return;
    }

    // Crear contenedor interno
    const wrapper = document.createElement("div");
    wrapper.className = "forecast__wrapper";

    // Añadir los elementos del pronóstico al contenedor interno
    forecastData.list.slice(0, 8).forEach(hour => {
        const clone = document.importNode(template.content, true);
        const date = new Date(hour.dt * 1000);
        const hora = date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
        
        clone.querySelector(".forecast__hora").textContent = hora;
        const iconUrl = `http://openweathermap.org/img/wn/${hour.weather[0].icon}.png`;
        const iconElement = clone.querySelector(".forecast__icono");
        iconElement.src = iconUrl;
        iconElement.alt = hour.weather[0].description;
        clone.querySelector(".forecast__temperatura").textContent = 
            `${Math.round(hour.main.temp)}°C - ${hour.weather[0].description}`;

        wrapper.appendChild(clone);
    });

    // Añadir el contenedor interno al contenedor principal
    container.appendChild(wrapper);

    // Forzar el desplazamiento al inicio con un retraso mayor
    setTimeout(() => {
        container.scrollLeft = 0;
    }, 300);

    // Añadir un listener para asegurar que el desplazamiento se mantenga al inicio
    container.addEventListener('scroll', () => {
        if (container.scrollLeft < 0) {
            container.scrollLeft = 0;
        }
    }, { once: true });
}

async function actualizarDatos(query) {
    const weatherData = await obtenerDatosTiempo(query);
    const forecastData = await obtenerPronosticoHora(query);
    
    if (!weatherData) {
        document.getElementById("ciudad").textContent = "Ciudad no encontrada";
        document.getElementById("orto").textContent = "";
        document.getElementById("ocaso").textContent = "";
        document.getElementById("hourlyForecast").innerHTML = "<p class='has-text-warning'>No hay datos disponibles</p>";
        return;
    }

    document.getElementById("ciudad").textContent = `Orto y ocaso en ${weatherData.name}`;
    const formatDate = (timestamp) => new Date(timestamp * 1000).toLocaleString("es-ES", DATE_TIME_OPTIONS);
    document.getElementById("orto").textContent = formatDate(weatherData.sys.sunrise);
    document.getElementById("ocaso").textContent = formatDate(weatherData.sys.sunset);

    const horaActual = Math.floor(Date.now() / 1000);
    document.body.style.backgroundImage = (horaActual >= weatherData.sys.sunrise && horaActual <= weatherData.sys.sunset)
        ? "url('./assets/img/dia.jpg')"
        : "url('./assets/img/noche.jpg')";

    mostrarPronosticoHora(forecastData);
}

function obtenerUbicacion() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocalización no soportada"));
        } else {
            navigator.geolocation.getCurrentPosition(
                (position) => resolve(`lat=${position.coords.latitude}&lon=${position.coords.longitude}`),
                (error) => reject(error)
            );
        }
    });
}

function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const lat = params.get("lat");
    const lon = params.get("lon");
    return lat && lon ? `lat=${lat}&lon=${lon}` : null;
}

async function iniciar() {
    actualizarFechaHora();
    setInterval(actualizarFechaHora, 1000);

    const searchButton = document.getElementById("searchButton");
    const searchInput = document.getElementById("searchInput");

    if (searchButton && searchInput) {
        searchButton.addEventListener("click", () => {
            const ciudad = searchInput.value.trim();
            if (ciudad) {
                window.location.href = `buscar.html?ciudad=${encodeURIComponent(ciudad)}`;
            }
        });

        searchInput.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                const ciudad = searchInput.value.trim();
                if (ciudad) {
                    window.location.href = `buscar.html?ciudad=${encodeURIComponent(ciudad)}`;
                }
            }
        });
    }

    let query = getQueryParams();
    if (query) {
        await actualizarDatos(query);
        setInterval(() => actualizarDatos(query), 600000);
    } else {
        try {
            query = await obtenerUbicacion();
            await actualizarDatos(query);
            setInterval(() => actualizarDatos(query), 600000);
        } catch (error) {
            console.error("Error al obtener ubicación:", error.message);
            query = "lat=42.84&lon=-8.57";
            await actualizarDatos(query);
            setInterval(() => actualizarDatos(query), 600000);
        }
    }

    try {
        await iniciarMareas();
    } catch (error) {
        console.error("Error al iniciar mareas:", error);
    }
}

document.addEventListener("DOMContentLoaded", iniciar);