# Claude.md - Figma MCP Enhancement Project

## Project Overview

This repository contains a Figma Model Context Protocol (MCP) server that enables Claude Desktop to interact directly with Figma through a bidirectional WebSocket connection combined with a Figma plugin. The project needs significant enhancement to support robust design system workflows.

## Current State Analysis

### What Works ✅
- **Basic shape creation** (rectangles, ellipses, frames, text)
- **Layout management** (auto layout, positioning, sizing)
- **Style applications** (colors, fonts, strokes, fills)
- **Node manipulation** (move, resize, delete, clone)
- **Document navigation** (get document info, node traversal)
- **Component cloning** (creates instances from existing components)

### Critical Issues ❌
1. **Component Instance Creation Timeout** - `create_component_instance` consistently times out even for simple components
2. **Missing Component Property Management** - No tools to read/set component properties for variant switching
3. **Remote Library Access Timeout** - `get_remote_components` times out when accessing team libraries
4. **Limited Design System Integration** - Cannot properly work with design system components and variants

### Testing Results
During extensive testing with both local and remote library components:
- **Clone-based workflow works** but creates master components instead of instances
- **Direct instance creation fails** consistently due to timeout issues
- **Property modification works** for basic properties but cannot switch component variants
- **Remote library components** can be manually placed and then cloned successfully

## Architecture Context

### Current Architecture
- **WebSocket Server** (Node.js) handles MCP communication with Claude Desktop
- **Figma Plugin** enables write operations and bidirectional communication
- **Channel-based Communication** using unique channel IDs for real-time sync
- **Transport Protocol** uses WebSocket on port 3055 with channel-based routing

### Key Components
- `server/src/index.ts` - MCP server implementation
- `figma-plugin/code.js` - Figma plugin with tool implementations
- `figma-plugin/ui.html` - Plugin UI for WebSocket communication
- WebSocket communication layer for real-time bidirectional data flow

## Design System Requirements

### Target Workflow
1. **Discover Components** - Access both local and remote library components
2. **Create Instances** - Reliably create component instances with proper variant selection
3. **Switch Variants** - Change component properties (Style: Primary→Outlined, Content: Text→Icon+Text)
4. **Batch Operations** - Apply changes across multiple components efficiently
5. **Design System Consistency** - Validate and enforce design system rules

### Critical API Methods Needed
Based on research, the following Figma Plugin API methods are essential:

#### Component Instance Management
```javascript
// Reliable instance creation with timeout handling
figma.importComponentByKeyAsync(componentKey)
ComponentNode.createInstance()
InstanceNode.getMainComponentAsync()
```

#### Component Property Manipulation
```javascript
// Reading component properties
ComponentNode.componentPropertyDefinitions
InstanceNode.componentProperties

// Setting component properties/variants
InstanceNode.setProperties(properties)
InstanceNode.componentProperties = newProperties
```

#### Remote Library Access
```javascript
// Team library component access
figma.teamLibrary.getAvailableComponentsAsync()
figma.importComponentByKeyAsync(key)
```

## Known Technical Challenges

### Timeout Issues
- **Root Cause**: Complex operations blocking the main thread
- **Solution Pattern**: Implement chunking with `setTimeout(resolve, 1)` between operations
- **Error Handling**: Use `Promise.race()` with timeout wrappers

### Component Property Management
- **Challenge**: No existing MCP tools for variant switching
- **Required**: New tools for reading/setting component properties
- **API Complexity**: Properties use unique identifiers and specific naming conventions

### Performance Optimization
- **Batch Operations**: Process nodes in chunks of 10-20 items
- **Async Patterns**: Use async variants of API methods where available
- **Memory Management**: Efficient traversal patterns for large documents

## Integration Examples

### Successful Clone Pattern (Current Workaround)
```javascript
// This works but creates master components instead of instances
const clonedNode = figma.clone(componentNode);
parentFrame.appendChild(clonedNode);
```

### Target Instance Creation Pattern (Needs Implementation)
```javascript
// This should work but currently times out
const component = await figma.importComponentByKeyAsync(componentKey);
const instance = component.createInstance();
instance.setProperties({
  "Style": "Outlined",
  "Content": "Icon + Text"
});
```

## Project Goals

### Phase 1: Fix Core Issues
1. **Resolve timeout problems** in `create_component_instance`
2. **Implement component property tools** for variant switching
3. **Add remote library access** with proper error handling

### Phase 2: Design System Features
1. **Component discovery and browsing**
2. **Batch component operations**
3. **Design system validation tools**
4. **Advanced property management**

### Phase 3: Workflow Optimization
1. **Performance improvements** for large documents
2. **Caching strategies** for component libraries
3. **Advanced error handling and recovery**

## Technical References

### Related Documentation
- `technical_research.md` - Comprehensive API research and implementation patterns
- `prompt_plan.md` - Detailed enhancement requirements and specifications
- Original repo fixes for timeout issues (to be integrated)

### Key Dependencies
- Figma Plugin API (latest version with component property support)
- WebSocket communication layer
- MCP protocol implementation
- Error handling and timeout management systems

## Success Criteria

The enhanced MCP should enable Claude to:
1. **Create component instances** reliably without timeouts
2. **Switch component variants** using proper property APIs
3. **Access remote libraries** and their components
4. **Build complex layouts** using design system components
5. **Maintain design consistency** through automated validation

This represents a significant upgrade from basic shape manipulation to comprehensive design system integration, making the MCP viable for professional design workflows.