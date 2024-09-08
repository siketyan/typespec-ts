import { createTypeSpecLibrary, definePackageFlags } from "@typespec/compiler";

/** @api */
export const $lib = createTypeSpecLibrary({
  name: "@typespec-ts/emitter",
  diagnostics: {},
  state: {
    typescript: {
      description: "State for the @typescript decorator",
    },
  },
} as const);

/** @api */
export const $flags = definePackageFlags({
  decoratorArgMarshalling: "new",
});

export const { reportDiagnostic, createDiagnostic, stateKeys } = $lib;
