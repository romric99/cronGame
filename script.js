// --- Seleção de Elementos do DOM ---
const setupScreen = document.getElementById('setup-screen');
const gameScreen = document.getElementById('game-screen');

// Elementos de Configuração
const numPlayersInput = document.getElementById('num-players');
const confirmPlayersBtn = document.getElementById('confirm-players');
const playersSetupDiv = document.getElementById('players-setup');
const roundTimeInput = document.getElementById('round-time');
const timerModeSelect = document.getElementById('timer-mode');
const startGameBtn = document.getElementById('start-game-btn');

// Elementos do Jogo
const playerNameH2 = document.getElementById('player-name');
const playerColorIndicator = document.getElementById('player-color-indicator');
const timerDisplay = document.getElementById('timer-display');
const pauseBtn = document.getElementById('pause-btn');
const restartBtn = document.getElementById('restart-btn');

// --- Variáveis de Estado do Jogo ---
let players = [];
let gameSettings = {};
let currentPlayerIndex = 0;
let timerInterval = null;
let currentTime = 0;
let isPaused = false;

// --- Funções ---

// Gera os campos de nome e cor para cada jogador
function generatePlayerInputs() {
    const numPlayers = parseInt(numPlayersInput.value, 10);
    playersSetupDiv.innerHTML = ''; // Limpa campos anteriores

    for (let i = 1; i <= numPlayers; i++) {
        const playerDiv = document.createElement('div');
        playerDiv.classList.add('form-group');
        playerDiv.innerHTML = `
            <label for="player-name-${i}">Nome do Jogador ${i}</label>
            <input type="text" id="player-name-${i}" value="Jogador ${i}">
            <label for="player-color-${i}">Cor</label>
            <input type="color" id="player-color-${i}" value="${getRandomColor()}">
        `;
        playersSetupDiv.appendChild(playerDiv);
    }
}

// Gera uma cor aleatória para o input de cor
function getRandomColor() {
    return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
}

// Inicia o jogo: coleta dados, esconde a configuração e mostra a tela do jogo
function startGame() {
    // 1. Coletar dados dos jogadores
    players = [];
    const numPlayers = parseInt(numPlayersInput.value, 10);
    for (let i = 1; i <= numPlayers; i++) {
        const name = document.getElementById(`player-name-${i}`).value;
        const color = document.getElementById(`player-color-${i}`).value;
        players.push({ name: name || `Jogador ${i}`, color });
    }

    // 2. Coletar configurações do jogo
    gameSettings = {
        time: parseInt(roundTimeInput.value, 10),
        mode: timerModeSelect.value
    };

    // 3. Validar se há jogadores
    if (players.length === 0) {
        alert('Adicione pelo menos um jogador!');
        return;
    }

    // 4. Mudar de tela
    setupScreen.style.display = 'none';
    gameScreen.style.display = 'block';

    // 5. Iniciar o primeiro turno
    currentPlayerIndex = 0;
    setupTurn();
}

// Configura o turno para o jogador atual
function setupTurn() {
    isPaused = false;
    pauseBtn.textContent = 'Pausar';
    pauseBtn.classList.remove('paused');

    const currentPlayer = players[currentPlayerIndex];
    playerNameH2.textContent = currentPlayer.name;
    playerColorIndicator.style.backgroundColor = currentPlayer.color;
    
    startTimer();
}

// Inicia o cronômetro (progressivo ou regressivo)
function startTimer() {
    clearInterval(timerInterval); // Limpa qualquer timer anterior

    if (gameSettings.mode === 'regressive') {
        currentTime = gameSettings.time;
    } else {
        currentTime = 0;
    }

    updateTimerDisplay();

    timerInterval = setInterval(() => {
        if (!isPaused) {
            if (gameSettings.mode === 'regressive') {
                currentTime--;
                if (currentTime < 0) {
                    currentTime = 0;
                    clearInterval(timerInterval); // Para o timer quando chega a zero
                }
            } else {
                currentTime++;
            }
            updateTimerDisplay();
        }
    }, 1000);
}

// Atualiza o display do tempo no formato MM:SS
function updateTimerDisplay() {
    const minutes = Math.floor(currentTime / 60);
    const seconds = currentTime % 60;
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Passa para o próximo jogador
function nextPlayer() {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    setupTurn();
}

// Pausa ou retoma o cronômetro
function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        pauseBtn.textContent = 'Retomar';
        pauseBtn.classList.add('paused');
    } else {
        pauseBtn.textContent = 'Pausar';
        pauseBtn.classList.remove('paused');
    }
}

// --- Event Listeners ---

// Gera os inputs de jogador ao confirmar o número
confirmPlayersBtn.addEventListener('click', generatePlayerInputs);

// Inicia o jogo
startGameBtn.addEventListener('click', startGame);

// O próprio timer passa a vez
timerDisplay.addEventListener('click', nextPlayer);

// Botão de Pausa
pauseBtn.addEventListener('click', togglePause);

// Botão de Reiniciar a rodada para o jogador atual
restartBtn.addEventListener('click', startTimer);

// Gera os campos para o valor inicial (2 jogadores)
generatePlayerInputs();