/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { createTestRegistry, WithTestRegistry } from './utils';

// Override `@testing-library/react`'s render method with one that includes
// our data store.
const customRender = ( children, options = {} ) => {
	const {
		setupRegistry,
		registry = createTestRegistry(),
		...renderOptions
	} = options;
	return {
		...render( (
			<WithTestRegistry callback={ setupRegistry } registry={ registry }>
				{ children }
			</WithTestRegistry>
		), renderOptions ),
		registry,
	};
};

// Export our own test utils from this file.
export * from 'tests/js/utils';

// Export @testing-library/react as normal.
export * from '@testing-library/react';

// Override @testing-library/react's render method with our own.
export { customRender as render };
