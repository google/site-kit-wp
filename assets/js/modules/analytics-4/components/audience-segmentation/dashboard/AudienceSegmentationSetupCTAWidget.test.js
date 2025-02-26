/**
 * AudienceSegmentationSetupCTAWidget component tests.
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
import fetchMock from 'fetch-mock';
import {
	act,
	fireEvent,
	render,
	waitFor,
} from '../../../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	freezeFetch,
	muteFetch,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserInfo,
	waitForDefaultTimeouts,
	waitForTimeouts,
} from '../../../../../../../tests/js/utils';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { CORE_FORMS } from '../../../../../googlesitekit/datastore/forms/constants';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../../googlesitekit/constants';
import {
	MODULES_ANALYTICS_4,
	EDIT_SCOPE,
	AUDIENCE_SEGMENTATION_SETUP_FORM,
	SITE_KIT_AUDIENCE_DEFINITIONS,
} from '../../../datastore/constants';
import {
	availableAudiences as audiencesFixture,
	properties as propertiesFixture,
} from '../../../datastore/__fixtures__';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '../../../../../util/errors';
import * as tracking from '../../../../../util/tracking';
import { getAnalytics4MockResponse } from '../../../utils/data-mock';
import AudienceSegmentationSetupCTAWidget, {
	AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION,
} from './AudienceSegmentationSetupCTAWidget';
import { ANALYTICS_4_NOTIFICATIONS } from '../../..';
import { withNotificationComponentProps } from '../../../../../googlesitekit/notifications/util/component-props';
import { CORE_NOTIFICATIONS } from '../../../../../googlesitekit/notifications/datastore/constants';
import { mockSurveyEndpoints } from '../../../../../../../tests/js/mock-survey-endpoints';
import { enabledFeatures } from '../../../../../features';

jest.mock( 'react-use', () => ( {
	...jest.requireActual( 'react-use' ),
	useIntersection: jest.fn(),
} ) );

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'AudienceSegmentationSetupCTAWidget', () => {
	let registry;

	const notification =
		ANALYTICS_4_NOTIFICATIONS[
			AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION
		];

	const AudienceSegmentationSetupCTAComponent =
		withNotificationComponentProps(
			AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION
		)( AudienceSegmentationSetupCTAWidget );

	const audienceSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/audience-settings'
	);

	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	const syncAvailableAudiencesEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/sync-audiences'
	);

	const createAudienceEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/create-audience'
	);

	const expirableItemEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/set-expirable-item-timers'
	);

	const testPropertyID = propertiesFixture[ 0 ]._id;

	beforeEach( () => {
		registry = createTestRegistry();

		enabledFeatures.add( 'audienceSegmentation' );

		registry
			.dispatch( CORE_NOTIFICATIONS )
			.registerNotification(
				AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION,
				notification
			);

		provideSiteInfo( registry );
		provideUserAuthentication( registry, {
			grantedScopes: [ EDIT_SCOPE ],
		} );
		provideUserInfo( registry );
		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
			},
		] );
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsDataAvailableOnLoad( true );

		const referenceDate = '2024-05-10';
		const startDate = '2024-02-09'; // 91 days before `referenceDate`.

		registry.dispatch( CORE_USER ).setReferenceDate( referenceDate );

		registry.dispatch( CORE_USER ).receiveGetAudienceSettings( {
			configuredAudiences: null,
			isAudienceSegmentationWidgetHidden: false,
		} );

		const options = {
			metrics: [ { name: 'totalUsers' } ],
			startDate,
			endDate: referenceDate,
		};

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( getAnalytics4MockResponse( options ), {
				options,
			} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ options ] );

		const currentTimeInSeconds = Math.floor( Date.now() / 1000 );
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
			[ AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION ]: {
				expires: currentTimeInSeconds - 10,
				count: 0,
			},
		} );
		registry
			.dispatch( CORE_USER )
			.finishResolution( 'getDismissedPrompts', [] );

		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			availableAudiences: null,
			// Assume the required custom dimension is available for most tests. Its creation is tested in its own subsection.
			availableCustomDimensions: [ 'googlesitekit_post_type' ],
			propertyID: testPropertyID,
		} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAudienceSegmentationSetupCompletedBy( null );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'checkRequirements', () => {
		it( 'is active when user did not permanently dismissed the prompt', async () => {
			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( true );
		} );

		it( 'is active when no audience is configured and Google Analytics data is loaded on the page', async () => {
			const settings = {
				configuredAudiences: [],
				isAudienceSegmentationWidgetHidden: false,
			};

			// Set the data availability on page load to true.
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveIsDataAvailableOnLoad( true );

			registry
				.dispatch( CORE_USER )
				.receiveGetAudienceSettings( settings );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( true );
		} );

		it( 'is not active when no audience is configured and Google Analytics data is not loaded on the page', async () => {
			const settings = {
				configuredAudiences: [],
				isAudienceSegmentationWidgetHidden: false,
			};

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveIsGatheringData( false );

			// Set the data availability on page load to false.
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveIsDataAvailableOnLoad( false );

			registry
				.dispatch( CORE_USER )
				.receiveGetAudienceSettings( settings );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );

		it( 'is not active when configured audiences are present and Google Analytics data is loaded on the page', async () => {
			const settings = {
				configuredAudiences: [
					audiencesFixture[ 0 ],
					audiencesFixture[ 1 ],
					audiencesFixture[ 2 ],
				],
				isAudienceSegmentationWidgetHidden: false,
			};

			// Set the data availability on page load to true.
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveIsDataAvailableOnLoad( true );

			registry
				.dispatch( CORE_USER )
				.receiveGetAudienceSettings( settings );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );

		it( 'is not active when audienceSegmentationSetupCompletedBy has been set', async () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setAudienceSegmentationSetupCompletedBy( 1 );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );
	} );

	describe( 'CTA actions', () => {
		beforeEach( () => {
			fetchMock.getOnce(
				new RegExp(
					'^/google-site-kit/v1/core/user/data/dismissed-prompts'
				),
				{
					body: {},
					status: 200,
				}
			);
			fetchMock.postOnce(
				new RegExp(
					'^/google-site-kit/v1/core/user/data/dismiss-prompt'
				),
				{
					body: {
						[ AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION ]: {
							expires: 0, // Expiry of 0 permanently dismisses the prompt.
							count: 2,
						},
					},
					status: 200,
				}
			);
		} );

		it( 'should dismiss the CTA and open the tooltip when dismiss button is clicked', async () => {
			const { container, getByRole } = render(
				<div>
					<div id="adminmenu">
						<a href="http://test.test/wp-admin/admin.php?page=googlesitekit-settings">
							Settings
						</a>
					</div>
					<AudienceSegmentationSetupCTAComponent />
				</div>,
				{
					registry,
				}
			);
			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click(
					getByRole( 'button', { name: /Maybe later/i } )
				);
			} );

			expect( container ).not.toHaveTextContent(
				'Learn how different types of visitors interact with your site'
			);

			expect(
				document.querySelector( '.googlesitekit-tour-tooltip' )
			).toBeInTheDocument();
		} );

		it( 'should track events when the CTA is dismissed and the tooltip is viewed', async () => {
			const { getByRole, waitForRegistry } = render(
				<div>
					<div id="adminmenu">
						<a href="http://test.test/wp-admin/admin.php?page=googlesitekit-settings">
							Settings
						</a>
					</div>
					<AudienceSegmentationSetupCTAComponent />
				</div>,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click(
					getByRole( 'button', { name: /Maybe later/i } )
				);
			} );

			await waitForRegistry();

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 2 );
			expect( mockTrackEvent ).toHaveBeenNthCalledWith(
				1,
				'mainDashboard_audiences-setup-cta-dashboard',
				'tooltip_view'
			);
			expect( mockTrackEvent ).toHaveBeenNthCalledWith(
				2,
				'mainDashboard_audiences-setup-cta-dashboard',
				'dismiss_notification',
				// Since additional arguments are not passed, we need to mimick empty arguments to match the mocked call.
				undefined,
				undefined
			);
		} );

		it( 'should close the tooltip on clicking the `X` button', async () => {
			const { getByRole } = render(
				<div>
					<div id="adminmenu">
						<a href="http://test.test/wp-admin/admin.php?page=googlesitekit-settings">
							Settings
						</a>
					</div>
					<AudienceSegmentationSetupCTAComponent />
				</div>,
				{
					registry,
				}
			);
			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click(
					getByRole( 'button', { name: /Maybe later/i } )
				);
			} );

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click( getByRole( 'button', { name: /Close/i } ) );
			} );

			expect(
				document.querySelector( '.googlesitekit-tour-tooltip' )
			).not.toBeInTheDocument();
		} );

		it( 'should track an event when the tooltip is closed by clicking the `X` button', async () => {
			const { getByRole } = render(
				<div>
					<div id="adminmenu">
						<a href="http://test.test/wp-admin/admin.php?page=googlesitekit-settings">
							Settings
						</a>
					</div>
					<AudienceSegmentationSetupCTAComponent />
				</div>,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click(
					getByRole( 'button', { name: /Maybe later/i } )
				);
			} );

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click( getByRole( 'button', { name: /Close/i } ) );
			} );

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 3 );
			expect( mockTrackEvent ).toHaveBeenNthCalledWith(
				3,
				'mainDashboard_audiences-setup-cta-dashboard',
				'tooltip_dismiss'
			);
		} );

		it( 'should close the tooltip on clicking the `Got it` button', async () => {
			const { getByRole } = render(
				<div>
					<div id="adminmenu">
						<a href="http://test.test/wp-admin/admin.php?page=googlesitekit-settings">
							Settings
						</a>
					</div>
					<AudienceSegmentationSetupCTAComponent />
				</div>,
				{
					registry,
				}
			);
			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click(
					getByRole( 'button', { name: /Maybe later/i } )
				);
			} );

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click( getByRole( 'button', { name: /Got it/i } ) );
			} );

			expect(
				document.querySelector( '.googlesitekit-tour-tooltip' )
			).not.toBeInTheDocument();
		} );

		it( 'should track an event when the tooltip is closed by clicking the `Got it` button', async () => {
			const { getByRole } = render(
				<div>
					<div id="adminmenu">
						<a href="http://test.test/wp-admin/admin.php?page=googlesitekit-settings">
							Settings
						</a>
					</div>
					<AudienceSegmentationSetupCTAComponent />
				</div>,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click(
					getByRole( 'button', { name: /Maybe later/i } )
				);
			} );

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click( getByRole( 'button', { name: /Got it/i } ) );
			} );

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 3 );
			expect( mockTrackEvent ).toHaveBeenNthCalledWith(
				3,
				'mainDashboard_audiences-setup-cta-dashboard',
				'tooltip_dismiss'
			);
		} );

		it( 'should show the `Don’t show again` CTA when the dismissCount is 1', async () => {
			registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
				[ AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION ]: {
					expires: 1000,
					count: 1,
				},
			} );

			const { getByRole, queryByText, waitForRegistry } = render(
				<AudienceSegmentationSetupCTAComponent />,
				{
					registry,
				}
			);

			await waitForRegistry();

			expect(
				getByRole( 'button', { name: /Don’t show again/i } )
			).toBeInTheDocument();

			expect( queryByText( /Maybe later/i ) ).not.toBeInTheDocument();
		} );

		it( 'should initialise the list of configured audiences when CTA is clicked.', async () => {
			mockSurveyEndpoints();

			const settings = {
				configuredAudiences: null,
				isAudienceSegmentationWidgetHidden: false,
			};

			// Set the data availability on page load to true.
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveIsDataAvailableOnLoad( true );

			registry
				.dispatch( CORE_USER )
				.receiveGetAudienceSettings( settings );

			fetchMock.post( syncAvailableAudiencesEndpoint, {
				status: 200,
				body: audiencesFixture,
			} );

			fetchMock.postOnce(
				new RegExp(
					'^/google-site-kit/v1/modules/analytics-4/data/sync-custom-dimensions'
				),
				{
					body: [ 'googlesitekit_post_type' ],
					status: 200,
				}
			);

			const settingsBody = {
				configuredAudiences: [
					audiencesFixture[ 2 ].name,
					audiencesFixture[ 3 ].name,
				],
				isAudienceSegmentationWidgetHidden: false,
			};

			fetchMock.post( audienceSettingsEndpoint, {
				status: 200,
				body: settingsBody,
			} );

			fetchMock.post(
				{ url: createAudienceEndpoint, repeat: 2 },
				( url, opts ) => {
					return {
						body: opts.body.includes( 'new_visitors' )
							? {
									...SITE_KIT_AUDIENCE_DEFINITIONS[
										'new-visitors'
									],
									name: audiencesFixture[ 2 ].name,
							  }
							: {
									...SITE_KIT_AUDIENCE_DEFINITIONS[
										'returning-visitors'
									],
									name: audiencesFixture[ 3 ].name,
							  },
						status: 200,
					};
				}
			);

			muteFetch( reportEndpoint );
			muteFetch( expirableItemEndpoint );

			const { container, getByRole, waitForRegistry } = render(
				<AudienceSegmentationSetupCTAComponent />,
				{
					registry,
				}
			);

			await waitForRegistry();

			expect(
				getByRole( 'button', { name: /Enable groups/i } )
			).toBeInTheDocument();

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click(
					getByRole( 'button', { name: /Enable groups/i } )
				);
			} );

			// Dismiss prompt endpoint must be called when the CTA is clicked.
			const dismissPromptEndpoint = new RegExp(
				'^/google-site-kit/v1/core/user/data/dismiss-prompt'
			);

			expect(
				getByRole( 'button', { name: /Enabling groups/i } )
			).toBeInTheDocument();

			await waitForDefaultTimeouts();

			await waitFor( () => {
				expect( fetchMock ).toHaveFetched( dismissPromptEndpoint, {
					body: {
						data: {
							slug: AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION,
							expiration: 0,
						},
					},
					method: 'POST',
				} );
			} );

			expect( container ).toBeEmptyDOMElement();
		} );

		it( 'should initialise the list of configured audiences when autoSubmit is set to true.', async () => {
			const settings = {
				configuredAudiences: [],
				isAudienceSegmentationWidgetHidden: false,
			};

			// Set the data availability on page load to true.
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveIsDataAvailableOnLoad( true );

			registry
				.dispatch( CORE_USER )
				.receiveGetAudienceSettings( settings );

			// Set autoSubmit to true.
			registry
				.dispatch( CORE_FORMS )
				.setValues( AUDIENCE_SEGMENTATION_SETUP_FORM, {
					autoSubmit: true,
				} );

			fetchMock.post( syncAvailableAudiencesEndpoint, {
				status: 200,
				body: audiencesFixture,
			} );

			const settingsBody = {
				configuredAudiences: [
					audiencesFixture[ 2 ].name,
					audiencesFixture[ 3 ].name,
				],
				isAudienceSegmentationWidgetHidden: false,
			};

			fetchMock.post( audienceSettingsEndpoint, {
				status: 200,
				body: settingsBody,
			} );

			fetchMock.post(
				{ url: createAudienceEndpoint, repeat: 2 },
				( url, opts ) => {
					return {
						body: opts.body.includes( 'new_visitors' )
							? {
									...SITE_KIT_AUDIENCE_DEFINITIONS[
										'new-visitors'
									],
									name: audiencesFixture[ 2 ].name,
							  }
							: {
									...SITE_KIT_AUDIENCE_DEFINITIONS[
										'returning-visitors'
									],
									name: audiencesFixture[ 3 ].name,
							  },
						status: 200,
					};
				}
			);

			muteFetch( reportEndpoint );
			muteFetch( expirableItemEndpoint );

			const { getByRole } = render(
				<AudienceSegmentationSetupCTAComponent />,
				{
					registry,
				}
			);

			expect(
				getByRole( 'button', { name: /Enabling groups/i } )
			).toBeInTheDocument();

			await act( () => waitForTimeouts( 100 ) );
		} );

		it( 'should track an event when the CTA is clicked', async () => {
			mockSurveyEndpoints();

			const settings = {
				configuredAudiences: null,
				isAudienceSegmentationWidgetHidden: false,
			};

			registry
				.dispatch( CORE_USER )
				.receiveGetAudienceSettings( settings );

			fetchMock.post( syncAvailableAudiencesEndpoint, {
				status: 200,
				body: audiencesFixture,
			} );

			fetchMock.postOnce(
				new RegExp(
					'^/google-site-kit/v1/modules/analytics-4/data/sync-custom-dimensions'
				),
				{
					body: [ 'googlesitekit_post_type' ],
					status: 200,
				}
			);

			const settingsBody = {
				configuredAudiences: [
					audiencesFixture[ 2 ].name,
					audiencesFixture[ 3 ].name,
				],
				isAudienceSegmentationWidgetHidden: false,
			};

			fetchMock.postOnce( audienceSettingsEndpoint, {
				status: 200,
				body: settingsBody,
			} );

			muteFetch( reportEndpoint );
			muteFetch( expirableItemEndpoint );

			const { getByRole, waitForRegistry } = render(
				<AudienceSegmentationSetupCTAComponent />,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			await waitForRegistry();

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click(
					getByRole( 'button', { name: /Enable groups/i } )
				);
			} );

			// Dismiss prompt endpoint must be called when the CTA is clicked.
			const dismissPromptEndpoint = new RegExp(
				'^/google-site-kit/v1/core/user/data/dismiss-prompt'
			);

			await waitFor( () => {
				expect( fetchMock ).toHaveFetched( dismissPromptEndpoint );
			} );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'mainDashboard_audiences-setup-cta-dashboard',
				'confirm_notification'
			);
		} );

		describe( 'OAuth error modal', () => {
			let getByRole, getByText;

			beforeEach( () => {
				provideSiteInfo( registry, {
					setupErrorCode: 'access_denied',
				} );

				provideUserAuthentication( registry, {
					grantedScopes: [],
				} );

				const settings = {
					configuredAudiences: [],
					isAudienceSegmentationWidgetHidden: false,
				};

				// Set the data availability on page load to true.
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveIsDataAvailableOnLoad( true );

				registry
					.dispatch( CORE_USER )
					.receiveGetAudienceSettings( settings );

				// Set `autoSubmit` to `true`, as the OAuth error modal will typically be
				// shown when the user returns from the OAuth flow.
				registry
					.dispatch( CORE_FORMS )
					.setValues( AUDIENCE_SEGMENTATION_SETUP_FORM, {
						autoSubmit: true,
					} );

				( { getByRole, getByText } = render(
					<AudienceSegmentationSetupCTAComponent />,
					{
						registry,
						viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
					}
				) );
			} );

			it( 'should show when the required scopes are not granted', () => {
				// Verify the error is an OAuth error variant.
				expect(
					getByText( /Analytics update failed/i )
				).toBeInTheDocument();

				// Verify the "Get help" link is displayed.
				expect( getByText( /get help/i ) ).toBeInTheDocument();

				expect(
					getByRole( 'link', { name: /get help/i } )
				).toHaveAttribute(
					'href',
					registry
						.select( CORE_SITE )
						.getErrorTroubleshootingLinkURL( {
							code: 'access_denied',
						} )
				);

				// Verify the "Retry" button is displayed.
				expect(
					getByRole( 'button', { name: /retry/i } )
				).toBeInTheDocument();
			} );

			it( 'should track an event when the Retry button is clicked', () => {
				mockTrackEvent.mockClear();

				freezeFetch( syncAvailableAudiencesEndpoint );

				act( () => {
					fireEvent.click(
						getByRole( 'button', { name: /retry/i } )
					);
				} );

				expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
				expect( mockTrackEvent ).toHaveBeenLastCalledWith(
					'mainDashboard_audiences-setup',
					'auth_error_retry'
				);
			} );

			it( 'should track an event when the Cancel button is clicked', () => {
				mockTrackEvent.mockClear();

				act( () => {
					fireEvent.click(
						getByRole( 'button', { name: /Cancel/i } )
					);
				} );

				expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
				expect( mockTrackEvent ).toHaveBeenLastCalledWith(
					'mainDashboard_audiences-setup',
					'auth_error_cancel'
				);
			} );
		} );

		describe( 'insufficient permissions error modal', () => {
			let getByRole, getByText;

			beforeEach( async () => {
				const errorResponse = {
					code: 'test_error',
					message: 'Error message.',
					data: { reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS },
				};

				fetchMock.post( syncAvailableAudiencesEndpoint, {
					body: errorResponse,
					status: 500,
				} );

				( { getByRole, getByText } = render(
					<AudienceSegmentationSetupCTAComponent />,
					{
						registry,
						viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
					}
				) );

				expect(
					getByRole( 'button', { name: /Enable groups/i } )
				).toBeInTheDocument();

				act( () => {
					fireEvent.click(
						getByRole( 'button', { name: /Enable groups/i } )
					);
				} );

				await waitFor( () => {
					getByText( /Insufficient permissions/i );
				} );
			} );

			it( 'should show when the user does not have the required permissions', () => {
				// Verify the error is "Insufficient permissions" variant.
				expect(
					getByText( /Insufficient permissions/i )
				).toBeInTheDocument();

				// Verify the "Get help" link is displayed.
				expect(
					getByRole( 'link', { name: /get help/i } )
				).toBeInTheDocument();

				// Verify the "Request access" button is displayed.
				expect(
					getByRole( 'button', { name: /request access/i } )
				).toBeInTheDocument();
			} );

			it( 'should track an event when the "Request access" button is clicked', async () => {
				mockTrackEvent.mockClear();

				act( () => {
					fireEvent.click(
						getByRole( 'button', { name: /request access/i } )
					);
				} );

				// Allow the `trackEvent()` promise to resolve.
				await waitForDefaultTimeouts();

				expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
				expect( mockTrackEvent ).toHaveBeenLastCalledWith(
					'mainDashboard_audiences-setup',
					'insufficient_permissions_error_request_access'
				);
			} );

			it( 'should track an event when the Cancel button is clicked', async () => {
				mockTrackEvent.mockClear();

				act( () => {
					fireEvent.click(
						getByRole( 'button', { name: /cancel/i } )
					);
				} );

				// Allow the `trackEvent()` promise to resolve.
				await waitForDefaultTimeouts();

				expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
				expect( mockTrackEvent ).toHaveBeenLastCalledWith(
					'mainDashboard_audiences-setup',
					'insufficient_permissions_error_cancel'
				);
			} );
		} );

		describe( 'generic error modal', () => {
			let getByRole, getByText;

			beforeEach( async () => {
				const errorResponse = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.post( syncAvailableAudiencesEndpoint, {
					body: errorResponse,
					status: 500,
				} );

				( { getByRole, getByText } = render(
					<AudienceSegmentationSetupCTAComponent />,
					{
						registry,
						viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
					}
				) );

				expect(
					getByRole( 'button', { name: /Enable groups/i } )
				).toBeInTheDocument();

				act( () => {
					fireEvent.click(
						getByRole( 'button', { name: /Enable groups/i } )
					);
				} );

				// Verify the error is general error variant.
				await waitFor( () => {
					getByText( /Failed to set up visitor groups/i );
				} );
			} );

			it( 'should show when an internal server error occurs', () => {
				expect(
					getByText( /Failed to set up visitor groups/i )
				).toBeInTheDocument();

				// Verify the "Retry" button is displayed.
				expect(
					getByRole( 'button', { name: /retry/i } )
				).toBeInTheDocument();
			} );

			it( 'should track an event when the Retry button is clicked', () => {
				mockTrackEvent.mockClear();

				act( async () => {
					fireEvent.click(
						getByRole( 'button', { name: /retry/i } )
					);

					// Allow the `trackEvent()` promise to resolve.
					await waitForDefaultTimeouts();
				} );

				expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
				expect( mockTrackEvent ).toHaveBeenLastCalledWith(
					'mainDashboard_audiences-setup',
					'setup_error_retry'
				);

				expect( console ).toHaveErrored();
			} );

			it( 'should track an event when the Cancel button is clicked', () => {
				mockTrackEvent.mockClear();

				act( async () => {
					fireEvent.click(
						getByRole( 'button', { name: /cancel/i } )
					);

					// Allow the `trackEvent()` promise to resolve.
					await waitForDefaultTimeouts();
				} );

				expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
				expect( mockTrackEvent ).toHaveBeenLastCalledWith(
					'mainDashboard_audiences-setup',
					'setup_error_cancel'
				);
			} );
		} );
	} );
} );
