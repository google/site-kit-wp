/**
 * External dependencies
 */
import castArray from 'lodash/castArray';
import mapValues from 'lodash/mapValues';
import fetchMock from 'fetch-mock';

/**
 * WordPress dependencies
 */
import { createRegistry, RegistryProvider } from '@wordpress/data';

/**
 * Internal dependencies
 */
import coreSiteStore, { STORE_NAME as coreSiteStoreName } from '../../assets/js/googlesitekit/datastore/site';
import coreUserStore, { STORE_NAME as coreUserStoreName } from '../../assets/js/googlesitekit/datastore/user';
import coreFormsStore, { STORE_NAME as coreFormsStoreName } from '../../assets/js/googlesitekit/datastore/forms';
import coreModulesStore, { STORE_NAME as coreModulesStoreName } from '../../assets/js/googlesitekit/modules/datastore';
import coreWidgetsStore, { STORE_NAME as coreWidgetsStoreName } from '../../assets/js/googlesitekit/widgets/datastore';
import modulesAdSenseStore, { STORE_NAME as modulesAdSenseStoreName } from '../../assets/js/modules/adsense/datastore';
import modulesAnalyticsStore, { STORE_NAME as modulesAnalyticsStoreName } from '../../assets/js/modules/analytics/datastore';
import modulesPageSpeedInsightsStore, { STORE_NAME as modulesPageSpeedInsightsStoreName } from '../../assets/js/modules/pagespeed-insights/datastore';
import modulesSearchConsoleStore, { STORE_NAME as modulesSearchConsoleStoreName } from '../../assets/js/modules/search-console/datastore';
import modulesTagManagerStore, { STORE_NAME as modulesTagManagerStoreName } from '../../assets/js/modules/tagmanager/datastore';
import modulesOptimizeStore, { STORE_NAME as modulesOptimizeStoreName } from '../../assets/js/modules/optimize/datastore';

/**
 * Create a registry with all available stores.
 *
 * @since 1.5.0
 * @private
 *
 * @return {wp.data.registry} Registry with all available stores registered.
 */
export const createTestRegistry = () => {
	const registry = createRegistry();

	// Register all available stores on the registry.
	registerAllStoresOn( registry );

	return registry;
};

/**
 * Wraps children components with a fresh test registry,
 * which can be configured by its callback prop.
 *
 * @since 1.7.1
 * @private
 *
 * @param {?Object}   props          Component props.
 * @param {?Function} props.callback Function which receives the registry instance.
 * @param {?Object}   props.registry Registry object; uses `createTestRegistry()` by default.
 * @return {WPElement} Wrapped components.
 */
export function WithTestRegistry( { children, callback, registry = createTestRegistry() } = {} ) {
	// Populate most basic data which should not affect any tests.
	registry.dispatch( coreUserStoreName ).receiveUserInfo( {
		id: 1,
		name: 'Wapuu WordPress',
		email: 'wapuu.wordpress@gmail.com',
		picture: 'https://wapu.us/wp-content/uploads/2017/11/WapuuFinal-100x138.png',
	} );

	if ( callback ) {
		callback( registry );
	}

	return (
		<RegistryProvider value={ registry }>
			{ children }
		</RegistryProvider>
	);
}

/**
 * Mute a given console during tests.
 *
 * Use this to mute expect console output during tests for things like
 * API fetch errors or other things you expect to log to console but don't
 * want appearing in the jest output.
 *
 * @since 1.5.0
 * @private
 *
 * @param {string} type  Type of console to mute (one of: `'error'`, `'warn'`, `'log'`, `'info'`, or `'debug'`).
 * @param {number} times Number of times to mute console output perform resuming.
 */
export const muteConsole = ( type = 'error', times = 1 ) => {
	Array.from( { length: times } ).forEach( () => {
		global.console[ type ].mockImplementationOnce( () => jest.fn() );
	} );
};

/**
 * Mutes a fetch request to the given URL once.
 *
 * Useful for mocking a request for the purpose of preventing a fetch error
 * where the response itself is not significant but the request should not fail.
 * Sometimes a different response may be required to match the expected type,
 * but for anything else, a full mock should be used.
 *
 * @since 1.10.0
 * @private
 *
 * @param {(string|RegExp|Function|URL|Object)} matcher    Criteria for deciding which requests to mock.
 *                                                        (@link https://www.wheresrhys.co.uk/fetch-mock/#api-mockingmock_matcher)
 * @param {*}                                   [response] Optional. Response to return.
 */
export const muteFetch = ( matcher, response = {} ) => {
	fetchMock.once( matcher, { body: response, status: 200 } );
};

/**
 * Mocks a fetch request in a way so that a response is never returned.
 *
 * Useful for simulating a loading state.
 *
 * @since 1.12.0
 * @private
 *
 * @param {(string|RegExp|Function|URL|Object)} matcher Criteria for deciding which requests to mock.
 *                                                      (@link https://www.wheresrhys.co.uk/fetch-mock/#api-mockingmock_matcher)
 */
export const freezeFetch = ( matcher ) => {
	fetchMock.once( matcher, new Promise( () => {} ) );
};

/**
 * Register all Site Kit stores on a registry.
 *
 * Use this to register every available Site Kit store on a registry.
 * Useful for testing, when you want to ensure that every registry is
 * available for connected components and data store tests to use.
 *
 * @since 1.5.0
 * @private
 *
 * @param {wp.data.registry} registry Registry to register each store on.
 */
export const registerAllStoresOn = ( registry ) => {
	registry.registerStore( coreSiteStoreName, coreSiteStore );
	registry.registerStore( coreUserStoreName, coreUserStore );
	registry.registerStore( coreFormsStoreName, coreFormsStore );
	registry.registerStore( coreModulesStoreName, coreModulesStore );
	registry.registerStore( coreWidgetsStoreName, coreWidgetsStore );
	registry.registerStore( modulesAdSenseStoreName, modulesAdSenseStore );
	registry.registerStore( modulesAnalyticsStoreName, modulesAnalyticsStore );
	registry.registerStore( modulesPageSpeedInsightsStoreName, modulesPageSpeedInsightsStore );
	registry.registerStore( modulesSearchConsoleStoreName, modulesSearchConsoleStore );
	registry.registerStore( modulesTagManagerStoreName, modulesTagManagerStore );
	registry.registerStore( modulesOptimizeStoreName, modulesOptimizeStore );
};

const unsubscribes = [];
export const subscribeWithUnsubscribe = ( registry, ...args ) => {
	const unsubscribe = registry.subscribe( ...args );
	unsubscribes.push( unsubscribe );
	return unsubscribe;
};

/**
 * Returns an object that returns hasFinishedResolution selectors for each key
 * that are bound to the given registry and store name.
 *
 * @example
 * await untilResolved( registry, STORE_NAME ).selectorWithResolver( arg1, arg2, arg3 );
 *
 * @since 1.11.0
 * @private
 *
 * @param {Object} registry  WP data registry instance.
 * @param {string} storeName Store name the selector belongs to.
 * @return {Object} Object with keys as functions for each resolver in the given store.
 */
export const untilResolved = ( registry, storeName ) => {
	return mapValues(
		registry.stores[ storeName ].resolvers || {},
		( resolverFn, resolverName ) => ( ...args ) => {
			return subscribeUntil(
				registry,
				() => registry.select( storeName ).hasFinishedResolution( resolverName, args )
			);
		}
	);
};

export const subscribeUntil = ( registry, predicates ) => {
	predicates = castArray( predicates );

	return new Promise( ( resolve ) => {
		subscribeWithUnsubscribe( registry, () => {
			if ( predicates.every( ( predicate ) => predicate() ) ) {
				resolve();
			}
		} );
	} );
};

export const unsubscribeFromAll = () => {
	let unsubscribe;
	while ( ( unsubscribe = unsubscribes.shift() ) ) {
		unsubscribe();
	}
};

/**
 * Return a rejection.
 *
 * Used to ensure that a test will fail if it reaches this point.
 * Useful for asynchronous code that has multiple code paths, eg:
 *
 * ```js
 * try {
 *   await codeThatThrowsAnError();
 *   return unexpectedSuccess();
 * } catch (err) {
 *   expect(err.message).toEqual('Some error.');
 * }
 * ```
 *
 * Use this to ensure that the unintended path throws an error rather than
 * silently succeed.
 *
 * @since 1.5.0
 * @private
 *
 * @return {Promise} A rejected promise.
 */
export const unexpectedSuccess = () => {
	return Promise.reject( new Error(
		'Some code (likely a Promise) succeeded unexpectedly; check your test.'
	) );
};
