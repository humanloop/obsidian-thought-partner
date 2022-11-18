import { addIcon, Editor, Events, MarkdownView, Notice, Plugin } from "obsidian";
import { generate, GenerateResponse } from "./humanloop";
import { ThoughtPartnerSettingTab } from "./settings";
import "./styles.css";
import { SidePane, SIDE_PANE_VIEW_TYPE } from "./view";

export enum GenerationEvents {
  Summarize = "GenerateSummarize",
  Critique = "GenerateCritique",
  Extend = "GenerateExtend",
  Proseify = "GenerateProseify",
  Suggest = "GenerateSuggestions",
}

interface ThoughtPartnerSettings {
  openai_api_key: string;
  humanloop_api_key: string;
  context: string;
  showStatusBar: boolean;
  max_tokens: number;
}

const DEFAULT_SETTINGS: ThoughtPartnerSettings = {
  openai_api_key: "",
  humanloop_api_key: "",
  context: "",
  showStatusBar: true,
  max_tokens: 256,
};

export default class ThoughtPartnerPlugin extends Plugin {
  settings: ThoughtPartnerSettings;
  statusBarItemEl: any;

  getActiveView() {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView !== null) {
      return activeView;
    } else {
      new Notice("The file type should be Markdown!");
      return null;
    }
  }

  insertGeneratedText(
    text: string,
    editor: Editor,
    location: "top" | "bottom" | "cursor" = "cursor"
  ) {
    if (location === "top") {
      editor.setCursor(0, 0);
      text += "\n\n";
    } else if (location === "bottom") {
      editor.setCursor(editor.lineCount(), 0);
      text = "\n\n" + text;
    }

    let cursor = editor.getCursor();
    // Insert at the end of any selection
    if (editor.listSelections().length > 0) {
      const anchor = editor.listSelections()[0].anchor;
      const head = editor.listSelections()[0].head;
      if (anchor.line > head.line || (anchor.line === head.line && anchor.ch > head.ch)) {
        cursor = editor.listSelections()[0].anchor;
      }
    }
    editor.replaceRange(text, cursor);
  }

  /*
	Prepare the request parameters
	*/
  prepareParameters(
    editor: Editor,
    settings: ThoughtPartnerSettings,
    project_name: string = "Extend",
    num_samples: number = 1
  ) {
    let bodyParams: any = {
      project: project_name,
      max_tokens: settings.max_tokens,
      num_samples: num_samples,
      inputs: { input: this.getContext(editor) },
      provider_api_keys: {
        OpenAI: settings.openai_api_key,
      },
    };
    console.log(bodyParams);
    return bodyParams;
  }

  async getGeneration(
    editor: Editor,
    settings: ThoughtPartnerSettings,
    project_name: string,
    num_samples: number = 1
  ): Promise<GenerateResponse> {
    const parameters = this.prepareParameters(editor, settings, project_name);
    try {
      return await generate(parameters);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // Returns the selection, or
  getContext(editor: Editor) {
    let selectedText = editor.getSelection();
    if (selectedText.length === 0) {
      selectedText = editor.getValue();
    }
    return selectedText;
  }

  updateStatusBar(text: string) {
    if (this.settings.showStatusBar) {
      this.statusBarItemEl.setText(`Thought Partner: ${text}`);
    }
  }

  async onload() {
    console.log("loading thought-partner plugin");
    addIcon(
      "thought-partner",
      `<svg viewBox="0 0 24 24"  stroke-width="1.5">
        <path d="M23.251,12a3,3,0,0,0-2.183-2.886,2.249,2.249,0,0,0-1.383-3.856,2.262,2.262,0,0,0-.412-.363,3,3,0,0,0-5.46-2.478,2.25,2.25,0,0,0-3.625,0,3,3,0,0,0-5.46,2.478,2.223,2.223,0,0,0-.411.363A2.25,2.25,0,0,0,2.933,9.114a3,3,0,0,0,0,5.773,2.249,2.249,0,0,0,1.384,3.855,2.29,2.29,0,0,0,.411.363,3,3,0,0,0,5.46,2.478,2.25,2.25,0,0,0,3.625,0,3,3,0,0,0,5.46-2.478,2.223,2.223,0,0,0,.411-.363,2.248,2.248,0,0,0,1.384-3.855A3,3,0,0,0,23.251,12Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M13.5,5.25,7.59,12.132a.375.375,0,0,0,.286.618H10.5v6l5.91-6.882a.375.375,0,0,0-.285-.618H13.5Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`
    );

    // TODO: Could trigger this to allow user to specify any instruction
    // this.addCommand({
    //   id: "edit",
    //   name: "Edit selection",
    //   editorCallback: (editor: Editor) => {
    //     const selectedText = editor.getSelection();
    //     const onSubmit = (text: string) => {
    //       editor.replaceSelection(text);
    //     };
    //     new EditTextModal(this.app, selectedText, onSubmit).open();
    //   },
    // });

    this.app.workspace.on("editor-menu", (menu) => {
      menu.addItem((item) =>
        item
          .setTitle("Summarise")
          .setIcon("zap")
          .onClick(() => {
            this.summarise(this.getEditor());
          })
      );
      menu.addItem((item) =>
        item
          .setTitle("Critique")
          .setIcon("zap")
          .onClick(() => {
            this.critique(this.getEditor());
          })
      );
      menu.addItem((item) =>
        item
          .setTitle("Prose-ify")
          .setIcon("zap")
          .onClick(() => {
            this.proseify(this.getEditor());
          })
      );
      menu.addItem((item) =>
        item
          .setTitle("Suggest improvements")
          .setIcon("zap")
          .onClick(() => {
            this.suggestions(this.getEditor());
          })
      );
    });
    this.registerView(SIDE_PANE_VIEW_TYPE, (leaf) => new SidePane(leaf, this.app, this));
    this.addRibbonIcon("thought-partner", "Open Thought Partner", (event) => {
      this.activateView();
    });
    this.registerEvent(Events);

    await this.loadSettings();

    this.statusBarItemEl = this.addStatusBarItem();

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new ThoughtPartnerSettingTab(this.app, this));

    this.addCommand({
      id: "open-view",
      name: "Open Thought Partner",
      icon: "zap ",
      editorCallback: async (editor: Editor) => {
        this.activateView();
      },
    });

    this.addCommand({
      id: "extend-text",
      name: "extend (continue writing)",
      icon: "zap",
      hotkeys: [{ modifiers: ["Ctrl"], key: "j" }],
      editorCallback: async (editor: Editor) => {
        this.continueWriting(editor);
      },
    });

    this.addCommand({
      id: "summarise",
      name: "summarise (tldr)",
      icon: "zap",
      hotkeys: [{ modifiers: ["Ctrl"], key: "t" }],
      editorCallback: async (editor: Editor) => {
        this.summarise(editor);
      },
    });

    this.addCommand({
      id: "critique",
      name: "critique",
      icon: "zap",
      hotkeys: [{ modifiers: ["Ctrl"], key: "q" }],
      editorCallback: async (editor: Editor) => {
        this.critique(editor);
      },
    });

    this.addCommand({
      id: "prose-ify",
      name: "prose-ify",
      icon: "zap",
      editorCallback: async (editor: Editor) => {
        this.proseify(editor);
      },
    });

    this.addCommand({
      id: "suggestions",
      name: "suggestions",
      icon: "zap",
      editorCallback: async (editor: Editor) => {
        this.suggestions(editor);
      },
    });
  }

  onunload() {
    this.app.workspace.detachLeavesOfType(SIDE_PANE_VIEW_TYPE);
  }

  getEditor() {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView) {
      return activeView.editor;
    }
    return null;
  }

  async continueWriting(editor: Editor) {
    this.updateStatusBar(`writing... `);
    try {
      new Notice("Generating...");
      const response = await this.getGeneration(editor, this.settings, "Extend");
      window.dispatchEvent(new CustomEvent(GenerationEvents.Extend, { detail: response }));
      this.insertGeneratedText(response.data[0]?.raw_output, editor);
      this.updateStatusBar(``);
    } catch (error) {
      new Notice("Thought Partner: Error check console CTRL+SHIFT+I");
      this.updateStatusBar(`Error check console`);
      setTimeout(() => this.updateStatusBar(``), 3000);
    }
  }
  async summarise(editor: Editor) {
    this.updateStatusBar(`Summarising... `);
    try {
      new Notice("Summarising...");
      const response = await this.getGeneration(editor, this.settings, "summarise");
      window.dispatchEvent(new CustomEvent(GenerationEvents.Summarize, { detail: response }));
      this.insertGeneratedText(response.data[0]?.raw_output, editor, "top");
      this.updateStatusBar(``);
    } catch (error) {
      new Notice("Thought Partner: Error check console CTRL+SHIFT+I");
      this.updateStatusBar(`Error check console`);
      setTimeout(() => this.updateStatusBar(``), 3000);
    }
  }

  async proseify(editor: Editor) {
    this.updateStatusBar(`Prose-ifying... `);
    try {
      new Notice("Converting into fluid prose...");
      const response = await this.getGeneration(editor, this.settings, "proseify");
      window.dispatchEvent(new CustomEvent(GenerationEvents.Proseify, { detail: response }));
      this.insertGeneratedText(response.data[0]?.raw_output, editor, "bottom");
      this.updateStatusBar(``);
    } catch (error) {
      new Notice("Thought Partner: Error check console CTRL+SHIFT+I");
      this.updateStatusBar(`Error check console`);
      setTimeout(() => this.updateStatusBar(``), 3000);
    }
  }

  async critique(editor: Editor) {
    this.updateStatusBar(`critiquing... `);
    try {
      new Notice("Hmmm... thinking...");
      this.makeSureViewIsOpen();
      const response = await this.getGeneration(editor, this.settings, "critique");
      window.dispatchEvent(new CustomEvent(GenerationEvents.Critique, { detail: response }));
      this.updateStatusBar(``);
    } catch (error) {
      new Notice("Thought Partner: Error check console CTRL+SHIFT+I");
      this.updateStatusBar(`Error check console`);
      setTimeout(() => this.updateStatusBar(``), 3000);
    }
  }
  async suggestions(editor: Editor) {
    this.updateStatusBar(`suggesting improvements... `);
    try {
      new Notice("Hmmm... thinking...");
      this.makeSureViewIsOpen();
      const response = await this.getGeneration(editor, this.settings, "suggestions");
      window.dispatchEvent(new CustomEvent(GenerationEvents.Suggest, { detail: response }));
      this.updateStatusBar(``);
    } catch (error) {
      new Notice("Thought Partner: Error check console CTRL+SHIFT+I");
      this.updateStatusBar(`Error check console`);
      setTimeout(() => this.updateStatusBar(``), 3000);
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
  async makeSureViewIsOpen() {
    const view = this.app.workspace.getLeavesOfType(SIDE_PANE_VIEW_TYPE)[0];
    if (!view) {
      await this.app.workspace.getRightLeaf(false).setViewState({
        type: SIDE_PANE_VIEW_TYPE,
        active: true,
      });
    }
  }

  async activateView() {
    this.app.workspace.detachLeavesOfType(SIDE_PANE_VIEW_TYPE);

    await this.app.workspace.getRightLeaf(false).setViewState({
      type: SIDE_PANE_VIEW_TYPE,
      active: true,
    });

    this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(SIDE_PANE_VIEW_TYPE)[0]);
  }
}
