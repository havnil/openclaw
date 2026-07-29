import { i as OpenClawConfig } from "./types.openclaw-20mzwaMw.js";
import { i as MemoryEmbeddingProviderAdapter } from "./memory-embedding-providers-Dj8fzk10.js";

//#region src/plugins/memory-embedding-provider-runtime.d.ts
/** Lists registered memory embedding provider adapters without registry metadata. */
declare function listRegisteredMemoryEmbeddingProviderAdapters(): MemoryEmbeddingProviderAdapter[];
/** Lists memory embedding providers from runtime config and registered adapters. */
declare function listMemoryEmbeddingProviders(cfg?: OpenClawConfig): MemoryEmbeddingProviderAdapter[];
/** Resolves one memory embedding provider by id, alias, or configured API owner. */
declare function getMemoryEmbeddingProvider(id: string, cfg?: OpenClawConfig): MemoryEmbeddingProviderAdapter | undefined;
//#endregion
export { listMemoryEmbeddingProviders as n, listRegisteredMemoryEmbeddingProviderAdapters as r, getMemoryEmbeddingProvider as t };