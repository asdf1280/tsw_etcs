import { OpenSubwindow } from "./dmi";
import { MenuWindow } from "./subwindow/menuwindow";
import { DataEntryAdditionalButton, DataEntryResult, DataEntryWindow } from "./subwindow/dataentrywindow"

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
                    action: DMIFunctions.menu_onDriverIdClicked
                },
                {
                    text: "Train data",
                    action: DMIFunctions.menu_onTrainDataClicked
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

    static menu_onDriverIdClicked() {
        DMIFunctions.askDriverId(console.log, console.log, false)
    }

    static askDriverId(onFinished: (values: DataEntryResult) => void, onCancel: () => void, initialSetup: boolean, current?: string) {
        let btns: DataEntryAdditionalButton[] | undefined;
        if(initialSetup) {
            btns = [
                {
                    text: "TRN",
                    symbol: null,
                    type: "UP",
                    action: console.log,
                    left: 142,
                    top: 400,
                    width: 82,
                    height: 50
                },
                {
                    text: null,
                    symbol: "SE_Entry",
                    type: "UP",
                    action: console.log,
                    left: 224,
                    top: 400,
                    width: 82,
                    height: 50
                }
            ]
        }
        OpenSubwindow(new DataEntryWindow({
            title: "Driver ID",
            confirmMessage: "Train data entry complete?",
            fields: [
                {
                    name: "driverid",
                    label: "N/A",
                    type: "AlphaNumeric",
                    preEnteredValue: current
                }
            ],
            additionalButtons: btns,
            halfLayoutIfApplicable: "EnabledWithoutLabel",
            onFinished: onFinished,
            onCancel: onCancel
        }));
    }

    static menu_onTrainDataClicked() {
        OpenSubwindow(new DataEntryWindow({
            title: "Train data",
            confirmMessage: "Train data entry complete?",
            fields: [
                {
                    name: "length",
                    label: "Length (m)",
                    type: "Numeric"
                },
                {
                    name: "decel",
                    label: "Service brake (m/s^2)",
                    type: "EnhancedNumeric"
                },
                {
                    name: "vmax",
                    label: "Maximum speed (km/h)",
                    type: "Numeric"
                },
                {
                    name: "vmax",
                    label: "Maximum speed (km/h)",
                    type: "Numeric"
                },
                {
                    name: "vmax",
                    label: "Maximum speed (km/h)",
                    type: "Numeric"
                },
                {
                    name: "vmax",
                    label: "Maximum speed (km/h)",
                    type: "Numeric"
                }
            ],
            onFinished: console.log,
            onCancel: console.log
        }));
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