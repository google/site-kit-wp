/**
 * ConversionReportingNotificationCTAWidget component tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
 * Internal dependencies
 */
import {
	CORE_USER,
	KM_ANALYTICS_NEW_VISITORS,
	KM_ANALYTICS_RETURNING_VISITORS,
	KM_ANALYTICS_TOP_CATEGORIES,
	KM_ANALYTICS_TOP_CITIES_DRIVING_LEADS,
	KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE,
	KM_ANALYTICS_TOP_PAGES_DRIVING_LEADS,
	KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES,
	KM_ANALYTICS_TOP_RETURNING_VISITOR_PAGES,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_LEADS,
	KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
} from '../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import { getWidgetComponentProps } from '../../googlesitekit/widgets/util';
import {
	render,
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideKeyMetricsUserInputSettings,
	act,
	fireEvent,
	provideKeyMetrics,
} from '../../../../tests/js/test-utils';
import ConversionReportingNotificationCTAWidget from './ConversionReportingNotificationCTAWidget';
import { enabledFeatures } from '../../features';
import { KEY_METRICS_SELECTION_PANEL_OPENED_KEY } from './constants';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';

describe( 'ConversionReportingNotificationCTAWidget', () => {
	let registry;

	const { Widget, WidgetNull } = getWidgetComponentProps(
		'ConversionReportingNotificationCTAWidget'
	);

	const fetchDismissNotification = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/clear-conversion-reporting-new-events'
	);
	const coreKeyMetricsEndpointRegExp = new RegExp(
		'^/google-site-kit/v1/core/user/data/key-metrics'
	);

	beforeEach( () => {
		registry = createTestRegistry();

		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		provideKeyMetricsUserInputSettings( registry );
		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
			},
		] );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveConversionReportingInlineData( {
				newEvents: [ 'contact' ],
				lostEvents: [],
			} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ 'contact' ] );
	} );

	describe( 'Existing users with tailored metrics', () => {
		beforeEach( () => {
			registry.dispatch( CORE_USER ).receiveGetKeyMetricsSettings( {
				widgetSlugs: [],
				includeConversionTailoredMetrics: [],
				isWidgetHidden: false,
			} );

			registry.dispatch( CORE_USER ).receiveGetUserInputSettings( {
				purpose: {
					values: [ 'publish_blog' ],
					scope: 'site',
				},
			} );
		} );

		it( 'does not render when user input is not completed', async () => {
			registry.dispatch( CORE_USER ).receiveIsUserInputCompleted( false );

			const { container, waitForRegistry } = render(
				<ConversionReportingNotificationCTAWidget
					Widget={ Widget }
					WidgetNull={ WidgetNull }
				/>,
				{
					registry,
					features: [ 'conversionReporting' ],
				}
			);
			await waitForRegistry();
			expect( container ).toBeEmptyDOMElement();
		} );

		it( 'does not render when detected event does not match the currently saved site purpose', async () => {
			// Current site purpose is `publish_blog` which includes KMW from `contact`, `generate_lead` and `submit_lead_form` events.
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setDetectedEvents( [ 'add_to_cart' ] );

			registry.dispatch( CORE_USER ).receiveIsUserInputCompleted( true );

			const { container, waitForRegistry } = render(
				<ConversionReportingNotificationCTAWidget
					Widget={ Widget }
					WidgetNull={ WidgetNull }
				/>,
				{
					registry,
					features: [ 'conversionReporting' ],
				}
			);
			await waitForRegistry();

			expect( container ).toBeEmptyDOMElement();
		} );

		it( 'does not render when includeConversionTailoredMetrics contains existing events', async () => {
			registry.dispatch( CORE_USER ).receiveIsUserInputCompleted( true );

			registry.dispatch( CORE_USER ).receiveGetKeyMetricsSettings( {
				widgetSlugs: [],
				includeConversionTailoredMetrics: [ 'contact' ],
				isWidgetHidden: false,
			} );

			const { container, waitForRegistry } = render(
				<ConversionReportingNotificationCTAWidget
					Widget={ Widget }
					WidgetNull={ WidgetNull }
				/>,
				{
					registry,
					features: [ 'conversionReporting' ],
				}
			);
			await waitForRegistry();

			expect( container ).toBeEmptyDOMElement();
		} );

		it( 'does not render when detected events do not have ACR KMW matching the currently saved site purpose', async () => {
			registry.dispatch( CORE_USER ).receiveIsUserInputCompleted( true );

			const inputSettings = registry
				.select( CORE_USER )
				.getUserInputSettings();

			expect( inputSettings.purpose.values[ 0 ] ).toBe( 'publish_blog' );

			// Current saved purpose is 'publish_blog', ACR metrics included for that answer
			// are associated with either `contact`, `generate_lead` or `submit_lead_form` events
			// other events will not add any ACR KMW, hence callout should not surface.
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setDetectedEvents( [ 'purchase' ] );

			const { container, waitForRegistry } = render(
				<ConversionReportingNotificationCTAWidget
					Widget={ Widget }
					WidgetNull={ WidgetNull }
				/>,
				{
					registry,
					features: [ 'conversionReporting' ],
				}
			);
			await waitForRegistry();

			expect( container ).toBeEmptyDOMElement();
		} );

		it( 'does render when includeConversionTailoredMetrics is not set and there are new events connected to the ACR KMW matching the currently saved site purpose', async () => {
			registry.dispatch( CORE_USER ).receiveIsUserInputCompleted( true );

			const { waitForRegistry } = render(
				<ConversionReportingNotificationCTAWidget
					Widget={ Widget }
					WidgetNull={ WidgetNull }
				/>,
				{
					registry,
					features: [ 'conversionReporting' ],
				}
			);
			await waitForRegistry();

			expect(
				document.querySelector(
					'.googlesitekit-acr-subtle-notification'
				)
			).toBeInTheDocument();
		} );

		it( 'maybe later CTA should dismiss the notification', async () => {
			fetchMock.postOnce( fetchDismissNotification, {
				body: true,
			} );

			registry.dispatch( CORE_USER ).receiveIsUserInputCompleted( true );

			const { getByRole, waitForRegistry } = render(
				<ConversionReportingNotificationCTAWidget
					Widget={ Widget }
					WidgetNull={ WidgetNull }
				/>,
				{
					registry,
					features: [ 'conversionReporting' ],
				}
			);
			await waitForRegistry();

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click(
					getByRole( 'button', { name: 'Maybe later' } )
				);
			} );

			expect( fetchMock ).toHaveFetchedTimes( 1 );
		} );

		it( 'Add metrics CTA should add ACR metrics and dismiss notification', async () => {
			enabledFeatures.add( 'conversionReporting' );

			fetchMock.postOnce( fetchDismissNotification, {
				body: true,
			} );
			fetchMock.postOnce( coreKeyMetricsEndpointRegExp, {
				body: {
					widgetSlugs: undefined,
					includeConversionTailoredMetrics: [ 'contact' ],
					isWidgetHidden: false,
				},
				status: 200,
			} );

			provideModules( registry, [
				{
					slug: 'analytics-4',
					active: true,
					connected: true,
				},
				{
					slug: 'search-console',
					active: true,
					connected: true,
				},
			] );

			registry.dispatch( CORE_USER ).receiveIsUserInputCompleted( true );

			const currentMetrics = registry
				.select( CORE_USER )
				.getAnswerBasedMetrics( 'publish_blog' );

			expect( currentMetrics ).toEqual( [
				KM_ANALYTICS_TOP_CATEGORIES,
				KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE,
				KM_ANALYTICS_TOP_RETURNING_VISITOR_PAGES,
				KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
				KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES,
				KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
			] );

			const { getByRole, waitForRegistry } = render(
				<ConversionReportingNotificationCTAWidget
					Widget={ Widget }
					WidgetNull={ WidgetNull }
				/>,
				{
					registry,
					features: [ 'conversionReporting' ],
				}
			);
			await waitForRegistry();

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click(
					getByRole( 'button', { name: 'Add metrics' } )
				);
			} );

			const keyMetricSettings = registry
				.select( CORE_USER )
				.getKeyMetricsSettings();

			const newMetrics = registry
				.select( CORE_USER )
				.getAnswerBasedMetrics( 'publish_blog' );

			expect( fetchMock ).toHaveFetchedTimes( 2 );
			expect(
				keyMetricSettings?.includeConversionTailoredMetrics
			).toEqual( [ 'contact' ] );

			expect( newMetrics ).toEqual( [
				KM_ANALYTICS_TOP_CATEGORIES,
				KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE,
				KM_ANALYTICS_TOP_RETURNING_VISITOR_PAGES,
				KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
				KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES,
				KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
				KM_ANALYTICS_TOP_PAGES_DRIVING_LEADS,
				KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_LEADS,
			] );
		} );
	} );

	describe( 'Existing user with manually selected metrics', () => {
		beforeAll( () => {
			enabledFeatures.add( 'conversionReporting' );
		} );

		afterAll( () => {
			enabledFeatures.delete( 'conversionReporting' );
		} );

		it( 'Does not render when there are no metrics selected.', async () => {
			registry.dispatch( CORE_USER ).receiveIsUserInputCompleted( true );

			provideKeyMetrics( registry, {
				widgetSlugs: [],
				isWidgetHidden: false,
			} );

			// The beforeEach sets a `contact` detected event, so if the users existing
			// site purpose does not have any suggested new metrics the banner should not render.
			provideKeyMetricsUserInputSettings( registry, {
				purpose: {
					values: [ 'sell_products' ],
					scope: 'site',
				},
			} );

			const { container, waitForRegistry } = render(
				<ConversionReportingNotificationCTAWidget
					Widget={ Widget }
					WidgetNull={ WidgetNull }
				/>,
				{
					registry,
					features: [ 'conversionReporting' ],
				}
			);
			await waitForRegistry();

			expect( container ).toBeEmptyDOMElement();
		} );

		it( 'Does not render if new events would suggest metrics the user has already selected', async () => {
			registry.dispatch( CORE_SITE ).setKeyMetricsSetupCompletedBy( 1 );

			registry.dispatch( CORE_USER ).receiveIsUserInputCompleted( true );

			// The beforeEach sets a `contact` detected event, so if the user already has all of the
			// metrics this event would add, we don't need to show the banner.
			provideKeyMetrics( registry, {
				widgetSlugs: [
					KM_ANALYTICS_TOP_PAGES_DRIVING_LEADS,
					KM_ANALYTICS_TOP_CITIES_DRIVING_LEADS,
					KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_LEADS,
				],
				isWidgetHidden: false,
			} );

			provideKeyMetricsUserInputSettings( registry, {
				purpose: {
					values: [ 'sell_products' ],
					scope: 'site',
				},
			} );

			const { container, waitForRegistry } = render(
				<ConversionReportingNotificationCTAWidget
					Widget={ Widget }
					WidgetNull={ WidgetNull }
				/>,
				{
					registry,
					features: [ 'conversionReporting' ],
				}
			);
			await waitForRegistry();

			expect( container ).toBeEmptyDOMElement();
		} );

		it( 'Does not render when key metrics setup is not completed', async () => {
			registry.dispatch( CORE_USER ).receiveIsUserInputCompleted( false );

			provideKeyMetrics( registry, {
				widgetSlugs: [],
				isWidgetHidden: false,
			} );

			// isKeyMetricsSetupCompleted is based on the getKeyMetricsSetupCompletedBy,
			// without setting this then isKeyMetricsSetupCompleted will return false.

			const { container, waitForRegistry } = render(
				<ConversionReportingNotificationCTAWidget
					Widget={ Widget }
					WidgetNull={ WidgetNull }
				/>,
				{
					registry,
					features: [ 'conversionReporting' ],
				}
			);
			await waitForRegistry();

			expect( container ).toBeEmptyDOMElement();
		} );

		it( 'Renders when there are new events with metrics the user has not already selected', async () => {
			registry.dispatch( CORE_SITE ).setKeyMetricsSetupCompletedBy( 1 );

			registry.dispatch( CORE_USER ).receiveIsUserInputCompleted( true );

			// The beforeEach sets a `contact` detected event, providing some but not
			// all of the suggested metrics should show the banner.
			provideKeyMetrics( registry, {
				widgetSlugs: [
					KM_ANALYTICS_TOP_PAGES_DRIVING_LEADS,
					KM_ANALYTICS_TOP_CITIES_DRIVING_LEADS,
				],
				isWidgetHidden: false,
			} );

			provideKeyMetricsUserInputSettings( registry, {
				purpose: {
					values: [ 'sell_products' ],
					scope: 'site',
				},
			} );

			const { getByRole, waitForRegistry } = render(
				<ConversionReportingNotificationCTAWidget
					Widget={ Widget }
					WidgetNull={ WidgetNull }
				/>,
				{
					registry,
					features: [ 'conversionReporting' ],
				}
			);
			await waitForRegistry();

			expect(
				getByRole( 'button', { name: 'Select metrics' } )
			).toBeInTheDocument();
		} );

		it( 'Renders if user input has been completed and the user switches to manual selection', async () => {
			registry.dispatch( CORE_SITE ).setKeyMetricsSetupCompletedBy( 1 );

			registry.dispatch( CORE_USER ).receiveIsUserInputCompleted( true );

			provideKeyMetrics( registry, {
				widgetSlugs: [
					KM_ANALYTICS_NEW_VISITORS,
					KM_ANALYTICS_RETURNING_VISITORS,
				],
				isWidgetHidden: false,
			} );

			provideKeyMetricsUserInputSettings( registry, {
				purpose: {
					values: [ 'sell_products' ],
					scope: 'site',
				},
			} );

			const { getByRole, waitForRegistry } = render(
				<ConversionReportingNotificationCTAWidget
					Widget={ Widget }
					WidgetNull={ WidgetNull }
				/>,
				{
					registry,
					features: [ 'conversionReporting' ],
				}
			);
			await waitForRegistry();

			expect(
				getByRole( 'button', { name: 'Select metrics' } )
			).toBeInTheDocument();
		} );

		it( 'Select metrics CTA should open key metrics panel', async () => {
			fetchMock.postOnce( fetchDismissNotification, {
				body: true,
			} );

			registry.dispatch( CORE_SITE ).setKeyMetricsSetupCompletedBy( 1 );

			registry.dispatch( CORE_USER ).receiveIsUserInputCompleted( true );

			// The beforeEach sets a `contact` detected event, providing some but not
			// all of the suggested metrics should show the banner.
			provideKeyMetrics( registry, {
				widgetSlugs: [
					KM_ANALYTICS_TOP_PAGES_DRIVING_LEADS,
					KM_ANALYTICS_TOP_CITIES_DRIVING_LEADS,
				],
				isWidgetHidden: false,
			} );

			provideKeyMetricsUserInputSettings( registry, {
				purpose: {
					values: [ 'sell_products' ],
					scope: 'site',
				},
			} );

			const { getByRole, waitForRegistry } = render(
				<ConversionReportingNotificationCTAWidget
					Widget={ Widget }
					WidgetNull={ WidgetNull }
				/>,
				{
					registry,
					features: [ 'conversionReporting' ],
				}
			);
			await waitForRegistry();

			expect(
				getByRole( 'button', { name: 'Select metrics' } )
			).toBeInTheDocument();

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click(
					getByRole( 'button', { name: 'Select metrics' } )
				);
			} );

			expect(
				registry
					.select( CORE_UI )
					.getValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY )
			).toBe( true );
		} );
	} );
} );
