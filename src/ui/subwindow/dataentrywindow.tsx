import React, { ReactElement, ReactNode, createRef, useEffect, useState } from "react";
import { CloseSubwindow, Subwindow } from "../dmi"
import { EButton, EButtonType, FButton, useEButtonBehaviour } from "../components";
import { E_COLORS } from "../constants";

function isNumeric(str: string) {
    return isNaN(parseInt(str)) === false || str === ".";
}

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
    if (!DataEntryValueVerifyType(v, type)) throw new Error("Invalid value");
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
    currentFieldValue: string | null;
}

export interface DataEntryField {
    name: string;
    label: string | null;
    type: DataEntryValueType;
    preEnteredValue?: any;

    rulesToCheck?: DataEntryCheckRule[];
}

export interface DataEntryAdditionalButton {
    text: string | null;
    trySymbol?: boolean;
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
    halfLayoutIfApplicable?: boolean;

    rulesToCheck?: DataEntryCrossCheckRule[];
    onFinished: (values: DataEntryResult) => void;
    onCancel: () => void;
}

export class DataEntryWindow implements Subwindow {
    uid: number = 0;

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
                accepted: false,
                value: currentValue ?? null,
                currentFieldValue: null
            }

            this.values.push(obj);
        }
        this.fieldCount = options.fields.length;
        this.pageCount = Math.ceil(this.fieldCount / 4);
    }

    values: DataEntryValue[] = [];
    readonly fieldCount: number;
    readonly pageCount: number;

    private _fieldId: number = 0;
    private updateFuncMap: Record<string, (() => void) | string[]> = {};
    private update(target: string) {
        if (!this.updateFuncMap[target]) return;
        let a = this.updateFuncMap[target];
        if (typeof a === "function") {
            setTimeout(() => {
                a();
            }, 200);
        } else {
            // Trigger update to all targets
            for (let t of a) {
                this.update(t);
            }
        }
    }

    get useHalfLayout() {
        return this.fieldCount === 1 && this.options.halfLayoutIfApplicable;
    }
    get canConfirmNow() {
        // check no value is null
        for (let value of this.values) {
            if (value.value === null) return false;
            if (value.currentFieldValue !== null) return false;
        }
        return true;
    }
    get fieldId() {
        return this._fieldId;
    }
    set fieldId(newFieldId: number) {
        if (this.navLocked) return;

        let value = this.values[this.fieldId];

        // If changing the field without saving, erase the current one.
        if (this.fieldId !== newFieldId && value.currentFieldValue !== null) {
            value.accepted = false;
            value.value = null;
            value.currentFieldValue = null;
        }

        this._fieldId = newFieldId;
        this.update("window")

        this.values[newFieldId].currentFieldValue = null;
    }
    get page() {
        return Math.floor(this.fieldId / 4) + 1;
    }
    set page(value: number) {
        this.fieldId = Math.min((value - 1) * 4, this.fieldCount - 1);
    }

    get navLocked() {
        return false; // Not implemented yet
    }

    /**
     * This value is set by each keyboard component. Depending on the type of the field, it should be set to true or false.
     */
    useKeyboardCursor = false;

    keyboardCursorTimeoutId: number = -1;
    lastKeyboardKeyPressed: string | null = null;
    cursorPosition: number = 0;

    resetCursor() {
        clearTimeout(this.keyboardCursorTimeoutId as any);
        this.keyboardCursorTimeoutId = -1;
        this.lastKeyboardKeyPressed = null;
        this.cursorPosition = 0;
        this.useKeyboardCursor = false;
    }

    cancel(fireEvent: boolean) {
        if (fireEvent) {
            this.options.onCancel && this.options.onCancel();
        }
        CloseSubwindow(this.uid);
    }

    onKeyboardKeyPressed?: (newData: string) => void;
    onKeyboardConfirmPressed?: (data: string) => void;

    /**
     * Because we are abusing React, we need to manually specify which part of the component should be updated. Otherwise, the whole component will be re-rendered, resulting in event listeners being broken.
     * @param name 
     * @param enabled 
     */
    usePartialUpdater(name: string, enabled: boolean = true) {
        const [, setUpdate] = useState<boolean>(false);
        if (enabled)
            this.updateFuncMap[name] = () => {
                setUpdate((v) => !v);
            }
    }

    render = () => {
        // {// This is indeed the craziest thing I've ever done in React. I'm using hooks inside a class method. <-- Copilot wrote this comment after reading the code below. This means someone had written a code like this before.
        //     let [, _setFieldId] = useState<number>(0);
        //     this._setFieldId = (value: number) => {
        //         if (value < 0 || value >= this.fieldCount) return;
        //         this._fieldId = value;
        //         _setFieldId(value);
        //     }
        // }
        this.usePartialUpdater("window");

        let currentTitle = this.options.title;
        if (this.pageCount > 1) {
            currentTitle += ` (${this.page}/${this.pageCount})`;
        }

        let useHalfLayout = this.useHalfLayout;

        let renderedElements: ReactNode[] = [];
        if (this.options.additionalButtons && this.options.additionalButtons.length >= 1) {
            renderedElements.push(
                this.options.additionalButtons.map((v, i) =>
                    <EButton key={i} text={v.text} trySymbol={v.trySymbol} type={v.type} enabled={true} style={{
                        left: window.cell * v.left,
                        top: window.cell * v.top,
                        width: window.cell * v.width,
                        height: window.cell * v.height
                    }} />
                )
            )
        }

        // Rendering fields
        // 10.3.5.14 says the Y should start from 50, but this is obviously an error and I've submitted a ticket to ERA.
        {
            let heightCount = 0;
            if (useHalfLayout) heightCount++; // Space for the title
            for (let i = 4 * (this.page - 1); i < Math.min(this.fieldCount, 4 * this.page); i++) {
                renderedElements.push(<this.Field key={"field_" + i} index={i} y={heightCount++} />);
            }
        }

        if (!useHalfLayout) { // We can use hooks inside condition, because 'useHalfLayout' never changes.
            renderedElements.push(<this.ConfirmArea key={renderedElements.length} />);
        }

        // Keyboard
        let currentField = this.options.fields[this.fieldId];
        if (currentField.type === "Numeric") {
            let Kb = this.numericKeyboard.bind(this);
            renderedElements.push(<Kb key={renderedElements.length} />)
        } else if (currentField.type === "EnhancedNumeric") {
            let Kb = this.eNumericKeyboard.bind(this);
            renderedElements.push(<Kb key={renderedElements.length} />)
        } else if (currentField.type === "AlphaNumeric") {
            let Kb = this.alphaNumericKeyboard.bind(this);
            renderedElements.push(<Kb key={renderedElements.length} />)
        } else if (currentField.type === "Boolean") {
            let Kb = this.booleanKeyboard.bind(this);
            renderedElements.push(<Kb key={renderedElements.length} />)
        } else {
            let Kb = this.dedicatedKeyboard.bind(this);
            renderedElements.push(<Kb key={renderedElements.length} fieldId={this.fieldId} />)
        }

        // Navigation buttons
        if (this.pageCount > 1) {
            renderedElements.push(
                <EButton key={"nav_prev"} text="NA_Previous" trySymbol className="prev" type="UP" enabled={this.page > 1 && !this.navLocked} onClick={() => {
                    this.page--;
                }} />
            )
            renderedElements.push(
                <EButton key={"nav_next"} text="NA_Next" trySymbol className="next" type="UP" enabled={this.page < this.pageCount && !this.navLocked} onClick={() => {
                    this.page++;
                }} />
            )
        }

        let className = "subwindow subwindow-dataentry"
        if (useHalfLayout) className += " half"; else className += " total";

        return <div className={className}>
            <div className="title">{currentTitle}</div>
            <EButton text="NA_CloseWindow" trySymbol enabled={true} type="UP" className="close" onClick={() => {
                this.cancel(true);
            }} />
            {useHalfLayout ? null : <this.EchoText />}
            {renderedElements}
        </div>;
    }

    EchoText = () => {
        let c: ReactNode[] = [];

        for (let i = 0; i < this.fieldCount; i++) {
            let field = this.options.fields[i];
            let value = this.values[i];

            let rawValue = value.value;
            let valueStr = "";
            if (rawValue === null) {
                valueStr = "";
            } else if (field.type === "AlphaNumeric" || field.type === "EnhancedNumeric" || field.type === "Numeric") {
                let chars = [...String(rawValue)];
                for (let j = 0; j < chars.length; j++) {
                    if (j > 0 && j % 5 === 0) valueStr += " ";
                    valueStr += chars[j];
                }
            } else if (field.type === "Boolean") {
                valueStr = rawValue ? "Yes" : "No";
            } else {
                let choice = field.type.find((v) => v?.name === rawValue);
                valueStr = choice?.label ?? "";
            }

            c.push(<div key={i} className="echotext-row">
                <div className="left">{field.label}</div>
                <div className="right">{valueStr}</div>
            </div>)
        }

        return <div className="echotext-box">
            {c}
        </div>
    }

    ConfirmArea = () => {
        const confirmAllowed = this.canConfirmNow;

        const onConfirmClicked = () => {
            let res: DataEntryResult = {};
            for (let i = 0; i < this.fieldCount; i++) {
                let field = this.options.fields[i];
                let value = this.values[i];

                if (value.value === null) {
                    // Invalid data
                    return;
                }

                res[field.name] = {
                    value: DataEntryValueParseType(value.value, field.type),
                    type: field.type
                }
            }

            this.options.onFinished(res);
            CloseSubwindow(this.uid);
        }

        return <FButton className="confirm-box" enabled={confirmAllowed} onClick={onConfirmClicked} type="UP">
            <div className="label">
                <span>{this.options.confirmMessage}</span>
            </div>
            <div className="filled" style={{
                backgroundColor: confirmAllowed ? E_COLORS.mediumGrey : E_COLORS.darkGrey
            }}>
                <span>Yes</span>
            </div>
        </FButton>
    }

    Field = ({ index: i, y }: { index: number, y: number }) => {
        let field = this.options.fields[i];
        let value = this.values[i];

        let classNames = "field";
        if (i == this.fieldId) {
            classNames += " selected"
        } else if (value.accepted) {
            classNames += " accepted"
        }

        this.usePartialUpdater("currentField", i == this.fieldId);

        let content: string | null;
        if (value.currentFieldValue !== null) {
            content = value.currentFieldValue;
        } else {
            content = value.value;
        }

        const onFieldClicked = () => {
            let targetFieldId = i;
            if (i === this.fieldId) {
                value.accepted = true;
                if (value.currentFieldValue !== null) { // Change has been made
                    // Validate and save
                    // Proceed to the next field

                    let valid = true;
                    if (valid) {
                        value.value = value.currentFieldValue;
                        value.currentFieldValue = null;
                    } else {
                        value.accepted = false;
                        return;
                    }
                }

                targetFieldId = (i + 1) % this.fieldCount;
            }
            this.fieldId = targetFieldId;

            this.resetCursor();
        }

        useEffect(() => {
            let cursor = document.getElementById(`cursor_${this.uid}_${i}`);
            if (!cursor) return;
            let a = cursor.parentElement!.getBoundingClientRect();
            let b = document.getElementById(`field_ch_${this.uid}_${i}_${this.cursorPosition}`)?.getBoundingClientRect();

            if (!b || !this.useKeyboardCursor || i !== this.fieldId || (value.currentFieldValue === null && value.value !== null)) {
                cursor.style.display = "none";
                return;
            }

            cursor.style.display = "inline-block";

            let x = b.left - a.left;
            let y = b.top - a.top;

            cursor.style.left = x + "px";
            cursor.style.top = y + "px";
            cursor.style.width = b.width + "px";
            cursor.style.height = b.height + "px";
        })

        let chs = [];

        if (content !== null) {
            if (field.type === "Numeric" || field.type === "EnhancedNumeric" || field.type === "AlphaNumeric") {
                content += "_";
                let nospace = 0;
                for (let j = 0; j < content.length; j++) {
                    if (nospace >= 5 || (j > 0 && content[j] !== "_" && isNumeric(content[j - 1]) !== isNumeric(content[j]))) {
                        nospace = 0;
                        chs.push(<span key={j + ".n"}>{" "}</span>)
                    }
                    chs.push(<span key={j} id={`field_ch_${this.uid}_${i}_${j}`} style={{ color: j == content.length - 1 ? "transparent" : undefined }}>{content[j]}</span>)
                    nospace++;
                }
            } else if (field.type === "Boolean") {
                chs.push(<span key={0}>{content ? "Yes" : "No"}</span>)
            } else {
                let choice = field.type.find((v) => v?.name === content);
                chs.push(<span key={0}>{choice?.label}</span>)
            }
        } else {
            chs = [];
        }

        return <FButton onClick={onFieldClicked} type="DOWN" enabled={true} className={classNames} style={{ top: window.cell * 50 * y }
        }>
            {field.label === null ? null : <div className="label"><span>{field.label}</span></div>}
            < div className="data" >
                <span>
                    {chs}
                    <div id={`cursor_${this.uid}_${i}`} className="cursor"></div>
                </span>
            </div >
        </FButton >
    }

    numericKeyboard = () => {
        return this.generalNumericKeyboard(false);
    }

    eNumericKeyboard = () => {
        return this.generalNumericKeyboard(true);
    }

    generalNumericKeyboard = (allowDot: boolean) => {
        let keys = [];
        let lbs = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "SY:NA_Delete", "0", "."]
        for (let i = 0; i < 12; i++) {
            let onClick: () => void = () => { };

            if (i === 9) {
                onClick = () => {
                    let value = this.values[this.fieldId];
                    if (value.currentFieldValue === null) value.currentFieldValue = "";
                    if (value.currentFieldValue.length > 0) value.currentFieldValue = value.currentFieldValue.substring(0, value.currentFieldValue.length - 1);

                    this.lastKeyboardKeyPressed = "Del";
                    this.keyboardCursorTimeoutId = -1;
                    this.cursorPosition = value.currentFieldValue.length;

                    this.update("currentField")
                }
            } else {
                onClick = () => {
                    let value = this.values[this.fieldId];
                    if (value.currentFieldValue === null) value.currentFieldValue = "";
                    value.currentFieldValue += lbs[i];

                    this.lastKeyboardKeyPressed = lbs[i];
                    this.keyboardCursorTimeoutId = -1;
                    this.cursorPosition = value.currentFieldValue.length;

                    this.update("currentField")
                }
            }

            keys.push(<this.key key={i} x={i % 3} y={Math.floor(i / 3)} text={lbs[i]} enabled={i !== 11 || allowDot} repeat={i === 9} className={i === 11 ? "dot" : ""} action={onClick} />)
        }

        this.useKeyboardCursor = true;

        return <div className={`keyboard-box ${allowDot ? "enumeric" : "numeric"}`}>
            {keys}
        </div>
    }

    alphaNumericKeyboard = () => {
        let keys = [];
        let lbs = ["1", "2 abc", "3 def", "4 ghi", "5 jkl", "6 mno", "7 pqrs", "8 tuv", "9 wxyz", "SY:NA_Delete", "0", "."]
        for (let i = 0; i < 12; i++) {
            let onClick: () => void = () => { };

            let ostr = lbs[i];
            let str = ostr.replace(" ", "");

            if (i === 9) {
                onClick = () => {
                    let value = this.values[this.fieldId];
                    if (value.currentFieldValue === null) value.currentFieldValue = "";
                    if (value.currentFieldValue.length > 0) value.currentFieldValue = value.currentFieldValue.substring(0, value.currentFieldValue.length - 1);

                    clearTimeout(this.keyboardCursorTimeoutId as any);
                    this.lastKeyboardKeyPressed = "Del";
                    this.keyboardCursorTimeoutId = -1;
                    this.cursorPosition = value.currentFieldValue.length;

                    this.update("currentField")
                }
            } else {
                onClick = () => {
                    let value = this.values[this.fieldId];
                    if (value.currentFieldValue === null) value.currentFieldValue = "";

                    if (value.currentFieldValue.length - 1 === this.cursorPosition && this.lastKeyboardKeyPressed === ostr && ostr.includes(" ")) { // Editing the last character
                        let lastChar = value.currentFieldValue.charAt(value.currentFieldValue.length - 1);
                        let shorterStr = value.currentFieldValue.substring(0, value.currentFieldValue.length - 1);
                        let newChar = str.charAt((str.indexOf(lastChar) + 1) % str.length);

                        value.currentFieldValue = shorterStr + newChar;
                    } else if (ostr.includes(" ")) { // New editable character (for 2 seconds)
                        clearTimeout(this.keyboardCursorTimeoutId as any);
                        this.lastKeyboardKeyPressed = ostr;

                        value.currentFieldValue += str.charAt(0);
                        this.cursorPosition = value.currentFieldValue.length - 1;

                        this.keyboardCursorTimeoutId = setTimeout(() => {
                            this.keyboardCursorTimeoutId = -1;
                            this.lastKeyboardKeyPressed = "";
                            this.cursorPosition++;

                            console.log("I was triggered from " + ostr)

                            this.update("currentField")
                        }, 2000) as any;
                    } else { // Not editable character
                        clearTimeout(this.keyboardCursorTimeoutId as any);
                        this.lastKeyboardKeyPressed = ostr;
                        this.keyboardCursorTimeoutId = -1;

                        value.currentFieldValue += ostr;
                        this.cursorPosition = value.currentFieldValue.length;
                    }

                    this.update("currentField")
                }
            }

            let child: string | ReactElement = lbs[i];
            if (child.includes(" ")) {
                let a = child.split(" ");
                child = <>{a[0] + " "}<span className="letter">{a[1]}</span></>
            }
            keys.push(<this.key key={i} x={i % 3} y={Math.floor(i / 3)} text={child} enabled={i !== 11} repeat={i === 9} className={i === 11 ? "dot" : ""} action={onClick} />)
        }

        this.useKeyboardCursor = true;

        return <div className="keyboard-box alphanumeric">
            {keys}
        </div>
    }

    booleanKeyboard = () => {
        let keys = [];
        let lbs = ["No", "Yes"]
        for (let i = 0; i < 2; i++) {
            let onClick: () => void = () => { };

            onClick = () => {
                let value = this.values[this.fieldId];
                if (i == 0) {
                    value.currentFieldValue = "";
                } else {
                    value.currentFieldValue = "1";
                }

                this.update("currentField")
            }

            keys.push(<this.key key={i} x={i % 3} y={2} text={lbs[i]} action={onClick} />)
        }

        this.useKeyboardCursor = false;

        return <div className="keyboard-box dedicated">
            {keys}
        </div>
    }

    dedicatedKeyboard = ({ fieldId }: { fieldId: number }) => {
        let field = this.options.fields[fieldId];
        let keys = [];
        let lbs = field.type as DataEntryValueChoice[];

        let [page, setPage] = useState(0);
        let pages = 1;
        if (lbs.length > 12) {
            pages = Math.ceil(lbs.length / 11);
        }

        let pageMax = lbs.length;
        if (pages > 1) {
            // items in current page
            pageMax = Math.min(11, lbs.length - page * 11);
        }

        for (let i = 0; i < pageMax; i++) {
            let onClick: () => void = () => { };

            onClick = () => {
                let value = this.values[this.fieldId];
                value.currentFieldValue = lbs[i + page * 11].name;

                this.update("currentField")
            }

            keys.push(<this.key key={i + page * 11} x={i % 3} y={Math.floor(i / 3)} text={lbs[i + page * 11].label} action={onClick} />)
        }

        if (pages > 1) {
            const nextPage = (page + 1) % pages;
            // More button
            keys.push(<this.key key={"pageChangerTo" + nextPage} x={2} y={3} text="SY:NA_More" action={() => {
                setTimeout(() => {
                    setPage(nextPage);
                }, 200);
            }} />)
        }

        this.useKeyboardCursor = false;

        return <div className="keyboard-box dedicated">
            {keys}
        </div>
    }

    key({ text, x, y, enabled, repeat, action, className }: { text: string | ReactElement, x: number, y: number, enabled?: boolean, repeat?: boolean, action?: () => void, className?: string }) {
        let trySymbol = false;

        if (typeof text === "string" && text.startsWith("SY:")) {
            trySymbol = true;
            text = text.substring(3);
        }

        let classNameV = "key";
        if (className) classNameV += " " + className;

        return <EButton className={classNameV} style={{ left: window.cell * 102 * x, top: window.cell * 50 * y }}
            text={text} trySymbol={trySymbol} enabled={enabled !== false} onClick={action} type={repeat ? "DOWNREPEAT" : "DOWN"} />
    }
}