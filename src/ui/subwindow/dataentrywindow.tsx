import React, { ReactNode, createRef, useState } from "react";
import { CloseSubwindow, Subwindow } from "../dmi"
import { EButton, EButtonType, FButton, useEButtonBehaviour } from "../components";
import { E_COLORS } from "../constants";

function DataEntryValueVerifyType(value: any, type: DataEntryValueType): boolean {
    if (value === undefined) return false;

    if (type === "Numeric") {
        return typeof value === "number" && !isNaN(value) && isFinite(value) && Number.isInteger(value) && value >= 0;
    } else if (type === "EnhancedNumeric") {
        return typeof value === "number" && !isNaN(value) && isFinite(value) && value >= 0;
    } else if (type === "AlphaNumeric") {
        return typeof value === "string";
    } else if (type === "Boolean") {
        return typeof value === "boolean";
    } else {
        if (value === null) return false;
        return type.some((choice) => choice?.name === value);
    }
}

function DataEntryValueStringifyType(value: any, type: DataEntryValueType): string {
    if (!DataEntryValueVerifyType(value, type)) throw new Error("Invalid type");
    if (type === "Boolean") {
        if (value) {
            return "1"; // Truthy value
        } else {
            return ""; // Falsy value
        }
    } else {
        return String(value);
    }
}

function DataEntryValueParseType(value: string, type: DataEntryValueType): any {
    let v: any;
    if (type === "Numeric") {
        v = parseInt(value);
    } else if (type === "EnhancedNumeric") {
        v = parseFloat(value);
    } else if (type === "AlphaNumeric") {
        v = String(value);
    } else if (type === "Boolean") {
        v = Boolean(value);
    } else {
        v = String(value);
    }
    if (!DataEntryValueVerifyType(value, type)) throw new Error("Invalid value");
    return v;
}

export interface DataEntryValueChoice {
    name: string;
    label: string;
}

export type DataEntryValueType = "Numeric" | "EnhancedNumeric" | "AlphaNumeric" | "Boolean" | Array<DataEntryValueChoice | null>;

export type DataEntryResult = Record<string, { value: any, type: DataEntryValueType }>;

export type DataEntryCheckRule = (value: any, type: DataEntryValueType) => {
    accepted: boolean;
    mandatory?: boolean; // Default false
};

export type DataEntryCrossCheckRule = (values: DataEntryResult) => {
    accepted: boolean;
    concernedFields?: string[]; // Must be filled if accepted is false
    mandatory?: boolean; // Default false
};

interface DataEntryValue {
    accepted: boolean;
    value: string | null;
    currentFieldValue: string;
}

export interface DataEntryField {
    name: string;
    label: string;
    type: DataEntryValueType;
    preEnteredValue?: any;
    preEnteredValueAccepted?: boolean; // Default false

    rulesToCheck?: DataEntryCheckRule[];
}

export interface DataEntryAdditionalButton {
    text: string | null;
    symbol: string | null;
    type: EButtonType;

    left: number;
    top: number;
    width: number;
    height: number;

    action: (window: DataEntryWindow) => void;
}

export interface DataEntryWindowOptions {
    title: string;
    confirmMessage: string;
    fields: DataEntryField[];
    additionalButtons?: DataEntryAdditionalButton[];
    halfLayoutIfApplicable?: "Disabled" | "EnabledWithLabel" | "EnabledWithoutLabel";

    rulesToCheck?: DataEntryCrossCheckRule[];
    onFinished: (values: DataEntryResult) => void;
    onCancel: () => void;
}

export class DataEntryWindow implements Subwindow {
    options: DataEntryWindowOptions;
    constructor(options: DataEntryWindowOptions) {
        this.options = options;

        // Initializing values based on options
        for (let field of options.fields) {
            let currentValue: string | undefined = undefined;
            if (DataEntryValueVerifyType(field.preEnteredValue, field.type)) {
                currentValue = DataEntryValueStringifyType(field.preEnteredValue, field.type);
            }
            let obj: DataEntryValue = {
                accepted: field.preEnteredValueAccepted === true,
                value: currentValue ?? null,
                currentFieldValue: ""
            }

            this.values[field.name] = obj;
            this.fields[field.name] = field;
        }
        this.fieldLength = options.fields.length;
    }
    uid: number = 0;
    values: Record<string, DataEntryValue> = {};
    fields: Record<string, DataEntryField> = {};
    fieldLength: number;

    get useHalfLayout() {
        return Object.keys(this.fields).length === 1 && (this.options.halfLayoutIfApplicable === "EnabledWithLabel" || this.options.halfLayoutIfApplicable === "EnabledWithoutLabel");
    }
    get disableLabel() {
        return Object.keys(this.fields).length === 1 && this.options.halfLayoutIfApplicable === "EnabledWithoutLabel";
    }

    cancel(fireEvent: boolean) {
        if (fireEvent) {
            this.options.onCancel && this.options.onCancel();
        }
        CloseSubwindow(this.uid);
    }

    onKeyboardKeyPressed?: (newData: string) => void;
    onKeyboardConfirmPressed?: (data: string) => void;

    render() {
        let [page, _setPage] = useState<number>(1);
        let [currentFieldId, _setField] = useState<number>(0);
        function setPage(k: number) {
            console.log(k, currentFieldId, 4 * (page - 1), 4 * page);
            if(currentFieldId < 4 * (page - 1) || currentFieldId >= 4 * page) {
                _setField(4 * (page - 1));
            }
            _setPage(k);
        }
        function setField(k: number) {
            setPage(Math.floor(currentFieldId / 4) + 1)
            _setField(k);
        }
        let [navLocked, setNavLocked] = useState<boolean>(false);

        let currentTitle = this.options.title;
        let totalPages = Math.ceil(this.options.fields.length / 4)

        if (totalPages > 1) {
            currentTitle += ` (${page}/${totalPages})`;
        }

        let useHalfLayout = this.useHalfLayout;
        let disableLabel = this.disableLabel;

        let renderedElements: ReactNode[] = [];
        if (this.options.additionalButtons && this.options.additionalButtons.length >= 1) {
            renderedElements.push(
                this.options.additionalButtons.map((v, i) =>
                    <EButton key={i} text={v.text} symbol={v.symbol} type={v.type} enabled={true} style={{
                        left: window.cell * v.left,
                        top: window.cell * v.top,
                        width: window.cell * v.width,
                        height: window.cell * v.height
                    }} />
                )
            )
        }

        // Rendering fields
        let hCnt = 0; // 10.3.5.14 says the Y should start from 50, but this is obviously an error and I've submitted a ticket to ERA.
        if (useHalfLayout) hCnt++;
        for (let i = 4 * (page - 1); i < Math.min(this.fieldLength, 4 * page); i++) {
            let field = this.options.fields[i];

            let cn = "field";
            if (i == currentFieldId) {
                cn += " selected"
            }

            renderedElements.push(<FButton onClick={() => {
                if(i !== currentFieldId) {
                    console.log("Setting field to ", i)
                    setField(i);
                }
            }} key={renderedElements.length} type="DOWN" enabled={true} className={cn} style={{ top: window.cell * 50 * hCnt++ }}>
                {disableLabel ? null : <div className="label"><span>{field.label}</span></div>}
                <div className="data"><span>{i}</span></div>
            </FButton>);
        }

        // Navigation buttons
        if (totalPages > 1) {
            renderedElements.push(
                <EButton key={renderedElements.length} text={null} className="prev" symbol="NA_Previous" type="UP" enabled={page > 1 && !navLocked} onClick={() => {
                    setPage(page - 1)
                }} />
            )
            renderedElements.push(
                <EButton key={renderedElements.length} text={null} className="next" symbol="NA_Next" type="UP" enabled={page < totalPages && !navLocked} onClick={() => {
                    setPage(page + 1)
                }} />
            )
        }

        if (!useHalfLayout) { // We can use hooks inside condition, because 'useHalfLayout' never changes.
            let confirmAllowed = true;

            let [pressed, setPressed] = useState<boolean>(false);

            // Confirmation buttons
            renderedElements.push(
                <FButton className="confirm" enabled={confirmAllowed} type="UP" setPressed={setPressed}>
                    <div className="label">
                        <span>{this.options.confirmMessage}</span>
                    </div>
                    <div className="filled" style={{
                        borderColor: pressed ? "transparent" : undefined,
                        backgroundColor: confirmAllowed ? E_COLORS.mediumGrey : E_COLORS.darkGrey
                    }}>
                        <span>Yes</span>
                    </div>
                </FButton>
            )
        }

        // Keyboard
        let currentField = this.options.fields[currentFieldId];
        if (currentField.type === "Numeric") {
            let Kb = this.numericKeyboard.bind(this);
            renderedElements.push(<Kb key={renderedElements.length} />)
        }

        let className = "subwindow subwindow-dataentry"
        if (useHalfLayout) className += " half"; else className += " total";

        return <div className={className}>
            <div className="title">{currentTitle}</div>
            <EButton text={null} symbol="NA_CloseWindow" enabled={true} type="UP" className="close" onClick={() => {
                this.cancel(true);
            }} />
            {renderedElements}
        </div>;
    }

    numericKeyboard() {
        let keys = [];
        let lbs = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "SY:NA_Delete", "0", "."]
        for (let i = 0; i < 12; i++) {
            let x = 0;
            let y = 0;
            let enabled = true;
            let repeat = false;
            let className = undefined;
            x = i % 3;
            y = Math.floor(i / 3);
            if (i == 9) {
                repeat = true;
            }
            if (i == 11) {
                enabled = false;
                className = "dot";
            }

            let Key = this.key.bind(this);

            keys.push(<Key key={i} left={x} top={y} text={lbs[i]} enabled={enabled} repeat={repeat} className={className} action={() => {
                alert(i)
            }} />)
        }
        return <>
            {keys}
        </>
    }

    eNumericKeyboard() {

    }

    alphaNumericKeyboard() {

    }

    dedicatedKeyboard() {

    }

    key({ text, left, top, enabled, repeat, action, className }: { text: string, left: number, top: number, enabled?: boolean, repeat?: boolean, action?: () => void, className?: string }) {
        let vsymbol = null;
        let vtext: string | null = text;

        if(vtext.startsWith("SY:")) {
            vsymbol = vtext.substring(3);
            vtext = null;
        }

        let classNameV = "key";
        if (className) classNameV += " " + className;

        let xo = 0;
        if (!this.useHalfLayout) {
            xo += 334;
        }

        return <EButton className={classNameV} style={{ left: window.cell * (102 * left + xo), top: window.cell * (50 * top + 200) }}
            text={vtext} symbol={vsymbol} enabled={enabled !== false} onClick={action} type={repeat ? "DOWNREPEAT" : "DOWN"} />
    }
}