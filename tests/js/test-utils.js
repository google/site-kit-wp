/**
 * External dependencies
 */
import { render } from '@testing-library/react';
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import { createTestRegistry } from './utils';
import { RegistryProvider } from '@wordpress/data';

// Override `@testing-library/react`'s render method with one that includes
// our data store.

/**
 * Renders the given UI into a container to make assertions.
 *
 * @see {@link https://testing-library.com/docs/react-testing-library/api#render}
 *
 * @param {*} ui Any valid React child element.
 * @param {Object} options Render options.
 * @param {Function} options.setupRegistry A function which accepts the registry instance to configure it.
 * @param {Function} options.registry A specific registry instance to use. Defaults to a fresh test registry with all stores.
 * @return {Object} An object containing all of {@link https://testing-library.com/docs/react-testing-library/api#render-result}
 *                 as well as the `registry`.
 */
const customRender = ( ui, options = {} ) => {
	const {
		setupRegistry = ( r ) => r,
		registry = createTestRegistry(),
		...renderOptions
	} = options;

	invariant( typeof setupRegistry === 'function', 'options.setupRegistry must be a function.' );
	setupRegistry( registry );

	function Wrapper( { children } ) {
		return (
			<RegistryProvider value={ registry }>
				{ children }
			</RegistryProvider>
		);
	}

	return {
		...render( ui, { wrapper: Wrapper, ...renderOptions } ),
		registry,
	};
};

// Export our own test utils from this file.
export * from 'tests/js/utils';

// Export @testing-library/react as normal.
export * from '@testing-library/react';

// Override @testing-library/react's render method with our own.
export { customRender as render };
