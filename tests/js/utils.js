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
import coreSiteStore from '../../assets/js/googlesitekit/datastore/site';
import { STORE_NAME as CORE_SITE } from '../../assets/js/googlesitekit/datastore/site/constants';
import coreUserStore from '../../assets/js/googlesitekit/datastore/user';
import { STORE_NAME as CORE_USER } from '../../assets/js/googlesitekit/datastore/user/constants';
import coreFormsStore from '../../assets/js/googlesitekit/datastore/forms';
import { STORE_NAME as CORE_FORMS } from '../../assets/js/googlesitekit/datastore/forms/constants';
import coreModulesStore from '../../assets/js/googlesitekit/modules/datastore';
import { STORE_NAME as CORE_MODULES } from '../../assets/js/googlesitekit/modules/datastore/constants';
import coreWidgetsStore from '../../assets/js/googlesitekit/widgets/datastore';
import { STORE_NAME as CORE_WIDGETS } from '../../assets/js/googlesitekit/widgets/datastore/constants';
import modulesAdSenseStore from '../../assets/js/modules/adsense/datastore';
import { STORE_NAME as MODULES_ADSENSE } from '../../assets/js/modules/adsense/datastore/constants';
import modulesAnalyticsStore from '../../assets/js/modules/analytics/datastore';
import { STORE_NAME as MODULES_ANALYTICS } from '../../assets/js/modules/analytics/datastore/constants';
import modulesPageSpeedInsightsStore from '../../assets/js/modules/pagespeed-insights/datastore';
import { STORE_NAME as MODULES_PAGESPEED_INSIGHTS } from '../../assets/js/modules/pagespeed-insights/datastore/constants';
import modulesSearchConsoleStore from '../../assets/js/modules/search-console/datastore';
import { STORE_NAME as MODULES_SEARCH_CONSOLE } from '../../assets/js/modules/search-console/datastore/constants';
import modulesTagManagerStore from '../../assets/js/modules/tagmanager/datastore';
import { STORE_NAME as MODULES_TAGMANAGER } from '../../assets/js/modules/tagmanager/datastore/constants';
import modulesOptimizeStore from '../../assets/js/modules/optimize/datastore';
import { STORE_NAME as MODULES_OPTIMIZE } from '../../assets/js/modules/optimize/datastore/constants';
import coreModulesFixture from '../../assets/js/googlesitekit/modules/datastore/fixtures.json';
import AdsenseIcon from '../../assets/svg/adsense.svg';
import AnalyticsIcon from '../../assets/svg/analytics.svg';
import PagespeedInsightsIcon from '../../assets/svg/pagespeed-insights.svg';
import SearchConsoleIcon from '../../assets/svg/search-console.svg';
import TagManagerIcon from '../../assets/svg/tagmanager.svg';
import OptimizeIcon from '../../assets/svg/optimize.svg';

/**
 * Creates a registry with all available stores.
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
	provideUserInfo( registry );

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
 * Provides site connection data to the given registry.
 *
 * By default the site will be set to connected.
 *
 * @since 1.17.0
 * @private
 *
 * @param {Object} registry    Registry object to dispatch to.
 * @param {Object} [extraData] Custom data to set, will be merged with defaults. Default empty object.
 */
export const provideSiteConnection = ( registry, extraData = {} ) => {
	const defaultConnected = extraData.connected !== undefined ? extraData.connected : true;
	const defaults = {
		connected: defaultConnected,
		resettable: defaultConnected,
		setupCompleted: defaultConnected,
		hasConnectedAdmins: defaultConnected,
		ownerID: defaultConnected ? 1 : 0,
	};

	registry.dispatch( CORE_SITE ).receiveGetConnection( {
		...defaults,
		...extraData,
	} );
};

/**
 * Provides user authentication data to the given registry.
 *
 * By default the user will be set to authenticated.
 *
 * @since 1.17.0
 * @private
 *
 * @param {Object} registry    Registry object to dispatch to.
 * @param {Object} [extraData] Custom data to set, will be merged with defaults. Default empty object.
 */
export const provideUserAuthentication = ( registry, extraData = {} ) => {
	const defaults = {
		authenticated: true,
		requiredScopes: [],
		grantedScopes: [],
		unsatisfiedScopes: [],
		needsReauthentication: [],
	};

	const mergedData = { ...defaults, ...extraData };
	registry.dispatch( CORE_USER ).receiveGetAuthentication( mergedData );

	// Also set verification info here based on authentication.
	registry.dispatch( CORE_USER ).receiveUserIsVerified( mergedData.authenticated );
};

/**
 * Provides site information data to the given registry.
 *
 * @since 1.17.0
 * @private
 *
 * @param {Object} registry    Registry object to dispatch to.
 * @param {Object} [extraData] Custom data to set, will be merged with defaults. Default empty object.
 */
export const provideSiteInfo = ( registry, extraData = {} ) => {
	const defaults = {
		adminURL: 'http://example.com/wp-admin',
		ampMode: false,
		currentEntityID: null,
		currentEntityTitle: null,
		currentEntityType: null,
		currentEntityURL: null,
		homeURL: 'http://example.com',
		proxyPermissionsURL: 'https://sitekit.withgoogle.com/site-management/permissions/',
		proxySetupURL: 'https://sitekit.withgoogle.com/site-management/setup/',
		referenceSiteURL: 'http://example.com',
		siteName: 'My Site Name',
		timezone: 'America/Detroit',
		usingProxy: true,
	};

	registry.dispatch( CORE_SITE ).receiveSiteInfo( {
		...defaults,
		...extraData,
	} );
};

/**
 * Provides user information data to the given registry.
 *
 * @since 1.17.0
 * @private
 *
 * @param {Object} registry    Registry object to dispatch to.
 * @param {Object} [extraData] Custom data to set, will be merged with defaults. Default empty object.
 */
export const provideUserInfo = ( registry, extraData = {} ) => {
	const defaults = {
		id: 1,
		name: 'Wapuu WordPress',
		email: 'wapuu.wordpress@gmail.com',
		picture: 'https://wapu.us/wp-content/uploads/2017/11/WapuuFinal-100x138.png',
	};

	registry.dispatch( CORE_USER ).receiveUserInfo( {
		...defaults,
		...extraData,
	} );
};

/**
 * Registers the given module with settings to the given registry.
 *
 * @since n.e.x.t
 * @private
 *
 * @param {Object}   registry    Registry object to dispatch to.
 * @param {Object[]} [extraData] List of module objects to be merged with defaults. Default empty array.
 */
export const provideModuleRegistrations = ( registry, extraData = [] ) => {
	const moduleIconMap = {
		adsense: AdsenseIcon,
		analytics: AnalyticsIcon,
		optimize: OptimizeIcon,
		'pagespeed-insights': PagespeedInsightsIcon,
		'search-console': SearchConsoleIcon,
		tagmanager: TagManagerIcon,
	};

	for ( const slug in moduleIconMap ) {
		registry.dispatch( CORE_MODULES ).registerModule( slug, { ...extraData[ slug ], icon: moduleIconMap[ slug ] } );
	}
};

/**
 * Provides modules data to the given registry.
 *
 * @since 1.17.0
 * @private
 *
 * @param {Object}   registry    Registry object to dispatch to.
 * @param {Object[]} [extraData] List of module objects to be merged with defaults. Default empty array.
 */
export const provideModules = ( registry, extraData = [] ) => {
	const extraModules = extraData.reduce( ( acc, module ) => {
		return { ...acc, [ module.slug ]: module };
	}, {} );

	const moduleSlugs = coreModulesFixture.map( ( { slug } ) => slug );
	const modules = coreModulesFixture
		.map( ( module ) => {
			if ( extraModules[ module.slug ] ) {
				return { ...module, ...extraModules[ module.slug ] };
			}
			return { ...module };
		} )
		.concat(
			extraData.filter( ( { slug } ) => ! moduleSlugs.includes( slug ) ),
		)
    ;

	registry.dispatch( CORE_MODULES ).receiveGetModules( modules );
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
	fetchMock.once( matcher, new Promise( () => {
	} ) );
};

/**
 * Registers all Site Kit stores on a registry.
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
	registry.registerStore( CORE_SITE, coreSiteStore );
	registry.registerStore( CORE_USER, coreUserStore );
	registry.registerStore( CORE_FORMS, coreFormsStore );
	registry.registerStore( CORE_MODULES, coreModulesStore );
	registry.registerStore( CORE_WIDGETS, coreWidgetsStore );
	registry.registerStore( MODULES_ADSENSE, modulesAdSenseStore );
	registry.registerStore( MODULES_ANALYTICS, modulesAnalyticsStore );
	registry.registerStore( MODULES_PAGESPEED_INSIGHTS, modulesPageSpeedInsightsStore );
	registry.registerStore( MODULES_SEARCH_CONSOLE, modulesSearchConsoleStore );
	registry.registerStore( MODULES_TAGMANAGER, modulesTagManagerStore );
	registry.registerStore( MODULES_OPTIMIZE, modulesOptimizeStore );
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
				() => registry.select( storeName ).hasFinishedResolution( resolverName, args ),
			);
		},
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
 * Returns a rejection.
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
		'Some code (likely a Promise) succeeded unexpectedly; check your test.',
	) );
};
