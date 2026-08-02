const DEFAULT_NAME_PATTERN = "Service$"
const OBJECT_EXPRESSION_WRAPPERS = new Set([
  "TSAsExpression",
  "TSNonNullExpression",
  "TSSatisfiesExpression",
  "TSTypeAssertion",
])
const TYPE_ONLY_DECLARATIONS = new Set(["TSInterfaceDeclaration", "TSTypeAliasDeclaration"])

const onlyServiceExport = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Allow a single service object or class and type-only exports from service entry points",
    },
    schema: [
      {
        type: "object",
        properties: {
          namePattern: { type: "string" },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      duplicateService: "Only one service object or class may be exported",
      invalidExport:
        "Only a const service object or class matching the configured name pattern may be exported as a runtime value",
    },
  },

  create(context) {
    const [{ namePattern = DEFAULT_NAME_PATTERN } = {}] = context.options ?? []
    const serviceNamePattern = new RegExp(namePattern)
    let serviceExportNode = null

    function markServiceExport(node) {
      if (serviceExportNode) {
        context.report({ node, messageId: "duplicateService" })
        return
      }

      serviceExportNode = node
    }

    return {
      ExportAllDeclaration(node) {
        if (node.exportKind === "type") return

        context.report({ node, messageId: "invalidExport" })
      },

      ExportDefaultDeclaration(node) {
        context.report({ node, messageId: "invalidExport" })
      },

      ExportNamedDeclaration(node) {
        const declaration = node.declaration

        if (
          node.exportKind === "type" ||
          (declaration && TYPE_ONLY_DECLARATIONS.has(declaration.type))
        ) {
          return
        }

        if (!declaration) {
          for (const specifier of node.specifiers) {
            if (specifier.exportKind === "type") continue
            context.report({ node: specifier, messageId: "invalidExport" })
          }

          return
        }

        if (declaration.type === "ClassDeclaration") {
          const name = declaration.id?.name ?? ""

          if (!serviceNamePattern.test(name)) {
            context.report({ node: declaration, messageId: "invalidExport" })
            return
          }

          markServiceExport(declaration)
          return
        }

        if (declaration.type !== "VariableDeclaration" || declaration.kind !== "const") {
          context.report({ node: declaration, messageId: "invalidExport" })
          return
        }

        for (const declarator of declaration.declarations) {
          const name = declarator.id.type === "Identifier" ? declarator.id.name : ""
          let initializer = declarator.init

          while (initializer && OBJECT_EXPRESSION_WRAPPERS.has(initializer.type)) {
            initializer = initializer.expression
          }

          if (!serviceNamePattern.test(name) || initializer?.type !== "ObjectExpression") {
            context.report({ node: declarator, messageId: "invalidExport" })
            continue
          }

          markServiceExport(declarator)
        }
      },
    }
  },
}

export default onlyServiceExport
