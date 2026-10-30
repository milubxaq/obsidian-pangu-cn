"use strict";
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// src/pangu.js
var require_pangu = __commonJS({
  "src/pangu.js"(exports2, module2) {
    "use strict";
    var CJK = "\\u3400-\\u4DBF\\u4E00-\\u9FFF\\uF900-\\uFAFF";
    var CJK_PUNCT_END = "\\u3001\\u3002\\uFF0C\\uFF01\\uFF1F\\uFF1B\\uFF1A\\uFF09\\u300B\\u300D\\u300F\\u3011\\u2026";
    var CJK_PUNCT_START = "\\uFF08\\u300A\\u300C\\u300E\\u3010";
    var PH_OPEN = "\uE000";
    var PH_CLOSE = "\uE001";
    function protectSegments(line) {
      const protectedParts = [];
      const put = (raw) => {
        const token = PH_OPEN + protectedParts.length + PH_CLOSE;
        protectedParts.push(raw);
        return token;
      };
      let s = line;
      s = s.replace(/`[^`\n]*`/g, put);
      s = s.replace(/https?:\/\/[^\s<>()[\]]+/g, put);
      s = s.replace(/<\/?[A-Za-z][^>\n]*>/g, put);
      s = s.replace(/\[[^\]]*\]\([^)\n]*\)/g, (m) => {
        const idx = m.lastIndexOf("](");
        const label = m.slice(0, idx + 2);
        const target = m.slice(idx + 2);
        return label + put(target);
      });
      s = s.replace(/\[\[[^\]\n]+\]\]/g, put);
      s = s.replace(/^(\s*\[[^\]]+\]:\s*)(\S+)/, (_, head, url) => head + put(url));
      return { text: s, parts: protectedParts };
    }
    function restoreSegments(text, parts) {
      const re = new RegExp(PH_OPEN + "(\\d+)" + PH_CLOSE, "g");
      let s = text;
      for (let i = 0; i < 5 && re.test(s); i++) {
        re.lastIndex = 0;
        s = s.replace(re, (_, idx) => parts[Number(idx)]);
      }
      return s;
    }
    function applySpacing(text) {
      let s = text;
      for (let i = 0; i < 2; i++) {
        s = s.replace(new RegExp(`([${CJK}])([A-Za-z0-9])`, "g"), "$1 $2");
        s = s.replace(new RegExp(`([A-Za-z0-9])([${CJK}])`, "g"), "$1 $2");
      }
      s = s.replace(new RegExp(`([${CJK}])(` + PH_OPEN + ")", "g"), "$1 $2");
      s = s.replace(new RegExp("(" + PH_CLOSE + `)([${CJK}])`, "g"), "$1 $2");
      s = s.replace(new RegExp(`([${CJK}])\\s+([${CJK_PUNCT_END}])`, "g"), "$1$2");
      s = s.replace(new RegExp(`([${CJK_PUNCT_START}])\\s+([${CJK}])`, "g"), "$1$2");
      return s;
    }
    function applyPunctuation(text) {
      return text.replace(new RegExp(`([${CJK}])\\s*,\\s*([${CJK}])`, "g"), "$1\uFF0C$2").replace(new RegExp(`([${CJK}])\\s*;\\s*([${CJK}])`, "g"), "$1\uFF1B$2").replace(new RegExp(`([${CJK}])\\s*:\\s*([${CJK}])`, "g"), "$1\uFF1A$2").replace(new RegExp(`([${CJK}])\\s*\\?\\s*([${CJK}])`, "g"), "$1\uFF1F$2").replace(new RegExp(`([${CJK}])\\s*!\\s*([${CJK}])`, "g"), "$1\uFF01$2").replace(new RegExp(`([${CJK}])\\s*\\.\\s*([${CJK}])`, "g"), "$1\u3002$2");
    }
    function formatLine(line, options) {
      const { spacing = true, punctuation = false } = options || {};
      if (!line) return line;
      if (/^(?:\t| {4,})\S/.test(line)) return line;
      const { text, parts } = protectSegments(line);
      let s = text;
      if (spacing) s = applySpacing(s);
      if (punctuation) s = applyPunctuation(s);
      return restoreSegments(s, parts);
    }
    function formatText2(text, options) {
      if (!text) return text;
      const lines = text.split("\n");
      let inFence = false;
      const result = lines.map((line) => {
        if (/^\s*(?:```|~~~)/.test(line)) {
          inFence = !inFence;
          return line;
        }
        if (inFence) return line;
        return formatLine(line, options);
      });
      return result.join("\n");
    }
    module2.exports = { formatText: formatText2, formatLine };
  }
});

// src/main.js
var { Plugin, Notice, PluginSettingTab, Setting } = require("obsidian");
var { formatText } = require_pangu();
var DEFAULT_SETTINGS = {
  enableSpacing: true,
  enablePunctuation: false,
  formatOnPaste: true
};
module.exports = class PanguCnPlugin extends Plugin {
  async onload() {
    await this.loadSettings();
    this.addCommand({
      id: "format-current-note",
      name: "\u683C\u5F0F\u5316\u5F53\u524D\u7B14\u8BB0",
      editorCallback: (editor) => this.formatEditor(editor, false)
    });
    this.addCommand({
      id: "format-selection",
      name: "\u683C\u5F0F\u5316\u9009\u4E2D\u5185\u5BB9",
      editorCallback: (editor) => this.formatEditor(editor, true)
    });
    this.addCommand({
      id: "format-all-notes-in-folder",
      name: "\u683C\u5F0F\u5316\u5F53\u524D\u6587\u4EF6\u5939\u5185\u6240\u6709\u7B14\u8BB0",
      callback: () => this.formatFolderNotes()
    });
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor) => {
        menu.addItem(
          (item) => item.setTitle("\u4E2D\u6587\u6392\u7248\uFF1A\u683C\u5F0F\u5316\u5F53\u524D\u7B14\u8BB0").setIcon("text-cursor").onClick(() => this.formatEditor(editor, false))
        );
      })
    );
    this.registerEvent(
      this.app.workspace.on("editor-paste", (evt, editor) => {
        if (!this.settings.formatOnPaste) return;
        const clipboard = evt.clipboardData;
        if (!clipboard) return;
        const text = clipboard.getData("text/plain");
        if (!text || !text.trim()) return;
        const formatted = formatText(text, this.options());
        if (formatted === text) return;
        evt.preventDefault();
        editor.replaceSelection(formatted);
      })
    );
    this.addSettingTab(new PanguSettingTab(this.app, this));
  }
  options() {
    return {
      spacing: this.settings.enableSpacing,
      punctuation: this.settings.enablePunctuation
    };
  }
  formatEditor(editor, selectionOnly) {
    if (selectionOnly) {
      const selections = editor.listSelections();
      let changed = 0;
      const ranges = selections.map((sel) => ({
        from: editor.offsetToPos(Math.min(editor.posToOffset(sel.anchor), editor.posToOffset(sel.head))),
        to: editor.offsetToPos(Math.max(editor.posToOffset(sel.anchor), editor.posToOffset(sel.head)))
      })).sort((a, b) => editor.posToOffset(b.from) - editor.posToOffset(a.from));
      for (const range of ranges) {
        if (editor.posToOffset(range.from) === editor.posToOffset(range.to)) continue;
        const original2 = editor.getRange(range.from, range.to);
        const formatted2 = formatText(original2, this.options());
        if (formatted2 !== original2) {
          editor.replaceRange(formatted2, range.from, range.to);
          changed++;
        }
      }
      new Notice(changed ? `\u4E2D\u6587\u6392\u7248\uFF1A\u5DF2\u683C\u5F0F\u5316 ${changed} \u5904\u9009\u533A` : "\u4E2D\u6587\u6392\u7248\uFF1A\u9009\u533A\u65E0\u9700\u4FEE\u6539");
      return;
    }
    const original = editor.getValue();
    const formatted = formatText(original, this.options());
    if (formatted === original) {
      new Notice("\u4E2D\u6587\u6392\u7248\uFF1A\u65E0\u9700\u4FEE\u6539");
      return;
    }
    const cursor = editor.getCursor();
    editor.setValue(formatted);
    editor.setCursor(cursor);
    new Notice("\u4E2D\u6587\u6392\u7248\uFF1A\u5DF2\u683C\u5F0F\u5316\u5F53\u524D\u7B14\u8BB0");
  }
  async formatFolderNotes() {
    const file = this.app.workspace.getActiveFile();
    if (!file) {
      new Notice("\u8BF7\u5148\u6253\u5F00\u4E00\u4E2A\u7B14\u8BB0");
      return;
    }
    const folder = file.parent;
    if (!folder) {
      new Notice("\u65E0\u6CD5\u5B9A\u4F4D\u5F53\u524D\u6587\u4EF6\u5939");
      return;
    }
    const files = folder.children.filter((f) => f.extension === "md");
    let changed = 0;
    for (const f of files) {
      const content = await this.app.vault.read(f);
      const formatted = formatText(content, this.options());
      if (formatted !== content) {
        await this.app.vault.modify(f, formatted);
        changed++;
      }
    }
    new Notice(`\u4E2D\u6587\u6392\u7248\uFF1A\u5DF2\u5904\u7406 ${files.length} \u4E2A\u7B14\u8BB0\uFF0C\u4FEE\u6539 ${changed} \u4E2A`);
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
var PanguSettingTab = class extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new Setting(containerEl).setName("\u4E2D\u82F1\u6587\u4E4B\u95F4\u8865\u7A7A\u683C").setDesc("\u5728\u4E2D\u6587\u4E0E\u82F1\u6587\u5B57\u6BCD\u3001\u963F\u62C9\u4F2F\u6570\u5B57\u4E4B\u95F4\u63D2\u5165\u7A7A\u683C").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.enableSpacing).onChange(async (value) => {
        this.plugin.settings.enableSpacing = value;
        await this.plugin.saveSettings();
      })
    );
    new Setting(containerEl).setName("\u534A\u89D2\u6807\u70B9\u8F6C\u5168\u89D2").setDesc("\u628A\u4E2D\u6587\u8BED\u5883\u4E2D\u7684 , . ! ? : ; \u8F6C\u6362\u4E3A\u5168\u89D2\u6807\u70B9\uFF0C\u8F83\u6FC0\u8FDB").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.enablePunctuation).onChange(async (value) => {
        this.plugin.settings.enablePunctuation = value;
        await this.plugin.saveSettings();
      })
    );
    new Setting(containerEl).setName("\u7C98\u8D34\u65F6\u81EA\u52A8\u6392\u7248").setDesc("\u4ECE\u7F51\u9875\u590D\u5236\u5185\u5BB9\u7C98\u8D34\u8FDB\u7B14\u8BB0\u65F6\u81EA\u52A8\u6574\u7406\u4E2D\u82F1\u6587\u7A7A\u683C").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.formatOnPaste).onChange(async (value) => {
        this.plugin.settings.formatOnPaste = value;
        await this.plugin.saveSettings();
      })
    );
  }
};
