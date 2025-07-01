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
}