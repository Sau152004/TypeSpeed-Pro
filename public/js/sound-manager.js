class SoundManager {
    constructor() {
        this.enabled = localStorage.getItem('soundEnabled') !== 'false';
        this.volume = parseFloat(localStorage.getItem('soundVolume') || '0.3');
        this.sounds = {};
        this.loadSounds();
    }
    
    loadSounds() {
        const soundFiles = {
            keystroke: '/sounds/keystroke.mp3',
            error: '/sounds/error.mp3',
            complete: '/sounds/complete.mp3',
            start: '/sounds/keystroke.mp3' // Reuse keystroke for start
        };
        
        Object.entries(soundFiles).forEach(([name, path]) => {
            const audio = new Audio(path);
            audio.volume = this.volume;
            audio.preload = 'auto';
            
            // Handle loading errors gracefully
            audio.addEventListener('error', () => {
                console.warn(`Failed to load sound: ${name}`);
            });
            
            this.sounds[name] = audio;
        });
    }
    
    play(soundName) {
        if (!this.enabled || !this.sounds[soundName]) return;
        
        try {
            const sound = this.sounds[soundName].cloneNode();
            sound.volume = this.volume;
            sound.play().catch(e => {
                // Ignore autoplay restrictions
                if (e.name !== 'NotAllowedError') {
                    console.warn('Sound play failed:', e);
                }
            });
        } catch (error) {
            console.warn('Sound play error:', error);
        }
    }
    
    setEnabled(enabled) {
        this.enabled = enabled;
        localStorage.setItem('soundEnabled', enabled.toString());
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        localStorage.setItem('soundVolume', this.volume.toString());
        
        Object.values(this.sounds).forEach(sound => {
            sound.volume = this.volume;
        });
    }
    
    isEnabled() {
        return this.enabled;
    }
    
    getVolume() {
        return this.volume;
    }
}