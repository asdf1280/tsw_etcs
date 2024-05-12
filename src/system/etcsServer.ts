import { ETCSLevel, ETCSLevel0 } from "./etcsLevel";
import { ETCSMode, ETCSStandByMode } from "./etcsMode";

/**
 * ETCS Server always defaults the initial level to level 0, and the initial mode to the mode returned by the level 0. (It should be NoneMode.)
 */
export class ETCSServer {
    constructor() {
        this.setLevel(new ETCSLevel0());
    }

    private level: ETCSLevel | null = null;
    private mode!: ETCSMode;

    /**
     * Please note that this method is not resonsible for preparation / acknowledgement of the new level. After everything's done, call this method when finally transitioning to the new level.
     * @param level The new level instance to activate
     */
    public setLevel(level: ETCSLevel | null) {
        this.level = level;
        if (level !== null) {
            let mode = level.activate(this);
            this.setMode(mode);
        } else {
            this.setMode(new ETCSStandByMode());
        }
    }

    public setMode(mode: ETCSMode) {
        this.mode = mode;
        this.mode.activate(this, this.level);
    }
}