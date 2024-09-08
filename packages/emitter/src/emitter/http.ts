import type { Model, Operation } from "@typespec/compiler";
import {
  type HttpOperationParameters,
  type HttpOperationResponse,
  type HttpOperationResponseContent,
  type HttpStatusCodeRange,
  getOperationVerb,
  getRoutePath,
  isBodyRoot,
  isMetadata,
} from "@typespec/http";
import ts from "typescript";

import type { Context } from "../context.js";
import { emitModelProperty } from "./models.js";
import { emitType } from "./types.js";

function* enumerateStatusCodes(range: HttpStatusCodeRange): Generator<number> {
  const statusCodes = [
    100, 101, 102, 103, 200, 201, 202, 203, 204, 205, 206, 207, 300, 301, 302, 303, 304, 305, 307, 308, 400, 401, 401,
    403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 419, 420, 421, 422, 423, 424, 426,
    428, 429, 431, 451, 500, 501, 502, 503, 504, 505, 507, 511,
  ];

  const startIndex = statusCodes.indexOf(range.start);
  const endIndex = statusCodes.indexOf(range.end);
  if (startIndex < 0 || endIndex < 0) {
    return;
  }

  for (let i = startIndex; i < endIndex; i++) {
    yield statusCodes[i];
  }
}

function emitStatusCodeType(_context: Context, statusCodes: HttpStatusCodeRange | number | "*"): ts.TypeNode {
  if (statusCodes === "*") {
    return ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
  }

  if (typeof statusCodes === "number") {
    return ts.factory.createLiteralTypeNode(ts.factory.createNumericLiteral(statusCodes));
  }

  return ts.factory.createUnionTypeNode(
    [...enumerateStatusCodes(statusCodes)].map((statusCode) =>
      ts.factory.createLiteralTypeNode(ts.factory.createNumericLiteral(statusCode)),
    ),
  );
}

function emitResponseContentType(context: Context, content: HttpOperationResponseContent): ts.TypeNode {
  return ts.factory.createTypeLiteralNode([
    ...(content.headers
      ? [
          ts.factory.createPropertySignature(
            undefined,
            ts.factory.createIdentifier("$headers"),
            undefined,
            ts.factory.createTypeLiteralNode(
              Object.entries(content.headers).map(([name, property]) => emitModelProperty(context, property, name)),
            ),
          ),
        ]
      : []),
    ...(content.body
      ? [
          ts.factory.createPropertySignature(
            undefined,
            ts.factory.createIdentifier("$contentType"),
            undefined,
            ts.factory.createUnionTypeNode(
              content.body.contentTypes.map((contentType) =>
                ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(contentType)),
              ),
            ),
          ),
          ts.factory.createPropertySignature(
            undefined,
            ts.factory.createIdentifier("$body"),
            undefined,
            emitType(context, content.body.type),
          ),
        ]
      : []),
  ]);
}

export function emitResponse(context: Context, resp: HttpOperationResponse): ts.TypeNode {
  return ts.factory.createTypeLiteralNode([
    ts.factory.createPropertySignature(
      undefined,
      ts.factory.createIdentifier("$statusCode"),
      undefined,
      emitStatusCodeType(context, resp.statusCodes),
    ),
    ts.factory.createPropertySignature(
      undefined,
      ts.factory.createIdentifier("$content"),
      undefined,
      ts.factory.createUnionTypeNode(resp.responses.map((body) => emitResponseContentType(context, body))),
    ),
  ]);
}

export function isResponseModel(context: Context, model: Model): boolean {
  const program = context.emitContext.program;

  for (const property of model.properties.values()) {
    if (isMetadata(program, property) || isBodyRoot(program, property)) {
      return true;
    }
  }

  return false;
}

export function emitRequest(context: Context, req: HttpOperationParameters): ts.TypeNode {
  const headers = req.parameters.filter((p) => p.type === "header");
  const pathParams = req.parameters.filter((p) => p.type === "path");
  const queryParams = req.parameters.filter((p) => p.type === "query");

  return ts.factory.createTypeLiteralNode([
    ...(headers.length > 0
      ? [
          ts.factory.createPropertySignature(
            undefined,
            ts.factory.createIdentifier("$header"),
            undefined,
            ts.factory.createTypeLiteralNode(headers.map(({ name, param }) => emitModelProperty(context, param, name))),
          ),
        ]
      : []),
    ...(pathParams.length > 0
      ? [
          ts.factory.createPropertySignature(
            undefined,
            ts.factory.createIdentifier("$path"),
            undefined,
            ts.factory.createTypeLiteralNode(
              pathParams.map(({ name, param }) => emitModelProperty(context, param, name)),
            ),
          ),
        ]
      : []),
    ...(queryParams.length > 0
      ? [
          ts.factory.createPropertySignature(
            undefined,
            ts.factory.createIdentifier("$query"),
            undefined,
            ts.factory.createTypeLiteralNode(
              queryParams.map(({ name, param }) => emitModelProperty(context, param, name)),
            ),
          ),
        ]
      : []),
    ...(req.body
      ? [
          ts.factory.createPropertySignature(
            undefined,
            ts.factory.createIdentifier("$body"),
            undefined,
            emitType(context, req.body.type),
          ),
        ]
      : []),
  ]);
}

export function emitPaths(context: Context, operations: Operation[]) {
  const paths: Record<string, ts.PropertySignature[]> = {};
  for (const op of operations) {
    const routePath = getRoutePath(context.emitContext.program, op);
    if (!routePath) {
      continue;
    }

    const method = getOperationVerb(context.emitContext.program, op);
    if (!method) {
      continue;
    }

    const { path } = routePath;

    const decl = ts.factory.createPropertySignature(
      undefined,
      ts.factory.createIdentifier(method),
      undefined,
      ts.factory.createIndexedAccessTypeNode(
        ts.factory.createTypeReferenceNode("$operations"),
        ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(op.name)),
      ),
    );

    paths[path] = [...(paths[path] ?? []), decl];
  }

  return ts.factory.createInterfaceDeclaration(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    ts.factory.createIdentifier("$paths"),
    undefined,
    undefined,
    Object.entries(paths).map(([path, methods]) =>
      ts.factory.createPropertySignature(
        undefined,
        ts.factory.createStringLiteral(path),
        undefined,
        ts.factory.createTypeLiteralNode(methods),
      ),
    ),
  );
}
