import { type EmitContext, type Namespace, emitFile, resolvePath } from "@typespec/compiler";
import ts from "typescript";

import { emitAll } from "./emitter/index.js";
import { stateKeys } from "./lib.js";

export * from "./decorator/index.js";
export { $lib } from "./lib.js";

/** @api */
export async function $onEmit(context: EmitContext) {
  const nodes = ts.factory.createNodeArray(
    [...context.program.stateSet(stateKeys.typescript).values()].flatMap((n) =>
      emitAll({
        emitContext: context,
        namespace: n as Namespace,
      }),
    ),
  );

  const sourceFile = ts.createSourceFile("output.d.ts", "", ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: false,
  });

  if (context.program.compilerOptions.noEmit) {
    return;
  }

  await emitFile(context.program, {
    path: resolvePath(context.emitterOutputDir, "output.d.ts"),
    content: printer.printList(ts.ListFormat.SourceFileStatements, nodes, sourceFile),
  });
}
