export type OrchidProduct = {
  number: string;
  name: string;
  descriptor: string;
  tagline?: string;
  imageClass: string;
  image: string;
  category: string;
};

export const orchids: OrchidProduct[] = [
  {
    number: "01",
    name: "Sonia Purple",
    descriptor: "Fresh-cut orchid stems",
    tagline: "PURPLE FOR IMPACT",
    imageClass: "sonia-image",
    image: "/images/products/sonia-purple.png",
    category: "DENDROBIUM SONIA",
  },
  {
    number: "02",
    name: "Big White",
    descriptor: "Fresh-cut orchid stems",
    tagline: "WHITE FOR BALANCE",
    imageClass: "white-image",
    image: "/images/products/big-white.png",
    category: "DENDROBIUM BIG WHITE",
  },
  {
    number: "03",
    name: "Loose Blooms",
    descriptor: "Individual purple orchid for garnish",
    imageClass: "loose-image",
    image: "/images/products/loose-bloom-sonia.png",
    category: "DENDROBIUM SONIA",
  },
  {
    number: "04",
    name: "Loose Blooms",
    descriptor: "Individual white orchids for garnish",
    imageClass: "new-collection-image",
    image: "/images/products/loose-bloom-white.png",
    category: "DENDROBIUM BIG WHITE",
  },
];

export type ProductFilter = "cut" | "loose";

export function filterOrchids(filter: ProductFilter): OrchidProduct[] {
  if (filter === "cut") {
    return orchids.filter((item) => item.number === "01" || item.number === "02");
  }
  return orchids.filter((item) => item.number === "03" || item.number === "04");
}
