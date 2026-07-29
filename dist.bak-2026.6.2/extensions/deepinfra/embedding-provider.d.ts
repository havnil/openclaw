import { o as MemoryEmbeddingProviderCreateOptions, s as MemoryEmbeddingProviderCreateResult } from "../../memory-embedding-providers-Dj8fzk10.js";
//#region extensions/deepinfra/embedding-provider.d.ts
declare const DEFAULT_DEEPINFRA_EMBEDDING_MODEL: "BAAI/bge-m3";
declare function createDeepInfraEmbeddingProvider(options: MemoryEmbeddingProviderCreateOptions & {
  defaultModel?: string;
}): Promise<MemoryEmbeddingProviderCreateResult & {
  client: {
    model: string;
  };
}>;
//#endregion
export { DEFAULT_DEEPINFRA_EMBEDDING_MODEL, createDeepInfraEmbeddingProvider };