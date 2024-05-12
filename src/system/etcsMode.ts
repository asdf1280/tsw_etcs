import { ETCSLevel } from "./etcsLevel";
import { ETCSServer } from "./etcsServer";

/**
 * ETCS Mode is what primarily defines the behavior of the DMI server. A mode is dependent on the level and the server instance. However, only server instance stores the current mode instance.
 */
export interface ETCSMode {
    name: string;
    symbolName: string;

    // Lifecycle
    activate(server: ETCSServer, level: ETCSLevel | null): void;

    update(): void;

    /**
     * This method is called by the server before activating a new mode. It should be used to clean up any resources used by the mode, if any.
     */
    cleanup(): void;
}

export class ETCSStandByMode implements ETCSMode {
    name = "SB";
    symbolName = "MO_SB";

    activate(server: ETCSServer, level: ETCSLevel) {
        // Do nothing
    }

    update() {
        // Do nothing
    }

    cleanup() {
        // Do nothing
    }
}