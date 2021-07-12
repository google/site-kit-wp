/**
 * External dependencies
 */
import { render } from '@testing-library/react';
import { renderHook, act as actHook } from '@testing-library/react-hooks';
import { Router } from 'react-router-dom';
import invariant from 'invariant';
import { createMemoryHistory } from 'history';

/**
 * WordPress dependencies
 */
import { RegistryProvider } from '@wordpress/data';

/**
 * Internal dependencies
 */
import FeaturesProvider from '../../assets/js/components/FeaturesProvider';
import { createTestRegistry } from './utils';

// Override `@testing-library/react`'s render method with one that includes
// our data store.

/**
 * Renders the given UI into a container to make assertions.
 *
 * @since 1.25.0 Added `features` option.
 * @see {@link https://testing-library.com/docs/react-testing-library/api#render}
 * @private
 *
 * @param {*}        ui                      Any valid React child element.
 * @param {Object}   [options]               Optional. Render options.
 * @param {string[]} [options.features]      Feature flags to enable for this hook render.
 * @param {Function} [options.setupRegistry] A function which accepts the registry instance to configure it.
 * @param {Object}   [options.registry]      A specific registry instance to use. Defaults to a fresh test registry with all stores.
 * @param {History}  [options.history]       History object for React Router. Defaults to MemoryHistory.
 * @param {string}   [options.route]         Route to pass to history as starting route.
 * @return {Object} An object containing all of {@link https://testing-library.com/docs/react-testing-library/api#render-result} as well as the `registry`.
 */
const customRender = ( ui, options = {} ) => {
	const {
		features = [],
		setupRegistry = ( r ) => r,
		registry = createTestRegistry(),
		history = createMemoryHistory(),
		route = undefined,
		...renderOptions
	} = options;

	invariant( typeof setupRegistry === 'function', 'options.setupRegistry must be a function.' );
	setupRegistry( registry );
	const enabledFeatures = new Set( features );

	if ( route ) {
		history.push( route );
	}

	function Wrapper( { children } ) {
		return (
			<RegistryProvider value={ registry }>
				<FeaturesProvider value={ enabledFeatures }>
					<Router history={ history }>
						{ children }
					</Router>
				</FeaturesProvider>
			</RegistryProvider>
		);
	}

	const result = render( ui, { wrapper: Wrapper, ...renderOptions } );
	const {
		getByTestId: getByTestID, // eslint-disable-line sitekit/acronym-case
		findByTestId: findByTestID, // eslint-disable-line sitekit/acronym-case
		getAllByTestId: getAllByTestID, // eslint-disable-line sitekit/acronym-case
		findAllByTestId: findAllByTestID, // eslint-disable-line sitekit/acronym-case
		queryByTestId: queryByTestID, // eslint-disable-line sitekit/acronym-case
		queryAllByTestId: queryAllByTestID, // eslint-disable-line sitekit/acronym-case
	} = result;

	return {
		...result,
		findAllByTestID,
		findByTestID,
		getAllByTestID,
		getByTestID,
		queryAllByTestID,
		queryByTestID,
		registry,
		history,
	};
};

/**
 * Renders a test component that will call the provided callback, including any hooks it calls, every time it renders.
 *
 * @since 1.12.0
 * @since 1.25.0 Added `features` option.
 * @private
 *
 * @param {Function} callback           The function that is called each render of the test component. This function should call one or more hooks for testing. The props passed into the callback will be the initialProps provided in the options to renderHook, unless new props are provided by a subsequent rerender call.
 * @param {Object}   [options]          Optional. An options object to modify the execution of the callback function. See the [renderHook Options](@link https://react-hooks-testing-library.com/reference/api#renderhook-options) section for more details.
 * @param {string[]} [options.features] Feature flags to enable for this hook render.
 * @param {History}  [options.history]  History object for React Router. Defaults to MemoryHistory.
 * @param {string}   [options.route]    Route to pass to history as starting route.
 * @param {Object}   [options.registry] Registry to use with the RegistryProvider. Default is a new test registry.
 * @return {Object} Object with `result`, `rerender`, `unmount`, and async utilities. @link https://react-hooks-testing-library.com/reference/api#renderhook-result.
 */
const customRenderHook = (
	callback,
	{
		features = [],
		registry = createTestRegistry(),
		history = createMemoryHistory(),
		route = undefined,
		...renderHookOptions
	} = {}
) => {
	if ( route ) {
		history.push( route );
	}

	const enabledFeatures = new Set( features );
	const Wrapper = ( { children } ) => (
		<RegistryProvider value={ registry }>
			<FeaturesProvider value={ enabledFeatures }>
				<Router history={ history }>
					{ children }
				</Router>
			</FeaturesProvider>
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
