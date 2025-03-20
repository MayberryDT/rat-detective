import AudioManager from '../audio/AudioManager';

// Sound effect configurations
export const SOUND_EFFECTS = {
    GUNSHOT: 'gunshot',
    RAT_HIT: 'rathit',
    RAT_DEATH: 'ratdeath'
};

// Music track configurations
export const MUSIC_TRACKS = {
    MAIN_THEME: 'main-theme'
};

// Audio file paths
const SOUND_PATHS = {
    [SOUND_EFFECTS.GUNSHOT]: '/sounds/gunshot.mp3',
    [SOUND_EFFECTS.RAT_HIT]: '/sounds/rathit.mp3',
    [SOUND_EFFECTS.RAT_DEATH]: '/sounds/ratdeath.mp3'
};

const MUSIC_PATHS = {
    [MUSIC_TRACKS.MAIN_THEME]: '/music/main-theme.mp3'
};

export async function initializeAudio() {
    const audioManager = new AudioManager();
    
    // Load all sound effects
    const soundPromises = Object.entries(SOUND_PATHS).map(([name, path]) => 
        audioManager.loadSound(name, path)
    );
    
    // Load all music tracks
    const musicPromises = Object.entries(MUSIC_PATHS).map(([name, path]) => 
        audioManager.loadMusic(name, path)
    );
    
    try {
        await Promise.all([...soundPromises, ...musicPromises]);
        console.log('Audio assets loaded successfully');
    } catch (error) {
        console.warn('Some audio assets failed to load:', error);
    }
    
    // Set default volumes
    audioManager.setMasterVolume(0.8);
    audioManager.setSoundVolume(1.0);
    audioManager.setMusicVolume(0.6);
    
    return audioManager;
}

// Initialize audio on user interaction
export function setupAudioContext(audioManager) {
    const startAudio = () => {
        audioManager.resume();
        audioManager.playMusic(MUSIC_TRACKS.MAIN_THEME, true); // Start main theme immediately
        document.removeEventListener('click', startAudio);
        document.removeEventListener('keydown', startAudio);
    };
    
    document.addEventListener('click', startAudio);
    document.addEventListener('keydown', startAudio);
} 