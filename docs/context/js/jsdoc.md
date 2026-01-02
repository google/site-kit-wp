# JSDoc Documentation Standards

Site Kit maintains comprehensive JSDoc documentation for utility functions, hooks, and complex API functionality while relying on PropTypes for React component type documentation.

## JSDoc Usage Patterns

### File-Level Documentation

Every JavaScript file must include the standardized header format (same as component header):

```javascript
/**
 * [Component/Module Name] [component/utility/etc.]
 *
 * Site Kit by Google, Copyright [current year] Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
```

### Function Documentation Standards

All utility functions, hooks, and complex API functions should follow this pattern:

```javascript
/**
 * [Brief description of function purpose]
 *
 * @since n.e.x.t
 *
 * @param {type} paramName Description of parameter.
 * @param {type} [optionalParam] Description of optional parameter.
 * @return {type} Description of return value.
 */
function myFunction( paramName, optionalParam = defaultValue ) {
    // implementation
}
```

### Required JSDoc Tags

#### @since Tag
**Always required** - Documents when the feature was introduced, always use `n.e.x.t` value which will be replaced with the actual version later on.

```javascript
/**
 * Returns a callback to activate a module.
 *
 * @since n.e.x.t
 *
 * @param {string} moduleSlug Module slug.
 * @return {Function|null} Callback to activate module.
 */
```

#### @param Tag
**Required for all parameters** - Documents parameter types and descriptions:

```javascript
// Basic parameter
@param {string} dateRange The date range slug.

// Optional parameter with default
@param {boolean} [invertColor=false] Whether to reverse the +/- colors.

// Complex object parameter
@param {Object} options Configuration options.
@param {string} options.baseName The base name to use.
@param {Function} options.controlCallback Callback function to issue the API request.
@param {Function} [options.validateParams] Optional validation function.
```

#### @return Tag
**Required for functions that return values** - Documents return type and description:

```javascript
@return {Object} Partial store object with properties 'actions', 'controls', and 'reducer'.
@return {Function|null} Callback function or null if module doesn't exist.
@return {Array.<Object>} Array of widget objects.
```

### Complex Type Documentation

#### @typedef for Complex Data Structures

Use `@typedef` to define complex object structures:

```javascript
/**
 * Parse Analytics 4 report into data suitable for rendering.
 *
 * @typedef {Object} OverallPageMetricsData
 * @property {string}         metric          Google Analytics metric identifier.
 * @property {string}         title           Translated metric title.
 * @property {Array.<Object>} sparkLineData   Data for rendering the sparkline.
 * @property {string}         [datapointUnit] Optional datapoint unit, e.g. '%', 's'.
 * @property {number}         total           Total count for the metric.
 * @property {number}         change          Monthly change for the metric.
 *
 * @param {Object} report Raw Analytics report data.
 * @return {OverallPageMetricsData} Processed metrics data.
 */
function parseReportData( report ) {
    // implementation
}
```

#### Hook Documentation

Custom hooks require comprehensive JSDoc documentation:

```javascript
/**
 * Returns a callback to activate a module. If the call to activate the module
 * fails, an error will be returned to the returned callback.
 *
 * @since n.e.x.t
 *
 * @param {string} moduleSlug Module slug.
 * @return {Function|null} Callback to activate module, null if the module doesn't exist.
 */
export default function useActivateModuleCallback( moduleSlug ) {
    // hook implementation
}
```

### Utility Function Documentation

Utility functions require detailed documentation with examples for complex cases:

```javascript
/**
 * Creates a store object implementing the necessary infrastructure for making
 * asynchronous API requests and storing their data.
 *
 * @since n.e.x.t
 *
 * @param {Object}   args                   Arguments for creating the fetch store.
 * @param {string}   args.baseName          The base name to use for all actions.
 * @param {Function} args.controlCallback   Callback function to issue the API request.
 * @param {Function} [args.reducerCallback] Optional reducer to modify state.
 * @param {Function} [args.argsToParams]    Function that reduces argument list to params.
 * @param {Function} [args.validateParams]  Function that validates params before request.
 * @return {Object} Partial store object with properties 'actions', 'controls', and 'reducer'.
 */
export default function createFetchStore( {
    baseName,
    controlCallback,
    reducerCallback,
    argsToParams = ( ...args ) => args[ 0 ] || {},
    validateParams = () => {},
} ) {
    // implementation
}
```

## JSDoc Documentation Requirements

### Always Document
1. **Utility functions** - Complete JSDoc with all tags
2. **Custom hooks** - Full documentation with usage patterns
3. **API functions** - Detailed parameter and return documentation
4. **Complex algorithms** - Step-by-step documentation
5. **Public interfaces** - Complete interface documentation

### Conditionally Document
2. **Event handlers** - Document complex callback functions
3. **Internal helpers** - Document if logic is non-obvious

### Never Document (Use PropTypes Instead)
1. **Component props** - Use PropTypes for type checking
2. **Simple getters/setters** - Self-explanatory functions
3. **Trivial functions** - One-line utility functions

## Best Practices

### Parameter Documentation
1. **Use descriptive parameter names** in the function signature
2. **Document optional parameters** with bracket notation: `[optionalParam]`
3. **Include default values** in documentation: `[enabled=true]`
4. **Document object properties** when passing configuration objects

### Type Documentation
1. **Use specific types** instead of generic `Object` when possible
2. **Document array contents**: `Array.<string>` instead of `Array`
3. **Use union types**: `{Function|null}` for multiple possible types
4. **Create typedefs** for complex recurring data structures

### Version Tracking
1. **Always include @since** for new functions and significant changes using `n.e.x.t` value
3. **Document breaking changes** in function descriptions

### Consistency Rules
1. **Follow established patterns** for similar function types
2. **Use consistent terminology** across related functions
3. **Maintain uniform formatting** for JSDoc blocks
4. **Keep descriptions concise** but complete
