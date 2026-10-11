// Builds README.md from every apps/<name>/app.json. Run `node scripts/build-index.mjs` after adding or
// editing an app; nothing else in the README is hand-written except INTRO below.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const INTRO = `# Gallery

Things I've made with AI and design: apps, dashboards and experiments, each one small enough to read in an
afternoon and complete enough to run. Every folder in \`apps/\` stands on its own. Open it, \`npm install\`,
\`npm run dev\`, and take whatever is useful.

All data in these apps is made up.`;

/** How a tag reads as a heading; anything not listed is capitalised as is. */
const TAG_NAMES = { data: "Data apps", mui: "MUI", ai: "AI", ux: "UX" };
const COLUMNS = 2;

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const appsDir = join(root, "apps");
const apps = readdirSync(appsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(appsDir, d.name, "app.json")))
  .map((d) => ({ slug: d.name, ...JSON.parse(readFileSync(join(appsDir, d.name, "app.json"), "utf8")) }))
  .sort((a, b) => (b.added ?? "").localeCompare(a.added ?? "") || a.title.localeCompare(b.title));

for (const app of apps) {
  for (const key of ["title", "tagline", "tags", "image"]) {
    if (!app[key]) throw new Error(`apps/${app.slug}/app.json is missing "${key}"`);
  }
  if (!existsSync(join(appsDir, app.slug, app.image))) throw new Error(`apps/${app.slug}/${app.image} does not exist`);
}

const tagName = (tag) => TAG_NAMES[tag] ?? tag.charAt(0).toUpperCase() + tag.slice(1);
const anchor = (tag) => tagName(tag).toLowerCase().replace(/[^a-z0-9]+/g, "-");
// Markdown links do not render inside an HTML table cell on GitHub, so the cards use anchors.
const links = (app) => [app.demo && `<a href="${app.demo}">Live demo</a>`, `<a href="apps/${app.slug}">Code</a>`].filter(Boolean).join(" · ");

function card(app) {
  return `<a href="apps/${app.slug}"><img src="apps/${app.slug}/${app.image}" alt="${app.title}" width="100%"></a><br>` +
    `<strong>${app.title}</strong><br>${app.tagline}<br>${links(app)}`;
}

const rows = [];
for (let i = 0; i < apps.length; i += COLUMNS) {
  const cells = apps.slice(i, i + COLUMNS).map((app) => `<td width="${100 / COLUMNS}%" valign="top">${card(app)}</td>`);
  rows.push(`<tr>${cells.join("")}</tr>`);
}

const tags = [...new Set(apps.flatMap((app) => app.tags))].sort((a, b) => tagName(a).localeCompare(tagName(b)));
const byTag = tags.map((tag) => {
  const list = apps.filter((app) => app.tags.includes(tag)).map((app) => `- **[${app.title}](apps/${app.slug})**: ${app.tagline}`);
  return `### ${tagName(tag)}\n\n${list.join("\n")}`;
});

const readme = `${INTRO}

<table>
${rows.join("\n")}
</table>

## Browse by tag

${tags.map((tag) => `[${tagName(tag)}](#${anchor(tag)})`).join(" · ")}

${byTag.join("\n\n")}

## Licence

MIT, unless an app's own README says otherwise.
`;

writeFileSync(join(root, "README.md"), readme);
console.log(`README.md: ${apps.length} app${apps.length === 1 ? "" : "s"}, ${tags.length} tags`);
