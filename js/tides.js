// tides.js
const TIDE_URL = "http://ideihm.covam.es/api-ihm/getmarea";

// Importar coeficientes dinámicamente según el año
async function loadCoefficients(year) {
    try {
        const module = await import(`./coefficients${year}.js`);
        return module[`COEFICIENTES_${year}`];
    } catch (error) {
        console.error(`Error al cargar coeficientes para el año ${year}:`, error);
        return {};
    }
}

async function obtenerListaPuertos() {
    const url = `${TIDE_URL}?REQUEST=getlist&FORMAT=json`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
        const data = await response.json();
        return data.estaciones && data.estaciones.puertos ? data.estaciones.puertos : [];
    } catch (error) {
        console.error("Error al obtener lista de puertos:", error);
        return [];
    }
}

async function obtenerDatosMareas(portId, date) {
    const url = `${TIDE_URL}?REQUEST=gettide&ID=${portId}&DATE=${date}&FORMAT=json`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
        const data = await response.json();
        return data.mareas && data.mareas.datos && data.mareas.datos.marea ? data.mareas.datos.marea : [];
    } catch (error) {
        console.error("Error al obtener datos de mareas:", error);
        return [];
    }
}

async function obtenerCoeficienteMarea(date) {
    const year = date.slice(0, 4);
    const coefficients = await loadCoefficients(year);
    const now = new Date();
    const utcHour = now.getUTCHours();
    const hourKey = utcHour < 12 ? "00" : "12";
    const fullKey = `${date}${hourKey}`;
    const coeficiente = coefficients[fullKey];
    return coeficiente !== undefined ? coeficiente : "No disponible";
}

function mostrarDatosMareas(mareas, date) {
    const resultsDiv = document.getElementById("tideResults");
    resultsDiv.innerHTML = "";
    if (!mareas || mareas.length === 0) {
        resultsDiv.innerHTML = "<p class='has-text-warning'>No hay datos de mareas disponibles</p>";
        return;
    }
    obtenerCoeficienteMarea(date).then(coeficiente => {
        const table = document.createElement("table");
        table.className = "table is-narrow is-striped is-hoverable";
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Hora</th>
                    <th>Altura (m)</th>
                    <th>Tipo</th>
                </tr>
            </thead>
            <tbody>
                ${mareas.map(m => `
                    <tr>
                        <td>${m.hora || "Desconocida"}</td>
                        <td>${m.altura !== undefined ? m.altura : "N/A"}</td>
                        <td>${m.tipo || "Desconocido"}</td>
                    </tr>
                `).join("")}
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="3">Coeficiente: ${coeficiente}</td>
                </tr>
            </tfoot>
        `;
        resultsDiv.appendChild(table);
    });
}

export async function iniciarMareas() {
    const portSelect = document.getElementById("portSelect");
    const tideDate = document.getElementById("tideDate");
    const tideButton = document.getElementById("tideButton");

    const puertos = await obtenerListaPuertos();
    if (!puertos || puertos.length === 0) {
        portSelect.innerHTML = "<option>No se pudieron cargar los puertos</option>";
    } else {
        puertos.forEach(puerto => {
            const option = document.createElement("option");
            option.value = puerto.id;
            option.textContent = puerto.puerto;
            if (puerto.code === "portosin") option.selected = true;
            portSelect.appendChild(option);
        });
    }

    const today = new Date().toISOString().split("T")[0];
    tideDate.value = today;

    const defaultPortId = portSelect.value || "portosin";
    const defaultDate = tideDate.value.replace(/-/g, "");
    const mareas = await obtenerDatosMareas(defaultPortId, defaultDate);
    mostrarDatosMareas(mareas, defaultDate);

    tideButton.addEventListener("click", async () => {
        const portId = portSelect.value;
        const date = tideDate.value.replace(/-/g, "");
        const mareas = await obtenerDatosMareas(portId, date);
        mostrarDatosMareas(mareas, date);
    });
}