/* ============================================================
   PulseNet Player — player controller
   ============================================================ */

(function () {
  'use strict';

  // ---- Channel ID from URL query param ----
  var params    = new URLSearchParams(window.location.search);
  var channelId = params.get('channelId') || '';

  function uploadsPlaylistId(chId) {
    if (!chId || chId.length < 2) return '';
    return 'UU' + chId.slice(2);
  }

  // ---- State ----
  var player           = null;
  var playerReady      = false;
  var pendingPlaylist  = null;
  var pendingVideoId   = null;
  var activeBtn        = null;
  var liveStreamActive = false; // true when #player is a raw live_stream iframe

  // PulseNet Broadcasting main channel — used by the top-left "live" button.
  // We resolve the current broadcast via the live_stream embed URL so restarts
  // automatically follow the new videoId instead of breaking on past-broadcasts.
  var PULSENET_LIVE_CHANNEL = 'UCIMaIJsfJEMi5yJIe5nAb0g';

  // ---- Idle logo ----
  var idleLogo = document.getElementById('idle-logo');

  function showIdleLogo() {
    if (idleLogo) idleLogo.classList.remove('hidden');
  }

  function hideIdleLogo() {
    if (idleLogo) idleLogo.classList.add('hidden');
  }

  // ---- Station icon hover preview ----
  var previewWrap    = document.getElementById('station-preview');
  var previewImg     = document.getElementById('station-preview-img');
  var previewHideTimer = null;

  function showPreview(iconSrc) {
    if (!previewWrap || !previewImg || !iconSrc) return;
    // Cancel any pending hide so moving between buttons doesn't flicker
    if (previewHideTimer) { clearTimeout(previewHideTimer); previewHideTimer = null; }
    previewImg.src = iconSrc;
    previewWrap.classList.remove('hidden');
    requestAnimationFrame(function () {
      previewWrap.classList.add('visible');
    });
  }

  function hidePreview() {
    if (!previewWrap) return;
    previewWrap.classList.remove('visible');
    previewHideTimer = setTimeout(function () {
      previewWrap.classList.add('hidden');
      previewHideTimer = null;
    }, 200);
  }

  // ---- Build station buttons from stations.js config ----
  var stations = window.STATIONS || [];

  function buildButtons() {
    var leftCol  = document.getElementById('stations-left');
    var rightCol = document.getElementById('stations-right');
    if (!leftCol || !rightCol) return;

    stations.forEach(function (s) {
      var btn = document.createElement('button');
      btn.className = 'station-btn';
      btn.dataset.stationId = s.id;

      if (s.icon) {
        var img = document.createElement('img');
        img.src = s.icon;
        img.alt = s.label;
        img.draggable = false;
        btn.appendChild(img);
      } else {
        // Placeholder: generic icon + station number
        var icon = document.createElement('div');
        icon.className = 'station-placeholder';
        icon.textContent = '\uD83D\uDCFB'; // 📻
        btn.appendChild(icon);

        var num = document.createElement('div');
        num.className = 'station-num';
        num.textContent = s.slot;
        btn.appendChild(num);
      }

      btn.addEventListener('click', function () {
        activateStation(s, btn);
      });

      if (s.icon) {
        var previewSrc = s.live ? s.icon : (function (path) {
          var slash = path.lastIndexOf('/');
          return path.slice(0, slash + 1) + 'Offline_' + path.slice(slash + 1);
        })(s.icon);
        btn.addEventListener('mouseenter', function () { showPreview(previewSrc); });
        btn.addEventListener('mouseleave', hidePreview);
      }

      (s.side === 'left' ? leftCol : rightCol).appendChild(btn);
    });
  }

  function activateStation(station, btn) {
    if (activeBtn) activeBtn.classList.remove('active');
    activeBtn = btn;
    btn.classList.add('active');
    hideIdleLogo();

    // Coming back from a live_stream iframe, or API player not yet built —
    // rebuild the YT.Player, then hand the station over once it's ready.
    if (liveStreamActive || !player) {
      createApiPlayer(function () { loadStationIntoPlayer(station); });
      return;
    }

    if (playerReady) {
      loadStationIntoPlayer(station);
    } else {
      pendingVideoId  = station.videoId  || null;
      pendingPlaylist = station.playlistId || null;
    }
  }

  function loadStationIntoPlayer(station) {
    if (!player) return;
    if (station.videoId) {
      player.loadVideoById(station.videoId);
    } else if (station.playlistId) {
      player.loadPlaylist({ listType: 'playlist', list: station.playlistId });
    }
  }

  // ---- Live stream / API player swap ----
  // YT.Player can only load specific videoIds. Live streams get a new videoId
  // whenever the broadcaster restarts, so pinning to one breaks when a stream
  // ends ("This live stream recording is not available"). The live_stream
  // embed URL always resolves to the current broadcast — but it only works as
  // a raw iframe, not through the IFrame API. So we swap between two modes:
  // API player for playlists/videos, raw iframe for live channel playback.

  function teardownPlayer() {
    if (player && typeof player.destroy === 'function') {
      try { player.destroy(); } catch (_) {}
    }
    player = null;
    playerReady = false;

    // YT.Player replaces #player (a <div>) with an <iframe> of the same id.
    // Restore a clean <div id="player"> so the next creation has something
    // to mount against. Use replaceChild so we preserve the child index —
    // inserting at index 0 would put us before the leading whitespace text
    // node and shift the iframe's baseline by 1px.
    var wrap = document.getElementById('video-wrap');
    if (!wrap) return;
    var div = document.createElement('div');
    div.id = 'player';
    var existing = document.getElementById('player');
    if (existing && existing.parentNode) {
      existing.parentNode.replaceChild(div, existing);
    } else {
      wrap.appendChild(div);
    }
  }

  function createApiPlayer(onReadyCb) {
    // Only tear down when there's something to tear down. On initial load
    // the HTML-provided #player div is already clean; re-creating it via JS
    // produced a subtle 1px vertical offset versus the parser-created node.
    if (player || liveStreamActive) teardownPlayer();
    liveStreamActive = false;

    var listId = uploadsPlaylistId(channelId);
    var vars = {
      autoplay:       0,
      controls:       1,
      rel:            0,
      modestbranding: 1,
      iv_load_policy: 3,
      origin:         window.location.origin,
    };
    if (listId) {
      vars.listType = 'playlist';
      vars.list     = listId;
    }

    player = new YT.Player('player', {
      width:       '100%',
      height:      '100%',
      playerVars:  vars,
      events: {
        onReady: function () {
          playerReady = true;
          if (onReadyCb) {
            onReadyCb();
          } else if (pendingVideoId) {
            player.loadVideoById(pendingVideoId);
            pendingVideoId = null;
          } else if (pendingPlaylist) {
            player.loadPlaylist({ listType: 'playlist', list: pendingPlaylist });
            pendingPlaylist = null;
          }
        },
        onStateChange: onPlayerStateChange,
        onError:       onPlayerError,
      },
    });
  }

  function loadLiveStream(chId) {
    teardownPlayer();
    liveStreamActive = true;

    var div = document.getElementById('player');
    if (!div) return;
    var iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube.com/embed/live_stream?channel='
      + encodeURIComponent(chId) + '&autoplay=1';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
    iframe.setAttribute('allowfullscreen', '');
    iframe.style.width  = '100%';
    iframe.style.height = '100%';
    div.appendChild(iframe);
  }

  // ---- Load YouTube IFrame API ----
  var tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);

  window.onYouTubeIframeAPIReady = function () {
    createApiPlayer(null);
  };

  function onPlayerStateChange(event) {
    // Native YouTube controls handle playback UI — no custom state needed here.
    // Poll title while playing so the host can show it in a tray tooltip later.
    if (event.data === YT.PlayerState.PLAYING) {
      scheduleTrackUpdate();
    }
    // Restore idle logo when playlist finishes or player is unstarted with no active station
    if (event.data === YT.PlayerState.ENDED && !activeBtn) {
      showIdleLogo();
    }
  }

  function onPlayerError(event) {
    console.warn('PulseNet Player error:', event.data);
  }

  // Track title polling (API fires no title-change event).
  function updateTrackTitle() {
    if (!playerReady || !player) return;
    try {
      var data = player.getVideoData();
      if (data && data.title) {
        // Reserved for tray tooltip or future HUD element.
        window.__pulsenetNowPlaying = data.title;
      }
    } catch (_) {}
  }

  function scheduleTrackUpdate() {
    setTimeout(updateTrackTitle, 800);
    setTimeout(updateTrackTitle, 2500);
  }

  setInterval(function () {
    if (playerReady && player && player.getPlayerState() === YT.PlayerState.PLAYING) {
      updateTrackTitle();
    }
  }, 2000);

  // ---- Special utility buttons ----

  var homeBtn  = document.getElementById('pulsenet-home-btn');
  var aboutBtn = document.getElementById('about-btn');

  if (homeBtn) {
    homeBtn.addEventListener('click', function () {
      if (activeBtn) activeBtn.classList.remove('active');
      activeBtn = null;
      hideIdleLogo();
      loadLiveStream(PULSENET_LIVE_CHANNEL);
    });
  }

  if (aboutBtn) {
    aboutBtn.addEventListener('click', function () {
      try {
        window.chrome.webview.postMessage(JSON.stringify({ type: 'about' }));
      } catch (_) {}
    });
    aboutBtn.addEventListener('mouseenter', function () { showPreview('assets/info.png'); });
    aboutBtn.addEventListener('mouseleave', hidePreview);
  }

  // ---- Settings panel ----
  // Opacity slider maps 0–100% display → 30–100% actual (CSS opacity on html).
  var dragLocked     = false;
  var currentOpacity = 1.0;   // CSS opacity value sent to C#
  var currentZoom    = 100;   // zoom % sent to C#

  var settingsBtn    = document.getElementById('settings-btn');
  var settingsPanel  = document.getElementById('settings-panel');
  var lockBtn        = document.getElementById('lock-btn');
  var opacitySlider  = document.getElementById('opacity-slider');
  var opacityVal     = document.getElementById('opacity-val');
  var zoomDownBtn    = document.getElementById('zoom-down-btn');
  var zoomUpBtn      = document.getElementById('zoom-up-btn');
  var zoomInput      = document.getElementById('zoom-input');
  var hotkeyInput    = document.getElementById('hotkey-input');

  if (settingsBtn) {
    settingsBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      settingsPanel.classList.toggle('hidden');
    });
  }

  var discordBtn = document.getElementById('discord-btn');
  if (discordBtn) {
    discordBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      try {
        window.chrome.webview.postMessage(JSON.stringify({
          type: 'openUrl',
          url: 'https://discord.com/invite/Vxn7kzzWGJ',
        }));
      } catch (_) {}
    });
  }

  if (lockBtn) {
    lockBtn.addEventListener('click', function () {
      dragLocked = !dragLocked;
      lockBtn.textContent = dragLocked ? '\uD83D\uDD12 Locked' : '\uD83D\uDD13 Unlocked';
      lockBtn.classList.toggle('locked', dragLocked);
      if (settingsPanel) settingsPanel.classList.add('hidden');
      try {
        window.chrome.webview.postMessage(JSON.stringify({ type: 'lock', locked: dragLocked }));
      } catch (_) {}
    });
  }

  if (opacitySlider) {
    opacitySlider.addEventListener('input', function () {
      var pct = parseInt(this.value, 10);
      opacityVal.textContent = pct + '%';
      // Map display 0–100% → actual opacity 0.30–1.00
      currentOpacity = 0.30 + (pct / 100) * 0.70;
      try {
        window.chrome.webview.postMessage(JSON.stringify({ type: 'opacity', value: currentOpacity }));
      } catch (_) {}
    });
  }

  function sendZoom(pct) {
    currentZoom = Math.min(100, Math.max(20, pct));
    if (zoomInput) zoomInput.value = currentZoom;
    try {
      window.chrome.webview.postMessage(JSON.stringify({ type: 'zoom', pct: currentZoom }));
    } catch (_) {}
  }

  function currentZoomValue() {
    if (zoomInput) {
      var v = parseInt(zoomInput.value, 10);
      if (!isNaN(v)) return v;
    }
    return currentZoom;
  }

  if (zoomDownBtn) {
    zoomDownBtn.addEventListener('click', function () { sendZoom(currentZoomValue() - 10); });
  }

  if (zoomUpBtn) {
    zoomUpBtn.addEventListener('click', function () { sendZoom(currentZoomValue() + 10); });
  }

  if (zoomInput) {
    zoomInput.addEventListener('change', function () {
      var val = parseInt(this.value, 10);
      if (isNaN(val)) val = currentZoom;
      sendZoom(val);
    });
  }

  // ---- Hotkey recorder ----
  var heldKeys = {};

  function sendHotkey() {
    var keys = Object.keys(heldKeys);
    try {
      window.chrome.webview.postMessage(JSON.stringify({ type: 'hotkey', keys: keys }));
    } catch (_) {}
  }

  if (hotkeyInput) {
    hotkeyInput.addEventListener('focus', function () {
      heldKeys = {};
      hotkeyInput.value = '';
      try { window.chrome.webview.postMessage(JSON.stringify({ type: 'hotkey-focus', active: true })); } catch (_) {}
    });

    hotkeyInput.addEventListener('blur', function () {
      heldKeys = {};
      try { window.chrome.webview.postMessage(JSON.stringify({ type: 'hotkey-focus', active: false })); } catch (_) {}
    });

    hotkeyInput.addEventListener('keydown', function (e) {
      e.preventDefault();
      heldKeys[e.code] = true;
      hotkeyInput.value = Object.keys(heldKeys).join(' + ');
    });

    hotkeyInput.addEventListener('keyup', function (e) {
      e.preventDefault();
      // Send when all keys released
      delete heldKeys[e.code];
      if (Object.keys(heldKeys).length === 0) {
        // Re-build from the recorded combo before clearing
        var recorded = hotkeyInput.value;
        var keys = recorded ? recorded.split(' + ') : [];
        if (keys.length > 0) {
          try { window.chrome.webview.postMessage(JSON.stringify({ type: 'hotkey', keys: keys })); } catch (_) {}
        }
        hotkeyInput.blur();
      }
    });
  }


  // Close panel on click outside
  document.addEventListener('click', function (e) {
    if (settingsPanel && !settingsPanel.classList.contains('hidden')) {
      if (!settingsPanel.contains(e.target) && e.target !== settingsBtn) {
        settingsPanel.classList.add('hidden');
      }
    }
  });

  // Frame drag — mousedown on non-interactive frame areas tells C# to start drag.
  // JS is authoritative: only areas that are NOT a button, input, video, or settings
  // panel will initiate drag, so button clicks are never treated as drag starts.
  document.addEventListener('mousedown', function (e) {
    var el = e.target;
    while (el && el !== document.documentElement) {
      if (
        el.tagName === 'BUTTON'        ||
        el.tagName === 'INPUT'         ||
        el.tagName === 'A'             ||
        el.id     === 'video-wrap'     ||
        el.id     === 'settings-panel'
      ) return;
      el = el.parentElement;
    }
    try {
      window.chrome.webview.postMessage(JSON.stringify({ type: 'startDrag' }));
    } catch (_) {}
  });

  // Window-level lock state is synced to C# so the drag logic there can honour it.

  // ---- Initialise ----
  buildButtons();

})();
