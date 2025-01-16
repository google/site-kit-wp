/**
 * Site Kit by Google, Copyright 2023 Google LLC
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
import fetchMock from 'fetch-mock';
import { debounce, mapValues } from 'lodash';
import { createMemoryHistory } from 'history';
import { Router } from 'react-router';

/**
 * WordPress dependencies
 */
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as coreForms from '../../assets/js/googlesitekit/datastore/forms';
import * as coreLocation from '../../assets/js/googlesitekit/datastore/location';
import * as coreModules from '../../assets/js/googlesitekit/modules';
import * as coreSite from '../../assets/js/googlesitekit/datastore/site';
import * as coreUi from '../../assets/js/googlesitekit/datastore/ui';
import * as coreUser from '../../assets/js/googlesitekit/datastore/user';
import * as coreWidgets from '../../assets/js/googlesitekit/widgets';
import * as coreNotifications from '../../assets/js/googlesitekit/notifications';
import * as modulesAds from '../../assets/js/modules/ads';
import * as modulesAdSense from '../../assets/js/modules/adsense';
import * as modulesAnalytics4 from '../../assets/js/modules/analytics-4';
import * as modulesPageSpeedInsights from '../../assets/js/modules/pagespeed-insights';
import * as modulesReaderRevenueManager from '../../assets/js/modules/reader-revenue-manager';
import * as modulesSearchConsole from '../../assets/js/modules/search-console';
import * as modulesSignInWithGoogle from '../../assets/js/modules/sign-in-with-google';
import * as modulesTagManager from '../../assets/js/modules/tagmanager';
import { CORE_SITE } from '../../assets/js/googlesitekit/datastore/site/constants';
import {
	PERMISSION_AUTHENTICATE,
	PERMISSION_SETUP,
	PERMISSION_VIEW_POSTS_INSIGHTS,
	PERMISSION_VIEW_DASHBOARD,
	PERMISSION_VIEW_MODULE_DETAILS,
	PERMISSION_MANAGE_OPTIONS,
	CORE_USER,
	KM_ANALYTICS_RETURNING_VISITORS,
	KM_ANALYTICS_NEW_VISITORS,
} from '../../assets/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '../../assets/js/googlesitekit/modules/datastore/constants';
import FeaturesProvider from '../../assets/js/components/FeaturesProvider';
import coreModulesFixture from '../../assets/js/googlesitekit/modules/datastore/__fixtures__';
import { singleQuestionSurvey } from '../../assets/js/components/surveys/__fixtures__';
import InViewProvider from '../../assets/js/components/InViewProvider';
import { DEFAULT_NOTIFICATIONS } from '../../assets/js/googlesitekit/notifications/register-defaults';

const allCoreStores = [
	coreForms,
	coreLocation,
	coreModules,
	coreSite,
	coreUser,
	coreUi,
	coreWidgets,
	coreNotifications,
];
const allCoreModules = [
	modulesAds,
	modulesAdSense,
	modulesAnalytics4,
	modulesPageSpeedInsights,
	modulesReaderRevenueManager,
	modulesSearchConsole,
	modulesSignInWithGoogle,
	modulesTagManager,
];

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
 * @param {Object}    [props]          Component props.
 * @param {Function}  [props.callback] Function which receives the registry instance.
 * @param {WPElement} [props.children] Children components.
 * @param {History}   [props.history]  History object for React Router. Defaults to MemoryHistory.
 * @param {string}    [props.route]    Route to pass to history as starting route.
 * @param {string[]}  [props.features] Feature flags to enable for this test registry provider.
 * @param {Object}    [props.registry] Registry object; uses `createTestRegistry()` by default.
 * @return {WPElement} Wrapped components.
 */
export function WithTestRegistry( {
	children,
	callback,
	features = [],
	registry = createTestRegistry(),
	history = createMemoryHistory(),
	route = undefined,
} = {} ) {
	const enabledFeatures = new Set( features );
	// Populate most basic data which should not affect any tests.
	provideUserInfo( registry );

	if ( route ) {
		history.push( route );
	}

	if ( callback ) {
		callback( registry );
	}

	const [ inViewState ] = useState( {
		key: 'renderStory',
		value: true,
	} );

	return (
		<InViewProvider value={ inViewState }>
			<RegistryProvider value={ registry }>
				<FeaturesProvider value={ enabledFeatures }>
					<Router history={ history }>{ children }</Router>
				</FeaturesProvider>
			</RegistryProvider>
		</InViewProvider>
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
	const defaultConnected =
		extraData.connected !== undefined ? extraData.connected : true;
	const defaults = {
		connected: defaultConnected,
		resettable: defaultConnected,
		setupCompleted: defaultConnected,
		hasConnectedAdmins: defaultConnected,
		hasMultipleAdmins: false,
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
		needsReauthentication: false,
		disconnectedReason: '',
	};

	const mergedData = { ...defaults, ...extraData };
	registry.dispatch( CORE_USER ).receiveGetAuthentication( mergedData );

	// Also set verification info here based on authentication.
	registry
		.dispatch( CORE_USER )
		.receiveUserIsVerified( mergedData.authenticated );
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
		proxyPermissionsURL:
			'https://sitekit.withgoogle.com/site-management/permissions/',
		proxySetupURL: 'https://sitekit.withgoogle.com/site-management/setup/',
		proxySupportLinkURL: 'https://sitekit.withgoogle.com/support/',
		widgetsAdminURL: 'http://example.com/wp-admin/widgets.php',
		referenceSiteURL: 'http://example.com',
		siteName: 'My Site Name',
		timezone: 'America/Detroit',
		usingProxy: true,
		postTypes: [
			{
				slug: 'post',
				label: 'Posts',
			},
			{
				slug: 'page',
				label: 'Pages',
			},
			{
				slug: 'attachment',
				label: 'Media',
			},
		],
		productPostType: 'product',
		keyMetricsSetupCompletedBy: 0,
		keyMetricsSetupNew: false,
		anyoneCanRegister: false,
		isMultisite: false,
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
		full_name: 'Wapuu WordPress PhD',
		email: 'wapuu.wordpress@gmail.com',
		picture:
			'https://wapu.us/wp-content/uploads/2017/11/WapuuFinal-100x138.png',
	};

	registry.dispatch( CORE_USER ).receiveUserInfo( {
		...defaults,
		...extraData,
	} );
};

/**
 * Provides user capabilities data to the given registry.
 *
 * @since 1.25.0
 * @private
 *
 * @param {Object} registry    Registry object to dispatch to.
 * @param {Object} [extraData] Custom capability mappings to set, will be merged with defaults. Default empty object.
 */
export const provideUserCapabilities = ( registry, extraData = {} ) => {
	const defaults = {
		[ PERMISSION_AUTHENTICATE ]: true,
		[ PERMISSION_SETUP ]: true,
		[ PERMISSION_VIEW_POSTS_INSIGHTS ]: true,
		[ PERMISSION_VIEW_DASHBOARD ]: true,
		[ PERMISSION_VIEW_MODULE_DETAILS ]: true,
		[ PERMISSION_MANAGE_OPTIONS ]: true,
	};

	registry.dispatch( CORE_USER ).receiveCapabilities( {
		...defaults,
		...extraData,
	} );
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
			extraData.filter( ( { slug } ) => ! moduleSlugs.includes( slug ) )
		);

	registry.dispatch( CORE_MODULES ).receiveGetModules( modules );
};

/**
 * Provides module registration data to the given registry.
 *
 * @since 1.23.0
 * @private
 *
 * @param {Object}   registry    Registry object to dispatch to.
 * @param {Object[]} [extraData] List of module registration data objects to be merged with defaults. Default empty array.
 */
export const provideModuleRegistrations = ( registry, extraData = [] ) => {
	const extraDataBySlug = extraData.reduce( ( acc, { slug, ...data } ) => {
		return { ...acc, [ slug ]: { slug, ...data } };
	}, {} );
	const { registerModule: realRegisterModule, ...Modules } =
		coreModules.createModules( registry );
	// Decorate `Modules.registerModule` with a function to apply extra data.
	const registeredModules = {};
	const testRegisterModule = ( slug, settings ) => {
		registeredModules[ slug ] = true;
		return realRegisterModule( slug, {
			...settings,
			...extraDataBySlug[ slug ],
		} );
	};
	Modules.registerModule = testRegisterModule;

	allCoreModules.forEach( ( { registerModule } ) =>
		registerModule?.( Modules )
	);
	// Register any additional modules provided.
	Object.entries( extraDataBySlug )
		.filter( ( [ slug ] ) => registeredModules[ slug ] !== true )
		.forEach( ( [ slug, settings ] ) =>
			realRegisterModule( slug, settings )
		);
};

/**
 * Provides the current survey data to the given registry.
 *
 * @since 1.42.0
 * @since 1.98.0 Removed tracking enabling side effect.
 *
 * @param {Object} registry Registry object to dispatch to.
 * @param {Object} survey   The current survey.
 */
export function provideCurrentSurvey(
	registry,
	survey = singleQuestionSurvey
) {
	registry.dispatch( CORE_USER ).receiveGetSurvey( { survey } );
}

/**
 * Provides user tracking consent state.
 *
 * @since 1.98.0
 *
 * @param {Object}  registry Registry object to dispatch to.
 * @param {boolean} enabled  Optional. Whether tracking consent has been granted. Defaults to `true`.
 */
export function provideTracking( registry, enabled = true ) {
	registry.dispatch( CORE_USER ).receiveGetTracking( { enabled } );
}

/**
 * Provides key metrics settings data to the given registry.
 *
 * @since 1.103.0
 *
 * @param {Object} registry    The registry to set up.
 * @param {Object} [extraData] Extra data to merge with the default settings.
 */
export const provideKeyMetrics = ( registry, extraData = {} ) => {
	const defaults = {
		widgetSlugs: [
			KM_ANALYTICS_NEW_VISITORS,
			KM_ANALYTICS_RETURNING_VISITORS,
		],
		isWidgetHidden: false,
	};
	registry.dispatch( CORE_USER ).receiveGetKeyMetricsSettings( {
		...defaults,
		...extraData,
	} );
};

/**
 * Provides key metrics user input settings data to the given registry.
 *
 * @since 1.140.0
 *
 * @param {Object} registry    The registry to set up.
 * @param {Object} [extraData] Extra data to merge with the default settings.
 */
export const provideKeyMetricsUserInputSettings = (
	registry,
	extraData = {}
) => {
	const defaults = {
		purpose: {
			values: [ 'publish_news' ],
			scope: 'site',
		},
		includeConversionEvents: {
			values: [],
			scope: 'site',
		},
	};
	registry.dispatch( CORE_USER ).receiveGetUserInputSettings( {
		...defaults,
		...extraData,
	} );
};

/**
 * Provides notifications data to the given registry.
 *
 * @since 1.140.0
 * @since 1.142.0 Updated the `overwrite` option to be a named parameter.
 *
 * @param {Object}  registry            The registry to set up.
 * @param {Object}  [extraData]         Extra data to merge with the default settings.
 * @param {Object}  [options]           Options object.
 * @param {boolean} [options.overwrite] Merges extra data with default notifications when false, else overwrites default notifications.
 */
export const provideNotifications = (
	registry,
	extraData,
	{ overwrite = false } = {}
) => {
	const notificationsAPI = coreNotifications.createNotifications( registry );

	let notifications = {};
	if ( overwrite === false ) {
		notifications[ 'gathering-data-notification' ] =
			DEFAULT_NOTIFICATIONS[ 'gathering-data-notification' ];
	}
	notifications = { ...notifications, ...extraData };

	for ( const notificationID in notifications ) {
		notificationsAPI.registerNotification(
			notificationID,
			notifications[ notificationID ]
		);
	}
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
 * @since n.e.x.t Added `times` option.
 * @private
 *
 * @param {(string|RegExp|Function|URL|Object)} matcher         Criteria for deciding which requests to mock.
 *                                                              (@link https://www.wheresrhys.co.uk/fetch-mock/#api-mockingmock_matcher)
 * @param {Object}                              [options]       Optional. Additional options for the mock.
 * @param {number}                              [options.times] Optional. Number of times to mock the request. Defaults to 1.
 */
export const freezeFetch = ( matcher, { times = 1 } = {} ) => {
	fetchMock.mock( matcher, new Promise( () => {} ), { repeat: times } );
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
	[ ...allCoreStores, ...allCoreModules ].forEach( ( { registerStore } ) =>
		registerStore?.( registry )
	);
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
		( resolverFn, resolverName ) =>
			( ...args ) => {
				return subscribeUntil( registry, () =>
					registry
						.select( storeName )
						.hasFinishedResolution( resolverName, args )
				);
			}
	);
};

/**
 * Subscribes to the given registry until all predicates are satisfied.
 *
 * @since 1.11.0
 * @private
 *
 * @param {Object}      registry   WP data registry instance.
 * @param {...Function} predicates Predicate functions.
 * @return {Promise} Promise that resolves once all predicates are satisfied.
 */
export const subscribeUntil = ( registry, ...predicates ) => {
	return new Promise( ( resolve ) => {
		const unsubscribe = registry.subscribe( () => {
			if ( predicates.every( ( predicate ) => predicate() ) ) {
				unsubscribe();
				resolve();
			}
		} );
	} );
};

/**
 * Waits for 5ms to ensure all pending timeouts set with the default 1ms will have executed.
 *
 * Introduced as a result of updating to @wordpress/data 4.23.0, which introduces a resolver cache and a related call to setTimeout for each resolver.
 * The delay is 5ms because the resolver setTimeout is using the default which is 1ms in Node, so in order to ensure our setTimeout will execute after
 * all pending resolvers we need to specify a higher timeout than 1ms. The value 5ms, rather than say 2ms is used in order to provide a degree of headroom,
 * as "Node.js makes no guarantees about the exact timing of when callbacks will fire, nor of their ordering".
 *
 * Obviously, this function will result in _any_ pending 1ms timeouts being waited for (and within-5ms timeouts, although not being the default, these
 * are less likely to be in progress), but it's primarily introduced to wait for resolvers, with the delay calibrated accordingly.
 *
 * References:
 * - @wordpress/data: https://github.com/WordPress/gutenberg/blob/07baf5a12007d31bbd4ee22113b07952f7eacc26/packages/data/src/namespace-store/index.js#L294-L310.
 * - Node setTimeout: https://nodejs.org/docs/latest-v14.x/api/timers.html#timers_settimeout_callback_delay_args.
 *
 * @since 1.92.0
 *
 * @return {Promise} Promise that resolves after a 2ms timeout.
 */
export const waitForDefaultTimeouts = () => {
	return new Promise( ( resolve ) => {
		setTimeout( resolve, 5 );
	} );
};

/**
 * Creates a delay in the execution of subsequent code for a specified duration in milliseconds.
 *
 * @since 1.102.0
 *
 * @param {number} timeout The duration to wait before resolving the promise, in milliseconds.
 * @return {Promise} A promise that resolves after the specified `timeout` duration.
 */
export const waitForTimeouts = ( timeout ) => {
	return new Promise( ( resolve ) => {
		setTimeout( resolve, timeout );
	} );
};

/**
 * Creates a function that allows extra time for registry updates to have completed.
 *
 * @since 1.39.0
 * @since 1.141.0 Reimplemented using debounced timer for reliability. Not compatible with fake timers.
 *
 * @param {Object} registry WP data registry instance.
 * @return {Function} Function to await all registry updates since creation.
 */
export const createWaitForRegistry = ( registry ) => {
	if ( jest.isMockFunction( setTimeout ) ) {
		// Fail if attempted to use.
		return () => {
			throw new Error(
				'waitForRegistry cannot be used with fake timers!'
			);
		};
	}

	let unsubscribe;
	const waitForRegistry = new Promise( ( resolve ) => {
		const listener = debounce( resolve, 50, {
			leading: false,
			trailing: true,
		} );
		unsubscribe = registry.subscribe( listener );
	} );

	let stateDidUpdate;
	// On the first state update, clear the fallback.
	const unsubStateUpdateListener = registry.subscribe( () => {
		stateDidUpdate = true;
		unsubStateUpdateListener();
	} );
	return async () => {
		const promises = [ waitForRegistry ];

		if ( ! stateDidUpdate ) {
			// If no state update was observed yet, allow 50ms for it to still happen or reject the promise.
			promises.push(
				new Promise( ( resolve, reject ) => {
					setTimeout( () => {
						if ( stateDidUpdate ) {
							resolve();
							return;
						}
						reject(
							new Error(
								'waitForRegistry: No state changes were observed! Replace waitForRegistry with waitFor.'
							)
						);
					}, 50 );
				} )
			);
		}

		await Promise.all( promises ).finally( unsubscribe );
	};
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
	return Promise.reject(
		new Error(
			'Some code (likely a Promise) succeeded unexpectedly; check your test.'
		)
	);
};
