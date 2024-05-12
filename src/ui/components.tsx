import React, { CSSProperties, forwardRef, useEffect } from 'react';
import { E_COLORS } from './constants';
import { Audio } from './global';

export interface EButtonProps {
    text: string | null;
    symbol: string | null;

    enabled: boolean;
    type: "UP" | "DOWN" | "DOWNREPEAT" | "DELAY";

    onClick?: () => void;
}

export const EButton = ({ text, symbol, enabled, type, className, onClick }: EButtonProps & { className?: string }) => {
    // Symbol not implemented yet
    let classNameV = "e-button" + (className ? " " + className : "");
    if (!enabled) classNameV += " disabled";

    // button ref
    let buttonRef = React.createRef<HTMLDivElement>();
    let [pressed, setPressed] = React.useState(false);
    useEffect(() => {
        if (!buttonRef.current) return;
        if (!enabled) return;

        let e = buttonRef.current;

        let onMouseDown: any;
        let onMouseUp: any;
        let onMouseLeave: any;
        if (type === "UP") {
            onMouseDown = () => {
                setPressed(true);
            };
            onMouseUp = () => {
                setPressed(false);
                Audio.buttonPressSound();
                onClick && onClick();
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
                Audio.buttonPressSound();
                if (type === "DOWNREPEAT")
                    timeout = setTimeout(() => {
                        let interval = setInterval(() => {
                            if (virtualPressed) {
                                setPressed(true);
                                setTimeout(() => {
                                    setPressed(false);
                                }, 100);

                                Audio.buttonPressSound();
                                onClick && onClick();
                            } else {
                                clearInterval(interval);
                            }
                        }, 300);
                    }, 1500);
            };
            onMouseUp = () => {
                virtualPressed = false;
            };
            onMouseLeave = () => {
                virtualPressed = false;
            };
        } else if (type === "DELAY") {
            /*
            The delay-type button is similar to the up-type button but with a delay (see Figure 5). On
selection by the driver, the delay-type button shall change to the “pressed” state and the
‘click’ sound shall be played. The button shall then toggle every 0.25 seconds between
the “pressed” and “enabled” states as long as the button remains pressed by the driver.
After 2 seconds, if the button is still pressed by the driver, the button shall change again
to the “pressed” state and the procedure according to the up-type button shall be followed.
If the button is pressed by the driver for less than the 2 seconds, the button shall return to
the ”enabled” state, the procedure with the 2 seconds timer shall be reset and no valid
button activation shall be considered by the onboard
*/
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
                    Audio.buttonPressSound();
                    onClick && onClick();
                }
                repeatIndex = 0;
            };
            onMouseLeave = () => {
                virtualPressed = false;
                repeatIndex = 0;
                setPressed(false);
            };
        }

        const globalMouseDown = () => {
            onMouseDown && onMouseDown();
            onMouseLeave && e.addEventListener('mouseleave', onMouseLeave);
            e.addEventListener('mouseup', globalMouseUp);
        }
        const globalMouseUp = () => {
            onMouseUp && onMouseUp();
            onMouseLeave && e.removeEventListener('mouseleave', onMouseLeave);
            e.removeEventListener('mouseleave', globalMouseUp);
        }
        const globalTouchStart = () => {
            onMouseDown && onMouseDown();
            onMouseLeave && e.addEventListener('touchmove', globalTouchMove);
            e.addEventListener('touchend', globalTouchEnd);
            e.removeEventListener('mousedown', globalMouseDown)
        }
        const globalTouchEnd = () => {
            onMouseUp && onMouseUp();
            onMouseLeave && e.removeEventListener('touchmove', globalTouchMove);
            onMouseUp && e.removeEventListener('touchend', onMouseUp);
        }
        const globalTouchMove = (event: TouchEvent) => {
            event.preventDefault();
            var touch = event.touches[0];
            let elementFromPoint = document.elementFromPoint(touch.pageX, touch.pageY)!;
            if (!e.outerHTML.includes(elementFromPoint.outerHTML)) { // Not a safe method, but it works
                onMouseLeave && onMouseLeave();
                e.removeEventListener('touchend', globalTouchEnd);
            }
            e.removeEventListener('mouseleave', globalMouseUp);
        }

        e.addEventListener('mousedown', globalMouseDown);
        e.addEventListener('touchstart', globalTouchStart);

        return () => {
            e.removeEventListener('mousedown', globalMouseDown);
            e.removeEventListener('touchstart', globalTouchStart);
            onMouseLeave && e.removeEventListener('mouseleave', onMouseLeave);
            e.removeEventListener('mouseup', globalMouseUp);
            e.removeEventListener('touchend', globalTouchEnd);
            e.removeEventListener('touchmove', globalTouchMove);
        }
    }, [enabled, onClick]);

    // For text buttons, we support grey text when disabled. For symbol buttons, it will display disabled version if available.

    return <ShadowBorder leftTop={pressed ? "transparent" : E_COLORS.black} rightBottom={pressed ? "transparent" : E_COLORS.shadow} className={classNameV} ref={buttonRef}>
        <ShadowBorder leftTop={pressed ? "transparent" : E_COLORS.shadow} rightBottom={pressed ? "transparent" : E_COLORS.black}>
            {text}
        </ShadowBorder>
    </ShadowBorder>
}

export const LayerBorder = forwardRef(({ children, className }: { children?: React.ReactNode, className?: string }, ref: React.Ref<HTMLDivElement>) => {
    return <ShadowBorder leftTop={E_COLORS.black} rightBottom={E_COLORS.shadow} className={className} ref={ref} style={{flexGrow: 1}}>
        {children}
    </ShadowBorder>
})

export const ShadowBorder = forwardRef(({ children, leftTop, rightBottom, className, style }: { children: React.ReactNode, leftTop: string, rightBottom: string, className?: string, style?: CSSProperties }, ref: React.Ref<HTMLDivElement>) => {
    let classNameV = "border border-bottom-right" + (className ? " " + className : "");

    let styleV = style ? style : {};
    styleV = { ...styleV, borderRightColor: rightBottom, borderBottomColor: rightBottom };

    return <div className={classNameV} style={styleV} ref={ref}>
        <div className="border border-top-left" style={{ borderLeftColor: leftTop, borderTopColor: leftTop }}>
            {children}
        </div>
    </div>
})