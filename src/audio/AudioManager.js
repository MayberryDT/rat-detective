class AudioManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.sounds = new Map();
        this.music = new Map();
        this.currentMusic = null;
        this.masterVolume = this.audioContext.createGain();
        this.masterVolume.connect(this.audioContext.destination);
        this.soundVolume = this.audioContext.createGain();
        this.musicVolume = this.audioContext.createGain();
        this.soundVolume.connect(this.masterVolume);
        this.musicVolume.connect(this.masterVolume);
    }

    async loadSound(name, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.sounds.set(name, audioBuffer);
        } catch (error) {
            console.warn(`Failed to load sound ${name} from ${url}:`, error);
        }
    }

    async loadMusic(name, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.music.set(name, audioBuffer);
        } catch (error) {
            console.warn(`Failed to load music ${name} from ${url}:`, error);
        }
    }

    playSound(name) {
        const sound = this.sounds.get(name);
        if (sound) {
            const source = this.audioContext.createBufferSource();
            source.buffer = sound;
            source.connect(this.soundVolume);
            source.start(0);
            return source;
        }
        return null;
    }

    playMusic(name, loop = true) {
        if (this.currentMusic) {
            this.stopMusic();
        }

        const music = this.music.get(name);
        if (music) {
            const source = this.audioContext.createBufferSource();
            source.buffer = music;
            source.loop = loop;
            source.connect(this.musicVolume);
            source.start(0);
            this.currentMusic = source;
            return source;
        }
        return null;
    }

    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.stop();
            this.currentMusic = null;
        }
    }

    setMasterVolume(value) {
        this.masterVolume.gain.value = Math.max(0, Math.min(1, value));
    }

    setSoundVolume(value) {
        this.soundVolume.gain.value = Math.max(0, Math.min(1, value));
    }

    setMusicVolume(value) {
        this.musicVolume.gain.value = Math.max(0, Math.min(1, value));
    }

    resume() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}

export default AudioManager; 