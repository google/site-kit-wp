/**
 * AdBlockingRecoverySetupCTAWidget component tests.
 *
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
 * Internal dependencies
 */
import fetchMock from 'fetch-mock';
import { mockLocation } from '../../../../../../tests/js/mock-browser-utils';
import {
	mockSurveyEndpoints,
	surveyTriggerEndpoint,
} from '../../../../../../tests/js/mock-survey-endpoints';
import {
	act,
	createTestRegistry,
	fireEvent,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	render,
	waitFor,
} from '../../../../../../tests/js/test-utils';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '../../../../googlesitekit/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { getWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import { stringToDate } from '../../../../util';
import * as tracking from '../../../../util/tracking';
import {
	AD_BLOCKING_RECOVERY_MAIN_NOTIFICATION_KEY,
	ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS,
	MODULES_ADSENSE,
} from '../../datastore/constants';
import {
	ACCOUNT_STATUS_PENDING,
	ACCOUNT_STATUS_READY,
	SITE_STATUS_ADDED,
	SITE_STATUS_READY,
} from '../../util';
import AdBlockingRecoverySetupCTAWidget from './AdBlockingRecoverySetupCTAWidget';
import {
	dismissedPromptsEndpoint,
	dismissPromptEndpoint,
} from '../../../../../../tests/js/mock-dismiss-prompt-endpoints';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

const mockShowTooltip = jest.fn();
jest.mock( '../../../../components/AdminMenuTooltip', () => ( {
	__esModule: true,
	default: jest.fn(),
	useShowTooltip: jest.fn( () => mockShowTooltip ),
} ) );

describe( 'AdBlockingRecoverySetupCTAWidget', () => {
	let registry;
	const referenceDate = '2023-06-22';
	const timestampThreeWeeksPrior =
		stringToDate( '2023-06-01' ).getTime() / 1000;
	const timestampLessThanThreeWeeksPrior =
		stringToDate( '2023-06-02' ).getTime() / 1000;
	const validSettings = {
		accountID: 'pub-12345678',
		clientID: 'ca-pub-12345678',
		useSnippet: false,
		accountStatus: ACCOUNT_STATUS_READY,
		siteStatus: SITE_STATUS_READY,
		adBlockingRecoverySetupStatus: '',
	};

	const { Widget, WidgetNull } =
		getWidgetComponentProps( 'adBlockingRecovery' );

	beforeEach( () => {
		mockTrackEvent.mockClear();
		mockSurveyEndpoints();
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		provideModules( registry, [
			{
				active: true,
				connected: true,
				slug: 'adsense',
			},
		] );
		registry.dispatch( CORE_USER ).setReferenceDate( referenceDate );
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );
	} );

	describe( 'widget rendering', () => {
		const shouldRender = {
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			accountStatus: ACCOUNT_STATUS_READY,
			siteStatus: SITE_STATUS_READY,
			adBlockingRecoverySetupStatus: '',
			isModuleConnected: true,
			isNotificationDismissedPermanently: false,
			isNotificationAboveDismissedWithExpiry: false,
			setupCompletedTimestamp: timestampThreeWeeksPrior,
			existingAdBlockingRecoveryTag: null,
		};
		const testData = [
			[
				'in view only dashboard',
				{
					...shouldRender,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
				},
			],
			[
				'the Adsense module is not connected',
				{
					...shouldRender,
					isModuleConnected: false,
				},
			],
			[
				'notification is dismissed with 0 expiry',
				{
					...shouldRender,
					isNotificationDismissedPermanently: true,
				},
			],
			[
				'notification is dismissed for count > 2',
				{
					...shouldRender,
					isNotificationAboveDismissedWithExpiry: true,
				},
			],
			[
				'the Adsense account status is not ready',
				{
					...shouldRender,
					accountStatus: ACCOUNT_STATUS_PENDING,
				},
			],
			[
				'the Adsense site status is not ready',
				{
					...shouldRender,
					siteStatus: SITE_STATUS_ADDED,
				},
			],
			[
				'the Ad blocking recovery status is not an empty string',
				{
					...shouldRender,
					adBlockingRecoverySetupStatus:
						ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.SETUP_CONFIRMED,
				},
			],
			[
				'the setup completed timestamp is less than three weeks',
				{
					...shouldRender,
					setupCompletedTimestamp: timestampLessThanThreeWeeksPrior,
				},
			],
			[
				'an existing ad blocking recovery tag is detected',
				{
					...shouldRender,
					existingAdBlockingRecoveryTag: 'pub-3467161886473746',
				},
			],
		];

		it.each( testData )(
			'should not render the widget when %s',
			(
				_,
				{
					viewContext,
					accountStatus,
					siteStatus,
					adBlockingRecoverySetupStatus,
					isModuleConnected,
					isNotificationDismissedPermanently,
					isNotificationAboveDismissedWithExpiry,
					setupCompletedTimestamp,
					existingAdBlockingRecoveryTag,
				}
			) => {
				provideModules( registry, [
					{
						slug: 'adsense',
						active: true,
						connected: isModuleConnected,
					},
				] );

				registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {
					...validSettings,
					accountStatus,
					siteStatus,
					adBlockingRecoverySetupStatus,
					setupCompletedTimestamp,
				} );
				registry
					.dispatch( MODULES_ADSENSE )
					.receiveGetExistingAdBlockingRecoveryTag(
						existingAdBlockingRecoveryTag
					);
				let notificationMock = {};
				if ( isNotificationDismissedPermanently ) {
					notificationMock = {
						[ AD_BLOCKING_RECOVERY_MAIN_NOTIFICATION_KEY ]: {
							expires: 0, // Expiry of 0 permanently dismisses the prompt.
							count: 1,
						},
					};
				}
				if ( isNotificationAboveDismissedWithExpiry ) {
					notificationMock = {
						[ AD_BLOCKING_RECOVERY_MAIN_NOTIFICATION_KEY ]: {
							expires:
								Math.floor( new Date().getTime() / 1000 ) +
								1000, // If expiry is in the future the prompt will be dismissed until that time.
							count: 1,
						},
					};
				}
				registry
					.dispatch( CORE_USER )
					.receiveGetDismissedPrompts( notificationMock );

				const { container } = render(
					<AdBlockingRecoverySetupCTAWidget
						Widget={ Widget }
						WidgetNull={ WidgetNull }
					/>,
					{
						registry,
						viewContext,
					}
				);

				expect( container ).toBeEmptyDOMElement();

				// If the widget is not rendered, no tracking event should fire.
				expect( mockTrackEvent ).not.toHaveBeenCalled();
			}
		);

		it( 'should render the widget for the existing site without the setup completion time', async () => {
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetSettings( validSettings );

			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetExistingAdBlockingRecoveryTag( null );

			const { container, waitForRegistry } = render(
				<AdBlockingRecoverySetupCTAWidget
					Widget={ Widget }
					WidgetNull={ WidgetNull }
				/>,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			await waitForRegistry();

			expect( container ).toHaveTextContent(
				'Recover revenue lost to ad blockers'
			);

			// The tracking event should fire when the widget is rendered.
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'mainDashboard_adsense-abr-cta-widget',
				'view_notification'
			);
		} );

		it( 'should render the widget for the site with a setup completion time of more than three weeks', () => {
			registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {
				...validSettings,
				setupCompletedTimestamp: timestampThreeWeeksPrior,
			} );

			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetExistingAdBlockingRecoveryTag( null );

			const { container } = render(
				<AdBlockingRecoverySetupCTAWidget
					Widget={ Widget }
					WidgetNull={ WidgetNull }
				/>,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);
			expect( container ).toHaveTextContent(
				'Recover revenue lost to ad blockers'
			);

			// The tracking event should fire when the widget is rendered.
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'mainDashboard_adsense-abr-cta-widget',
				'view_notification'
			);
		} );

		it( 'should trigger a survey when in-view', async () => {
			registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {
				...validSettings,
				setupCompletedTimestamp: timestampThreeWeeksPrior,
			} );

			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetExistingAdBlockingRecoveryTag( null );

			render(
				<AdBlockingRecoverySetupCTAWidget
					Widget={ Widget }
					WidgetNull={ WidgetNull }
				/>,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			await waitFor( () =>
				expect( fetchMock ).toHaveFetched(
					surveyTriggerEndpoint,
					expect.objectContaining( {
						body: {
							data: { triggerID: 'view_abr_setup_cta' },
						},
					} )
				)
			);
		} );

		it( 'should not render when it is being dismissed', () => {
			registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {
				...validSettings,
				setupCompletedTimestamp: timestampThreeWeeksPrior,
			} );

			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetExistingAdBlockingRecoveryTag( null );

			registry
				.dispatch( CORE_USER )
				.setIsPromptDimissing(
					AD_BLOCKING_RECOVERY_MAIN_NOTIFICATION_KEY,
					true
				);

			const { container } = render(
				<AdBlockingRecoverySetupCTAWidget
					Widget={ Widget }
					WidgetNull={ WidgetNull }
				/>,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			expect( container ).toBeEmptyDOMElement();
		} );
	} );

	describe( 'CTA actions', () => {
		// This is needed for `navigateTo` to work in test.
		mockLocation();

		beforeEach( () => {
			fetchMock.getOnce( dismissedPromptsEndpoint, {
				body: {},
				status: 200,
			} );
			fetchMock.postOnce( dismissPromptEndpoint, {
				body: {
					[ AD_BLOCKING_RECOVERY_MAIN_NOTIFICATION_KEY ]: {
						expires: 0, // Expiry of 0 permanently dismisses the prompt.
						count: 3,
					},
				},
				status: 200,
			} );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetSettings( validSettings );
			registry
				.dispatch( MODULES_ADSENSE )
				.receiveGetExistingAdBlockingRecoveryTag( null );
		} );

		it( 'should navigate to ABR setup page when primary CTA is clicked', async () => {
			const { getByRole } = render(
				<div>
					<div id="adminmenu">
						<a href="http://test.test/wp-admin/admin.php?page=googlesitekit-settings">
							Settings
						</a>
					</div>
					<AdBlockingRecoverySetupCTAWidget
						Widget={ Widget }
						WidgetNull={ WidgetNull }
					/>
				</div>,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);
			const abrURL = registry
				.select( CORE_SITE )
				.getAdminURL( 'googlesitekit-ad-blocking-recovery' );

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click(
					getByRole( 'button', { name: /Set up now/i } )
				);
			} );

			// The tracking event should fire when the CTA is clicked.
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'mainDashboard_adsense-abr-cta-widget',
				'confirm_notification'
			);

			expect( global.location.assign ).toHaveBeenCalled();
			expect( global.location.assign ).toHaveBeenCalledWith( abrURL );
		} );

		it( 'should dismiss the CTA and open the tooltip when dismiss button is clicked', async () => {
			const { container, getByRole } = render(
				<AdBlockingRecoverySetupCTAWidget
					Widget={ Widget }
					WidgetNull={ WidgetNull }
				/>,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);
			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click(
					getByRole( 'button', { name: /Maybe later/i } )
				);
			} );

			expect( container ).not.toHaveTextContent(
				'Recover revenue lost to ad blockers'
			);

			// The tracking event should fire when the CTA is clicked.
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'mainDashboard_adsense-abr-cta-widget',
				'dismiss_notification'
			);

			expect( mockShowTooltip ).toHaveBeenCalled();

			expect( fetchMock ).toHaveFetched(
				dismissPromptEndpoint,
				expect.objectContaining( {
					body: {
						data: {
							promptKey:
								AD_BLOCKING_RECOVERY_MAIN_NOTIFICATION_KEY,
						},
					},
				} )
			);
		} );

		it( 'should fire track event when "learn more" is clicked', async () => {
			registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );

			const { getByRole, waitForRegistry } = render(
				<div>
					<div id="adminmenu">
						<a href="http://test.test/wp-admin/admin.php?page=googlesitekit-settings">
							Settings
						</a>
					</div>
					<AdBlockingRecoverySetupCTAWidget
						Widget={ Widget }
						WidgetNull={ WidgetNull }
					/>
				</div>,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			await waitForRegistry();

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click( getByRole( 'link', { name: /Learn more/i } ) );
			} );

			// The tracking event should fire when the CTA is clicked.
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'mainDashboard_adsense-abr-cta-widget',
				'click_learn_more_link'
			);
		} );

		it( 'should show the `Don’t show again` CTA when the dismissCount is 2', async () => {
			registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );
			registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
				[ AD_BLOCKING_RECOVERY_MAIN_NOTIFICATION_KEY ]: {
					expires: 1000,
					count: 2,
				},
			} );

			const { getByRole, waitForRegistry } = render(
				<AdBlockingRecoverySetupCTAWidget
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
				getByRole( 'button', { name: /Don’t show again/i } )
			).toBeInTheDocument();
		} );
	} );
} );
