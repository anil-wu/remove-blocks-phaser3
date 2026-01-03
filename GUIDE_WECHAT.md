# 微信小游戏构建流程指南

本文档详细记录了将 Phaser 3 Web 游戏移植到微信小游戏平台的完整流程。

## 1. 环境准备

1.  下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)。
2.  确保你有微信小游戏的 AppID（如果没有，可以使用测试号，或者在创建项目时选择“测试号”）。

## 2. 项目结构搭建

我们创建了一个独立的 `minigame` 目录，以保持项目结构清晰，不影响原有的 Web 版本。

```text
root/
├── game.js             # Web 版逻辑
├── index.html          # Web 版入口
├── minigame/           # 小游戏项目根目录
│   ├── game.js         # 适配后的小游戏逻辑
│   ├── game.json       # 小游戏全局配置
│   ├── project.config.json # 开发者工具配置
│   └── libs/           # 依赖库
│       ├── phaser.min.js
│       └── weapp-adapter.js # 核心适配层
```

## 3. 关键适配步骤

### 3.1 引入适配层 (`weapp-adapter.js`)

微信小游戏没有 `window`、`document` 等浏览器对象，Phaser 无法直接运行。我们添加了一个定制版的 `weapp-adapter.js` 来模拟这些环境。

**核心适配逻辑：**

1.  **全局对象模拟**：
    *   微信小游戏没有 `window`，而是使用 `GameGlobal`。
    *   适配器将 `GameGlobal` 代理为 `window`，并模拟 `document`、`navigator`、`XMLHttpRequest` 等对象。

2.  **解决只读属性限制**：
    *   在微信环境中，`window.document` 等属性通常是只读的。
    *   适配器实现了 `setGlobalProperty` 和 `extendProperty` 辅助函数，利用 `Object.defineProperty` 绕过限制，强制注入或增强这些属性。

3.  **DOM API 补全 (Phaser 启动所必需)**：
    *   **`document.createElement(tagName)`**: 拦截 `canvas`、`image`、`audio` 等标签创建请求，分别映射到 `wx.createCanvas()`、`wx.createImage()` 和 `wx.createInnerAudioContext()`。
    *   **`document.elementFromPoint(x, y)`**: **[关键]** 简单返回全局 Canvas 对象。Phaser 的输入系统依赖此方法判断点击目标，缺失会导致触摸失效。
    *   **`document.documentElement.appendChild`**: 模拟挂载节点，防止 Phaser 启动报错。
    *   **构造函数**: 补充 `HTMLVideoElement`、`HTMLCanvasElement` 等空构造函数，通过 Phaser 的类型检查。

4.  **模块导出**：
    *   文件末尾使用 `module.exports = _window`，适配小游戏的 CommonJS 规范。

### 3.2 游戏逻辑适配 (`minigame/game.js`)

1.  **模块引入**：
    *   Web 版使用 `<script>` 标签或 ES6 `import`。
    *   小游戏版必须使用 CommonJS `require`：
        ```javascript
        require('./libs/weapp-adapter');
        require('./libs/phaser.min.js');
        ```

2.  **Canvas 注入**：
    *   Web 版 Phaser 会自动查找或创建 Canvas。
    *   小游戏版必须显式传入全局 Canvas 对象：
        ```javascript
        const config = {
            // ...
            canvas: GameGlobal.canvas || wx.createCanvas(),
            // ...
        };
        ```

3.  **屏幕适配**：
    *   使用 `wx.getSystemInfoSync()` 获取物理屏幕宽高，确保全屏显示。

## 4. 配置文件

*   **`game.json`**:
    *   设置 `deviceOrientation` 为 `"portrait"` (竖屏)。
    *   移除不必要的 `openDataContext` 避免报错。
*   **`project.config.json`**:
    *   设置 `compileType` 为 `"miniprogram"`。
    *   建议移除固定的 `libVersion`，让工具自动选择合适的基础库。

## 5. 导入与运行

1.  打开微信开发者工具。
2.  点击 **导入项目**。
3.  目录选择本项目下的 `minigame` 文件夹。
4.  AppID 选择你的 ID 或 测试号。
5.  点击 **确定**，工具会自动编译并运行游戏。

## 6. 常见问题排查

*   **黑屏**：检查控制台是否有报错。常见原因是缺少 DOM API 模拟，检查 `weapp-adapter.js`。
*   **触摸无反应**：通常是因为 `document.elementFromPoint` 未实现，Phaser 无法检测输入目标。
*   **基础库报错**：在开发者工具右上角“详情”->“本地设置”中切换调试基础库版本（建议 3.x.x）。
