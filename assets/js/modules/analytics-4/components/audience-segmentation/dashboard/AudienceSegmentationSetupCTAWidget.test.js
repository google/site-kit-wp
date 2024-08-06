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
	screen,
	waitFor,
} from '../../../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	muteFetch,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	unsubscribeFromAll,
	waitForDefaultTimeouts,
	waitForTimeouts,
} from '../../../../../../../tests/js/utils';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { CORE_FORMS } from '../../../../../googlesitekit/datastore/forms/constants';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
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
import { getWidgetComponentProps } from '../../../../../googlesitekit/widgets/util';
import { getAnalytics4MockResponse } from '../../../utils/data-mock';
import AudienceSegmentationSetupCTAWidget, {
	AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION,
} from './AudienceSegmentationSetupCTAWidget';

describe( 'AudienceSegmentationSetupCTAWidget', () => {
	let registry;

	const { Widget, WidgetNull } = getWidgetComponentProps(
		'audienceSegmentationSetupCTA'
	);

	const audienceSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/audience-settings'
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

	const testPropertyID = propertiesFixture[ 0 ]._id;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideUserAuthentication( registry, {
			grantedScopes: [ EDIT_SCOPE ],
		} );
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

		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			availableAudiences: null,
			// Assume the required custom dimension is available for most tests. Its creation is tested in its own subsection.
			availableCustomDimensions: [ 'googlesitekit_post_type' ],
			propertyID: testPropertyID,
		} );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
		jest.clearAllMocks();
	} );

	describe( 'widget rendering', () => {
		it( 'should render the widget when the user has not permanently dismissed the prompt', () => {
			const { queryByText, getByRole } = render(
				<AudienceSegmentationSetupCTAWidget
					Widget={ Widget }
					WidgetNull={ WidgetNull }
				/>,
				{
					registry,
				}
			);

			expect(
				queryByText(
					/Learn how different types of visitors interact with your site/i
				)
			).toBeInTheDocument();

			expect(
				getByRole( 'button', { name: /Maybe later/i } )
			).toBeInTheDocument();

			expect(
				queryByText( /Don’t show again/i )
			).not.toBeInTheDocument();
		} );

		it( 'should render the widget when no audience is configured and Google Analytics data is loaded on the page', async () => {
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

			const { getByText, waitForRegistry } = render(
				<AudienceSegmentationSetupCTAWidget Widget={ Widget } />,
				{
					registry,
				}
			);

			// Wait for resolvers to finish to avoid an unhandled React state update.
			await waitForRegistry();

			expect(
				getByText(
					'Learn how different types of visitors interact with your site'
				)
			).toBeInTheDocument();

			expect( getByText( 'Enable groups' ) ).toBeInTheDocument();
		} );

		it( 'should not render the widget when no audience is configured and Google Analytics data is not loaded on the page', async () => {
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

			const { queryByText, waitForRegistry } = render(
				<AudienceSegmentationSetupCTAWidget Widget={ Widget } />,
				{
					registry,
				}
			);

			// Wait for resolvers to finish to avoid an unhandled React state update.
			await waitForRegistry();

			expect(
				queryByText(
					/Learn how different types of visitors interact with your site/i
				)
			).not.toBeInTheDocument();
		} );

		it( 'should not render the widget when configured audiences are present and Google Analytics data is loaded on the page', async () => {
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

			const { queryByText, waitForRegistry } = render(
				<AudienceSegmentationSetupCTAWidget Widget={ Widget } />,
				{
					registry,
				}
			);

			// Wait for resolvers to finish to avoid an unhandled React state update.
			await waitForRegistry();

			expect(
				queryByText(
					/Learn how different types of visitors interact with your site/i
				)
			).not.toBeInTheDocument();
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
					<AudienceSegmentationSetupCTAWidget
						Widget={ Widget }
						WidgetNull={ WidgetNull }
					/>
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

		it( 'should close the tooltip on clicking the `X` button', async () => {
			const { getByRole } = render(
				<div>
					<div id="adminmenu">
						<a href="http://test.test/wp-admin/admin.php?page=googlesitekit-settings">
							Settings
						</a>
					</div>
					<AudienceSegmentationSetupCTAWidget
						Widget={ Widget }
						WidgetNull={ WidgetNull }
					/>
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

		it( 'should close the tooltip on clicking the `Got it` button', async () => {
			const { getByRole } = render(
				<div>
					<div id="adminmenu">
						<a href="http://test.test/wp-admin/admin.php?page=googlesitekit-settings">
							Settings
						</a>
					</div>
					<AudienceSegmentationSetupCTAWidget
						Widget={ Widget }
						WidgetNull={ WidgetNull }
					/>
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

		it( 'should show the `Don’t show again` CTA when the dismissCount is 1', async () => {
			registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
				[ AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION ]: {
					expires: 1000,
					count: 1,
				},
			} );

			const { getByRole, queryByText, waitForRegistry } = render(
				<AudienceSegmentationSetupCTAWidget
					Widget={ Widget }
					WidgetNull={ WidgetNull }
				/>,
				{
					registry,
				}
			);

			await act( waitForRegistry );

			expect(
				getByRole( 'button', { name: /Don’t show again/i } )
			).toBeInTheDocument();

			expect( queryByText( /Maybe later/i ) ).not.toBeInTheDocument();
		} );

		it( 'should initialise the list of configured audiences when CTA is clicked.', async () => {
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

			const { getByRole } = render(
				<AudienceSegmentationSetupCTAWidget Widget={ Widget } />,
				{
					registry,
				}
			);

			expect(
				getByRole( 'button', { name: /Enable groups/i } )
			).toBeInTheDocument();

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click(
					getByRole( 'button', { name: /Enable groups/i } )
				);
			} );

			expect(
				getByRole( 'button', { name: /Enabling groups/i } )
			).toBeInTheDocument();

			await act( () => waitForTimeouts( 30 ) );
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

			// eslint-disable-next-line require-await
			await act( async () => {
				render(
					<AudienceSegmentationSetupCTAWidget Widget={ Widget } />,
					{
						registry,
					}
				);
			} );

			await waitFor( () => {
				expect(
					screen.getByRole( 'button', { name: /Enabling groups/i } )
				).toBeInTheDocument();
			} );

			await act( () => waitForTimeouts( 30 ) );
		} );

		describe( 'AudienceErrorModal', () => {
			it( 'should show the OAuth error modal when the required scopes are not granted', async () => {
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

				// eslint-disable-next-line require-await
				await act( async () => {
					render(
						<AudienceSegmentationSetupCTAWidget
							Widget={ Widget }
						/>,
						{
							registry,
						}
					);
				} );

				expect(
					screen.getByRole( 'button', { name: /Enable groups/i } )
				).toBeInTheDocument();

				act( () => {
					fireEvent.click(
						screen.getByRole( 'button', { name: /Enable groups/i } )
					);
				} );

				// Verify the error is an OAuth error variant.
				await waitFor( () => {
					expect(
						screen.getByText( /Analytics update failed/i )
					).toBeInTheDocument();

					// Verify the "Get help" link is displayed.
					expect(
						screen.getByText( /get help/i )
					).toBeInTheDocument();

					expect(
						screen.getByRole( 'link', { name: /get help/i } )
					).toHaveAttribute(
						'href',
						registry
							.select( CORE_SITE )
							.getErrorTroubleshootingLinkURL( {
								code: 'access_denied',
							} )
					);

					// Verify the "Retry" button is displayed.
					expect( screen.getByText( /retry/i ) ).toBeInTheDocument();
				} );

				await act( waitForDefaultTimeouts );
			} );

			it( 'should show the insufficient permission error modal when the user does not have the required permissions', async () => {
				const errorResponse = {
					code: 'test_error',
					message: 'Error message.',
					data: { reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS },
				};

				fetchMock.post( syncAvailableAudiencesEndpoint, {
					body: errorResponse,
					status: 500,
				} );

				// eslint-disable-next-line require-await
				await act( async () => {
					render(
						<AudienceSegmentationSetupCTAWidget
							Widget={ Widget }
						/>,
						{
							registry,
						}
					);
				} );

				expect(
					screen.getByRole( 'button', { name: /Enable groups/i } )
				).toBeInTheDocument();

				act( () => {
					fireEvent.click(
						screen.getByRole( 'button', { name: /Enable groups/i } )
					);
				} );

				// Verify the error is "Insufficient permissions" variant.
				await waitFor( () => {
					expect(
						screen.getByText( /Insufficient permissions/i )
					).toBeInTheDocument();

					// Verify the "Get help" link is displayed.
					expect(
						screen.getByText( /get help/i )
					).toBeInTheDocument();

					// Verify the "Request access" button is displayed.
					expect(
						screen.getByText( /request access/i )
					).toBeInTheDocument();
				} );

				await act( waitForDefaultTimeouts );
			} );

			it( 'should show the generic error modal when an internal server error occurs', async () => {
				const errorResponse = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.post( syncAvailableAudiencesEndpoint, {
					body: errorResponse,
					status: 500,
				} );

				// eslint-disable-next-line require-await
				await act( async () => {
					render(
						<AudienceSegmentationSetupCTAWidget
							Widget={ Widget }
						/>,
						{
							registry,
						}
					);
				} );

				expect(
					screen.getByRole( 'button', { name: /Enable groups/i } )
				).toBeInTheDocument();

				act( () => {
					fireEvent.click(
						screen.getByRole( 'button', { name: /Enable groups/i } )
					);
				} );

				// Verify the error is "Insufficient permissions" variant.
				await waitFor( () => {
					expect(
						screen.getByText( /Failed to set up visitor groups/i )
					).toBeInTheDocument();

					// Verify the "Retry" button is displayed.
					expect(
						screen.getByRole( 'button', { name: /retry/i } )
					).toBeInTheDocument();
				} );

				await act( waitForDefaultTimeouts );
			} );
		} );
	} );
} );
