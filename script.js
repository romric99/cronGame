// --- SELEÇÃO DE ELEMENTOS DO DOM ---
// Telas
const setupScreen = document.getElementById('setup-screen');
const gameScreen = document.getElementById('game-screen');

// Elementos de Configuração
const numPlayersInput = document.getElementById('num-players');
const confirmPlayersBtn = document.getElementById('confirm-players');
const playersSetupDiv = document.getElementById('players-setup');
const roundTimeInput = document.getElementById('round-time');
const timerModeSelect = document.getElementById('timer-mode');
const startGameBtn = document.getElementById('start-game-btn');
const clearSettingsBtn = document.getElementById('clear-settings-btn');

// Elementos do Jogo
const playerNameH2 = document.getElementById('player-name');
const playerColorIndicator = document.getElementById('player-color-indicator');
const timerDisplay = document.getElementById('timer-display');
const pauseBtn = document.getElementById('pause-btn');
const restartBtn = document.getElementById('restart-btn');

// --- VARIÁVEIS DE ESTADO DO JOGO E CONSTANTES ---
let players = [];
let gameSettings = {};
let currentPlayerIndex = 0;
let timerInterval = null;
let currentTime = 0;
let isPaused = false;
const CONFIG_KEY = 'cronGameConfig'; // Chave para o localStorage

// --- FUNÇÕES PRINCIPAIS ---

/**
 * Gera os campos de input para nome e cor com base no número de jogadores.
 */
function generatePlayerInputs() {
    const numPlayers = parseInt(numPlayersInput.value, 10);
    playersSetupDiv.innerHTML = ''; // Limpa campos anteriores para evitar duplicatas

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

/**
 * Gera uma cor hexadecimal aleatória.
 * @returns {string} Uma cor no formato #RRGGBB.
 */
function getRandomColor() {
    return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
}

/**
 * Inicia o jogo, salva as configurações e troca de tela.
 */
function startGame() {
    // 1. Coletar dados dos jogadores do formulário
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

    // 3. Salvar a configuração completa no localStorage
    const configToSave = { players, gameSettings };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(configToSave));
    console.log('Configurações salvas!');

    // 4. Validar se há jogadores
    if (players.length === 0) {
        alert('Adicione pelo menos um jogador!');
        return;
    }

    // 5. Mudar de tela
    setupScreen.style.display = 'none';
    gameScreen.style.display = 'block';

    // 6. Iniciar o primeiro turno
    currentPlayerIndex = 0;
    setupTurn();
}

/**
 * Configura a interface para o turno do jogador atual.
 */
function setupTurn() {
    isPaused = false;
    pauseBtn.textContent = 'Pausar';
    pauseBtn.classList.remove('paused');

    const currentPlayer = players[currentPlayerIndex];
    playerNameH2.textContent = currentPlayer.name;
    playerColorIndicator.style.backgroundColor = currentPlayer.color;
    
    startTimer();
}

/**
 * Inicia ou reinicia o cronômetro para o jogador atual.
 */
function startTimer() {
    clearInterval(timerInterval); // Limpa qualquer timer anterior

    currentTime = (gameSettings.mode === 'regressive') ? gameSettings.time : 0;
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        if (!isPaused) {
            if (gameSettings.mode === 'regressive') {
                currentTime--;
                if (currentTime < 0) {
                    currentTime = 0;
                    clearInterval(timerInterval);
                }
            } else {
                currentTime++;
            }
            updateTimerDisplay();
        }
    }, 1000);
}

/**
 * Atualiza o display do tempo no formato MM:SS.
 */
function updateTimerDisplay() {
    const minutes = Math.floor(currentTime / 60);
    const seconds = currentTime % 60;
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Passa a vez para o próximo jogador na ordem.
 */
function nextPlayer() {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    setupTurn();
}

/**
 * Pausa ou retoma o cronômetro.
 */
function togglePause() {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? 'Retomar' : 'Pausar';
    pauseBtn.classList.toggle('paused', isPaused);
}

// --- FUNÇÕES DE PERSISTÊNCIA ---

/**
 * Carrega as configurações salvas do localStorage quando a página é aberta.
 */
function loadSettings() {
    const savedData = localStorage.getItem(CONFIG_KEY);

    if (savedData) {
        const config = JSON.parse(savedData);

        // Preenche as configurações gerais
        numPlayersInput.value = config.players.length;
        roundTimeInput.value = config.gameSettings.time;
        timerModeSelect.value = config.gameSettings.mode;

        // Gera os campos de jogador com base no número salvo
        generatePlayerInputs();

        // Preenche os nomes e cores dos jogadores salvos
        config.players.forEach((player, index) => {
            const nameInput = document.getElementById(`player-name-${index + 1}`);
            const colorInput = document.getElementById(`player-color-${index + 1}`);
            if (nameInput) nameInput.value = player.name;
            if (colorInput) colorInput.value = player.color;
        });
        
        console.log('Configurações carregadas com sucesso!');
    } else {
        // Se não houver dados salvos, gera os inputs para o valor padrão
        generatePlayerInputs();
        console.log('Nenhuma configuração salva encontrada. Usando padrões.');
    }
}

/**
 * Limpa as configurações salvas e recarrega a página.
 */
function clearSettings() {
    if (confirm('Tem certeza de que deseja apagar todas as configurações salvas?')) {
        localStorage.removeItem(CONFIG_KEY);
        location.reload(); // Recarrega a página para aplicar o estado limpo
    }
}

// --- EVENT LISTENERS ---
confirmPlayersBtn.addEventListener('click', generatePlayerInputs);
startGameBtn.addEventListener('click', startGame);
clearSettingsBtn.addEventListener('click', clearSettings);
timerDisplay.addEventListener('click', nextPlayer);
pauseBtn.addEventListener('click', togglePause);
restartBtn.addEventListener('click', startTimer);


// --- INICIALIZAÇÃO E REGISTRO DO SERVICE WORKER ---

// Carrega as configurações salvas ou inicia com os padrões
loadSettings();

// Registro do Service Worker para funcionalidades PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // O caminho deve incluir o nome do repositório para o GitHub Pages
    navigator.serviceWorker.register('/cronGame/sw.js')
      .then(registration => {
        console.log('Service Worker registrado com sucesso:', registration);
      })
      .catch(error => {
        console.log('Falha ao registrar o Service Worker:', error);
      });
  });
}