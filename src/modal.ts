import { App, Modal, Setting } from "obsidian";

export class EditTextModal extends Modal {
  selection: string;
  instruction: string;
  completion: string;

  onSubmit: (text: string) => void;

  constructor(app: App, selection: string, onSubmit: (text: string) => void) {
    super(app);
    this.selection = selection;
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;

    contentEl.createEl("h1", { text: "Edit selection" });

    // Showing the selection for context
    contentEl.createEl("p", { text: this.selection });

    new Setting(contentEl).setName("Instruction").addText((text) =>
      text.setValue(this.instruction).onChange((value) => {
        this.instruction = value;
      })
    );
    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText("Go")
        .setCta()
        .onClick(() => {
          alert(this.instruction);
        })
    );

    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText("Insert")
        .setCta()
        .onClick(() => {
          this.close();
          this.onSubmit(this.completion);
        })
    );
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}
