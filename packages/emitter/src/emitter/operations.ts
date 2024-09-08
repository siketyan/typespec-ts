import { type DiagnosticResult, type Operation, createDiagnosticCollector } from "@typespec/compiler";
import { getOperationParameters, getResponsesForOperation } from "@typespec/http";
import ts from "typescript";

import type { Context } from "../context.js";
import { emitRequest, emitResponse } from "./http.js";

function emitOperation(context: Context, op: Operation): DiagnosticResult<ts.MethodSignature> {
  const diagnostics = createDiagnosticCollector();

  const params = diagnostics.pipe(getOperationParameters(context.emitContext.program, op, ""));
  const parameters = params
    ? [
        ts.factory.createParameterDeclaration(
          undefined,
          undefined,
          ts.factory.createIdentifier("params"),
          undefined,
          emitRequest(context, params),
          undefined,
        ),
      ]
    : [];

  const responses = diagnostics.pipe(getResponsesForOperation(context.emitContext.program, op));
  const returnType = ts.factory.createUnionTypeNode(responses.map((resp) => emitResponse(context, resp)));

  const method = ts.factory.createMethodSignature(
    undefined,
    ts.factory.createIdentifier(op.name),
    undefined,
    undefined,
    parameters,
    returnType,
  );

  return diagnostics.wrap(method);
}

export function emitOperations(context: Context, operations: Operation[]): ts.InterfaceDeclaration {
  const diagnostics = createDiagnosticCollector();

  const members: ts.MethodSignature[] = [];
  for (const op of operations) {
    members.push(diagnostics.pipe(emitOperation(context, op)));
  }

  return ts.factory.createInterfaceDeclaration(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    ts.factory.createIdentifier("$operations"),
    undefined,
    undefined,
    members,
  );
}
