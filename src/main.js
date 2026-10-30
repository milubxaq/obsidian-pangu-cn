'use strict';

const { Plugin, Notice, PluginSettingTab, Setting } = require('obsidian');
const { formatText } = require('./pangu');

const DEFAULT_SETTINGS = {
  enableSpacing: true,
  enablePunctuation: false,
  formatOnPaste: true,
};

module.exports = class PanguCnPlugin extends Plugin {
  async onload() {
    await this.loadSettings();

    this.addCommand({
      id: 'format-current-note',
      name: '格式化当前笔记',
      editorCallback: (editor) => this.formatEditor(editor, false),
    });

    this.addCommand({
      id: 'format-selection',
      name: '格式化选中内容',
      editorCallback: (editor) => this.formatEditor(editor, true),
    });

    this.addCommand({
      id: 'format-all-notes-in-folder',
      name: '格式化当前文件夹内所有笔记',
      callback: () => this.formatFolderNotes(),
    });

    this.registerEvent(
      this.app.workspace.on('editor-menu', (menu, editor) => {
        menu.addItem((item) =>
          item
            .setTitle('中文排版：格式化当前笔记')
            .setIcon('text-cursor')
            .onClick(() => this.formatEditor(editor, false))
        );
      })
    );

    this.registerEvent(
      this.app.workspace.on('editor-paste', (evt, editor) => {
        if (!this.settings.formatOnPaste) return;
        const clipboard = evt.clipboardData;
        if (!clipboard) return;
        const text = clipboard.getData('text/plain');
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
      punctuation: this.settings.enablePunctuation,
    };
  }

  formatEditor(editor, selectionOnly) {
    if (selectionOnly) {
      const selections = editor.listSelections();
      let changed = 0;
      // 从后往前替换，避免位置偏移
      const ranges = selections
        .map((sel) => ({
          from: editor.offsetToPos(Math.min(editor.posToOffset(sel.anchor), editor.posToOffset(sel.head))),
          to: editor.offsetToPos(Math.max(editor.posToOffset(sel.anchor), editor.posToOffset(sel.head))),
        }))
        .sort((a, b) => editor.posToOffset(b.from) - editor.posToOffset(a.from));

      for (const range of ranges) {
        if (editor.posToOffset(range.from) === editor.posToOffset(range.to)) continue;
        const original = editor.getRange(range.from, range.to);
        const formatted = formatText(original, this.options());
        if (formatted !== original) {
          editor.replaceRange(formatted, range.from, range.to);
          changed++;
        }
      }
      new Notice(changed ? `中文排版：已格式化 ${changed} 处选区` : '中文排版：选区无需修改');
      return;
    }

    const original = editor.getValue();
    const formatted = formatText(original, this.options());
    if (formatted === original) {
      new Notice('中文排版：无需修改');
      return;
    }
    const cursor = editor.getCursor();
    editor.setValue(formatted);
    editor.setCursor(cursor);
    new Notice('中文排版：已格式化当前笔记');
  }

  async formatFolderNotes() {
    const file = this.app.workspace.getActiveFile();
    if (!file) {
      new Notice('请先打开一个笔记');
      return;
    }
    const folder = file.parent;
    if (!folder) {
      new Notice('无法定位当前文件夹');
      return;
    }
    const files = folder.children.filter((f) => f.extension === 'md');
    let changed = 0;
    for (const f of files) {
      const content = await this.app.vault.read(f);
      const formatted = formatText(content, this.options());
      if (formatted !== content) {
        await this.app.vault.modify(f, formatted);
        changed++;
      }
    }
    new Notice(`中文排版：已处理 ${files.length} 个笔记，修改 ${changed} 个`);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
};

class PanguSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('中英文之间补空格')
      .setDesc('在中文与英文字母、阿拉伯数字之间插入空格')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enableSpacing).onChange(async (value) => {
          this.plugin.settings.enableSpacing = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('半角标点转全角')
      .setDesc('把中文语境中的 , . ! ? : ; 转换为全角标点，较激进')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enablePunctuation).onChange(async (value) => {
          this.plugin.settings.enablePunctuation = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('粘贴时自动排版')
      .setDesc('从网页复制内容粘贴进笔记时自动整理中英文空格')
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.formatOnPaste).onChange(async (value) => {
          this.plugin.settings.formatOnPaste = value;
          await this.plugin.saveSettings();
        })
      );
  }
};
