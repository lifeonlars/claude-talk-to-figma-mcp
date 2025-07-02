import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { sendCommandToFigma } from "../utils/websocket";

/**
 * Register component-related tools to the MCP server
 * This module contains tools for working with components in Figma
 * @param server - The MCP server instance
 */
export function registerComponentTools(server: McpServer): void {
  // Create Component Instance Tool
  server.tool(
    "create_component_instance",
    "Create an instance of a component in Figma",
    {
      componentKey: z.string().describe("Key of the component to instantiate"),
      x: z.number().describe("X position"),
      y: z.number().describe("Y position"),
    },
    async ({ componentKey, x, y }) => {
      try {
        // Use 20-second timeout to accommodate the 15-second plugin timeout plus buffer
        const result = await sendCommandToFigma("create_component_instance", {
          componentKey,
          x,
          y,
        }, 20000);
        const typedResult = result as any;
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(typedResult),
            }
          ]
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error creating component instance: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );

  // Get Component Properties Tool
  server.tool(
    "get_component_properties",
    "Get the available variants and properties for a component",
    {
      componentKey: z.string().describe("Key of the component to analyze"),
    },
    async ({ componentKey }) => {
      try {
        const result = await sendCommandToFigma("get_component_properties", {
          componentKey,
        }, 15000);
        const typedResult = result as any;
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(typedResult, null, 2),
            }
          ]
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting component properties: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );

  // Set Component Variant Tool
  server.tool(
    "set_component_variant",
    "Change the variant of a component instance",
    {
      nodeId: z.string().describe("ID of the component instance to modify"),
      variants: z.record(z.string()).describe("Object mapping variant property names to their desired values (e.g., {size: 'large', state: 'hover'})"),
    },
    async ({ nodeId, variants }) => {
      try {
        const result = await sendCommandToFigma("set_component_variant", {
          nodeId,
          variants,
        }, 10000);
        const typedResult = result as any;
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(typedResult),
            }
          ]
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error setting component variant: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );

  // Get Component Variant Tool
  server.tool(
    "get_component_variant",
    "Get the current variant of a component instance",
    {
      nodeId: z.string().describe("ID of the component instance"),
    },
    async ({ nodeId }) => {
      try {
        const result = await sendCommandToFigma("get_component_variant", {
          nodeId,
        }, 5000);
        const typedResult = result as any;
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(typedResult, null, 2),
            }
          ]
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting component variant: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );

  // Set Component Property Tool
  server.tool(
    "set_component_property",
    "Set a property value on a component instance (e.g., text content, boolean properties)",
    {
      nodeId: z.string().describe("ID of the component instance"),
      propertyName: z.string().describe("Name of the property to set"),
      value: z.union([z.string(), z.number(), z.boolean()]).describe("Value to set for the property"),
    },
    async ({ nodeId, propertyName, value }) => {
      try {
        const result = await sendCommandToFigma("set_component_property", {
          nodeId,
          propertyName,
          value,
        }, 5000);
        const typedResult = result as any;
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(typedResult),
            }
          ]
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error setting component property: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );

  // Get Component Properties for Instance Tool
  server.tool(
    "get_component_properties_for_instance",
    "Get all current properties and overrides for a component instance",
    {
      nodeId: z.string().describe("ID of the component instance"),
    },
    async ({ nodeId }) => {
      try {
        const result = await sendCommandToFigma("get_component_properties_for_instance", {
          nodeId,
        }, 5000);
        const typedResult = result as any;
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(typedResult, null, 2),
            }
          ]
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting component properties for instance: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );

  // Search Components Tool
  server.tool(
    "search_components",
    "Search for components by name in the current document and imported libraries",
    {
      searchTerm: z.string().describe("Term to search for in component names"),
      limit: z.number().optional().describe("Maximum number of results to return (default: 50)"),
    },
    async ({ searchTerm, limit }) => {
      try {
        const result = await sendCommandToFigma("search_components", {
          searchTerm,
          limit,
        }, 10000);
        const typedResult = result as any;
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(typedResult, null, 2),
            }
          ]
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error searching components: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );

  // Team Library Analysis Tool
  server.tool(
    "get_team_library_analysis",
    "Analyze team library usage and discover available components through existing instances",
    {},
    async () => {
      try {
        const result = await sendCommandToFigma("get_team_library_analysis", {}, 15000);
        const typedResult = result as any;
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(typedResult, null, 2),
            }
          ]
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error analyzing team libraries: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    }
  );
}