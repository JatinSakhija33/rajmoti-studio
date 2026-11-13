declare module "page-flip" {
  export interface PageFlipSettings {
    width: number;
    height: number;
    size?: "fixed" | "stretch";
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    drawShadow?: boolean;
    flippingTime?: number;
    usePortrait?: boolean;
    startZIndex?: number;
    autoSize?: boolean;
    maxShadowOpacity?: number;
    showCover?: boolean;
    mobileScrollSupport?: boolean;
    useMouseEvents?: boolean;
  }

  export class PageFlip {
    constructor(element: HTMLElement, settings: PageFlipSettings);
    loadFromHTML(pages: NodeListOf<HTMLElement> | HTMLElement[]): void;
    flipNext(): void;
    flipPrev(): void;
    flip(pageNumber: number): void;
    destroy(): void;
    getPageCount(): number;
    getCurrentPageIndex(): number;
    on(event: string, callback: (e: any) => void): void;
    off(event: string, callback: (e: any) => void): void;
  }
}
