export interface NodePatchPayload {
  id: string;
  headcount?: number;
  budget?: number;
  performance?: number;
  updatedAt: string;
}

export interface WebSocketMessage {
  type: "NODE_PATCH";
  payload: NodePatchPayload;
}
