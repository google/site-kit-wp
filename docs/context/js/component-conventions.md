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

## Key Guidelines

1. **Always include the file header** with the correct license information
2. **Group imports** in the specified order with comment separators
3. **Use function declarations** for component definitions
4. **Always include PropTypes** for all props, marking required ones appropriately
5. **Use descriptive prop names** that clearly indicate their purpose
6. **Follow consistent naming conventions** throughout the codebase
