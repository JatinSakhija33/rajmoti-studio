import { Heart, Check } from "lucide-react";
import { useStyles, type SavedStyle } from "@/features/catalogue/store";
export function SaveStyle({ style }: { style: SavedStyle }) {
  const [saved, setSaved] = useStyles();
  const on = saved.some((x) => x.id === style.id);
  return (
    <button
      className="save-style"
      aria-pressed={on}
      onClick={() => setSaved(on ? saved.filter((x) => x.id !== style.id) : [...saved, style])}
    >
      {on ? <Check size={15} /> : <Heart size={15} />}{" "}
      {on ? "Saved to your shortlist" : "Save this style"}
    </button>
  );
}
