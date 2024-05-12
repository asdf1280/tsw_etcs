import "./index.scss";

{
    let dmi = document.getElementById('dmi')!;
    function adjustSize() {
        let w = window.innerWidth;
        let h = window.innerHeight;
        let ratio = w / h;
        if (ratio > 4 / 3) {
            dmi.style.width = h * 4 / 3 + 'px';
            dmi.style.height = h + 'px';
        } else {
            dmi.style.width = w + 'px';
            dmi.style.height = w * 3 / 4 + 'px';
        }
        document.body.style.setProperty("--cell", dmi.clientHeight / 480 + "px");
        window.cell = dmi.clientHeight / 480;
    }

    adjustSize();
    window.addEventListener('resize', adjustSize);
}

let buildElem = document.getElementById("bn")!;
export const BUILD_NUMBER = buildElem.textContent;
buildElem.remove();

import "./ui/dmi";