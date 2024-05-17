import React, { CSSProperties, ReactNode, Ref, RefObject, act, createRef, forwardRef, useEffect, useState } from 'react';
import { E_COLORS } from './constants';
import { Audio, Symbols } from './global';

function usePressDetector(onPressed: null | (() => void), onReleased: null | (() => void), onCanceled: null | (() => void), enabled: boolean, ref: React.RefObject<HTMLElement>) {
    useEffect(() => {
        if (!ref.current) return;
        if (!enabled) return;

        let e = ref.current;

        const globalMouseDown = () => {
            onPressed && onPressed();

            e.addEventListener('mouseleave', globalMouseLeave);
            e.addEventListener('mouseup', globalMouseUp);
        }
        const globalMouseLeave = () => {
            onCanceled && onCanceled();

            e.removeEventListener('mouseup', globalMouseUp);
            e.removeEventListener('mouseleave', globalMouseLeave);
        }
        const globalMouseUp = () => {
            onReleased && onReleased();

            e.removeEventListener('mouseup', globalMouseUp);
            e.removeEventListener('mouseleave', globalMouseLeave);
        }

        const globalTouchStart = () => {
            onPressed && onPressed();

            e.addEventListener('touchmove', globalTouchMove);
            e.addEventListener('touchend', globalTouchEnd);
            e.removeEventListener('mousedown', globalMouseDown); // Prevent mouse event when touch event is active (to prevent double click)
        }

        const globalTouchEnd = () => {
            onReleased && onReleased();

            e.removeEventListener('touchmove', globalTouchMove);
            e.removeEventListener('touchend', globalTouchEnd);
        }
        const globalTouchMove = (event: TouchEvent) => {
            event.preventDefault();
            var touch = event.touches[0];
            let elementFromPoint = document.elementFromPoint(touch.pageX, touch.pageY)!;

            if (!e.outerHTML.includes(elementFromPoint.outerHTML)) { // Not a safe method, but it works
                onCanceled && onCanceled();

                e.removeEventListener('touchend', globalTouchEnd);
                e.removeEventListener('touchmove', globalTouchMove);
            }
            
        }

        e.addEventListener('mousedown', globalMouseDown);
        e.addEventListener('touchstart', globalTouchStart);

        return () => {
            e.removeEventListener('mousedown', globalMouseDown);
            e.removeEventListener('touchstart', globalTouchStart);
            e.removeEventListener('mouseleave', globalMouseLeave);
            e.removeEventListener('mouseup', globalMouseUp);
            e.removeEventListener('touchend', globalTouchEnd);
            e.removeEventListener('touchmove', globalTouchMove);
        }
    }, [enabled]);
}

export function useEButtonBehaviour(action: null | ((repeat: number) => void), type: EButtonType, enabled: boolean, ref: RefObject<HTMLElement>): boolean {
    let [pressed, setPressed] = useState(false);

    let onMouseDown: any;
    let onMouseUp: any;
    let onMouseLeave: any;
    if (type === "UP") {
        onMouseDown = () => {
            setPressed(true);
        };
        onMouseUp = () => {
            setPressed(false);
            action && action(0);
        };
        onMouseLeave = () => {
            setPressed(false);
        };
    } else if (type === "DOWN" || type === "DOWNREPEAT") {
        let timeout: any;
        let virtualPressed = false;
        onMouseDown = () => {
            virtualPressed = true;
            setPressed(true);
            setTimeout(() => {
                setPressed(false);
            }, 100);
            action && action(0);

            if (type === "DOWNREPEAT")
                timeout = setTimeout(() => {
                    let repeats = 1;
                    let interval = setInterval(() => {
                        if (virtualPressed) {
                            setPressed(true);
                            setTimeout(() => {
                                setPressed(false);
                            }, 100);

                            action && action(repeats++);
                        } else {
                            clearInterval(interval);
                        }
                    }, 300);
                }, 1500);
        };
        onMouseUp = () => {
            virtualPressed = false;
            clearTimeout(timeout);
        };
        onMouseLeave = () => {
            virtualPressed = false;
            clearTimeout(timeout);
        };
    } else if (type === "DELAY") {
        let virtualPressed = false;
        let repeatIndex = 0;
        onMouseDown = () => {
            virtualPressed = true;
            setPressed(true);

            let interval = setInterval(() => {
                if (virtualPressed) {
                    repeatIndex++;
                    setPressed(repeatIndex % 2 === 0);

                    if (repeatIndex === 8) {
                        setPressed(true);

                        clearInterval(interval);
                    }
                } else {
                    clearInterval(interval);
                }
            }, 250);
        };
        onMouseUp = () => {
            virtualPressed = false;
            setPressed(false);

            if (repeatIndex == 8) {
                action && action(0);
            }
            repeatIndex = 0;
        };
        onMouseLeave = () => {
            virtualPressed = false;
            repeatIndex = 0;
            setPressed(false);
        };
    }

    usePressDetector(onMouseDown, onMouseUp, onMouseLeave, enabled, ref);

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

    let styleV = style ? {...style} : {};
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

    setPressed && setPressed(pressed);

    if(pressed) styleV.cursor = "grabbing";

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