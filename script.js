// Configuración básica de la escena 3D
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x020208, 0.015);

// Cámara
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 30, 50);

// Renderizador
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// Controles de órbita para interactuar de forma táctil en el celular
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxDistance = 120;
controls.minDistance = 15;

// --- 1. FONDO DE ESTRELLAS ---
const estrellasGeo = new THREE.BufferGeometry();
const cantEstrellas = 1500;
const posicionesEstrellas = new Float32Array(cantEstrellas * 3);

for(let i = 0; i < cantEstrellas * 3; i += 3) {
    posicionesEstrellas[i] = (Math.random() - 0.5) * 300;
    posicionesEstrellas[i+1] = (Math.random() - 0.5) * 300;
    posicionesEstrellas[i+2] = (Math.random() - 0.5) * 300;
}
estrellasGeo.setAttribute('position', new THREE.BufferAttribute(posicionesEstrellas, 3));
const estrellasMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5, transparent: true, opacity: 0.8 });
const campoEstrellas = new THREE.Points(estrellasGeo, estrellasMat);
scene.add(campoEstrellas);


// --- 2. EL AGUJERO NEGRO (Centro del Universo) ---
// El horizonte de sucesos (esfera negra central)
const horizonteGeo = new THREE.SphereGeometry(4, 32, 32);
const horizonteMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
const horizonteSucesos = new THREE.Mesh(horizonteGeo, horizonteMat);
scene.add(horizonteSucesos);

// Generar una textura procedimental en canvas para el brillo del disco
function crearTexturaDisco() {
    const canvasDisco = document.createElement('canvas');
    canvasDisco.width = 256;
    canvasDisco.height = 256;
    const ctx = canvasDisco.getContext('2d');
    const gradiente = ctx.createRadialGradient(128, 128, 30, 128, 128, 128);
    gradiente.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradiente.addColorStop(0.1, 'rgba(255, 140, 0, 1)');   // Naranja brillante interno
    gradiente.addColorStop(0.4, 'rgba(255, 69, 0, 0.6)');   // Rojo intermedio
    gradiente.addColorStop(0.8, 'rgba(138, 43, 226, 0.2)'); // Halo morado exterior
    gradiente.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gradiente;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(canvasDisco);
}

// Disco de acreción plano y distorsionado (Anillo gigante)
const discoGeo = new THREE.RingGeometry(4.5, 18, 64);
// Orientamos el disco horizontalmente
discoGeo.rotateX(-Math.PI / 2);
const discoMat = new THREE.MeshBasicMaterial({
    map: crearTexturaDisco(),
    side: THREE.DoubleSide,
    transparent: true,
    blending: THREE.AdditiveBlending
});
const discoAcrecion = new THREE.Mesh(discoGeo, discoMat);
scene.add(discoAcrecion);


// --- 3. GENERADOR DE TEXTO EN 3D (Texturas flotantes) ---
const palabrasBase = [
    "Paola", "Eladio", "Te amo", "Siempre juntos", "Mi amor", 
    "Mi universo", "Destino", "Felicidad", "Tú y yo", "Complicidad", 
    "Cariño", "Abrazos", "Besos", "Mi vida", "Amor eterno", 
    "Sonrisas", "Magia", "Nuestra historia", "Te adoro", "Mi reflejo",
    "Mi calma", "Mi paraíso", "Mi fortuna", "Alegría", "Recuerdos", "Eternidad"
];

// Función para renderizar texto plano en un Sprite 3D transparente
function crearSpriteTexto(texto) {
    const canvasTexto = document.createElement('canvas');
    canvasTexto.width = 512;
    canvasTexto.height = 128;
    const ctx = canvasTexto.getContext('2d');
    
    // Estilo especial si son los nombres principales
    const esPrincipal = (texto === "Paola" || texto === "Eladio");
    ctx.font = esPrincipal ? "bold 56px 'Segoe UI', sans-serif" : "40px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Sombra brillante estilo neón
    ctx.shadowBlur = 15;
    ctx.shadowColor = esPrincipal ? "#ff1493" : "#00ffff";
    ctx.fillStyle = "#ffffff";
    
    ctx.fillText(texto, 256, 64);
    
    const textura = new THREE.CanvasTexture(canvasTexto);
    const material = new THREE.SpriteMaterial({ map: textura, transparent: true });
    const sprite = new THREE.Sprite(material);
    
    // Escalar según la importancia de la palabra
    sprite.scale.set(esPrincipal ? 10 : 7, esPrincipal ? 2.5 : 1.75, 1);
    return sprite;
}

// Estructura de datos de las letras gravitando
const nubesDePalabras = [];

palabrasBase.forEach((palabra) => {
    const sprite = crearSpriteTexto(palabra);
    
    // Parámetros orbitales aleatorios
    const datosOrbita = {
        mesh: sprite,
        radio: Math.random() * 16 + 8, // Distancia al agujero negro
        velocidad: (Math.random() * 0.02 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
        angulo: Math.random() * Math.PI * 2,
        // Inclinación leve en los ejes Y y Z para dar volumen real 3D
        offsetY: (Math.random() - 0.5) * 3
    };
    
    scene.add(sprite);
    nubesDePalabras.push(datosOrbita);
});


// --- 4. BUCLE DE ANIMACIÓN Y FÍSICA ---
const reloj = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    const tiempo = reloj.getElapsedTime();
    
    // Rotación sutil del disco del agujero negro
    discoAcrecion.rotation.y = tiempo * 0.15;
    
    // Hacer orbitar las palabras alrededor del centro
    nubesDePalabras.forEach(p => {
        p.angulo += p.velocidad;
        
        // Ecuación de órbita circular tridimensional
        p.mesh.position.x = Math.cos(p.angulo) * p.radio;
        p.mesh.position.z = Math.sin(p.angulo) * p.radio;
        // Ondulación gravitacional suave vertical
        p.mesh.position.y = p.offsetY + Math.sin(tiempo + p.radio) * 0.5;
        
        // Efecto atracción: si se acercan demasiado al horizonte de sucesos, parpadean
        if(p.radio < 9) {
            p.mesh.material.opacity = 0.4 + Math.sin(tiempo * 10) * 0.3;
        }
    });
    
    // Actualizar controles táctiles
    controls.update();
    
    renderer.render(scene, camera);
}

// Soporte para redimensionar pantallas automáticamente (vistas verticales de móviles)
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Arrancar la simulación
animate();
    requestAnimationFrame(animar);
}

animar();
