/**
 * Mock enabledFeatures.
 */
vi.mock( '../../features/index', () => {
	return {
		enabledFeatures: [ 'feature1', 'feature2' ],
	};
} );

/**
 * Internal dependencies
 */
import createTracking from './createTracking';
import { DATA_LAYER } from './constants';
import { disableTracking, enableTracking, isTrackingEnabled } from './index';

function resetGlobals() {
	delete global._googlesitekitBaseData;
	delete global[ DATA_LAYER ];
}

function fakeTimeouts( func ) {
	vi.useFakeTimers();
	const promise = func();
	vi.runAllTimers();
	return promise;
}

describe( 'disableTracking and isTrackingEnabled', () => {
	afterEach( resetGlobals );

	it( 'does not mutate global tracking settings when toggling active state', () => {
		global._googlesitekitBaseData = { trackingEnabled: true };

		disableTracking();

		expect( isTrackingEnabled() ).toStrictEqual( false );
		expect( global._googlesitekitBaseData.trackingEnabled ).toStrictEqual(
			true
		);
	} );
} );

describe( 'enableTracking and isTrackingEnabled', () => {
	afterEach( resetGlobals );

	it( 'does not mutate global tracking settings when toggling active state', () => {
		global._googlesitekitBaseData = { trackingEnabled: false };

		enableTracking();

		expect( isTrackingEnabled() ).toStrictEqual( true );
		expect( global._googlesitekitBaseData.trackingEnabled ).toStrictEqual(
			false
		);
	} );
} );

describe( 'trackEvent', () => {
	let consoleResponse = null;
	beforeEach( () => {
		consoleResponse = null;
		vi.spyOn( console, 'warn' ).mockImplementation( () => {
			consoleResponse = 'warned';
		} );
	} );
	afterEach( resetGlobals );

	it( 'adds a tracking event to the dataLayer', async () => {
		const config = {
			referenceSiteURL: 'https://www.example.com/',
			userIDHash: 'a1b2c3',
			trackingID: 'G-EQDN3BWDSD',
			activeModules: [],
			trackingEnabled: true,
			userRoles: [ 'administrator' ],
			isAuthenticated: 1,
			pluginVersion: '1.2.3',
		};

		let pushArgs;
		const dataLayer = {
			[ DATA_LAYER ]: {
				push: ( ...args ) => ( pushArgs = args ),
			},
		};
		const { trackEvent, initializeSnippet } = createTracking(
			config,
			dataLayer
		);

		const { scriptTagSrc } = await initializeSnippet();

		// Ignore warning (see below) since irrelevant for this test.
		await fakeTimeouts( () =>
			trackEvent( 'category', 'name', 'label', 'value' )
		);

		// dataLayerPush must push an instance of `Arguments` onto the data layer.
		// Because `arguments` is a special, `Array`-like object (but not an actual `Array`),
		// we can only create it using the magic `arguments` variable
		// made available to normal, non-arrow functions.
		expect( consoleResponse ).toBe( 'warned' );
		expect( pushArgs.length ).toEqual( 1 );
		expect( Object.prototype.toString.apply( pushArgs[ 0 ] ) ).toEqual(
			'[object Arguments]'
		);
		expect( pushArgs[ 0 ].length ).toEqual( 3 );
		const [ event, eventName, eventData ] = pushArgs[ 0 ];
		expect( event ).toEqual( 'event' );
		expect( eventName ).toEqual( 'name' );
		expect( eventData ).toEqual(
			expect.objectContaining( {
				send_to: 'site_kit',
				event_category: 'category',
				event_label: 'label',
				value: 'value',
			} )
		);
		expect( pushArgs[ 0 ][ 2 ] ).toHaveProperty( 'event_callback' );
		const expectedTagSrc = `https://www.googletagmanager.com/gtag/js?id=${ config.trackingID }&l=${ DATA_LAYER }`;
		expect( scriptTagSrc ).toEqual( expectedTagSrc );
	} );

	it( 'does not push to dataLayer when tracking is disabled', async () => {
		const push = vi.fn();
		const dataLayer = {
			[ DATA_LAYER ]: { push },
		};
		const { trackEvent } = createTracking(
			{ trackingEnabled: false },
			dataLayer
		);

		await fakeTimeouts( () =>
			trackEvent(
				'test-category',
				'test-name',
				'test-label',
				'test-value'
			)
		);
		expect( push ).not.toHaveBeenCalled();
	} );

	it( 'resolves without warning when event_callback is called', async () => {
		const dataLayer = {
			[ DATA_LAYER ]: {
				push: ( args ) => args[ 2 ].event_callback(),
			},
		};
		const { trackEvent } = createTracking(
			{ trackingEnabled: true },
			dataLayer
		);

		const consoleWarnSpy = vi.spyOn( global.console, 'warn' );
		await fakeTimeouts( () =>
			trackEvent(
				'test-category',
				'test-name',
				'test-label',
				'test-value'
			)
		);
		expect( consoleWarnSpy ).not.toHaveBeenCalled();
		consoleWarnSpy.mockClear();
	} );

	it( 'resolves with warning when event_callback is not called (within one second)', async () => {
		const dataLayer = {
			[ DATA_LAYER ]: {
				push: () => {},
			},
		};

		const { trackEvent } = createTracking(
			{ trackingEnabled: true },
			dataLayer
		);

		const consoleWarnSpy = vi.spyOn( global.console, 'warn' );
		await fakeTimeouts( () =>
			trackEvent(
				'test-category',
				'test-name',
				'test-label',
				'test-value'
			)
		);
		expect( consoleResponse ).toBe( 'warned' );
		expect( consoleWarnSpy ).toHaveBeenCalledWith(
			'Tracking event "test-name" (category "test-category") took too long to fire.'
		);
		consoleWarnSpy.mockClear();
	} );
} );
