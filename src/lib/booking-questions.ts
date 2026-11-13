export type ServiceKey = "baby" | "maternity" | "wedding" | "family" | "birthday" | "other";

export type Question = {
  id: string;
  label: string;
  hint?: string;
  type?: "text" | "textarea" | "select";
  options?: string[];
  placeholder?: string;
};

export const SERVICES: {
  key: ServiceKey;
  title: string;
  eyebrow: string;
  description: string;
}[] = [
  { key: "baby", title: "Baby", eyebrow: "Little wonders", description: "Newborn, sitter & cake smash sessions." },
  { key: "maternity", title: "Maternity", eyebrow: "Soft beginnings", description: "Elegant portraits of this beautiful chapter." },
  { key: "family", title: "Family", eyebrow: "Together", description: "Warm, unhurried family portraits." },
  { key: "wedding", title: "Wedding", eyebrow: "Your love story", description: "Full-day storytelling & candid coverage." },
  { key: "birthday", title: "Birthday", eyebrow: "Celebrate", description: "Themed sessions and joyful cake smashes." },
  { key: "other", title: "Something else", eyebrow: "Tell us more", description: "Custom shoots, events & pre-weddings." },
];

export const BOOKING_QUESTIONS: Record<ServiceKey, Question[]> = {
  baby: [
    { id: "baby_name", label: "What is your baby's name?" },
    { id: "baby_nickname", label: "What name would you like us to call your little one during the session?", hint: "So the photographer can bond quickly." },
    { id: "baby_age", label: "How old is your baby?", placeholder: "e.g. 3 months" },
    { id: "baby_happy_time", label: "What time is your baby usually happiest and most active?" },
    { id: "baby_nap", label: "Does your baby usually take a nap before the session?", type: "select", options: ["Yes", "No", "Sometimes"] },
    { id: "baby_smile", label: "What usually makes your baby smile?", type: "textarea" },
    { id: "baby_strangers", label: "Is your little one comfortable with strangers?", type: "select", options: ["Very comfortable", "Warms up slowly", "Prefers family only"] },
    { id: "baby_toy", label: "Does your baby have a favourite toy or comfort item?" },
    { id: "baby_moment", label: "Is there any moment or expression you absolutely want us to capture?", type: "textarea" },
    { id: "baby_dislikes", label: "Is there anything that might make your baby uncomfortable?", type: "textarea" },
    { id: "baby_story", label: "Is there any special story behind this shoot?", type: "textarea" },
  ],
  maternity: [
    { id: "weeks", label: "How many weeks along are you?" },
    { id: "first_baby", label: "Is this your first baby?", type: "select", options: ["Yes", "No"] },
    { id: "feeling", label: "How are you feeling these days?", type: "textarea" },
    { id: "dream_photo", label: "Is there a dream photo you've imagined?", type: "textarea" },
    { id: "styling", label: "Would you like elegant, traditional or cinematic styling?", type: "select", options: ["Elegant", "Traditional", "Cinematic", "A mix"] },
    { id: "partner", label: "Would your partner or family like to join?", type: "select", options: ["Just me", "With partner", "With family"] },
    { id: "meaning", label: "Is there anything meaningful you'd like this session to represent?", type: "textarea" },
  ],
  wedding: [
    { id: "met", label: "How did you both meet?", type: "textarea" },
    { id: "memory", label: "What is one memory you never want to forget?", type: "textarea" },
    { id: "style", label: "What style represents you best?", type: "select", options: ["Candid", "Traditional", "Cinematic", "Editorial", "A mix"] },
    { id: "family_focus", label: "Which family members are most important to capture?", type: "textarea" },
    { id: "surprises", label: "Any surprise moments planned?", type: "textarea" },
  ],
  family: [
    { id: "who", label: "Who will be joining the session?", type: "textarea" },
    { id: "travelling", label: "Is there someone travelling specially for this shoot?" },
    { id: "enjoy", label: "What does your family enjoy doing together?", type: "textarea" },
    { id: "memory", label: "What memory would you love to recreate?", type: "textarea" },
  ],
  birthday: [
    { id: "whose", label: "Whose special day are we celebrating?" },
    { id: "theme", label: "Favourite cartoon or theme?" },
    { id: "colours", label: "Favourite colours?" },
    { id: "cake_smash", label: "Cake smash planned?", type: "select", options: ["Yes", "No", "Maybe"] },
    { id: "surprise", label: "Any surprise planned?", type: "textarea" },
  ],
  other: [
    { id: "about", label: "Tell us a little about what you have in mind.", type: "textarea" },
    { id: "vision", label: "What would make this session feel like a success for you?", type: "textarea" },
  ],
};
