
console.log("COBRIZA: iniciando módulo 3D");

import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

console.log("COBRIZA: Three.js cargado");

// ========================================
// 1. CONFIGURACION DEL MODELO
// ========================================

const contenedor = document.getElementById('modelo3d');

if (!contenedor) {
    throw new Error('No se encontró el espacio del modelo 3D.');
}

// Dimensiones de referencia, en metros
const ANCHO = 6.00;
const ALTURA = 4.00;
const ALTURA_PARED = 1.00;
const LONGITUD = 5.40;
const SEPARACION_ARCOS = 0.45;

// Diámetro documentado de la barra
const DIAMETRO_BARRA = 0.015875;

// ========================================
// 2. CREAR ESCENA
// ========================================

const escena = new THREE.Scene();

console.log("ESCENA 3D CREADA CORRECTAMENTE");

escena.background = new THREE.Color(0x101a27);

// Cámara
const camara = new THREE.PerspectiveCamera(
    45,
    contenedor.clientWidth / contenedor.clientHeight,
    0.1,
    100
);

camara.position.set(8, 6, 10);

// Renderizador
const renderizador = new THREE.WebGLRenderer({
    antialias: true
});

renderizador.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

renderizador.setSize(
    contenedor.clientWidth,
    contenedor.clientHeight
);

contenedor.appendChild(renderizador.domElement);

// ========================================
// 3. CONTROLES INTERACTIVOS
// ========================================

const controles = new OrbitControls(
    camara,
    renderizador.domElement
);

controles.enableDamping = true;
controles.target.set(0, 2, 0);

// ========================================
// 4. ILUMINACION
// ========================================

const luzAmbiente = new THREE.AmbientLight(
    0xffffff,
    1.5
);

escena.add(luzAmbiente);

const luzPrincipal = new THREE.DirectionalLight(
    0xffffff,
    2
);

luzPrincipal.position.set(5, 10, 7);
escena.add(luzPrincipal);

// ========================================
// 5. PISO Y CUADRICULA
// ========================================

const piso = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({
        color: 0x293747,
        roughness: 0.9
    })
);

piso.rotation.x = -Math.PI / 2;
piso.position.y = -0.03;
escena.add(piso);

const cuadricula = new THREE.GridHelper(
    30,
    30,
    0x526174,
    0x354455
);

cuadricula.position.y = -0.01;
escena.add(cuadricula);

// ========================================
// 6. PERFIL DE LA GALERIA
// ========================================

// Perfil provisional tipo herradura.
// Ancho: 6 m. Altura total: 4 m.
// Paredes verticales: 1 m.
// Cubierta: semielipse.

function crearPerfil(z) {

    const puntos = [];

    puntos.push(
        new THREE.Vector3(-ANCHO / 2, 0, z)
    );

    puntos.push(
        new THREE.Vector3(-ANCHO / 2, ALTURA_PARED, z)
    );

    // Arco superior
    for (let i = 0; i <= 40; i++) {

        const angulo = Math.PI - (Math.PI * i / 40);

        const x = (ANCHO / 2) * Math.cos(angulo);

        const y = ALTURA_PARED +
            (ALTURA - ALTURA_PARED) * Math.sin(angulo);

        puntos.push(
            new THREE.Vector3(x, y, z)
        );
    }

    puntos.push(
        new THREE.Vector3(ANCHO / 2, 0, z)
    );

    return puntos;
}

// ========================================
// 7. MATERIAL DE LOS ELEMENTOS
// ========================================

const materialArcos = new THREE.MeshStandardMaterial({
    color: 0xd6a443,
    metalness: 0.65,
    roughness: 0.35
});

const materialMalla = new THREE.LineBasicMaterial({
    color: 0x28b8d4,
    transparent: true,
    opacity: 0.8
});

// ========================================
// 8. CREAR ARCOS DE SOSTENIMIENTO
// ========================================

const listaArcos = [];

console.log("INICIANDO CREACION DE ARCOS");

const cantidadArcos = Math.floor(
    LONGITUD / SEPARACION_ARCOS
) + 1;

for (let i = 0; i < cantidadArcos; i++) {

    const z = -LONGITUD / 2 +
        i * SEPARACION_ARCOS;

    const puntos = crearPerfil(z);

    const curva = new THREE.CatmullRomCurve3(puntos);

    const geometria = new THREE.TubeGeometry(
        curva,
        100,
        DIAMETRO_BARRA / 2,
        8,
        false
    );

    const arco = new THREE.Mesh(
        geometria,
        materialArcos
    );

    escena.add(arco);

    arco.name = `Arco ${i + 1}`;
    arco.userData.numero = i + 1;

    listaArcos.push(arco);
}

console.log("ARCOS CREADOS:", listaArcos.length);

// ========================================
// 9. MALLA CUADRICULADA DE REFUERZO
// ========================================

// Separación nominal para visualización (m)
const PASO_MALLA = 0.1016;

// Desplazamiento visual hacia el interior (m)
const DESFASE_MALLA = 0.035;

// Obtener el perfil de nuestra galería
const perfilBaseMalla = crearPerfil(0);

// Calculamos las distancias acumuladas
// siguiendo las paredes y el techo.
const distancias = [0];

for (let i = 1; i < perfilBaseMalla.length; i++) {

    const anterior = perfilBaseMalla[i - 1];
    const actual = perfilBaseMalla[i];

    const distancia = Math.hypot(
        actual.x - anterior.x,
        actual.y - anterior.y
    );

    distancias.push(
        distancias[i - 1] + distancia
    );
}

const perimetro = distancias[distancias.length - 1];

// Obtener un punto a una distancia determinada
// del inicio del perfil
function puntoSobrePerfil(distancia) {

    const d = THREE.MathUtils.clamp(
        distancia, 0, perimetro
    );

    let i = 1;

    while (
        i < distancias.length - 1 &&
        distancias[i] < d
    ) {
        i++;
    }

    const inicio = perfilBaseMalla[i - 1];
    const fin = perfilBaseMalla[i];

    const longitudTramo =
        distancias[i] - distancias[i - 1];

    const t = longitudTramo > 0
        ? (d - distancias[i - 1]) / longitudTramo
        : 0;

    return new THREE.Vector3(
        THREE.MathUtils.lerp(inicio.x, fin.x, t),
        THREE.MathUtils.lerp(inicio.y, fin.y, t),
        0
    );
}

// Ubicar ligeramente la malla hacia el interior
// para distinguirla visualmente del shotcrete.
function puntoDeMalla(distancia, z) {

    const punto = puntoSobrePerfil(distancia);

    const delta = 0.001;

    const previo = puntoSobrePerfil(
        Math.max(0, distancia - delta)
    );

    const posterior = puntoSobrePerfil(
        Math.min(perimetro, distancia + delta)
    );

    const tangente = posterior.clone()
        .sub(previo)
        .normalize();

    // Normal interior del perfil
    const interior = new THREE.Vector3(
        tangente.y,
        -tangente.x,
        0
    );

    return new THREE.Vector3(
        punto.x + interior.x * DESFASE_MALLA,
        punto.y + interior.y * DESFASE_MALLA,
        z
    );
}

// Almacenamos segmentos de líneas
const segmentosMalla = [];

function agregarSegmentoMalla(a, b) {

    segmentosMalla.push(
        a.x, a.y, a.z,
        b.x, b.y, b.z
    );
}

// Líneas que siguen el perfil de la galería
const divisionesZ = Math.ceil(
    LONGITUD / PASO_MALLA
);

for (let j = 0; j <= divisionesZ; j++) {

    const z = -LONGITUD / 2 +
        LONGITUD * j / divisionesZ;

    const divisionesPerfil = Math.ceil(
        perimetro / PASO_MALLA
    );

    for (let i = 0; i < divisionesPerfil; i++) {

        const d1 = perimetro * i / divisionesPerfil;
        const d2 = perimetro * (i + 1) / divisionesPerfil;

        agregarSegmentoMalla(
            puntoDeMalla(d1, z),
            puntoDeMalla(d2, z)
        );
    }
}

// Líneas longitudinales
const cantidadLongitudinal = Math.ceil(
    perimetro / PASO_MALLA
);

for (let i = 0; i <= cantidadLongitudinal; i++) {

    const distancia = perimetro *
        i / cantidadLongitudinal;

    agregarSegmentoMalla(
        puntoDeMalla(distancia, -LONGITUD / 2),
        puntoDeMalla(distancia, LONGITUD / 2)
    );
}

// Crear la geometría
const geometriaMalla = new THREE.BufferGeometry();

geometriaMalla.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
        segmentosMalla, 3
    )
);

// Crear el objeto 3D con el material
// definido en el apartado 7.
const mallaRefuerzo = new THREE.LineSegments(
    geometriaMalla,
    materialMalla
);

mallaRefuerzo.name = 'Malla de refuerzo';

escena.add(mallaRefuerzo);

// CONTROL DE VISIBILIDAD

const botonMalla = document.getElementById(
    'botonMalla'
);

if (botonMalla) {

    botonMalla.addEventListener('click', () => {

        mallaRefuerzo.visible = !mallaRefuerzo.visible;

        botonMalla.textContent = mallaRefuerzo.visible
            ? 'Ocultar malla'
            : 'Mostrar malla';
    });
}

// ========================================
// 9B. REVESTIMIENTO DE SHOTCRETE
// ========================================

// Espesor documentado del revestimiento (m)
const ESPESOR_SHOTCRETE = 0.15;

// Material gris semitransparente
const materialShotcrete = new THREE.MeshStandardMaterial({
    color: 0x92a0ae,
    roughness: 0.9,
    metalness: 0,
    transparent: true,
    opacity: 0.32,
    side: THREE.DoubleSide,
    depthWrite: false
});

// Utilizamos el perfil ya creado en el apartado 6
const perfilShotcrete = crearPerfil(0);

// Aquí guardaremos los triángulos del revestimiento
const verticesShotcrete = [];

// Agrega un triángulo a la geometría
function agregarTriangulo(a, b, c) {
    verticesShotcrete.push(
        a.x, a.y, a.z,
        b.x, b.y, b.z,
        c.x, c.y, c.z
    );
}

// Agrega una cara rectangular formada por dos triángulos
function agregarCara(a, b, c, d) {
    agregarTriangulo(a, b, c);
    agregarTriangulo(a, c, d);
}

// Calcula una dirección perpendicular aproximada al perfil
function normalExterior(indice) {

    const anterior = perfilShotcrete[
        Math.max(0, indice - 1)
    ];

    const siguiente = perfilShotcrete[
        Math.min(perfilShotcrete.length - 1, indice + 1)
    ];

    const dx = siguiente.x - anterior.x;
    const dy = siguiente.y - anterior.y;

    const longitud = Math.hypot(dx, dy);

    if (longitud === 0) {
        return { x: 0, y: 1 };
    }

    return {
        x: -dy / longitud,
        y: dx / longitud
    };
}

// Construimos una capa entre el perfil interior
// y otro perfil separado 15 cm hacia el exterior.

for (let i = 0; i < perfilShotcrete.length - 1; i++) {

    const p1 = perfilShotcrete[i];
    const p2 = perfilShotcrete[i + 1];

    const n1 = normalExterior(i);
    const n2 = normalExterior(i + 1);

    const zInicial = -LONGITUD / 2;
    const zFinal = LONGITUD / 2;

    // Puntos de la superficie interior
    const a = new THREE.Vector3(p1.x, p1.y, zInicial);
    const b = new THREE.Vector3(p2.x, p2.y, zInicial);
    const c = new THREE.Vector3(p2.x, p2.y, zFinal);
    const d = new THREE.Vector3(p1.x, p1.y, zFinal);

    // Puntos de la superficie exterior
    const ae = new THREE.Vector3(
        p1.x + ESPESOR_SHOTCRETE * n1.x,
        p1.y + ESPESOR_SHOTCRETE * n1.y,
        zInicial
    );

    const be = new THREE.Vector3(
        p2.x + ESPESOR_SHOTCRETE * n2.x,
        p2.y + ESPESOR_SHOTCRETE * n2.y,
        zInicial
    );

    const ce = new THREE.Vector3(
        p2.x + ESPESOR_SHOTCRETE * n2.x,
        p2.y + ESPESOR_SHOTCRETE * n2.y,
        zFinal
    );

    const de = new THREE.Vector3(
        p1.x + ESPESOR_SHOTCRETE * n1.x,
        p1.y + ESPESOR_SHOTCRETE * n1.y,
        zFinal
    );

    // Cara interior
    agregarCara(a, b, c, d);

    // Cara exterior
    agregarCara(ae, de, ce, be);

    // Bordes de los extremos
    agregarCara(a, ae, be, b);
    agregarCara(d, c, ce, de);

    // Cierre de los bordes inferiores
    if (i === 0) {
        agregarCara(a, d, de, ae);
    }

    if (i === perfilShotcrete.length - 2) {
        agregarCara(b, be, ce, c);
    }
}

// Crear geometría tridimensional
const geometriaShotcrete = new THREE.BufferGeometry();

geometriaShotcrete.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(verticesShotcrete, 3)
);

geometriaShotcrete.computeVertexNormals();

// Crear y agregar el revestimiento a la escena
const revestimientoShotcrete = new THREE.Mesh(
    geometriaShotcrete,
    materialShotcrete
);

revestimientoShotcrete.name = 'Shotcrete';

escena.add(revestimientoShotcrete);

// ========================================
// CONTROL DE VISIBILIDAD
// ========================================

const botonShotcrete = document.getElementById(
    'botonShotcrete'
);

if (botonShotcrete) {

    botonShotcrete.addEventListener('click', () => {

        revestimientoShotcrete.visible =
            !revestimientoShotcrete.visible;

        botonShotcrete.textContent =
            revestimientoShotcrete.visible
                ? 'Ocultar shotcrete'
                : 'Mostrar shotcrete';
    });
}

// ========================================
// 10. INDICADOR DE DIMENSIONES
// ========================================

const materialDimension = new THREE.LineBasicMaterial({
    color: 0xffffff
});

// Línea del ancho
const lineaAncho = new THREE.BufferGeometry()
    .setFromPoints([
        new THREE.Vector3(-3, 0.05, 3.5),
        new THREE.Vector3(3, 0.05, 3.5)
    ]);

escena.add(
    new THREE.Line(lineaAncho, materialDimension)
);

// ========================================
// 11. CENTRAR Y ANIMAR
// ========================================

controles.update();

function animar() {

    requestAnimationFrame(animar);

    controles.update();

    renderizador.render(escena, camara);
}

animar();

// ========================================
// 12. ADAPTAR A CAMBIOS DE VENTANA
// ========================================

const observador = new ResizeObserver(() => {

    const ancho = contenedor.clientWidth;
    const alto = contenedor.clientHeight;

    if (ancho === 0 || alto === 0) return;

    camara.aspect = ancho / alto;
    camara.updateProjectionMatrix();

    renderizador.setSize(ancho, alto);
});

observador.observe(contenedor);

// ========================================
// 13. INSPECCION DE ARCOS
// ========================================


    // ========================================
    // 13. PANEL DE INSPECCION DE ARCOS
    // ========================================

    const selectorArco = document.getElementById(
        'selectorArco'
    );

    const resultadoElemento = document.getElementById(
        'resultadoElemento'
    );

    // Verificar que los elementos HTML existan
    if (!selectorArco || !resultadoElemento) {

        console.error(
            'ERROR: No se encontraron los elementos del panel.'
        );

    } else {

        console.log('Panel de inspección conectado.');
        console.log('Arcos registrados:', listaArcos.length);

        // Limpiar las opciones anteriores
        selectorArco.innerHTML =
            '<option value="">Selecciona un arco</option>';

        // Crear opciones
        listaArcos.forEach((arco, indice) => {

            const opcion = document.createElement('option');

            opcion.value = String(indice);
            opcion.textContent = `Arco ${indice + 1}`;

            selectorArco.appendChild(opcion);
        });

        // Material para resaltar
        const materialSeleccionado = materialArcos.clone();

        materialSeleccionado.color.set(0xffe27a);
        materialSeleccionado.emissive.set(0x554000);
        materialSeleccionado.emissiveIntensity = 0.6;

        let arcoSeleccionado = null;

        function seleccionarArco(indice) {

            // Restaurar el arco anterior
            if (arcoSeleccionado) {
                arcoSeleccionado.material = materialArcos;
            }

            // Sin selección
            if (indice === null) {

                arcoSeleccionado = null;

                resultadoElemento.textContent =
                    'Selecciona un arco para consultar sus propiedades.';

                return;
            }

            const arco = listaArcos[indice];

            if (!arco) {

                resultadoElemento.textContent =
                    'No se encontró el arco seleccionado.';

                return;
            }

            arcoSeleccionado = arco;
            arco.material = materialSeleccionado;

            // Datos geométricos
            const diametroMM = DIAMETRO_BARRA * 1000;

            const areaMM2 =
                Math.PI * diametroMM ** 2 / 4;

            const separacionMM =
                SEPARACION_ARCOS * 1000;

            // Mostrar resultados
            resultadoElemento.innerHTML = `
                <h4>Arco ${indice + 1}</h4>

                <p><strong>Diámetro:</strong>
                ${diametroMM.toFixed(3)} mm</p>

                <p><strong>Área transversal:</strong>
                ${areaMM2.toFixed(2)} mm²</p>

                <p><strong>Separación:</strong>
                ${separacionMM.toFixed(0)} mm</p>

                <div class="formula-elemento">
                    A = π × d² / 4
                    <hr>
                    A = π × (${diametroMM.toFixed(3)})² / 4
                    <hr>
                    A = ${areaMM2.toFixed(2)} mm²
                </div>

                <p>
                    Área circular nominal de una barra.
                    No representa la capacidad resistente
                    del arco completo.
                </p>
            `;

            console.log(
                `Arco ${indice + 1} seleccionado correctamente.`
            );
        }

        // Escuchar cambios en el selector
        selectorArco.addEventListener('change', () => {

            const valor = selectorArco.value;

            console.log('Valor seleccionado:', valor);

            if (valor === '') {
                seleccionarArco(null);
            } else {
                seleccionarArco(Number(valor));
            }
        });
    }

