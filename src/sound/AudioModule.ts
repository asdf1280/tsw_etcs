import pInfo from "./S_info.wav";
import pS2 from "./S2_warning.wav";
import pS1 from "./S1_toofast.wav";
import pClick from "./click.wav";

const DEFAULT_GAIN = 0.8;

export default class AudioModule {
    ctx!: AudioContext;

    sInfo!: AudioBuffer
    sS2!: AudioBuffer
    sS1!: AudioBuffer
    sClick!: AudioBuffer

    warningAfter: number = 0

    constructor() {

    }

    private loadAudio(path: string) {
        return new Promise<AudioBuffer>((resolve, reject) => {
            fetch(path)
                .then((res) => res.arrayBuffer())
                .then((buf) => {
                    this.ctx.decodeAudioData(buf, (data) => {
                        resolve(data);
                    })
                })
                .catch((err) => {
                    reject(err);
                })
        })
    }

    async init() {
        this.ctx = new AudioContext();

        // Load clips
        this.sInfo = await this.loadAudio(pInfo);
        this.sS2 = await this.loadAudio(pS2);
        this.sS1 = await this.loadAudio(pS1);
        this.sClick = await this.loadAudio(pClick);
    }

    async start() {
        await this.ctx.resume();
    }

    click(hz: number, dur: number, delay: number = 0, misc: { gain?: number, type?: OscillatorType } = {}) {
        let ctx = this.ctx;
        let n = ctx.createOscillator();
        let g = ctx.createGain();
        n.connect(g);
        g.connect(ctx.destination);

        let trans_duration = 0.1;
        if (dur / 2 / 1000 < trans_duration)
            trans_duration = dur / 2 / 1000;

        // g.gain.setValueAtTime(misc.gain ?? DEFAULT_GAIN, ctx.currentTime + delay / 1000.0);
        // g.gain.setValueAtTime(misc.gain ?? DEFAULT_GAIN, ctx.currentTime + delay / 1000.0 + (dur / 1000) - trans_duration);
        // g.gain.exponentialRampToValueAtTime(0.000001, ctx.currentTime + delay / 1000.0 + (dur / 1000));
        g.gain.value = misc.gain ?? DEFAULT_GAIN;

        n.type = misc.type ?? "sine";
        n.frequency.value = hz;

        n.start(ctx.currentTime + delay / 1000.0);
        n.stop(ctx.currentTime + delay / 1000.0 + dur / 1000.0);
    }

    playSource(s: AudioBuffer, delay: number = 0) {
        let ctx = this.ctx;
        if (ctx.state === "suspended")
            ctx.resume();

        let n = ctx.createBufferSource();
        let g = ctx.createGain();
        n.connect(g);
        g.connect(ctx.destination);

        g.gain.value = DEFAULT_GAIN;

        n.buffer = s;

        n.start(ctx.currentTime + delay / 1000.0);

        return s.duration * 1000;
    }

    etcsWarning(delay = 0) {
        delay = Math.max(delay, (this.warningAfter - this.ctx.currentTime) * 1000);
        let v = this.playSource(this.sInfo, delay);
        this.warningAfter = this.ctx.currentTime + v / 1000;
        return v;
    }

    etcsOverspeed(delay = 0) {
        return this.playSource(this.sS1, delay);
    }

    etcsOverspeedShort(delay = 0) {
        return this.playSource(this.sS2, delay);
    }

    welcomeSound(delay = 0) {
        return this.playSource(this.sClick, delay);
    }

    buttonPressSound(delay = 0) {
        return this.playSource(this.sClick, delay);
    }

    soundAvailable() {
        return this.ctx.state === "running"
    }

    resumeSoon() {
        setTimeout(() => {
            this.ctx.resume()
        }, 300);
    }
}