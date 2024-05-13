export class AreaBCanvas {
    private static currentCanvas: HTMLCanvasElement | null = null;
    private static currentContext: CanvasRenderingContext2D | null = null;

    public static get CurrentCanvas() {
        return AreaBCanvas.currentCanvas;
    }

    public static set CurrentCanvas(value: HTMLCanvasElement | null) {
        AreaBCanvas.currentCanvas = value;
        if (value) {
            AreaBCanvas.currentContext = value.getContext("2d");
        }
    }
}