const DEFAULT_SERVER_ALIAS = "@/server"
const DEFAULT_SERVER_DIRECTORY = "server"

const noServerDeepImports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require consumers outside a server module to import from its public entry point",
    },
    schema: [
      {
        type: "object",
        properties: {
          modules: {
            type: "array",
            items: { type: "string" },
            uniqueItems: true,
          },
          serverAlias: { type: "string" },
          serverDirectory: { type: "string" },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      deepImport: "Import from '{{publicEntry}}' instead of the private module '{{source}}'",
    },
  },

  create(context) {
    const [options = {}] = context.options ?? []
    const moduleNames = new Set(options.modules ?? [])
    const serverAlias = (options.serverAlias ?? DEFAULT_SERVER_ALIAS).replace(/\/+$/, "")
    const serverDirectory = (options.serverDirectory ?? DEFAULT_SERVER_DIRECTORY).replace(
      /^\/+|\/+$/g,
      "",
    )
    const filename = (context.filename ?? context.getFilename?.() ?? "").replaceAll("\\", "/")

    const checkSource = (node, sourceNode) => {
      const source = typeof sourceNode?.value === "string" ? sourceNode.value : null

      if (!source?.startsWith(`${serverAlias}/`)) return

      const [moduleName, ...privatePath] = source.slice(serverAlias.length + 1).split("/")

      if (!moduleName || privatePath.length === 0) return
      if (moduleNames.size > 0 && !moduleNames.has(moduleName)) return
      if (filename.includes(`/${serverDirectory}/${moduleName}/`)) return

      context.report({
        node,
        messageId: "deepImport",
        data: {
          publicEntry: `${serverAlias}/${moduleName}`,
          source,
        },
      })
    }

    return {
      ExportAllDeclaration(node) {
        checkSource(node, node.source)
      },

      ExportNamedDeclaration(node) {
        if (node.source) checkSource(node, node.source)
      },

      ImportDeclaration(node) {
        checkSource(node, node.source)
      },

      ImportExpression(node) {
        checkSource(node, node.source)
      },

      TSImportType(node) {
        checkSource(node, node.argument)
      },
    }
  },
}

export default noServerDeepImports
