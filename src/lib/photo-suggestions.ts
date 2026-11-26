type TaxonomyOption = { id: string; name: string; slug: string };

const categoryKeywords: Record<string, string[]> = {
  baby: ["baby", "newborn", "infant", "cake smash", "cake-smash", "બેબી", "નવજાત"],
  maternity: ["maternity", "pregnancy", "expecting", "baby bump", "baby-bump", "મેટરનિટી", "ગર્ભાવસ્થા"],
  family: ["family", "siblings", "grandparents", "ફેમિલી", "પરિવાર"],
  wedding: ["wedding", "bride", "groom", "pre wedding", "pre-wedding", "haldi", "mehendi", "engagement", "લગ્ન", "સગાઈ"],
};

const tagKeywords: Record<string, string[]> = {
  newborn: ["newborn", "નવજાત"],
  birthday: ["birthday", "cake smash", "cake-smash", "જન્મદિવસ"],
  "cake-smash": ["cake smash", "cake-smash"],
  milestone: ["milestone", "months"],
  indoor: ["indoor", "studio"],
  outdoor: ["outdoor", "garden"],
  traditional: ["traditional", "ethnic", "પારંપરિક"],
  "pre-wedding": ["pre-wedding", "pre wedding", "prewedding"],
  engagement: ["engagement", "સગાઈ"],
  haldi: ["haldi", "હળદી"],
  mehendi: ["mehendi", "mehndi", "મહેંદી"],
};

function normalized(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, " ").trim();
}

function containsWords(text: string, phrase: string) {
  const words = normalized(phrase);
  return words.length > 1 && ` ${text} `.includes(` ${words} `);
}

export function suggestPhotoMetadata(
  name: string,
  relativePath: string,
  categories: TaxonomyOption[],
) {
  const originalName = name.replace(/\.[^.]+$/, "");
  const folder = relativePath.split("/").slice(0, -1).join(" ");
  const text = normalized(`${folder} ${originalName}`);
  const matches = categories.filter((category) =>
    [category.name, category.slug, ...(categoryKeywords[category.slug] ?? [])].some((keyword) =>
      containsWords(text, keyword),
    ),
  );
  // Favor a specific service if terms overlap, for example “maternity baby bump”.
  const specific = matches.filter(({ slug }) => slug === "maternity" || slug === "wedding");
  const category = matches.length === 1 ? matches[0]
    : specific.length === 1 && matches.every(({ slug }) => slug === "baby" || slug === specific[0].slug)
      ? specific[0] : undefined;
  const tags = Object.entries(tagKeywords)
    .filter(([, words]) => words.some((word) => containsWords(text, word)))
    .map(([tag]) => tag);
  return { categoryId: category?.id ?? "", categoryLabel: category?.name ?? "", tags, text };
}

export function suggestPhotoSubcategory(text: string, options: TaxonomyOption[]) {
  const matches = options.filter((option) =>
    [option.name, option.slug].some((value) => containsWords(text, value)),
  );
  return matches.length === 1 ? matches[0] : undefined;
}

export function framingTag(width: number, height: number) {
  const ratio = width / height;
  return ratio > 1.1 ? "landscape" : ratio < 0.9 ? "portrait" : "square";
}
