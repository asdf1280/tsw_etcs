import React from "react";
import { CloseSubwindow, Subwindow } from "./dmi"
import "./subwindow.scss";
import { EButton } from "./components";

export interface MenuWindowOptions {
    title: string;
    items: MenuItem[];
}

interface MenuItem {
    text: string | null;
    action?: (() => void) | null | undefined;
    enabled?: boolean;
    buttontype?: "UP" | "DOWN" | "DOWNREPEAT" | "DELAY";
}

export class MenuWindow implements Subwindow {
    options: MenuWindowOptions;
    constructor(options: MenuWindowOptions) {
        this.options = options;
    }
    uid: number = 0;
    render() {
        let btns = [];
        for(let i = 0; i < this.options.items.length; i++) {
            let item = this.options.items[i];
            let enabled = item.enabled === undefined ? true : item.enabled;
            
            let x = i % 2;
            let y = Math.floor(i / 2) + 1;

            if(item.text === null) continue; /// Separator

            let text: string | null = item.text;
            let symbol = null;
            if(text?.startsWith("SY:")) {
                symbol = text.substring(3);
                text = null;
            }

            btns.push(<EButton key={i} text={text} symbol={symbol} enabled={enabled} type={item.buttontype || "UP"} onClick={item.action ?? undefined} style={{
                top: 50 * window.cell * y,
                left: 153 * window.cell * x,
            }} />);
        }
        return <div className="subwindow subwindow-menu">
            <div className="title">{this.options.title}</div>
            {btns}
            <EButton text={null} symbol="NA_CloseWindow" enabled={true} type="UP" className="close" onClick={() => {
                CloseSubwindow(this.uid);
            }} />
        </div>
    }
}