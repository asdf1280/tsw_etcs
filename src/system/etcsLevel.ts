import { ETCSMode, ETCSStandByMode } from "./etcsMode";
import { ETCSServer } from "./etcsServer";

// FYI: In baseline 4, the requirement to acknowledge when transitioning from L NTC to any ETCS level (1/2) was removed. Therefore, in this implementation, the driver only acks when transitioning to either NTC or L0. That's why some ack symbols are gone.

/**
 * In this system, the primary task of a level is assigning an initial mode to the server. A level object shouldn't be designed to store the current mode to prevent confusion. The server instance stores the current mode. Once a level is activated, changing the mode further can be done either by the level or the mode itself. However, it is recommended to include the logic in the mode object.
 * 
 * To make things simple, level should only exist as an information of current state. Even if a same mode is shared among different levels, it should be each mode that should handle the differences between levels.
 */
export interface ETCSLevel {
    name: string;
    symbolName: string;
    ackSymbolName?: string;
    soonSymbolName: string;

    // Lifecycle
    /**
     * This method is only called by ETCS Server. It shouldn't be called directly. The Level should also never directly call the activate method of the mode. When it returns a mode, the server will call the activate method of the mode after saving the mode to the server instance.
     * A level MUST return an initial mode to activate. After then, to change the mode, use the method of the server instance.
     * @returns The mode to activate
     */
    activate(server: ETCSServer): ETCSMode;

    /**
     * This is actually a second initialization method. The difference is that when this method is called, the current mode becomes aware of the server object and this level object.
     */
    start(): void;

    update(): void;

    /**
     * This method is called by the server before activating a new level. It should be used to clean up any resources used by the level, if any.
     */
    cleanup(): void;
}

export class ETCSLevel0 implements ETCSLevel {
    name = "L0";
    symbolName = "LE_0";
    ackSymbolName = "LE_0_Ack";
    soonSymbolName = "LE_0_Soon";

    activate(server: ETCSServer): ETCSMode {
        return new ETCSStandByMode();
    }

    start(): void {
        // Do nothing
    }

    update() {
        // Do nothing
    }

    cleanup() {
        // Do nothing
    }
}

export class ETCSLevelNTC {

}

export class ETCSLevel1 {

}

export class ETCSLevel2 {

}

// The latest version of ETCS removed the level 3. It is now replaced by the level 2.