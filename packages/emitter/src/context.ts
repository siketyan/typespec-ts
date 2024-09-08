import type { EmitContext, Namespace } from "@typespec/compiler";

export interface Context {
  emitContext: EmitContext;
  namespace: Namespace;
}
