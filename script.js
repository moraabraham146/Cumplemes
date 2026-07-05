// Configuración básica de la escena 3D
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a0502, 0.012); // Niebla sutil con tono cálido oscuro

// Cámara
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 20, 55);

// Renderizador
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// Controles táctiles/ratón equilibrados para móvil
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxDistance = 100;
controls.minDistance = 15;

// --- 1. FONDO DE ESTRELLAS ---
const estrellasGeo = new THREE.BufferGeometry();
const cantEstrellas = 2000;
const posicionesEstrellas = new Float32Array(cantEstrellas * 3);

for(let i = 0; i < cantEstrellas * 3; i += 3) {
    posicionesEstrellas[i] = (Math.random() - 0.5) * 400;
    posicionesEstrellas[i+1] = (Math.random() - 0.5) * 400;
    posicionesEstrellas[i+2] = (Math.random() - 0.5) * 400;
}
estrellasGeo.setAttribute('position', new THREE.BufferAttribute(posicionesEstrellas, 3));
const estrellasMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.4, transparent: true, opacity: 0.7 });
const campoEstrellas = new THREE.Points(estrellasGeo, estrellasMat);
scene.add(campoEstrellas);


// --- 2. EL AGUJERO NEGRO (Centro Absoluto) ---
const horizonteGeo = new THREE.SphereGeometry(4, 32, 32);
const horizonteMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
const horizonteSucesos = new THREE.Mesh(horizonteGeo, horizonteMat);
scene.add(horizonteSucesos);


// --- 3. HALO LUMINOSO VOLUMÉTRICO 360° (Custom Shader Actualizado) ---
const glowVertexShader = `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
    }
`;

const glowFragmentShader = `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);
        
        // Controla la caída de la luz desde el centro hacia los bordes
        // Aumentamos el exponente a 3.5 para que el desvanecimiento final sea ultra suave
        float intensidad = pow(0.85 - dot(normal, viewDir), 3.5);
        
        // Color naranja fuego de la imagen
        vec3 glowColor = vec3(1.0, 0.42, 0.05); 
        
        // Multiplicamos la opacidad final para que el centro sea bien denso/opaco
        // y los extremos mueran en transparencia absoluta (0.0)
        float opacidadFinal = clampledIntensity = clamp(intensidad * 3.0, 0.0, 1.0);
        
        gl_FragColor = vec4(glowColor * intensidad * 4.0, opacidadFinal);
    }
`;

// Incrementamos ligeramente el tamaño de la esfera de luz para que la transición sea más espaciosa
const haloGeo = new THREE.SphereGeometry(18, 32, 32); 
const haloMat = new THREE.ShaderMaterial({
    vertexShader: glowVertexShader,
    fragmentShader: glowFragmentShader,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide, 
    transparent: true
});
const halo360 = new THREE.Mesh(haloGeo, haloMat);
scene.add(halo360);

// --- 4. GENERADOR DE TEXTO FLOTANTE ---
const palabrasBase = [
    "Paola", "Eladio", "Te amo", "Siempre juntos", "Mi amor", 
    "Mi universo", "Destino", "Felicidad", "Tú y yo", "Complicidad", 
    "Cariño", "Abrazos", "Besos", "Mi vida", "Amor eterno", 
    "Sonrisas", "Magia", "Nuestra historia", "Te adoro", "Mi reflejo",
    "Mi calma", "Mi paraíso", "Mi fortuna", "Alegría", "Recuerdos", "Eternidad"
];

function crearSpriteTexto(texto) {
    const canvasTexto = document.createElement('canvas');
    canvasTexto.width = 512;
    canvasTexto.height = 128;
    const ctx = canvasTexto.getContext('2d');
    
    const esPrincipal = (texto === "Paola" || texto === "Eladio");
    ctx.font = esPrincipal ? "bold 58px 'Segoe UI', sans-serif" : "42px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Brillo del texto adaptado al color cálido
    ctx.shadowBlur = 18;
    ctx.shadowColor = esPrincipal ? "#ff4500" : "#ffcc00";
    ctx.fillStyle = "#ffffff";
    
    ctx.fillText(texto, 256, 64);
    
    const textura = new THREE.CanvasTexture(canvasTexto);
    const material = new THREE.SpriteMaterial({ map: textura, transparent: true });
    const sprite = new THREE.Sprite(material);
    
    sprite.scale.set(esPrincipal ? 11 : 7.5, esPrincipal ? 2.75 : 1.85, 1);
    return sprite;
}

const nubesDePalabras = [];

palabrasBase.forEach((palabra) => {
    const sprite = crearSpriteTexto(palabra);
    
    // Configuraciones orbitales tridimensionales
    const datosOrbita = {
        mesh: sprite,
        radio: Math.random() * 18 + 7, 
        // VELOCIDAD REDUCIDA: Ahora van súper lento y estables
        velocidad: (Math.random() * 0.003 + 0.0015) * (Math.random() > 0.5 ? 1 : -1),
        angulo: Math.random() * Math.PI * 2,
        offsetY: (Math.random() - 0.5) * 8, // Mayor dispersión esférica vertical
        faseFlote: Math.random() * Math.PI
    };
    
    scene.add(sprite);
    nubesDePalabras.push(datosOrbita);
});


// --- 5. BUCLE DE RENDERING Y ANIMACIÓN ---
const reloj = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    
    const tiempo = reloj.getElapsedTime();
    
    // Pulsación suave del halo de luz central (Efecto respiración cósmica)
    const factorEscala = 1 + Math.sin(tiempo * 0.8) * 0.04;
    halo360.scale.set(factorEscala, factorEscala, factorEscala);
    
    // Movimiento lento y gravitatorio de las palabras
    nubesDePalabras.forEach(p => {
        p.angulo += p.velocidad;
        
        // Posicionamiento en órbita alrededor de la esfera de luz
        p.mesh.position.x = Math.cos(p.angulo) * p.radio;
        p.mesh.position.z = Math.sin(p.angulo) * p.radio;
        
        // Movimiento vertical flotante ultra sutil
        p.mesh.position.y = p.offsetY + Math.sin(tiempo * 0.4 + p.faseFlote) * 0.8;
    });
    
    controls.update();
    renderer.render(scene, camera);
}

// Auto-ajuste para pantallas de celulares (vertical/horizontal)
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
