# Pangu CN（中文排版助手）

自动整理中文排版：在中英文之间、中文与数字之间补空格，清理中文标点前后的多余空格。

Automatic Chinese typography for Obsidian: inserts spaces between CJK and Latin text (and digits), and tidies spacing around Chinese punctuation.

## Features / 功能

- **Format the current note / 格式化当前笔记** — search "中文排版" in the command palette. 命令面板搜索「中文排版」。
- **Format the selection / 格式化选中内容**
- **Format all notes in the current folder / 格式化当前文件夹内所有笔记** — batch operation, back up first. 批量处理，建议先备份。
- **Auto-format on paste / 粘贴时自动排版** — text pasted from the web is formatted automatically. 从网页复制内容粘贴进笔记时自动整理。
- **Editor context menu / 编辑器右键菜单快捷入口**

Code blocks, inline code, URLs, Markdown link targets, wikilinks and HTML tags are skipped. 自动跳过代码块、行内代码、URL、Markdown 链接地址、Wiki 链接与 HTML 标签。

## Installation / 安装

1. Search "Pangu CN" in Obsidian's Community Plugins directory once approved. 社区插件市场审核通过后可直接搜索 "Pangu CN" 安装。
2. Manual install / 手动安装: put `main.js` and `manifest.json` into `<vault>/.obsidian/plugins/pangu-cn/`, restart Obsidian, then enable the plugin in "Community plugins". 把 `main.js`、`manifest.json` 放入 `<vault>/.obsidian/plugins/pangu-cn/`，重启 Obsidian 后在「第三方插件」中启用。

## Usage / 使用

1. Enable the plugin, then open the command palette with `Ctrl/Cmd+P`. 启用插件后，`Ctrl/Cmd+P` 打开命令面板。
2. Search "中文排版" and run a command. 搜索「中文排版」运行对应命令。
3. Example / 示例:

```
使用Obsidian写Markdown笔记，共3个文件
```

becomes / 变为

```
使用 Obsidian 写 Markdown 笔记，共 3 个文件
```

## Settings / 设置

Settings → Community plugins → Pangu CN / 设置 → 第三方插件 → Pangu CN:

| Option / 选项 | Default / 默认 | Description / 说明 |
| --- | --- | --- |
| Space between CJK and Latin / 中英文之间补空格 | on / 开 | core feature / 核心功能 |
| Half-width to full-width punctuation / 半角标点转全角 | off / 关 | aggressive, enable if needed / 较激进，按需开启 |
| Auto-format on paste / 粘贴时自动排版 | on / 开 | handy for web clippings / 从网页剪藏时很实用 |

## License

MIT
