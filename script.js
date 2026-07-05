const canvas = document.getElementById('universo');
const ctx = canvas.getContext('2d');

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Banco de palabras personalizado
const palabrasBase = [
    "Paola", "Eladio", "Te amo", "Siempre juntos", "Mi amor", 
    "Mi universo", "Destino", "Felicidad", "Tú y yo", "Complicidad", 
    "Cariño", "Abrazos", "Besos", "Mi vida", "Amor eterno", 
    "Sonrisas", "Magia", "Nuestra historia", "Te adoro"
];

const particulas = [];

class Particula {
    constructor() {
        this.reset();
        this.y = Math.random() * canvas.height; // Distribución inicial
    }

    reset() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.texto = palabrasBase[Math.floor(Math.random() * palabrasBase.length)];
        
        const angulo = Math.random() * Math.PI * 2;
        const velocidad = Math.random() * 1.2 + 0.4;
        this.vx = Math.cos(angulo) * velocidad;
        this.vy = Math.sin(angulo) * velocidad;
        
        this.size = Math.random() * 10 + 14; 
        this.alpha = 0;
        this.maxAlpha = Math.random() * 0.7 + 0.3;
        this.creciendo = true;

        const colores = ['#ff69b4', '#ffb6c1', '#da70d6', '#ffffff', '#8a2be2'];
        this.color = colores[Math.floor(Math.random() * colores.length)];
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.creciendo) {
            this.alpha += 0.01;
            if (this.alpha >= this.maxAlpha) this.creciendo = false;
        } else {
            if (this.x < 40 || this.x > canvas.width - 40 || this.y < 40 || this.y > canvas.height - 40) {
                this.alpha -= 0.01;
            }
        }

        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height || this.alpha <= 0) {
            this.reset();
        }
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        
        if (this.texto === "Paola" || this.texto === "Eladio") {
            ctx.font = `bold ${this.size + 4}px 'Segoe UI', sans-serif`;
            ctx.shadowBlur = 12;
            ctx.shadowColor = this.color;
        } else {
            ctx.font = `${this.size}px 'Segoe UI', sans-serif`;
        }
        ctx.textAlign = 'center';
        ctx.fillText(this.texto, this.x, this.y);
        ctx.restore();
    }
}

const maxParticulas = 35; 
for (let i = 0; i < maxParticulas; i++) {
    particulas.push(new Particula());
}

function animar() {
    ctx.fillStyle = 'rgba(11, 9, 26, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    particulas.forEach(p => {
        p.update();
        p.draw();
    });

    requestAnimationFrame(animar);
}

animar();
