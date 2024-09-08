import type { LiteralType, Scalar, Type, Union } from "@typespec/compiler";
import ts from "typescript";

import type { Context } from "../context.js";

function isLiteralType(type: Type): type is LiteralType {
  return type.kind === "String" || type.kind === "Number" || type.kind === "Boolean";
}

function emitLiteralType(_context: Context, type: LiteralType): ts.TypeNode {
  switch (type.kind) {
    case "String":
      return ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(type.value));

    case "Number":
      return ts.factory.createLiteralTypeNode(ts.factory.createNumericLiteral(type.value));

    case "Boolean":
      return ts.factory.createLiteralTypeNode(
        type.value
          ? ts.factory.createToken(ts.SyntaxKind.TrueKeyword)
          : ts.factory.createToken(ts.SyntaxKind.FalseKeyword),
      );
  }
}

function emitScalarType(context: Context, type: Scalar): ts.TypeNode {
  if (type.baseScalar) {
    return emitScalarType(context, type.baseScalar);
  }

  if (type.namespace?.name !== "TypeSpec") {
    throw new Error("Unsupported scalar type");
  }

  switch (type.name) {
    case "string":
      return ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);

    case "numeric":
      return ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);

    default:
      throw new Error(`Unsupported scalar type: ${type.name}`);
  }
}

function emitUnionType(context: Context, type: Union): ts.TypeNode {
  return ts.factory.createUnionTypeNode([...type.variants.values()].map((variant) => emitType(context, variant.type)));
}

export function emitType(context: Context, type: Type): ts.TypeNode {
  if (isLiteralType(type)) {
    return emitLiteralType(context, type);
  }

  if (type.kind === "Scalar") {
    return emitScalarType(context, type);
  }

  if (type.kind === "Union") {
    return emitUnionType(context, type);
  }

  if (type.kind === "Model") {
    return ts.factory.createTypeReferenceNode(type.name);
  }

  throw new Error(`Unsupported type: ${type.kind}`);
}
