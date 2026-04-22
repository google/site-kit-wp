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

/* eslint-disable sitekit/jsdoc-no-unnamed-boolean-params */

/**
 * External dependencies
 */
import fetchMock from 'fetch-mock';
import { debounce, keyBy, mapValues } from 'lodash';

/**
 * WordPress dependencies
 */
import { createRegistry } from '@wordpress/data';
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { NotificationSettings } from '@/js/googlesitekit/notifications/datastore/NotificationSettings';
import * as coreForms from '@/js/googlesitekit/datastore/forms';
import * as coreLocation from '@/js/googlesitekit/datastore/location';
import * as coreModules from '@/js/googlesitekit/modules';
import * as coreSite from '@/js/googlesitekit/datastore/site';
import * as coreUi from '@/js/googlesitekit/datastore/ui';
import * as coreUser from '@/js/googlesitekit/datastore/user';
import * as coreWidgets from '@/js/googlesitekit/widgets';
import * as coreNotifications from '@/js/googlesitekit/notifications';
import * as modulesAds from '@/js/modules/ads';
import * as modulesAdSense from '@/js/modules/adsense';
import * as modulesAnalytics4 from '@/js/modules/analytics-4';
import * as modulesPageSpeedInsights from '@/js/modules/pagespeed-insights';
import * as modulesReaderRevenueManager from '@/js/modules/reader-revenue-manager';
import * as modulesSearchConsole from '@/js/modules/search-console';
import * as modulesSignInWithGoogle from '@/js/modules/sign-in-with-google';
import * as modulesTagManager from '@/js/modules/tagmanager';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
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
} from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import coreModulesFixture from '@/js/googlesitekit/modules/datastore/__fixtures__';
import { singleQuestionSurvey } from '@/js/components/surveys/__fixtures__';

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
export function createTestRegistry() {
	const registry = createRegistry();

	// Register all available stores on the registry.
	registerAllStoresOn( registry );

	return registry;
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
 * @return {void}
 */
export function provideSiteConnection(
	registry: WPDataRegistry,
	extraData: Record< string, unknown > = {}
) {
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
}

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
 * @return {void}
 */
export function provideUserAuthentication(
	registry: WPDataRegistry,
	extraData: Record< string, unknown > = {}
) {
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
}

/**
 * Provides site information data to the given registry.
 *
 * @since 1.17.0
 * @private
 *
 * @param {Object} registry    Registry object to dispatch to.
 * @param {Object} [extraData] Custom data to set, will be merged with defaults. Default empty object.
 * @return {void}
 */
export function provideSiteInfo(
	registry: WPDataRegistry,
	extraData: Record< string, unknown > = {}
) {
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
}

/**
 * Provides user information data to the given registry.
 *
 * @since 1.17.0
 * @private
 *
 * @param {Object} registry    Registry object to dispatch to.
 * @param {Object} [extraData] Custom data to set, will be merged with defaults. Default empty object.
 * @return {void}
 */
export function provideUserInfo(
	registry: WPDataRegistry,
	extraData: Record< string, unknown > = {}
) {
	const defaults = {
		id: 1,
		name: 'Wapuu WordPress',
		full_name: 'Wapuu WordPress PhD',
		email: 'wapuu.wordpress@gmail.com',
		wpEmail: 'wapuu.wordpress@gmail.com',
		picture:
			'https://wapu.us/wp-content/uploads/2017/11/WapuuFinal-100x138.png',
	};

	registry.dispatch( CORE_USER ).receiveUserInfo( {
		...defaults,
		...extraData,
	} );
}

/**
 * Provides user capabilities data to the given registry.
 *
 * @since 1.25.0
 * @private
 *
 * @param {Object} registry    Registry object to dispatch to.
 * @param {Object} [extraData] Custom capability mappings to set, will be merged with defaults. Default empty object.
 * @return {void}
 */
export function provideUserCapabilities(
	registry: WPDataRegistry,
	extraData: Record< string, boolean > = {}
) {
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
}

/**
 * Provides modules data to the given registry.
 *
 * @since 1.17.0
 * @private
 *
 * @param {Object}   registry    Registry object to dispatch to.
 * @param {Object[]} [extraData] List of module objects to be merged with defaults. Default empty array.
 * @return {void}
 */
export function provideModules(
	registry: WPDataRegistry,
	extraData: { slug: string; [ key: string ]: unknown }[] = []
) {
	const extraModules = extraData.reduce( ( acc, module ) => {
		return { ...acc, [ module.slug ]: module };
	}, {} as { [ key: string ]: { slug: string; [ key: string ]: unknown } } );

	const moduleSlugs = (
		coreModulesFixture as Record< string, unknown >[]
	 ).map( ( { slug } ) => slug );

	const modules = ( coreModulesFixture as Record< string, unknown >[] )
		.map( ( module ) => {
			if ( extraModules[ module.slug as string ] ) {
				return { ...module, ...extraModules[ module.slug as string ] };
			}
			return { ...module };
		} )
		.concat(
			extraData.filter( ( { slug } ) => ! moduleSlugs.includes( slug ) )
		);

	registry.dispatch( CORE_MODULES ).receiveGetModules( modules );
}

/**
 * Provides module registration data to the given registry.
 *
 * @since 1.23.0
 * @private
 *
 * @param {Object}   registry    Registry object to dispatch to.
 * @param {Object[]} [extraData] List of module registration data objects to be merged with defaults. Default empty array.
 * @return {void}
 */
export function provideModuleRegistrations(
	registry: WPDataRegistry,
	extraData: { slug: string; [ key: string ]: unknown }[] = []
) {
	const extraDataBySlug = extraData.reduce( ( acc, { slug, ...data } ) => {
		return { ...acc, [ slug ]: { slug, ...data } };
	}, {} as { [ key: string ]: { slug: string; [ key: string ]: unknown } } );

	const { registerModule: realRegisterModule, ...Modules } =
		coreModules.createModules( registry ) as {
			registerModule: (
				slug: string,
				settings: Record< string, unknown >
			) => void;
			[ key: string ]: unknown;
		};
	// Decorate `Modules.registerModule` with a function to apply extra data.
	const registeredModules: Record< string, boolean > = {};

	function testRegisterModule(
		slug: string,
		settings: Record< string, unknown >
	) {
		registeredModules[ slug ] = true;
		return (
			realRegisterModule as ( slug: string, settings: unknown ) => void
		 )( slug, {
			...settings,
			...extraDataBySlug[ slug ],
		} );
	}
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
}

/**
 * Provides the current survey data to the given registry.
 *
 * @since 1.42.0
 * @since 1.98.0 Removed tracking enabling side effect.
 *
 * @param {Object} registry Registry object to dispatch to.
 * @param {Object} survey   The current survey.
 * @return {void}
 */
export function provideCurrentSurvey(
	registry: WPDataRegistry,
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
 * @return {void}
 */
export function provideTracking( registry: WPDataRegistry, enabled = true ) {
	registry.dispatch( CORE_USER ).receiveGetTracking( { enabled } );
}

/**
 * Provides key metrics settings data to the given registry.
 *
 * @since 1.103.0
 *
 * @param {Object} registry    The registry to set up.
 * @param {Object} [extraData] Extra data to merge with the default settings.
 * @return {void}
 */
export function provideKeyMetrics( registry: WPDataRegistry, extraData = {} ) {
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
}

/**
 * Provides key metrics user input settings data to the given registry.
 *
 * @since 1.140.0
 *
 * @param {Object} registry    The registry to set up.
 * @param {Object} [extraData] Extra data to merge with the default settings.
 * @return {void}
 */
export function provideKeyMetricsUserInputSettings(
	registry: WPDataRegistry,
	extraData = {}
) {
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
}

/**
 * Provides notifications data to the given registry.
 *
 * @since 1.149.0
 *
 * @param {Object}   registry        The registry to set up.
 * @param {Object[]} [notifications] List of notification objects to be merged with defaults. Default empty array.
 * @return {void}
 */
export function provideNotifications(
	registry: WPDataRegistry,
	notifications: NotificationSettings[]
) {
	const { registerNotification: realRegisterNotification, ...Notifications } =
		coreNotifications.createNotifications( registry );

	const extraDataByID = keyBy( notifications, 'id' );
	// Decorate `Notifications.registerNotification` with a function to apply
	// extra data.
	const registeredNotifications = new Set< string >();

	function testRegisterNotification(
		id: string,
		settings: NotificationSettings
	) {
		registeredNotifications.add( id );
		return realRegisterNotification( id, {
			...settings,
			...extraDataByID[ id ],
		} );
	}
	( Notifications as Record< string, unknown > ).registerNotification =
		testRegisterNotification;
	// Register defaults with any potential overrides via extraData.
	coreNotifications.registerNotifications( Notifications );

	// Register any additional notifications provided.
	Object.entries( extraDataByID )
		.filter( ( [ id ] ) => ! registeredNotifications.has( id ) )
		.forEach( ( [ id, settings ] ) =>
			realRegisterNotification( id, settings )
		);
}

/**
 * Provides widget registration data to the given registry.
 *
 * @since 1.159.0
 * @private
 *
 * @param {Object}   registry           Registry object to dispatch to.
 * @param {Object[]} [extraWidgetAreas] List of widget area registration data objects to be merged with defaults. Default empty array.
 * @param {Object[]} [extraWidgets]     List of widget registration data objects to be merged with defaults. Default empty array.
 * @return {void}
 */
export function provideWidgetRegistrations(
	registry: WPDataRegistry,
	extraWidgetAreas = [],
	extraWidgets = []
) {
	const extraWidgetAreasBySlug = extraWidgetAreas.reduce(
		// @ts-ignore TODO: Add type safety for this function.
		( acc, { slug, ...data } ) => {
			return { ...acc, [ slug ]: { slug, ...data } };
		},
		{}
	);

	const extraWidgetsBySlug = extraWidgets.reduce(
		// @ts-ignore TODO: Add type safety for this function.
		( acc, { slug, ...data } ) => {
			return { ...acc, [ slug ]: { slug, ...data } };
		},
		{}
	);

	const {
		// @ts-ignore TODO: Add type safety for this function.
		registerWidgetArea: realRegisterWidgetArea,
		// @ts-ignore TODO: Add type safety for this function.
		registerWidget: realRegisterWidget,
		...Widgets
	} = coreWidgets.createWidgets( registry );

	// Track registered widget areas and widgets.
	const registeredWidgetAreas = new Set();
	const registeredWidgets = new Set();

	// Decorate widget area registration with a function to apply extra data.
	// @ts-ignore TODO: Add type safety for this function.
	function testRegisterWidgetArea( slug, settings, contextSlugs ) {
		registeredWidgetAreas.add( slug );
		return realRegisterWidgetArea(
			slug,
			{
				...settings,
				// @ts-ignore TODO: Add type safety for this function.
				...extraWidgetAreasBySlug[ slug ],
			},
			contextSlugs
		);
	}

	// Decorate widget registration with a function to apply extra data.
	// @ts-ignore TODO: Add type safety for this function.
	function testRegisterWidget( slug, settings, widgetAreaSlugs ) {
		registeredWidgets.add( slug );
		return realRegisterWidget(
			slug,
			{
				...settings,
				// @ts-ignore TODO: Add type safety for this function.
				...extraWidgetsBySlug[ slug ],
			},
			widgetAreaSlugs
		);
	}

	// @ts-ignore TODO: Add type safety for this function.
	Widgets.registerWidgetArea = testRegisterWidgetArea;
	// @ts-ignore TODO: Add type safety for this function.
	Widgets.registerWidget = testRegisterWidget;

	// Register default widget areas and widgets from core.
	coreWidgets.registerWidgets( Widgets );

	// Register widgets from all core modules.
	// @ts-ignore TODO: Add type safety for this function.
	allCoreModules.forEach( ( { registerWidgets } ) =>
		registerWidgets?.( Widgets )
	);

	// Register any additional widget areas provided that weren't registered by core.
	Object.entries( extraWidgetAreasBySlug )
		.filter( ( [ slug ] ) => ! registeredWidgetAreas.has( slug ) )
		// @ts-ignore TODO: Add type safety for this function.
		.forEach( ( [ slug, { contextSlugs, ...settings } ] ) =>
			realRegisterWidgetArea( slug, settings, contextSlugs )
		);

	// Register any additional widgets provided that weren't registered by core.
	Object.entries( extraWidgetsBySlug )
		.filter( ( [ slug ] ) => ! registeredWidgets.has( slug ) )
		// @ts-ignore TODO: Add type safety for this function.
		.forEach( ( [ slug, { widgetAreaSlugs, ...settings } ] ) =>
			realRegisterWidget( slug, settings, widgetAreaSlugs )
		);
}

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
 *                                                         (@link https://www.wheresrhys.co.uk/fetch-mock/#api-mockingmock_matcher)
 * @param {*}                                   [response] Optional. Response to return.
 * @return {void}
 */
export function muteFetch(
	matcher: fetchMock.MockMatcher | fetchMock.MockOptions,
	response = {}
) {
	fetchMock.once( matcher, { body: response, status: 200 } );
}

/**
 * Mocks a fetch request in a way so that a response is never returned.
 *
 * Useful for simulating a loading state.
 *
 * @since 1.12.0
 * @since 1.145.0 Added `repeat` option.
 * @private
 *
 * @param {(string|RegExp|Function|URL|Object)} matcher          Criteria for deciding which requests to mock.
 *                                                               (@link https://www.wheresrhys.co.uk/fetch-mock/#api-mockingmock_matcher)
 * @param {Object}                              [options]        Optional. Additional options for the mock.
 * @param {number}                              [options.repeat] Optional. Number of times to mock the request. Defaults to 1.
 * @return {void}
 */
export function freezeFetch(
	matcher: fetchMock.MockMatcher | fetchMock.MockOptions,
	{ repeat = 1 } = {}
) {
	fetchMock.mock( matcher, new Promise( () => {} ), { repeat } );
}

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
 * @return {void}
 */
export function registerAllStoresOn( registry: WPDataRegistry ) {
	[ ...allCoreStores, ...allCoreModules ].forEach( ( { registerStore } ) =>
		registerStore?.( registry )
	);
}

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
export function untilResolved(
	registry: WPDataRegistry,
	storeName: string
): Record< string, () => Promise< unknown > > {
	return mapValues(
		// @ts-expect-error `stores` property is not typed in WPDataRegistry, but
		// it exists on the actual registry instance.
		registry.stores[ storeName ].resolvers || {},
		( _resolverFn, resolverName ) =>
			( ...args: unknown[] ) => {
				return subscribeUntil( registry, () =>
					registry
						.select( storeName )
						.hasFinishedResolution( resolverName, args )
				);
			}
	);
}

/**
 * Subscribes to the given registry until all predicates are satisfied.
 *
 * @since 1.11.0
 * @private
 *
 * @param {Object}      registry   WP data registry instance.
 * @param {...Function} predicates Predicate functions that all must return true to resolve the promise.
 * @return {Promise} Promise that resolves once all predicates are satisfied.
 */
export function subscribeUntil(
	/**
	 * WP data registry instance to subscribe.
	 */
	registry: WPDataRegistry,
	/**
	 * Predicate functions that all must return true to resolve the promise.
	 *
	 * Each predicate will be called on every registry update, and should return a boolean indicating whether the condition is satisfied.
	 */
	...predicates: ( () => boolean )[]
) {
	return new Promise< void >( ( resolve ) => {
		const unsubscribe = registry.subscribe( () => {
			if ( predicates.every( ( predicate ) => predicate() ) ) {
				unsubscribe();
				resolve();
			}
		} );
	} );
}

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
export function waitForDefaultTimeouts() {
	return new Promise( ( resolve ) => {
		setTimeout( resolve, 5 );
	} );
}

/**
 * Creates a delay in the execution of subsequent code for a specified duration in milliseconds.
 *
 * Developers should consider using `waitForRegistry()`, instead of this helper,
 * if state changes occur.
 *
 * @since 1.102.0
 *
 * @param {number} timeout The duration to wait before resolving the promise, in milliseconds.
 * @return {Promise} A promise that resolves after the specified `timeout` duration.
 */
export function waitForTimeouts( timeout: number ) {
	return new Promise( ( resolve ) => {
		setTimeout( resolve, timeout );
	} );
}

/**
 * Checks if fake timers are currently active.
 *
 * @since 1.163.0
 *
 * @return {boolean} Whether fake timers are active.
 */
export function isUsingFakeTimers() {
	// Check if `setTimeout()` is mocked (works in all Jest versions).
	let fakeTimersActive = jest.isMockFunction( setTimeout );

	type MockedSetTimeout = typeof setTimeout & {
		_isMockFunction?: boolean;
		clock?: unknown;
		_timerConfig?: unknown;
	};

	// Additional check for Jest 29+ - check if advance functions exist.
	// These functions only exist when fake timers are enabled, and check
	// the global `setTimeout()` properties without calling warning-generating
	// functions.
	if (
		! fakeTimersActive &&
		typeof jest.advanceTimersByTime === 'function'
	) {
		// In fake timer mode, `setTimeout()` has additional properties.
		try {
			fakeTimersActive =
				( setTimeout as MockedSetTimeout )._isMockFunction === true ||
				typeof ( setTimeout as MockedSetTimeout ).clock !==
					'undefined' ||
				Object.prototype.hasOwnProperty.call(
					setTimeout,
					'_timerConfig'
				);
		} catch ( error ) {
			fakeTimersActive = false;
		}
	}
	return fakeTimersActive;
}

/**
 * Creates a function that allows extra time for registry updates to have completed.
 *
 * @since 1.39.0
 * @since 1.141.0 Reimplemented using debounced timer for reliability. Not compatible with fake timers.
 *
 * @param {Object} registry WP data registry instance.
 * @return {Function} Function to await all registry updates since creation.
 */
export function createWaitForRegistry( registry: WPDataRegistry ) {
	if ( isUsingFakeTimers() ) {
		// Fail if attempted to use.
		return () => {
			throw new Error(
				'waitForRegistry cannot be used with fake timers!'
			);
		};
	}

	let unsubscribe: () => void;
	const waitForRegistry = new Promise( ( resolve ) => {
		const listener = debounce( resolve, 50, {
			leading: false,
			trailing: true,
		} );
		unsubscribe = registry.subscribe( listener );
	} );

	let stateDidUpdate = false;
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
				new Promise< void >( ( resolve, reject ) => {
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
}

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
export function unexpectedSuccess() {
	return Promise.reject(
		new Error(
			'Some code (likely a Promise) succeeded unexpectedly; check your test.'
		)
	);
}
