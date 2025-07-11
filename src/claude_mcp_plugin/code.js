// This is the main code file for the Claude MCP Figma plugin
// It handles Figma API commands

// Plugin state
const state = {
  serverPort: 3055, // Default port
};

// Helper function for progress updates
function sendProgressUpdate(
  commandId,
  commandType,
  status,
  progress,
  totalItems,
  processedItems,
  message,
  payload = null
) {
  const update = {
    type: 'command_progress',
    commandId,
    commandType,
    status,
    progress,
    totalItems,
    processedItems,
    message,
    timestamp: Date.now(),
  };

  // Add optional chunk information if present
  if (payload) {
    if (payload.currentChunk !== undefined && payload.totalChunks !== undefined) {
      update.currentChunk = payload.currentChunk;
      update.totalChunks = payload.totalChunks;
      update.chunkSize = payload.chunkSize;
    }
    update.payload = payload;
  }

  // Send to UI
  figma.ui.postMessage(update);
  console.log(`Progress update: ${status} - ${progress}% - ${message}`);

  return update;
}

// Show UI
figma.showUI(__html__, { width: 350, height: 450 });

// Plugin commands from UI
figma.ui.onmessage = async (msg) => {
  switch (msg.type) {
    case 'update-settings':
      updateSettings(msg);
      break;
    case 'notify':
      figma.notify(msg.message);
      break;
    case 'close-plugin':
      figma.closePlugin();
      break;
    case 'execute-command':
      // Execute commands received from UI (which gets them from WebSocket)
      try {
        const result = await handleCommand(msg.command, msg.params);
        // Send result back to UI
        figma.ui.postMessage({
          type: 'command-result',
          id: msg.id,
          result,
        });
      } catch (error) {
        figma.ui.postMessage({
          type: 'command-error',
          id: msg.id,
          error: error.message || 'Error executing command',
        });
      }
      break;
  }
};

// Listen for plugin commands from menu
figma.on('run', ({ command }) => {
  figma.ui.postMessage({ type: 'auto-connect' });
});

// Update plugin settings
function updateSettings(settings) {
  if (settings.serverPort) {
    state.serverPort = settings.serverPort;
  }

  figma.clientStorage.setAsync('settings', {
    serverPort: state.serverPort,
  });
}

// Handle commands from UI
async function handleCommand(command, params) {
  switch (command) {
    case 'get_document_info':
      return await getDocumentInfo();
    case 'get_selection':
      return await getSelection();
    case 'get_node_info':
      if (!params || !params.nodeId) {
        throw new Error('Missing nodeId parameter');
      }
      return await getNodeInfo(params.nodeId);
    case 'get_nodes_info':
      if (!params || !params.nodeIds || !Array.isArray(params.nodeIds)) {
        throw new Error('Missing or invalid nodeIds parameter');
      }
      return await getNodesInfo(params.nodeIds);
    case 'create_rectangle':
      return await createRectangle(params);
    case 'create_frame':
      return await createFrame(params);
    case 'create_text':
      return await createText(params);
    case 'set_fill_color':
      return await setFillColor(params);
    case 'set_stroke_color':
      return await setStrokeColor(params);
    case 'move_node':
      return await moveNode(params);
    case 'resize_node':
      return await resizeNode(params);
    case 'delete_node':
      return await deleteNode(params);
    case 'get_styles':
      return await getStyles();
    case 'get_local_components':
      return await getLocalComponents();
    // case "get_team_components":
    //   return await getTeamComponents();
    case 'create_component_instance':
      return await createComponentInstance(params);
    case 'get_component_properties':
      return await getComponentProperties(params);
    case 'set_component_variant':
      return await setComponentVariant(params);
    case 'get_component_variant':
      return await getComponentVariant(params);
    case 'set_component_property':
      return await setComponentProperty(params);
    case 'get_component_properties_for_instance':
      return await getComponentPropertiesForInstance(params);
    case 'search_components':
      return await searchComponents(params);
    case 'export_node_as_image':
      return await exportNodeAsImage(params);
    case 'set_corner_radius':
      return await setCornerRadius(params);
    case 'set_text_content':
      return await setTextContent(params);
    case 'clone_node':
      return await cloneNode(params);
    case 'set_text_style_id':
      return await setTextStyleId(params);
    case 'set_fill_style_id':
      return await setFillStyleId(params);
    case 'scan_text_nodes':
      return await scanTextNodes(params);
    case 'set_multiple_text_contents':
      return await setMultipleTextContents(params);
    case 'set_auto_layout':
      return await setAutoLayout(params);
    // Nuevos comandos para propiedades de texto
    case 'set_font_name':
      return await setFontName(params);
    case 'set_font_size':
      return await setFontSize(params);
    case 'set_font_weight':
      return await setFontWeight(params);
    case 'set_letter_spacing':
      return await setLetterSpacing(params);
    case 'set_line_height':
      return await setLineHeight(params);
    case 'set_paragraph_spacing':
      return await setParagraphSpacing(params);
    case 'set_text_case':
      return await setTextCase(params);
    case 'set_text_decoration':
      return await setTextDecoration(params);
    case 'get_styled_text_segments':
      return await getStyledTextSegments(params);
    case 'load_font_async':
      return await loadFontAsyncWrapper(params);
    case 'get_remote_components':
      return await getRemoteComponents(params);
    case 'get_team_library_analysis':
      return await getTeamLibraryAnalysis(params);
    case 'set_effects':
      return await setEffects(params);
    case 'set_effect_style_id':
      return await setEffectStyleId(params);
    case 'group_nodes':
      return await groupNodes(params);
    case 'ungroup_nodes':
      return await ungroupNodes(params);
    case 'flatten_node':
      return await flattenNode(params);
    case 'insert_child':
      return await insertChild(params);
    case 'create_ellipse':
      return await createEllipse(params);
    case 'create_polygon':
      return await createPolygon(params);
    case 'create_star':
      return await createStar(params);
    case 'create_vector':
      return await createVector(params);
    case 'create_line':
      return await createLine(params);
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

// Command implementations

async function getDocumentInfo() {
  await figma.currentPage.loadAsync();
  const page = figma.currentPage;
  return {
    name: page.name,
    id: page.id,
    type: page.type,
    children: page.children.map((node) => ({
      id: node.id,
      name: node.name,
      type: node.type,
    })),
    currentPage: {
      id: page.id,
      name: page.name,
      childCount: page.children.length,
    },
    pages: [
      {
        id: page.id,
        name: page.name,
        childCount: page.children.length,
      },
    ],
  };
}

async function getSelection() {
  return {
    selectionCount: figma.currentPage.selection.length,
    selection: figma.currentPage.selection.map((node) => ({
      id: node.id,
      name: node.name,
      type: node.type,
      visible: node.visible,
    })),
  };
}

async function getNodeInfo(nodeId) {
  const node = await figma.getNodeByIdAsync(nodeId);

  if (!node) {
    throw new Error(`Node not found with ID: ${nodeId}`);
  }

  const response = await node.exportAsync({
    format: 'JSON_REST_V1',
  });

  return response.document;
}

async function getNodesInfo(nodeIds) {
  try {
    // Load all nodes in parallel
    const nodes = await Promise.all(nodeIds.map((id) => figma.getNodeByIdAsync(id)));

    // Filter out any null values (nodes that weren't found)
    const validNodes = nodes.filter((node) => node !== null);

    // Export all valid nodes in parallel
    const responses = await Promise.all(
      validNodes.map(async (node) => {
        const response = await node.exportAsync({
          format: 'JSON_REST_V1',
        });
        return {
          nodeId: node.id,
          document: response.document,
        };
      })
    );

    return responses;
  } catch (error) {
    throw new Error(`Error getting nodes info: ${error.message}`);
  }
}

async function createRectangle(params) {
  const {
    x = 0,
    y = 0,
    width = 100,
    height = 100,
    name = 'Rectangle',
    parentId,
  } = params || {};

  const rect = figma.createRectangle();
  rect.x = x;
  rect.y = y;
  rect.resize(width, height);
  rect.name = name;

  // If parentId is provided, append to that node, otherwise append to current page
  if (parentId) {
    const parentNode = await figma.getNodeByIdAsync(parentId);
    if (!parentNode) {
      throw new Error(`Parent node not found with ID: ${parentId}`);
    }
    if (!('appendChild' in parentNode)) {
      throw new Error(`Parent node does not support children: ${parentId}`);
    }
    parentNode.appendChild(rect);
  } else {
    figma.currentPage.appendChild(rect);
  }

  return {
    id: rect.id,
    name: rect.name,
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    parentId: rect.parent ? rect.parent.id : undefined,
  };
}

async function createFrame(params) {
  const {
    x = 0,
    y = 0,
    width = 100,
    height = 100,
    name = 'Frame',
    parentId,
    fillColor,
    strokeColor,
    strokeWeight,
  } = params || {};

  const frame = figma.createFrame();
  frame.x = x;
  frame.y = y;
  frame.resize(width, height);
  frame.name = name;

  // Set fill color if provided
  if (fillColor) {
    const paintStyle = {
      type: 'SOLID',
      color: {
        r: parseFloat(fillColor.r) || 0,
        g: parseFloat(fillColor.g) || 0,
        b: parseFloat(fillColor.b) || 0,
      },
      opacity: parseFloat(fillColor.a) || 1,
    };
    frame.fills = [paintStyle];
  }

  // Set stroke color and weight if provided
  if (strokeColor) {
    const strokeStyle = {
      type: 'SOLID',
      color: {
        r: parseFloat(strokeColor.r) || 0,
        g: parseFloat(strokeColor.g) || 0,
        b: parseFloat(strokeColor.b) || 0,
      },
      opacity: parseFloat(strokeColor.a) || 1,
    };
    frame.strokes = [strokeStyle];
  }

  // Set stroke weight if provided
  if (strokeWeight !== undefined) {
    frame.strokeWeight = strokeWeight;
  }

  // If parentId is provided, append to that node, otherwise append to current page
  if (parentId) {
    const parentNode = await figma.getNodeByIdAsync(parentId);
    if (!parentNode) {
      throw new Error(`Parent node not found with ID: ${parentId}`);
    }
    if (!('appendChild' in parentNode)) {
      throw new Error(`Parent node does not support children: ${parentId}`);
    }
    parentNode.appendChild(frame);
  } else {
    figma.currentPage.appendChild(frame);
  }

  return {
    id: frame.id,
    name: frame.name,
    x: frame.x,
    y: frame.y,
    width: frame.width,
    height: frame.height,
    fills: frame.fills,
    strokes: frame.strokes,
    strokeWeight: frame.strokeWeight,
    parentId: frame.parent ? frame.parent.id : undefined,
  };
}

async function createText(params) {
  const {
    x = 0,
    y = 0,
    text = 'Text',
    fontSize = 14,
    fontWeight = 400,
    fontColor = { r: 0, g: 0, b: 0, a: 1 }, // Default to black
    name = 'Text',
    parentId,
  } = params || {};

  // Map common font weights to Figma font styles
  const getFontStyle = (weight) => {
    switch (weight) {
      case 100:
        return 'Thin';
      case 200:
        return 'Extra Light';
      case 300:
        return 'Light';
      case 400:
        return 'Regular';
      case 500:
        return 'Medium';
      case 600:
        return 'Semi Bold';
      case 700:
        return 'Bold';
      case 800:
        return 'Extra Bold';
      case 900:
        return 'Black';
      default:
        return 'Regular';
    }
  };

  const textNode = figma.createText();
  textNode.x = x;
  textNode.y = y;
  textNode.name = name;
  try {
    await figma.loadFontAsync({
      family: 'Inter',
      style: getFontStyle(fontWeight),
    });
    textNode.fontName = { family: 'Inter', style: getFontStyle(fontWeight) };
    textNode.fontSize = parseInt(fontSize);
  } catch (error) {
    console.error('Error setting font size', error);
  }
  setCharacters(textNode, text);

  // Set text color
  const paintStyle = {
    type: 'SOLID',
    color: {
      r: parseFloat(fontColor.r) || 0,
      g: parseFloat(fontColor.g) || 0,
      b: parseFloat(fontColor.b) || 0,
    },
    opacity: parseFloat(fontColor.a) || 1,
  };
  textNode.fills = [paintStyle];

  // If parentId is provided, append to that node, otherwise append to current page
  if (parentId) {
    const parentNode = await figma.getNodeByIdAsync(parentId);
    if (!parentNode) {
      throw new Error(`Parent node not found with ID: ${parentId}`);
    }
    if (!('appendChild' in parentNode)) {
      throw new Error(`Parent node does not support children: ${parentId}`);
    }
    parentNode.appendChild(textNode);
  } else {
    figma.currentPage.appendChild(textNode);
  }

  return {
    id: textNode.id,
    name: textNode.name,
    x: textNode.x,
    y: textNode.y,
    width: textNode.width,
    height: textNode.height,
    characters: textNode.characters,
    fontSize: textNode.fontSize,
    fontWeight: fontWeight,
    fontColor: fontColor,
    fontName: textNode.fontName,
    fills: textNode.fills,
    parentId: textNode.parent ? textNode.parent.id : undefined,
  };
}

async function setFillColor(params) {
  console.log('setFillColor', params);
  const {
    nodeId,
    color: { r, g, b, a },
  } = params || {};

  if (!nodeId) {
    throw new Error('Missing nodeId parameter');
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) {
    throw new Error(`Node not found with ID: ${nodeId}`);
  }

  if (!('fills' in node)) {
    throw new Error(`Node does not support fills: ${nodeId}`);
  }

  // Validate that MCP layer provided complete data
  if (r === undefined || g === undefined || b === undefined || a === undefined) {
    throw new Error(
      'Incomplete color data received from MCP layer. All RGBA components must be provided.'
    );
  }

  // Parse values - no defaults, just format conversion
  const rgbColor = {
    r: parseFloat(r),
    g: parseFloat(g),
    b: parseFloat(b),
    a: parseFloat(a),
  };

  // Validate parsing succeeded
  if (isNaN(rgbColor.r) || isNaN(rgbColor.g) || isNaN(rgbColor.b) || isNaN(rgbColor.a)) {
    throw new Error('Invalid color values received - all components must be valid numbers');
  }

  // Set fill - pure translation to Figma API format
  const paintStyle = {
    type: 'SOLID',
    color: {
      r: rgbColor.r,
      g: rgbColor.g,
      b: rgbColor.b,
    },
    opacity: rgbColor.a,
  };

  console.log('paintStyle', paintStyle);

  node.fills = [paintStyle];

  return {
    id: node.id,
    name: node.name,
    fills: [paintStyle],
  };
}

async function setStrokeColor(params) {
  const {
    nodeId,
    color: { r, g, b, a },
    strokeWeight,
  } = params || {};

  if (!nodeId) {
    throw new Error('Missing nodeId parameter');
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) {
    throw new Error(`Node not found with ID: ${nodeId}`);
  }

  if (!('strokes' in node)) {
    throw new Error(`Node does not support strokes: ${nodeId}`);
  }

  if (r === undefined || g === undefined || b === undefined || a === undefined) {
    throw new Error(
      'Incomplete color data received from MCP layer. All RGBA components must be provided.'
    );
  }

  if (strokeWeight === undefined) {
    throw new Error('Stroke weight must be provided by MCP layer.');
  }

  const rgbColor = {
    r: parseFloat(r),
    g: parseFloat(g),
    b: parseFloat(b),
    a: parseFloat(a),
  };
  const strokeWeightParsed = parseFloat(strokeWeight);

  if (isNaN(rgbColor.r) || isNaN(rgbColor.g) || isNaN(rgbColor.b) || isNaN(rgbColor.a)) {
    throw new Error('Invalid color values received - all components must be valid numbers');
  }

  if (isNaN(strokeWeightParsed)) {
    throw new Error('Invalid stroke weight - must be a valid number');
  }

  const paintStyle = {
    type: 'SOLID',
    color: {
      r: rgbColor.r,
      g: rgbColor.g,
      b: rgbColor.b,
    },
    opacity: rgbColor.a,
  };

  node.strokes = [paintStyle];

  // Set stroke weight if available
  if ('strokeWeight' in node) {
    node.strokeWeight = strokeWeightParsed;
  }

  return {
    id: node.id,
    name: node.name,
    strokes: node.strokes,
    strokeWeight: 'strokeWeight' in node ? node.strokeWeight : undefined,
  };
}

async function moveNode(params) {
  const { nodeId, x, y } = params || {};

  if (!nodeId) {
    throw new Error('Missing nodeId parameter');
  }

  if (x === undefined || y === undefined) {
    throw new Error('Missing x or y parameters');
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) {
    throw new Error(`Node not found with ID: ${nodeId}`);
  }

  if (!('x' in node) || !('y' in node)) {
    throw new Error(`Node does not support position: ${nodeId}`);
  }

  node.x = x;
  node.y = y;

  return {
    id: node.id,
    name: node.name,
    x: node.x,
    y: node.y,
  };
}

async function resizeNode(params) {
  const { nodeId, width, height } = params || {};

  if (!nodeId) {
    throw new Error('Missing nodeId parameter');
  }

  if (width === undefined || height === undefined) {
    throw new Error('Missing width or height parameters');
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) {
    throw new Error(`Node not found with ID: ${nodeId}`);
  }

  if (!('resize' in node)) {
    throw new Error(`Node does not support resizing: ${nodeId}`);
  }

  node.resize(width, height);

  return {
    id: node.id,
    name: node.name,
    width: node.width,
    height: node.height,
  };
}

async function deleteNode(params) {
  const { nodeId } = params || {};

  if (!nodeId) {
    throw new Error('Missing nodeId parameter');
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) {
    throw new Error(`Node not found with ID: ${nodeId}`);
  }

  // Save node info before deleting
  const nodeInfo = {
    id: node.id,
    name: node.name,
    type: node.type,
  };

  node.remove();

  return nodeInfo;
}

async function getStyles() {
  const styles = {
    colors: await figma.getLocalPaintStylesAsync(),
    texts: await figma.getLocalTextStylesAsync(),
    effects: await figma.getLocalEffectStylesAsync(),
    grids: await figma.getLocalGridStylesAsync(),
  };

  return {
    colors: styles.colors.map((style) => ({
      id: style.id,
      name: style.name,
      key: style.key,
      paint: style.paints[0],
    })),
    texts: styles.texts.map((style) => ({
      id: style.id,
      name: style.name,
      key: style.key,
      fontSize: style.fontSize,
      fontName: style.fontName,
    })),
    effects: styles.effects.map((style) => ({
      id: style.id,
      name: style.name,
      key: style.key,
    })),
    grids: styles.grids.map((style) => ({
      id: style.id,
      name: style.name,
      key: style.key,
    })),
  };
}

async function getLocalComponents() {
  await figma.loadAllPagesAsync();

  const components = figma.root.findAllWithCriteria({
    types: ['COMPONENT'],
  });

  return {
    count: components.length,
    components: components.map((component) => ({
      id: component.id,
      name: component.name,
      key: 'key' in component ? component.key : null,
    })),
  };
}

// async function getTeamComponents() {
//   try {
//     const teamComponents =
//       await figma.teamLibrary.getAvailableComponentsAsync();

//     return {
//       count: teamComponents.length,
//       components: teamComponents.map((component) => ({
//         key: component.key,
//         name: component.name,
//         description: component.description,
//         libraryName: component.libraryName,
//       })),
//     };
//   } catch (error) {
//     throw new Error(`Error getting team components: ${error.message}`);
//   }
// }

async function createComponentInstance(params) {
  const { componentKey, x = 0, y = 0 } = params || {};

  if (!componentKey) {
    throw new Error('Missing componentKey parameter');
  }

  console.log(`[COMPONENT_INSTANCE] Starting creation for key: ${componentKey}`);
  const startTime = Date.now();

  try {
    // CRITICAL FIX: Import component directly using the published component key
    // According to Figma docs, figma.importComponentByKeyAsync is the correct method
    // for published components, and componentKey refers to published component keys
    
    console.log(`[COMPONENT_INSTANCE] Importing component directly using figma.importComponentByKeyAsync...`);
    
    let component = null;
    try {
      // This is the correct API for published components
      component = await figma.importComponentByKeyAsync(componentKey);
      console.log(`[COMPONENT_INSTANCE] Successfully imported component: ${component.name}`);
      console.log(`[COMPONENT_INSTANCE] Component details: type=${component.type}, id=${component.id}, remote=${component.remote}`);
      
    } catch (importError) {
      console.error(`[COMPONENT_INSTANCE] Direct import failed:`, importError.message);
      console.error(`[COMPONENT_INSTANCE] Error type:`, importError.constructor.name);
      
      // Fallback 1: Search local document for matching component by key
      console.log(`[COMPONENT_INSTANCE] Attempting local component search fallback...`);
      const localComponents = figma.root.findAll(node => 
        node.type === 'COMPONENT' && node.key === componentKey
      );
      
      if (localComponents.length > 0) {
        component = localComponents[0];
        console.log(`[COMPONENT_INSTANCE] Found local component: ${component.name}`);
      } else {
        // Fallback 2: Search for existing instances with this componentId/key and clone
        console.log(`[COMPONENT_INSTANCE] Attempting instance clone fallback...`);
        const existingInstances = figma.root.findAll(node => 
          node.type === 'INSTANCE' && (
            node.componentId === componentKey || 
            (node.componentProperties && Object.keys(node.componentProperties).length > 0)
          )
        );
        
        if (existingInstances.length > 0) {
          console.log(`[COMPONENT_INSTANCE] Found existing instance to clone: ${existingInstances[0].id}`);
          const sourceInstance = existingInstances[0];
          const clonedNode = sourceInstance.clone();
          clonedNode.x = x;
          clonedNode.y = y;
          
          // The clone is already added to the page by default
          const totalTime = Date.now() - startTime;
          console.log(`[COMPONENT_INSTANCE] Clone fallback successful: ${clonedNode.id} (${totalTime}ms)`);
          
          return {
            id: clonedNode.id,
            name: clonedNode.name,
            x: clonedNode.x,
            y: clonedNode.y,
            width: clonedNode.width,
            height: clonedNode.height,
            componentId: clonedNode.componentId,
            componentName: sourceInstance.name,
            creationTime: totalTime,
            method: 'clone_fallback'
          };
        }
        
        // If all fallbacks fail, provide detailed error
        throw new Error(`Component "${componentKey}" not found. Tried: import, local search, and instance cloning. Ensure the component is published and accessible.`);
      }
    }

    if (!component || component.type !== 'COMPONENT') {
      throw new Error(`Invalid component found for key: ${componentKey}. Expected COMPONENT, got: ${component ? component.type : 'null'}`);
    }

    // Create instance using the correct Figma API
    console.log(`[COMPONENT_INSTANCE] Creating instance using ComponentNode.createInstance()...`);
    const instance = component.createInstance();
    
    console.log(`[COMPONENT_INSTANCE] Instance created, setting position...`);
    // Set position
    instance.x = x;
    instance.y = y;
    
    // Note: createInstance() automatically adds to figma.currentPage according to docs
    // But let's ensure it's on the current page
    if (instance.parent !== figma.currentPage) {
      console.log(`[COMPONENT_INSTANCE] Moving instance to current page...`);
      figma.currentPage.appendChild(instance);
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`[COMPONENT_INSTANCE] Successfully created instance: ${instance.id} (${totalTime}ms total)`);
    
    return {
      id: instance.id,
      name: instance.name,
      x: instance.x,
      y: instance.y,
      width: instance.width,
      height: instance.height,
      componentId: instance.componentId,
      componentName: component.name,
      creationTime: totalTime,
      method: 'direct_creation'
    };
    
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[COMPONENT_INSTANCE] Operation failed after ${elapsed}ms:`, error.message);
    console.error(`[COMPONENT_INSTANCE] Full error:`, error);

    // Enhanced error handling with more context
    if (error.message.includes("not found") || error.message.includes("Not found")) {
      throw new Error(`Component key "${componentKey}" not found. Ensure the component is published in a team library and you have access. Original error: ${error.message}`);
    } else if (error.message.includes("permission") || error.message.includes("Permission")) {
      throw new Error(`Permission denied accessing component "${componentKey}". Check library access permissions. Original error: ${error.message}`);
    } else if (error.message.includes("network") || error.message.includes("Network")) {
      throw new Error(`Network error importing component "${componentKey}". Check internet connection. Original error: ${error.message}`);
    } else {
      throw new Error(`Failed to create component instance for key "${componentKey}": ${error.message}`);
    }
  }
}

// ===== COMPONENT SYSTEM FUNCTIONS =====

async function getComponentProperties(params) {
  const { componentKey } = params || {};

  if (!componentKey) {
    throw new Error('Missing componentKey parameter');
  }

  console.log(`[COMPONENT_PROPS] Getting properties for component: ${componentKey}`);

  try {
    // First try to find component locally, then import if needed
    let component = null;
    
    // Search for component by key in current document
    const localComponents = figma.root.findAll(node => 
      node.type === 'COMPONENT' && ('key' in node) && node.key === componentKey
    );
    
    if (localComponents.length > 0) {
      component = localComponents[0];
      console.log(`[COMPONENT_PROPS] Found component locally: ${component.name}`);
    } else {
      // Import the component to analyze its properties
      console.log(`[COMPONENT_PROPS] Importing component...`);
      component = await figma.importComponentByKeyAsync(componentKey);
      console.log(`[COMPONENT_PROPS] Successfully imported component: ${component.name}`);
    }

    // Analyze component properties and variants using proper API
    const result = {
      componentId: component.id,
      componentName: component.name,
      componentKey: componentKey,
      variants: {},
      properties: {},
      defaultVariant: {},
      propertyDefinitions: {}
    };

    // Get component property definitions (the correct API)
    if (component.componentPropertyDefinitions) {
      console.log(`[COMPONENT_PROPS] Found componentPropertyDefinitions`);
      
      Object.keys(component.componentPropertyDefinitions).forEach(propName => {
        const propDef = component.componentPropertyDefinitions[propName];
        result.propertyDefinitions[propName] = {
          type: propDef.type,
          defaultValue: propDef.defaultValue,
          variantOptions: propDef.variantOptions || []
        };
        
        // Separate VARIANT type properties
        if (propDef.type === 'VARIANT') {
          result.variants[propName] = propDef.variantOptions || [];
        } else {
          result.properties[propName] = {
            type: propDef.type,
            defaultValue: propDef.defaultValue
          };
        }
      });
    }

    // Check if this is a component set (has variants) - alternative method
    if (component.parent && component.parent.type === 'COMPONENT_SET') {
      const componentSet = component.parent;
      console.log(`[COMPONENT_PROPS] Component is part of variant set: ${componentSet.name}`);
      
      // Get all variants in the set
      const allVariants = componentSet.children.filter(child => child.type === 'COMPONENT');
      console.log(`[COMPONENT_PROPS] Found ${allVariants.length} variants`);

      // Extract variant properties from all components as fallback
      if (Object.keys(result.variants).length === 0) {
        const variantProperties = new Map();
        
        allVariants.forEach(variant => {
          if (variant.variantProperties) {
            Object.keys(variant.variantProperties).forEach(propName => {
              if (!variantProperties.has(propName)) {
                variantProperties.set(propName, new Set());
              }
              variantProperties.get(propName).add(variant.variantProperties[propName]);
            });
          }
        });

        // Convert to result format
        variantProperties.forEach((values, propName) => {
          result.variants[propName] = Array.from(values).sort();
        });
      }

      // Get default variant (current component's properties)
      if (component.variantProperties) {
        result.defaultVariant = Object.assign({}, component.variantProperties);
      }
    }

    console.log(`[COMPONENT_PROPS] Analysis complete:`, result);
    return result;

  } catch (error) {
    console.error(`[COMPONENT_PROPS] Error getting component properties:`, error);
    throw new Error(`Failed to get component properties: ${error.message}. Component key: ${componentKey}`);
  }
}

async function setComponentVariant(params) {
  const { nodeId, variants } = params || {};

  if (!nodeId) {
    throw new Error('Missing nodeId parameter');
  }

  if (!variants || typeof variants !== 'object') {
    throw new Error('Missing or invalid variants parameter - must be an object');
  }

  console.log(`[COMPONENT_VARIANT] Setting variants for node: ${nodeId}`, variants);

  try {
    const node = await figma.getNodeByIdAsync(nodeId);
    
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    if (node.type !== 'INSTANCE') {
      throw new Error(`Node ${nodeId} is not a component instance`);
    }

    // Use the correct Figma API: InstanceNode.setProperties()
    console.log(`[COMPONENT_VARIANT] Using InstanceNode.setProperties() to set variants...`);
    
    try {
      // setProperties expects an object with property names as keys
      // For VARIANT properties, we pass them directly without suffixes
      node.setProperties(variants);
      
      console.log(`[COMPONENT_VARIANT] Successfully set variants using setProperties`);
      
      // Get updated component info
      const updatedComponent = await node.getMainComponentAsync();
      
      return {
        nodeId: nodeId,
        componentId: node.componentId,
        appliedVariants: variants,
        componentName: updatedComponent ? updatedComponent.name : node.name,
        success: true
      };
      
    } catch (setPropsError) {
      console.error(`[COMPONENT_VARIANT] setProperties failed:`, setPropsError.message);
      
      // Fallback to swapComponent method for older API compatibility
      console.log(`[COMPONENT_VARIANT] Attempting fallback with swapComponent...`);
      
      const component = await figma.getNodeByIdAsync(node.componentId);
      if (!component || !component.parent || component.parent.type !== 'COMPONENT_SET') {
        throw new Error(`Component does not have variants available and setProperties failed`);
      }

      const componentSet = component.parent;
      console.log(`[COMPONENT_VARIANT] Finding matching variant in set: ${componentSet.name}`);

      // Find the component that matches the requested variants
      const targetComponent = componentSet.children.find(child => {
        if (child.type !== 'COMPONENT' || !child.variantProperties) {
          return false;
        }
        
        // Check if all requested variants match
        return Object.keys(variants).every(propName => 
          child.variantProperties[propName] === variants[propName]
        );
      });

      if (!targetComponent) {
        const availableVariants = componentSet.children
          .filter(child => child.type === 'COMPONENT' && child.variantProperties)
          .map(child => child.variantProperties);
        
        throw new Error(`No matching variant found for ${JSON.stringify(variants)}. Available variants: ${JSON.stringify(availableVariants)}`);
      }

      console.log(`[COMPONENT_VARIANT] Found matching component: ${targetComponent.name}`);

      // Swap the instance to the new component variant
      node.swapComponent(targetComponent);

      console.log(`[COMPONENT_VARIANT] Successfully swapped to variant using fallback method`);

      return {
        nodeId: nodeId,
        newComponentId: targetComponent.id,
        appliedVariants: targetComponent.variantProperties,
        componentName: targetComponent.name,
        method: 'swapComponent_fallback'
      };
    }

  } catch (error) {
    console.error(`[COMPONENT_VARIANT] Error setting component variant:`, error);
    throw new Error(`Failed to set component variant: ${error.message}. Node: ${nodeId}`);
  }
}

async function getComponentVariant(params) {
  const { nodeId } = params || {};

  if (!nodeId) {
    throw new Error('Missing nodeId parameter');
  }

  console.log(`[COMPONENT_VARIANT] Getting variant for node: ${nodeId}`);

  try {
    const node = await figma.getNodeByIdAsync(nodeId);
    
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    if (node.type !== 'INSTANCE') {
      throw new Error(`Node ${nodeId} is not a component instance`);
    }

    // Use the correct async method to get main component
    console.log(`[COMPONENT_VARIANT] Getting main component using getMainComponentAsync...`);
    const component = await node.getMainComponentAsync();
    
    if (!component) {
      throw new Error(`Main component not found for instance: ${nodeId}`);
    }

    // Get current variant properties from the component
    const variants = component.variantProperties || {};
    
    // Also get component properties for the instance
    const instanceProperties = node.componentProperties || {};

    const result = {
      nodeId: nodeId,
      componentId: node.componentId,
      componentName: component.name,
      variants: variants,
      properties: instanceProperties,
      hasVariants: Object.keys(variants).length > 0,
      hasProperties: Object.keys(instanceProperties).length > 0
    };

    console.log(`[COMPONENT_VARIANT] Retrieved variant info:`, result);
    return result;

  } catch (error) {
    console.error(`[COMPONENT_VARIANT] Error getting component variant:`, error);
    throw new Error(`Failed to get component variant: ${error.message}. Node: ${nodeId}`);
  }
}

async function setComponentProperty(params) {
  const { nodeId, propertyName, value } = params || {};

  if (!nodeId) {
    throw new Error('Missing nodeId parameter');
  }

  if (!propertyName) {
    throw new Error('Missing propertyName parameter');
  }

  console.log(`[COMPONENT_PROP] Setting property "${propertyName}" to "${value}" for node: ${nodeId}`);

  try {
    const node = await figma.getNodeByIdAsync(nodeId);
    
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    if (node.type !== 'INSTANCE') {
      throw new Error(`Node ${nodeId} is not a component instance`);
    }

    // Get the main component to understand property definitions
    const component = await node.getMainComponentAsync();
    if (!component || !component.componentPropertyDefinitions) {
      throw new Error(`Component property definitions not available for ${nodeId}`);
    }

    const propDef = component.componentPropertyDefinitions[propertyName];
    if (!propDef) {
      const availableProps = Object.keys(component.componentPropertyDefinitions);
      throw new Error(`Property "${propertyName}" not found. Available properties: ${availableProps.join(', ')}`);
    }

    console.log(`[COMPONENT_PROP] Found property definition:`, {
      name: propertyName,
      type: propDef.type,
      defaultValue: propDef.defaultValue
    });

    // Use setProperties API with correct property name format
    const propertyUpdate = {};
    
    // For different property types, format the key differently
    if (propDef.type === 'VARIANT') {
      // VARIANT properties use direct property name
      propertyUpdate[propertyName] = value;
    } else if (propDef.type === 'TEXT' || propDef.type === 'BOOLEAN' || propDef.type === 'INSTANCE_SWAP') {
      // TEXT, BOOLEAN, and INSTANCE_SWAP properties need the ID suffix
      // Get the property ID from the node's componentProperties
      const currentProps = node.componentProperties || {};
      const propertyKey = Object.keys(currentProps).find(key => 
        key.startsWith(propertyName + '#') || key === propertyName
      );
      
      if (propertyKey) {
        propertyUpdate[propertyKey] = value;
      } else {
        // Fallback: try with just the property name
        propertyUpdate[propertyName] = value;
      }
    } else {
      // Default case: use property name as-is
      propertyUpdate[propertyName] = value;
    }

    console.log(`[COMPONENT_PROP] Setting properties:`, propertyUpdate);
    node.setProperties(propertyUpdate);
    
    console.log(`[COMPONENT_PROP] Successfully set property using setProperties`);

    return {
      nodeId: nodeId,
      propertyName: propertyName,
      value: value,
      propertyType: propDef.type,
      success: true
    };

  } catch (error) {
    console.error(`[COMPONENT_PROP] Error setting component property:`, error);
    throw new Error(`Failed to set component property: ${error.message}. Node: ${nodeId}, Property: ${propertyName}`);
  }
}

async function getComponentPropertiesForInstance(params) {
  const { nodeId } = params || {};

  if (!nodeId) {
    throw new Error('Missing nodeId parameter');
  }

  console.log(`[COMPONENT_PROPS_INST] Getting properties for instance: ${nodeId}`);

  try {
    const node = await figma.getNodeByIdAsync(nodeId);
    
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    if (node.type !== 'INSTANCE') {
      throw new Error(`Node ${nodeId} is not a component instance`);
    }

    const result = {
      nodeId: nodeId,
      componentId: node.componentId,
      properties: {},
      overrides: []
    };

    // Get current component properties
    if (node.componentProperties) {
      result.properties = Object.assign({}, node.componentProperties);
    }

    // Get overrides information
    if (node.overrides) {
      result.overrides = node.overrides.map(override => ({
        id: override.id,
        overriddenFields: override.overriddenFields || []
      }));
    }

    console.log(`[COMPONENT_PROPS_INST] Retrieved properties:`, result);
    return result;

  } catch (error) {
    console.error(`[COMPONENT_PROPS_INST] Error getting instance properties:`, error);
    throw new Error(`Failed to get component properties for instance: ${error.message}. Node: ${nodeId}`);
  }
}

async function searchComponents(params) {
  const { searchTerm, limit = 50 } = params || {};

  if (!searchTerm) {
    throw new Error('Missing searchTerm parameter');
  }

  console.log(`[SEARCH_COMPONENTS] Searching for components matching: "${searchTerm}"`);

  try {
    // Load all pages for comprehensive search
    await figma.loadAllPagesAsync();
    
    // Use findAllWithCriteria for better performance and coverage
    console.log(`[SEARCH_COMPONENTS] Using comprehensive search across all pages...`);
    
    // Find all components that match the search term
    const allComponents = figma.root.findAllWithCriteria({
      types: ['COMPONENT'],
    }).filter(component => 
      component.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Find all component sets that match
    const componentSets = figma.root.findAllWithCriteria({
      types: ['COMPONENT_SET'],
    }).filter(componentSet => 
      componentSet.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Find instances that match to discover team library components
    const matchingInstances = figma.root.findAllWithCriteria({
      types: ['INSTANCE'],
    }).filter(instance => 
      instance.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    console.log(`[SEARCH_COMPONENTS] Found ${allComponents.length} components, ${componentSets.length} component sets, ${matchingInstances.length} matching instances`);
    
    const foundComponents = [];
    
    // Add direct component matches
    allComponents.forEach(comp => {
      if (comp.key) {
        foundComponents.push({
          key: comp.key,
          id: comp.id,
          name: comp.name,
          description: comp.description || '',
          remote: comp.remote || false,
          type: comp.remote ? 'imported_component' : 'local_component',
          location: comp.parent && comp.parent.type === 'PAGE' ? comp.parent.name : 'unknown'
        });
      }
    });
    
    // Add components from matching component sets
    componentSets.forEach(componentSet => {
      componentSet.children.forEach(component => {
        if (component.type === 'COMPONENT' && component.key) {
          foundComponents.push({
            key: component.key,
            id: component.id,
            name: component.name,
            description: component.description || '',
            remote: component.remote || false,
            type: component.remote ? 'imported_variant' : 'local_variant',
            variantSet: componentSet.name,
            location: 'variant_set'
          });
        }
      });
    });
    
    // Add team library components discovered from instances using proper async method
    console.log(`[SEARCH_COMPONENTS] Analyzing ${matchingInstances.length} matching instances for team library components...`);
    
    const instancePromises = matchingInstances.map(async (instance) => {
      try {
        const mainComponent = await instance.getMainComponentAsync();
        if (mainComponent && mainComponent.key) {
          // Check if we already have this component
          const existing = foundComponents.find(c => c.key === mainComponent.key);
          if (!existing) {
            return {
              key: mainComponent.key,
              id: mainComponent.id,
              name: mainComponent.name,
              description: mainComponent.description || '',
              remote: mainComponent.remote || false,
              type: mainComponent.remote ? 'team_library_component' : 'local_component_from_instance',
              instanceCount: 1,
              discoveredFromInstance: true,
              location: mainComponent.remote ? 'team_library' : 'local_document'
            };
          }
        }
      } catch (error) {
        console.log(`[SEARCH_COMPONENTS] Could not resolve component for instance ${instance.id}: ${error.message}`);
      }
      return null;
    });
    
    const instanceComponents = await Promise.all(instancePromises);
    const validInstanceComponents = instanceComponents.filter(comp => comp !== null);
    
    // Add to found components
    foundComponents.push(...validInstanceComponents);
    
    console.log(`[SEARCH_COMPONENTS] Added ${validInstanceComponents.length} components discovered from instances`);
    
    // Sort by relevance (exact matches first, then alphabetical)
    foundComponents.sort((a, b) => {
      const aExact = a.name.toLowerCase() === searchTerm.toLowerCase();
      const bExact = b.name.toLowerCase() === searchTerm.toLowerCase();
      
      if (aExact && !bExact) return -1;
      if (bExact && !aExact) return 1;
      
      return a.name.localeCompare(b.name);
    });
    
    // Limit results
    const limitedResults = foundComponents.slice(0, limit);
    
    console.log(`[SEARCH_COMPONENTS] Found ${limitedResults.length} components matching "${searchTerm}"`);
    
    return {
      searchTerm: searchTerm,
      count: limitedResults.length,
      totalMatches: foundComponents.length,
      limited: foundComponents.length > limit,
      components: limitedResults
    };
    
  } catch (error) {
    console.error(`[SEARCH_COMPONENTS] Error searching components:`, error);
    throw new Error(`Failed to search components: ${error.message}. Search term: ${searchTerm}`);
  }
}

async function exportNodeAsImage(params) {
  const { nodeId, scale = 1 } = params || {};

  const format = 'PNG';

  if (!nodeId) {
    throw new Error('Missing nodeId parameter');
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) {
    throw new Error(`Node not found with ID: ${nodeId}`);
  }

  if (!('exportAsync' in node)) {
    throw new Error(`Node does not support exporting: ${nodeId}`);
  }

  try {
    const settings = {
      format: format,
      constraint: { type: 'SCALE', value: scale },
    };

    const bytes = await node.exportAsync(settings);

    let mimeType;
    switch (format) {
      case 'PNG':
        mimeType = 'image/png';
        break;
      case 'JPG':
        mimeType = 'image/jpeg';
        break;
      case 'SVG':
        mimeType = 'image/svg+xml';
        break;
      case 'PDF':
        mimeType = 'application/pdf';
        break;
      default:
        mimeType = 'application/octet-stream';
    }

    // Proper way to convert Uint8Array to base64
    const base64 = customBase64Encode(bytes);
    // const imageData = `data:${mimeType};base64,${base64}`;

    return {
      nodeId,
      format,
      scale,
      mimeType,
      imageData: base64,
    };
  } catch (error) {
    throw new Error(`Error exporting node as image: ${error.message}`);
  }
}
function customBase64Encode(bytes) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let base64 = '';

  const byteLength = bytes.byteLength;
  const byteRemainder = byteLength % 3;
  const mainLength = byteLength - byteRemainder;

  let a, b, c, d;
  let chunk;

  // Main loop deals with bytes in chunks of 3
  for (let i = 0; i < mainLength; i = i + 3) {
    // Combine the three bytes into a single integer
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

    // Use bitmasks to extract 6-bit segments from the triplet
    a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048) >> 12; // 258048 = (2^6 - 1) << 12
    c = (chunk & 4032) >> 6; // 4032 = (2^6 - 1) << 6
    d = chunk & 63; // 63 = 2^6 - 1

    // Convert the raw binary segments to the appropriate ASCII encoding
    base64 += chars[a] + chars[b] + chars[c] + chars[d];
  }

  // Deal with the remaining bytes and padding
  if (byteRemainder === 1) {
    chunk = bytes[mainLength];

    a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

    // Set the 4 least significant bits to zero
    b = (chunk & 3) << 4; // 3 = 2^2 - 1

    base64 += chars[a] + chars[b] + '==';
  } else if (byteRemainder === 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

    a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008) >> 4; // 1008 = (2^6 - 1) << 4

    // Set the 2 least significant bits to zero
    c = (chunk & 15) << 2; // 15 = 2^4 - 1

    base64 += chars[a] + chars[b] + chars[c] + '=';
  }

  return base64;
}

async function setCornerRadius(params) {
  const { nodeId, radius, corners } = params || {};

  if (!nodeId) {
    throw new Error('Missing nodeId parameter');
  }

  if (radius === undefined) {
    throw new Error('Missing radius parameter');
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) {
    throw new Error(`Node not found with ID: ${nodeId}`);
  }

  // Check if node supports corner radius
  if (!('cornerRadius' in node)) {
    throw new Error(`Node does not support corner radius: ${nodeId}`);
  }

  // If corners array is provided, set individual corner radii
  if (corners && Array.isArray(corners) && corners.length === 4) {
    if ('topLeftRadius' in node) {
      // Node supports individual corner radii
      if (corners[0]) node.topLeftRadius = radius;
      if (corners[1]) node.topRightRadius = radius;
      if (corners[2]) node.bottomRightRadius = radius;
      if (corners[3]) node.bottomLeftRadius = radius;
    } else {
      // Node only supports uniform corner radius
      node.cornerRadius = radius;
    }
  } else {
    // Set uniform corner radius
    node.cornerRadius = radius;
  }

  return {
    id: node.id,
    name: node.name,
    cornerRadius: 'cornerRadius' in node ? node.cornerRadius : undefined,
    topLeftRadius: 'topLeftRadius' in node ? node.topLeftRadius : undefined,
    topRightRadius: 'topRightRadius' in node ? node.topRightRadius : undefined,
    bottomRightRadius: 'bottomRightRadius' in node ? node.bottomRightRadius : undefined,
    bottomLeftRadius: 'bottomLeftRadius' in node ? node.bottomLeftRadius : undefined,
  };
}

async function setTextContent(params) {
  const { nodeId, text } = params || {};

  if (!nodeId) {
    throw new Error('Missing nodeId parameter');
  }

  if (text === undefined) {
    throw new Error('Missing text parameter');
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) {
    throw new Error(`Node not found with ID: ${nodeId}`);
  }

  if (node.type !== 'TEXT') {
    throw new Error(`Node is not a text node: ${nodeId}`);
  }

  try {
    await figma.loadFontAsync(node.fontName);

    await setCharacters(node, text);

    return {
      id: node.id,
      name: node.name,
      characters: node.characters,
      fontName: node.fontName,
    };
  } catch (error) {
    throw new Error(`Error setting text content: ${error.message}`);
  }
}

// Initialize settings on load
(async function initializePlugin() {
  try {
    const savedSettings = await figma.clientStorage.getAsync('settings');
    if (savedSettings) {
      if (savedSettings.serverPort) {
        state.serverPort = savedSettings.serverPort;
      }
    }

    // Send initial settings to UI
    figma.ui.postMessage({
      type: 'init-settings',
      settings: {
        serverPort: state.serverPort,
      },
    });
  } catch (error) {
    console.error('Error loading settings:', error);
  }
})();

function uniqBy(arr, predicate) {
  const cb = typeof predicate === 'function' ? predicate : (o) => o[predicate];
  return [
    ...arr
      .reduce((map, item) => {
        const key = item === null || item === undefined ? item : cb(item);

        map.has(key) || map.set(key, item);

        return map;
      }, new Map())
      .values(),
  ];
}
const setCharacters = async (node, characters, options) => {
  const fallbackFont = (options && options.fallbackFont) || {
    family: 'Inter',
    style: 'Regular',
  };
  try {
    if (node.fontName === figma.mixed) {
      if (options && options.smartStrategy === 'prevail') {
        const fontHashTree = {};
        for (let i = 1; i < node.characters.length; i++) {
          const charFont = node.getRangeFontName(i - 1, i);
          const key = `${charFont.family}::${charFont.style}`;
          fontHashTree[key] = fontHashTree[key] ? fontHashTree[key] + 1 : 1;
        }
        const prevailedTreeItem = Object.entries(fontHashTree).sort((a, b) => b[1] - a[1])[0];
        const [family, style] = prevailedTreeItem[0].split('::');
        const prevailedFont = {
          family,
          style,
        };
        await figma.loadFontAsync(prevailedFont);
        node.fontName = prevailedFont;
      } else if (options && options.smartStrategy === 'strict') {
        return setCharactersWithStrictMatchFont(node, characters, fallbackFont);
      } else if (options && options.smartStrategy === 'experimental') {
        return setCharactersWithSmartMatchFont(node, characters, fallbackFont);
      } else {
        const firstCharFont = node.getRangeFontName(0, 1);
        await figma.loadFontAsync(firstCharFont);
        node.fontName = firstCharFont;
      }
    } else {
      await figma.loadFontAsync({
        family: node.fontName.family,
        style: node.fontName.style,
      });
    }
  } catch (err) {
    console.warn(
      `Failed to load "${node.fontName['family']} ${node.fontName['style']}" font and replaced with fallback "${fallbackFont.family} ${fallbackFont.style}"`,
      err
    );
    await figma.loadFontAsync(fallbackFont);
    node.fontName = fallbackFont;
  }
  try {
    node.characters = characters;
    return true;
  } catch (err) {
    console.warn(`Failed to set characters. Skipped.`, err);
    return false;
  }
};

const setCharactersWithStrictMatchFont = async (node, characters, fallbackFont) => {
  const fontHashTree = {};
  for (let i = 1; i < node.characters.length; i++) {
    const startIdx = i - 1;
    const startCharFont = node.getRangeFontName(startIdx, i);
    const startCharFontVal = `${startCharFont.family}::${startCharFont.style}`;
    while (i < node.characters.length) {
      i++;
      const charFont = node.getRangeFontName(i - 1, i);
      if (startCharFontVal !== `${charFont.family}::${charFont.style}`) {
        break;
      }
    }
    fontHashTree[`${startIdx}_${i}`] = startCharFontVal;
  }
  await figma.loadFontAsync(fallbackFont);
  node.fontName = fallbackFont;
  node.characters = characters;
  console.log(fontHashTree);
  await Promise.all(
    Object.keys(fontHashTree).map(async (range) => {
      console.log(range, fontHashTree[range]);
      const [start, end] = range.split('_');
      const [family, style] = fontHashTree[range].split('::');
      const matchedFont = {
        family,
        style,
      };
      await figma.loadFontAsync(matchedFont);
      return node.setRangeFontName(Number(start), Number(end), matchedFont);
    })
  );
  return true;
};

const getDelimiterPos = (str, delimiter, startIdx = 0, endIdx = str.length) => {
  const indices = [];
  let temp = startIdx;
  for (let i = startIdx; i < endIdx; i++) {
    if (str[i] === delimiter && i + startIdx !== endIdx && temp !== i + startIdx) {
      indices.push([temp, i + startIdx]);
      temp = i + startIdx + 1;
    }
  }
  temp !== endIdx && indices.push([temp, endIdx]);
  return indices.filter(Boolean);
};

const buildLinearOrder = (node) => {
  const fontTree = [];
  const newLinesPos = getDelimiterPos(node.characters, '\n');
  newLinesPos.forEach(([newLinesRangeStart, newLinesRangeEnd], n) => {
    const newLinesRangeFont = node.getRangeFontName(newLinesRangeStart, newLinesRangeEnd);
    if (newLinesRangeFont === figma.mixed) {
      const spacesPos = getDelimiterPos(
        node.characters,
        ' ',
        newLinesRangeStart,
        newLinesRangeEnd
      );
      spacesPos.forEach(([spacesRangeStart, spacesRangeEnd], s) => {
        const spacesRangeFont = node.getRangeFontName(spacesRangeStart, spacesRangeEnd);
        if (spacesRangeFont === figma.mixed) {
          const spacesRangeFont = node.getRangeFontName(spacesRangeStart, spacesRangeStart[0]);
          fontTree.push({
            start: spacesRangeStart,
            delimiter: ' ',
            family: spacesRangeFont.family,
            style: spacesRangeFont.style,
          });
        } else {
          fontTree.push({
            start: spacesRangeStart,
            delimiter: ' ',
            family: spacesRangeFont.family,
            style: spacesRangeFont.style,
          });
        }
      });
    } else {
      fontTree.push({
        start: newLinesRangeStart,
        delimiter: '\n',
        family: newLinesRangeFont.family,
        style: newLinesRangeFont.style,
      });
    }
  });
  return fontTree
    .sort((a, b) => +a.start - +b.start)
    .map(({ family, style, delimiter }) => ({ family, style, delimiter }));
};

const setCharactersWithSmartMatchFont = async (node, characters, fallbackFont) => {
  const rangeTree = buildLinearOrder(node);
  const fontsToLoad = uniqBy(rangeTree, ({ family, style }) => `${family}::${style}`).map(
    ({ family, style }) => ({
      family,
      style,
    })
  );

  await Promise.all([...fontsToLoad, fallbackFont].map(figma.loadFontAsync));

  node.fontName = fallbackFont;
  node.characters = characters;

  let prevPos = 0;
  rangeTree.forEach(({ family, style, delimiter }) => {
    if (prevPos < node.characters.length) {
      const delimeterPos = node.characters.indexOf(delimiter, prevPos);
      const endPos = delimeterPos > prevPos ? delimeterPos : node.characters.length;
      const matchedFont = {
        family,
        style,
      };
      node.setRangeFontName(prevPos, endPos, matchedFont);
      prevPos = endPos + 1;
    }
  });
  return true;
};

// Add the cloneNode function implementation
async function cloneNode(params) {
  const { nodeId, x, y } = params || {};

  if (!nodeId) {
    throw new Error('Missing nodeId parameter');
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) {
    throw new Error(`Node not found with ID: ${nodeId}`);
  }

  // Clone the node
  const clone = node.clone();

  // If x and y are provided, move the clone to that position
  if (x !== undefined && y !== undefined) {
    if (!('x' in clone) || !('y' in clone)) {
      throw new Error(`Cloned node does not support position: ${nodeId}`);
    }
    clone.x = x;
    clone.y = y;
  }

  // Add the clone to the same parent as the original node
  if (node.parent) {
    node.parent.appendChild(clone);
  } else {
    figma.currentPage.appendChild(clone);
  }

  return {
    id: clone.id,
    name: clone.name,
    x: 'x' in clone ? clone.x : undefined,
    y: 'y' in clone ? clone.y : undefined,
    width: 'width' in clone ? clone.width : undefined,
    height: 'height' in clone ? clone.height : undefined,
  };
}

async function scanTextNodes(params) {
  console.log(`Starting to scan text nodes from node ID: ${params.nodeId}`);
  const {
    nodeId,
    useChunking = true,
    chunkSize = 10,
    commandId = generateCommandId(),
  } = params || {};

  const node = await figma.getNodeByIdAsync(nodeId);

  if (!node) {
    console.error(`Node with ID ${nodeId} not found`);
    // Send error progress update
    sendProgressUpdate(
      commandId,
      'scan_text_nodes',
      'error',
      0,
      0,
      0,
      `Node with ID ${nodeId} not found`,
      { error: `Node not found: ${nodeId}` }
    );
    throw new Error(`Node with ID ${nodeId} not found`);
  }

  // If chunking is not enabled, use the original implementation
  if (!useChunking) {
    const textNodes = [];
    try {
      // Send started progress update
      sendProgressUpdate(
        commandId,
        'scan_text_nodes',
        'started',
        0,
        1, // Not known yet how many nodes there are
        0,
        `Starting scan of node "${node.name || nodeId}" without chunking`,
        null
      );

      await findTextNodes(node, [], 0, textNodes);

      // Send completed progress update
      sendProgressUpdate(
        commandId,
        'scan_text_nodes',
        'completed',
        100,
        textNodes.length,
        textNodes.length,
        `Scan complete. Found ${textNodes.length} text nodes.`,
        { textNodes }
      );

      return {
        success: true,
        message: `Scanned ${textNodes.length} text nodes.`,
        count: textNodes.length,
        textNodes: textNodes,
        commandId,
      };
    } catch (error) {
      console.error('Error scanning text nodes:', error);

      // Send error progress update
      sendProgressUpdate(
        commandId,
        'scan_text_nodes',
        'error',
        0,
        0,
        0,
        `Error scanning text nodes: ${error.message}`,
        { error: error.message }
      );

      throw new Error(`Error scanning text nodes: ${error.message}`);
    }
  }

  // Chunked implementation
  console.log(`Using chunked scanning with chunk size: ${chunkSize}`);

  // First, collect all nodes to process (without processing them yet)
  const nodesToProcess = [];

  // Send started progress update
  sendProgressUpdate(
    commandId,
    'scan_text_nodes',
    'started',
    0,
    0, // Not known yet how many nodes there are
    0,
    `Starting chunked scan of node "${node.name || nodeId}"`,
    { chunkSize }
  );

  await collectNodesToProcess(node, [], 0, nodesToProcess);

  const totalNodes = nodesToProcess.length;
  console.log(`Found ${totalNodes} total nodes to process`);

  // Calculate number of chunks needed
  const totalChunks = Math.ceil(totalNodes / chunkSize);
  console.log(`Will process in ${totalChunks} chunks`);

  // Send update after node collection
  sendProgressUpdate(
    commandId,
    'scan_text_nodes',
    'in_progress',
    5, // 5% progress for collection phase
    totalNodes,
    0,
    `Found ${totalNodes} nodes to scan. Will process in ${totalChunks} chunks.`,
    {
      totalNodes,
      totalChunks,
      chunkSize,
    }
  );

  // Process nodes in chunks
  const allTextNodes = [];
  let processedNodes = 0;
  let chunksProcessed = 0;

  for (let i = 0; i < totalNodes; i += chunkSize) {
    const chunkEnd = Math.min(i + chunkSize, totalNodes);
    console.log(
      `Processing chunk ${chunksProcessed + 1}/${totalChunks} (nodes ${i} to ${chunkEnd - 1})`
    );

    // Send update before processing chunk
    sendProgressUpdate(
      commandId,
      'scan_text_nodes',
      'in_progress',
      Math.round(5 + (chunksProcessed / totalChunks) * 90), // 5-95% for processing
      totalNodes,
      processedNodes,
      `Processing chunk ${chunksProcessed + 1}/${totalChunks}`,
      {
        currentChunk: chunksProcessed + 1,
        totalChunks,
        textNodesFound: allTextNodes.length,
      }
    );

    const chunkNodes = nodesToProcess.slice(i, chunkEnd);
    const chunkTextNodes = [];

    // Process each node in this chunk
    for (const nodeInfo of chunkNodes) {
      if (nodeInfo.node.type === 'TEXT') {
        try {
          const textNodeInfo = await processTextNode(
            nodeInfo.node,
            nodeInfo.parentPath,
            nodeInfo.depth
          );
          if (textNodeInfo) {
            chunkTextNodes.push(textNodeInfo);
          }
        } catch (error) {
          console.error(`Error processing text node: ${error.message}`);
          // Continue with other nodes
        }
      }

      // Brief delay to allow UI updates and prevent freezing
      await delay(5);
    }

    // Add results from this chunk
    allTextNodes.push(...chunkTextNodes);
    processedNodes += chunkNodes.length;
    chunksProcessed++;

    // Send update after processing chunk
    sendProgressUpdate(
      commandId,
      'scan_text_nodes',
      'in_progress',
      Math.round(5 + (chunksProcessed / totalChunks) * 90), // 5-95% for processing
      totalNodes,
      processedNodes,
      `Processed chunk ${chunksProcessed}/${totalChunks}. Found ${allTextNodes.length} text nodes so far.`,
      {
        currentChunk: chunksProcessed,
        totalChunks,
        processedNodes,
        textNodesFound: allTextNodes.length,
        chunkResult: chunkTextNodes,
      }
    );

    // Small delay between chunks to prevent UI freezing
    if (i + chunkSize < totalNodes) {
      await delay(50);
    }
  }

  // Send completed progress update
  sendProgressUpdate(
    commandId,
    'scan_text_nodes',
    'completed',
    100,
    totalNodes,
    processedNodes,
    `Scan complete. Found ${allTextNodes.length} text nodes.`,
    {
      textNodes: allTextNodes,
      processedNodes,
      chunks: chunksProcessed,
    }
  );

  return {
    success: true,
    message: `Chunked scan complete. Found ${allTextNodes.length} text nodes.`,
    totalNodes: allTextNodes.length,
    processedNodes: processedNodes,
    chunks: chunksProcessed,
    textNodes: allTextNodes,
    commandId,
  };
}

// Helper function to collect all nodes that need to be processed
async function collectNodesToProcess(node, parentPath = [], depth = 0, nodesToProcess = []) {
  // Skip invisible nodes
  if (node.visible === false) return;

  // Get the path to this node
  const nodePath = [...parentPath, node.name || `Unnamed ${node.type}`];

  // Add this node to the processing list
  nodesToProcess.push({
    node: node,
    parentPath: nodePath,
    depth: depth,
  });

  // Recursively add children
  if ('children' in node) {
    for (const child of node.children) {
      await collectNodesToProcess(child, nodePath, depth + 1, nodesToProcess);
    }
  }
}

// Process a single text node
async function processTextNode(node, parentPath, depth) {
  if (node.type !== 'TEXT') return null;

  try {
    // Safely extract font information
    let fontFamily = '';
    let fontStyle = '';

    if (node.fontName) {
      if (typeof node.fontName === 'object') {
        if ('family' in node.fontName) fontFamily = node.fontName.family;
        if ('style' in node.fontName) fontStyle = node.fontName.style;
      }
    }

    // Create a safe representation of the text node
    const safeTextNode = {
      id: node.id,
      name: node.name || 'Text',
      type: node.type,
      characters: node.characters,
      fontSize: typeof node.fontSize === 'number' ? node.fontSize : 0,
      fontFamily: fontFamily,
      fontStyle: fontStyle,
      x: typeof node.x === 'number' ? node.x : 0,
      y: typeof node.y === 'number' ? node.y : 0,
      width: typeof node.width === 'number' ? node.width : 0,
      height: typeof node.height === 'number' ? node.height : 0,
      path: parentPath.join(' > '),
      depth: depth,
    };

    // Highlight the node briefly (optional visual feedback)
    try {
      const originalFills = JSON.parse(JSON.stringify(node.fills));
      node.fills = [
        {
          type: 'SOLID',
          color: { r: 1, g: 0.5, b: 0 },
          opacity: 0.3,
        },
      ];

      // Brief delay for the highlight to be visible
      await delay(100);

      try {
        node.fills = originalFills;
      } catch (err) {
        console.error('Error resetting fills:', err);
      }
    } catch (highlightErr) {
      console.error('Error highlighting text node:', highlightErr);
      // Continue anyway, highlighting is just visual feedback
    }

    return safeTextNode;
  } catch (nodeErr) {
    console.error('Error processing text node:', nodeErr);
    return null;
  }
}

// A delay function that returns a promise
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Keep the original findTextNodes for backward compatibility
async function findTextNodes(node, parentPath = [], depth = 0, textNodes = []) {
  // Skip invisible nodes
  if (node.visible === false) return;

  // Get the path to this node including its name
  const nodePath = [...parentPath, node.name || `Unnamed ${node.type}`];

  if (node.type === 'TEXT') {
    try {
      // Safely extract font information to avoid Symbol serialization issues
      let fontFamily = '';
      let fontStyle = '';

      if (node.fontName) {
        if (typeof node.fontName === 'object') {
          if ('family' in node.fontName) fontFamily = node.fontName.family;
          if ('style' in node.fontName) fontStyle = node.fontName.style;
        }
      }

      // Create a safe representation of the text node with only serializable properties
      const safeTextNode = {
        id: node.id,
        name: node.name || 'Text',
        type: node.type,
        characters: node.characters,
        fontSize: typeof node.fontSize === 'number' ? node.fontSize : 0,
        fontFamily: fontFamily,
        fontStyle: fontStyle,
        x: typeof node.x === 'number' ? node.x : 0,
        y: typeof node.y === 'number' ? node.y : 0,
        width: typeof node.width === 'number' ? node.width : 0,
        height: typeof node.height === 'number' ? node.height : 0,
        path: nodePath.join(' > '),
        depth: depth,
      };

      // Only highlight the node if it's not being done via API
      try {
        // Safe way to create a temporary highlight without causing serialization issues
        const originalFills = JSON.parse(JSON.stringify(node.fills));
        node.fills = [
          {
            type: 'SOLID',
            color: { r: 1, g: 0.5, b: 0 },
            opacity: 0.3,
          },
        ];

        // Promise-based delay instead of setTimeout
        await delay(500);

        try {
          node.fills = originalFills;
        } catch (err) {
          console.error('Error resetting fills:', err);
        }
      } catch (highlightErr) {
        console.error('Error highlighting text node:', highlightErr);
        // Continue anyway, highlighting is just visual feedback
      }

      textNodes.push(safeTextNode);
    } catch (nodeErr) {
      console.error('Error processing text node:', nodeErr);
      // Skip this node but continue with others
    }
  }

  // Recursively process children of container nodes
  if ('children' in node) {
    for (const child of node.children) {
      await findTextNodes(child, nodePath, depth + 1, textNodes);
    }
  }
}

// Replace text in a specific node
async function setMultipleTextContents(params) {
  const { nodeId, text } = params || {};
  const commandId = params.commandId || generateCommandId();

  if (!nodeId || !text || !Array.isArray(text)) {
    const errorMsg = 'Missing required parameters: nodeId and text array';

    // Send error progress update
    sendProgressUpdate(commandId, 'set_multiple_text_contents', 'error', 0, 0, 0, errorMsg, {
      error: errorMsg,
    });

    throw new Error(errorMsg);
  }

  console.log(
    `Starting text replacement for node: ${nodeId} with ${text.length} text replacements`
  );

  // Send started progress update
  sendProgressUpdate(
    commandId,
    'set_multiple_text_contents',
    'started',
    0,
    text.length,
    0,
    `Starting text replacement for ${text.length} nodes`,
    { totalReplacements: text.length }
  );

  // Define the results array and counters
  const results = [];
  let successCount = 0;
  let failureCount = 0;

  // Split text replacements into chunks of 5
  const CHUNK_SIZE = 5;
  const chunks = [];

  for (let i = 0; i < text.length; i += CHUNK_SIZE) {
    chunks.push(text.slice(i, i + CHUNK_SIZE));
  }

  console.log(`Split ${text.length} replacements into ${chunks.length} chunks`);

  // Send chunking info update
  sendProgressUpdate(
    commandId,
    'set_multiple_text_contents',
    'in_progress',
    5, // 5% progress for planning phase
    text.length,
    0,
    `Preparing to replace text in ${text.length} nodes using ${chunks.length} chunks`,
    {
      totalReplacements: text.length,
      chunks: chunks.length,
      chunkSize: CHUNK_SIZE,
    }
  );

  // Process each chunk sequentially
  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    const chunk = chunks[chunkIndex];
    console.log(
      `Processing chunk ${chunkIndex + 1}/${chunks.length} with ${chunk.length} replacements`
    );

    // Send chunk processing start update
    sendProgressUpdate(
      commandId,
      'set_multiple_text_contents',
      'in_progress',
      Math.round(5 + (chunkIndex / chunks.length) * 90), // 5-95% for processing
      text.length,
      successCount + failureCount,
      `Processing text replacements chunk ${chunkIndex + 1}/${chunks.length}`,
      {
        currentChunk: chunkIndex + 1,
        totalChunks: chunks.length,
        successCount,
        failureCount,
      }
    );

    // Process replacements within a chunk in parallel
    const chunkPromises = chunk.map(async (replacement) => {
      if (!replacement.nodeId || replacement.text === undefined) {
        console.error(`Missing nodeId or text for replacement`);
        return {
          success: false,
          nodeId: replacement.nodeId || 'unknown',
          error: 'Missing nodeId or text in replacement entry',
        };
      }

      try {
        console.log(`Attempting to replace text in node: ${replacement.nodeId}`);

        // Get the text node to update (just to check it exists and get original text)
        const textNode = await figma.getNodeByIdAsync(replacement.nodeId);

        if (!textNode) {
          console.error(`Text node not found: ${replacement.nodeId}`);
          return {
            success: false,
            nodeId: replacement.nodeId,
            error: `Node not found: ${replacement.nodeId}`,
          };
        }

        if (textNode.type !== 'TEXT') {
          console.error(
            `Node is not a text node: ${replacement.nodeId} (type: ${textNode.type})`
          );
          return {
            success: false,
            nodeId: replacement.nodeId,
            error: `Node is not a text node: ${replacement.nodeId} (type: ${textNode.type})`,
          };
        }

        // Save original text for the result
        const originalText = textNode.characters;
        console.log(`Original text: "${originalText}"`);
        console.log(`Will translate to: "${replacement.text}"`);

        // Highlight the node before changing text
        let originalFills;
        try {
          // Save original fills for restoration later
          originalFills = JSON.parse(JSON.stringify(textNode.fills));
          // Apply highlight color (orange with 30% opacity)
          textNode.fills = [
            {
              type: 'SOLID',
              color: { r: 1, g: 0.5, b: 0 },
              opacity: 0.3,
            },
          ];
        } catch (highlightErr) {
          console.error(`Error highlighting text node: ${highlightErr.message}`);
          // Continue anyway, highlighting is just visual feedback
        }

        // Use the existing setTextContent function to handle font loading and text setting
        await setTextContent({
          nodeId: replacement.nodeId,
          text: replacement.text,
        });

        // Keep highlight for a moment after text change, then restore original fills
        if (originalFills) {
          try {
            // Use delay function for consistent timing
            await delay(500);
            textNode.fills = originalFills;
          } catch (restoreErr) {
            console.error(`Error restoring fills: ${restoreErr.message}`);
          }
        }

        console.log(`Successfully replaced text in node: ${replacement.nodeId}`);
        return {
          success: true,
          nodeId: replacement.nodeId,
          originalText: originalText,
          translatedText: replacement.text,
        };
      } catch (error) {
        console.error(`Error replacing text in node ${replacement.nodeId}: ${error.message}`);
        return {
          success: false,
          nodeId: replacement.nodeId,
          error: `Error applying replacement: ${error.message}`,
        };
      }
    });

    // Wait for all replacements in this chunk to complete
    const chunkResults = await Promise.all(chunkPromises);

    // Process results for this chunk
    chunkResults.forEach((result) => {
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
      results.push(result);
    });

    // Send chunk processing complete update with partial results
    sendProgressUpdate(
      commandId,
      'set_multiple_text_contents',
      'in_progress',
      Math.round(5 + ((chunkIndex + 1) / chunks.length) * 90), // 5-95% for processing
      text.length,
      successCount + failureCount,
      `Completed chunk ${chunkIndex + 1}/${
        chunks.length
      }. ${successCount} successful, ${failureCount} failed so far.`,
      {
        currentChunk: chunkIndex + 1,
        totalChunks: chunks.length,
        successCount,
        failureCount,
        chunkResults: chunkResults,
      }
    );

    // Add a small delay between chunks to avoid overloading Figma
    if (chunkIndex < chunks.length - 1) {
      console.log('Pausing between chunks to avoid overloading Figma...');
      await delay(1000); // 1 second delay between chunks
    }
  }

  console.log(`Replacement complete: ${successCount} successful, ${failureCount} failed`);

  // Send completed progress update
  sendProgressUpdate(
    commandId,
    'set_multiple_text_contents',
    'completed',
    100,
    text.length,
    successCount + failureCount,
    `Text replacement complete: ${successCount} successful, ${failureCount} failed`,
    {
      totalReplacements: text.length,
      replacementsApplied: successCount,
      replacementsFailed: failureCount,
      completedInChunks: chunks.length,
      results: results,
    }
  );

  return {
    success: successCount > 0,
    nodeId: nodeId,
    replacementsApplied: successCount,
    replacementsFailed: failureCount,
    totalReplacements: text.length,
    results: results,
    completedInChunks: chunks.length,
    commandId,
  };
}

// Function to generate simple UUIDs for command IDs
function generateCommandId() {
  return (
    'cmd_' +
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

async function setAutoLayout(params) {
  const {
    nodeId,
    layoutMode,
    paddingTop,
    paddingBottom,
    paddingLeft,
    paddingRight,
    itemSpacing,
    primaryAxisAlignItems,
    counterAxisAlignItems,
    layoutWrap,
    strokesIncludedInLayout,
  } = params || {};

  if (!nodeId) {
    throw new Error('Missing nodeId parameter');
  }

  if (!layoutMode) {
    throw new Error('Missing layoutMode parameter');
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) {
    throw new Error(`Node not found with ID: ${nodeId}`);
  }

  // Check if the node is a frame or group
  if (!('layoutMode' in node)) {
    throw new Error(`Node does not support auto layout: ${nodeId}`);
  }

  // Configure layout mode
  if (layoutMode === 'NONE') {
    node.layoutMode = 'NONE';
  } else {
    // Set auto layout properties
    node.layoutMode = layoutMode;

    // Configure padding if provided
    if (paddingTop !== undefined) node.paddingTop = paddingTop;
    if (paddingBottom !== undefined) node.paddingBottom = paddingBottom;
    if (paddingLeft !== undefined) node.paddingLeft = paddingLeft;
    if (paddingRight !== undefined) node.paddingRight = paddingRight;

    // Configure item spacing
    if (itemSpacing !== undefined) node.itemSpacing = itemSpacing;

    // Configure alignment
    if (primaryAxisAlignItems !== undefined) {
      node.primaryAxisAlignItems = primaryAxisAlignItems;
    }

    if (counterAxisAlignItems !== undefined) {
      node.counterAxisAlignItems = counterAxisAlignItems;
    }

    // Configure wrap
    if (layoutWrap !== undefined) {
      node.layoutWrap = layoutWrap;
    }

    // Configure stroke inclusion
    if (strokesIncludedInLayout !== undefined) {
      node.strokesIncludedInLayout = strokesIncludedInLayout;
    }
  }

  return {
    id: node.id,
    name: node.name,
    layoutMode: node.layoutMode,
    paddingTop: node.paddingTop,
    paddingBottom: node.paddingBottom,
    paddingLeft: node.paddingLeft,
    paddingRight: node.paddingRight,
    itemSpacing: node.itemSpacing,
    primaryAxisAlignItems: node.primaryAxisAlignItems,
    counterAxisAlignItems: node.counterAxisAlignItems,
    layoutWrap: node.layoutWrap,
    strokesIncludedInLayout: node.strokesIncludedInLayout,
  };
}

// Nuevas funciones para propiedades de texto

async function setFontName(params) {
  const { nodeId, family, style } = params || {};
  if (!nodeId || !family) {
    throw new Error('Missing nodeId or font family');
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) {
    throw new Error(`Node not found with ID: ${nodeId}`);
  }

  if (node.type !== 'TEXT') {
    throw new Error(`Node is not a text node: ${nodeId}`);
  }

  try {
    await figma.loadFontAsync({ family, style: style || 'Regular' });
    node.fontName = { family, style: style || 'Regular' };
    return {
      id: node.id,
      name: node.name,
      fontName: node.fontName,
    };
  } catch (error) {
    throw new Error(`Error setting font name: ${error.message}`);
  }
}

async function setFontSize(params) {
  const { nodeId, fontSize } = params || {};
  if (!nodeId || fontSize === undefined) {
    throw new Error('Missing nodeId or fontSize');
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) {
    throw new Error(`Node not found with ID: ${nodeId}`);
  }

  if (node.type !== 'TEXT') {
    throw new Error(`Node is not a text node: ${nodeId}`);
  }

  try {
    await figma.loadFontAsync(node.fontName);
    node.fontSize = fontSize;
    return {
      id: node.id,
      name: node.name,
      fontSize: node.fontSize,
    };
  } catch (error) {
    throw new Error(`Error setting font size: ${error.message}`);
  }
}

async function setFontWeight(params) {
  const { nodeId, weight } = params || {};
  if (!nodeId || weight === undefined) {
    throw new Error('Missing nodeId or weight');
  }

  // Map weight to font style
  const getFontStyle = (weight) => {
    switch (weight) {
      case 100:
        return 'Thin';
      case 200:
        return 'Extra Light';
      case 300:
        return 'Light';
      case 400:
        return 'Regular';
      case 500:
        return 'Medium';
      case 600:
        return 'Semi Bold';
      case 700:
        return 'Bold';
      case 800:
        return 'Extra Bold';
      case 900:
        return 'Black';
      default:
        return 'Regular';
    }
  };

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) {
    throw new Error(`Node not found with ID: ${nodeId}`);
  }

  if (node.type !== 'TEXT') {
    throw new Error(`Node is not a text node: ${nodeId}`);
  }

  try {
    const family = node.fontName.family;
    const style = getFontStyle(weight);
    await figma.loadFontAsync({ family, style });
    node.fontName = { family, style };
    return {
      id: node.id,
      name: node.name,
      fontName: node.fontName,
      weight: weight,
    };
  } catch (error) {
    throw new Error(`Error setting font weight: ${error.message}`);
  }
}

async function setLetterSpacing(params) {
  const { nodeId, letterSpacing, unit = 'PIXELS' } = params || {};
  if (!nodeId || letterSpacing === undefined) {
    throw new Error('Missing nodeId or letterSpacing');
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) {
    throw new Error(`Node not found with ID: ${nodeId}`);
  }

  if (node.type !== 'TEXT') {
    throw new Error(`Node is not a text node: ${nodeId}`);
  }

  try {
    await figma.loadFontAsync(node.fontName);
    node.letterSpacing = { value: letterSpacing, unit };
    return {
      id: node.id,
      name: node.name,
      letterSpacing: node.letterSpacing,
    };
  } catch (error) {
    throw new Error(`Error setting letter spacing: ${error.message}`);
  }
}

async function setLineHeight(params) {
  const { nodeId, lineHeight, unit = 'PIXELS' } = params || {};
  if (!nodeId || lineHeight === undefined) {
    throw new Error('Missing nodeId or lineHeight');
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) {
    throw new Error(`Node not found with ID: ${nodeId}`);
  }

  if (node.type !== 'TEXT') {
    throw new Error(`Node is not a text node: ${nodeId}`);
  }

  try {
    await figma.loadFontAsync(node.fontName);
    node.lineHeight = { value: lineHeight, unit };
    return {
      id: node.id,
      name: node.name,
      lineHeight: node.lineHeight,
    };
  } catch (error) {
    throw new Error(`Error setting line height: ${error.message}`);
  }
}

async function setParagraphSpacing(params) {
  const { nodeId, paragraphSpacing } = params || {};
  if (!nodeId || paragraphSpacing === undefined) {
    throw new Error('Missing nodeId or paragraphSpacing');
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) {
    throw new Error(`Node not found with ID: ${nodeId}`);
  }

  if (node.type !== 'TEXT') {
    throw new Error(`Node is not a text node: ${nodeId}`);
  }

  try {
    await figma.loadFontAsync(node.fontName);
    node.paragraphSpacing = paragraphSpacing;
    return {
      id: node.id,
      name: node.name,
      paragraphSpacing: node.paragraphSpacing,
    };
  } catch (error) {
    throw new Error(`Error setting paragraph spacing: ${error.message}`);
  }
}

async function setTextCase(params) {
  const { nodeId, textCase } = params || {};
  if (!nodeId || textCase === undefined) {
    throw new Error('Missing nodeId or textCase');
  }

  // Valid textCase values: "ORIGINAL", "UPPER", "LOWER", "TITLE"
  if (!['ORIGINAL', 'UPPER', 'LOWER', 'TITLE'].includes(textCase)) {
    throw new Error('Invalid textCase value. Must be one of: ORIGINAL, UPPER, LOWER, TITLE');
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) {
    throw new Error(`Node not found with ID: ${nodeId}`);
  }

  if (node.type !== 'TEXT') {
    throw new Error(`Node is not a text node: ${nodeId}`);
  }

  try {
    await figma.loadFontAsync(node.fontName);
    node.textCase = textCase;
    return {
      id: node.id,
      name: node.name,
      textCase: node.textCase,
    };
  } catch (error) {
    throw new Error(`Error setting text case: ${error.message}`);
  }
}

async function setTextDecoration(params) {
  const { nodeId, textDecoration } = params || {};
  if (!nodeId || textDecoration === undefined) {
    throw new Error('Missing nodeId or textDecoration');
  }

  // Valid textDecoration values: "NONE", "UNDERLINE", "STRIKETHROUGH"
  if (!['NONE', 'UNDERLINE', 'STRIKETHROUGH'].includes(textDecoration)) {
    throw new Error(
      'Invalid textDecoration value. Must be one of: NONE, UNDERLINE, STRIKETHROUGH'
    );
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) {
    throw new Error(`Node not found with ID: ${nodeId}`);
  }

  if (node.type !== 'TEXT') {
    throw new Error(`Node is not a text node: ${nodeId}`);
  }

  try {
    await figma.loadFontAsync(node.fontName);
    node.textDecoration = textDecoration;
    return {
      id: node.id,
      name: node.name,
      textDecoration: node.textDecoration,
    };
  } catch (error) {
    throw new Error(`Error setting text decoration: ${error.message}`);
  }
}

async function getStyledTextSegments(params) {
  const { nodeId, property } = params || {};
  if (!nodeId || !property) {
    throw new Error('Missing nodeId or property');
  }

  // Valid properties: "fillStyleId", "fontName", "fontSize", "textCase",
  // "textDecoration", "textStyleId", "fills", "letterSpacing", "lineHeight", "fontWeight"
  const validProperties = [
    'fillStyleId',
    'fontName',
    'fontSize',
    'textCase',
    'textDecoration',
    'textStyleId',
    'fills',
    'letterSpacing',
    'lineHeight',
    'fontWeight',
  ];

  if (!validProperties.includes(property)) {
    throw new Error(`Invalid property. Must be one of: ${validProperties.join(', ')}`);
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) {
    throw new Error(`Node not found with ID: ${nodeId}`);
  }

  if (node.type !== 'TEXT') {
    throw new Error(`Node is not a text node: ${nodeId}`);
  }

  try {
    const segments = node.getStyledTextSegments([property]);

    // Prepare segments data in a format safe for serialization
    const safeSegments = segments.map((segment) => {
      const safeSegment = {
        characters: segment.characters,
        start: segment.start,
        end: segment.end,
      };

      // Handle different property types for safe serialization
      if (property === 'fontName') {
        if (segment[property] && typeof segment[property] === 'object') {
          safeSegment[property] = {
            family: segment[property].family || '',
            style: segment[property].style || '',
          };
        } else {
          safeSegment[property] = { family: '', style: '' };
        }
      } else if (property === 'letterSpacing' || property === 'lineHeight') {
        // Handle spacing properties which have a value and unit
        if (segment[property] && typeof segment[property] === 'object') {
          safeSegment[property] = {
            value: segment[property].value || 0,
            unit: segment[property].unit || 'PIXELS',
          };
        } else {
          safeSegment[property] = { value: 0, unit: 'PIXELS' };
        }
      } else if (property === 'fills') {
        // Handle fills which can be complex
        safeSegment[property] = segment[property]
          ? JSON.parse(JSON.stringify(segment[property]))
          : [];
      } else {
        // Handle simple properties
        safeSegment[property] = segment[property];
      }

      return safeSegment;
    });

    return {
      id: node.id,
      name: node.name,
      property: property,
      segments: safeSegments,
    };
  } catch (error) {
    throw new Error(`Error getting styled text segments: ${error.message}`);
  }
}

async function loadFontAsyncWrapper(params) {
  const { family, style = 'Regular' } = params || {};
  if (!family) {
    throw new Error('Missing font family');
  }

  try {
    await figma.loadFontAsync({ family, style });
    return {
      success: true,
      family: family,
      style: style,
      message: `Successfully loaded ${family} ${style}`,
    };
  } catch (error) {
    throw new Error(`Error loading font: ${error.message}`);
  }
}

async function getRemoteComponents() {
  try {
    console.log('[REMOTE_COMPONENTS] Starting comprehensive component discovery...');
    
    // Load all pages to ensure we can search the entire document
    console.log('[REMOTE_COMPONENTS] Loading all pages...');
    await figma.loadAllPagesAsync();
    
    console.log('[REMOTE_COMPONENTS] Searching using findAllWithCriteria for better performance...');
    
    // Use the more efficient findAllWithCriteria method
    const localComponents = figma.root.findAllWithCriteria({
      types: ['COMPONENT'],
    });
    
    // Find all component instances
    const instances = figma.root.findAllWithCriteria({
      types: ['INSTANCE'],
    });
    
    // Find component sets as well
    const componentSets = figma.root.findAllWithCriteria({
      types: ['COMPONENT_SET'],
    });
    
    console.log(`[REMOTE_COMPONENTS] Found ${localComponents.length} components, ${instances.length} instances, ${componentSets.length} component sets`);
    
    // Create a comprehensive map to track unique components
    const componentMap = new Map();
    
    // Add local components (including those in document)
    localComponents.forEach(component => {
      if (component.key) {
        componentMap.set(component.key, {
          key: component.key,
          id: component.id,
          name: component.name,
          description: component.description || '',
          remote: component.remote || false,
          type: component.remote ? 'imported_component' : 'local_component',
          parent: component.parent ? component.parent.name : null,
          page: component.parent && component.parent.type === 'PAGE' ? component.parent.name : 'unknown'
        });
      }
    });
    
    // Add components from component sets
    componentSets.forEach(componentSet => {
      componentSet.children.forEach(component => {
        if (component.type === 'COMPONENT' && component.key) {
          componentMap.set(component.key, {
            key: component.key,
            id: component.id,
            name: component.name,
            description: component.description || '',
            remote: component.remote || false,
            type: component.remote ? 'imported_variant' : 'local_variant',
            parent: componentSet.name,
            variantSet: componentSet.name
          });
        }
      });
    });
    
    // Add components discovered from instances (team library components in use)
    console.log(`[REMOTE_COMPONENTS] Analyzing ${instances.length} instances for team library components...`);
    
    const instanceAnalysisPromises = instances.map(async (instance) => {
      try {
        // Use getMainComponentAsync for proper team library access
        const mainComponent = await instance.getMainComponentAsync();
        if (mainComponent && mainComponent.key) {
          const instanceInfo = {
            instanceId: instance.id,
            instanceName: instance.name,
            componentKey: mainComponent.key,
            componentId: mainComponent.id,
            componentName: mainComponent.name,
            isRemote: mainComponent.remote || false,
            description: mainComponent.description || ''
          };
          
          console.log(`[REMOTE_COMPONENTS] Found component: ${mainComponent.name} (remote: ${mainComponent.remote})`);
          return instanceInfo;
        }
      } catch (error) {
        console.log(`[REMOTE_COMPONENTS] Could not resolve component for instance ${instance.id}: ${error.message}`);
      }
      return null;
    });
    
    // Wait for all instance analysis to complete
    const instanceResults = await Promise.all(instanceAnalysisPromises);
    const validInstanceResults = instanceResults.filter(result => result !== null);
    
    console.log(`[REMOTE_COMPONENTS] Successfully analyzed ${validInstanceResults.length} instances`);
    
    // Group by component key to count instances and avoid duplicates
    const componentFromInstancesMap = new Map();
    validInstanceResults.forEach(instanceInfo => {
      if (!componentFromInstancesMap.has(instanceInfo.componentKey)) {
        componentFromInstancesMap.set(instanceInfo.componentKey, {
          key: instanceInfo.componentKey,
          id: instanceInfo.componentId,
          name: instanceInfo.componentName,
          description: instanceInfo.description,
          remote: instanceInfo.isRemote,
          type: instanceInfo.isRemote ? 'team_library_component' : 'local_component_from_instance',
          instanceCount: 1,
          instances: [{ id: instanceInfo.instanceId, name: instanceInfo.instanceName }]
        });
      } else {
        const existing = componentFromInstancesMap.get(instanceInfo.componentKey);
        existing.instanceCount++;
        existing.instances.push({ id: instanceInfo.instanceId, name: instanceInfo.instanceName });
      }
    });
    
    // Add these components to the main map, but don't overwrite local components
    componentFromInstancesMap.forEach((componentInfo, key) => {
      if (!componentMap.has(key)) {
        componentMap.set(key, componentInfo);
      } else {
        // Update instance count for existing components
        const existing = componentMap.get(key);
        existing.instanceCount = (existing.instanceCount || 0) + componentInfo.instanceCount;
        existing.instances = componentInfo.instances;
      }
    });
    
    const allComponents = Array.from(componentMap.values());
    
    // Organize by type for better reporting
    const byType = {
      local_component: allComponents.filter(c => c.type === 'local_component').length,
      local_variant: allComponents.filter(c => c.type === 'local_variant').length,
      imported_component: allComponents.filter(c => c.type === 'imported_component').length,
      imported_variant: allComponents.filter(c => c.type === 'imported_variant').length,
      team_library_component: allComponents.filter(c => c.type === 'team_library_component').length
    };
    
    console.log(`[REMOTE_COMPONENTS] Component breakdown:`, byType);
    console.log(`[REMOTE_COMPONENTS] Total unique components found: ${allComponents.length}`);
    
    return {
      success: true,
      source: 'comprehensive_scan',
      count: allComponents.length,
      breakdown: byType,
      components: allComponents.sort((a, b) => a.name.localeCompare(b.name))
    };
    
  } catch (error) {
    console.error('[REMOTE_COMPONENTS] Error getting components:', error);
    throw new Error(`Error getting components: ${error.message}`);
  }
}

// Get Team Library Analysis
async function getTeamLibraryAnalysis() {
  try {
    console.log('[TEAM_LIBRARY_ANALYSIS] Starting team library component analysis...');
    
    // Load all pages to ensure complete analysis
    await figma.loadAllPagesAsync();
    
    // Find all instances to analyze their source components
    const allInstances = figma.root.findAllWithCriteria({
      types: ['INSTANCE'],
    });
    
    console.log(`[TEAM_LIBRARY_ANALYSIS] Found ${allInstances.length} instances to analyze`);
    
    const libraryMap = new Map();
    const analysisPromises = allInstances.map(async (instance) => {
      try {
        const mainComponent = await instance.getMainComponentAsync();
        if (mainComponent && mainComponent.key) {
          const isRemote = mainComponent.remote || false;
          const libraryKey = isRemote ? `team_library_${mainComponent.key.split(':')[0]}` : 'local_document';
          
          if (!libraryMap.has(libraryKey)) {
            libraryMap.set(libraryKey, {
              libraryType: isRemote ? 'team_library' : 'local_document',
              components: new Map(),
              totalInstances: 0
            });
          }
          
          const library = libraryMap.get(libraryKey);
          library.totalInstances++;
          
          if (!library.components.has(mainComponent.key)) {
            library.components.set(mainComponent.key, {
              key: mainComponent.key,
              id: mainComponent.id,
              name: mainComponent.name,
              description: mainComponent.description || '',
              remote: isRemote,
              instanceCount: 1,
              sampleInstance: {
                id: instance.id,
                name: instance.name,
                page: instance.parent && instance.parent.type === 'PAGE' ? instance.parent.name : 'unknown'
              }
            });
          } else {
            library.components.get(mainComponent.key).instanceCount++;
          }
        }
      } catch (error) {
        console.log(`[TEAM_LIBRARY_ANALYSIS] Could not analyze instance ${instance.id}: ${error.message}`);
      }
    });
    
    await Promise.all(analysisPromises);
    
    // Convert to result format
    const libraries = [];
    libraryMap.forEach((library, libraryKey) => {
      libraries.push({
        libraryId: libraryKey,
        type: library.libraryType,
        componentCount: library.components.size,
        totalInstances: library.totalInstances,
        components: Array.from(library.components.values()).sort((a, b) => a.name.localeCompare(b.name))
      });
    });
    
    // Sort libraries by component count
    libraries.sort((a, b) => b.componentCount - a.componentCount);
    
    const summary = {
      totalLibraries: libraries.length,
      totalUniqueComponents: libraries.reduce((sum, lib) => sum + lib.componentCount, 0),
      totalInstances: libraries.reduce((sum, lib) => sum + lib.totalInstances, 0),
      teamLibraries: libraries.filter(lib => lib.type === 'team_library').length,
      localComponents: libraries.filter(lib => lib.type === 'local_document').length
    };
    
    console.log(`[TEAM_LIBRARY_ANALYSIS] Analysis complete:`, summary);
    
    return {
      success: true,
      summary,
      libraries,
      apiLimitations: {
        note: 'Figma Plugin API cannot browse team library catalogs directly',
        explanation: 'Components are discovered only through existing instances in the document',
        recommendation: 'To access more components, create instances of desired components first'
      }
    };
    
  } catch (error) {
    console.error('[TEAM_LIBRARY_ANALYSIS] Error analyzing team libraries:', error);
    throw new Error(`Error analyzing team libraries: ${error.message}`);
  }
}

// Set Effects Tool
async function setEffects(params) {
  const { nodeId, effects } = params || {};

  if (!nodeId) {
    throw new Error('Missing nodeId parameter');
  }

  if (!effects || !Array.isArray(effects)) {
    throw new Error('Missing or invalid effects parameter. Must be an array.');
  }

  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node) {
    throw new Error(`Node not found with ID: ${nodeId}`);
  }

  if (!('effects' in node)) {
    throw new Error(`Node does not support effects: ${nodeId}`);
  }

  try {
    // Convert incoming effects to valid Figma effects
    const validEffects = effects.map((effect) => {
      // Ensure all effects have the required properties
      if (!effect.type) {
        throw new Error('Each effect must have a type property');
      }

      // Create a clean effect object based on type
      switch (effect.type) {
        case 'DROP_SHADOW':
        case 'INNER_SHADOW':
          return {
            type: effect.type,
            color: effect.color || { r: 0, g: 0, b: 0, a: 0.5 },
            offset: effect.offset || { x: 0, y: 0 },
            radius: effect.radius || 5,
            spread: effect.spread || 0,
            visible: effect.visible !== undefined ? effect.visible : true,
            blendMode: effect.blendMode || 'NORMAL',
          };
        case 'LAYER_BLUR':
        case 'BACKGROUND_BLUR':
          return {
            type: effect.type,
            radius: effect.radius || 5,
            visible: effect.visible !== undefined ? effect.visible : true,
          };
        default:
          throw new Error(`Unsupported effect type: ${effect.type}`);
      }
    });

    // Apply the effects to the node
    node.effects = validEffects;

    return {
      id: node.id,
      name: node.name,
      effects: node.effects,
    };
  } catch (error) {
    throw new Error(`Error setting effects: ${error.message}`);
  }
}

// Set Effect Style ID Tool
async function setEffectStyleId(params) {
  const { nodeId, effectStyleId } = params || {};

  if (!nodeId) {
    throw new Error('Missing nodeId parameter');
  }

  if (!effectStyleId) {
    throw new Error('Missing effectStyleId parameter');
  }

  try {
    // Set up a manual timeout to detect long operations
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(
          new Error(
            'Timeout while setting effect style ID (8s). The operation took too long to complete.'
          )
        );
      }, 8000); // 8 seconds timeout
    });

    console.log(`Starting to set effect style ID ${effectStyleId} on node ${nodeId}...`);

    // Get node and validate in a promise
    const nodePromise = (async () => {
      const node = await figma.getNodeByIdAsync(nodeId);
      if (!node) {
        throw new Error(`Node not found with ID: ${nodeId}`);
      }

      if (!('effectStyleId' in node)) {
        throw new Error(`Node with ID ${nodeId} does not support effect styles`);
      }

      // Try to validate the effect style exists before applying
      console.log(`Fetching effect styles to validate style ID: ${effectStyleId}`);
      const effectStyles = await figma.getLocalEffectStylesAsync();
      const foundStyle = effectStyles.find((style) => style.id === effectStyleId);

      if (!foundStyle) {
        throw new Error(
          `Effect style not found with ID: ${effectStyleId}. Available styles: ${effectStyles.length}`
        );
      }

      console.log(`Effect style found, applying to node...`);

      // Apply the effect style to the node
      node.effectStyleId = effectStyleId;

      return {
        id: node.id,
        name: node.name,
        effectStyleId: node.effectStyleId,
        appliedEffects: node.effects,
      };
    })();

    // Race between the node operation and the timeout
    const result = await Promise.race([nodePromise, timeoutPromise]).finally(() => {
      // Clear the timeout to prevent memory leaks
      clearTimeout(timeoutId);
    });

    console.log(`Successfully set effect style ID on node ${nodeId}`);
    return result;
  } catch (error) {
    console.error(`Error setting effect style ID: ${error.message || 'Unknown error'}`);
    console.error(`Stack trace: ${error.stack || 'Not available'}`);

    // Proporcionar mensajes de error específicos para diferentes casos
    if (error.message.includes('timeout') || error.message.includes('Timeout')) {
      throw new Error(
        `The operation timed out after 8 seconds. This could happen with complex nodes or effects. Try with a simpler node or effect style.`
      );
    } else if (error.message.includes('not found') && error.message.includes('Node')) {
      throw new Error(
        `Node with ID "${nodeId}" not found. Make sure the node exists in the current document.`
      );
    } else if (error.message.includes('not found') && error.message.includes('style')) {
      throw new Error(
        `Effect style with ID "${effectStyleId}" not found. Make sure the style exists in your local styles.`
      );
    } else if (error.message.includes('does not support')) {
      throw new Error(
        `The selected node type does not support effect styles. Only certain node types like frames, components, and instances can have effect styles.`
      );
    } else {
      throw new Error(`Error setting effect style ID: ${error.message}`);
    }
  }
}

// Function to group nodes
async function groupNodes(params) {
  const { nodeIds, name } = params || {};

  if (!nodeIds || !Array.isArray(nodeIds) || nodeIds.length < 2) {
    throw new Error('Must provide at least two nodeIds to group');
  }

  try {
    // Get all nodes to be grouped
    const nodesToGroup = [];
    for (const nodeId of nodeIds) {
      const node = await figma.getNodeByIdAsync(nodeId);
      if (!node) {
        throw new Error(`Node not found with ID: ${nodeId}`);
      }
      nodesToGroup.push(node);
    }

    // Verify that all nodes have the same parent
    const parent = nodesToGroup[0].parent;
    for (const node of nodesToGroup) {
      if (node.parent !== parent) {
        throw new Error('All nodes must have the same parent to be grouped');
      }
    }

    // Create a group and add the nodes to it
    const group = figma.group(nodesToGroup, parent);

    // Optionally set a name for the group
    if (name) {
      group.name = name;
    }

    return {
      id: group.id,
      name: group.name,
      type: group.type,
      children: group.children.map((child) => ({
        id: child.id,
        name: child.name,
        type: child.type,
      })),
    };
  } catch (error) {
    throw new Error(`Error grouping nodes: ${error.message}`);
  }
}

// Function to ungroup nodes
async function ungroupNodes(params) {
  const { nodeId } = params || {};

  if (!nodeId) {
    throw new Error('Missing nodeId parameter');
  }

  try {
    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node) {
      throw new Error(`Node not found with ID: ${nodeId}`);
    }

    // Verify that the node is a group or a frame
    if (node.type !== 'GROUP' && node.type !== 'FRAME') {
      throw new Error(`Node with ID ${nodeId} is not a GROUP or FRAME`);
    }

    // Get the parent and children before ungrouping
    const parent = node.parent;
    const children = [...node.children];

    // Ungroup the node
    const ungroupedItems = figma.ungroup(node);

    return {
      success: true,
      ungroupedCount: ungroupedItems.length,
      items: ungroupedItems.map((item) => ({ id: item.id, name: item.name, type: item.type })),
    };
  } catch (error) {
    throw new Error(`Error ungrouping node: ${error.message}`);
  }
}

// Function to flatten nodes (e.g., boolean operations, convert to path)
async function flattenNode(params) {
  const { nodeId } = params || {};

  if (!nodeId) {
    throw new Error('Missing nodeId parameter');
  }

  try {
    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node) {
      throw new Error(`Node not found with ID: ${nodeId}`);
    }

    // Check for specific node types that can be flattened
    const flattenableTypes = [
      'VECTOR',
      'BOOLEAN_OPERATION',
      'STAR',
      'POLYGON',
      'ELLIPSE',
      'RECTANGLE',
    ];

    if (!flattenableTypes.includes(node.type)) {
      throw new Error(
        `Node with ID ${nodeId} and type ${node.type} cannot be flattened. Only vector-based nodes can be flattened.`
      );
    }

    // Verify the node has the flatten method before calling it
    if (typeof node.flatten !== 'function') {
      throw new Error(`Node with ID ${nodeId} does not support the flatten operation.`);
    }

    // Implement a timeout mechanism
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(
          new Error(
            'Flatten operation timed out after 8 seconds. The node may be too complex.'
          )
        );
      }, 8000); // 8 seconds timeout
    });

    // Execute the flatten operation in a promise
    const flattenPromise = new Promise((resolve, reject) => {
      // Execute in the next tick to allow UI updates
      setTimeout(() => {
        try {
          console.log(`Starting flatten operation for node ID ${nodeId}...`);
          const flattened = node.flatten();
          console.log(`Flatten operation completed successfully for node ID ${nodeId}`);
          resolve(flattened);
        } catch (err) {
          console.error(`Error during flatten operation: ${err.message}`);
          reject(err);
        }
      }, 0);
    });

    // Race between the timeout and the operation
    const flattened = await Promise.race([flattenPromise, timeoutPromise]).finally(() => {
      // Clear the timeout to prevent memory leaks
      clearTimeout(timeoutId);
    });

    return {
      id: flattened.id,
      name: flattened.name,
      type: flattened.type,
    };
  } catch (error) {
    console.error(`Error in flattenNode: ${error.message}`);
    if (error.message.includes('timed out')) {
      // Provide a more helpful message for timeout errors
      throw new Error(
        `The flatten operation timed out. This usually happens with complex nodes. Try simplifying the node first or breaking it into smaller parts.`
      );
    } else {
      throw new Error(`Error flattening node: ${error.message}`);
    }
  }
}

// Function to insert a child into a parent node
async function insertChild(params) {
  const { parentId, childId, index } = params || {};

  if (!parentId) {
    throw new Error('Missing parentId parameter');
  }

  if (!childId) {
    throw new Error('Missing childId parameter');
  }

  try {
    // Get the parent and child nodes
    const parent = await figma.getNodeByIdAsync(parentId);
    if (!parent) {
      throw new Error(`Parent node not found with ID: ${parentId}`);
    }

    const child = await figma.getNodeByIdAsync(childId);
    if (!child) {
      throw new Error(`Child node not found with ID: ${childId}`);
    }

    // Check if the parent can have children
    if (!('appendChild' in parent)) {
      throw new Error(`Parent node with ID ${parentId} cannot have children`);
    }

    // Save child's current parent for proper handling
    const originalParent = child.parent;

    // Insert the child at the specified index or append it
    if (index !== undefined && index >= 0 && index <= parent.children.length) {
      parent.insertChild(index, child);
    } else {
      parent.appendChild(child);
    }

    // Verify that the insertion worked
    const newIndex = parent.children.indexOf(child);

    return {
      parentId: parent.id,
      childId: child.id,
      index: newIndex,
      success: newIndex !== -1,
      previousParentId: originalParent ? originalParent.id : null,
    };
  } catch (error) {
    console.error(`Error inserting child: ${error.message}`, error);
    throw new Error(`Error inserting child: ${error.message}`);
  }
}

async function createEllipse(params) {
  const {
    x = 0,
    y = 0,
    width = 100,
    height = 100,
    name = 'Ellipse',
    parentId,
    fillColor = { r: 0.8, g: 0.8, b: 0.8, a: 1 },
    strokeColor,
    strokeWeight,
  } = params || {};

  // Create a new ellipse node
  const ellipse = figma.createEllipse();
  ellipse.name = name;

  // Position and size the ellipse
  ellipse.x = x;
  ellipse.y = y;
  ellipse.resize(width, height);

  // Set fill color if provided
  if (fillColor) {
    const fillStyle = {
      type: 'SOLID',
      color: {
        r: parseFloat(fillColor.r) || 0,
        g: parseFloat(fillColor.g) || 0,
        b: parseFloat(fillColor.b) || 0,
      },
      opacity: parseFloat(fillColor.a) || 1,
    };
    ellipse.fills = [fillStyle];
  }

  // Set stroke color and weight if provided
  if (strokeColor) {
    const strokeStyle = {
      type: 'SOLID',
      color: {
        r: parseFloat(strokeColor.r) || 0,
        g: parseFloat(strokeColor.g) || 0,
        b: parseFloat(strokeColor.b) || 0,
      },
      opacity: parseFloat(strokeColor.a) || 1,
    };
    ellipse.strokes = [strokeStyle];

    if (strokeWeight) {
      ellipse.strokeWeight = strokeWeight;
    }
  }

  // If parentId is provided, append to that node, otherwise append to current page
  if (parentId) {
    const parentNode = await figma.getNodeByIdAsync(parentId);
    if (!parentNode) {
      throw new Error(`Parent node not found with ID: ${parentId}`);
    }
    if (!('appendChild' in parentNode)) {
      throw new Error(`Parent node does not support children: ${parentId}`);
    }
    parentNode.appendChild(ellipse);
  } else {
    figma.currentPage.appendChild(ellipse);
  }

  return {
    id: ellipse.id,
    name: ellipse.name,
    type: ellipse.type,
    x: ellipse.x,
    y: ellipse.y,
    width: ellipse.width,
    height: ellipse.height,
  };
}

async function createPolygon(params) {
  const {
    x = 0,
    y = 0,
    width = 100,
    height = 100,
    sides = 6,
    name = 'Polygon',
    parentId,
    fillColor,
    strokeColor,
    strokeWeight,
  } = params || {};

  // Create the polygon
  const polygon = figma.createPolygon();
  polygon.x = x;
  polygon.y = y;
  polygon.resize(width, height);
  polygon.name = name;

  // Set the number of sides
  if (sides >= 3) {
    polygon.pointCount = sides;
  }

  // Set fill color if provided
  if (fillColor) {
    const paintStyle = {
      type: 'SOLID',
      color: {
        r: parseFloat(fillColor.r) || 0,
        g: parseFloat(fillColor.g) || 0,
        b: parseFloat(fillColor.b) || 0,
      },
      opacity: parseFloat(fillColor.a) || 1,
    };
    polygon.fills = [paintStyle];
  }

  // Set stroke color and weight if provided
  if (strokeColor) {
    const strokeStyle = {
      type: 'SOLID',
      color: {
        r: parseFloat(strokeColor.r) || 0,
        g: parseFloat(strokeColor.g) || 0,
        b: parseFloat(strokeColor.b) || 0,
      },
      opacity: parseFloat(strokeColor.a) || 1,
    };
    polygon.strokes = [strokeStyle];
  }

  // Set stroke weight if provided
  if (strokeWeight !== undefined) {
    polygon.strokeWeight = strokeWeight;
  }

  // If parentId is provided, append to that node, otherwise append to current page
  if (parentId) {
    const parentNode = await figma.getNodeByIdAsync(parentId);
    if (!parentNode) {
      throw new Error(`Parent node not found with ID: ${parentId}`);
    }
    if (!('appendChild' in parentNode)) {
      throw new Error(`Parent node does not support children: ${parentId}`);
    }
    parentNode.appendChild(polygon);
  } else {
    figma.currentPage.appendChild(polygon);
  }

  return {
    id: polygon.id,
    name: polygon.name,
    type: polygon.type,
    x: polygon.x,
    y: polygon.y,
    width: polygon.width,
    height: polygon.height,
    pointCount: polygon.pointCount,
    fills: polygon.fills,
    strokes: polygon.strokes,
    strokeWeight: polygon.strokeWeight,
    parentId: polygon.parent ? polygon.parent.id : undefined,
  };
}

async function createStar(params) {
  const {
    x = 0,
    y = 0,
    width = 100,
    height = 100,
    points = 5,
    innerRadius = 0.5, // As a proportion of the outer radius
    name = 'Star',
    parentId,
    fillColor,
    strokeColor,
    strokeWeight,
  } = params || {};

  // Create the star
  const star = figma.createStar();
  star.x = x;
  star.y = y;
  star.resize(width, height);
  star.name = name;

  // Set the number of points
  if (points >= 3) {
    star.pointCount = points;
  }

  // Set the inner radius ratio
  if (innerRadius > 0 && innerRadius < 1) {
    star.innerRadius = innerRadius;
  }

  // Set fill color if provided
  if (fillColor) {
    const paintStyle = {
      type: 'SOLID',
      color: {
        r: parseFloat(fillColor.r) || 0,
        g: parseFloat(fillColor.g) || 0,
        b: parseFloat(fillColor.b) || 0,
      },
      opacity: parseFloat(fillColor.a) || 1,
    };
    star.fills = [paintStyle];
  }

  // Set stroke color and weight if provided
  if (strokeColor) {
    const strokeStyle = {
      type: 'SOLID',
      color: {
        r: parseFloat(strokeColor.r) || 0,
        g: parseFloat(strokeColor.g) || 0,
        b: parseFloat(strokeColor.b) || 0,
      },
      opacity: parseFloat(strokeColor.a) || 1,
    };
    star.strokes = [strokeStyle];
  }

  // Set stroke weight if provided
  if (strokeWeight !== undefined) {
    star.strokeWeight = strokeWeight;
  }

  // If parentId is provided, append to that node, otherwise append to current page
  if (parentId) {
    const parentNode = await figma.getNodeByIdAsync(parentId);
    if (!parentNode) {
      throw new Error(`Parent node not found with ID: ${parentId}`);
    }
    if (!('appendChild' in parentNode)) {
      throw new Error(`Parent node does not support children: ${parentId}`);
    }
    parentNode.appendChild(star);
  } else {
    figma.currentPage.appendChild(star);
  }

  return {
    id: star.id,
    name: star.name,
    type: star.type,
    x: star.x,
    y: star.y,
    width: star.width,
    height: star.height,
    pointCount: star.pointCount,
    innerRadius: star.innerRadius,
    fills: star.fills,
    strokes: star.strokes,
    strokeWeight: star.strokeWeight,
    parentId: star.parent ? star.parent.id : undefined,
  };
}

async function createVector(params) {
  const {
    x = 0,
    y = 0,
    width = 100,
    height = 100,
    name = 'Vector',
    parentId,
    vectorPaths = [],
    fillColor,
    strokeColor,
    strokeWeight,
  } = params || {};

  // Create the vector
  const vector = figma.createVector();
  vector.x = x;
  vector.y = y;
  vector.resize(width, height);
  vector.name = name;

  // Set vector paths if provided
  if (vectorPaths && vectorPaths.length > 0) {
    vector.vectorPaths = vectorPaths.map((path) => {
      return {
        windingRule: path.windingRule || 'EVENODD',
        data: path.data || '',
      };
    });
  }

  // Set fill color if provided
  if (fillColor) {
    const paintStyle = {
      type: 'SOLID',
      color: {
        r: parseFloat(fillColor.r) || 0,
        g: parseFloat(fillColor.g) || 0,
        b: parseFloat(fillColor.b) || 0,
      },
      opacity: parseFloat(fillColor.a) || 1,
    };
    vector.fills = [paintStyle];
  }

  // Set stroke color and weight if provided
  if (strokeColor) {
    const strokeStyle = {
      type: 'SOLID',
      color: {
        r: parseFloat(strokeColor.r) || 0,
        g: parseFloat(strokeColor.g) || 0,
        b: parseFloat(strokeColor.b) || 0,
      },
      opacity: parseFloat(strokeColor.a) || 1,
    };
    vector.strokes = [strokeStyle];
  }

  // Set stroke weight if provided
  if (strokeWeight !== undefined) {
    vector.strokeWeight = strokeWeight;
  }

  // If parentId is provided, append to that node, otherwise append to current page
  if (parentId) {
    const parentNode = await figma.getNodeByIdAsync(parentId);
    if (!parentNode) {
      throw new Error(`Parent node not found with ID: ${parentId}`);
    }
    if (!('appendChild' in parentNode)) {
      throw new Error(`Parent node does not support children: ${parentId}`);
    }
    parentNode.appendChild(vector);
  } else {
    figma.currentPage.appendChild(vector);
  }

  return {
    id: vector.id,
    name: vector.name,
    type: vector.type,
    x: vector.x,
    y: vector.y,
    width: vector.width,
    height: vector.height,
    vectorNetwork: vector.vectorNetwork,
    fills: vector.fills,
    strokes: vector.strokes,
    strokeWeight: vector.strokeWeight,
    parentId: vector.parent ? vector.parent.id : undefined,
  };
}

async function createLine(params) {
  const {
    x1 = 0,
    y1 = 0,
    x2 = 100,
    y2 = 0,
    name = 'Line',
    parentId,
    strokeColor = { r: 0, g: 0, b: 0, a: 1 },
    strokeWeight = 1,
    strokeCap = 'NONE', // Can be "NONE", "ROUND", "SQUARE", "ARROW_LINES", or "ARROW_EQUILATERAL"
  } = params || {};

  // Create a vector node to represent the line
  const line = figma.createVector();
  line.name = name;

  // Position the line at the starting point
  line.x = x1;
  line.y = y1;

  // Calculate the vector size
  const width = Math.abs(x2 - x1);
  const height = Math.abs(y2 - y1);
  line.resize(width > 0 ? width : 1, height > 0 ? height : 1);

  // Create vector path data for a straight line
  // SVG path data format: M (move to) starting point, L (line to) ending point
  const dx = x2 - x1;
  const dy = y2 - y1;

  // Calculate relative endpoint coordinates in the vector's local coordinate system
  const endX = dx > 0 ? width : 0;
  const endY = dy > 0 ? height : 0;
  const startX = dx > 0 ? 0 : width;
  const startY = dy > 0 ? 0 : height;

  // Generate SVG path data for the line
  const pathData = `M ${startX} ${startY} L ${endX} ${endY}`;

  // Set vector paths
  line.vectorPaths = [
    {
      windingRule: 'NONZERO',
      data: pathData,
    },
  ];

  // Set stroke color
  const strokeStyle = {
    type: 'SOLID',
    color: {
      r: parseFloat(strokeColor.r) || 0,
      g: parseFloat(strokeColor.g) || 0,
      b: parseFloat(strokeColor.b) || 0,
    },
    opacity: parseFloat(strokeColor.a) || 1,
  };
  line.strokes = [strokeStyle];

  // Set stroke weight
  line.strokeWeight = strokeWeight;

  // Set stroke cap style if supported
  if (['NONE', 'ROUND', 'SQUARE', 'ARROW_LINES', 'ARROW_EQUILATERAL'].includes(strokeCap)) {
    line.strokeCap = strokeCap;
  }

  // Set fill to none (transparent) as lines typically don't have fills
  line.fills = [];

  // If parentId is provided, append to that node, otherwise append to current page
  if (parentId) {
    const parentNode = await figma.getNodeByIdAsync(parentId);
    if (!parentNode) {
      throw new Error(`Parent node not found with ID: ${parentId}`);
    }
    if (!('appendChild' in parentNode)) {
      throw new Error(`Parent node does not support children: ${parentId}`);
    }
    parentNode.appendChild(line);
  } else {
    figma.currentPage.appendChild(line);
  }

  return {
    id: line.id,
    name: line.name,
    type: line.type,
    x: line.x,
    y: line.y,
    width: line.width,
    height: line.height,
    strokeWeight: line.strokeWeight,
    strokeCap: line.strokeCap,
    strokes: line.strokes,
    vectorPaths: line.vectorPaths,
    parentId: line.parent ? line.parent.id : undefined,
  };
}

// Move these functions to the global scope, OUTSIDE of createLine
async function setTextStyleId(params) {
  const { nodeId, textStyleId } = params || {};

  if (!nodeId) {
    throw new Error('Missing nodeId parameter');
  }

  if (!textStyleId) {
    throw new Error('Missing textStyleId parameter');
  }

  try {
    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node) {
      throw new Error(`Node not found with ID: ${nodeId}`);
    }

    if (node.type !== 'TEXT') {
      throw new Error(`Node with ID ${nodeId} is not a text node`);
    }

    // Validate that the text style exists
    const textStyles = await figma.getLocalTextStylesAsync();
    const foundStyle = textStyles.find((style) => style.id === textStyleId);

    if (!foundStyle) {
      throw new Error(`Text style not found with ID: ${textStyleId}`);
    }

    console.log(`Applying text style ${textStyleId} to node ${nodeId}...`);

    // Apply the text style using the async method
    await node.setTextStyleIdAsync(textStyleId);

    console.log(`Successfully applied text style to node ${nodeId}`);

    return {
      id: node.id,
      name: node.name,
      textStyleId: node.textStyleId,
      appliedStyle: foundStyle.name,
    };
  } catch (error) {
    console.error(`Error setting text style ID: ${error.message}`);
    throw new Error(`Error setting text style ID: ${error.message}`);
  }
}

async function setFillStyleId(params) {
  const { nodeId, fillStyleId } = params || {};

  if (!nodeId) {
    throw new Error('Missing nodeId parameter');
  }

  if (!fillStyleId) {
    throw new Error('Missing fillStyleId parameter');
  }

  try {
    const node = await figma.getNodeByIdAsync(nodeId);
    if (!node) {
      throw new Error(`Node not found with ID: ${nodeId}`);
    }

    if (!('setFillStyleIdAsync' in node)) {
      throw new Error(`Node with ID ${nodeId} does not support fill styles`);
    }

    // Validate that the fill style exists
    const fillStyles = await figma.getLocalPaintStylesAsync();
    const foundStyle = fillStyles.find((style) => style.id === fillStyleId);

    if (!foundStyle) {
      throw new Error(`Fill style not found with ID: ${fillStyleId}`);
    }

    console.log(`Applying fill style ${fillStyleId} to node ${nodeId}...`);

    // Apply the fill style using the async method
    await node.setFillStyleIdAsync(fillStyleId);

    console.log(`Successfully applied fill style to node ${nodeId}`);

    return {
      id: node.id,
      name: node.name,
      fillStyleId: node.fillStyleId,
      appliedStyle: foundStyle.name,
    };
  } catch (error) {
    console.error(`Error setting fill style ID: ${error.message}`);
    throw new Error(`Error setting fill style ID: ${error.message}`);
  }
}
