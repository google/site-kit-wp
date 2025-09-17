/**
 * Hook useNewBadgeEvents tests.
 */

import {
	createTestRegistry,
	renderHook,
	provideModules,
	provideUserAuthentication,
} from '../../../../../tests/js/test-utils';
import useNewBadgeEvents from './useNewBadgeEvents';
import {
	MODULES_ANALYTICS_4,
	ENUM_CONVERSION_EVENTS,
} from '@/js/modules/analytics-4/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { withConnected } from '@/js/googlesitekit/modules/datastore/__fixtures__';
import { registerStore as registerAnalytics4Store } from '@/js/modules/analytics-4/datastore';

describe( 'useNewBadgeEvents', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideUserAuthentication( registry );
		registerAnalytics4Store( registry );
	} );

	it( 'returns empty array when GA4 is not connected', async () => {
		provideModules( registry );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveModuleData( {
			newEvents: [],
			lostEvents: [],
			newBadgeEvents: [ ENUM_CONVERSION_EVENTS.CONTACT ],
		} );

		const { result, waitForRegistry } = renderHook(
			() => useNewBadgeEvents(),
			{
				registry,
			}
		);

		await waitForRegistry();
		expect( result.current ).toEqual( [] );
	} );

	it( 'returns non-lead events only when multiple lead events already detected and new lead events present', async () => {
		provideModules( registry, withConnected( MODULE_SLUG_ANALYTICS_4 ) );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [
				ENUM_CONVERSION_EVENTS.CONTACT,
				ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
			] );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveModuleData( {
			newEvents: [],
			lostEvents: [],
			newBadgeEvents: [
				ENUM_CONVERSION_EVENTS.CONTACT,
				ENUM_CONVERSION_EVENTS.PURCHASE,
			],
		} );

		const { result, waitForRegistry } = renderHook(
			() => useNewBadgeEvents(),
			{
				registry,
			}
		);
		await waitForRegistry();

		expect( result.current ).toEqual( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );
	} );

	it( 'returns badge events as-is when GA4 is connected', async () => {
		provideModules( registry, withConnected( MODULE_SLUG_ANALYTICS_4 ) );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.CONTACT ] );
		const badge = [
			ENUM_CONVERSION_EVENTS.CONTACT,
			ENUM_CONVERSION_EVENTS.PURCHASE,
		];
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveModuleData( {
			newEvents: [],
			lostEvents: [],
			newBadgeEvents: badge,
		} );

		const { result, waitForRegistry } = renderHook(
			() => useNewBadgeEvents(),
			{
				registry,
			}
		);
		await waitForRegistry();

		expect( result.current ).toEqual( badge );
	} );
} );
