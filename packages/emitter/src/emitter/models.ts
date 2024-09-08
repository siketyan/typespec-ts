import { type Model, type ModelProperty, isArrayModelType } from "@typespec/compiler";
import ts from "typescript";

import type { Context } from "../context.js";
import { isResponseModel } from "./http.js";
import { emitType } from "./types.js";

export function emitModelProperty(context: Context, property: ModelProperty, name?: string): ts.PropertySignature {
  return ts.factory.createPropertySignature(
    undefined,
    ts.factory.createStringLiteral(name ?? property.name),
    property.optional ? ts.factory.createToken(ts.SyntaxKind.QuestionToken) : undefined,
    emitType(context, property.type),
  );
}

export function emitModel(
  context: Context,
  model: Model,
): ts.InterfaceDeclaration | ts.TypeAliasDeclaration | undefined {
  if (isResponseModel(context, model)) {
    return undefined;
  }

  for (const sourceModel of model.sourceModels) {
    if (sourceModel.usage === "is") {
      return ts.factory.createTypeAliasDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier(model.name),
        undefined,
        isArrayModelType(context.emitContext.program, sourceModel.model)
          ? ts.factory.createArrayTypeNode(
              ts.factory.createTypeReferenceNode((sourceModel.model.templateMapper?.args[0] as Model).name),
            )
          : ts.factory.createTypeReferenceNode(sourceModel.model.name),
      );
    }
  }

  let heritageClauses: ts.HeritageClause[] | undefined;
  if (model.baseModel) {
    heritageClauses = [
      ts.factory.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [
        ts.factory.createExpressionWithTypeArguments(ts.factory.createIdentifier(model.baseModel.name), undefined),
      ]),
    ];
  }

  const members = [...model.properties.values()].map((property) => emitModelProperty(context, property));

  return ts.factory.createInterfaceDeclaration(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    ts.factory.createIdentifier(model.name),
    undefined,
    heritageClauses,
    members,
  );
}
