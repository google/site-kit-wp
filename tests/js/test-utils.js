/**
 * External dependencies
 */
import { render } from '@testing-library/react';
import { renderHook, act as actHook } from '@testing-library/react-hooks';
import invariant from 'invariant';

/**
 * WordPress dependencies
 */
import { RegistryProvider } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { createTestRegistry } from './utils';

// Override `@testing-library/react`'s render method with one that includes
// our data store.

/**
 * Renders the given UI into a container to make assertions.
 *
 * @see {@link https://testing-library.com/docs/react-testing-library/api#render}
 * @since 1.7.1
 * @private
 *
 * @param {*}        ui                    Any valid React child element.
 * @param {Object}   options               Render options.
 * @param {Function} options.setupRegistry A function which accepts the registry instance to configure it.
 * @param {Function} options.registry      A specific registry instance to use. Defaults to a fresh test registry with all stores.
 * @return {Object} An object containing all of {@link https://testing-library.com/docs/react-testing-library/api#render-result} as well as the `registry`.
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

/**
 * Renders a test component that will call the provided callback, including any hooks it calls, every time it renders.
 *
 * @since 1.12.0
 * @private
 *
 * @param {Function} callback           The function that is called each render of the test component. This function should call one or more hooks for testing.
 *                                      The props passed into the callback will be the initialProps provided in the options to renderHook,
 *                                      unless new props are provided by a subsequent rerender call.
 * @param {Object}   [options]          Optional. An options object to modify the execution of the callback function.
 *                                      See the [renderHook Options](@link https://react-hooks-testing-library.com/reference/api#renderhook-options) section for more details.
 * @param {Object}   [options.registry] Registry to use with the RegistryProvider. Default is a new test registry.
 * @return {Object} Object with `result`, `rerender`, `unmount`, and async utilities. @link https://react-hooks-testing-library.com/reference/api#renderhook-result
 */
const customRenderHook = (
	callback,
	{
		registry = createTestRegistry(),
		...renderHookOptions
	} = {}
) => {
	const Wrapper = ( { children } ) => (
		<RegistryProvider value={ registry }>
			{ children }
		</RegistryProvider>
	);

	return {
		...renderHook( callback, { wrapper: Wrapper, ...renderHookOptions } ),
		registry,
	};
};

// Export our own test utils from this file.
export * from 'tests/js/utils';

// Export @testing-library/react as normal.
export * from '@testing-library/react';

// Override @testing-library/react's render method with our own.
export { customRender as render };
// Override @testing-library/react-hooks's renderHook method with our own.
export { customRenderHook as renderHook };
// Hooks need to use the `act` from @testing-library/react-hooks.
export { actHook };
