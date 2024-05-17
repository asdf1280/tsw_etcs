import React, { CSSProperties, ReactNode, forwardRef, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { EButton, ESymbol, LayerBorder } from "./components";
import { Audio } from "./global";
import { BUILD_NUMBER } from "..";
import { DMIFunctions } from "./dmiFunc"

import "./subwindow.scss"

const root = createRoot(document.getElementById('dmi')!);

const MainElement = () => {
    let [initialized, setInitialized] = React.useState(false);

    if (!initialized) {
        return <InitScreen setInitialized={setInitialized} />;
    }

    return <DMIWindow />;
}

const InitScreen = ({ setInitialized }: any) => {
    let ref = React.createRef<HTMLDivElement>();
    useEffect(() => {
        if (!ref.current) return;
        ref.current.addEventListener('click', async () => {
            await Audio.init();
            await Audio.start();

            setTimeout(() => {
                Audio.welcomeSound();
            }, 10);

            DMIFunctions.init();

            setInitialized(true);
        });
    });

    return <div style={{ display: "flex", flexDirection: "column", gap: "1em", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }} ref={ref}>
        <h1>ETCS Simulator {BUILD_NUMBER}</h1>
        <h2>Click anywhere to start</h2>
    </div>
}
root.render(<MainElement />);

// A simple interface to dynamically add and remove subwindows
const DMISubwindowRenderer = () => {
    let [update, setUpdate] = React.useState(false);
    UpdateSubwindows = () => setUpdate(!update);

    let children: React.ReactNode[] = [];
    for (let i = 0; i < subwindowStack.length; i++) {
        let sw = subwindowStack[i];

        let content: ReactNode;
        if(typeof sw.render === "function") {
            let MMM = sw.render.bind(sw);
            content = <MMM />;
        } else {
            content = sw.render;
        }
        children.push(<div id={`SW_${sw.uid}`} key={sw.uid} style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", zIndex: (i + 1) * 100 }} onClick={(e) => {
            // To prevent clicks from propagating to the parent
            e.stopPropagation();
        }}>
            {content}
        </div>);
    }
    return <>
        {children}
    </>
}

/**
 * Note: Even this class has render function, it's not a React component.
 * The render function is React's function component itself.
 * 
 * This is to allow code outside of React and tsx file to easily activate the window.
 */
export interface Subwindow {
    uid: number;
    render: ReactNode | (() => ReactNode);
}

let windowUidCounter = 0;
let subwindowStack: Subwindow[] = [];

export var UpdateSubwindows = () => {

}

export const OpenSubwindow = (data: Subwindow): number => {
    let uid = windowUidCounter++;
    data.uid = uid;
    subwindowStack.push(data);
    UpdateSubwindows();
    return uid;
}

export const CloseSubwindow = (uid: number) => {
    subwindowStack = subwindowStack.filter((sw) => sw.uid !== uid);
    UpdateSubwindows();
}

const DMIArrangement = forwardRef(({ id, x, y, w, h, children, style }: { id: string, x: number, y: number, w: number, h: number, children?: React.ReactNode, style?: CSSProperties }, ref: React.Ref<HTMLDivElement>) => {
    let styleV: CSSProperties = {
        position: "absolute",
        left: x * window.cell,
        top: y * window.cell,
        width: w * window.cell,
        height: h * window.cell,
        display: "flex",
        alignItems: "stretch",
        justifyContent: "stretch",
    };
    styleV = { ...styleV, ...style };
    return <div id={"ARR_" + id} ref={ref} style={styleV}>
        {children}
    </div>
})

export const DMIWindow = () => {
    let [render, setRender] = React.useState(false);
    useEffect(() => {
        let resizeListener = () => {
            setRender(!render);
        }
        window.addEventListener('resize', resizeListener);
        return () => window.removeEventListener('resize', resizeListener);
    })
    return <>
        <DMIArrangement id="A" x={0} y={15} w={54} h={300}>
            <DMIArrangement id="A1" x={0} y={0} w={54} h={54}> <LayerBorder /> </DMIArrangement>
            <DMIArrangement id="A2" x={0} y={54} w={54} h={30}> </DMIArrangement>
            <DMIArrangement id="A3" x={0} y={84} w={54} h={191}> </DMIArrangement>
            <DMIArrangement id="A4" x={0} y={275} w={54} h={25}> <LayerBorder /> </DMIArrangement>
            <DMIArrangement id="A2A3L" x={0} y={54} w={54} h={221}> <LayerBorder /> </DMIArrangement>
        </DMIArrangement>
        <DMIArrangement id="B" x={54} y={15} w={280} h={300}>
            <LayerBorder />
            <DMIArrangement id="B0" x={15} y={25} w={250} h={250} style={{ borderRadius: "100vw" }}> </DMIArrangement>
            <DMIArrangement id="B1" x={115} y={125} w={50} h={50}> </DMIArrangement>
            <DMIArrangement id="B2" x={3} y={13} w={274} h={274} style={{ borderRadius: "100vw" }}> </DMIArrangement>
            <DMIArrangement id="B3" x={86} y={256} w={36} h={36}> <LayerBorder /> </DMIArrangement>
            <DMIArrangement id="B4" x={122} y={256} w={36} h={36}> <LayerBorder /> </DMIArrangement>
            <DMIArrangement id="B5" x={158} y={256} w={36} h={36}> <LayerBorder /> </DMIArrangement>
            <DMIArrangement id="B6" x={8} y={256} w={36} h={36}> <LayerBorder /> </DMIArrangement>
            <DMIArrangement id="B7" x={236} y={256} w={36} h={36}> <LayerBorder> <ESymbol symbol="MO_StandBy" /></LayerBorder> </DMIArrangement>
            <DMIArrangement id="B8" x={122} y={198} w={36} h={36}> <LayerBorder /> </DMIArrangement>
        </DMIArrangement>
        <DMIArrangement id="C" x={0} y={315} w={334} h={50}>
            <DMIArrangement id="C1" x={165} y={0} w={58} h={50}> <LayerBorder /> </DMIArrangement>
            <DMIArrangement id="C2" x={54} y={0} w={37} h={50}> </DMIArrangement>
            <DMIArrangement id="C3" x={91} y={0} w={37} h={50}> </DMIArrangement>
            <DMIArrangement id="C4" x={128} y={0} w={37} h={50}> </DMIArrangement>
            <DMIArrangement id="C5" x={223} y={0} w={37} h={50}> <LayerBorder /> </DMIArrangement>
            <DMIArrangement id="C6" x={260} y={0} w={37} h={50}> <LayerBorder /> </DMIArrangement>
            <DMIArrangement id="C7" x={297} y={0} w={37} h={50}> <LayerBorder /> </DMIArrangement>
            <DMIArrangement id="C8" x={0} y={0} w={54} h={25}> <LayerBorder> <ESymbol symbol="LE_1" /></LayerBorder> </DMIArrangement>
            <DMIArrangement id="C9" x={0} y={25} w={54} h={25}> <LayerBorder /> </DMIArrangement>
            <DMIArrangement id="C2C3C4L" x={54} y={0} w={111} h={50}> <LayerBorder /> </DMIArrangement>
        </DMIArrangement>
        <DMIArrangement id="D" x={334} y={15} w={246} h={300}>
            <LayerBorder />
            <DMIArrangement id="D1" x={0} y={15} w={40} h={270}> </DMIArrangement>
            <DMIArrangement id="D2" x={40} y={15} w={25} h={270}> </DMIArrangement>
            <DMIArrangement id="D3" x={65} y={15} w={25} h={270}> </DMIArrangement>
            <DMIArrangement id="D4" x={90} y={15} w={25} h={270}> </DMIArrangement>
            <DMIArrangement id="D5" x={115} y={15} w={18} h={270}> </DMIArrangement>
            <DMIArrangement id="D6" x={133} y={15} w={14} h={270}> </DMIArrangement>
            <DMIArrangement id="D7" x={147} y={15} w={93} h={270}> </DMIArrangement>
            <DMIArrangement id="D8" x={240} y={15} w={6} h={270}> </DMIArrangement>
            <DMIArrangement id="D9" x={0} y={285} w={40} h={15}> </DMIArrangement>
            <DMIArrangement id="D10" x={40} y={285} w={166} h={15}> </DMIArrangement>
            <DMIArrangement id="D11" x={206} y={285} w={40} h={15}> </DMIArrangement>
            <DMIArrangement id="D12" x={0} y={0} w={40} h={270}> </DMIArrangement>
            <DMIArrangement id="D13" x={40} y={0} w={166} h={270}> </DMIArrangement>
            <DMIArrangement id="D14" x={206} y={0} w={40} h={270}> </DMIArrangement>
        </DMIArrangement>
        <DMIArrangement id="E" x={0} y={365} w={334} h={100}>
            <DMIArrangement id="E1" x={0} y={0} w={54} h={25}> <LayerBorder /> </DMIArrangement>
            <DMIArrangement id="E2" x={0} y={25} w={54} h={25}> <LayerBorder /> </DMIArrangement>
            <DMIArrangement id="E3" x={0} y={50} w={54} h={25}> <LayerBorder /> </DMIArrangement>
            <DMIArrangement id="E4" x={0} y={75} w={54} h={25}> <LayerBorder /> </DMIArrangement>
            <DMIArrangement id="E5" x={54} y={0} w={234} h={20}> </DMIArrangement>
            <DMIArrangement id="E6" x={54} y={20} w={234} h={20}> </DMIArrangement>
            <DMIArrangement id="E7" x={54} y={40} w={234} h={20}> </DMIArrangement>
            <DMIArrangement id="E8" x={54} y={60} w={234} h={20}> </DMIArrangement>
            <DMIArrangement id="E9" x={54} y={80} w={234} h={20}> </DMIArrangement>
            <DMIArrangement id="E10" x={288} y={0} w={46} h={50} ><EButton text="NA_ScrollUp" trySymbol type="DOWNREPEAT" enabled={false} className="full" /> </DMIArrangement>
            <DMIArrangement id="E11" x={288} y={50} w={46} h={50}> <EButton text="NA_ScrollDown" trySymbol type="DOWNREPEAT" enabled={false} className="full" /> </DMIArrangement>
            <DMIArrangement id="E5E9" x={54} y={0} w={234} h={100}> <LayerBorder /> </DMIArrangement>
        </DMIArrangement>
        <DMIArrangement id="F" x={580} y={15} w={60} h={450}>
            <DMIArrangement id="F1" x={0} y={0} w={60} h={50}> <EButton text="Main" type="UP" enabled={true} className="full" onClick={DMIFunctions.onMenuClicked} /> </DMIArrangement>
            <DMIArrangement id="F2" x={0} y={50} w={60} h={50}> <EButton text={<>Over-<br />ride</>} type="UP" enabled={true} className="full" onClick={DMIFunctions.onOverrideClicked} /> </DMIArrangement>
            <DMIArrangement id="F3" x={0} y={100} w={60} h={50}> <EButton text={<>Data<br />view</>} type="UP" enabled={true} className="full" /> </DMIArrangement>
            <DMIArrangement id="F4" x={0} y={150} w={60} h={50}> <EButton text={<>Spec</>} type="UP" enabled={true} className="full" onClick={DMIFunctions.onSpecClicked} /> </DMIArrangement>
            <DMIArrangement id="F5" x={0} y={200} w={60} h={50}> <EButton text="SE_Entry" trySymbol type="UP" enabled={true} className="full" onClick={DMIFunctions.onSettingsClicked} /> </DMIArrangement>
            <DMIArrangement id="F6" x={0} y={250} w={60} h={50}> </DMIArrangement>
            <DMIArrangement id="F7" x={0} y={300} w={60} h={50}> </DMIArrangement>
            <DMIArrangement id="F8" x={0} y={350} w={60} h={50}> </DMIArrangement>
            <DMIArrangement id="F9" x={0} y={400} w={60} h={50}> <EButton text={<>Sim</>} type="UP" enabled={true} className="full" onClick={DMIFunctions.onSimClicked} /> </DMIArrangement>
        </DMIArrangement>
        <DMIArrangement id="G" x={334} y={315} w={246} h={150}>
            <DMIArrangement id="G1" x={0} y={0} w={49} h={50}> <LayerBorder /> </DMIArrangement>
            <DMIArrangement id="G2" x={49} y={0} w={49} h={50}> <LayerBorder /> </DMIArrangement>
            <DMIArrangement id="G3" x={98} y={0} w={49} h={50}> <LayerBorder /> </DMIArrangement>
            <DMIArrangement id="G4" x={147} y={0} w={49} h={50}> <LayerBorder /> </DMIArrangement>
            <DMIArrangement id="G5" x={196} y={0} w={50} h={50}> <LayerBorder /> </DMIArrangement>
            <DMIArrangement id="G6" x={0} y={50} w={49} h={50}> </DMIArrangement>
            <DMIArrangement id="G7" x={49} y={50} w={49} h={50}> </DMIArrangement>
            <DMIArrangement id="G8" x={98} y={50} w={49} h={50}> </DMIArrangement>
            <DMIArrangement id="G9" x={147} y={50} w={49} h={50}> </DMIArrangement>
            <DMIArrangement id="G10" x={196} y={50} w={50} h={50}> </DMIArrangement>
            <DMIArrangement id="G11" x={0} y={100} w={63} h={50}> <LayerBorder /> </DMIArrangement>
            <DMIArrangement id="G12" x={63} y={100} w={120} h={50}> <LayerBorder /> </DMIArrangement>
            <DMIArrangement id="G13" x={183} y={100} w={63} h={50}> <LayerBorder><LocalTime /></LayerBorder> </DMIArrangement>
        </DMIArrangement>
        <DMIArrangement id="Z" x={0} y={0} w={640} h={15}></DMIArrangement>
        <DMIArrangement id="Y" x={0} y={465} w={640} h={15}></DMIArrangement>
        <DMISubwindowRenderer />
    </>
}

const LocalTime = () => {
    let [time, setTime] = React.useState(new Date());
    useEffect(() => {
        let interval: any = null;
        setTimeout(() => {
            interval = setInterval(() => {
                setTime(new Date());
            }, 1000);
        }, Date.now() % 1000);
        return () => interval ?? clearInterval(interval);
    }, []);

    // hh:mm:ss
    let str = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}`;
    return <div className="localTime"><div>{str}</div></div>
}

const AreaB = () => {
    return <canvas ref={(a) => {
        
    }}></canvas>
}