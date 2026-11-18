// Shared types and specifications for Rajmoti Studio Realistic Product Visualization Engine

export type ProductFamily =
  | "frame"
  | "acrylic"
  | "canvas"
  | "mug"
  | "translight"
  | "magazine"
  | "album"
  | "clock"
  | "cushion"
  | "plaque"
  | "puzzle"
  | "keychain"
  | "phone_cover";

export type FrameFinishType =
  | "teak"
  | "charcoal"
  | "gold"
  | "acrylic"
  | "canvas"
  | "sparkle";

export type PaperFinishType = "matte" | "glossy" | "lustre";

export type RoomEnvironment = "closeup" | "living_room" | "bedroom" | "mandir_sanctum";

export interface PhysicalSizeSpec {
  id: string;
  label: string; // e.g. "12×18 in"
  metric: string; // e.g. "30×45 cm"
  widthInches: number;
  heightInches: number;
  aspectRatio: string; // e.g. "2 / 3"
  aspectRatioValue: number; // e.g. 0.6667
  popular?: boolean;
}

export interface PhotoSlotTransform {
  id: number;
  photoUrl: string;
  zoom: number; // 0.5 to 3.0
  panX: number; // offset in px
  panY: number;
  rotation: number; // 0, 90, 180, 270
  fitMode: "cover" | "contain";
  imgWidth?: number;
  imgHeight?: number;
}

export interface SavedProductDesign {
  id: string;
  productId: string;
  productFamily: ProductFamily;
  size: PhysicalSizeSpec;
  finish: FrameFinishType;
  paperFinish?: PaperFinishType;
  primaryPhotoUrl: string;
  slots?: PhotoSlotTransform[];
  isLedOn?: boolean;
  ledColorTemp?: "warm" | "pure";
  mugType?: "magic" | "white" | "black";
  coverType?: "hardcover" | "softcover";
  customText?: string;
  subText?: string;
  dateCreated: string;
  highResExportReady: boolean;
}

// Standard Rajmoti Sizes for Frames and Prints
export const RAJMOTI_FRAME_SIZES: PhysicalSizeSpec[] = [
  { id: "8x12", label: "8×12 in", metric: "20×30 cm", widthInches: 8, heightInches: 12, aspectRatio: "2 / 3", aspectRatioValue: 8 / 12 },
  { id: "10x10", label: "10×10 in", metric: "25×25 cm", widthInches: 10, heightInches: 10, aspectRatio: "1 / 1", aspectRatioValue: 1, popular: true },
  { id: "10x14", label: "10×14 in", metric: "25×35 cm", widthInches: 10, heightInches: 14, aspectRatio: "5 / 7", aspectRatioValue: 10 / 14 },
  { id: "12x18", label: "12×18 in", metric: "30×45 cm", widthInches: 12, heightInches: 18, aspectRatio: "2 / 3", aspectRatioValue: 12 / 18, popular: true },
  { id: "14x20", label: "14×20 in", metric: "35×50 cm", widthInches: 14, heightInches: 20, aspectRatio: "7 / 10", aspectRatioValue: 14 / 20 },
  { id: "16x24", label: "16×24 in", metric: "40×60 cm", widthInches: 16, heightInches: 24, aspectRatio: "2 / 3", aspectRatioValue: 16 / 24, popular: true },
  { id: "18x24", label: "18×24 in", metric: "45×60 cm", widthInches: 18, heightInches: 24, aspectRatio: "3 / 4", aspectRatioValue: 18 / 24 },
  { id: "20x30", label: "20×30 in", metric: "50×75 cm", widthInches: 20, heightInches: 30, aspectRatio: "2 / 3", aspectRatioValue: 20 / 30, popular: true },
];

export const RAJMOTI_ACRYLIC_SIZES: PhysicalSizeSpec[] = [
  { id: "8x12", label: "8×12 in", metric: "20×30 cm", widthInches: 8, heightInches: 12, aspectRatio: "2 / 3", aspectRatioValue: 8 / 12 },
  { id: "12x18", label: "12×18 in", metric: "30×45 cm", widthInches: 12, heightInches: 18, aspectRatio: "2 / 3", aspectRatioValue: 12 / 18, popular: true },
  { id: "16x24", label: "16×24 in", metric: "40×60 cm", widthInches: 16, heightInches: 24, aspectRatio: "2 / 3", aspectRatioValue: 16 / 24 },
];

export const RAJMOTI_TRANSLIGHT_SIZES: PhysicalSizeSpec[] = [
  { id: "12x18", label: "12×18 in", metric: "30×45 cm", widthInches: 12, heightInches: 18, aspectRatio: "2 / 3", aspectRatioValue: 12 / 18, popular: true },
  { id: "16x24", label: "16×24 in", metric: "40×60 cm", widthInches: 16, heightInches: 24, aspectRatio: "2 / 3", aspectRatioValue: 16 / 24 },
];
