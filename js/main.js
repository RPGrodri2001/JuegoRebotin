// Obtenemos el canvas y el contexto
const canvas = document.getElementById("arkanoidCanvas");
const ctx = canvas.getContext("2d");

// Modales
const startModal = document.getElementById("startModal");
const gameOverModal = document.getElementById("gameOverModal");
const levelCompleteModal = document.getElementById("levelCompleteModal");
const finalScoreElement = document.getElementById("finalScore");

// Botones
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const nextLevelButton = document.getElementById("nextLevelButton");
const pauseButton = document.getElementById("pauseButton");

// Elementos de información
const scoreElement = document.getElementById("scoreValue");
const livesElement = document.getElementById("livesValue");

// Variables del juego
let score = 0;
let lives = 3;
let level = 1;
let isPaused = false;
let gameRunning = false;
let animationId = null;

// Variables de la bola
const ball = {
    radius: 8,
    x: canvas.width / 2,
    y: canvas.height - 30,
    dx: 4,
    dy: -4,
    color: "#1E90FF"
};

// Variables de la paleta
const paddle = {
    height: 12,
    width: 80,
    x: canvas.width / 2 - 40,
    color: "#32CD32"
};

// Variables de los bloques
const blockRowCount = 5;
const blockColumnCount = 8;
const blockWidth = 50;
const blockHeight = 20;
const blockPadding = 10;
const blockOffsetTop = 60;
const blockOffsetLeft = 35;

// Crear bloques
let blocks = [];

function initializeBlocks() {
    blocks = [];
    for(let c = 0; c < blockColumnCount; c++) {
        blocks[c] = [];
        for(let r = 0; r < blockRowCount; r++) {
            const blockX = c * (blockWidth + blockPadding) + blockOffsetLeft;
            const blockY = r * (blockHeight + blockPadding) + blockOffsetTop;
            
            // Diferentes colores según la fila
            let color;
            switch(r) {
                case 0: color = "#FF4136"; break; // Rojo
                case 1: color = "#FF851B"; break; // Naranja
                case 2: color = "#FFDC00"; break; // Amarillo
                case 3: color = "#2ECC40"; break; // Verde
                case 4: color = "#0074D9"; break; // Azul
            }
            
            blocks[c][r] = { x: blockX, y: blockY, status: 1, color: color };
        }
    }
}

// Control de la paleta con ratón
function mouseMoveHandler(e) {
    const relativeX = e.clientX - canvas.getBoundingClientRect().left;
    if(relativeX > 0 && relativeX < canvas.width) {
        paddle.x = relativeX - paddle.width / 2;
        
        // Mantener la paleta dentro del canvas
        if(paddle.x < 0) {
            paddle.x = 0;
        }
        if(paddle.x + paddle.width > canvas.width) {
            paddle.x = canvas.width - paddle.width;
        }
    }
}

// Control de la paleta con teclado
let rightPressed = false;
let leftPressed = false;

function keyDownHandler(e) {
    if(e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = true;
    } else if(e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = true;
    }
}

function keyUpHandler(e) {
    if(e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = false;
    } else if(e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = false;
    } else if(e.key === "p" || e.key === "P") {
        togglePause();
    }
}

// Dibujar la bola
function drawBall() {
    ctx.save();
    ctx.shadowColor = "#ec407a";
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.closePath();
    ctx.restore();
    
    
    // Efecto de brillo en la bola
    ctx.beginPath();
    ctx.arc(ball.x - ball.radius/3, ball.y - ball.radius/3, ball.radius/3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fill();
    ctx.closePath();
}

// Dibujar la paleta
function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddle.x, canvas.height - paddle.height, paddle.width, paddle.height);
    ctx.fillStyle = paddle.color;
    ctx.fill();
    ctx.closePath();
    
    // Efecto de gradiente en la paleta
    const gradient = ctx.createLinearGradient(paddle.x, canvas.height - paddle.height, paddle.x, canvas.height);
    gradient.addColorStop(0, "rgba(255,255,255,0.5)");
    gradient.addColorStop(1, "rgba(0,0,0,0.3)");
    ctx.fillStyle = gradient;
    ctx.fillRect(paddle.x, canvas.height - paddle.height, paddle.width, paddle.height);
}

// Dibujar los bloques
function drawBlocks() {
    for(let c = 0; c < blockColumnCount; c++) {
        for(let r = 0; r < blockRowCount; r++) {
            if(blocks[c][r].status === 1) {
                ctx.beginPath();
                ctx.rect(blocks[c][r].x, blocks[c][r].y, blockWidth, blockHeight);
                ctx.fillStyle = blocks[c][r].color;
                ctx.fill();
                ctx.closePath();
                
                // Efecto de relieve en los bloques
                ctx.beginPath();
                ctx.moveTo(blocks[c][r].x, blocks[c][r].y);
                ctx.lineTo(blocks[c][r].x + blockWidth, blocks[c][r].y);
                ctx.lineTo(blocks[c][r].x + blockWidth, blocks[c][r].y + blockHeight);
                ctx.lineTo(blocks[c][r].x, blocks[c][r].y + blockHeight);
                ctx.closePath();
                ctx.strokeStyle = "rgba(255,255,255,0.5)";
                ctx.stroke();
            }
        }
    }
}

// Dibujar puntuación
function drawScore() {
    scoreElement.textContent = score;
}

// Dibujar vidas
function drawLives() {
    livesElement.textContent = lives;
}

// Detectar colisiones con bloques
function collisionDetection() {
    for(let c = 0; c < blockColumnCount; c++) {
        for(let r = 0; r < blockRowCount; r++) {
            const b = blocks[c][r];
            if(b.status === 1) {
                if(ball.x > b.x && ball.x < b.x + blockWidth && ball.y > b.y && ball.y < b.y + blockHeight) {
                    ball.dy = -ball.dy;
                    b.status = 0;
                    score += 10;
                    drawScore();
                    
                    // Verificar si se han destruido todos los bloques
                    let blocksLeft = false;
                    for(let c = 0; c < blockColumnCount; c++) {
                        for(let r = 0; r < blockRowCount; r++) {
                            if(blocks[c][r].status === 1) {
                                blocksLeft = true;
                                break;
                            }
                        }
                        if(blocksLeft) break;
                    }
                    
                    if(!blocksLeft) {
                        levelCompleteModal.style.display = "block";
                        gameRunning = false;
                        cancelAnimationFrame(animationId);
                    }
                }
            }
        }
    }
}

// Pausar/Reanudar el juego
function togglePause() {
    isPaused = !isPaused;
    pauseButton.textContent = isPaused ? "Reanudar" : "Pausar";
    
    if(!isPaused && gameRunning) {
        draw();
    }
}

// Función principal de dibujo
function draw() {
    if(!gameRunning || isPaused) return;
    
    animationId = requestAnimationFrame(draw);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawBall();
    drawPaddle();
    drawBlocks();
    collisionDetection();
    
    // Cambiar dirección si se toca el borde
    if(ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius) {
        ball.dx = -ball.dx;
    }
    
    if(ball.y + ball.dy < ball.radius) {
        ball.dy = -ball.dy;
    } else if(ball.y + ball.dy > canvas.height - ball.radius) {
        if(ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
            // Modificar el ángulo de rebote basado en la posición del impacto en la paleta
            let hitPos = (ball.x - (paddle.x + paddle.width/2)) / (paddle.width/2);
            
            // Limitar la velocidad máxima
            let speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
            ball.dx = hitPos * speed * 0.8;
            ball.dy = -Math.sqrt(speed * speed - ball.dx * ball.dx);
        } else {
            // Pierde una vida
            lives--;
            drawLives();
            
            if(lives <= 0) {
                // Game over
                finalScoreElement.textContent = score;
                gameOverModal.style.display = "block";
                gameRunning = false;
                cancelAnimationFrame(animationId);
            } else {
                // Reinicia la posición de la bola
                ball.x = canvas.width / 2;
                ball.y = canvas.height - 30;
                ball.dx = 4;
                ball.dy = -4;
                paddle.x = (canvas.width - paddle.width) / 2;
            }
        }
    }
    
    // Mover la paleta con las teclas
    if(rightPressed && paddle.x < canvas.width - paddle.width) {
        paddle.x += 7;
    } else if(leftPressed && paddle.x > 0) {
        paddle.x -= 7;
    }
    
    // Actualizar posición de la bola
    ball.x += ball.dx;
    ball.y += ball.dy;
}

// Iniciar juego
function startGame() {
    score = 0;
    lives = 3;
    drawScore();
    drawLives();
    initializeBlocks();
    
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 30;
    ball.dx = 4;
    ball.dy = -4;
    paddle.x = (canvas.width - paddle.width) / 2;
    
    gameRunning = true;
    isPaused = false;
    pauseButton.textContent = "Pausar";
    
    startModal.style.display = "none";
    gameOverModal.style.display = "none";
    levelCompleteModal.style.display = "none";
    
    draw();
}

function nextLevel() {
    level++;
    
    // Aumentar dificultad con el nivel
    ball.dx *= 1.1;
    ball.dy *= 1.1;
    paddle.width = Math.max(40, paddle.width - 5);
    
    initializeBlocks();
    
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 30;
    paddle.x = (canvas.width - paddle.width) / 2;
    
    gameRunning = true;
    levelCompleteModal.style.display = "none";
    
    draw();
}

// Eventos
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
document.addEventListener("mousemove", mouseMoveHandler, false);

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);
nextLevelButton.addEventListener("click", nextLevel);
pauseButton.addEventListener("click", togglePause);

// Inicializar bloques
initializeBlocks();