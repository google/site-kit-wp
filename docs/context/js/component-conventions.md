# Site Kit React Component Conventions

## TypeScript Is Required for New Components

**All new components must be written in TypeScript** (`.tsx`, or `.ts` for non-JSX modules) — see the [TypeScript Components](#typescript-components) section for the patterns to follow. The JavaScript (`.js`/`.jsx`) conventions in this document (function declarations, PropTypes, etc.) apply only when modifying existing legacy JavaScript components; do not create new `.js`/`.jsx` components.

## Import Structure

All imports must be organized in the following order with comment separators:

### 1. External Dependencies
External libraries and packages, grouped together with comment:

```javascript
/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Link as RouterLink } from 'react-router-dom';
```

### 2. WordPress Dependencies
WordPress packages and utilities, grouped together with comment:

```javascript
/**
 * WordPress dependencies
 */
import { forwardRef, useState, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useInstanceId } from '@wordpress/compose';
```

### 3. Internal Dependencies
Project-specific imports, including components, utilities, and datastore, grouped together with comment:

```javascript
/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import PreviewBlock from './PreviewBlock';
import { sanitizeHTML } from '../util';
import { CORE_USER } from '../googlesitekit/datastore/user/constants';
```

#### Path Aliases

Site Kit uses the `@` path alias for cleaner, more maintainable imports. It is configured in `tsconfig.json` as `@/*` → `./assets/*` (and enforced by the `no-relative-import-paths` ESLint rule with `rootDir: "assets"` and `prefix: "@"`), so `@/js/...` resolves to `assets/js/...`:

```javascript
/**
 * Internal dependencies
 */
// Using path alias (preferred)
import { useSelect } from 'googlesitekit-data';
import DataBlock from '@/js/components/DataBlock';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';

// Relative paths (avoid when possible)
import DataBlock from '../../../components/DataBlock';
```

The data store entrypoint is the dedicated `googlesitekit-data` webpack/tsconfig alias (not a path under `@/js/`); import `useSelect`, `useDispatch`, and friends from `'googlesitekit-data'`.

**Benefits of path aliases:**
- Imports remain consistent regardless of file location
- Easier to refactor and move files
- More readable and maintainable code
- Avoids complex relative path navigation (`../../../`)

**When to use:**
- Prefer path aliases for all cross-directory imports within `assets/js/`
- Use relative paths only for files in the same directory or immediate subdirectories

## Component Structure

### Function Declaration
In JavaScript (`.js`/`.jsx`) files, use function declarations for components, not arrow functions (enforced by the `react/function-component-definition` ESLint rule):

```javascript
// Correct
export default function ComponentName( { prop1, prop2 } ) {
    // component logic
}

// Also correct for forwardRef
const ComponentName = forwardRef( ( props, ref ) => {
    // component logic
});

// Avoid
const ComponentName = ( { prop1, prop2 } ) => {
    // component logic
};
```

> In TypeScript (`.ts`/`.tsx`) files this rule is disabled, and the preferred form is the `const Component: FC<Props> = ( ... ) => { ... }` arrow function — see the [TypeScript Components](#typescript-components) section below.

### Component Naming
- Use PascalCase for component names
- File names should match component names exactly
- Use descriptive names that clearly indicate purpose

### Props Destructuring
Destructure props in the function parameter with default values when appropriate:

```javascript
function Badge( { 
    label, 
    className, 
    hasLeftSpacing = false, 
    ...rest 
} ) {
    // component implementation
}
```

## PropTypes

In JavaScript (`.js`/`.jsx`) files, every component must include PropTypes validation after the component definition. In TypeScript files, use a props `interface` instead of PropTypes — see the [TypeScript Components](#typescript-components) section.

```javascript
ComponentName.propTypes = {
    // Required props
    title: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    
    // Optional props with types
    className: PropTypes.string,
    isActive: PropTypes.bool,
    onClick: PropTypes.func,
    
    // Complex types
    error: PropTypes.shape({
        message: PropTypes.string,
    }),
    
    // Arrays
    items: PropTypes.arrayOf(PropTypes.string),
};
```

### Common PropTypes patterns:
- `PropTypes.string` - for text
- `PropTypes.bool` - for boolean flags
- `PropTypes.func` - for callback functions
- `PropTypes.node` - for any renderable content
- `PropTypes.element` - for React elements
- `PropTypes.string.isRequired` - for required props
- `PropTypes.shape({})` - for object structures
- `PropTypes.arrayOf()` - for arrays

## Example Complete Component

```javascript
/**
 * Badge component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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

/**
 * External dependencies
 */
import classnames from 'classnames';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

const Badge = forwardRef(
    ( { label, className, hasLeftSpacing = false, ...rest }, ref ) => (
        <span
            ref={ ref }
            { ...rest }
            className={ classnames( 'googlesitekit-badge', className, {
                'googlesitekit-badge--has-left-spacing': hasLeftSpacing,
            } ) }
        >
            { label }
        </span>
    )
);

Badge.displayName = 'Badge';

Badge.propTypes = {
    label: PropTypes.string.isRequired,
    hasLeftSpacing: PropTypes.bool,
};

export default Badge;
```

## TypeScript Components

Site Kit is progressively migrating to TypeScript, and **all new components must be written in TypeScript**. TypeScript components follow similar conventions with type-safe patterns.

### TypeScript Import Structure

TypeScript components use the same import ordering. Type-only imports from external packages use the same `import ...` approach as all other imports (with no `type` keyword) — this is the active project convention:

```typescript
/**
 * External dependencies
 */
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { ComponentProps } from './SomeComponent';
```

### Function Component with TypeScript

Use the `FC` (Function Component) type with an interface for props:

```typescript
interface BadgeProps {
    label: string;
    className?: string;
    hasLeftSpacing?: boolean;
}

const Badge: FC<BadgeProps> = ( {
    label,
    className = '',
    hasLeftSpacing = false,
} ) => {
    return (
        <span
            className={ classnames( 'googlesitekit-badge', className, {
                'googlesitekit-badge--has-left-spacing': hasLeftSpacing,
            } ) }
        >
            { label }
        </span>
    );
};

export default Badge;
```

### TypeScript Type Patterns

**Interface Definitions:**
```typescript
// Props interface
interface ComponentProps {
    title: string;
    isActive?: boolean;
    onSubmit?: ( data: FormData ) => void;
}

// Complex type definitions
interface ReportData {
    metrics: string[];
    dimensions: string[];
    dateRange: {
        startDate: string;
        endDate: string;
    };
}
```

**forwardRef in TypeScript:**

The TypeScript form of the `forwardRef` pattern keeps the `FC<Props>` annotation and passes the ref element and props types to `forwardRef`. `forwardRef` is still imported from `@wordpress/element`:

```typescript
/**
 * External dependencies
 */
import classnames from 'classnames';
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

interface GridProps {
    alignLeft?: boolean;
    className?: string;
}

const Grid: FC< GridProps > = forwardRef< HTMLDivElement, GridProps >(
    ( { alignLeft = false, className = '', children, ...otherProps }, ref ) => {
        return (
            <div
                className={ classnames( 'mdc-layout-grid', className, {
                    'mdc-layout-grid--align-left': alignLeft,
                } ) }
                { ...otherProps }
                ref={ ref }
            >
                { children }
            </div>
        );
    }
);

export default Grid;
```

### TypeScript Best Practices

1. **Define interfaces for all props** - Replace PropTypes with TypeScript interfaces
2. **Use optional properties** with `?` for non-required props
3. **Import types** using standard `import`. Do not use `import type`; this is the active project convention
4. **Prefer interfaces over types** for object shapes
5. **Use FC type** for function components: `const Component: FC<Props> = ...`
6. Colocate types for components/functions in the same file as the component/function; avoid using `types.ts` files that disconnect the types from the function to which they pertain.

### Migration Notes

When migrating from JavaScript to TypeScript:
- File extension changes from `.js` to `.tsx` (for JSX) or `.ts`
- Replace PropTypes with TypeScript interfaces
- Add return type annotations where helpful
- Ensure all dependencies have type definitions

## Key Guidelines

1. **Write all new components in TypeScript** (`.tsx`/`.ts`) — the JavaScript patterns below apply only to existing legacy components
2. **Always include the file header** with the correct license information
3. **Group imports** in the specified order with comment separators
4. **Component definition style depends on the file type:**
   - In `.js`/`.jsx` files, use **function declarations** for named components — the `react/function-component-definition` ESLint rule enforces this (`namedComponents: "function-declaration"`).
   - In `.ts`/`.tsx` files, that rule is turned off, so the documented `const Component: FC<Props> = ( ... ) => { ... }` arrow form is preferred (see the TypeScript Components section).
5. **Type your props for every component:**
   - In `.js`/`.jsx` files, **always include PropTypes** for all props, marking required ones appropriately.
   - In `.ts`/`.tsx` files, define a props **interface** instead of PropTypes.
6. **Use descriptive prop names** that clearly indicate their purpose
7. **Follow consistent naming conventions** throughout the codebase
