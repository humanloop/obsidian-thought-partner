import { App } from "obsidian";
import * as React from "react";
import ThoughtPartnerPlugin from "./main";

interface AppContextInterface {
  app: App;
  plugin: ThoughtPartnerPlugin;
}

export const AppContext = React.createContext<AppContextInterface | null>(null);

export const useObsidianApp = (): AppContextInterface | undefined => {
  const context = React.useContext(AppContext);
  if (context === undefined) {
    throw new Error("useObsidianApp must be used within a AppContextProvider");
  }
  return React.useContext(AppContext);
};
