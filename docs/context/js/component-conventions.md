# Site Kit React Component Conventions

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

Site Kit uses the `@/js/` path alias for cleaner, more maintainable imports. This alias maps to `assets/js/` directory:

```javascript
/**
 * Internal dependencies
 */
// Using path alias (preferred)
import { useSelect } from '@/js/data';
import DataBlock from '@/js/components/DataBlock';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';

// Relative paths (avoid when possible)
import DataBlock from '../../../components/DataBlock';
```

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
Use function declarations for components, not arrow functions:

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

Every component must include PropTypes validation after the component definition:

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

Site Kit is progressively migrating to TypeScript. TypeScript components follow similar conventions with type-safe patterns.

### TypeScript Import Structure

TypeScript components use the same import ordering but with additional type imports:

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
import { useSelect } from '@/js/data';
import { ComponentProps } from './SomeComponent';

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

**Generic Types:**
```typescript
// Component with generic type
interface SelectProps<T> {
    options: T[];
    value: T;
    onChange: ( value: T ) => void;
}

const Select = <T extends string | number>( {
    options,
    value,
    onChange,
}: SelectProps<T> ) => {
    // implementation
};
```

### TypeScript Best Practices

1. **Define interfaces for all props** - Replace PropTypes with TypeScript interfaces
2. **Use optional properties** with `?` for non-required props
3. **Import types** using standard `import`. Do not use `import type`
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

1. **Always include the file header** with the correct license information
2. **Group imports** in the specified order with comment separators
3. **Use function declarations** for component definitions
4. **Always include PropTypes** for all props, marking required ones appropriately
5. **Use descriptive prop names** that clearly indicate their purpose
6. **Follow consistent naming conventions** throughout the codebase
