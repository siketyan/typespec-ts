import { type DecoratorContext, type Namespace, setTypeSpecNamespace } from "@typespec/compiler";

import { stateKeys } from "../lib.js";

/** @api */
export function $typescript(context: DecoratorContext, target: Namespace) {
  context.program.stateSet(stateKeys.typescript).add(target);
}

setTypeSpecNamespace("TypeSpecTS.Emitter", $typescript);
