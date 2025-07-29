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
const timerDisplay = document.getElementById('timer-display');
const pauseBtn = document.getElementById('pause-btn');
const restartBtn = document.getElementById('restart-btn');

// Adicione estas linhas junto com as outras seleções de elementos
const progressBar = document.getElementById('progress-bar');
const countdownSound = document.getElementById('countdown-sound');

const backBtn = document.getElementById('back-btn');

// --- VARIÁVEIS DE ESTADO DO JOGO E CONSTANTES ---
let players = [];
let gameSettings = {};
let currentPlayerIndex = 0;
let timerInterval = null;
let currentTime = 0;
let isPaused = false;
let wakeLock = null;

const CONFIG_KEY = 'cronGameConfig'; // Chave para o localStorage

// --- FUNÇÕES PRINCIPAIS ---

/**
 * Gera os campos de input para nome e cor com base no número de jogadores.
 */
function generatePlayerInputs() {
    const numPlayers = parseInt(numPlayersInput.value, 10);
    playersSetupDiv.innerHTML = '';

    for (let i = 1; i <= numPlayers; i++) {
        const playerDiv = document.createElement('div');
        playerDiv.classList.add('form-group');
        playerDiv.innerHTML = `
            <div class="player-name-group">
                <label for="player-name-${i}">${i}</label>
                <input type="text" id="player-name-${i}" value="Jogador ${i}" class="player-name-input">
            </div>
        `;
        playersSetupDiv.appendChild(playerDiv);
    }
}

/**
 * Atualiza a barra de progresso com base no tempo atual.
 */
function updateProgressBar() {
    let percentage = 0;
    if (gameSettings.time > 0) {
        // --- LÓGICA DO MODO REGRESSIVO ---
        if (gameSettings.mode === 'regressive') {
            percentage = (currentTime / gameSettings.time) * 100;
            const isEnding = currentTime <= 9;
            progressBar.style.backgroundColor = isEnding ? '#220377ff' : '#5042a1ff';
            //progressBar.style.backgroundColor = isEnding ? '#f8d7da' : '#d4edda';
        } 
        // --- LÓGICA DO MODO PROGRESSIVO ---
        else {
            percentage = (currentTime / gameSettings.time) * 100;
            if (percentage > 100) percentage = 100;
            
            // A condição de "finalizando" é a mesma do som
            const isEnding = gameSettings.time > 10 && currentTime >= gameSettings.time - 9;
            progressBar.style.backgroundColor = isEnding ? '#f8d7da' : '#d4edda';
            //progressBar.style.backgroundColor = isEnding ? '#f8d7da' : '#d4edda';
        }
    }
    progressBar.style.height = `${percentage}%`;
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
        players.push({ name: name || `Jogador ${i}` });
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
    window.scrollTo(0, 0);

    manageWakeLock('request');

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
    
    startTimer();
}

/**
 * Inicia ou reinicia o cronômetro para o jogador atual.
 */
function startTimer() {
    clearInterval(timerInterval); // Limpa qualquer timer anterior

    currentTime = (gameSettings.mode === 'regressive') ? gameSettings.time : 0;
    
    // Resetar o som e a barra de progresso no início da rodada
    if (countdownSound) { // Verifica se o elemento de som existe
        countdownSound.pause();
        countdownSound.currentTime = 0;
    }
    updateProgressBar();
    updateTimerDisplay();

    timerInterval = setInterval(() => {
        if (!isPaused) {
            // --- LÓGICA DO MODO REGRESSIVO (sem alterações) ---
            if (gameSettings.mode === 'regressive') {
                currentTime--;
                
                // Toca o som quando faltam 10 segundos
                if (gameSettings.time > 9 && currentTime === 9) {
                    if (countdownSound) countdownSound.play().catch(e => console.error("Erro ao tocar som:", e));
                }

                if (currentTime < 0) {
                    currentTime = 0;
                    clearInterval(timerInterval);
                }
            } 
            // --- NOVA LÓGICA PARA O MODO PROGRESSIVO ---
            else { 
                currentTime++;
                
                // Toca o som quando faltam 10 segundos para o fim
                // A condição é: o tempo atual é igual ao tempo total menos 10?
                if (gameSettings.time > 9 && currentTime === gameSettings.time - 9) {
                    if (countdownSound) countdownSound.play().catch(e => console.error("Erro ao tocar som:", e));
                }
                
                // Para o contador quando ele atinge o tempo definido
                if (currentTime >= gameSettings.time) {
                    currentTime = gameSettings.time; // Garante que não ultrapasse
                    clearInterval(timerInterval);
                }
            }
            
            // Atualiza os displays a cada segundo
            updateTimerDisplay();
            updateProgressBar();
        }
    }, 1000);
}

async function manageWakeLock(action) {
    if ('wakeLock' in navigator) {
        try {
            if (action === 'request') {
                wakeLock = await navigator.wakeLock.request('screen');
                console.log('Wake Lock ativado!');
            } else if (action === 'release' && wakeLock !== null) {
                await wakeLock.release();
                wakeLock = null;
                console.log('Wake Lock liberado.');
            }
        } catch (err) {
            console.error(`${err.name}, ${err.message}`);
        }
    }
}

/**
 * Atualiza o display do tempo no formato MM:SS.
 */
function updateTimerDisplay() {
    timerDisplay.textContent = currentTime;
}

/**
 * Passa a vez para o próximo jogador na ordem.
 */
function nextPlayer() {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    
    // Feedback tátil ao passar o turno!
    if (navigator.vibrate) {
        navigator.vibrate(50); // Vibra por 50 milissegundos
    }

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
        if (nameInput) nameInput.value = player.name;
      });

      console.log("Configurações carregadas com sucesso!");
    } else {
      // Se não houver dados salvos, gera os inputs para o valor padrão
      generatePlayerInputs();
      console.log("Nenhuma configuração salva encontrada. Usando padrões.");
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

backBtn.addEventListener('click', () => {
    if (confirm('Tem certeza que deseja voltar e encerrar o jogo atual?')) {
        // LIBERA O WAKE LOCK
        manageWakeLock('release');

        gameScreen.style.display = 'none';
        setupScreen.style.display = 'block';
        clearInterval(timerInterval); // Para o timer
    }
});