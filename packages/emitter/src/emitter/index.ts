import type { Namespace } from "@typespec/compiler";
import ts from "typescript";

import type { Context } from "../context.js";
import { emitPaths } from "./http.js";
import { emitModel } from "./models.js";
import { emitOperations } from "./operations.js";

export function emitNamespace(context: Context, ns: Namespace): ts.ModuleDeclaration {
  const body = ts.factory.createModuleBlock(
    emitAll({
      ...context,
      namespace: ns,
    }),
  );

  return ts.factory.createModuleDeclaration(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    ts.factory.createIdentifier(ns.name),
    body,
  );
}

export function emitAll(context: Context): ts.Statement[] {
  const ns = context.namespace;
  return [
    ...[...ns.namespaces.values()].map((n) => emitNamespace(context, n)),
    ...[...ns.models.values()].map((m) => emitModel(context, m)).filter((t) => t != null),
    emitOperations(context, [...ns.operations.values()]),
    emitPaths(context, [...ns.operations.values()]),
  ];
}
