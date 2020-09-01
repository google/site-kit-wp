
/**
 * Internal dependencies
 */
import createTracking from './createTracking';
import { DATA_LAYER } from './constants';
import {
	disableTracking,
	enableTracking,
	isTrackingEnabled,
} from './index';
import { muteConsole } from '../../../../tests/js/test-utils';

const resetGlobals = () => {
	delete global._googlesitekitBaseData;
	delete global[ DATA_LAYER ];
};

const fakeTimeouts = ( func ) => {
	jest.useFakeTimers();
	const promise = func();
	jest.runAllTimers();
	return promise;
};

describe( 'createTracking', () => {
	afterEach( resetGlobals );
	it( 'initializes disabled tracking based on user preference', () => {
		const { isTrackingEnabled: isEnabled } = createTracking( { trackingEnabled: false } );

		expect( isEnabled() ).toStrictEqual( false );
	} );

	it( 'initializes enabled tracking based on user preference', () => {
		const { isTrackingEnabled: isEnabled } = createTracking( { trackingEnabled: true } );

		expect( isEnabled() ).toStrictEqual( true );
	} );
} );

describe( 'disableTracking and isTrackingEnabled', () => {
	afterEach( resetGlobals );

	it( 'does not mutate global tracking settings when toggling active state', () => {
		global._googlesitekitBaseData = { trackingEnabled: true };

		disableTracking();

		expect( isTrackingEnabled() ).toStrictEqual( false );
		expect( global._googlesitekitBaseData.trackingEnabled ).toStrictEqual( true );
	} );
} );

describe( 'enableTracking and isTrackingEnabled', () => {
	afterEach( resetGlobals );

	it( 'does not mutate global tracking settings when toggling active state', () => {
		global._googlesitekitBaseData = { trackingEnabled: false };

		enableTracking();

		expect( isTrackingEnabled() ).toStrictEqual( true );
		expect( global._googlesitekitBaseData.trackingEnabled ).toStrictEqual( false );
	} );
} );

describe( 'trackEvent', () => {
	afterEach( resetGlobals );

	it( 'adds a tracking event to the dataLayer', async () => {
		const config = {
			referenceSiteURL: 'https://www.example.com/',
			userIDHash: 'a1b2c3',
			trackingID: 'UA-12345678-1',
			isFirstAdmin: true,
			trackingEnabled: true,
		};

		let pushArgs;
		const dataLayer = {
			[ DATA_LAYER ]: {
				push: ( ...args ) => pushArgs = args,
			},
		};
		const { trackEvent } = createTracking( config, dataLayer );

		// Ignore warning (see below) since irrelevant for this test.
		muteConsole( 'warn' );
		await fakeTimeouts( () => trackEvent( 'category', 'name', 'label', 'value' ) );

		// dataLayerPush must push an instance of `Arguments` onto the data layer.
		// Because `arguments` is a special, `Array`-like object (but not an actual `Array`),
		// we can only create it using the magic `arguments` variable
		// made available to normal, non-arrow functions.
		expect( pushArgs.length ).toEqual( 1 );
		expect( Object.prototype.toString.apply( pushArgs[ 0 ] ) ).toEqual( '[object Arguments]' );
		expect( pushArgs[ 0 ].length ).toEqual( 3 );
		const [ event, eventName, eventData ] = pushArgs[ 0 ];
		expect( event ).toEqual( 'event' );
		expect( eventName ).toEqual( 'name' );
		expect( eventData ).toEqual( expect.objectContaining( {
			send_to: config.trackingID,
			event_category: 'category',
			event_label: 'label',
			event_value: 'value',
			dimension1: 'https://www.example.com',
			dimension2: 'true',
			dimension3: config.userIDHash,
		} ) );
		expect( pushArgs[ 0 ][ 2 ] ).toHaveProperty( 'event_callback' );
	} );

	it( 'does not push to dataLayer when tracking is disabled', async () => {
		const push = jest.fn();
		const dataLayer = {
			[ DATA_LAYER ]: { push },
		};
		const { trackEvent } = createTracking( { trackingEnabled: false }, dataLayer );

		await fakeTimeouts( () => trackEvent( 'test-category', 'test-name', 'test-label', 'test-value' ) );
		expect( push ).not.toHaveBeenCalled();
	} );

	it( 'resolves without warning when event_callback is called', async () => {
		const dataLayer = {
			[ DATA_LAYER ]: {
				push: ( args ) => args[ 2 ].event_callback(),
			},
		};
		const { trackEvent } = createTracking( { trackingEnabled: true }, dataLayer );

		const consoleWarnSpy = jest.spyOn( global.console, 'warn' );
		await fakeTimeouts( () => trackEvent( 'test-category', 'test-name', 'test-label', 'test-value' ) );
		expect( consoleWarnSpy ).not.toHaveBeenCalled();
		consoleWarnSpy.mockClear();
	} );

	it( 'resolves with warning when event_callback is not called (within one second)', async () => {
		const dataLayer = {
			[ DATA_LAYER ]: {
				push: () => {},
			},
		};

		const { trackEvent } = createTracking( { trackingEnabled: true }, dataLayer );

		muteConsole( 'warn' );
		const consoleWarnSpy = jest.spyOn( global.console, 'warn' );
		await fakeTimeouts( () => trackEvent( 'test-category', 'test-name', 'test-label', 'test-value' ) );
		expect( consoleWarnSpy ).toHaveBeenCalledWith( 'Tracking event "test-name" (category "test-category") took too long to fire.' );
		consoleWarnSpy.mockClear();
	} );

	it( 'not push to dataLayer with the opt-out set', async () => {
		const push = jest.fn();
		const dataLayer = {
			[ DATA_LAYER ]: { push },
		};

		const mockGlobal = {
			_gaUserPrefs: {
				ioo: () => true,
			},
		};
		const iooSpy = jest.spyOn( mockGlobal._gaUserPrefs, 'ioo' );
		const { trackEvent } = createTracking( { trackingEnabled: true }, dataLayer, mockGlobal );
		await fakeTimeouts( () => trackEvent( 'test-category', 'test-name', 'test-label', 'test-value' ) );
		expect( iooSpy ).toHaveBeenCalled();
		expect( push ).not.toHaveBeenCalled();
	} );
} );
