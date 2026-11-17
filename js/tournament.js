// Tournament Generator Mini Site
class Tournament {
  constructor() {
    this.tournaments = [];
    this.currentTournament = null;
    this.viewMode = 'bracket'; // 'bracket' or 'stats'
    
    // Power rankings state (for tournament creation)
    this.powerRankings = {
      offense: [],
      defense: []
    };
    this.draggedItem = null;
    this.draggedList = null;

    // Manual setup board (seed order / doubles pairings) before create
    this.setupSeedOrder = [];
    this.setupTeams = [];
    this.setupDirty = false;
    this.setupDrag = null; // { type: 'seed'|'team'|'player', ... }

    // Read-only spectator mode for shared links
    this.spectatorMode = false;
    
    this.init();
  }

  async init() {
    if (this.spectatorMode) {
      this.render();
      return;
    }
    await this.loadTournaments();
    this.render();
    this.setupEventListeners();
  }

  isInteractive() {
    return !this.spectatorMode;
  }

  getShareUrl(code) {
    const base = `${window.location.origin}${window.location.pathname}`;
    return `${base}#/personal/tournament/watch/${code}`;
  }

  async shareTournament() {
    if (!this.currentTournament || this.spectatorMode) return;
    try {
      if (!this.currentTournament.shareCode || !this.currentTournament.isPublic) {
        this.currentTournament.shareCode = api.generateShareCode();
        this.currentTournament.isPublic = true;
        const updated = await api.updateTournament(this.currentTournament, { includeShare: true });
        Object.assign(this.currentTournament, updated);
        const idx = this.tournaments.findIndex(t => t.id === this.currentTournament.id);
        if (idx >= 0) this.tournaments[idx] = this.currentTournament;
      }
      const url = this.getShareUrl(this.currentTournament.shareCode);
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        this.showMessage('Share link copied. Scan the QR code below.', 'success');
      } else {
        window.prompt('Copy this share link:', url);
      }
      this.render();
    } catch (error) {
      console.error('Error sharing tournament:', error);
      this.showMessage('Could not create share link. Run the share migration if columns are missing.', 'error');
    }
  }

  async copyShareLink() {
    if (!this.currentTournament?.shareCode) return;
    const url = this.getShareUrl(this.currentTournament.shareCode);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        this.showMessage('Share link copied to clipboard.', 'success');
      } else {
        window.prompt('Copy this share link:', url);
      }
    } catch (error) {
      console.error('Clipboard failed:', error);
      window.prompt('Copy this share link:', url);
    }
  }

  async stopSharingTournament() {
    if (!this.currentTournament || this.spectatorMode) return;
    try {
      this.currentTournament.isPublic = false;
      this.currentTournament.shareCode = null;
      const updated = await api.updateTournament(this.currentTournament, { includeShare: true });
      Object.assign(this.currentTournament, updated);
      const idx = this.tournaments.findIndex(t => t.id === this.currentTournament.id);
      if (idx >= 0) this.tournaments[idx] = this.currentTournament;
      this.showMessage('Sharing turned off.', 'success');
      this.render();
    } catch (error) {
      console.error('Error stopping share:', error);
      this.showMessage('Could not stop sharing.', 'error');
    }
  }

  renderSharePanel() {
    if (this.spectatorMode) return '';
    const code = this.currentTournament?.shareCode;
    if (!this.currentTournament?.isPublic || !code) return '';
    const url = this.getShareUrl(code);
    return `
      <div class="tournament-share-panel" id="tournament-share-panel">
        <div class="tournament-share-qr">
          <canvas id="tournament-share-qr-canvas" width="180" height="180" aria-label="QR code for tournament share link"></canvas>
        </div>
        <div class="tournament-share-meta">
          <h3 class="tournament-share-title">Share with spectators</h3>
          <p class="teams-preview-note">Anyone can scan this code or open the link to follow the bracket (read-only).</p>
          <div class="tournament-share-code">Code <strong>${this.escapeHtml(code)}</strong></div>
          <div class="tournament-share-url" title="${this.escapeAttr(url)}">${this.escapeHtml(url)}</div>
          <div class="tournament-share-actions">
            <button type="button" class="btn primary" onclick="tournament.copyShareLink()">Copy Link</button>
            <button type="button" class="btn" onclick="tournament.stopSharingTournament()">Stop Sharing</button>
          </div>
        </div>
      </div>
    `;
  }

  async paintShareQr() {
    const canvas = document.getElementById('tournament-share-qr-canvas');
    const code = this.currentTournament?.shareCode;
    if (!canvas || !code || !this.currentTournament?.isPublic) return;

    const url = this.getShareUrl(code);
    if (typeof QRCode === 'undefined' || typeof QRCode.toCanvas !== 'function') {
      canvas.replaceWith(Object.assign(document.createElement('p'), {
        className: 'teams-preview-note',
        textContent: 'QR library failed to load. Use the link instead.'
      }));
      return;
    }

    try {
      await QRCode.toCanvas(canvas, url, {
        width: 180,
        margin: 2,
        color: {
          dark: '#071018',
          light: '#ffffff'
        }
      });
    } catch (error) {
      console.error('QR render failed:', error);
    }
  }

  async openSpectator(code) {
    this.spectatorMode = true;
    this.viewMode = 'bracket';
    this.tournaments = [];
    this.currentTournament = null;
    try {
      const tournament = await api.getTournamentByShareCode(code);
      if (!tournament) {
        this.currentTournament = null;
        this.renderSpectatorMissing(code);
        return;
      }
      this.currentTournament = tournament;
      this.render();
    } catch (error) {
      console.error('Error loading shared tournament:', error);
      this.renderSpectatorMissing(code, true);
    }
  }

  renderSpectatorMissing(code, errored = false) {
    const container = document.getElementById('tournament-content');
    if (!container) return;
    container.innerHTML = `
      <div class="tournament-header">
        <h1>Shared Tournament</h1>
      </div>
      <div class="screener-empty">
        ${errored
          ? 'Couldn’t load this shared bracket. Check your connection and try again.'
          : `No public tournament found for code <strong>${this.escapeHtml(code || '')}</strong>.`}
      </div>
      <p style="margin-top:16px;">
        <a class="btn" href="#/personal/tournament">Back to Tournament</a>
      </p>
    `;
  }

  async loadTournaments() {
    try {
      this.tournaments = await api.getTournaments();
    } catch (error) {
      console.error('Error loading tournaments:', error);
      this.tournaments = [];
    }
  }

  setupEventListeners() {
    // Tournament creation form
    const form = document.getElementById('tournament-form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleCreateTournament(e));
    }

    // Participant input
    const participantInput = document.getElementById('participants');
    if (participantInput) {
      participantInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.addParticipant();
        }
      });
    }

    // Seeding mode change listener
    const seedingModeSelect = document.getElementById('seeding-mode');
    if (seedingModeSelect) {
      seedingModeSelect.addEventListener('change', (e) => this.handleSeedingModeChange(e));
    }

    // Game mode change listener
    const gameModeSelect = document.getElementById('game-mode');
    if (gameModeSelect) {
      gameModeSelect.addEventListener('change', (e) => this.handleGameModeChange(e));
    }

    // Tournament type change listener (for consolation bracket visibility)
    const typeSelect = document.getElementById('type');
    if (typeSelect) {
      typeSelect.addEventListener('change', (e) => this.handleTypeChange(e));
    }
  }

  handleTypeChange(e) {
    const type = e.target.value;
    const consolationContainer = document.getElementById('consolation-option-container');
    
    if (consolationContainer) {
      // Only show consolation option for single elimination
      consolationContainer.style.display = type === 'single-elimination' ? 'block' : 'none';
    }
  }

  handleSeedingModeChange(e) {
    const seedingMode = e.target.value;
    const rankingsContainer = document.getElementById('power-rankings-container');
    
    if (seedingMode === 'ranked') {
      // Initialize rankings with current participants
      const participants = this.getParticipants();
      this.powerRankings.offense = [...participants];
      this.powerRankings.defense = [...participants];
      
      if (rankingsContainer) {
        rankingsContainer.style.display = 'block';
        this.renderPowerRankings();
      }
    } else {
      if (rankingsContainer) {
        rankingsContainer.style.display = 'none';
      }
    }
    
    this.setupDirty = false;
    this.rebuildSetupFromMode();
  }

  handleGameModeChange(e) {
    this.setupDirty = false;
    this.rebuildSetupFromMode();
  }

  getGameMode() {
    return document.getElementById('game-mode')?.value || 'singles';
  }

  getSeedingMode() {
    return document.getElementById('seeding-mode')?.value || 'random';
  }

  // Build default seed order / doubles teams from current mode settings
  rebuildSetupFromMode() {
    const participants = this.getParticipants();
    const isDoubles = this.getGameMode() === 'doubles';
    const isRanked = this.getSeedingMode() === 'ranked';

    if (isDoubles) {
      if (isRanked && participants.length >= 2) {
        this.setupTeams = this.generateDoublesPairs();
      } else {
        this.setupTeams = this.generateRandomDoublesPairs(participants);
      }
      this.setupSeedOrder = this.setupTeams.map(t => t.players.join(' & '));
    } else {
      this.setupTeams = [];
      if (isRanked && this.powerRankings.offense.length > 0) {
        this.setupSeedOrder = this.getBalancedMatchupOrder(
          participants,
          this.powerRankings
        );
      } else {
        this.setupSeedOrder = [...participants].sort(() => Math.random() - 0.5);
      }
    }

    this.setupDirty = false;
    this.updateSetupPreview();
  }

  // Keep setup board in sync when participants are added/removed
  syncSetupWithParticipants() {
    const participants = this.getParticipants();
    const isDoubles = this.getGameMode() === 'doubles';

    if (isDoubles ? this.setupTeams.length === 0 : this.setupSeedOrder.length === 0) {
      this.rebuildSetupFromMode();
      return;
    }

    const currentMembers = (isDoubles
      ? this.setupTeams.flatMap(t => t.players)
      : this.setupSeedOrder).slice().sort().join('\0');
    const nextMembers = participants.slice().sort().join('\0');

    // No membership change — just re-render
    if (currentMembers === nextMembers) {
      this.updateSetupPreview();
      return;
    }

    // Auto mode: rebuild from seeding rules when the roster changes
    if (!this.setupDirty) {
      this.rebuildSetupFromMode();
      return;
    }

    if (isDoubles) {
      // Remove deleted players from teams
      this.setupTeams = this.setupTeams
        .map(team => ({
          ...team,
          players: team.players.filter(p => participants.includes(p))
        }))
        .filter(team => team.players.length > 0);

      // Collect players already on a team
      const assigned = new Set(this.setupTeams.flatMap(t => t.players));
      const unassigned = participants.filter(p => !assigned.has(p));

      // Fill incomplete teams first, then form new pairs
      unassigned.forEach(player => {
        const incomplete = this.setupTeams.find(t => t.players.length < 2);
        if (incomplete) {
          incomplete.players.push(player);
          incomplete.isSolo = false;
          incomplete.name = `Team ${this.setupTeams.indexOf(incomplete) + 1}`;
        } else {
          this.setupTeams.push({
            name: `Team ${this.setupTeams.length + 1}`,
            players: [player],
            isSolo: true
          });
        }
      });

      this.setupTeams.forEach((team, idx) => {
        team.name = `Team ${idx + 1}`;
        team.isSolo = team.players.length === 1;
        if (this.getSeedingMode() === 'ranked') {
          const scores = this.calculateCombinedScores();
          const scoreMap = Object.fromEntries(scores.map(s => [s.player, s.total]));
          team.combinedScore = team.players.reduce((sum, p) => sum + (scoreMap[p] || 0), 0);
        } else {
          delete team.combinedScore;
        }
      });
      this.setupSeedOrder = this.setupTeams.map(t => t.players.join(' & '));
    } else {
      this.setupSeedOrder = this.setupSeedOrder.filter(p => participants.includes(p));
      participants.forEach(p => {
        if (!this.setupSeedOrder.includes(p)) this.setupSeedOrder.push(p);
      });
    }

    this.updateSetupPreview();
  }

  shuffleSetup() {
    const participants = this.getParticipants();
    if (this.getGameMode() === 'doubles') {
      this.setupTeams = this.generateRandomDoublesPairs(participants);
      this.setupSeedOrder = this.setupTeams.map(t => t.players.join(' & '));
    } else {
      this.setupSeedOrder = [...participants].sort(() => Math.random() - 0.5);
    }
    this.setupDirty = true;
    this.updateSetupPreview();
  }

  resetSetup() {
    this.setupDirty = false;
    this.rebuildSetupFromMode();
  }

  generateRandomDoublesPairs(participants) {
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const teams = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      const teamPlayers = [shuffled[i]];
      if (shuffled[i + 1]) teamPlayers.push(shuffled[i + 1]);
      teams.push({
        name: `Team ${teams.length + 1}`,
        players: teamPlayers,
        isSolo: teamPlayers.length === 1
      });
    }
    return teams;
  }

  updateSetupPreview() {
    const container = document.getElementById('teams-preview');
    if (!container) return;

    const participants = this.getParticipants();
    const isDoubles = this.getGameMode() === 'doubles';
    const minNeeded = isDoubles ? 2 : 2;

    if (participants.length < minNeeded) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';

    if (isDoubles) {
      this.renderTeamsPreview(this.setupTeams);
    } else {
      this.renderSeedOrderPreview(this.setupSeedOrder);
    }
  }

  // Used by ranking drag handlers: refresh auto setup, or keep manual edits
  updateTeamsPreview() {
    if (!this.setupDirty) {
      this.rebuildSetupFromMode();
      return;
    }
    if (this.getGameMode() === 'doubles' && this.getSeedingMode() === 'ranked') {
      const scores = this.calculateCombinedScores();
      const scoreMap = Object.fromEntries(scores.map(s => [s.player, s.total]));
      this.setupTeams.forEach(team => {
        team.combinedScore = team.players.reduce((sum, p) => sum + (scoreMap[p] || 0), 0);
      });
    }
    this.updateSetupPreview();
  }

  addParticipant() {
    const input = document.getElementById('participants');
    const name = input.value.trim();
    if (!name) return;

    // Prevent duplicate names (breaks seeding / pairing)
    if (this.getParticipants().includes(name)) {
      this.showMessage('That participant is already added.', 'error');
      input.value = '';
      return;
    }

    const list = document.getElementById('participant-list');
    if (list) {
      const item = document.createElement('div');
      item.className = 'participant-item';
      item.innerHTML = `
        <span>${name}</span>
        <button type="button" class="btn-icon" onclick="tournament.removeParticipant(this)">×</button>
      `;
      list.appendChild(item);
      input.value = '';
      
      // Update power rankings if in ranked mode
      this.syncPowerRankingsWithParticipants();
    }
  }

  removeParticipant(button) {
    const item = button.parentElement;
    const name = item.querySelector('span').textContent.trim();
    item.remove();
    
    // Remove from power rankings
    this.powerRankings.offense = this.powerRankings.offense.filter(p => p !== name);
    this.powerRankings.defense = this.powerRankings.defense.filter(p => p !== name);
    
    // Re-render if in ranked mode
    const seedingModeSelect = document.getElementById('seeding-mode');
    if (seedingModeSelect && seedingModeSelect.value === 'ranked') {
      this.renderPowerRankings();
    }
    this.syncSetupWithParticipants();
  }

  syncPowerRankingsWithParticipants() {
    const participants = this.getParticipants();
    const seedingModeSelect = document.getElementById('seeding-mode');
    
    // Add new participants to the end of rankings
    participants.forEach(p => {
      if (!this.powerRankings.offense.includes(p)) {
        this.powerRankings.offense.push(p);
      }
      if (!this.powerRankings.defense.includes(p)) {
        this.powerRankings.defense.push(p);
      }
    });
    
    // Remove participants no longer in the list
    this.powerRankings.offense = this.powerRankings.offense.filter(p => participants.includes(p));
    this.powerRankings.defense = this.powerRankings.defense.filter(p => participants.includes(p));
    
    // Re-render if in ranked mode
    if (seedingModeSelect && seedingModeSelect.value === 'ranked') {
      this.renderPowerRankings();
    }
    this.syncSetupWithParticipants();
  }

  getParticipants() {
    const items = document.querySelectorAll('.participant-item span');
    return Array.from(items).map(item => item.textContent.trim());
  }

  // Power Rankings Methods
  renderPowerRankings() {
    const container = document.getElementById('power-rankings-lists');
    if (!container) return;

    const participants = this.getParticipants();
    if (participants.length === 0) {
      container.innerHTML = '<p class="empty-state">Add participants first to set rankings.</p>';
      return;
    }

    const offenseHtml = this.renderRankingList('offense', this.powerRankings.offense);
    const defenseHtml = this.renderRankingList('defense', this.powerRankings.defense);
    const combinedHtml = this.renderCombinedScores();

    container.innerHTML = `
      <div class="rankings-grid">
        <div class="ranking-column">
          <h4 class="ranking-title">Offense Ranking</h4>
          <div class="ranking-list" id="offense-ranking" data-list="offense">
            ${offenseHtml}
          </div>
        </div>
        <div class="ranking-column">
          <h4 class="ranking-title">Defense Ranking</h4>
          <div class="ranking-list" id="defense-ranking" data-list="defense">
            ${defenseHtml}
          </div>
        </div>
      </div>
      <div class="combined-scores">
        <h4 class="ranking-title">Combined Scores & Seeds</h4>
        ${combinedHtml}
      </div>
    `;

    // Setup drag-drop listeners
    this.setupDragDropListeners();
  }

  renderRankingList(listType, players) {
    const numPlayers = players.length;
    return players.map((player, idx) => {
      const points = numPlayers - idx; // Rank 1 gets N points, Rank N gets 1 point
      return `
        <div class="ranking-item" draggable="true" data-player="${player}" data-index="${idx}">
          <span class="ranking-position">${idx + 1}</span>
          <span class="ranking-drag-handle">≡</span>
          <span class="ranking-player-name">${player}</span>
          <span class="ranking-points">${points} pts</span>
        </div>
      `;
    }).join('');
  }

  calculateCombinedScores() {
    const participants = this.getParticipants();
    const numPlayers = participants.length;
    const scores = {};

    participants.forEach(player => {
      const offenseRank = this.powerRankings.offense.indexOf(player);
      const defenseRank = this.powerRankings.defense.indexOf(player);
      
      // Points: Rank 1 = N points, Rank 2 = N-1 points, etc.
      const offensePoints = offenseRank >= 0 ? numPlayers - offenseRank : 0;
      const defensePoints = defenseRank >= 0 ? numPlayers - defenseRank : 0;
      
      scores[player] = {
        offense: offensePoints,
        defense: defensePoints,
        total: offensePoints + defensePoints,
        offenseRank: offenseRank + 1,
        defenseRank: defenseRank + 1
      };
    });

    // Sort by total score descending
    return Object.entries(scores)
      .map(([player, data]) => ({ player, ...data }))
      .sort((a, b) => b.total - a.total);
  }

  renderCombinedScores() {
    const scores = this.calculateCombinedScores();
    
    if (scores.length === 0) {
      return '<p class="empty-state">No participants to score.</p>';
    }

    return `
      <div class="combined-scores-list">
        ${scores.map((score, idx) => `
          <div class="combined-score-item ${idx === 0 ? 'top-seed' : ''}">
            <span class="seed-number">Seed ${idx + 1}</span>
            <span class="score-player">${score.player}</span>
            <span class="score-breakdown">
              <span class="offense-score" title="Offense: Rank ${score.offenseRank}">O: ${score.offense}</span>
              <span class="defense-score" title="Defense: Rank ${score.defenseRank}">D: ${score.defense}</span>
            </span>
            <span class="total-score">${score.total} pts</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  setupDragDropListeners() {
    const lists = document.querySelectorAll('.ranking-list');
    
    lists.forEach(list => {
      const items = list.querySelectorAll('.ranking-item');
      
      items.forEach(item => {
        item.addEventListener('dragstart', (e) => this.handleDragStart(e));
        item.addEventListener('dragend', (e) => this.handleDragEnd(e));
        item.addEventListener('dragover', (e) => this.handleDragOver(e));
        item.addEventListener('drop', (e) => this.handleDrop(e));
        item.addEventListener('dragenter', (e) => this.handleDragEnter(e));
        item.addEventListener('dragleave', (e) => this.handleDragLeave(e));
      });
    });
  }

  handleDragStart(e) {
    this.draggedItem = e.target;
    this.draggedList = e.target.closest('.ranking-list').dataset.list;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', e.target.dataset.player);
  }

  handleDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.ranking-item').forEach(item => {
      item.classList.remove('drag-over');
    });
    this.draggedItem = null;
    this.draggedList = null;
  }

  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  handleDragEnter(e) {
    e.preventDefault();
    const target = e.target.closest('.ranking-item');
    if (target && target !== this.draggedItem) {
      target.classList.add('drag-over');
    }
  }

  handleDragLeave(e) {
    const target = e.target.closest('.ranking-item');
    if (target) {
      target.classList.remove('drag-over');
    }
  }

  handleDrop(e) {
    e.preventDefault();
    const target = e.target.closest('.ranking-item');
    if (!target || !this.draggedItem || target === this.draggedItem) return;

    const targetList = target.closest('.ranking-list').dataset.list;
    
    // Only allow dropping within the same list
    if (targetList !== this.draggedList) return;

    const draggedPlayer = this.draggedItem.dataset.player;
    const targetPlayer = target.dataset.player;
    
    // Get the ranking array
    const rankings = this.powerRankings[targetList];
    const draggedIdx = rankings.indexOf(draggedPlayer);
    const targetIdx = rankings.indexOf(targetPlayer);

    // Remove dragged item and insert at target position
    rankings.splice(draggedIdx, 1);
    rankings.splice(targetIdx, 0, draggedPlayer);

    // Re-render
    this.renderPowerRankings();
    this.updateTeamsPreview();
  }

  // Doubles Pairing Methods
  generateDoublesPairs() {
    const scores = this.calculateCombinedScores();
    const teams = [];
    
    if (scores.length < 2) return teams;
    
    // Pair best with worst, second best with second worst, etc.
    const numTeams = Math.floor(scores.length / 2);
    
    for (let i = 0; i < numTeams; i++) {
      const bestPlayer = scores[i];
      const worstPlayer = scores[scores.length - 1 - i];
      
      teams.push({
        name: `Team ${i + 1}`,
        players: [bestPlayer.player, worstPlayer.player],
        combinedScore: bestPlayer.total + worstPlayer.total
      });
    }
    
    // Handle odd number of players - last player gets a bye or solo team
    if (scores.length % 2 === 1) {
      const middlePlayer = scores[Math.floor(scores.length / 2)];
      teams.push({
        name: `Team ${numTeams + 1}`,
        players: [middlePlayer.player],
        combinedScore: middlePlayer.total,
        isSolo: true
      });
    }
    
    return teams;
  }

  renderSetupActions(title, note) {
    return `
      <div class="setup-preview-header">
        <h4>${title}</h4>
        <div class="setup-preview-actions">
          <button type="button" class="btn btn-sm" onclick="tournament.shuffleSetup()">Shuffle</button>
          <button type="button" class="btn btn-sm" onclick="tournament.resetSetup()">Reset</button>
        </div>
      </div>
      <p class="teams-preview-note">${note}${this.setupDirty ? ' <em>(manually adjusted)</em>' : ''}</p>
    `;
  }

  renderSeedOrderPreview(order) {
    const container = document.getElementById('teams-preview');
    if (!container) return;

    if (!order || order.length === 0) {
      container.innerHTML = `
        <h4>Bracket Order</h4>
        <p class="empty-state">Add participants to set bracket order.</p>
      `;
      return;
    }

    const isRanked = this.getSeedingMode() === 'ranked';
    const note = isRanked
      ? 'Drag to adjust who plays whom. Adjacent seeds face off (1 vs 2, 3 vs 4…). Reset restores ranked order.'
      : 'Drag to adjust who plays whom. Adjacent seeds face off (1 vs 2, 3 vs 4…). Shuffle for a new random order.';

    container.innerHTML = `
      ${this.renderSetupActions('Bracket Order', note)}
      <div class="seed-order-list" id="seed-order-list">
        ${order.map((player, idx) => {
          const matchGroup = Math.floor(idx / 2) + 1;
          const side = idx % 2 === 0 ? 'A' : 'B';
          return `
            <div class="seed-order-item" draggable="true" data-index="${idx}" data-player="${this.escapeAttr(player)}">
              <span class="seed-order-num">Seed ${idx + 1}</span>
              <span class="ranking-drag-handle" aria-hidden="true">≡</span>
              <span class="seed-order-name">${this.escapeHtml(player)}</span>
              <span class="seed-order-match">Match ${matchGroup}${side}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.setupSeedOrderListeners();
  }

  renderTeamsPreview(teams) {
    const container = document.getElementById('teams-preview');
    if (!container) return;

    if (!teams || teams.length === 0) {
      container.innerHTML = `
        <h4>Teams &amp; Seeding</h4>
        <p class="empty-state">Add at least 2 participants to form teams.</p>
      `;
      return;
    }

    const isRanked = this.getSeedingMode() === 'ranked';
    const note = isRanked
      ? 'Drag players between teams to re-pair, or drag a team card to change seed order. Reset restores ranked pairings.'
      : 'Drag players between teams to re-pair, or drag a team card to change seed order. Shuffle for new random pairs.';

    container.innerHTML = `
      ${this.renderSetupActions('Teams & Seeding', note)}
      <div class="teams-grid setup-teams-grid" id="setup-teams-grid">
        ${teams.map((team, teamIdx) => `
          <div class="team-card setup-team-card ${team.isSolo ? 'solo-team' : ''}"
               draggable="true"
               data-team-index="${teamIdx}">
            <div class="team-card-top">
              <span class="ranking-drag-handle" aria-hidden="true">≡</span>
              <div class="team-name">${this.escapeHtml(team.name)}</div>
              <span class="team-seed-label">Seed ${teamIdx + 1}</span>
            </div>
            <div class="team-players setup-team-players" data-team-index="${teamIdx}">
              ${team.players.map((p, playerIdx) => `
                <div class="team-player setup-team-player"
                     draggable="true"
                     data-team-index="${teamIdx}"
                     data-player-index="${playerIdx}"
                     data-player="${this.escapeAttr(p)}">
                  <span class="ranking-drag-handle" aria-hidden="true">≡</span>
                  <span>${this.escapeHtml(p)}</span>
                </div>
              `).join('')}
              ${team.players.length < 2 ? `
                <div class="team-player-slot" data-team-index="${teamIdx}" data-empty="true">
                  Drop player
                </div>
              ` : ''}
            </div>
            ${team.combinedScore != null ? `<div class="team-score">Combined: ${team.combinedScore} pts</div>` : ''}
          </div>
        `).join('')}
      </div>
    `;

    this.setupTeamsDragListeners();
  }

  escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  escapeAttr(str) {
    return this.escapeHtml(str).replace(/'/g, '&#39;');
  }

  setupSeedOrderListeners() {
    const list = document.getElementById('seed-order-list');
    if (!list) return;

    list.querySelectorAll('.seed-order-item').forEach(item => {
      item.addEventListener('dragstart', (e) => {
        this.setupDrag = { type: 'seed', index: Number(item.dataset.index) };
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.dataset.player);
      });
      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        list.querySelectorAll('.seed-order-item').forEach(el => el.classList.remove('drag-over'));
        this.setupDrag = null;
      });
      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });
      item.addEventListener('dragenter', (e) => {
        e.preventDefault();
        if (this.setupDrag?.type === 'seed') item.classList.add('drag-over');
      });
      item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
      item.addEventListener('drop', (e) => {
        e.preventDefault();
        item.classList.remove('drag-over');
        if (!this.setupDrag || this.setupDrag.type !== 'seed') return;
        const from = this.setupDrag.index;
        const to = Number(item.dataset.index);
        if (from === to) return;
        const [moved] = this.setupSeedOrder.splice(from, 1);
        this.setupSeedOrder.splice(to, 0, moved);
        this.setupDirty = true;
        this.updateSetupPreview();
      });
    });
  }

  setupTeamsDragListeners() {
    const grid = document.getElementById('setup-teams-grid');
    if (!grid) return;

    // Team card reorder
    grid.querySelectorAll('.setup-team-card').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        // If starting from a player, let player handler own the drag
        if (e.target.closest('.setup-team-player')) return;
        this.setupDrag = { type: 'team', teamIndex: Number(card.dataset.teamIndex) };
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', `team:${card.dataset.teamIndex}`);
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        grid.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        this.setupDrag = null;
      });
      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });
      card.addEventListener('dragenter', (e) => {
        e.preventDefault();
        if (this.setupDrag?.type === 'team' || this.setupDrag?.type === 'player') {
          card.classList.add('drag-over');
        }
      });
      card.addEventListener('dragleave', (e) => {
        if (!card.contains(e.relatedTarget)) card.classList.remove('drag-over');
      });
      card.addEventListener('drop', (e) => {
        // Exact player/slot drops are handled on those targets
        if (e.target.closest('.setup-team-player') || e.target.closest('.team-player-slot')) return;
        e.preventDefault();
        card.classList.remove('drag-over');
        if (!this.setupDrag) return;

        const to = Number(card.dataset.teamIndex);

        if (this.setupDrag.type === 'team') {
          const from = this.setupDrag.teamIndex;
          if (from === to) return;
          const [moved] = this.setupTeams.splice(from, 1);
          this.setupTeams.splice(to, 0, moved);
          this.renumberSetupTeams();
          this.setupDirty = true;
          this.updateSetupPreview();
          return;
        }

        if (this.setupDrag.type === 'player') {
          const fromTeam = this.setupDrag.teamIndex;
          const fromPlayer = this.setupDrag.playerIndex;
          if (fromTeam === to) return;
          const moved = this.setupTeams[fromTeam].players[fromPlayer];
          if (this.setupTeams[to].players.length < 2) {
            this.setupTeams[fromTeam].players.splice(fromPlayer, 1);
            this.setupTeams[to].players.push(moved);
            this.setupTeams = this.setupTeams.filter(t => t.players.length > 0);
          } else {
            // Swap with the first player on the target team
            const swapped = this.setupTeams[to].players[0];
            this.setupTeams[to].players[0] = moved;
            this.setupTeams[fromTeam].players[fromPlayer] = swapped;
          }
          this.refreshSetupTeamMeta();
          this.setupDirty = true;
          this.updateSetupPreview();
        }
      });
    });

    // Player swap / move
    const onPlayerDragStart = (el, e) => {
      e.stopPropagation();
      this.setupDrag = {
        type: 'player',
        teamIndex: Number(el.dataset.teamIndex),
        playerIndex: Number(el.dataset.playerIndex),
        player: el.dataset.player
      };
      el.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', el.dataset.player);
    };

    grid.querySelectorAll('.setup-team-player').forEach(el => {
      el.addEventListener('dragstart', (e) => onPlayerDragStart(el, e));
      el.addEventListener('dragend', () => {
        el.classList.remove('dragging');
        grid.querySelectorAll('.drag-over').forEach(node => node.classList.remove('drag-over'));
        this.setupDrag = null;
      });
      el.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
      });
      el.addEventListener('dragenter', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.setupDrag?.type === 'player') el.classList.add('drag-over');
      });
      el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
      el.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        el.classList.remove('drag-over');
        if (!this.setupDrag || this.setupDrag.type !== 'player') return;
        const fromTeam = this.setupDrag.teamIndex;
        const fromPlayer = this.setupDrag.playerIndex;
        const toTeam = Number(el.dataset.teamIndex);
        const toPlayer = Number(el.dataset.playerIndex);
        if (fromTeam === toTeam && fromPlayer === toPlayer) return;

        // Swap players between slots
        const a = this.setupTeams[fromTeam].players[fromPlayer];
        const b = this.setupTeams[toTeam].players[toPlayer];
        this.setupTeams[fromTeam].players[fromPlayer] = b;
        this.setupTeams[toTeam].players[toPlayer] = a;
        this.refreshSetupTeamMeta();
        this.setupDirty = true;
        this.updateSetupPreview();
      });
    });

    grid.querySelectorAll('.team-player-slot').forEach(slot => {
      slot.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
      });
      slot.addEventListener('dragenter', (e) => {
        e.preventDefault();
        if (this.setupDrag?.type === 'player') slot.classList.add('drag-over');
      });
      slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
      slot.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        slot.classList.remove('drag-over');
        if (!this.setupDrag || this.setupDrag.type !== 'player') return;
        const fromTeam = this.setupDrag.teamIndex;
        const fromPlayer = this.setupDrag.playerIndex;
        const toTeam = Number(slot.dataset.teamIndex);
        if (fromTeam === toTeam) return;
        if (this.setupTeams[toTeam].players.length >= 2) return;

        const [moved] = this.setupTeams[fromTeam].players.splice(fromPlayer, 1);
        this.setupTeams[toTeam].players.push(moved);

        // Drop empty teams
        this.setupTeams = this.setupTeams.filter(t => t.players.length > 0);
        this.refreshSetupTeamMeta();
        this.setupDirty = true;
        this.updateSetupPreview();
      });
    });
  }

  renumberSetupTeams() {
    this.setupTeams.forEach((team, idx) => {
      team.name = `Team ${idx + 1}`;
      team.isSolo = team.players.length === 1;
    });
    this.setupSeedOrder = this.setupTeams.map(t => t.players.join(' & '));
  }

  refreshSetupTeamMeta() {
    const isRanked = this.getSeedingMode() === 'ranked';
    let scoreMap = {};
    if (isRanked) {
      const scores = this.calculateCombinedScores();
      scoreMap = Object.fromEntries(scores.map(s => [s.player, s.total]));
    }
    this.setupTeams.forEach((team, idx) => {
      team.name = `Team ${idx + 1}`;
      team.isSolo = team.players.length === 1;
      if (isRanked) {
        team.combinedScore = team.players.reduce((sum, p) => sum + (scoreMap[p] || 0), 0);
      } else {
        delete team.combinedScore;
      }
    });
    this.setupSeedOrder = this.setupTeams.map(t => t.players.join(' & '));
  }

  async handleCreateTournament(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    const participants = this.getParticipants();
    const seedingMode = formData.get('seeding-mode') || 'random';
    const gameMode = formData.get('game-mode') || 'singles';

    // Validate participant count
    const minParticipants = gameMode === 'doubles' ? 4 : 2;
    if (participants.length < minParticipants) {
      alert(`Please add at least ${minParticipants} participants for ${gameMode} mode`);
      return;
    }

    // For doubles, validate even number of players (or handle odd)
    if (gameMode === 'doubles' && participants.length % 2 !== 0) {
      if (!confirm('Odd number of players. One team will have only 1 player. Continue?')) {
        return;
      }
    }

    // Use the (possibly manually adjusted) setup board — do not rebuild
    // here or random previews would reshuffle on create.
    let finalParticipants;
    let teams = null;
    let powerRankingsData = null;

    if (gameMode === 'doubles') {
      if (!this.setupTeams.length) {
        this.rebuildSetupFromMode();
      }
      teams = this.setupTeams.map((t, idx) => ({
        name: `Team ${idx + 1}`,
        players: [...t.players],
        isSolo: t.players.length === 1,
        ...(t.combinedScore != null ? { combinedScore: t.combinedScore } : {})
      }));
      finalParticipants = teams.map(t => t.players.join(' & '));
      if (seedingMode === 'ranked') {
        powerRankingsData = {
          offense: [...this.powerRankings.offense],
          defense: [...this.powerRankings.defense]
        };
      }
    } else {
      if (!this.setupSeedOrder.length) {
        this.rebuildSetupFromMode();
      }
      finalParticipants = [...this.setupSeedOrder];
      if (seedingMode === 'ranked') {
        powerRankingsData = {
          offense: [...this.powerRankings.offense],
          defense: [...this.powerRankings.defense]
        };
      }
    }

    // Get consolation option (only for single elimination)
    const hasConsolation = formData.get('type') === 'single-elimination' && 
                           document.getElementById('consolation-bracket')?.checked || false;

    const tournament = {
      name: formData.get('name'),
      type: formData.get('type'),
      seedingMode: seedingMode,
      gameMode: gameMode,
      hasConsolation: hasConsolation,
      participants: participants,
      finalParticipants: finalParticipants,
      teams: teams,
      powerRankings: powerRankingsData,
      // Preserve the order from the setup board (already shuffled / ranked / manually set)
      bracket: this.generateBracket(
        finalParticipants,
        formData.get('type'),
        seedingMode,
        powerRankingsData,
        hasConsolation,
        { preserveOrder: true }
      ),
      createdAt: new Date().toISOString()
    };

    try {
      const created = await api.createTournament(tournament);
      await this.loadTournaments();
      
      // Reset creation state
      this.powerRankings = { offense: [], defense: [] };
      this.setupSeedOrder = [];
      this.setupTeams = [];
      this.setupDirty = false;
      
      this.viewTournament(created.id);
      this.showMessage('Tournament created!', 'success');
    } catch (error) {
      console.error('Error creating tournament:', error);
      this.showMessage('Error creating tournament.', 'error');
    }
  }

  generateBracket(participants, type, seedingMode = 'random', powerRankings = null, hasConsolation = false, options = {}) {
    let orderedParticipants;
    
    if (options.preserveOrder) {
      orderedParticipants = [...participants];
    } else if (seedingMode === 'ranked' && powerRankings) {
      // Order by combined scores for balanced matchups
      orderedParticipants = this.getBalancedMatchupOrder(participants, powerRankings);
    } else {
      // Random shuffle
      orderedParticipants = [...participants].sort(() => Math.random() - 0.5);
    }
    
    if (type === 'single-elimination') {
      return this.generateSingleElimination(orderedParticipants, hasConsolation);
    } else if (type === 'round-robin') {
      return this.generateRoundRobin(orderedParticipants);
    } else {
      return this.generateDoubleElimination(orderedParticipants);
    }
  }

  // Get participant order that minimizes power difference in matchups
  getBalancedMatchupOrder(participants, powerRankings) {
    // Calculate scores for each participant
    const numPlayers = powerRankings.offense.length;
    const scores = {};
    
    participants.forEach(p => {
      // For team names like "Player A & Player B", calculate combined team score
      const playerNames = p.split(' & ');
      let totalScore = 0;
      
      playerNames.forEach(name => {
        const offenseRank = powerRankings.offense.indexOf(name);
        const defenseRank = powerRankings.defense.indexOf(name);
        const offensePoints = offenseRank >= 0 ? numPlayers - offenseRank : 0;
        const defensePoints = defenseRank >= 0 ? numPlayers - defenseRank : 0;
        totalScore += offensePoints + defensePoints;
      });
      
      scores[p] = totalScore;
    });

    // Sort by score descending
    const sorted = [...participants].sort((a, b) => scores[b] - scores[a]);
    
    // Arrange for balanced matchups: pair adjacent seeds
    // For 8 players sorted [1,2,3,4,5,6,7,8] by strength:
    // We want matchups: 1v2, 3v4, 5v6, 7v8 (minimizing power difference)
    // So the order should be: [1,2,3,4,5,6,7,8] (already sorted)
    
    return sorted;
  }

  generateSingleElimination(participants, hasConsolation = false) {
    const rounds = [];
    
    // First round only - subsequent rounds will be created dynamically
    const firstRound = [];
    for (let i = 0; i < participants.length; i += 2) {
      firstRound.push({
        id: `match-r0-${firstRound.length}`,
        player1: participants[i],
        player2: participants[i + 1] || 'BYE',
        winner: null,
        round: 0,
        matchNum: firstRound.length + 1,
        bracket: 'winners'
      });
    }

    rounds.push(firstRound);

    // Calculate how many rounds we'll need
    let numParticipants = participants.length;
    let numRounds = Math.ceil(Math.log2(numParticipants));
    
    // Create empty subsequent rounds with TBD players
    for (let roundNum = 1; roundNum < numRounds; roundNum++) {
      const numMatches = Math.ceil(rounds[roundNum - 1].length / 2);
      const nextRound = [];
      for (let i = 0; i < numMatches; i++) {
        nextRound.push({
          id: `match-r${roundNum}-${i}`,
          player1: 'TBD',
          player2: 'TBD',
          winner: null,
          round: roundNum,
          matchNum: i + 1,
          bracket: 'winners'
        });
      }
      rounds.push(nextRound);
    }

    const result = { rounds, type: 'single-elimination' };

    // Generate consolation bracket if enabled
    if (hasConsolation && numRounds >= 2) {
      result.consolation = this.generateConsolationBracket(numRounds, numParticipants);
      result.hasConsolation = true;
    }

    return result;
  }

  // Generate consolation bracket for placement matches
  // Structure: Each main bracket round's losers play for placement
  // - Semifinal losers → 3rd place match
  // - Quarterfinal losers → 5th-8th placement (2 matches for 5th/7th)
  // - etc.
  generateConsolationBracket(numRounds, numParticipants) {
    const consolation = {
      rounds: [],
      placementLabels: {} // Maps round index to placement description
    };

    // For each round of the main bracket (except the final), 
    // create consolation matches for that round's losers
    // We work backwards from semifinals to earlier rounds
    
    // Semifinal losers (round numRounds-2) → 3rd place match
    // Quarterfinal losers (round numRounds-3) → 5th-8th placement
    // etc.

    let currentPlacement = 3; // Start at 3rd place

    for (let mainRound = numRounds - 2; mainRound >= 0; mainRound--) {
      // Number of matches in this main bracket round determines number of losers
      const numLosersFromRound = Math.ceil(Math.pow(2, numRounds - mainRound - 1));
      
      // For 3rd place match (semifinal losers), we just need 1 match
      // For 5th-8th (quarterfinal losers with 4 losers), we need:
      //   - 2 matches for 5th/7th semifinals
      //   - Then 1 match for 5th place, 1 match for 7th place
      
      if (mainRound === numRounds - 2) {
        // Semifinal losers → single 3rd place match
        const consolationRound = [{
          id: `consolation-3rd-place`,
          player1: 'TBD',
          player2: 'TBD',
          winner: null,
          round: consolation.rounds.length,
          matchNum: 1,
          bracket: 'consolation',
          placementFor: '3rd Place',
          sourceRound: mainRound
        }];
        consolation.rounds.push(consolationRound);
        consolation.placementLabels[consolation.rounds.length - 1] = '3rd Place Match';
        currentPlacement = 5;
      } else if (numLosersFromRound >= 2) {
        // For earlier rounds, create placement matches
        // E.g., 4 QF losers: 2 semifinal matches → 5th place final + 7th place final
        
        const numMatchesNeeded = Math.floor(numLosersFromRound / 2);
        
        // First, create the "semifinal" matches for this placement level
        const placementSemis = [];
        for (let i = 0; i < numMatchesNeeded; i++) {
          placementSemis.push({
            id: `consolation-r${consolation.rounds.length}-m${i}`,
            player1: 'TBD',
            player2: 'TBD',
            winner: null,
            round: consolation.rounds.length,
            matchNum: i + 1,
            bracket: 'consolation',
            placementFor: `${currentPlacement}th-${currentPlacement + numLosersFromRound - 1}th`,
            sourceRound: mainRound
          });
        }
        consolation.rounds.push(placementSemis);
        consolation.placementLabels[consolation.rounds.length - 1] = `${this.getOrdinal(currentPlacement)}-${this.getOrdinal(currentPlacement + numLosersFromRound - 1)} Placement`;

        // If we have 4+ losers, create final matches for placement
        if (numMatchesNeeded >= 2) {
          // Winners of placement semis play for higher placement (e.g., 5th)
          // Losers of placement semis play for lower placement (e.g., 7th)
          const placementFinals = [];
          
          // Higher placement final (e.g., 5th place)
          placementFinals.push({
            id: `consolation-${currentPlacement}th-place`,
            player1: 'TBD',
            player2: 'TBD',
            winner: null,
            round: consolation.rounds.length,
            matchNum: 1,
            bracket: 'consolation',
            placementFor: `${this.getOrdinal(currentPlacement)} Place`,
            isPlacementFinal: true,
            placementRank: currentPlacement
          });
          
          // Lower placement final (e.g., 7th place)
          placementFinals.push({
            id: `consolation-${currentPlacement + 2}th-place`,
            player1: 'TBD',
            player2: 'TBD',
            winner: null,
            round: consolation.rounds.length,
            matchNum: 2,
            bracket: 'consolation',
            placementFor: `${this.getOrdinal(currentPlacement + 2)} Place`,
            isPlacementFinal: true,
            placementRank: currentPlacement + 2
          });
          
          consolation.rounds.push(placementFinals);
          consolation.placementLabels[consolation.rounds.length - 1] = `${this.getOrdinal(currentPlacement)} & ${this.getOrdinal(currentPlacement + 2)} Place`;
        }
        
        currentPlacement += numLosersFromRound;
      }
    }

    return consolation;
  }

  // Helper to get ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
  getOrdinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  generateRoundRobin(participants) {
    const matches = [];
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        matches.push({
          id: `match-${i}-${j}`,
          player1: participants[i],
          player2: participants[j],
          winner: null,
          round: 0,
          matchNum: matches.length + 1
        });
      }
    }
    return { rounds: [matches], type: 'round-robin' };
  }

  generateDoubleElimination(participants) {
    const winners = this.generateSingleElimination(participants);
    const losers = this.generateLosersBracket(participants.length);
    return { winners, losers, type: 'double-elimination' };
  }

  generateLosersBracket(numParticipants) {
    const rounds = [];
    const numWinnersRounds = Math.ceil(Math.log2(numParticipants));
    
    // Losers bracket structure for double elimination:
    // - LR0: Losers from WR0 play each other
    // - For each winners bracket round wRound (1 to numWinnersRounds-1):
    //   - "Major" round: LR winners play against WR losers
    //   - "Minor" round: LR winners play each other - only if not last
    //
    // For non-power-of-2 participants, we need to handle byes properly:
    // - Count actual losers from WR0 (excluding BYE matches)
    // - If odd number of losers, one gets a bye directly to LR1
    
    // Calculate number of actual losers from WR0
    // If numParticipants is odd, one WR0 match has a BYE, so that "loser" doesn't count
    const numWR0Matches = Math.ceil(numParticipants / 2);
    const numActualLosersFromWR0 = Math.floor(numParticipants / 2);
    
    // LR0 matches = floor(actualLosers / 2) - if odd, one loser bypasses to LR1
    const firstLosersRoundMatches = Math.floor(numActualLosersFromWR0 / 2);
    const hasLR0Bye = (numActualLosersFromWR0 % 2 === 1);
    
    // Track bye info for later use in advanceLoser
    const byeInfo = {
      hasLR0Bye,
      numActualLosersFromWR0,
      // The loser from the LAST WR0 match (highest matchNum with real loser) gets the bye
      // They will be routed directly to LR1 instead of LR0
      lr0ByeMatchNum: hasLR0Bye ? numActualLosersFromWR0 : null
    };
    
    const firstRound = [];
    for (let i = 0; i < firstLosersRoundMatches; i++) {
      firstRound.push({
        id: `losers-r0-${i}`,
        player1: 'TBD',
        player2: 'TBD',
        winner: null,
        round: 0,
        matchNum: i + 1,
        bracket: 'losers'
      });
    }
    rounds.push(firstRound);

    // Generate subsequent losers bracket rounds
    // After LR0, the number of players advancing includes:
    // - LR0 winners (firstLosersRoundMatches)
    // - Plus the bye recipient if hasLR0Bye
    let currentRoundSize = firstLosersRoundMatches + (hasLR0Bye ? 1 : 0);
    let roundNum = 1;
    
    // For each winners bracket round (1 to numWinnersRounds-1), create corresponding losers bracket rounds
    for (let wRound = 1; wRound < numWinnersRounds; wRound++) {
      // Calculate how many losers will come from this winners bracket round
      // For non-power-of-2, we need to account for BYE matches in WR
      const numWRMatches = Math.ceil(Math.pow(2, numWinnersRounds - wRound - 1));
      
      // "Major" round: LB players face WB losers
      // The number of matches is the max of LB players coming in and WB losers coming in
      const numLBPlayersFromPrevRound = currentRoundSize;
      const numMatches = Math.max(numLBPlayersFromPrevRound, numWRMatches);
      
      const nextRound = [];
      for (let i = 0; i < numMatches; i++) {
        nextRound.push({
          id: `losers-r${roundNum}-${i}`,
          player1: 'TBD',
          player2: 'TBD',
          winner: null,
          round: roundNum,
          matchNum: i + 1,
          bracket: 'losers'
        });
      }
      rounds.push(nextRound);
      currentRoundSize = numMatches;
      roundNum++;
      
      // "Minor" round: Winners from the major round play each other
      // Only create if not the last winners bracket round (losers finals doesn't need a minor round after)
      if (wRound < numWinnersRounds - 1) {
        const numMatches2 = Math.ceil(currentRoundSize / 2);
        const nextRound2 = [];
        for (let i = 0; i < numMatches2; i++) {
          nextRound2.push({
            id: `losers-r${roundNum}-${i}`,
            player1: 'TBD',
            player2: 'TBD',
            winner: null,
            round: roundNum,
            matchNum: i + 1,
            bracket: 'losers'
          });
        }
        rounds.push(nextRound2);
        currentRoundSize = numMatches2;
        roundNum++;
      }
    }

    return { rounds, type: 'losers', byeInfo };
  }

  async viewTournament(id) {
    this.spectatorMode = false;
    this.currentTournament = this.tournaments.find(t => t.id === id);
    this.viewMode = 'bracket';
    this.render();
  }

  // Helper method that looks up the match and gets the player by index (0 or 1)
  // This avoids issues with special characters in player names in onclick handlers
  async recordMatchResultByIndex(matchId, playerIndex) {
    console.log('recordMatchResultByIndex called:', matchId, playerIndex);
    if (this.spectatorMode) return;
    if (!this.currentTournament) {
      console.error('No current tournament');
      return;
    }
    
    const match = this.findMatchById(matchId);
    if (!match) {
      console.error('Match not found:', matchId);
      console.log('Bracket structure:', JSON.stringify(this.currentTournament.bracket, null, 2));
      return;
    }
    
    const winner = playerIndex === 0 ? match.player1 : match.player2;
    console.log('Recording winner:', winner);
    return this.recordMatchResult(matchId, winner);
  }

  findMatchById(matchId) {
    if (!this.currentTournament) return null;
    
    const searchRounds = (rounds) => {
      if (!rounds) return null;
      for (const round of rounds) {
        for (const match of round) {
          if (match.id === matchId) return match;
        }
      }
      return null;
    };

    const bracket = this.currentTournament.bracket;
    
    if (bracket.type === 'double-elimination') {
      // Check grand finals first
      if (bracket.grandFinal2) {
        for (const match of bracket.grandFinal2) {
          if (match.id === matchId) return match;
        }
      }
      if (bracket.grandFinal) {
        for (const match of bracket.grandFinal) {
          if (match.id === matchId) return match;
        }
      }
      // Check brackets
      let found = searchRounds(bracket.winners?.rounds);
      if (found) return found;
      return searchRounds(bracket.losers?.rounds);
    } else if (bracket.winners) {
      // For brackets stored with winners sub-object
      return searchRounds(bracket.winners.rounds);
    } else if (bracket.rounds) {
      // For single-elimination and round-robin stored directly
      let found = searchRounds(bracket.rounds);
      if (found) return found;
      
      // Check consolation bracket if exists
      if (bracket.consolation?.rounds) {
        return searchRounds(bracket.consolation.rounds);
      }
    }
    
    return null;
  }

  async recordMatchResult(matchId, winner) {
    if (!this.currentTournament) return;

    const updateMatch = (rounds, bracketType) => {
      for (const round of rounds) {
        for (const match of round) {
          if (match.id === matchId) {
            match.winner = winner;
            
            // Handle double elimination
            if (this.currentTournament.bracket.type === 'double-elimination') {
              if (bracketType === 'winners') {
                // Advance winner to next winners bracket round
                this.advanceWinner(match, rounds);
                // Advance loser to losers bracket (pass byeInfo for proper bye handling)
                const byeInfo = this.currentTournament.bracket.losers.byeInfo;
                this.advanceLoser(match, this.currentTournament.bracket.winners.rounds, this.currentTournament.bracket.losers.rounds, byeInfo);
              } else if (bracketType === 'losers') {
                // Advance winner to next losers bracket round
                this.advanceWinner(match, rounds);
                // Loser is eliminated (no further advancement)
              }
            } else if (bracketType === 'consolation') {
              // Consolation match - advance winners/losers to next consolation round
              this.advanceConsolationWinner(match, rounds);
            } else {
              // Single elimination - advance winner
              this.advanceWinner(match, rounds);
              
              // If consolation bracket exists, advance loser to it
              if (this.currentTournament.bracket.consolation) {
                this.advanceLoserToConsolation(match, rounds);
              }
            }
            return true;
          }
        }
      }
      return false;
    };

    if (this.currentTournament.bracket.type === 'double-elimination') {
      // Check grand final matches first
      if (this.currentTournament.bracket.grandFinal2) {
        for (const match of this.currentTournament.bracket.grandFinal2) {
          if (match.id === matchId) {
            match.winner = winner;
            // Grand final 2 winner is the tournament winner - no further advancement needed
            try {
              await api.updateTournament(this.currentTournament);
              await this.loadTournaments();
              this.render();
            } catch (error) {
              console.error('Error updating tournament:', error);
            }
            return;
          }
        }
      }
      if (this.currentTournament.bracket.grandFinal) {
        for (const match of this.currentTournament.bracket.grandFinal) {
          if (match.id === matchId) {
            match.winner = winner;
            // If losers bracket champion wins, create grand final 2
            const winnersChampion = this.getBracketChampion(this.currentTournament.bracket.winners.rounds);
            if (winner !== winnersChampion && !this.currentTournament.bracket.grandFinal2) {
              this.currentTournament.bracket.grandFinal2 = [{
                id: 'grand-final-2',
                player1: winnersChampion,
                player2: winner,
                winner: null,
                round: 0,
                matchNum: 1,
                bracket: 'grand-final'
              }];
            }
            try {
              await api.updateTournament(this.currentTournament);
              await this.loadTournaments();
              this.render();
            } catch (error) {
              console.error('Error updating tournament:', error);
            }
            return;
          }
        }
      }
      // Check winners bracket
      let found = updateMatch(this.currentTournament.bracket.winners.rounds, 'winners');
      if (!found) {
        // Check losers bracket
        updateMatch(this.currentTournament.bracket.losers.rounds, 'losers');
      }
    } else if (this.currentTournament.bracket.winners) {
      updateMatch(this.currentTournament.bracket.winners.rounds, 'winners');
    } else {
      // Single elimination - check main bracket first
      let found = updateMatch(this.currentTournament.bracket.rounds, 'single');
      
      // If not found and consolation exists, check consolation bracket
      if (!found && this.currentTournament.bracket.consolation?.rounds) {
        updateMatch(this.currentTournament.bracket.consolation.rounds, 'consolation');
      }
    }

    try {
      await api.updateTournament(this.currentTournament);
      await this.loadTournaments();
      this.render();
    } catch (error) {
      console.error('Error updating tournament:', error);
    }
  }

  // Advance loser from main bracket to consolation bracket
  advanceLoserToConsolation(match, mainRounds) {
    if (!match.winner) return;
    
    const loser = match.winner === match.player1 ? match.player2 : match.player1;
    if (!loser || loser === 'BYE' || loser === 'TBD') return;

    const consolation = this.currentTournament.bracket.consolation;
    if (!consolation?.rounds) return;

    const numMainRounds = mainRounds.length;
    const mainRound = match.round;
    
    // Find the corresponding consolation round for this loser
    // Semifinal losers (round numMainRounds-2) → 3rd place match (consolation round 0)
    // Quarterfinal losers → 5th-8th placement rounds
    
    if (mainRound === numMainRounds - 2) {
      // Semifinal loser → 3rd place match
      const thirdPlaceMatch = consolation.rounds[0]?.[0];
      if (thirdPlaceMatch) {
        if (thirdPlaceMatch.player1 === 'TBD') {
          thirdPlaceMatch.player1 = loser;
        } else if (thirdPlaceMatch.player2 === 'TBD') {
          thirdPlaceMatch.player2 = loser;
        }
      }
    } else if (mainRound < numMainRounds - 2) {
      // Earlier round losers go to placement rounds
      // Find the consolation round that corresponds to this main round
      let consolationRoundIdx = 1; // Start after 3rd place match
      
      for (let r = numMainRounds - 3; r >= 0; r--) {
        if (r === mainRound) {
          // Found the right consolation round for this main bracket round's losers
          const targetRound = consolation.rounds[consolationRoundIdx];
          if (targetRound) {
            // Find an empty slot in this round
            for (const m of targetRound) {
              if (m.player1 === 'TBD') {
                m.player1 = loser;
                return;
              } else if (m.player2 === 'TBD') {
                m.player2 = loser;
                return;
              }
            }
          }
          break;
        }
        // Each main round contributes 1-2 consolation rounds
        consolationRoundIdx += (consolation.rounds[consolationRoundIdx + 1]?.length > 0 && 
                               consolation.rounds[consolationRoundIdx + 1][0]?.isPlacementFinal) ? 2 : 1;
      }
    }
  }

  // Advance winner in consolation bracket
  advanceConsolationWinner(match, consolationRounds) {
    if (!match.winner) return;
    
    const loser = match.winner === match.player1 ? match.player2 : match.player1;
    const winner = match.winner;
    
    // Check if this match feeds into placement finals
    const currentRound = match.round;
    const nextRound = consolationRounds[currentRound + 1];
    
    if (nextRound && nextRound.length > 0) {
      // Check if next round has placement finals (5th place, 7th place, etc.)
      const hasPlacementFinals = nextRound.some(m => m.isPlacementFinal);
      
      if (hasPlacementFinals) {
        // Winners go to higher placement final (5th place)
        // Losers go to lower placement final (7th place)
        const higherPlacementMatch = nextRound.find(m => m.isPlacementFinal && m.matchNum === 1);
        const lowerPlacementMatch = nextRound.find(m => m.isPlacementFinal && m.matchNum === 2);
        
        if (higherPlacementMatch) {
          if (higherPlacementMatch.player1 === 'TBD') {
            higherPlacementMatch.player1 = winner;
          } else if (higherPlacementMatch.player2 === 'TBD') {
            higherPlacementMatch.player2 = winner;
          }
        }
        
        if (lowerPlacementMatch && loser && loser !== 'TBD' && loser !== 'BYE') {
          if (lowerPlacementMatch.player1 === 'TBD') {
            lowerPlacementMatch.player1 = loser;
          } else if (lowerPlacementMatch.player2 === 'TBD') {
            lowerPlacementMatch.player2 = loser;
          }
        }
      } else {
        // Regular consolation advancement (like standard bracket progression)
        this.advanceWinner(match, consolationRounds);
      }
    }
    // If no next round, this was a final placement match - no advancement needed
  }

  advanceWinner(match, rounds) {
    if (match.round + 1 >= rounds.length) return;
    
    const currentRound = rounds[match.round];
    const nextRound = rounds[match.round + 1];
    
    let nextMatchIndex;
    let usePlayer1;
    
    // Check if next round has same number of matches (1:1 mapping for losers bracket "major" rounds)
    if (nextRound.length === currentRound.length) {
      // 1:1 mapping: Each winner goes to corresponding match in next round
      // Winner goes to player1 (player2 will be filled by WB loser via advanceLoser)
      nextMatchIndex = match.matchNum - 1;
      usePlayer1 = true;
    } else {
      // 2:1 mapping (standard halving): Match 1&2 → Match 1, Match 3&4 → Match 2, etc.
      nextMatchIndex = Math.ceil(match.matchNum / 2) - 1;
      // Odd match numbers go to player1, even go to player2
      usePlayer1 = (match.matchNum % 2 === 1);
    }
    
    if (nextMatchIndex >= 0 && nextMatchIndex < nextRound.length) {
      const nextMatch = nextRound[nextMatchIndex];
      if (usePlayer1) {
        nextMatch.player1 = match.winner;
      } else {
        nextMatch.player2 = match.winner;
      }
    }
  }

  advanceLoser(match, winnersRounds, losersRounds, byeInfo = null) {
    if (!match.winner) return;
    
    const loser = match.winner === match.player1 ? match.player2 : match.player1;
    console.log(`advanceLoser: match ${match.id}, winner=${match.winner}, player1=${match.player1}, player2=${match.player2}, loser=${loser}`);
    if (!loser || loser === 'BYE' || loser === 'TBD') return;

    const winnersRound = match.round;
    const numWinnersRounds = winnersRounds.length;
    
    // Determine which losers bracket round this loser should go to
    // For WR0 with bye handling:
    // - If hasLR0Bye and this is the bye recipient (last actual loser), send to LR1
    // - Otherwise, send to LR0
    // For later rounds: Winners Round N → Losers Round (2*N - 1) for N >= 1
    
    let losersRoundIndex;
    if (winnersRound === 0) {
      // Check if this loser should get a bye (skip LR0, go directly to LR1)
      // The bye goes to the loser from the highest-numbered WR0 match with a real opponent
      if (byeInfo && byeInfo.hasLR0Bye) {
        // Calculate which WR0 match number should get the bye
        // The bye recipient is the loser from WR0 match with matchNum = numActualLosersFromWR0
        // (e.g., for 6 players with 3 actual losers, the loser from match 3 gets the bye)
        if (match.matchNum === byeInfo.numActualLosersFromWR0) {
          // This loser gets a bye - send directly to LR1
          losersRoundIndex = 1;
          console.log(`Bye: Loser ${loser} from WR0 match ${match.matchNum} bypasses LR0, going to LR1`);
        } else {
          losersRoundIndex = 0;
        }
      } else {
        losersRoundIndex = 0;
      }
    } else {
      // For winners round N (N >= 1), losers go to losers round (2*N - 1)
      losersRoundIndex = (winnersRound * 2) - 1;
    }
    
    // Validate that the round exists
    if (losersRoundIndex < 0 || losersRoundIndex >= losersRounds.length) {
      console.warn(`Losers bracket round ${losersRoundIndex} doesn't exist for winners round ${winnersRound}`);
      // Try to find any available slot as fallback
      for (let i = losersRounds.length - 1; i >= 0; i--) {
        const round = losersRounds[i];
        for (const m of round) {
          if (m.player1 === 'TBD' || m.player2 === 'TBD') {
            if (m.player1 === 'TBD') {
              m.player1 = loser;
            } else {
              m.player2 = loser;
            }
            return;
          }
        }
      }
      return;
    }
    
    const targetLosersRound = losersRounds[losersRoundIndex];
    if (!targetLosersRound || targetLosersRound.length === 0) {
      console.warn(`Losers bracket round ${losersRoundIndex} is empty`);
      return;
    }
    
    // Find an available match in this round
    if (winnersRound === 0 && losersRoundIndex === 0) {
      // For LR0, pair losers from adjacent winners matches
      // Match 1&2 → losers match 1, Match 3&4 → losers match 2, etc.
      const matchIndex = Math.floor((match.matchNum - 1) / 2);
      if (matchIndex >= 0 && matchIndex < targetLosersRound.length) {
        const targetMatch = targetLosersRound[matchIndex];
        // Check that this loser isn't already in the match (prevent duplicates)
        if (targetMatch.player1 === loser || targetMatch.player2 === loser) {
          console.warn(`Loser ${loser} already in losers match, skipping`);
          return;
        }
        if (targetMatch.player1 === 'TBD') {
          targetMatch.player1 = loser;
        } else if (targetMatch.player2 === 'TBD') {
          targetMatch.player2 = loser;
        }
      } else {
        // Fallback for LR0
        for (const m of targetLosersRound) {
          if (m.player1 === 'TBD') {
            m.player1 = loser;
            break;
          } else if (m.player2 === 'TBD') {
            m.player2 = loser;
            break;
          }
        }
      }
    } else if (winnersRound === 0 && losersRoundIndex === 1) {
      // Bye recipient going directly to LR1
      // Place in player1 slot (they're the "seed" coming in with the bye)
      // Find the last available match in LR1 for the bye recipient
      const numLR0Matches = losersRounds[0].length;
      // The bye recipient should go to the match after where LR0 winners go
      // If LR0 has N matches, LR1 should have N+1 players coming in (N winners + 1 bye)
      // So the bye recipient goes to the last slot
      const targetMatchIndex = numLR0Matches; // 0-indexed, so this is match numLR0Matches+1
      if (targetMatchIndex < targetLosersRound.length) {
        const targetMatch = targetLosersRound[targetMatchIndex];
        if (targetMatch.player1 === 'TBD') {
          targetMatch.player1 = loser;
        } else if (targetMatch.player2 === 'TBD') {
          targetMatch.player2 = loser;
        }
      } else {
        // Fallback: find any available slot in LR1
        for (const m of targetLosersRound) {
          if (m.player1 === 'TBD') {
            m.player1 = loser;
            break;
          } else if (m.player2 === 'TBD') {
            m.player2 = loser;
            break;
          }
        }
      }
    } else {
      // For later rounds (WR1+), use match index mapping
      // WR match N loser → LR match N (same index)
      // The WB loser goes to player2 because player1 is the LB winner from previous round
      
      const matchIndex = match.matchNum - 1;
      
      if (matchIndex >= 0 && matchIndex < targetLosersRound.length) {
        const targetMatch = targetLosersRound[matchIndex];
        // WB loser goes to player2 (player1 is the LB winner from advanceWinner)
        if (targetMatch.player2 === 'TBD') {
          targetMatch.player2 = loser;
        } else if (targetMatch.player1 === 'TBD') {
          // Fallback: if player2 is already filled, use player1
          targetMatch.player1 = loser;
        }
      } else {
        // Fallback: if calculated index is out of bounds, find any available slot
        for (const m of targetLosersRound) {
          if (m.player2 === 'TBD') {
            m.player2 = loser;
            break;
          } else if (m.player1 === 'TBD') {
            m.player1 = loser;
            break;
          }
        }
      }
    }
  }

  // Extract unique participant names from bracket matches (for older tournaments)
  extractParticipantsFromBracket() {
    if (!this.currentTournament || !this.currentTournament.bracket) {
      return this.currentTournament?.participants || [];
    }

    const participants = new Set();
    
    const extractFromRounds = (rounds) => {
      if (!rounds) return;
      rounds.forEach(round => {
        round.forEach(match => {
          if (match.player1 && match.player1 !== 'TBD' && match.player1 !== 'BYE') {
            participants.add(match.player1);
          }
          if (match.player2 && match.player2 !== 'TBD' && match.player2 !== 'BYE') {
            participants.add(match.player2);
          }
        });
      });
    };

    const bracket = this.currentTournament.bracket;
    
    if (bracket.type === 'double-elimination') {
      extractFromRounds(bracket.winners?.rounds);
      extractFromRounds(bracket.losers?.rounds);
    } else if (bracket.winners) {
      extractFromRounds(bracket.winners.rounds);
    } else if (bracket.rounds) {
      extractFromRounds(bracket.rounds);
    }

    return Array.from(participants);
  }

  getTournamentStats() {
    if (!this.currentTournament) return null;

    const stats = {};
    
    // Get participant list - use finalParticipants if available, otherwise derive from bracket
    let participantList = this.currentTournament.finalParticipants;
    
    if (!participantList) {
      // For older tournaments without finalParticipants, extract from bracket
      participantList = this.extractParticipantsFromBracket();
    }
    
    participantList.forEach(p => {
      if (p && p !== 'TBD' && p !== 'BYE') {
        stats[p] = { wins: 0, losses: 0, matches: 0 };
      }
    });

    const processMatches = (rounds) => {
      rounds.forEach(round => {
        round.forEach(match => {
          if (match.winner && stats[match.winner]) {
            stats[match.winner].wins++;
            stats[match.winner].matches++;
            const loser = match.winner === match.player1 ? match.player2 : match.player1;
            if (loser && loser !== 'BYE' && stats[loser]) {
              stats[loser].losses++;
              stats[loser].matches++;
            }
          }
        });
      });
    };

    if (this.currentTournament.bracket.type === 'double-elimination') {
      // Process winners bracket
      processMatches(this.currentTournament.bracket.winners.rounds);
      // Process losers bracket
      processMatches(this.currentTournament.bracket.losers.rounds);
      // Process grand final(s)
      if (this.currentTournament.bracket.grandFinal) {
        this.currentTournament.bracket.grandFinal.forEach(match => {
          if (match.winner && stats[match.winner]) {
            stats[match.winner].wins++;
            stats[match.winner].matches++;
            const loser = match.winner === match.player1 ? match.player2 : match.player1;
            if (loser && loser !== 'BYE' && stats[loser]) {
              stats[loser].losses++;
              stats[loser].matches++;
            }
          }
        });
      }
      if (this.currentTournament.bracket.grandFinal2) {
        this.currentTournament.bracket.grandFinal2.forEach(match => {
          if (match.winner && stats[match.winner]) {
            stats[match.winner].wins++;
            stats[match.winner].matches++;
            const loser = match.winner === match.player1 ? match.player2 : match.player1;
            if (loser && loser !== 'BYE' && stats[loser]) {
              stats[loser].losses++;
              stats[loser].matches++;
            }
          }
        });
      }
    } else if (this.currentTournament.bracket.winners) {
      processMatches(this.currentTournament.bracket.winners.rounds);
    } else {
      processMatches(this.currentTournament.bracket.rounds);
      // Include consolation bracket matches if exists
      if (this.currentTournament.bracket.consolation?.rounds) {
        processMatches(this.currentTournament.bracket.consolation.rounds);
      }
    }

    return Object.entries(stats)
      .map(([player, stat]) => ({
        player,
        ...stat,
        winRate: stat.matches > 0 ? ((stat.wins / stat.matches) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate);
  }

  // Get matches that are ready to be played (both players determined, no winner yet)
  getNowPlayingMatches() {
    if (!this.currentTournament) return null;

    const result = {
      winners: [],
      losers: [],
      grandFinal: null,
      grandFinal2: null,
      consolation: [],
      roundRobin: []
    };

    const findReadyMatches = (rounds, bracketType = 'winners') => {
      const ready = [];
      if (!rounds) return ready;
      
      for (const round of rounds) {
        for (const match of round) {
          // Match is ready if both players are determined and no winner yet
          const player1Ready = match.player1 && match.player1 !== 'TBD';
          const player2Ready = match.player2 && match.player2 !== 'TBD' && match.player2 !== 'BYE';
          const notFinished = !match.winner;
          
          if (player1Ready && player2Ready && notFinished) {
            ready.push({
              ...match,
              bracketType
            });
          }
        }
      }
      return ready;
    };

    const bracket = this.currentTournament.bracket;

    if (bracket.type === 'round-robin') {
      result.roundRobin = findReadyMatches(bracket.rounds, 'round-robin');
    } else if (bracket.type === 'double-elimination') {
      result.winners = findReadyMatches(bracket.winners?.rounds, 'winners');
      result.losers = findReadyMatches(bracket.losers?.rounds, 'losers');
      
      // Check grand final
      if (bracket.grandFinal && bracket.grandFinal[0]) {
        const gf = bracket.grandFinal[0];
        if (gf.player1 && gf.player1 !== 'TBD' && gf.player2 && gf.player2 !== 'TBD' && !gf.winner) {
          result.grandFinal = gf;
        }
      }
      // Check grand final 2
      if (bracket.grandFinal2 && bracket.grandFinal2[0]) {
        const gf2 = bracket.grandFinal2[0];
        if (gf2.player1 && gf2.player1 !== 'TBD' && gf2.player2 && gf2.player2 !== 'TBD' && !gf2.winner) {
          result.grandFinal2 = gf2;
        }
      }
    } else {
      // Single elimination
      result.winners = findReadyMatches(bracket.rounds, 'winners');
      
      // Check consolation bracket
      if (bracket.consolation?.rounds) {
        result.consolation = findReadyMatches(bracket.consolation.rounds, 'consolation');
      }
    }

    return result;
  }

  // Render the "Now Playing" section
  renderNowPlaying() {
    const nowPlaying = this.getNowPlayingMatches();
    if (!nowPlaying) return '';

    const hasWinners = nowPlaying.winners.length > 0;
    const hasLosers = nowPlaying.losers.length > 0;
    const hasGrandFinal = nowPlaying.grandFinal !== null;
    const hasGrandFinal2 = nowPlaying.grandFinal2 !== null;
    const hasConsolation = nowPlaying.consolation.length > 0;
    const hasRoundRobin = nowPlaying.roundRobin.length > 0;
    
    const hasAnyMatches = hasWinners || hasLosers || hasGrandFinal || hasGrandFinal2 || hasConsolation || hasRoundRobin;
    
    if (!hasAnyMatches) {
      return '';
    }

    const renderMatchPill = (match, label = '') => {
      const escapedPlayer1 = this.escapeForAttr(match.player1);
      const escapedPlayer2 = this.escapeForAttr(match.player2);
      return `
        <div class="now-playing-match">
          ${label ? `<span class="now-playing-label">${label}</span>` : ''}
          <span class="now-playing-player">${escapedPlayer1}</span>
          <span class="now-playing-vs">vs</span>
          <span class="now-playing-player">${escapedPlayer2}</span>
        </div>
      `;
    };

    let html = '<div class="now-playing-container">';
    html += '<div class="now-playing-header">Now playing</div>';
    html += '<div class="now-playing-brackets">';

    // Grand Final 2 (highest priority)
    if (hasGrandFinal2) {
      html += `
        <div class="now-playing-section grand-final">
          <div class="now-playing-section-title">Grand final 2</div>
          <div class="now-playing-matches">
            ${renderMatchPill(nowPlaying.grandFinal2)}
          </div>
        </div>
      `;
    }
    // Grand Final
    else if (hasGrandFinal) {
      html += `
        <div class="now-playing-section grand-final">
          <div class="now-playing-section-title">Grand final</div>
          <div class="now-playing-matches">
            ${renderMatchPill(nowPlaying.grandFinal)}
          </div>
        </div>
      `;
    }

    // Winners Bracket
    if (hasWinners) {
      html += `
        <div class="now-playing-section winners">
          <div class="now-playing-section-title">Winners bracket</div>
          <div class="now-playing-matches">
            ${nowPlaying.winners.map(m => renderMatchPill(m)).join('')}
          </div>
        </div>
      `;
    }

    // Losers Bracket
    if (hasLosers) {
      html += `
        <div class="now-playing-section losers">
          <div class="now-playing-section-title">Losers bracket</div>
          <div class="now-playing-matches">
            ${nowPlaying.losers.map(m => renderMatchPill(m)).join('')}
          </div>
        </div>
      `;
    }

    // Consolation Bracket
    if (hasConsolation) {
      html += `
        <div class="now-playing-section consolation">
          <div class="now-playing-section-title">Placement matches</div>
          <div class="now-playing-matches">
            ${nowPlaying.consolation.map(m => renderMatchPill(m, m.placementFor || '')).join('')}
          </div>
        </div>
      `;
    }

    // Round Robin
    if (hasRoundRobin) {
      html += `
        <div class="now-playing-section round-robin">
          <div class="now-playing-section-title">Round robin</div>
          <div class="now-playing-matches">
            ${nowPlaying.roundRobin.map(m => renderMatchPill(m)).join('')}
          </div>
        </div>
      `;
    }

    html += '</div></div>';
    return html;
  }

  getTournamentProgress() {
    if (!this.currentTournament) return { completed: 0, total: 0, percentage: 0 };

    let total = 0;
    let completed = 0;

    const processMatches = (rounds) => {
      rounds.forEach(round => {
        round.forEach(match => {
          total++;
          if (match.winner) completed++;
        });
      });
    };

    if (this.currentTournament.bracket.type === 'double-elimination') {
      // Process winners bracket
      processMatches(this.currentTournament.bracket.winners.rounds);
      // Process losers bracket
      processMatches(this.currentTournament.bracket.losers.rounds);
      // Process grand final(s)
      if (this.currentTournament.bracket.grandFinal) {
        this.currentTournament.bracket.grandFinal.forEach(match => {
          total++;
          if (match.winner) completed++;
        });
      }
      if (this.currentTournament.bracket.grandFinal2) {
        this.currentTournament.bracket.grandFinal2.forEach(match => {
          total++;
          if (match.winner) completed++;
        });
      }
    } else if (this.currentTournament.bracket.winners) {
      processMatches(this.currentTournament.bracket.winners.rounds);
    } else {
      processMatches(this.currentTournament.bracket.rounds);
      // Include consolation bracket matches if exists
      if (this.currentTournament.bracket.consolation?.rounds) {
        processMatches(this.currentTournament.bracket.consolation.rounds);
      }
    }

    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }

  getWinner() {
    if (!this.currentTournament) return null;

    // For round robin, return current leader based on stats (even if not 100% complete)
    if (this.currentTournament.bracket.type === 'round-robin') {
      const stats = this.getTournamentStats();
      if (stats && stats.length > 0) {
        // Return the current leader (player with best win rate)
        // Only return null if no matches have been played yet
        const hasPlayedMatches = stats.some(stat => stat.matches > 0);
        if (hasPlayedMatches) {
          return stats[0].player; // Player with most wins (sorted by wins then win rate)
        }
      }
      return null;
    }

    // For double elimination, check grand final(s)
    if (this.currentTournament.bracket.type === 'double-elimination') {
      // Check grand final 2 first (if it exists and has a winner)
      if (this.currentTournament.bracket.grandFinal2 && this.currentTournament.bracket.grandFinal2[0]?.winner) {
        return this.currentTournament.bracket.grandFinal2[0].winner;
      }
      // Check grand final 1 (only if winners bracket champion won)
      if (this.currentTournament.bracket.grandFinal && this.currentTournament.bracket.grandFinal[0]?.winner) {
        const winnersChampion = this.getBracketChampion(this.currentTournament.bracket.winners.rounds);
        // If winners bracket champion won grand final 1, they're the winner
        if (this.currentTournament.bracket.grandFinal[0].winner === winnersChampion) {
          return winnersChampion;
        }
        // Otherwise, need grand final 2
        return null;
      }
      return null;
    }

    const rounds = this.currentTournament.bracket.winners 
      ? this.currentTournament.bracket.winners.rounds 
      : this.currentTournament.bracket.rounds;
    
    if (rounds.length === 0) return null;
    
    const finalRound = rounds[rounds.length - 1];
    const finalMatch = finalRound[0];
    return finalMatch?.winner || null;
  }

  async deleteTournament(id) {
    if (!confirm('Delete this tournament?')) return;

    try {
      await api.deleteTournament(id);
      await this.loadTournaments();
      this.currentTournament = null;
      this.render();
      this.showMessage('Tournament deleted.', 'success');
    } catch (error) {
      console.error('Error deleting tournament:', error);
    }
  }

  showMessage(message, type = 'info') {
    const messageEl = document.getElementById('tournament-message');
    if (messageEl) {
      messageEl.textContent = message;
      messageEl.className = `message message-${type}`;
      messageEl.style.display = 'block';
      setTimeout(() => {
        messageEl.style.display = 'none';
      }, 3000);
    }
  }

  // Helper to escape player names for use in onclick handlers
  escapeForJs(str) {
    if (!str) return '';
    return str
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '&quot;')
      .replace(/&/g, '&amp;');
  }

  // Helper to escape player names for HTML attribute values
  escapeForAttr(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/'/g, '&#39;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Setup click handlers for bracket matches using event delegation
  setupBracketClickHandlers(container) {
    if (this.spectatorMode) return;
    container.addEventListener('click', (e) => {
      // Find the clicked bracket-player or match-player element
      const playerEl = e.target.closest('[data-match-id][data-clickable="true"]');
      if (!playerEl) return;
      
      const matchId = playerEl.dataset.matchId;
      const playerIndex = parseInt(playerEl.dataset.playerIndex, 10);
      
      console.log('Bracket click detected:', matchId, playerIndex);
      this.recordMatchResultByIndex(matchId, playerIndex);
    });
  }

  renderVisualBracket(bracket) {
    if (!bracket || bracket.type === 'round-robin') {
      return this.renderRoundRobinBracket(bracket);
    }

    const rounds = bracket.winners ? bracket.winners.rounds : bracket.rounds;
    
    // Filter to only show rounds that are ready (first round or previous round is complete)
    const visibleRounds = [];
    rounds.forEach((round, roundIdx) => {
      const shouldShowRound = roundIdx === 0 || this.isRoundComplete(rounds[roundIdx - 1]);
      if (shouldShowRound) {
        visibleRounds.push({ round, roundIdx });
      }
    });
    
    const numVisibleRounds = visibleRounds.length;
    if (numVisibleRounds === 0) return '<div class="visual-bracket"></div>';
    
    let html = '<div class="visual-bracket">';
    
    visibleRounds.forEach(({ round, roundIdx }) => {
      const roundWidth = 100 / numVisibleRounds;
      
      html += `
        <div class="bracket-round-visual" style="width: ${roundWidth}%">
          <div class="round-label">${roundIdx === rounds.length - 1 ? 'Final' : roundIdx === rounds.length - 2 ? 'Semifinal' : `Round ${roundIdx + 1}`}</div>
          <div class="round-matches" data-round="${roundIdx}">
      `;

      round.forEach((match, matchIdx) => {
        // Allow clicking if at least one player is determined (not TBD) and match isn't finished
        // This enables progression when a match has one determined player and one TBD
        const player1Determined = match.player1 !== 'TBD' && match.player1 !== null;
        const player2Determined = match.player2 !== 'TBD' && match.player2 !== null && match.player2 !== 'BYE';
        const canClickPlayer1 = this.isInteractive() && player1Determined && !match.winner;
        const canClickPlayer2 = this.isInteractive() && player2Determined && !match.winner;
        
        // Escape player names for display
        const escapedPlayer1 = this.escapeForAttr(match.player1);
        const escapedPlayer2 = this.escapeForAttr(match.player2);
        
        const cursorStyle1 = canClickPlayer1 ? 'cursor: pointer;' : 'cursor: default; opacity: 0.6;';
        const cursorStyle2 = canClickPlayer2 ? 'cursor: pointer;' : 'cursor: default; opacity: 0.6;';
        
        html += `
          <div class="bracket-match">
            <div class="bracket-player ${match.winner === match.player1 ? 'winner' : ''}" 
                 data-match-id="${match.id}" data-player-index="0" ${canClickPlayer1 ? 'data-clickable="true"' : ''} style="${cursorStyle1}">
              ${escapedPlayer1 || 'TBD'}
            </div>
            <div class="bracket-vs">vs</div>
            <div class="bracket-player ${match.winner === match.player2 ? 'winner' : ''}" 
                 data-match-id="${match.id}" data-player-index="1" ${canClickPlayer2 ? 'data-clickable="true"' : ''} style="${cursorStyle2}">
              ${escapedPlayer2 || 'TBD'}
            </div>
            ${roundIdx < rounds.length - 1 && this.isRoundComplete(round) ? '<div class="bracket-connector"></div>' : ''}
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    return html;
  }

  isRoundComplete(round) {
    if (!round || round.length === 0) return false;
    return round.every(match => match.winner !== null);
  }

  renderRoundRobinBracket(bracket) {
    if (!bracket || !bracket.rounds || bracket.rounds.length === 0) return '';
    
    return `
      <div class="round-robin-bracket">
        ${bracket.rounds[0].map(match => {
          const escapedPlayer1 = this.escapeForAttr(match.player1);
          const escapedPlayer2 = this.escapeForAttr(match.player2);
          const canClick1 = this.isInteractive() && !match.winner;
          const canClick2 = this.isInteractive() && !match.winner;
          return `
          <div class="match">
            <div class="match-players">
              <button class="match-player ${match.winner === match.player1 ? 'winner' : ''}" 
                      data-match-id="${match.id}" data-player-index="0" ${canClick1 ? 'data-clickable="true"' : ''}>
                ${escapedPlayer1}
              </button>
              <span class="vs">vs</span>
              <button class="match-player ${match.winner === match.player2 ? 'winner' : ''}" 
                      data-match-id="${match.id}" data-player-index="1" ${canClick2 ? 'data-clickable="true"' : ''}>
                ${escapedPlayer2}
              </button>
            </div>
          </div>
        `}).join('')}
      </div>
    `;
  }

  renderBracket(bracket) {
    if (!bracket) return '';

    if (bracket.type === 'round-robin') {
      return this.renderRoundRobinBracket(bracket);
    }

    if (bracket.type === 'double-elimination') {
      return this.renderDoubleEliminationBracket(bracket);
    }

    // Single elimination (possibly with consolation)
    let html = this.renderVisualBracket(bracket);
    
    if (bracket.consolation?.rounds) {
      html += this.renderConsolationBracket(bracket.consolation);
    }
    
    return html;
  }

  renderConsolationBracket(consolation) {
    if (!consolation?.rounds || consolation.rounds.length === 0) return '';
    
    let html = '<div class="consolation-bracket-container">';
    html += '<h3 class="bracket-section-title consolation-title">Placement Matches</h3>';
    html += '<div class="consolation-bracket">';
    
    consolation.rounds.forEach((round, roundIdx) => {
      const label = consolation.placementLabels[roundIdx] || `Placement Round ${roundIdx + 1}`;
      
      html += `
        <div class="consolation-round">
          <div class="consolation-round-label">${label}</div>
          <div class="consolation-matches">
      `;
      
      round.forEach(match => {
        const player1Determined = match.player1 !== 'TBD' && match.player1 !== null;
        const player2Determined = match.player2 !== 'TBD' && match.player2 !== null && match.player2 !== 'BYE';
        const canClickPlayer1 = this.isInteractive() && player1Determined && !match.winner;
        const canClickPlayer2 = this.isInteractive() && player2Determined && !match.winner;
        
        const escapedPlayer1 = this.escapeForAttr(match.player1);
        const escapedPlayer2 = this.escapeForAttr(match.player2);
        
        const cursorStyle1 = canClickPlayer1 ? 'cursor: pointer;' : 'cursor: default; opacity: 0.6;';
        const cursorStyle2 = canClickPlayer2 ? 'cursor: pointer;' : 'cursor: default; opacity: 0.6;';
        
        html += `
          <div class="bracket-match consolation-match ${match.isPlacementFinal ? 'placement-final' : ''}">
            ${match.placementFor ? `<div class="match-placement-label">${match.placementFor}</div>` : ''}
            <div class="bracket-player ${match.winner === match.player1 ? 'winner' : ''}" 
                 data-match-id="${match.id}" data-player-index="0" ${canClickPlayer1 ? 'data-clickable="true"' : ''} style="${cursorStyle1}">
              ${escapedPlayer1 || 'TBD'}
            </div>
            <div class="bracket-vs">vs</div>
            <div class="bracket-player ${match.winner === match.player2 ? 'winner' : ''}" 
                 data-match-id="${match.id}" data-player-index="1" ${canClickPlayer2 ? 'data-clickable="true"' : ''} style="${cursorStyle2}">
              ${escapedPlayer2 || 'TBD'}
            </div>
          </div>
        `;
      });
      
      html += `
          </div>
        </div>
      `;
    });
    
    html += '</div></div>';
    return html;
  }

  renderDoubleEliminationBracket(bracket) {
    if (!bracket || !bracket.winners || !bracket.losers) return '';
    
    let html = '<div class="double-elimination-container">';
    
    // Render Winners Bracket
    html += '<div class="bracket-section">';
    html += '<h3 class="bracket-section-title">Winners Bracket</h3>';
    html += this.renderVisualBracket(bracket.winners);
    html += '</div>';
    
    // Render Losers Bracket
    html += '<div class="bracket-section">';
    html += '<h3 class="bracket-section-title">Losers Bracket</h3>';
    html += this.renderVisualBracket(bracket.losers);
    html += '</div>';
    
    // Render Grand Final if both brackets have champions
    const winnersChampion = this.getBracketChampion(bracket.winners.rounds);
    const losersChampion = this.getBracketChampion(bracket.losers.rounds);
    
    if (winnersChampion && losersChampion) {
      html += '<div class="bracket-section grand-final">';
      html += '<h3 class="bracket-section-title">Grand Final</h3>';
      
      // Check if grand final exists in bracket, if not create it
      if (!bracket.grandFinal) {
        bracket.grandFinal = [{
          id: 'grand-final-1',
          player1: winnersChampion,
          player2: losersChampion,
          winner: null,
          round: 0,
          matchNum: 1,
          bracket: 'grand-final'
        }];
      }
      
      const grandFinal = bracket.grandFinal[0];
      const canClickPlayer1 = this.isInteractive() && grandFinal.player1 && !grandFinal.winner;
      const canClickPlayer2 = this.isInteractive() && grandFinal.player2 && !grandFinal.winner;
      const escapedGF1 = this.escapeForAttr(grandFinal.player1);
      const escapedGF2 = this.escapeForAttr(grandFinal.player2);
      
      html += `
        <div class="bracket-match grand-final-match">
          <div class="bracket-player ${grandFinal.winner === grandFinal.player1 ? 'winner' : ''}" 
               data-match-id="${grandFinal.id}" data-player-index="0" ${canClickPlayer1 ? 'data-clickable="true"' : ''}
               style="${canClickPlayer1 ? 'cursor: pointer;' : 'cursor: default; opacity: 0.6;'}">
            ${escapedGF1 || 'TBD'}
          </div>
          <div class="bracket-vs">vs</div>
          <div class="bracket-player ${grandFinal.winner === grandFinal.player2 ? 'winner' : ''}" 
               data-match-id="${grandFinal.id}" data-player-index="1" ${canClickPlayer2 ? 'data-clickable="true"' : ''}
               style="${canClickPlayer2 ? 'cursor: pointer;' : 'cursor: default; opacity: 0.6;'}">
            ${escapedGF2 || 'TBD'}
          </div>
        </div>
      `;
      
      // Check if second grand final is needed (if losers bracket champion won first grand final)
      if (grandFinal.winner === losersChampion && !bracket.grandFinal2) {
        bracket.grandFinal2 = [{
          id: 'grand-final-2',
          player1: winnersChampion,
          player2: losersChampion,
          winner: null,
          round: 0,
          matchNum: 1,
          bracket: 'grand-final'
        }];
      }
      
      if (bracket.grandFinal2) {
        const grandFinal2 = bracket.grandFinal2[0];
        const canClickPlayer1_2 = this.isInteractive() && grandFinal2.player1 && !grandFinal2.winner;
        const canClickPlayer2_2 = this.isInteractive() && grandFinal2.player2 && !grandFinal2.winner;
        const escapedGF2_1 = this.escapeForAttr(grandFinal2.player1);
        const escapedGF2_2 = this.escapeForAttr(grandFinal2.player2);
        
        html += '<h4 class="bracket-section-subtitle">Grand Final 2 (if needed)</h4>';
        html += `
          <div class="bracket-match grand-final-match">
            <div class="bracket-player ${grandFinal2.winner === grandFinal2.player1 ? 'winner' : ''}" 
                 data-match-id="${grandFinal2.id}" data-player-index="0" ${canClickPlayer1_2 ? 'data-clickable="true"' : ''}
                 style="${canClickPlayer1_2 ? 'cursor: pointer;' : 'cursor: default; opacity: 0.6;'}">
              ${escapedGF2_1 || 'TBD'}
            </div>
            <div class="bracket-vs">vs</div>
            <div class="bracket-player ${grandFinal2.winner === grandFinal2.player2 ? 'winner' : ''}" 
                 data-match-id="${grandFinal2.id}" data-player-index="1" ${canClickPlayer2_2 ? 'data-clickable="true"' : ''}
                 style="${canClickPlayer2_2 ? 'cursor: pointer;' : 'cursor: default; opacity: 0.6;'}">
              ${escapedGF2_2 || 'TBD'}
            </div>
          </div>
        `;
      }
      
      html += '</div>';
    }
    
    html += '</div>';
    return html;
  }

  getBracketChampion(rounds) {
    if (!rounds || rounds.length === 0) return null;
    const finalRound = rounds[rounds.length - 1];
    if (!finalRound || finalRound.length === 0) return null;
    const finalMatch = finalRound[0];
    return finalMatch.winner || null;
  }

  render() {
    const container = document.getElementById('tournament-content');
    if (!container) return;

    if (this.currentTournament) {
      const progress = this.getTournamentProgress();
      const stats = this.getTournamentStats();
      const winner = this.getWinner();

      const gameMode = this.currentTournament.gameMode || 'singles';
      const seedingMode = this.currentTournament.seedingMode || 'random';
      const isShared = !!(this.currentTournament.isPublic && this.currentTournament.shareCode);
      const shareActions = this.spectatorMode
        ? `<span class="tournament-badge live-share">Spectator</span>`
        : `
            <button class="btn" type="button" onclick="tournament.shareTournament()">${isShared ? 'Show QR / Copy' : 'Share'}</button>
            ${isShared ? `<button class="btn" type="button" onclick="tournament.stopSharingTournament()">Stop Sharing</button>` : ''}
          `;
      const ownerOnlyActions = this.spectatorMode
        ? ''
        : `
            <button class="btn" onclick="tournament.currentTournament = null; tournament.spectatorMode = false; tournament.render();">Back to List</button>
            <button class="btn" onclick="tournament.deleteTournament('${this.currentTournament.id}')">Delete</button>
          `;
      
      container.innerHTML = `
        <div class="tournament-header">
          <div>
            <h2>${this.escapeHtml(this.currentTournament.name)}</h2>
            <div class="tournament-badges">
              <span class="tournament-type">${this.currentTournament.type}</span>
              <span class="tournament-badge ${gameMode}">${gameMode === 'doubles' ? 'Doubles' : 'Singles'}</span>
              <span class="tournament-badge ${seedingMode}">${seedingMode === 'ranked' ? 'Ranked' : 'Random'}</span>
              ${this.currentTournament.hasConsolation ? '<span class="tournament-badge consolation">Consolation</span>' : ''}
              ${isShared && !this.spectatorMode ? `<span class="tournament-badge live-share">Shared · ${this.escapeHtml(this.currentTournament.shareCode)}</span>` : ''}
              ${this.spectatorMode ? '<span class="tournament-badge live-share">Live view</span>' : ''}
            </div>
            ${this.spectatorMode ? '<p class="teams-preview-note">Read-only bracket. Results update when the host refreshes their share.</p>' : ''}
          </div>
          <div class="tournament-header-actions">
            <button class="btn ${this.viewMode === 'bracket' ? 'active' : ''}" onclick="tournament.viewMode = 'bracket'; tournament.render();">Bracket</button>
            <button class="btn ${this.viewMode === 'stats' ? 'active' : ''}" onclick="tournament.viewMode = 'stats'; tournament.render();">Stats</button>
            ${this.currentTournament.teams ? `<button class="btn ${this.viewMode === 'teams' ? 'active' : ''}" onclick="tournament.viewMode = 'teams'; tournament.render();">Teams</button>` : ''}
            ${shareActions}
            ${ownerOnlyActions}
          </div>
        </div>

        <div id="tournament-message" class="message" style="display:none;"></div>

        ${isShared && !this.spectatorMode ? this.renderSharePanel() : ''}

        ${winner ? `
          <div class="tournament-winner">
            <div class="winner-crown">Champion</div>
            <h3>${this.currentTournament.bracket.type === 'round-robin' ? 'Current Leader' : 'Winner'}: ${winner}</h3>
          </div>
        ` : ''}

        ${this.renderNowPlaying()}

        ${this.viewMode === 'stats' ? `
          <div class="tournament-stats-view">
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Progress</div>
                <div class="stat-value">${progress.percentage}%</div>
                <div class="stat-detail">${progress.completed} / ${progress.total} matches</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Participants</div>
                <div class="stat-value">${this.currentTournament.participants.length}</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Type</div>
                <div class="stat-value">${this.currentTournament.type.replace('-', ' ')}</div>
              </div>
            </div>

            <div class="tournament-leaderboard">
              <h3>Leaderboard</h3>
              <div class="leaderboard-list">
                ${stats ? stats.map((stat, idx) => `
                  <div class="leaderboard-item ${idx === 0 ? 'first' : ''}">
                    <div class="leaderboard-rank">${idx + 1}</div>
                    <div class="leaderboard-player">${stat.player}</div>
                    <div class="leaderboard-stats">
                      <span>W: ${stat.wins}</span>
                      <span>L: ${stat.losses}</span>
                      <span>Win Rate: ${stat.winRate}%</span>
                    </div>
                  </div>
                `).join('') : ''}
              </div>
            </div>
          </div>
        ` : this.viewMode === 'teams' && this.currentTournament.teams ? `
          <div class="tournament-teams-view">
            <h3>Teams</h3>
            ${this.currentTournament.powerRankings ? `
              <p class="teams-info">Teams were formed by pairing highest-ranked players with lowest-ranked players for balanced competition.</p>
            ` : `
              <p class="teams-info">Teams were randomly paired.</p>
            `}
            <div class="teams-grid-view">
              ${this.currentTournament.teams.map((team, idx) => `
                <div class="team-card-view ${team.isSolo ? 'solo-team' : ''}">
                  <div class="team-header">
                    <span class="team-name-view">${team.name}</span>
                    ${team.combinedScore ? `<span class="team-score-view">${team.combinedScore} pts</span>` : ''}
                  </div>
                  <div class="team-players-view">
                    ${team.players.map(p => `
                      <div class="team-player-card">
                        <span class="player-name">${p}</span>
                        ${this.currentTournament.powerRankings ? `
                          <span class="player-ranks">
                            O: #${this.currentTournament.powerRankings.offense.indexOf(p) + 1} 
                            D: #${this.currentTournament.powerRankings.defense.indexOf(p) + 1}
                          </span>
                        ` : ''}
                      </div>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : `
          <div class="bracket-container">
            ${this.renderBracket(this.currentTournament.bracket)}
          </div>
        `}
      `;
      
      // Setup click handlers for bracket matches using event delegation
      this.setupBracketClickHandlers(container);
      this.paintShareQr();
    } else {
      container.innerHTML = `
        <div class="tournament-header">
          <h1>Tournament</h1>
        </div>

        <div id="tournament-message" class="message" style="display:none;"></div>

        <form id="tournament-form" class="tournament-form">
          <div class="form-group">
            <label for="name">Tournament Name</label>
            <input type="text" id="name" name="name" placeholder="e.g., 2024 Championship" required>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="type">Bracket Type</label>
              <select id="type" name="type" required>
                <option value="single-elimination">Single Elimination</option>
                <option value="double-elimination">Double Elimination</option>
                <option value="round-robin">Round Robin</option>
              </select>
            </div>
            <div class="form-group">
              <label for="game-mode">Game Mode</label>
              <select id="game-mode" name="game-mode">
                <option value="singles">Singles</option>
                <option value="doubles">Doubles (Pairs)</option>
              </select>
            </div>
            <div class="form-group">
              <label for="seeding-mode">Seeding Mode</label>
              <select id="seeding-mode" name="seeding-mode">
                <option value="random">Random</option>
                <option value="ranked">Ranked (Power Rankings)</option>
              </select>
            </div>
          </div>

          <!-- Consolation Bracket Option (only for single elimination) -->
          <div id="consolation-option-container" class="form-group consolation-option">
            <label class="checkbox-label">
              <input type="checkbox" id="consolation-bracket" name="consolation-bracket">
              <span class="checkbox-text">Enable Consolation Bracket</span>
            </label>
            <p class="form-help-text">Adds placement matches for 3rd place, 5th/6th place, etc.</p>
          </div>

          <div class="form-group">
            <label for="participants">Add Participants</label>
            <div class="participant-input-group">
              <input type="text" id="participants" placeholder="Enter participant name and press Enter">
              <button type="button" class="btn" onclick="tournament.addParticipant()">Add</button>
            </div>
            <div id="participant-list" class="participant-list"></div>
          </div>

          <!-- Power Rankings Section (hidden by default) -->
          <div id="power-rankings-container" class="power-rankings-container" style="display: none;">
            <h3 class="power-rankings-title">Power Rankings</h3>
            <p class="power-rankings-desc">Drag players to adjust their offense and defense rankings. Combined scores determine seeding.</p>
            <div id="power-rankings-lists"></div>
          </div>

          <!-- Setup board: bracket order (singles) or teams & seeding (doubles) -->
          <div id="teams-preview" class="teams-preview" style="display: none;"></div>

          <button type="submit" class="btn primary">Create Tournament</button>
        </form>

        <div class="tournament-list">
          <h2 class="tournament-list-title">Your Tournaments</h2>
          ${this.tournaments.length === 0
            ? '<p class="empty-state">No tournaments yet. Create one above!</p>'
            : this.tournaments.map(t => {
                // Calculate progress for this tournament
                let total = 0;
                let completed = 0;
                const processMatches = (rounds) => {
                  rounds.forEach(round => {
                    round.forEach(match => {
                      total++;
                      if (match.winner) completed++;
                    });
                  });
                };
                if (t.bracket && t.bracket.winners) {
                  processMatches(t.bracket.winners.rounds);
                } else if (t.bracket && t.bracket.rounds) {
                  processMatches(t.bracket.rounds);
                }
                const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                
                const gameMode = t.gameMode || 'singles';
                const seedingMode = t.seedingMode || 'random';
                
                return `
                  <div class="tournament-card">
                    <div>
                      <h4>${t.name}</h4>
                      <div class="tournament-card-meta">
                        <span class="tournament-meta">${t.type} • ${t.participants.length} participants</span>
                        <div class="tournament-card-badges">
                          ${gameMode === 'doubles' ? '<span class="badge badge-doubles">Doubles</span>' : ''}
                          ${seedingMode === 'ranked' ? '<span class="badge badge-ranked">Ranked</span>' : ''}
                          ${t.hasConsolation ? '<span class="badge badge-consolation">Consolation</span>' : ''}
                        </div>
                      </div>
                      ${total > 0 ? `<div class="tournament-progress-bar"><div class="tournament-progress-fill" style="width: ${percentage}%"></div></div>` : ''}
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                      <button class="btn" onclick="tournament.viewTournament('${t.id}')">View</button>
                      <button class="btn" onclick="tournament.deleteTournament('${t.id}')" style="background: rgba(239, 68, 68, 0.15); border-color: var(--danger); color: var(--danger); padding: 8px 12px; font-size: 13px;" title="Delete tournament">×</button>
                    </div>
                  </div>
                `;
              }).join('')
          }
        </div>
      `;

      this.setupEventListeners();
    }
  }
}

// Export tournament instance
const tournament = new Tournament();
