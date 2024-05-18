import React, { CSSProperties, ReactNode, Ref, RefObject, act, createRef, forwardRef, useEffect, useRef, useState } from 'react';
import { E_COLORS } from './constants';
import { Audio, Symbols } from './global';

interface PressDetectorEvents {
    onPressed: null | (() => void);
    onReleased: null | (() => void);
    onCanceled: null | (() => void);
}

function useNewPressDetector(target: RefObject<HTMLElement>): PressDetectorEvents {
    let eventRef = useRef<PressDetectorEvents>({ onPressed: null, onReleased: null, onCanceled: null });
    const events = eventRef.current;

    useEffect(() => {
        if (!target.current) return;
        let element = target.current;

        const globalMouseDown = () => {
            element.addEventListener('mouseleave', globalMouseLeave);
            element.addEventListener('mouseup', globalMouseUp);

            events.onPressed && events.onPressed();
        }
        const globalMouseLeave = () => {
            element.removeEventListener('mouseup', globalMouseUp);
            element.removeEventListener('mouseleave', globalMouseLeave);

            events.onCanceled && events.onCanceled();
        }
        const globalMouseUp = () => {
            element.removeEventListener('mouseup', globalMouseUp);
            element.removeEventListener('mouseleave', globalMouseLeave);
            
            events.onReleased && events.onReleased();
        }

        const globalTouchStart = () => {
            element.addEventListener('touchmove', globalTouchMove);
            element.addEventListener('touchend', globalTouchEnd);
            element.removeEventListener('mousedown', globalMouseDown); // Prevent mouse event when touch event is active (to prevent double click)

            events.onPressed && events.onPressed();
        }

        const globalTouchEnd = () => {
            element.removeEventListener('touchmove', globalTouchMove);
            element.removeEventListener('touchend', globalTouchEnd);

            events.onReleased && events.onReleased();
        }
        const globalTouchMove = (event: TouchEvent) => {
            event.preventDefault();
            var touch = event.touches[0];
            let elementFromPoint = document.elementFromPoint(touch.pageX, touch.pageY)!;

            if (!element.outerHTML.includes(elementFromPoint.outerHTML)) { // Not a safe method, but it works
                element.removeEventListener('touchend', globalTouchEnd);
                element.removeEventListener('touchmove', globalTouchMove);

                events.onCanceled && events.onCanceled();
            }

        }

        element.addEventListener('mousedown', globalMouseDown);
        element.addEventListener('touchstart', globalTouchStart);

        return () => {
            element.removeEventListener('mousedown', globalMouseDown);
            element.removeEventListener('touchstart', globalTouchStart);
            element.removeEventListener('mouseleave', globalMouseLeave);
            element.removeEventListener('mouseup', globalMouseUp);
            element.removeEventListener('touchend', globalTouchEnd);
            element.removeEventListener('touchmove', globalTouchMove);
        }
    }, []);

    return events;
}

export function useEButtonBehaviour(action: null | ((repeat: number) => void), type: EButtonType, enabled: boolean, ref: RefObject<HTMLElement>): boolean {
    let [pressed, setPressed] = useState(false);
    let events = useNewPressDetector(ref);

    let reallyPressed = useRef(false);
    let currentAction = useRef<null | ((repeat: number) => void)>(null);
    currentAction.current = action;

    useEffect(() => {
        if(!enabled) {
            events.onPressed = null;
            events.onReleased = null;
            events.onCanceled = null;
            setPressed(false);
            return;
        }
        if (type === "UP") {
            events.onPressed = () => {
                setPressed(true);
            };
            events.onReleased = () => {
                setPressed(false);
                currentAction.current && currentAction.current(0);
            };
            events.onCanceled = () => {
                setPressed(false);
            };
        } else if (type === "DOWN" || type === "DOWNREPEAT") {
            let timeout: any;
            events.onPressed = () => {
                reallyPressed.current = true;
                setPressed(true);
                setTimeout(() => {
                    setPressed(false);
                }, 100);
                currentAction.current && currentAction.current(0);

                if (type === "DOWNREPEAT")
                    timeout = setTimeout(() => {
                        let repeats = 1;
                        let interval = setInterval(() => {
                            if (reallyPressed.current) {
                                setPressed(true);
                                setTimeout(() => {
                                    setPressed(false);
                                }, 100);

                                currentAction.current && currentAction.current(repeats++);
                            } else {
                                clearInterval(interval);
                            }
                        }, 300);
                    }, 1500);
            };
            events.onReleased = () => {
                reallyPressed.current = false;
                clearTimeout(timeout);
            };
            events.onCanceled = () => {
                reallyPressed.current = false;
                clearTimeout(timeout);
            };
        } else if (type === "DELAY") {
            let reallyPressed = { current: false }
            let repeatCount = 0;
            console.log("ddd")
            events.onPressed = () => {
                console.log("A", reallyPressed.current)
                reallyPressed.current = true;
                setPressed(true);

                let interval = setInterval(() => {
                    if (reallyPressed.current) {
                        repeatCount++;
                        setPressed(repeatCount % 2 === 0);

                        if (repeatCount === 8) {
                            setPressed(true);

                            clearInterval(interval);
                        }
                    } else {
                        clearInterval(interval);
                    }
                }, 250);
            };
            events.onReleased = () => {
                console.log("B", reallyPressed.current)
                reallyPressed.current = false;
                setPressed(false);

                if (repeatCount >= 8) {
                    currentAction.current && currentAction.current(0);
                }
                repeatCount = 0;
            };
            events.onCanceled = () => {
                console.log("C", reallyPressed.current)
                reallyPressed.current = false;
                repeatCount = 0;
                setPressed(false);
            };
        }
    }, [enabled, type])

    return pressed;
}

export type EButtonType = "UP" | "DOWN" | "DOWNREPEAT" | "DELAY";

export interface EButtonProps {
    text?: ReactNode;
    trySymbol?: boolean;

    enabled: boolean;
    type: EButtonType;

    onClick?: (repeat: number) => void;
}

export const EButton = ({ text, trySymbol, enabled, type, className, onClick, style }: EButtonProps & { className?: string, style?: CSSProperties }) => {
    // Symbol not implemented yet
    let classNameV = "e-button" + (className ? " " + className : "");
    if (!enabled) classNameV += " disabled";

    let styleV = style ? style : {};
    if (enabled) {
        if (type === "DELAY") {
            styleV.cursor = "progress";
        } else if (type === "DOWNREPEAT") {
            styleV.cursor = "grab";
        } else if (type === "DOWN") {
            styleV.cursor = "pointer";
        } else {
            styleV.cursor = "pointer";
        }
    }

    // button ref
    let buttonRef = createRef<HTMLDivElement>();
    let pressed = useEButtonBehaviour((n) => {
        Audio.buttonPressSound();
        onClick && onClick(n);
    }, type, enabled, buttonRef);

    // For text buttons, we support grey text when disabled. For symbol buttons, it will display disabled version if available.

    let content: ReactNode;
    let innerStyle: any = {};
    if (trySymbol && text as any in Symbols) {
        let symbolData = Symbols[text as any];
        content = <img src={enabled ? symbolData.imagePath : (symbolData.disabledImagePath ?? symbolData.imagePath)} alt={symbolData.name} style={{
            width: symbolData.cells[0] * window.cell,
            height: symbolData.cells[1] * window.cell,
        }} />;

        innerStyle = {
            width: "100%", height: "100%", position: "relative",
            display: "flex", justifyContent: "center", alignItems: "center"
        } satisfies CSSProperties;
    } else {
        content = <div style={{ display: "inline-block" }}>{text ?? null}</div>;

        innerStyle = {
            width: "100%", height: "100%", position: "relative",
            display: "flex", justifyContent: "center", alignItems: "center"
        } satisfies CSSProperties;
    }

    return <ShadowBorder leftTop={pressed ? "transparent" : E_COLORS.black} rightBottom={pressed ? "transparent" : E_COLORS.shadow} className={classNameV} ref={buttonRef} style={styleV}>
        <ShadowBorder leftTop={pressed ? "transparent" : E_COLORS.shadow} rightBottom={pressed ? "transparent" : E_COLORS.black} innerStyle={innerStyle}>
            {content}
        </ShadowBorder>
    </ShadowBorder>
}

export interface FButtonProps {
    children: ReactNode;

    enabled: boolean;
    type: EButtonType;

    onClick?: (repeat: number) => void;
}

export const FButton = ({ children, enabled, type, onClick, className, style, setPressed }:
    FButtonProps & { className?: string, style?: CSSProperties, setPressed?: (b: boolean) => void }) => {

    let styleV = style ? { ...style } : {};
    if (enabled) {
        if (type === "DELAY") {
            styleV.cursor = "progress";
        } else if (type === "DOWNREPEAT") {
            styleV.cursor = "grab";
        } else if (type === "DOWN") {
            styleV.cursor = "pointer";
        } else {
            styleV.cursor = "pointer";
        }
    }

    // button ref
    let buttonRef = useRef<HTMLDivElement>(null);
    let pressed = useEButtonBehaviour((n) => {
        Audio.buttonPressSound();
        onClick && onClick(n);
    }, type, enabled, buttonRef);

    useEffect(() => {
        setPressed && setPressed(pressed);
    }, [pressed]);

    if (pressed) styleV.cursor = "grabbing";

    return <div className={className} style={styleV} ref={buttonRef}>
        {children}
    </div>
}

export const ESymbol = ({ symbol, className }: { symbol: string, className?: string } & { className?: string }) => {
    // Symbol not implemented yet
    let classNameV = "e-symbol" + (className ? " " + className : "");

    if (symbol in Symbols == false) return null;

    let symbolData = Symbols[symbol];

    return <div className={classNameV} style={{
        width: "100%", height: "100%", position: "relative",
        display: "flex", justifyContent: "center", alignItems: "center"
    }}>
        <img src={symbolData.imagePath} alt={symbolData.name} style={{
            width: symbolData.cells[0] * window.cell,
            height: symbolData.cells[1] * window.cell,
            display: "inline-block"
        }} />
    </div>
}

export const LayerBorder = forwardRef(({ children, className }: { children?: React.ReactNode, className?: string }, ref: React.Ref<HTMLDivElement>) => {
    return <ShadowBorder leftTop={E_COLORS.black} rightBottom={E_COLORS.shadow} className={className} ref={ref} style={{ flexGrow: 1 }}>
        {children}
    </ShadowBorder>
})

export const ShadowBorder = forwardRef(({ children, leftTop, rightBottom, className, style, innerStyle }: { children: React.ReactNode, leftTop: string, rightBottom: string, className?: string, style?: CSSProperties, innerStyle?: CSSProperties }, ref: React.Ref<HTMLDivElement>) => {
    let classNameV = "border border-bottom-right" + (className ? " " + className : "");

    let styleV = style ? style : {};
    styleV = { ...styleV, borderRightColor: rightBottom, borderBottomColor: rightBottom };

    let innerStyleV = innerStyle ? innerStyle : {};
    innerStyleV = { ...innerStyleV, borderLeftColor: leftTop, borderTopColor: leftTop };

    return <div className={classNameV} style={styleV} ref={ref}>
        <div className="border border-top-left" style={innerStyleV}>
            {children}
        </div>
    </div>
})