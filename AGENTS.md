# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## 本项目约定（校园活动汇）

- 产品形态：桌面优先的校园活动信息原型，页面分三级——首页板块 → 板块活动列表 → 活动详情，右上角常驻搜索框。
- 路由使用地址栏 hash：`#/`、`#/c/<板块id>`、`#/a/<活动id>`、`#/search?q=<关键词>`，便于直接分享单场活动。
- 所有活动内容集中在 `src/data/activities.js`：`CATEGORIES` 是板块，`ACTIVITIES` 是活动。改这个文件即可替换成真实数据，不要在组件里写死内容。
- 板块视觉标识由数据里的 `accent`、`accentSoft`、`icon` 三个字段驱动；新增板块时同步在 `src/App.jsx` 的 `ICONS` 映射里登记图标名。
- 图标统一使用 `@phosphor-icons/react`，不新造内联 SVG；本设计不含位图资产（无海报图），卡片以日期块 + 排版承载信息。
- 视觉基调：浅色、白卡片、1px 边框、14-16px 圆角、正文 14-16px、单一强调色随板块变化；保持简约，不做多余装饰。
- 本地截图检查产物放在 `.preview/`；Edge 临时 profile 不要放进项目目录（会被 Vite 文件监听拖崩）。
- 关于 `dateKind`：活动卡片左上角的日期块由 `dateKind` 决定，`event` 显示活动日期、`deadline` 显示报名截止日（带「截止」小字）、`open` 显示「长期」。
- 关于 `trust`：字段值为 `学生自发` 时，卡片与详情页会显示对应标识；官方发布的活动不显示该标识。
- 关于信息缺失：原始信息里没有的内容统一写「信息未注明」，页面会用浅灰色呈现，不要为了好看编造地点、主办方或费用。
- 未收录的信息放在 `src/data/activities.js` 末尾的 `INFO_PENDING_REVIEW`，不参与渲染。
