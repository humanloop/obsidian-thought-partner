import { App, ItemView, WorkspaceLeaf } from "obsidian";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { ReactApp } from "./ReactApp";
import { createRoot } from "react-dom/client";
import { AppContext } from "./AppContext";
import ThoughtPartnerPlugin from "./main";

export const SIDE_PANE_VIEW_TYPE = "thought-partner-view";

export class SidePane extends ItemView {
  private plugin: ThoughtPartnerPlugin;

  constructor(leaf: WorkspaceLeaf, app: App, plugin: ThoughtPartnerPlugin) {
    super(leaf);
    this.app = app;
    this.plugin = plugin;
  }

  getViewType() {
    return SIDE_PANE_VIEW_TYPE;
  }

  getDisplayText() {
    return "Thought Partner";
  }

  getIcon(): string {
    return "thought-partner";
  }

  async onOpen() {
    const root = createRoot(this.containerEl.children[1]);
    root.render(
      <AppContext.Provider value={{ app: this.app, plugin: this.plugin }}>
        <ReactApp />
      </AppContext.Provider>
    );
  }

  async onClose() {
    ReactDOM.unmountComponentAtNode(this.containerEl.children[1]);
  }
}
