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
        if (initialSetup) {
            btns = [
                {
                    text: "TRN",
                    type: "UP",
                    action: console.log,
                    left: 142,
                    top: 400,
                    width: 82,
                    height: 50
                },
                {
                    text: "SE_Entry",
                    trySymbol: true,
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
                    label: null,
                    type: "AlphaNumeric",
                    preEnteredValue: current
                }
            ],
            additionalButtons: btns,
            halfLayoutIfApplicable: true,
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
                    name: "category",
                    label: "Train category",
                    type: [
                        {
                            label: "PASS 1",
                            name: "pass1"
                        },
                        {
                            label: "PASS 2",
                            name: "pass2"
                        },
                        {
                            label: "PASS 3",
                            name: "pass3"
                        },
                        { // Tilt 1-7
                            label: "TILT 1",
                            name: "tilt1"
                        },
                        {
                            label: "TILT 2",
                            name: "tilt2"
                        },
                        {
                            label: "TILT 3",
                            name: "tilt3"
                        },
                        {
                            label: "TILT 4",
                            name: "tilt4"
                        },
                        {
                            label: "TILT 5",
                            name: "tilt5"
                        },
                        {
                            label: "TILT 6",
                            name: "tilt6"
                        },
                        {
                            label: "TILT 7",
                            name: "tilt7"
                        },
                        { // FP 1-4
                            label: "FP 1",
                            name: "fp1"
                        },
                        {
                            label: "FP 2",
                            name: "fp2"
                        },
                        {
                            label: "FP 3",
                            name: "fp3"
                        },
                        {
                            label: "FP 4",
                            name: "fp4"
                        },
                        { // FG 1-4
                            label: "FG 1",
                            name: "fg1"
                        },
                        {
                            label: "FG 2",
                            name: "fg2"
                        },
                        {
                            label: "FG 3",
                            name: "fg3"
                        },
                        {
                            label: "FG 4",
                            name: "fg4"
                        }
                    ]
                },
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
                    name: "airtight",
                    label: "Airtight",
                    type: "Boolean"
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

    static onSimClicked() {
        OpenSubwindow(new MenuWindow({
            title: "DMI Simulation Menu",
            items: [
                {
                    text: "Test data input and check",
                    action: DMIFunctions.sim_onTestDataInputClicked
                }
            ]
        }))
    }

    static sim_onTestDataInputClicked() {
        OpenSubwindow(new DataEntryWindow({
            title: "Test data input",
            confirmMessage: "Data entry complete?",
            fields: [
                {
                    name: "a",
                    label: "A (3-5, 1-7)",
                    type: "Numeric",
                    preEnteredValue: 4,
                    rulesToCheck: [
                        (a) => {
                            if (a < 1 || a > 7) return {
                                accepted: false,
                                mandatory: true,
                            }
                            else if (a < 3 || a > 5) return {
                                accepted: false,
                                mandatory: false,
                                message: "Value should be between 3 and 5"
                            }
                            return null;
                        }
                    ]
                },
                {
                    name: "b",
                    label: "B (a <= 4)",
                    type: "Boolean"
                },
                {
                    name: "c",
                    label: "C (c = b)",
                    type: "Boolean",
                    preEnteredValue: false
                },
                {
                    name: "d",
                    label: "D (str <= 5, str <= a)",
                    type: "AlphaNumeric",
                    preEnteredValue: "example",
                    rulesToCheck: [
                        (a: string) => {
                            if(a.length > 5) return {accepted: false, mandatory: false}
                            return null;
                        }
                    ]
                }
            ],
            onFinished: console.log,
            onCancel: console.log,
            rulesToCheck: [
                (res) => {
                    if((res.a.value as number) <= 4 !== res.b.value as boolean) {
                        return {
                            accepted: false,
                            concernedFields: ["a", "b"],
                            mandatory: false
                        }
                    }
                    return null;
                },
                (res) => {
                    if(res.b.value !== res.c.value) {
                        return {
                            accepted: false,
                            concernedFields: ["b", "c"],
                            mandatory: false
                        }
                    }
                    return null;
                },
                (res) => {
                    if(res.d.value.length > res.a.value) {
                        return {
                            accepted: false,
                            concernedFields: ["a", "d"],
                            mandatory: true
                        }
                    }
                    return null;
                }
            ]
        }))
    }

    static notImplementedMessage() {
        // This function isn't even implemented lol
    }
}