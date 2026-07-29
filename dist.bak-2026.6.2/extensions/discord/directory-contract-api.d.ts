import { u as ChannelDirectoryEntry } from "../../types.core-CZRuyur5.js";
import { t as DirectoryConfigParams } from "../../directory-types-CXNXmhtY.js";
import { n as listDiscordDirectoryPeersFromConfig, t as listDiscordDirectoryGroupsFromConfig } from "../../directory-config-CiW7Ah5D.js";
//#region extensions/discord/directory-contract-api.d.ts
declare const discordDirectoryContractPlugin: {
  id: string;
  directory: {
    listPeers: (configParams: DirectoryConfigParams) => Promise<ChannelDirectoryEntry[]>;
    listGroups: (configParams: DirectoryConfigParams) => Promise<ChannelDirectoryEntry[]>;
  };
};
//#endregion
export { discordDirectoryContractPlugin, listDiscordDirectoryGroupsFromConfig, listDiscordDirectoryPeersFromConfig };