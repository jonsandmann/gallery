export type CategoryName = "Outerwear" | "Knitwear" | "Denim" | "Shirts" | "Footwear" | "Accessories";
export type Channel = "all" | "stores" | "online";
export const sizeNames = ["XS", "S", "M", "L", "XL", "XXL"];

export const sourceCategories = [
  { name: "Outerwear" as const, received: 56000, sold: 17416, price: 214, plan: 44, weekly: 2049, onlineR: .22, onlineS: .28, sub: ["Coats", "Jackets", "Vests"], styles: ["Alder wool coat", "Ridge quilted jacket", "Orin down vest"], sizeR: [.07, .17, .27, .26, .16, .07], sizeS: [.04, .13, .27, .31, .18, .07] },
  { name: "Knitwear" as const, received: 84000, sold: 39228, price: 86, plan: 46, weekly: 4980, onlineR: .31, onlineS: .36, sub: ["Pullovers", "Cardigans", "Vests"], styles: ["Wren merino crew", "Aster rib cardigan", "Hollis knit vest"], sizeR: [.09, .22, .29, .23, .12, .05], sizeS: [.10, .25, .30, .21, .10, .04] },
  { name: "Denim" as const, received: 68000, sold: 33660, price: 94, plan: 48, weekly: 4334, onlineR: .26, onlineS: .31, sub: ["Straight", "Wide leg", "Tapered"], styles: ["Vale straight jean", "Arden wide-leg jean", "Wick tapered jean"], sizeR: [.06, .18, .29, .27, .14, .06], sizeS: [.05, .20, .32, .27, .12, .04] },
  { name: "Shirts" as const, received: 62000, sold: 26598, price: 64, plan: 46, weekly: 3331, onlineR: .28, onlineS: .34, sub: ["Poplin", "Flannel", "Oxford"], styles: ["Tern poplin shirt", "Briar brushed flannel", "Sable Oxford shirt"], sizeR: [.08, .19, .28, .25, .14, .06], sizeS: [.06, .19, .29, .27, .14, .05] },
  { name: "Footwear" as const, received: 34000, sold: 15708, price: 118, plan: 47, weekly: 2014, onlineR: .24, onlineS: .29, sub: ["Boots", "Sneakers", "Loafers"], styles: ["Morrow leather boot", "Pace court sneaker", "Ellis suede loafer"], sizeR: [.07, .18, .28, .26, .15, .06], sizeS: [.06, .17, .30, .29, .13, .05] },
  { name: "Accessories" as const, received: 54000, sold: 29106, price: 32, plan: 51, weekly: 3560, onlineR: .36, onlineS: .43, sub: ["Scarves", "Beanies", "Gloves"], styles: ["Linden wool scarf", "Rook rib beanie", "Fern leather glove"], sizeR: [.10, .18, .25, .24, .15, .08], sizeS: [.09, .20, .28, .24, .13, .06] },
];

export function allocate(total: number, shares: number[]) {
  const values = shares.map(share => Math.floor(total * share));
  values[values.length - 1] += total - values.reduce((sum, value) => sum + value, 0);
  return values;
}

export const progress = [0, .073, .158, .262, .373, .490, .614, .742, .864, 1];

export function getCategories(channel: Channel, week: number, season: string) {
  return sourceCategories.map((source, index) => {
    const seasonScale = season === "fw26" ? 1 : .91;
    const allReceived = Math.round(source.received * seasonScale);
    const allSold = Math.round(source.sold * progress[week] * seasonScale * (season === "fw26" ? 1 : 1.08));
    const allWeekly = Math.round(source.weekly * seasonScale * (week === 9 ? 1 : .91));
    const onlineR = Math.round(allReceived * source.onlineR);
    const onlineS = Math.round(allSold * source.onlineS);
    const onlineW = Math.round(allWeekly * source.onlineS);
    const received = channel === "all" ? allReceived : channel === "online" ? onlineR : allReceived - onlineR;
    const sold = channel === "all" ? allSold : channel === "online" ? onlineS : allSold - onlineS;
    const weekly = channel === "all" ? allWeekly : channel === "online" ? onlineW : allWeekly - onlineW;
    const rate = sold / received * 100;
    const plan = source.plan * progress[week];
    const sizeReceived = allocate(received, source.sizeR);
    const sizeSold = allocate(sold, source.sizeS);
    return { ...source, received, sold, weekly, rate, plan, revenue: sold * source.price, onHand: received - sold, wos: (received - sold) / weekly, variance: rate - plan, sizes: sizeNames.map((size, i) => ({ size, received: sizeReceived[i], sold: sizeSold[i] })), id: index };
  });
}

export type Category = ReturnType<typeof getCategories>[number];

export function summarize(categories: Category[]) {
  const received = categories.reduce((s, c) => s + c.received, 0);
  const sold = categories.reduce((s, c) => s + c.sold, 0);
  const weekly = categories.reduce((s, c) => s + c.weekly, 0);
  const plan = categories.reduce((s, c) => s + c.plan * c.received, 0) / received;
  const rate = sold / received * 100;
  return {
    received, sold, weekly, plan, rate, variance: rate - plan,
    revenue: categories.reduce((s, c) => s + c.revenue, 0),
    onHand: received - sold,
    wos: (received - sold) / weekly,
    sizes: sizeNames.map(size => ({ size, received: categories.reduce((s, c) => s + c.sizes.find(v => v.size === size)!.received, 0), sold: categories.reduce((s, c) => s + c.sizes.find(v => v.size === size)!.sold, 0) })),
  };
}

export function getStyles(categories: Category[]) {
  return categories.flatMap(category => {
    const received = allocate(category.received, [.42, .35, .23]);
    const sold = allocate(category.sold, [.32, .40, .28]);
    const weekly = allocate(category.weekly, [.32, .40, .28]);
    return category.styles.map((name, i) => ({
      name, category: category.name, sku: `FW26-${["OW", "KN", "DN", "SH", "FT", "AC"][category.id]}-${102 + i * 17}`,
      received: received[i], sold: sold[i], rate: sold[i] / received[i] * 100, plan: category.plan,
      variance: sold[i] / received[i] * 100 - category.plan, wos: (received[i] - sold[i]) / weekly[i],
      revenue: sold[i] * category.price,
    }));
  });
}

export function curveData(rate: number, plan: number, week: number) {
  return Array.from({ length: 26 }, (_, i) => {
    const w = i + 1;
    return {
      week: w,
      actual: w <= week ? rate * progress[w] / progress[week] : null,
      plan: w <= week ? plan * progress[w] / progress[week] : plan + (89 - plan) * (1 - Math.pow(1 - (w - week) / (26 - week), 1.5)),
    };
  });
}

export type Tile = { index: number; x: number; y: number; width: number; height: number };

// Look ahead across row breaks so the smallest revenue tiles retain readable labels.
export function squarify(values: number[], width: number, height: number): Tile[] {
  const total = values.reduce((sum, value) => sum + value, 0);
  const items = values.map((value, index) => ({ area: value / total * width * height, index })).sort((a, b) => b.area - a.area);
  function arrange(remaining: typeof items, x: number, y: number, w: number, h: number): { score: number; tiles: Tile[] } {
    let best = { score: Infinity, tiles: [] as Tile[] };
    for (const vertical of [true, false]) {
      for (let count = 1; count <= remaining.length; count++) {
        const row = remaining.slice(0, count);
        const thickness = row.reduce((sum, item) => sum + item.area, 0) / (vertical ? h : w);
        let offset = 0;
        const tiles = row.map(item => {
          const extent = item.area / thickness;
          const tile = { index: item.index, x: x + (vertical ? 0 : offset), y: y + (vertical ? offset : 0), width: vertical ? thickness : extent, height: vertical ? extent : thickness };
          offset += extent;
          return tile;
        });
        let score = Math.max(...tiles.map(tile => Math.max(tile.width / tile.height, tile.height / tile.width, tile.width < 95 ? 380 / tile.width : 0, tile.height < 58 ? 232 / tile.height : 0)));
        if (count < remaining.length) {
          const rest = arrange(remaining.slice(count), x + (vertical ? thickness : 0), y + (vertical ? 0 : thickness), w - (vertical ? thickness : 0), h - (vertical ? 0 : thickness));
          score = Math.max(score, rest.score);
          tiles.push(...rest.tiles);
        }
        if (score < best.score) best = { score, tiles };
      }
    }
    return best;
  }
  return arrange(items, 0, 0, width, height).tiles;
}

export const integer = (value: number) => value.toLocaleString("en-US");
export const compact = (value: number) => `${(value / 1000).toFixed(1)}k`;
export const points = (value: number) => `${value > 0 ? "+" : ""}${value.toFixed(1)} pp`;
