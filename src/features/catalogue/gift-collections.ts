// Sharp Image’s public range, matched to Rajmoti product codes.
export const giftCollections = [
  {
    "id": "wall-prints",
    "name": "Wall prints",
    "products": [
      "PRT-004",
      "SHP-003",
      "PRT-001"
    ],
    "featuredProduct": "PRT-004"
  },
  {
    "id": "frames-clocks",
    "name": "Frames & clocks",
    "products": [
      "SHP-005",
      "SHP-012",
      "WOD-004"
    ],
    "featuredProduct": "SHP-012"
  },
  {
    "id": "mugs-cushions",
    "name": "Mugs & cushions",
    "products": [
      "MUG-001",
      "TEX-001"
    ],
    "featuredProduct": "MUG-001"
  },
  {
    "id": "keychains-rakhi",
    "name": "Keychains & rakhi",
    "products": [
      "KEY-001",
      "SHP-006",
      "SHP-007",
      "SHP-008",
      "SHP-013"
    ],
    "featuredProduct": "SHP-006"
  },
  {
    "id": "car-keepsakes",
    "name": "Car keepsakes",
    "products": [
      "SHP-002",
      "SHP-004"
    ],
    "featuredProduct": "SHP-002"
  },
  {
    "id": "desk-gifts",
    "name": "Desk gifts",
    "products": [
      "SHP-001",
      "STA-003",
      "SHP-010",
      "SHP-011"
    ],
    "featuredProduct": "SHP-001"
  },
  {
    "id": "phone-accessories",
    "name": "Phone & tech",
    "products": [
      "TEC-003",
      "TEC-001",
      "SHP-009"
    ],
    "featuredProduct": "TEC-001"
  },
  {
    "id": "photo-magnets",
    "name": "Photo magnets",
    "products": [
      "MAG-001"
    ],
    "featuredProduct": "MAG-001"
  }
];

export function getGiftCollection(id?: string) {
  return giftCollections.find((collection) => collection.id === id);
}

export function giftCollectionProductImage(productId: string) {
  const collection = giftCollections.find((entry) => entry.featuredProduct === productId);
  return collection ? "/products/collections/" + collection.id + ".webp" : undefined;
}
