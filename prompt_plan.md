# Prompt Plan: Figma MCP Design System Enhancement

## Executive Summary

Transform the basic Figma MCP into a comprehensive design system integration tool by fixing critical timeout issues, implementing component property management, and adding robust remote library support. This enhancement will enable professional design workflows with proper component variant switching and design system consistency.

## Critical Issues to Resolve

### 1. Component Instance Creation Timeout ⚠️ **HIGHEST PRIORITY**

**Problem**: `create_component_instance` function consistently times out for all components (simple buttons, icons, complex components)

**Current Behavior**:
```javascript
// This always fails with timeout
create_component_instance(componentKey, x, y) → "Request to Figma timed out"
```

**Root Cause Analysis**:
- Issue likely in `figma.importComponentByKeyAsync()` call
- May be related to main thread blocking or network delays
- Affects both local and remote library components

**Required Solution**:
1. **Implement timeout wrapper** with Promise.race pattern
2. **Add chunking mechanism** to prevent main thread blocking
3. **Implement retry logic** with exponential backoff
4. **Add comprehensive error handling** with specific error messages
5. **Test with both local and remote components**

**Implementation Pattern**:
```javascript
async function createComponentInstance(params) {
  const { componentKey, x = 0, y = 0 } = params;
  
  // Timeout wrapper
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Component creation timeout")), 10000);
  });
  
  // Main operation with chunking
  const createPromise = (async () => {
    const component = await figma.importComponentByKeyAsync(componentKey);
    await new Promise(resolve => setTimeout(resolve, 1)); // Yield control
    const instance = component.createInstance();
    instance.x = x;
    instance.y = y;
    figma.currentPage.appendChild(instance);
    return instance;
  })();
  
  return Promise.race([createPromise, timeoutPromise]);
}
```

### 2. Component Property Management **NEW FEATURE REQUIRED**

**Problem**: No tools exist to read or set component properties for variant switching

**Current Gap**: Cannot change component variants (Style: Primary → Outlined, Content: Text → Icon+Text)

**Required New Tools**:

#### Tool: `get_component_properties`
```javascript
// Read current component properties and available options
{
  "name": "get_component_properties",
  "description": "Get component properties and available variants",
  "inputSchema": {
    "type": "object",
    "properties": {
      "nodeId": {"type": "string", "description": "Component instance ID"}
    },
    "required": ["nodeId"]
  }
}
```

**Expected Response**:
```json
{
  "currentProperties": {
    "Style": "Primary",
    "Size": "Medium", 
    "State": "Rest",
    "Content": "Text"
  },
  "availableOptions": {
    "Style": ["Primary", "Secondary", "Outlined", "Ghost"],
    "Size": ["Small", "Medium", "Large"],
    "State": ["Rest", "Hover", "Active", "Disabled"],
    "Content": ["Text", "Icon", "Icon + Text", "Text + Icon"]
  },
  "propertyDefinitions": {
    "Style": {"type": "VARIANT", "defaultValue": "Primary"},
    "Content": {"type": "VARIANT", "defaultValue": "Text"}
  }
}
```

#### Tool: `set_component_property`
```javascript
// Change component property values
{
  "name": "set_component_property", 
  "description": "Set component property to change variants",
  "inputSchema": {
    "type": "object",
    "properties": {
      "nodeId": {"type": "string", "description": "Component instance ID"},
      "propertyName": {"type": "string", "description": "Property name (e.g., 'Style')"},
      "value": {"type": "string", "description": "New property value (e.g., 'Outlined')"}
    },
    "required": ["nodeId", "propertyName", "value"]
  }
}
```

#### Tool: `set_component_properties` (Batch)
```javascript
// Set multiple properties at once for efficiency
{
  "name": "set_component_properties",
  "description": "Set multiple component properties at once", 
  "inputSchema": {
    "type": "object",
    "properties": {
      "nodeId": {"type": "string", "description": "Component instance ID"},
      "properties": {
        "type": "object", 
        "description": "Object with property name/value pairs",
        "additionalProperties": {"type": "string"}
      }
    },
    "required": ["nodeId", "properties"]
  }
}
```

**Implementation Requirements**:
- Use `InstanceNode.setProperties()` API method
- Handle property naming conventions (some require unique identifiers)
- Validate property values against available options
- Implement error handling for invalid property names/values

### 3. Remote Library Access Timeout

**Problem**: `get_remote_components` times out when accessing team libraries

**Required Solution**:
1. **Fix timeout issues** in team library access
2. **Implement caching** for remote component lists
3. **Add pagination** for large component libraries
4. **Improve error handling** with specific failure reasons

**Enhanced Implementation**:
```javascript
async function getRemoteComponents() {
  try {
    // Check API availability first
    if (!figma.teamLibrary?.getAvailableComponentsAsync) {
      throw new Error("Team library API not available");
    }
    
    // Implement timeout and chunking
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Remote component fetch timeout")), 15000);
    });
    
    const fetchPromise = figma.teamLibrary.getAvailableComponentsAsync();
    const components = await Promise.race([fetchPromise, timeoutPromise]);
    
    return components.map(comp => ({
      key: comp.key,
      name: comp.name,
      description: comp.description,
      libraryName: comp.libraryName
    }));
  } catch (error) {
    // Provide specific error context
    throw new Error(`Remote library access failed: ${error.message}`);
  }
}
```

## New Feature Requirements

### 4. Component Discovery and Library Management

**Required Tools**:

#### Tool: `get_local_components` (Enhanced)
- Add component property information
- Include variant details and available options
- Add component metadata (description, tags, etc.)

#### Tool: `get_component_variants`
```javascript
// Get all variants of a component set
{
  "name": "get_component_variants",
  "description": "Get all variants within a component set",
  "inputSchema": {
    "type": "object", 
    "properties": {
      "componentSetId": {"type": "string", "description": "Component set ID"}
    },
    "required": ["componentSetId"]
  }
}
```

#### Tool: `search_components`
```javascript
// Search components by name, description, or properties
{
  "name": "search_components",
  "description": "Search for components across local and remote libraries",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {"type": "string", "description": "Search query"},
      "includeRemote": {"type": "boolean", "default": true},
      "filterByProperties": {
        "type": "object",
        "description": "Filter by specific property values"
      }
    },
    "required": ["query"]
  }
}
```

### 5. Batch Operations and Performance

**Required Tools**:

#### Tool: `create_component_instances_batch`
```javascript
// Create multiple instances efficiently
{
  "name": "create_component_instances_batch",
  "description": "Create multiple component instances in a single operation",
  "inputSchema": {
    "type": "object",
    "properties": {
      "instances": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "componentKey": {"type": "string"},
            "x": {"type": "number"},
            "y": {"type": "number"},
            "properties": {"type": "object"}
          }
        }
      }
    }
  }
}
```

#### Tool: `update_component_properties_batch`
```javascript
// Update properties across multiple instances
{
  "name": "update_component_properties_batch", 
  "description": "Update properties for multiple component instances",
  "inputSchema": {
    "type": "object",
    "properties": {
      "updates": {
        "type": "array",
        "items": {
          "type": "object", 
          "properties": {
            "nodeId": {"type": "string"},
            "properties": {"type": "object"}
          }
        }
      }
    }
  }
}
```

### 6. Design System Validation

**Required Tools**:

#### Tool: `validate_component_usage`
```javascript
// Validate component usage against design system rules
{
  "name": "validate_component_usage",
  "description": "Validate component instances against design system guidelines",
  "inputSchema": {
    "type": "object",
    "properties": {
      "scope": {"type": "string", "enum": ["selection", "page", "document"]},
      "rules": {
        "type": "array",
        "items": {"type": "string"}
      }
    }
  }
}
```

#### Tool: `find_component_instances`
```javascript
// Find all instances of specific components
{
  "name": "find_component_instances",
  "description": "Find all instances of a component across the document",
  "inputSchema": {
    "type": "object",
    "properties": {
      "componentKey": {"type": "string"},
      "includeOverrides": {"type": "boolean", "default": true}
    }
  }
}
```

## Implementation Strategy

### Phase 1: Core Fixes (Week 1-2)
1. **Fix timeout issues** in component instance creation
2. **Implement component property management** tools
3. **Fix remote library access** with proper error handling
4. **Add comprehensive error handling** throughout

### Phase 2: Enhanced Features (Week 3-4)
1. **Add component discovery tools**
2. **Implement batch operations** 
3. **Add component search functionality**
4. **Optimize performance** for large documents

### Phase 3: Design System Integration (Week 5-6)
1. **Add validation tools**
2. **Implement design system consistency checks**
3. **Add advanced component management features**
4. **Create comprehensive documentation**

## Testing Requirements

### Test Cases Required:
1. **Timeout Scenarios**: Test with complex components, large libraries, slow networks
2. **Property Management**: Test all property types (VARIANT, BOOLEAN, TEXT, INSTANCE_SWAP)
3. **Batch Operations**: Test with 1, 10, 100+ components
4. **Error Handling**: Test all failure modes with appropriate error messages
5. **Performance**: Test with large documents and component libraries

### Success Criteria:
- ✅ Create component instances reliably (>95% success rate)
- ✅ Switch component variants without errors
- ✅ Access remote libraries within reasonable time (<5 seconds)
- ✅ Handle batch operations efficiently
- ✅ Provide clear error messages for all failure modes

## Technical Implementation Notes

### Key API Methods to Implement:
- `figma.importComponentByKeyAsync(componentKey)`
- `InstanceNode.setProperties(properties)`
- `ComponentNode.componentPropertyDefinitions`
- `figma.teamLibrary.getAvailableComponentsAsync()`
- `InstanceNode.getMainComponentAsync()`

### Error Handling Patterns:
- Use `Promise.race()` for timeout implementation
- Implement exponential backoff for retry logic
- Provide specific error messages with suggested solutions
- Include fallback mechanisms for critical operations

### Performance Optimizations:
- Process operations in chunks of 10-20 items
- Use `setTimeout(resolve, 1)` between chunks
- Implement caching for component metadata
- Use async API variants where available

This enhancement plan transforms the MCP from a basic shape manipulation tool into a comprehensive design system integration platform, enabling professional design workflows with proper component management and design system consistency.