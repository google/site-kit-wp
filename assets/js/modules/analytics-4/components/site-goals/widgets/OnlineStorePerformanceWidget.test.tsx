/**
 * Site Kit by Google, Copyright 2026 Google LLC
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { render } from '../../../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	provideModules,
} from '../../../../../../../tests/js/utils';
import {
	getWidgetComponentProps,
	type WidgetComponentProps,
} from '@/js/googlesitekit/widgets/util';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	DATE_RANGE_OFFSET,
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { provideAnalytics4MockReport } from '@/js/modules/analytics-4/utils/data-mock';
import OnlineStorePerformanceWidget from './OnlineStorePerformanceWidget';

describe( 'OnlineStorePerformanceWidget', () => {
	let registry: WPDataRegistry;
	const widgetProps: WidgetComponentProps = getWidgetComponentProps(
		'analyticsOnlineStorePerformance'
	);

	function buildPrimaryEventReportOptions(
		dates: Record< string, unknown >,
		primaryEvent: string
	) {
		return {
			...dates,
			metrics: [ { name: 'eventCount' } ],
			dimensions: [ { name: 'eventName' } ],
			dimensionFilters: {
				eventName: primaryEvent,
			},
			reportID:
				'analytics-4_online-store-performance-widget_primaryEventReportOptions',
		};
	}

	function buildSessionsReportOptions( dates: Record< string, unknown > ) {
		return {
			...dates,
			metrics: [ { name: 'sessions' } ],
			reportID: 'analytics-4_site-goals_sessionsReportOptions',
		};
	}

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
		registry.dispatch( MODULES_ANALYTICS_4 ).setAccountID( '12345' );
	} );

	it( 'renders WidgetNull when no ecommerce events are detected', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.CONTACT ] );

		const { container, waitForRegistry } = render(
			<OnlineStorePerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders WidgetNull when detected events array is empty', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setDetectedEvents( [] );

		const { container, waitForRegistry } = render(
			<OnlineStorePerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders the primary action section with purchase primary event', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} );

		const primaryEventReport = buildPrimaryEventReportOptions(
			dates,
			ENUM_CONVERSION_EVENTS.PURCHASE
		);
		const sessionsReport = buildSessionsReportOptions( dates );

		provideAnalytics4MockReport( registry, primaryEventReport );
		provideAnalytics4MockReport( registry, sessionsReport );

		const { container, getByText, waitForRegistry } = render(
			<OnlineStorePerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect(
			container.querySelector(
				'.googlesitekit-site-goals-primary-action'
			)
		).toBeInTheDocument();
		expect(
			container.querySelectorAll( '.googlesitekit-site-goals-tile' )
		).toHaveLength( 2 );
		expect( getByText( 'Sales Rate' ) ).toBeInTheDocument();
		expect( getByText( 'Total Sales' ) ).toBeInTheDocument();
		expect( getByText( '“purchase” events' ) ).toBeInTheDocument();
	} );

	it( 'falls back to add_to_cart when purchase is not detected', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.ADD_TO_CART ] );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} );

		const primaryEventReport = buildPrimaryEventReportOptions(
			dates,
			ENUM_CONVERSION_EVENTS.ADD_TO_CART
		);
		const sessionsReport = buildSessionsReportOptions( dates );

		provideAnalytics4MockReport( registry, primaryEventReport );
		provideAnalytics4MockReport( registry, sessionsReport );

		const { getByText, waitForRegistry } = render(
			<OnlineStorePerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( getByText( 'Add to Cart Rate' ) ).toBeInTheDocument();
		expect(
			getByText( 'Total products added to cart' )
		).toBeInTheDocument();
		expect( getByText( '“add_to_cart” events' ) ).toBeInTheDocument();
	} );

	it( 'uses purchase as primary event when both purchase and add_to_cart are detected', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [
				ENUM_CONVERSION_EVENTS.PURCHASE,
				ENUM_CONVERSION_EVENTS.ADD_TO_CART,
			] );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} );

		const primaryEventReport = buildPrimaryEventReportOptions(
			dates,
			ENUM_CONVERSION_EVENTS.PURCHASE
		);
		const sessionsReport = buildSessionsReportOptions( dates );

		provideAnalytics4MockReport( registry, primaryEventReport );
		provideAnalytics4MockReport( registry, sessionsReport );

		const { getByText, waitForRegistry } = render(
			<OnlineStorePerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( getByText( 'Sales Rate' ) ).toBeInTheDocument();
		expect( getByText( 'Total Sales' ) ).toBeInTheDocument();
	} );

	it( 'computes zero rate when sessions count is zero', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} );

		const primaryEventReport = buildPrimaryEventReportOptions(
			dates,
			ENUM_CONVERSION_EVENTS.PURCHASE
		);
		const sessionsReport = buildSessionsReportOptions( dates );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( { rows: [] }, { options: primaryEventReport } );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ primaryEventReport ] );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( { totals: [] }, { options: sessionsReport } );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ sessionsReport ] );

		const { getAllByText, waitForRegistry } = render(
			<OnlineStorePerformanceWidget { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( getAllByText( '0%' ).length ).toBeGreaterThanOrEqual( 1 );
	} );

	it( 'renders loading state while reports are being resolved', () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} );

		const primaryEventReport = buildPrimaryEventReportOptions(
			dates,
			ENUM_CONVERSION_EVENTS.PURCHASE
		);

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.startResolution( 'getReport', [ primaryEventReport ] );

		const { container } = render(
			<OnlineStorePerformanceWidget { ...widgetProps } />,
			{ registry }
		);

		expect(
			container.querySelector( '.googlesitekit-preview-block' )
		).toBeInTheDocument();
	} );
} );
