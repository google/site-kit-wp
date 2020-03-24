/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { RegistryProvider } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { createTestRegistry } from 'tests/js/utils';

// Override `@testing-library/react`'s render method with one that includes
// our data store.
const customRender = ( children, options = {} ) => {
	const {
		registry = createTestRegistry(),
		...renderOptions
	} = options;
	return {
		...render( (
			<RegistryProvider value={ registry }>
				{ children }
			</RegistryProvider>
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
