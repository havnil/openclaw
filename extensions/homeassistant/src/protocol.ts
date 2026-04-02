// ── Client → Server ──────────────────────────────────────────────────────────

export type ClientMessage =
  | ClientChatMessage
  | ClientUploadMessage
  | ClientNewConversation
  | ClientLoadConversation
  | ClientDeleteConversation
  | ClientListConversations
  | ClientRenameConversation
  | ClientStopGenerating;

export interface ClientChatMessage {
  type: "message";
  text: string;
  conversation_id?: string;
}

export interface ClientUploadMessage {
  type: "upload";
  file_name: string;
  mime_type: string;
  data: string; // base64
  conversation_id?: string;
}

export interface ClientNewConversation {
  type: "new_conversation";
}

export interface ClientLoadConversation {
  type: "load_conversation";
  conversation_id: string;
}

export interface ClientDeleteConversation {
  type: "delete_conversation";
  conversation_id: string;
}

export interface ClientListConversations {
  type: "list_conversations";
}

export interface ClientRenameConversation {
  type: "rename_conversation";
  conversation_id: string;
  title: string;
}

export interface ClientStopGenerating {
  type: "stop_generating";
}

// ── Server → Client ──────────────────────────────────────────────────────────

export type ServerMessage =
  | ServerTokenMessage
  | ServerDoneMessage
  | ServerToolUseMessage
  | ServerToolResultMessage
  | ServerErrorMessage
  | ServerConversationsMessage
  | ServerConversationLoadedMessage
  | ServerConversationCreatedMessage
  | ServerConversationDeletedMessage
  | ServerConversationRenamedMessage
  | ServerPongMessage;

export interface ServerTokenMessage {
  type: "token";
  text: string;
}

export interface ServerDoneMessage {
  type: "done";
  full_text: string;
}

export interface ServerToolUseMessage {
  type: "tool_use";
  name: string;
  input: Record<string, unknown>;
}

export interface ServerToolResultMessage {
  type: "tool_result";
  name: string;
  output: string;
  is_error?: boolean;
}

export interface ServerErrorMessage {
  type: "error";
  message: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ServerConversationsMessage {
  type: "conversations";
  list: ConversationSummary[];
}

export interface StoredMessage {
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  tool_calls?: Array<{ name: string; input: Record<string, unknown>; output: string }>;
  attachments?: Array<{ file_name: string; mime_type: string }>;
}

export interface ServerConversationLoadedMessage {
  type: "conversation_loaded";
  id: string;
  title: string;
  messages: StoredMessage[];
}

export interface ServerConversationCreatedMessage {
  type: "conversation_created";
  id: string;
  title: string;
}

export interface ServerConversationDeletedMessage {
  type: "conversation_deleted";
  id: string;
}

export interface ServerConversationRenamedMessage {
  type: "conversation_renamed";
  id: string;
  title: string;
}

export interface ServerPongMessage {
  type: "pong";
}

// ── Shared ────────────────────────────────────────────────────────────────────

export interface HaUserIdentity {
  user_id: string;
  user_name: string;
  is_admin: boolean;
}
