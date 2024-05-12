interface Window {
    cell: number;
}

declare module "*.wav" {
    const value: string;
    export default value;
}

declare module "*.png" {
    const value: string;
    export default value;
}

declare module "*.bmp" {
    const value: string;
    export default value;
}