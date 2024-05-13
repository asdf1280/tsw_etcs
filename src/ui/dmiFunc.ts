import { OpenSubwindow } from "./dmi";
import { MenuWindow } from "./subwindow";

export class DMIFunctions {
    static init() {
        
    }

    static onMenuClicked() {
        OpenSubwindow(new MenuWindow({
            title: "Main",
            items: [
                {
                    text: "Start",
                },
                {
                    text: "Driver ID",
                },
                {
                    text: "Train data",
                },
                {
                    text: null, // Separator
                },
                {
                    text: "Level",
                },
                {
                    text: "Train running number",
                },
                {
                    text: "Shunting",
                    buttontype: "DELAY"
                },
                {
                    text: "Non-leading",
                    buttontype: "DELAY"
                },
                {
                    text: "Maintain shunting",
                    buttontype: "DELAY",
                    enabled: false
                },
                {
                    text: "Radio data",
                    action: DMIFunctions.onRadioDataClicked
                },
                {
                    text: "Initiate SM",
                    buttontype: "DELAY"
                },
                {
                    text: "Exit SM",
                    buttontype: "DELAY",
                    enabled: false
                }
            ]
        }))
    }

    static onOverrideClicked() {
        OpenSubwindow(new MenuWindow({
            title: "Override",
            items: [
                {
                    text: "EOA",
                }
            ]
        }))
    }

    static onSpecClicked() {
        OpenSubwindow(new MenuWindow({
            title: "Special",
            items: [
                {
                    text: "Adhesion",
                },
                {
                    text: "SR speed / distance",
                },
                {
                    text: "Train integrity",
                    buttontype: "DELAY"
                },
                {
                    text: "BMM reaction inhibition",
                }
            ]
        }))
    }

    static onSettingsClicked() {
        OpenSubwindow(new MenuWindow({
            title: "Settings",
            items: [
                {
                    text: "SY:SE_Language",
                },
                {
                    text: "SY:SE_Volume",
                },
                {
                    text: "SY:SE_Brightness",
                },
                {
                    text: "System version",
                },
                {
                    text: "Set VBC",
                },
                {
                    text: "Remove VBC",
                },
                {
                    text: "ATO",
                    enabled: false
                },
                {
                    text: "Speed Gauge"
                }
            ]
        }))
    }

    static onRadioDataClicked() {
        OpenSubwindow(new MenuWindow({
            title: "Settings",
            items: [
                {
                    text: "Contact last RBC",
                },
                {
                    text: "Use short number",
                },
                {
                    text: "Enter RBC data",
                },
                {
                    text: "Radio network type",
                },
                {
                    text: "GSM-R network ID",
                },
                {
                    text: "Mission with one radio system",
                }
            ]
        }))
    }

    static notImplementedMessage() {
        // This function isn't even implemented lol
    }
}