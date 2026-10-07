# HackRelay — 可交互网页

根据 Figma `high` 高保真设计实现的 React 应用，配有本地 Node.js 协作服务。仓库位置：`/Users/charleszhao/Desktop/learn/social computing/hackrelay-web`。

## 启动

需要 Node.js 22 或更新版本。首次运行：

```sh
cd "/Users/charleszhao/Desktop/learn/social computing/hackrelay-web"
npm install
npm run dev
```

打开 http://localhost:5173 。运行时终端还会显示同一网络的访问地址。请保持终端里的服务运行。端口可用 `PORT=5174 npm run dev` 更改。

## 验证真人协作

1. 打开 Repository，点击右上角头像，填写自己的名字。
2. 点击 Invite teammate，复制完整链接给同伴。同一台电脑可以使用另一个浏览器或无痕窗口。
3. 其他设备需连接同一 Wi-Fi，并使用终端显示的局域网地址，例如 `http://10.13.103.72:5173/code?room=team-a`；地址可能随网络变化。其他设备不能用 localhost 连接你的电脑。
4. 各自在右上角设置不同名字，然后同时输入、删除代码、选中一段文本。更改、彩色光标与选择范围实时同步；光标悬停时显示名字。
5. 同一个 `room` 参数共享内容；不同 room 的代码、任务、画布、资源和记录相互独立。

这是文本协作编辑器，包含 App.tsx、styles.css、README.md 三个示例文件、语法高亮、个人撤销及文件下载。它不执行代码。

## 已实现的交互

- **Workflow**：新增、修改、删除节点；拖动节点；从右侧输出点拖到左侧输入点建立有向连接，支持分支和汇合；点击连线后可删除；滚轮缩放、拖动空白区域平移、缩放按钮和适配画布。右下角把手可拖动调整画布大小，右上角可在本页展开。
- **Kanban**：新增、修改、删除任务，通过卡片左上角把手跨列拖动或重新排序；也可在编辑表单修改状态。任务详情支持依赖链接、自由输入交接笔记、评论和标记待审。
- **Recent activity**：记录真实编辑操作，打开对应任务、资源、代码文件、画布节点或提交记录；支持筛选和导出。已删除项目显示不可用状态或返回对应列表。
- **其他页面**：活动与挑战、找队伍与创建队伍、共享资源（文本、链接及最高 5 MB 文件）、现场求助、提交草稿与预览、确认提交、项目展示、报告列表和详情、补充报告信息、文档及个人资料。
- **报告和交接 UI**：交接笔记采用可输入的完整文本区域；报告列表采用有表头的对齐表格；移动端可用。

## 保存与服务

浏览器通过 WebSocket 连接 Node.js 服务；代码使用 Yjs CRDT 合并并发输入，光标使用 awareness 临时同步。业务记录也存储在共享 Yjs 文档中。房间数据自动写入 `data/<room>.bin`，重启服务后恢复。浏览器个人名字、颜色保存在 localStorage。`data` 不提交到 Git；备份该目录可保留演示内容。

目前是适合作业演示的本地/局域网版本，没有登录鉴权或正式的组织者审批后台。报告列表按当前浏览器身份筛选，不构成服务器权限隔离；请使用演示数据。示例活动、团队、任务与展示项目是初始数据，后续添加的内容和协作编辑会实际保存。未部署到公网。

## 构建与测试

```sh
npm run build
npm start
```

生产模式仍由 Node.js 同时提供网页和 WebSocket；仅托管静态 dist 文件无法实现跨设备同步。

```sh
npm test
# 首次运行浏览器测试需要安装 Chromium
npx playwright install chromium
# 另一个终端先运行 npm run dev
npm run test:ui
```

网络测试验证独立客户端并发合并、删除、在线身份/光标、任务与图数据同步、房间隔离和服务重启恢复。浏览器测试验证两个独立会话的同步与光标、画布和任务操作、交接笔记持久化、资源/提交/报告流程、活动目标链接及移动端页面。测试截图位于 tests/artifacts。

## 代码结构

- `src/Editor.jsx`：CodeMirror + Yjs 实时编辑器
- `src/Workflow.jsx`：React Flow 可编辑画布
- `src/Kanban.jsx`：dnd-kit 看板与任务表单
- `src/Workspace.jsx`：工作区、交接与活动
- `src/Pages.jsx`：其余页面和表单
- `src/store.jsx`：房间连接、身份、共享数据和活动
- `server/index.js`、`server/seed.js`：WebSocket 服务、持久化与初始内容
- `design-reference/`：Figma 设计参考

未调用外部 AI 服务，也无需 API 密钥。
