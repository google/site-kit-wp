/**
 * External dependencies
 */
import { Dispatch, FC, ReactElement, SetStateAction } from 'react';
import { render, act, RenderResult } from '@testing-library/react';
import {
	renderHook,
	act as actHook,
	RenderHookResult,
} from '@testing-library/react-hooks';
// @ts-expect-error - No types available.
import { Router } from 'react-router-dom';
// @ts-expect-error - No types available.
import { createMemoryHistory } from 'history';

/**
 * WordPress dependencies
 */
// @ts-expect-error - No types available.
import { RegistryProvider } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import FeaturesProvider from '../../assets/js/components/FeaturesProvider';
import InViewProvider from '../../assets/js/components/InViewProvider';
import { Provider as ViewContextProvider } from '../../assets/js/components/Root/ViewContextContext';
import { createTestRegistry, createWaitForRegistry } from './utils';
import { enabledFeatures } from '../../assets/js/features';

/**
 * Sets the complete list of current enabled features.
 *
 * @since 1.101.0
 *
 * @param {Iterable} features List of enabled features.
 * @return {void}
 */
export function setEnabledFeatures( features: Iterable< string > ): void {
	enabledFeatures.clear();

	for ( const feature of Array.from( features ) ) {
		enabledFeatures.add( feature );
	}
}

type CustomRenderOptions = {
	features?: Iterable< string >;
	registry?: ReturnType< typeof createTestRegistry >;
	history?: ReturnType< typeof createMemoryHistory >;
	route?: string;
	inView?: boolean;
	viewContext?: string;
};

type CustomRenderResult = RenderResult & {
	registry: ReturnType< typeof createTestRegistry >;
	history: ReturnType< typeof createMemoryHistory >;
	waitForRegistry: () => ReturnType< typeof createWaitForRegistry >;
	setInView: Dispatch< SetStateAction< boolean > > | undefined;
};

/**
 * Renders the given UI into a container to make assertions.
 *
 * @since 1.25.0 Added `features` option.
 * @see {@link https://testing-library.com/docs/react-testing-library/api#render}
 * @private
 *
 * @param {ReactElement} ui                    Any valid React child element.
 * @param {Object}       [options]             Optional. Render options.
 * @param {string[]}     [options.features]    Feature flags to enable for this hook render.
 * @param {Object}       [options.registry]    A specific registry instance to use. Defaults to a fresh test registry with all stores.
 * @param {History}      [options.history]     History object for React Router. Defaults to MemoryHistory.
 * @param {string}       [options.route]       Route to pass to history as starting route.
 * @param {boolean}      [options.inView]      If the component should consider itself in-view (see `useInView` hook).
 * @param {string}       [options.viewContext] `viewContext` to use for this component and its children.
 * @return {CustomRenderResult} An object containing all of {@link https://testing-library.com/docs/react-testing-library/api#render-result} as well as the `registry`.
 */
function customRender(
	ui: ReactElement,
	options: CustomRenderOptions = {}
): CustomRenderResult {
	// Set up enabled features before anything else.
	// This is necessary for feature-conditional behavior in the datastore
	// which depends on the enabledFeatures module rather than Context.
	setEnabledFeatures( options.features || [] );

	const {
		registry = createTestRegistry(),
		history = createMemoryHistory(),
		route = undefined,
		inView = true,
		viewContext = null,
		...renderOptions
	} = options;

	let setInView;

	if ( route ) {
		history.push( route );
	}

	const Wrapper: FC = ( { children } ) => {
		const [ inViewStateValue, setInViewStateValue ] = useState( inView );
		setInView = setInViewStateValue;

		const [ inViewState, setInViewState ] = useState( {
			key: 'Wrapper',
			value: inViewStateValue,
		} );

		useEffect( () => {
			setInViewState( {
				key: 'Wrapper',
				value: inViewStateValue,
			} );
		}, [ inViewStateValue ] );

		return (
			/* @ts-expect-error - `InViewProvider` is not typed yet. */
			<InViewProvider value={ inViewState }>
				<RegistryProvider value={ registry }>
					<FeaturesProvider value={ enabledFeatures }>
						{ /* @ts-expect-error - `ViewContextProvider` is not typed yet. */ }
						<ViewContextProvider value={ viewContext }>
							<Router history={ history }>{ children }</Router>
						</ViewContextProvider>
					</FeaturesProvider>
				</RegistryProvider>
			</InViewProvider>
		);
	};

	const waitForRegistry = createWaitForRegistry( registry );

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
		// @ts-expect-error - `waitForRegistry` is not typed yet.
		waitForRegistry: () => act( waitForRegistry ),
		setInView,
	};
}

type CustomRenderHookResult< Props, Result > = RenderHookResult<
	Props,
	Result
> & {
	registry: ReturnType< typeof createTestRegistry >;
	history: ReturnType< typeof createMemoryHistory >;
	waitForRegistry: () => ReturnType< typeof createWaitForRegistry >;
	setInView: Dispatch< SetStateAction< boolean > > | undefined;
};

/**
 * Renders a test component that will call the provided callback, including any hooks it calls, every time it renders.
 *
 * @since 1.12.0
 * @since 1.25.0 Added `features` option.
 * @since 1.45.0 Added `viewContext` option.
 * @private
 *
 * @param {Function}            callback              The function that is called each render of the test component. This function should call one or more hooks for testing. The props passed into the callback will be the initialProps provided in the options to renderHook, unless new props are provided by a subsequent rerender call.
 * @param {CustomRenderOptions} [options]             Optional. An options object to modify the execution of the callback function. See the [renderHook Options](@link https://react-hooks-testing-library.com/reference/api#renderhook-options) section for more details.
 * @param {string[]}            [options.features]    Feature flags to enable for this hook render.
 * @param {History}             [options.history]     History object for React Router. Defaults to MemoryHistory.
 * @param {string}              [options.route]       Route to pass to history as starting route.
 * @param {Object}              [options.registry]    Registry to use with the RegistryProvider. Default is a new test registry.
 * @param {string}              [options.viewContext] ViewContext value.
 * @param {boolean}             [options.inView]      If the component should consider itself in-view (see `useInView` hook).
 * @return {CustomRenderHookResult} Object with `result`, `rerender`, `unmount`, and async utilities. @link https://react-hooks-testing-library.com/reference/api#renderhook-result.
 */
function customRenderHook< Props, Result >(
	callback: ( props: Props ) => Result,
	options: CustomRenderOptions = {}
): CustomRenderHookResult< Props, Result > {
	setEnabledFeatures( options.features || [] );

	const {
		viewContext = null,
		registry = createTestRegistry(),
		history = createMemoryHistory(),
		route = undefined,
		inView = true,
		...renderHookOptions
	} = options;

	if ( route ) {
		history.push( route );
	}

	let setInView: Dispatch< SetStateAction< boolean > > | undefined;

	const Wrapper: FC = ( { children } ) => {
		const [ inViewStateValue, setInViewStateValue ] = useState( inView );
		setInView = setInViewStateValue;

		const [ inViewState, setInViewState ] = useState( {
			key: 'renderHook',
			value: inViewStateValue,
		} );

		useEffect( () => {
			setInViewState( {
				key: 'renderHook',
				value: inViewStateValue,
			} );
		}, [ inViewStateValue ] );

		return (
			/* @ts-expect-error - `InViewProvider` is not typed yet. */
			<InViewProvider value={ inViewState }>
				<RegistryProvider value={ registry }>
					<FeaturesProvider value={ enabledFeatures }>
						{ /* @ts-expect-error - `ViewContextProvider` is not typed yet. */ }
						<ViewContextProvider value={ viewContext }>
							<Router history={ history }>{ children }</Router>
						</ViewContextProvider>
					</FeaturesProvider>
				</RegistryProvider>
			</InViewProvider>
		);
	};

	const waitForRegistry = createWaitForRegistry( registry );

	return {
		...renderHook( callback, { wrapper: Wrapper, ...renderHookOptions } ),
		// @ts-expect-error - `waitForRegistry` is not typed yet.
		waitForRegistry: () => actHook( waitForRegistry ),
		setInView,
		registry,
	};
}

// Export our own test utils from this file.
export * from './utils';
export * from './gathering-data-utils';

// Export @testing-library/react as normal.
// eslint-disable-next-line import/export
export * from '@testing-library/react';

// Override `@testing-library/react`'s render method with one that includes
// our data store and other helpers.
// eslint-disable-next-line import/export
export { customRender as render };
// Override @testing-library/react-hooks's renderHook method with our own that
// includes our data store and other helpers.
export { customRenderHook as renderHook };
// Hooks need to use the `act` from @testing-library/react-hooks.
export { actHook };
