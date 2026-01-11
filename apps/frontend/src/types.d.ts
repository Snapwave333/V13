export {};

declare global {
  interface Window {
    electron: {
      close: () => void;
      minimize: () => void;
      maximize: () => void;
    };
  }
}
