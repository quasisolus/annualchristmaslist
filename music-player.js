let musicPlaylist = [];
let currentTrackIndex = 0;
let musicAudio;
let sessionStartTime;
let totalPlaylistDuration = 0;
let trackDurations = [];

const songFiles = [
  "All I Want For Christmas Is You.mp3",
  "It's Beginning To Look A Lot Like Christmas.mp3",
  "Jingle Bell Rock.mp3",
  "Jingle Bells.mp3",
  "Last Christmas.mp3",
  "Let It Snow! Let It Snow! Let It Snow!.mp3",
  "Rockin' Around The Christmas Tree.mp3",
  "Santa Baby.mp3",
  "The Christmas Song (Merry Christmas To You).mp3",
  "White Christmas.mp3"
];

function getSessionStartTime() {
  const stored = sessionStorage.getItem('musicStartTime');
  if (stored) {
    return parseInt(stored);
  } else {
    const startTime = Date.now();
    sessionStorage.setItem('musicStartTime', startTime.toString());
    return startTime;
  }
}

function loadTrackMetadata(index, callback) {
  const audio = new Audio(`audio/${songFiles[index]}`);
  audio.addEventListener('loadedmetadata', function() {
    trackDurations[index] = audio.duration;
    if (callback) callback();
  });
  audio.addEventListener('error', function() {
    console.error(`Error loading track: ${songFiles[index]}`);
    trackDurations[index] = 0;
    if (callback) callback();
  });
  audio.preload = 'metadata';
  audio.load();
}

function calculateTrackPosition(elapsedTime) {
  let accumulatedTime = 0;
  
  for (let i = 0; i < trackDurations.length; i++) {
    const trackDuration = trackDurations[i] || 0;
    if (elapsedTime < accumulatedTime + trackDuration) {
      return {
        trackIndex: i,
        positionInTrack: elapsedTime - accumulatedTime
      };
    }
    accumulatedTime += trackDuration;
  }
  
  totalPlaylistDuration = accumulatedTime;
  const loopedTime = elapsedTime % totalPlaylistDuration;
  
  accumulatedTime = 0;
  for (let i = 0; i < trackDurations.length; i++) {
    const trackDuration = trackDurations[i] || 0;
    if (loopedTime < accumulatedTime + trackDuration) {
      return {
        trackIndex: i,
        positionInTrack: loopedTime - accumulatedTime
      };
    }
    accumulatedTime += trackDuration;
  }
  
  return { trackIndex: 0, positionInTrack: 0 };
}

function updateTrackName() {
  const trackNameEl = document.getElementById('current-track-name');
  if (trackNameEl && songFiles[currentTrackIndex]) {
    const name = songFiles[currentTrackIndex].replace('.mp3', '');
    trackNameEl.textContent = name;
  }
}

function updatePlayPauseButton() {
  const playPauseBtn = document.getElementById('play-pause-btn');
  if (playPauseBtn && musicAudio) {
    if (musicAudio.paused) {
      playPauseBtn.textContent = '▶';
      playPauseBtn.title = 'Play';
    } else {
      playPauseBtn.textContent = '⏸';
      playPauseBtn.title = 'Pause';
    }
  }
}

function playTrack(trackIndex, startPosition = 0) {
  if (trackIndex >= songFiles.length) {
    trackIndex = 0;
  }
  
  currentTrackIndex = trackIndex;
  updateTrackName();
  
  if (musicAudio) {
    musicAudio.pause();
    musicAudio = null;
  }
  
  musicAudio = new Audio(`audio/${songFiles[trackIndex]}`);
  musicAudio.volume = 0.5;
  musicAudio.currentTime = startPosition;
  
  musicAudio.addEventListener('ended', function() {
    const nextIndex = (currentTrackIndex + 1) % songFiles.length;
    playTrack(nextIndex);
  });
  
  musicAudio.addEventListener('play', updatePlayPauseButton);
  musicAudio.addEventListener('pause', updatePlayPauseButton);
  
  musicAudio.play().catch(function(error) {
    console.error('Error playing music:', error);
    updatePlayPauseButton();
    document.addEventListener('click', function playOnClick() {
      if (musicAudio) {
        musicAudio.play().catch(console.error);
      }
      document.removeEventListener('click', playOnClick);
    }, { once: true });
  });
  
  updatePlayPauseButton();
  
  musicAudio.addEventListener('error', function(e) {
    console.error(`Error loading track: ${songFiles[trackIndex]}`, e);
    const nextIndex = (currentTrackIndex + 1) % songFiles.length;
    if (nextIndex !== trackIndex) {
      playTrack(nextIndex);
    }
  });
}

function initMusic() {
  try {
    sessionStartTime = getSessionStartTime();
    
    let loadedCount = 0;
    const totalTracks = songFiles.length;
    
    function onTrackLoaded() {
      loadedCount++;
      if (loadedCount === totalTracks) {
        const elapsedTime = (Date.now() - sessionStartTime) / 1000;
        const trackPos = calculateTrackPosition(elapsedTime);
        playTrack(trackPos.trackIndex, trackPos.positionInTrack);
      }
    }
    
    for (let i = 0; i < songFiles.length; i++) {
      loadTrackMetadata(i, onTrackLoaded);
    }
    
  } catch (e) {
    console.error('Error initializing music:', e);
  }
}

function togglePlayerExpand() {
  const playerControls = document.getElementById('music-player-controls');
  if (playerControls) {
    playerControls.classList.toggle('minimized');
  }
}

function togglePlayPause() {
  if (!musicAudio) return;
  
  if (musicAudio.paused) {
    musicAudio.play().catch(function(error) {
      console.error('Error playing music:', error);
    });
  } else {
    musicAudio.pause();
  }
  updatePlayPauseButton();
}

function skipNext() {
  if (!musicAudio) return;
  
  const nextIndex = (currentTrackIndex + 1) % songFiles.length;
  playTrack(nextIndex);
}

function skipPrevious() {
  if (!musicAudio) return;
  
  const prevIndex = (currentTrackIndex - 1 + songFiles.length) % songFiles.length;
  playTrack(prevIndex);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMusic);
} else {
  initMusic();
}
