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
	KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT,
	KM_ANALYTICS_NEW_VISITORS,
	KM_ANALYTICS_POPULAR_CONTENT,
	KM_ANALYTICS_RETURNING_VISITORS,
	KM_ANALYTICS_TOP_CATEGORIES,
	KM_ANALYTICS_TOP_CITIES_DRIVING_LEADS,
	KM_ANALYTICS_TOP_CITIES_DRIVING_PURCHASES,
	KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE,
	KM_ANALYTICS_TOP_DEVICE_DRIVING_PURCHASES,
	KM_ANALYTICS_TOP_PAGES_DRIVING_LEADS,
	KM_ANALYTICS_TOP_RECENT_TRENDING_PAGES,
	KM_ANALYTICS_TOP_RETURNING_VISITOR_PAGES,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_LEADS,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_PURCHASES,
	KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
} from '../../../../googlesitekit/datastore/user/constants';
import {
	MODULES_ANALYTICS_4,
	ENUM_CONVERSION_EVENTS,
} from '../../datastore/constants';
import { KEY_METRICS_SELECTION_PANEL_OPENED_KEY } from '../../../../components/KeyMetrics/constants';
import { CORE_UI } from '../../../../googlesitekit/datastore/ui/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import * as tracking from '../../../../util/tracking';
import { getWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
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
} from '../../../../../../tests/js/test-utils';
import ConversionReportingNotificationCTAWidget from './ConversionReportingNotificationCTAWidget';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../googlesitekit/constants';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'ConversionReportingNotificationCTAWidget', () => {
	let registry;

	const { Widget, WidgetNull } = getWidgetComponentProps(
		'ConversionReportingNotificationCTAWidget'
	);

	const fetchDismissNotification = new RegExp(
		'^/google-site-kit/v1/core/user/data/conversion-reporting-settings'
	);
	const userInputSettingsEndpointRegExp = new RegExp(
		'^/google-site-kit/v1/core/user/data/user-input-settings'
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

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveModuleData( {
			newEvents: [ ENUM_CONVERSION_EVENTS.CONTACT ],
			lostEvents: [],
			newBadgeEvents: [],
		} );

		registry.dispatch( CORE_USER ).receiveGetConversionReportingSettings( {
			newEventsCalloutDismissedAt: 0,
			lostEventsCalloutDismissedAt: 0,
		} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.CONTACT ] );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setNewConversionEventsLastUpdateAt( 0 );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setLostConversionEventsLastUpdateAt( 0 );
	} );

	afterEach( () => {
		afterEach( () => {
			jest.clearAllMocks();
		} );
	} );

	describe( 'Existing users with tailored metrics', () => {
		beforeEach( () => {
			registry.dispatch( CORE_USER ).receiveGetKeyMetricsSettings( {
				widgetSlugs: [],
				isWidgetHidden: false,
			} );

			registry.dispatch( CORE_USER ).receiveGetUserInputSettings( {
				purpose: {
					values: [ 'publish_blog' ],
					scope: 'site',
				},
				includeConversionEvents: {
					values: [],
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
				}
			);
			await waitForRegistry();
			expect( container ).toBeEmptyDOMElement();
		} );

		it( 'does not render when detected event does not match the currently saved site purpose', async () => {
			// Current site purpose is `publish_blog` which includes KMW from `contact`, `generate_lead` and `submit_lead_form` events.
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.ADD_TO_CART ] );

			registry.dispatch( CORE_USER ).receiveIsUserInputCompleted( true );

			const { container, waitForRegistry } = render(
				<ConversionReportingNotificationCTAWidget
					Widget={ Widget }
					WidgetNull={ WidgetNull }
				/>,
				{
					registry,
				}
			);
			await waitForRegistry();

			expect( container ).toBeEmptyDOMElement();
		} );

		it( 'does not render when includeConversionEvents contains existing events', async () => {
			registry.dispatch( CORE_USER ).receiveIsUserInputCompleted( true );

			registry.dispatch( CORE_USER ).receiveGetUserInputSettings( {
				purpose: {
					values: [ 'publish_blog' ],
					scope: 'site',
				},
				includeConversionEvents: {
					values: [ ENUM_CONVERSION_EVENTS.CONTACT ],
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
				.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

			const { container, waitForRegistry } = render(
				<ConversionReportingNotificationCTAWidget
					Widget={ Widget }
					WidgetNull={ WidgetNull }
				/>,
				{
					registry,
				}
			);
			await waitForRegistry();

			expect( container ).toBeEmptyDOMElement();
		} );

		it( 'does render when includeConversionEvents is not set and there are new events connected to the ACR KMW matching the currently saved site purpose', async () => {
			registry.dispatch( CORE_USER ).receiveIsUserInputCompleted( true );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setNewConversionEventsLastUpdateAt( 1734531413 );

			const { waitForRegistry } = render(
				<ConversionReportingNotificationCTAWidget
					Widget={ Widget }
					WidgetNull={ WidgetNull }
				/>,
				{
					registry,
				}
			);
			await waitForRegistry();

			expect(
				document.querySelector( '.googlesitekit-notice--new' )
			).toBeInTheDocument();
		} );

		it( 'maybe later CTA should dismiss the notification', async () => {
			fetchMock.postOnce( fetchDismissNotification, {
				body: true,
			} );

			registry.dispatch( CORE_USER ).receiveIsUserInputCompleted( true );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setNewConversionEventsLastUpdateAt( 1734531413 );

			const { getByRole, waitForRegistry } = render(
				<ConversionReportingNotificationCTAWidget
					Widget={ Widget }
					WidgetNull={ WidgetNull }
				/>,
				{
					registry,
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
			fetchMock.postOnce( fetchDismissNotification, {
				body: true,
			} );
			fetchMock.postOnce( userInputSettingsEndpointRegExp, {
				body: {
					purpose: {
						values: [ 'publish_blog' ],
						scope: 'site',
					},
					includeConversionEvents: {
						values: [ ENUM_CONVERSION_EVENTS.CONTACT ],
						scope: 'site',
					},
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
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setNewConversionEventsLastUpdateAt( 1734531413 );

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
				}
			);
			await waitForRegistry();

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click(
					getByRole( 'button', { name: 'Add metrics' } )
				);
			} );

			const userInputSettings = registry
				.select( CORE_USER )
				.getUserInputSettings();

			const newMetrics = registry
				.select( CORE_USER )
				.getAnswerBasedMetrics( 'publish_blog' );

			expect( fetchMock ).toHaveFetchedTimes( 2 );
			expect(
				userInputSettings?.includeConversionEvents?.values
			).toEqual( [ ENUM_CONVERSION_EVENTS.CONTACT ] );

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
		it( 'does not render when there are no metrics selected.', async () => {
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
				}
			);
			await waitForRegistry();

			expect( container ).toBeEmptyDOMElement();
		} );

		it( 'does not render if new events would suggest metrics the user has already selected', async () => {
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
				}
			);
			await waitForRegistry();

			expect( container ).toBeEmptyDOMElement();
		} );

		it( 'does not render when key metrics setup is not completed', async () => {
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
				}
			);
			await waitForRegistry();

			expect( container ).toBeEmptyDOMElement();
		} );

		it( 'renders when there are new events with metrics the user has not already selected', async () => {
			registry.dispatch( CORE_SITE ).setKeyMetricsSetupCompletedBy( 1 );

			registry.dispatch( CORE_USER ).receiveIsUserInputCompleted( true );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setNewConversionEventsLastUpdateAt( 1734531413 );

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
				}
			);
			await waitForRegistry();

			expect(
				getByRole( 'button', { name: 'Select metrics' } )
			).toBeInTheDocument();
		} );

		it( 'renders if user input has been completed and the user switches to manual selection', async () => {
			registry.dispatch( CORE_SITE ).setKeyMetricsSetupCompletedBy( 1 );

			registry.dispatch( CORE_USER ).receiveIsUserInputCompleted( true );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setNewConversionEventsLastUpdateAt( 1734531413 );

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
				}
			);
			await waitForRegistry();

			expect(
				getByRole( 'button', { name: 'Select metrics' } )
			).toBeInTheDocument();
		} );

		it( 'Select metrics CTA should open key metrics panel', async () => {
			fetchMock.post( fetchDismissNotification, {
				body: {
					newConversionEventsLastUpdateAt: 1734531413,
					lostConversionEventsLastUpdateAt: 0,
				},
			} );

			registry.dispatch( CORE_SITE ).setKeyMetricsSetupCompletedBy( 1 );

			registry.dispatch( CORE_USER ).receiveIsUserInputCompleted( false );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setNewConversionEventsLastUpdateAt( 1734531413 );

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
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
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

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'mainDashboard_kmw-manual-conversion-events-detected-notification',
				'confirm_select_new_conversion_metrics',
				'conversion_reporting'
			);

			await waitForRegistry();

			expect(
				registry
					.select( CORE_UI )
					.getValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY )
			).toBe( true );

			expect( fetchMock ).toHaveFetched( fetchDismissNotification );
		} );
	} );

	describe( 'Existing user with previously detected conversion events', () => {
		it( 'View metrics CTA should open key metrics panel', async () => {
			fetchMock.post( fetchDismissNotification, {
				body: {
					newConversionEventsLastUpdateAt: 1734531413,
					lostConversionEventsLastUpdateAt: 0,
				},
			} );

			registry.dispatch( CORE_USER ).receiveIsUserInputCompleted( true );

			registry.dispatch( CORE_SITE ).setKeyMetricsSetupCompletedBy( 1 );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setNewConversionEventsLastUpdateAt( 1734531413 );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setDetectedEvents( [
					ENUM_CONVERSION_EVENTS.CONTACT,
					ENUM_CONVERSION_EVENTS.PURCHASE,
				] );

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveModuleData( {
				newEvents: [ ENUM_CONVERSION_EVENTS.PURCHASE ],
				lostEvents: [],
				newBadgeEvents: [],
			} );

			provideKeyMetrics( registry, {
				widgetSlugs: [
					KM_ANALYTICS_TOP_PAGES_DRIVING_LEADS,
					KM_ANALYTICS_TOP_CITIES_DRIVING_LEADS,
				],
				isWidgetHidden: false,
			} );

			const { getByRole, getByText, waitForRegistry } = render(
				<ConversionReportingNotificationCTAWidget
					Widget={ Widget }
					WidgetNull={ WidgetNull }
				/>,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);
			await waitForRegistry();

			expect(
				getByRole( 'button', { name: 'View metrics' } )
			).toBeInTheDocument();

			expect(
				getByText(
					( content, testElement ) =>
						testElement.tagName.toLowerCase() === 'p' &&
						testElement.className ===
							'googlesitekit-notice__description' &&
						content ===
							'We’ve extended your metrics selection based on your website events'
				)
			).toBeInTheDocument();

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click(
					getByRole( 'button', { name: 'View metrics' } )
				);
			} );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'mainDashboard_kmw-manual-new-conversion-events-detected-notification',
				'confirm_view_new_conversion_metrics',
				'conversion_reporting'
			);

			expect(
				registry
					.select( CORE_UI )
					.getValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY )
			).toBe( true );

			expect( fetchMock ).toHaveFetched( fetchDismissNotification );
		} );

		describe( 'user with tailored metrics', () => {
			it( 'does not render when newly detected events suggest metrics user already has', async () => {
				registry
					.dispatch( CORE_USER )
					.receiveIsUserInputCompleted( true );

				registry.dispatch( CORE_USER ).receiveGetKeyMetricsSettings( {
					widgetSlugs: [],
					isWidgetHidden: false,
				} );

				registry.dispatch( CORE_USER ).receiveGetUserInputSettings( {
					purpose: {
						values: [ 'publish_blog' ],
						scope: 'site',
					},
					includeConversionEvents: {
						values: [ ENUM_CONVERSION_EVENTS.CONTACT ],
						scope: 'site',
					},
				} );

				const inputSettings = registry
					.select( CORE_USER )
					.getUserInputSettings();

				expect( inputSettings.purpose.values[ 0 ] ).toBe(
					'publish_blog'
				);

				// Current saved purpose is 'publish_blog', ACR metrics included for that answer
				// are associated with either `contact`, `generate_lead` or `submit_lead_form` events.
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setDetectedEvents( [
						ENUM_CONVERSION_EVENTS.CONTACT,
						ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
					] );

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveModuleData( {
					newEvents: [ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ],
					lostEvents: [],
					newBadgeEvents: [],
				} );

				const newMetrics = registry
					.select( CORE_USER )
					.getAnswerBasedMetrics();

				// Tailored metrics will already include leads metrics, which are getting data
				// from either `contact`, `generate_lead` or `submit_lead_form` events.
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

				const { container, waitForRegistry } = render(
					<ConversionReportingNotificationCTAWidget
						Widget={ Widget }
						WidgetNull={ WidgetNull }
					/>,
					{
						registry,
					}
				);
				await waitForRegistry();

				expect( container ).toBeEmptyDOMElement();
			} );

			it( 'does not render when there is a new event matching the saved site purpose, which had no conversion events with previously detected events', async () => {
				registry
					.dispatch( CORE_USER )
					.receiveIsUserInputCompleted( true );

				registry.dispatch( CORE_USER ).receiveGetKeyMetricsSettings( {
					widgetSlugs: [],
					isWidgetHidden: false,
				} );

				registry.dispatch( CORE_USER ).receiveGetUserInputSettings( {
					purpose: {
						values: [ 'sell_products' ],
						scope: 'site',
					},
					includeConversionEvents: {
						values: [ ENUM_CONVERSION_EVENTS.CONTACT ],
						scope: 'site',
					},
				} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setDetectedEvents( [
						ENUM_CONVERSION_EVENTS.CONTACT,
						ENUM_CONVERSION_EVENTS.PURCHASE,
					] );

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveModuleData( {
					newEvents: [ ENUM_CONVERSION_EVENTS.PURCHASE ],
					lostEvents: [],
					newBadgeEvents: [],
				} );

				const { container, waitForRegistry } = render(
					<ConversionReportingNotificationCTAWidget
						Widget={ Widget }
						WidgetNull={ WidgetNull }
					/>,
					{
						registry,
					}
				);
				await waitForRegistry();

				expect( container ).toBeEmptyDOMElement();
			} );

			it( 'does not render when newly detected events suggest metrics user does not have within same site purpose', async () => {
				registry
					.dispatch( CORE_SITE )
					.setKeyMetricsSetupCompletedBy( 1 );

				registry
					.dispatch( CORE_USER )
					.receiveIsUserInputCompleted( true );

				registry.dispatch( CORE_USER ).receiveGetKeyMetricsSettings( {
					widgetSlugs: [],
					isWidgetHidden: false,
				} );

				registry.dispatch( CORE_USER ).receiveGetUserInputSettings( {
					purpose: {
						values: [ 'sell_products' ],
						scope: 'site',
					},
					includeConversionEvents: {
						values: [ ENUM_CONVERSION_EVENTS.PURCHASE ],
						scope: 'site',
					},
				} );

				const inputSettings = registry
					.select( CORE_USER )
					.getUserInputSettings();

				expect( inputSettings.purpose.values[ 0 ] ).toBe(
					'sell_products'
				);

				// Current saved purpose is 'sell_products', ACR metrics included for that answer
				// are associated with `purchase` and `add_to_cart` events. Initially we will simulate
				// user saving site purpose with `purchase`, or adding `purchase` metrics during initial events detection.
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

				const currentMetrics = registry
					.select( CORE_USER )
					.getAnswerBasedMetrics();

				// Current metrics should include only `purchase` related metrics on the list.
				const expectedMetrics = [
					KM_ANALYTICS_POPULAR_CONTENT,
					KM_ANALYTICS_TOP_CITIES_DRIVING_PURCHASES,
					KM_ANALYTICS_TOP_DEVICE_DRIVING_PURCHASES,
					KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_PURCHASES,
					KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT,
					KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE,
					KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
				];

				expect( currentMetrics ).toEqual( expectedMetrics );

				// After initial events, `add_to_cart` has been detected.
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setDetectedEvents( [
						ENUM_CONVERSION_EVENTS.PURCHASE,
						ENUM_CONVERSION_EVENTS.ADD_TO_CART,
					] );
				registry.dispatch( MODULES_ANALYTICS_4 ).receiveModuleData( {
					newEvents: [ ENUM_CONVERSION_EVENTS.ADD_TO_CART ],
					lostEvents: [],
					newBadgeEvents: [],
				} );

				const { container, waitForRegistry } = render(
					<ConversionReportingNotificationCTAWidget
						Widget={ Widget }
						WidgetNull={ WidgetNull }
					/>,
					{
						registry,
					}
				);
				await waitForRegistry();

				expect( container ).toBeEmptyDOMElement();
			} );

			it( 'renders when newly detected events suggest metrics from different site purpose', async () => {
				registry
					.dispatch( CORE_SITE )
					.setKeyMetricsSetupCompletedBy( 1 );

				registry
					.dispatch( CORE_USER )
					.receiveIsUserInputCompleted( true );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setNewConversionEventsLastUpdateAt( 1734531413 );

				registry.dispatch( CORE_USER ).receiveGetKeyMetricsSettings( {
					widgetSlugs: [],
					isWidgetHidden: false,
				} );

				registry.dispatch( CORE_USER ).receiveGetUserInputSettings( {
					purpose: {
						values: [ 'publish_blog' ],
						scope: 'site',
					},
					includeConversionEvents: {
						values: [ ENUM_CONVERSION_EVENTS.CONTACT ],
						scope: 'site',
					},
				} );

				const inputSettings = registry
					.select( CORE_USER )
					.getUserInputSettings();

				expect( inputSettings.purpose.values[ 0 ] ).toBe(
					'publish_blog'
				);

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setDetectedEvents( [
						ENUM_CONVERSION_EVENTS.CONTACT,
						ENUM_CONVERSION_EVENTS.PURCHASE,
					] );

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveModuleData( {
					newEvents: [ ENUM_CONVERSION_EVENTS.PURCHASE ],
					lostEvents: [],
					newBadgeEvents: [],
				} );

				const { getByRole, waitForRegistry } = render(
					<ConversionReportingNotificationCTAWidget
						Widget={ Widget }
						WidgetNull={ WidgetNull }
					/>,
					{
						registry,
					}
				);
				await waitForRegistry();

				expect(
					getByRole( 'button', { name: 'View metrics' } )
				).toBeInTheDocument();
			} );
		} );

		describe( 'user with manually-selected metrics', () => {
			it( 'does not render when there are new events with metrics that are already selected', async () => {
				registry
					.dispatch( CORE_USER )
					.receiveIsUserInputCompleted( false );

				registry
					.dispatch( CORE_SITE )
					.setKeyMetricsSetupCompletedBy( 1 );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setDetectedEvents( [
						ENUM_CONVERSION_EVENTS.CONTACT,
						ENUM_CONVERSION_EVENTS.GENERATE_LEAD,
					] );

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveModuleData( {
					newEvents: [ ENUM_CONVERSION_EVENTS.GENERATE_LEAD ],
					lostEvents: [],
					newBadgeEvents: [],
				} );

				provideKeyMetrics( registry, {
					widgetSlugs: [
						KM_ANALYTICS_TOP_PAGES_DRIVING_LEADS,
						KM_ANALYTICS_TOP_CITIES_DRIVING_LEADS,
						KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_LEADS,
					],
					isWidgetHidden: false,
				} );

				const { container, waitForRegistry } = render(
					<ConversionReportingNotificationCTAWidget
						Widget={ Widget }
						WidgetNull={ WidgetNull }
					/>,
					{
						registry,
					}
				);
				await waitForRegistry();

				expect( container ).toBeEmptyDOMElement();
			} );

			it( 'renders when there are new events with metrics that are not selected', async () => {
				registry
					.dispatch( CORE_USER )
					.receiveIsUserInputCompleted( false );

				registry
					.dispatch( CORE_SITE )
					.setKeyMetricsSetupCompletedBy( 1 );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setNewConversionEventsLastUpdateAt( 1734531413 );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setDetectedEvents( [
						ENUM_CONVERSION_EVENTS.CONTACT,
						ENUM_CONVERSION_EVENTS.PURCHASE,
					] );

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveModuleData( {
					newEvents: [ ENUM_CONVERSION_EVENTS.PURCHASE ],
					lostEvents: [],
					newBadgeEvents: [],
				} );

				provideKeyMetrics( registry, {
					widgetSlugs: [
						KM_ANALYTICS_TOP_PAGES_DRIVING_LEADS,
						KM_ANALYTICS_TOP_CITIES_DRIVING_LEADS,
					],
					isWidgetHidden: false,
				} );

				const { getByRole, waitForRegistry } = render(
					<ConversionReportingNotificationCTAWidget
						Widget={ Widget }
						WidgetNull={ WidgetNull }
					/>,
					{
						registry,
					}
				);
				await waitForRegistry();

				expect(
					getByRole( 'button', { name: 'View metrics' } )
				).toBeInTheDocument();
			} );

			it( 'renders when there are new events having partialy unselected metrics', async () => {
				registry
					.dispatch( CORE_USER )
					.receiveIsUserInputCompleted( false );

				registry
					.dispatch( CORE_SITE )
					.setKeyMetricsSetupCompletedBy( 1 );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setNewConversionEventsLastUpdateAt( 1734531413 );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setDetectedEvents( [
						ENUM_CONVERSION_EVENTS.CONTACT,
						ENUM_CONVERSION_EVENTS.ADD_TO_CART,
					] );

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveModuleData( {
					newEvents: [ ENUM_CONVERSION_EVENTS.CONTACT ],
					lostEvents: [],
					newBadgeEvents: [],
				} );

				// There is a third leads metric that is not selected. This scenario simulates
				// edge case in which user had 2 out of 3 leads metrics selected, then lost the `contact` event`
				// in which case we will surface this variation of callout because 3rd leads metric would
				// not be visible in selection panel after event was lost, but will re-appear after event is detected again,
				// making it "new" again.
				provideKeyMetrics( registry, {
					widgetSlugs: [
						KM_ANALYTICS_TOP_PAGES_DRIVING_LEADS,
						KM_ANALYTICS_TOP_CITIES_DRIVING_LEADS,
					],
					isWidgetHidden: false,
				} );

				const { getByRole, waitForRegistry } = render(
					<ConversionReportingNotificationCTAWidget
						Widget={ Widget }
						WidgetNull={ WidgetNull }
					/>,
					{
						registry,
					}
				);
				await waitForRegistry();

				expect(
					getByRole( 'button', { name: 'View metrics' } )
				).toBeInTheDocument();
			} );
		} );
	} );
} );
