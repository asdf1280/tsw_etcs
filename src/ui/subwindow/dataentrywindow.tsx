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
} | null;

export type DataEntryCrossCheckRule = (values: DataEntryResult) => {
    accepted: boolean;
    concernedFields?: string[]; // Must be filled if accepted is false
    mandatory?: boolean; // Default false
} | null;

interface DataEntryValue {
    accepted: boolean;
    /**
     * This refers to 'Data value' in Figure 97
     */
    value: string | null;
    /**
     * This refers to 'Value corresponding to the pressed key(s)' in Figure 97
     */
    currentFieldValue: string | null;
    /**
     * Read 10.3.4 Data Checks for more information.
     */
    complaint: "YellowPlus" | "RedPlus" | "YellowQuestion" | "RedQuestion" | null;
}

export interface DataEntryField {
    name: string;
    label: string | null;
    type: DataEntryValueType;
    preEnteredValue?: any;

    /**
     * When writting rules, make sure to write 'technical' rules before 'operational' rules. That's the specification. All technical checks must be done before operational checks.
     */
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

    /**
     * When writting rules, make sure to write 'technical' rules before 'operational' rules. That's the specification. All technical checks must be done before operational checks.
     */
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
                currentFieldValue: null,
                complaint: null
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
            }, 50);
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
    get confirmButtonState(): "Enabled" | "DelayOverride" | "Disabled" {
        // check no value is null
        for (let value of this.values) {
            if (value.value === null) return "Disabled";
            if (value.currentFieldValue !== null) return "Disabled";
            if (value.complaint !== null && value.complaint !== "YellowQuestion") return "Disabled";
        }
        for (let value of this.values) {
            if (value.complaint === "YellowQuestion") return "DelayOverride";
        }
        return "Enabled";
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
            if (value.complaint?.endsWith("Plus")) {
                value.complaint = null;
            }
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

    /////////// Keyboard Cursor ///////////

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

    /////////// End of Keyboard Cursor ///////////

    /////////// Data Check ///////////
    get navLocked() {
        let currentFieldValue = this.values[this.fieldId];
        if (currentFieldValue.currentFieldValue === null && currentFieldValue.value !== null && currentFieldValue.complaint?.endsWith("Plus")) {
            return true;
        }
        return false;
    }

    resetComplaints() {
        for (let value of this.values) {
            value.complaint = null;
        }
        this.update("echoText");
    }

    lastDataCrossCheckOverrideIndex: number = -1;
    /////////// End of Data Check ///////////

    /**
     * Because we are abusing React, we need to manually specify which part of the component should be updated. Otherwise, the whole component will be re-rendered, resulting in event listeners being broken.
     * @param name 
     * @param enabled 
     */
    usePartialUpdater(name: string, enabled: boolean = true) {
        const [, setUpdate] = useState<boolean>(false);

        useEffect(() => {
            if (!enabled) return;
            let refFn = () => {
                setUpdate((v) => !v);
            };
            this.updateFuncMap[name] = refFn;
            return () => {
                if (this.updateFuncMap[name] === refFn) {
                    delete this.updateFuncMap[name];
                }
            }
        })
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
            {<this.Fields />}
            {useHalfLayout ? null : <this.EchoText />}
            {renderedElements}
        </div>;
    }

    EchoText = () => {
        this.usePartialUpdater("echoText", true);
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

            let dataPartClassname = "right";
            if (value.complaint === "RedPlus") {
                dataPartClassname += " red";
                valueStr = "++++";
            } else if (value.complaint === "YellowPlus") {
                dataPartClassname += " yellow";
                valueStr = "++++";
            } else if (value.complaint === "RedQuestion") {
                dataPartClassname += " red";
                valueStr = "????";
            } else if (value.complaint === "YellowQuestion") {
                dataPartClassname += " yellow";
                valueStr = "????";
            }

            let rowClassname = "echotext-row";
            if (value.accepted) {
                rowClassname += " accepted";
            } else {
                rowClassname += " not-accepted";
            }

            c.push(<div key={i} className={rowClassname}>
                <div className="left">{field.label}</div>
                <div className={dataPartClassname}>{valueStr}</div>
            </div>)
        }

        return <div className="echotext-box">
            {c}
        </div>
    }

    ConfirmArea = () => {
        this.usePartialUpdater("confirmButton", true);
        let state = this.confirmButtonState;

        const onConfirmClicked = () => {
            let res: DataEntryResult = {};
            for (let i = 0; i < this.fieldCount; i++) {
                let field = this.options.fields[i];
                let value = this.values[i];

                if (value.value === null) {
                    // Invalid data. This should never happen in normal circumstances, because the button should be disabled.
                    return;
                }

                res[field.name] = {
                    value: DataEntryValueParseType(value.value, field.type),
                    type: field.type
                }
            }

            // Data cross check
            if (this.options.rulesToCheck) {
                this.resetComplaints();
                for (let i = 0; i < this.options.rulesToCheck.length; i++) {
                    let rule = this.options.rulesToCheck[i];
                    let checkResult = rule(res);
                    if (checkResult === null) continue;
                    let { accepted, concernedFields, mandatory } = checkResult;

                    if (!accepted && mandatory && concernedFields) {
                        // Find all fields that are concerned and set their complaint to RedQuestion
                        for (let j = 0; j < this.options.fields.length; j++) {
                            if (concernedFields.includes(this.options.fields[j].name)) {
                                this.values[j].complaint = "RedQuestion";
                            }
                        }
                        this.update("window");
                        return;
                    }
                }

                for (let i = 0; i < this.options.rulesToCheck.length; i++) {
                    let rule = this.options.rulesToCheck[i];
                    let checkResult = rule(res);
                    if (checkResult === null) continue;
                    let { accepted, concernedFields, mandatory } = checkResult;

                    if (!accepted && !mandatory && concernedFields && this.lastDataCrossCheckOverrideIndex < i) {
                        // Find all fields that are concerned and set their complaint to RedQuestion
                        console.log(`Cross check failed. Concerned fields: ${concernedFields.join(", ")} Rule index: ${i}`)
                        for (let j = 0; j < this.options.fields.length; j++) {
                            if (concernedFields.includes(this.options.fields[j].name)) {
                                this.values[j].complaint = "YellowQuestion";
                            }
                        }
                        this.lastDataCrossCheckOverrideIndex = i;
                        this.update("window");
                        return;
                    }
                }
            }

            CloseSubwindow(this.uid);
            this.options.onFinished(res);
        }

        let enabled = state === "Enabled" || state === "DelayOverride";
        let type: EButtonType = state === "DelayOverride" ? "DELAY" : "UP";

        // We need the key to force the rerender of button when type changes. Otherwise the new button type doesn't work properly.
        return <FButton key={"b_" + type + "e" + enabled} className="confirm-box" enabled={enabled} onClick={onConfirmClicked} type={type}>
            <div className="label">
                <span>{this.options.confirmMessage}</span>
            </div>
            <div className="filled" style={{
                backgroundColor: enabled ? E_COLORS.mediumGrey : E_COLORS.darkGrey
            }}>
                <span>Yes</span>
            </div>
        </FButton>
    }

    Fields = () => {
        this.usePartialUpdater("fields", true);

        // Rendering fields
        // 10.3.5.14 says the Y should start from 50, but this is obviously an error and I've submitted a ticket to ERA.
        let heightCount = 0;
        if (this.useHalfLayout) heightCount++; // Space for the title

        let renderedElements: ReactNode[] = [];

        for (let i = 4 * (this.page - 1); i < Math.min(this.fieldCount, 4 * this.page); i++) {
            renderedElements.push(<this.Field key={"field_" + i} index={i} y={heightCount++} />);
        }

        return <>
            {renderedElements}
        </>
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

        this.usePartialUpdater("fields", i == this.fieldId);

        let content: string | null;
        if (value.currentFieldValue !== null) { // [Figure 97] 'Selected IF / value of pressed key(s)' state
            content = value.currentFieldValue;
        } else {
            content = value.value; // [Figure 97] '(Not) Selected IF / (not accepted) data value' state
        }

        const onHalfWindowFinishClicked = () => {
            let res: DataEntryResult = {};

            let field = this.options.fields[0];
            let value = this.values[0];

            let parsed: any;
            try {
                parsed = DataEntryValueParseType(value.value!, field.type);
            } catch {
                return; // No way to feedback in half layout
            }

            res[field.name] = {
                value: DataEntryValueParseType(parsed, field.type),
                type: field.type
            }

            if (this.options.rulesToCheck) {
                for (let rule of this.options.rulesToCheck) {
                    let checkResult = rule(res);
                    if (!checkResult?.accepted) {
                        return; // No way to feedback in half layout
                    }
                }
            }

            if (field.rulesToCheck) {
                for (let rule of field.rulesToCheck) {
                    let checkResult = rule(parsed, field.type);
                    if (!checkResult?.accepted) {
                        return; // No way to feedback in half layout
                    }
                }
            }
            CloseSubwindow(this.uid);
            this.options.onFinished(res);
        }

        const onCurrentFieldClicked = () => {
            const isShowingTempValues = value.currentFieldValue !== null;
            const isAnyChangeExpected = isShowingTempValues || !value.accepted;
            // If user edited the value after yellow ++++ was shown, it's not considered as an override.
            const overridingActive = value.complaint === "YellowPlus" && !isShowingTempValues;

            // Clear the displayed complaints when (1) a new data is entered or (2) the user is currently overriding the value.
            if (isShowingTempValues || overridingActive) {
                this.resetComplaints();
                this.lastDataCrossCheckOverrideIndex = -1;
            }

            // [Figure 97] Transition from 'Selected IF / value of pressed key(s)' state to '(Not) Selected IF / Data value' state
            if (isShowingTempValues) {
                value.value = value.currentFieldValue;
                value.currentFieldValue = null;
                value.accepted = true;
            }

            // Skip the data check when it isn't entered yet, or the driver's action isn't going to change anything.
            if (value.value === null || !isAnyChangeExpected) {
                this.fieldId = (i + 1) % this.fieldCount;
                this.resetCursor();
                return;
            }

            // Technical resolution and type check
            let parsed: any;
            try {
                parsed = DataEntryValueParseType(value.value!, field.type);
            } catch {
                // red plus error (resolution error)
                value.complaint = "RedPlus";
                this.update("window");
                return;
            }

            let fieldDef = this.options.fields[i];
            let rules = fieldDef.rulesToCheck;

            if (rules && !overridingActive) {
                // Separate the loop to make sure all mandatory checks are done first

                // [10.3.4.2] Technical range checks
                for (let rule of rules) {
                    let checkResult = rule(parsed, fieldDef.type);
                    if (checkResult === null) continue;
                    let { accepted, mandatory } = checkResult;

                    if (!accepted && mandatory) {
                        value.complaint = "RedPlus"
                        this.update("window");
                        return;
                    }
                }

                // [10.3.4.5] Operational range checks
                for (let rule of rules) {
                    let checkResult = rule(parsed, fieldDef.type);
                    if (checkResult === null) continue;
                    let { accepted, mandatory } = checkResult;

                    if (!accepted && !mandatory) {
                        value.complaint = "YellowPlus"
                        this.update("window");
                        return;
                    }
                }
            }

            value.accepted = true;
            this.fieldId = (i + 1) % this.fieldCount;
            this.resetCursor();
        }

        const onOtherFieldClicked = () => {
            this.fieldId = i;
            this.resetCursor();
        }

        const onFieldClicked = () => {
            if (this.useHalfLayout) {
                onHalfWindowFinishClicked();
                return;
            }

            if (i === this.fieldId) {
                onCurrentFieldClicked();
            } else {
                onOtherFieldClicked();
            }
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

        let enabled = true;
        if (value.complaint === "RedPlus" && value.currentFieldValue === null) enabled = false;
        if (i !== this.fieldId && this.navLocked) enabled = false;

        let enterButtonType: EButtonType = "UP";
        if (value.complaint === "YellowPlus" && value.currentFieldValue === null) enterButtonType = "DELAY";

        // We need the key to force the rerender of button when type changes. Otherwise the new button type doesn't work properly.
        return <FButton key={"a_" + i + "_" + enterButtonType + "e" + enabled} onClick={onFieldClicked} type={enterButtonType} enabled={enabled} className={classNames} style={{ top: window.cell * 50 * y }
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
                    if (value.currentFieldValue.length > 0) {
                        value.currentFieldValue = value.currentFieldValue.substring(0, value.currentFieldValue.length - 1);
                    }

                    this.lastKeyboardKeyPressed = "Del";
                    this.keyboardCursorTimeoutId = -1;
                    this.cursorPosition = value.currentFieldValue.length;

                    this.update("fields")
                }
            } else {
                onClick = () => {
                    let value = this.values[this.fieldId];
                    if (value.currentFieldValue === null) value.currentFieldValue = "";
                    value.currentFieldValue += lbs[i];

                    this.lastKeyboardKeyPressed = lbs[i];
                    this.keyboardCursorTimeoutId = -1;
                    this.cursorPosition = value.currentFieldValue.length;

                    this.update("fields")
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
                    if (value.currentFieldValue.length > 0) {
                        value.currentFieldValue = value.currentFieldValue.substring(0, value.currentFieldValue.length - 1);
                    }

                    clearTimeout(this.keyboardCursorTimeoutId as any);
                    this.lastKeyboardKeyPressed = "Del";
                    this.keyboardCursorTimeoutId = -1;
                    this.cursorPosition = value.currentFieldValue.length;

                    this.update("fields")
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

                            this.update("fields")
                        }, 2000) as any;
                    } else { // Not editable character
                        clearTimeout(this.keyboardCursorTimeoutId as any);
                        this.lastKeyboardKeyPressed = ostr;
                        this.keyboardCursorTimeoutId = -1;

                        value.currentFieldValue += ostr;
                        this.cursorPosition = value.currentFieldValue.length;
                    }

                    this.update("fields")
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

                this.update("fields")
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
        let lbs = field.type as (DataEntryValueChoice | null)[];

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
            let choice = lbs[i + page * 11];
            if (choice === null) continue; // Empty choice (for spacing)

            let onClick: () => void = () => { };

            onClick = () => {
                let value = this.values[this.fieldId];
                value.currentFieldValue = choice.name;

                this.update("fields")
            }

            keys.push(<this.key key={i + page * 11} x={i % 3} y={Math.floor(i / 3)} text={choice.label} action={onClick} />)
        }

        if (pages > 1) {
            const nextPage = (page + 1) % pages;
            // More button
            keys.push(<this.key key={"pageChangerTo" + nextPage} x={2} y={3} text="SY:NA_More" action={() => {
                setTimeout(() => {
                    setPage(nextPage);
                }, 50);
            }} />)
        }

        this.useKeyboardCursor = false;

        return <div className="keyboard-box dedicated">
            {keys}
        </div>
    }

    key = ({ text, x, y, enabled, repeat, action, className }: { text: string | ReactElement, x: number, y: number, enabled?: boolean, repeat?: boolean, action?: () => void, className?: string }) => {
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