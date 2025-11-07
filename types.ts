
export type ScanMode = 'one-switch' | 'two-switch';

export type ThemeName = 'default' | 'dark' | 'yellow-black' | 'white-black' | 'black-yellow' | 'cyan-black';

export interface Theme {
  name: ThemeName;
  displayName: string;
  colors: {
    background: string;
    text: string;
    scannerBg: string;
    scannerText: string;
    displayBg: string;
    displayText: string;
    buttonBg: string;
    buttonText: string;
    buttonHover: string;
    modalBg: string;
    modalText: string;
    inputBg: string;
    inputText: string;
    border: string;
    actionBorder: string;      // Border color for SPEAK, UNDO, CLEAR, SPACE
    predictionBorder: string;  // Border color for letter and word predictions
  };
}
