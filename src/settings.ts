import { App, PluginSettingTab, Setting } from "obsidian";
import ThoughtPartnerPlugin from "./main";

export class ThoughtPartnerSettingTab extends PluginSettingTab {
  plugin: ThoughtPartnerPlugin;

  constructor(app: App, plugin: ThoughtPartnerPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", {
      text: "Settings for Thought Partner",
    });
    new Setting(containerEl)
      .setName("OpenAI API Key")
      .setDesc("Set your OpenAI API Key. Go to https://beta.openai.com/")
      .addText((text) =>
        text
          .setPlaceholder("Enter your api_key")
          .setValue(this.plugin.settings.openai_api_key)
          .onChange(async (value) => {
            this.plugin.settings.openai_api_key = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("showStatusBar")
      .setDesc("Show information in the Status Bar")
      .addToggle((v) =>
        v.setValue(this.plugin.settings.showStatusBar).onChange(async (value) => {
          this.plugin.settings.showStatusBar = value;
          await this.plugin.saveSettings();
        })
      );
  }
}
