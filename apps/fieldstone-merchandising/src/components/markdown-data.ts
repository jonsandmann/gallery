export type MarkdownStyle = {
  id: string;
  name: string;
  colourway: string;
  swatch: string;
  category: string;
  basePrice: number;
  unitCost: number;
  onHand: number;
  received: number;
  baseUnits: number;
  plan: number;
};

export const markdownStyles: MarkdownStyle[] = [
  { id: "FW26-OW-207", name: "Harbor Wool Overcoat", colourway: "Charcoal", swatch: "bg-[#535553]", category: "Outerwear", basePrice: 348, unitCost: 132, onHand: 3864, received: 5600, baseUnits: 154, plan: 44 },
  { id: "FW26-OW-102", name: "Alder Wool Coat", colourway: "Oat", swatch: "bg-[#C8BBA3]", category: "Outerwear", basePrice: 248, unitCost: 92, onHand: 2730, received: 3800, baseUnits: 109, plan: 44 },
  { id: "FW26-OW-119", name: "Ridge Quilted Jacket", colourway: "Olive", swatch: "bg-[#79816A]", category: "Outerwear", basePrice: 178, unitCost: 68, onHand: 2118, received: 3200, baseUnits: 90, plan: 44 },
  { id: "FW26-SH-102", name: "Tern Poplin Shirt", colourway: "Chalk", swatch: "bg-[#E3DED2]", category: "Shirts", basePrice: 78, unitCost: 29, onHand: 3402, received: 5200, baseUnits: 142, plan: 46 },
  { id: "FW26-SH-119", name: "Briar Brushed Flannel", colourway: "Rust", swatch: "bg-[#A97057]", category: "Shirts", basePrice: 98, unitCost: 37, onHand: 1946, received: 3100, baseUnits: 84, plan: 46 },
  { id: "FW26-FT-102", name: "Morrow Leather Boot", colourway: "Espresso", swatch: "bg-[#665044]", category: "Footwear", basePrice: 188, unitCost: 74, onHand: 1288, received: 2200, baseUnits: 50, plan: 47 },
  { id: "FW26-KN-119", name: "Aster Rib Cardigan", colourway: "Birch", swatch: "bg-[#C1B7A6]", category: "Knitwear", basePrice: 128, unitCost: 48, onHand: 2304, received: 3500, baseUnits: 90, plan: 46 },
  { id: "FW26-KN-136", name: "Hollis Knit Vest", colourway: "Ink", swatch: "bg-[#465363]", category: "Knitwear", basePrice: 88, unitCost: 33, onHand: 1706, received: 2800, baseUnits: 74, plan: 46 },
  { id: "FW26-DN-102", name: "Vale Straight Jean", colourway: "Indigo", swatch: "bg-[#536C84]", category: "Denim", basePrice: 118, unitCost: 44, onHand: 2608, received: 4400, baseUnits: 115, plan: 48 },
  { id: "FW26-SH-136", name: "Sable Oxford Shirt", colourway: "Blue mist", swatch: "bg-[#A7B9C8]", category: "Shirts", basePrice: 88, unitCost: 32, onHand: 1822, received: 3000, baseUnits: 72, plan: 46 },
  { id: "FW26-FT-136", name: "Ellis Suede Loafer", colourway: "Tobacco", swatch: "bg-[#A7835E]", category: "Footwear", basePrice: 148, unitCost: 57, onHand: 986, received: 1600, baseUnits: 43, plan: 47 },
  { id: "FW26-AC-102", name: "Linden Wool Scarf", colourway: "Heather", swatch: "bg-[#ADA8AD]", category: "Accessories", basePrice: 68, unitCost: 24, onHand: 2894, received: 4900, baseUnits: 121, plan: 51 },
  { id: "FW26-SH-153", name: "Rowan Twill Overshirt", colourway: "Pine", swatch: "bg-[#607262]", category: "Shirts", basePrice: 138, unitCost: 53, onHand: 1638, received: 2700, baseUnits: 65, plan: 46 },
  { id: "FW26-AC-136", name: "Fern Leather Glove", colourway: "Black", swatch: "bg-[#3E403F]", category: "Accessories", basePrice: 78, unitCost: 30, onHand: 1424, received: 2300, baseUnits: 58, plan: 51 },
];

export type MarkdownChannel = "all" | "stores" | "online";
export const ELASTICITY = -1.8;
export const MARGIN_FLOOR = 52;
export const FIRST_WEEK = 10;
export const LAST_WEEK = 26;

export function channelStyle(style: MarkdownStyle, channel: MarkdownChannel): MarkdownStyle {
  const onlineStock = Math.round(style.onHand * .28);
  const onlineReceived = Math.round(style.received * .28);
  return channel === "all" ? style : {
    ...style,
    onHand: channel === "online" ? onlineStock : style.onHand - onlineStock,
    received: channel === "online" ? onlineReceived : style.received - onlineReceived,
    baseUnits: style.baseUnits * (channel === "online" ? .28 : .72),
  };
}

export function priceBounds(style: MarkdownStyle) {
  return { min: Math.ceil(style.basePrice * .5 / 5) * 5, max: Math.ceil(style.basePrice / 5) * 5 };
}

export function snapPrice(style: MarkdownStyle, price: number) {
  const { min, max } = priceBounds(style);
  return Math.max(min, Math.min(max, Math.round(price / 5) * 5));
}

export function weeklyDemand(style: MarkdownStyle, price: number) {
  return style.baseUnits * (price / style.basePrice) ** ELASTICITY;
}

export function recommendation(style: MarkdownStyle, effectiveWeek = FIRST_WEEK) {
  const stockAtStart = Math.max(0, style.onHand - style.baseUnits * (effectiveWeek - FIRST_WEEK));
  const weeks = LAST_WEEK - effectiveWeek + 1;
  if (!stockAtStart) return Math.floor(style.basePrice / 5) * 5;
  const clearingPrice = style.basePrice * (stockAtStart / (style.baseUnits * weeks)) ** (1 / ELASTICITY);
  const { min } = priceBounds(style);
  return Math.max(min, Math.floor(Math.min(clearingPrice, style.basePrice) / 5) * 5);
}

export function projectScenario(style: MarkdownStyle, price: number, effectiveWeek = FIRST_WEEK) {
  let remaining = style.onHand;
  let expected = 0;
  let revenue = 0;
  let grossMargin = 0;
  const weeks = Array.from({ length: LAST_WEEK - FIRST_WEEK + 1 }, (_, index) => {
    const week = FIRST_WEEK + index;
    const activePrice = week < effectiveWeek ? style.basePrice : price;
    const demand = weeklyDemand(style, activePrice);
    // Carry fractional demand forward rather than rounding every week independently.
    const units = Math.min(remaining, Math.floor(expected + demand + 1e-8) - Math.floor(expected + 1e-8));
    expected += demand;
    remaining -= units;
    revenue += units * activePrice;
    grossMargin += units * (activePrice - style.unitCost);
    return { week, inventory: remaining, units, price: activePrice };
  });
  const unitsSold = style.onHand - remaining;
  return {
    weeks, remaining, unitsSold, revenue, grossMargin,
    weeklyUnits: weeklyDemand(style, price),
    sellThrough: (style.received - remaining) / style.received * 100,
    marginRate: revenue ? grossMargin / revenue * 100 : 0,
    selloutWeek: weeks.find(week => week.inventory === 0)?.week ?? null,
  };
}
