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
                    action: DMIFunctions.menu_levelClicked
                },
                {
                    text: "Train running number",
                    action: DMIFunctions.menu_trainnumberClicked
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

    static menu_levelClicked() {
        OpenSubwindow(new DataEntryWindow({
            title: "Level",
            confirmMessage: "Level entry complete?",
            fields: [
                {
                    name: "level",
                    label: null,
                    type: [
                        {
                            label: "Level 1",
                            name: "level1"
                        },
                        {
                            label: "Level 2",
                            name: "level2"
                        },
                        {
                            text: null, // Separator
                        },
                        {
                            label: "Level 0",
                            name: "level0"
                        }
                    ]
                },
                
            ],
            halfLayoutIfApplicable: true,
            onFinished: console.log,
            onCancel: console.log
        }));
    }

    static menu_trainnumberClicked() {
        OpenSubwindow(new DataEntryWindow({
            title: "Train running number",
            confirmMessage: "Train data entry complete?",
            fields: [
                {
                    name: "trainrunningnumber",
                    label: null,
                    type: "Numeric",
                }
            ],
            halfLayoutIfApplicable: true,
            onFinished: console.log,
            onCancel: console.log
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
            title: "Radio data",
            items: [
                {
                    text: "Contact last RBC",
                },
                {
                    text: "Use short number",
                },
                {
                    text: "Enter RBC data",
                    action: DMIFunctions.radioData_RBCDataClicked
                },
                {
                    text: null, // Separator
                },
                {
                    text: "Radio network type",
                    action: DMIFunctions.radioData_networkTypeClicked
                },
                {
                    text: "GSM-R network ID",
                    action: DMIFunctions.radioData_GSMRNetworkClicked
                },
                {
                    text: "Mission with one radio system",
                    action: DMIFunctions.radioData_oneRadioSystemClicked
                }
            ]
        }))
    }

    static radioData_GSMRNetworkClicked() {
        OpenSubwindow(new DataEntryWindow({
            title: "GSM-R Network ID",
            confirmMessage: "Is data entry complete?",
            fields: [
                {
                    name: "GSM-R",
                    label: "GSM-R",
                    type: [
                        {
                            label: "GSMR-A",
                            name: "GSMRA"
                        },
                        {
                            label: "GSMR-B",
                            name: "GSMRB"
                        },
                        {
                            label: "Telecom X",
                            name: "TELECOMX"
                        }
                    ],
                    
                },
                
            ],
            halfLayoutIfApplicable: true,
            onFinished: console.log,
            onCancel: console.log
        }))
    }

    static radioData_RBCDataClicked() {
        OpenSubwindow(new DataEntryWindow({
            title: "RBC data",
            confirmMessage: "RBC data entry complete?",
            fields: [
                {
                    name: "RBCID",
                    label: "RBC ID",
                    type: "Numeric"
                },
                {
                    name: "RBCNUMBER",
                    label: "RBC phone number",
                    type: "Numeric"
                }

                
            ],
            onCancel: console.log,
            onFinished: console.log
        }))
    }

    static radioData_networkTypeClicked() {
        OpenSubwindow(new DataEntryWindow({
            title: "Radio network type",
            confirmMessage: "Is data entry complete?",
            fields: [
                {
                    name: "networktype",
                label: null,
                type: [
                    {
                        name: "FRMCS",
                        label: "FRMCS"
                    },
                    {
                        name: "FRMCS+GSMR",
                        label: "FRMCS+GSM-R"
                    },
                    {
                        label: "GSM-R",
                        name: "GSMR"
                    },
                    
                    
                ]
            }
            ],
            halfLayoutIfApplicable: true,
            onCancel: console.log,
            onFinished: console.log
        }))
    }

    static radioData_oneRadioSystemClicked() {
        OpenSubwindow(new DataEntryWindow({
            title: "Mission with one radio system",
            confirmMessage: "Is data entry complete?",
            fields: [
                {
                    name: "oneRadioSystem",
                    label: null,
                    type: [
                        {
                            name: "no",
                            label: "No"
                        },
                        {
                            name: "yes",
                            label: "Yes"
                        }
                    ]
                }
            ],
            halfLayoutIfApplicable: true,
            onCancel: console.log,
            onFinished: console.log
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
