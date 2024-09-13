/**
 * AudienceSelectionPanel ErrorNotice component tests.
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
import { CORE_SITE } from '../../../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '../../../../../../util/errors';
import { MODULES_ANALYTICS_4 } from '../../../../datastore/constants';
import { availableAudiences } from '../../../../datastore/__fixtures__';
import {
	act,
	createTestRegistry,
	fireEvent,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserInfo,
	render,
	untilResolved,
	waitForDefaultTimeouts,
} from '../../../../../../../../tests/js/test-utils';
import ErrorNotice from './ErrorNotice';

describe( 'ErrorNotice', () => {
	let registry;
	let invalidateResolutionSpy;

	const syncAvailableAudiencesEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/sync-audiences'
	);
	const audienceSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/audience-settings'
	);

	const baseReportOptions = {
		startDate: '2024-02-29',
		endDate: '2024-03-27',
		metrics: [ { name: 'totalUsers' } ],
	};

	const reportOptions = {
		...baseReportOptions,
		dimensions: [ { name: 'audienceResourceName' } ],
		dimensionFilters: {
			audienceResourceName: availableAudiences.map(
				( { name } ) => name
			),
		},
	};

	const errorCases = [
		[ 'resyncing available audiences', 'syncAvailableAudiences', [] ],
		[ 'retrieving user count', 'getReport', [ reportOptions ] ],
	];

	beforeEach( () => {
		registry = createTestRegistry();

		registry.dispatch( CORE_USER ).setReferenceDate( '2024-03-28' );
		provideSiteInfo( registry );
		provideUserInfo( registry );
		provideModules( registry );
		provideModuleRegistrations( registry );
		provideUserAuthentication( registry );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveResourceDataAvailabilityDates( {
				audience: availableAudiences.reduce( ( acc, { name } ) => {
					acc[ name ] = 20201220;

					return acc;
				}, {} ),
				customDimension: {},
				property: {},
			} );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			accountID: '12345',
			propertyID: '34567',
			measurementID: '56789',
			webDataStreamID: '78901',
			availableAudiences,
		} );

		invalidateResolutionSpy = jest.spyOn(
			registry.dispatch( MODULES_ANALYTICS_4 ),
			'invalidateResolution'
		);
	} );

	afterEach( () => {
		invalidateResolutionSpy.mockReset();
	} );

	it( 'should not render if there are no errors', async () => {
		const { container, waitForRegistry } = render( <ErrorNotice />, {
			registry,
		} );

		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
	} );

	it.each( errorCases )(
		'should display an error notice when there is an insufficient permissions error while %s',
		async ( _, storeFunctionName, args ) => {
			const error = {
				code: 'test_error',
				message: 'Error message.',
				data: { reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS },
			};

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveError( error, storeFunctionName, args );

			const { getByText, waitForRegistry } = render( <ErrorNotice />, {
				registry,
			} );

			await waitForRegistry();

			expect(
				getByText(
					/Insufficient permissions, contact your administrator/i
				)
			).toBeInTheDocument();
		}
	);

	it.each( errorCases )(
		'should render a "Get help" link when there is an insufficient permissions error while %s',
		async ( _, storeFunctionName, args ) => {
			const error = {
				code: 'test_error',
				message: 'Error message.',
				data: { reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS },
			};

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveError( error, storeFunctionName, args );

			const { getByRole, getByText, waitForRegistry } = render(
				<ErrorNotice />,
				{
					registry,
				}
			);

			await waitForRegistry();

			expect( getByText( /get help/i ) ).toBeInTheDocument();
			expect(
				getByRole( 'link', { name: /get help/i } )
			).toHaveAttribute(
				'href',
				registry.select( CORE_SITE ).getErrorTroubleshootingLinkURL( {
					code: 'analytics-4_insufficient_permissions',
				} )
			);
		}
	);

	it.each( errorCases )(
		'should render a "Request access" link when there is an insufficient permissions error while %s',
		async ( _, storeFunctionName, args ) => {
			const error = {
				code: 'test_error',
				message: 'Error message.',
				data: { reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS },
			};

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveError( error, storeFunctionName, args );

			const { getByRole, getByText, waitForRegistry } = render(
				<ErrorNotice />,
				{
					registry,
				}
			);

			await waitForRegistry();

			expect( getByText( /request access/i ) ).toBeInTheDocument();
			expect(
				getByRole( 'link', { name: /request access/i } )
			).toHaveAttribute(
				'href',
				registry
					.select( MODULES_ANALYTICS_4 )
					.getServiceEntityAccessURL()
			);
		}
	);

	it.each( errorCases )(
		'should display an error notice when %s fails',
		async ( _, storeFunctionName, args ) => {
			const error = {
				code: 'test_error',
				message: 'Error message.',
				data: {},
			};

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveError( error, storeFunctionName, args );

			const { getByText, waitForRegistry } = render( <ErrorNotice />, {
				registry,
			} );

			await waitForRegistry();

			expect( getByText( /Data loading failed/i ) ).toBeInTheDocument();
		}
	);

	it.each( errorCases )(
		'should render a "Retry" button when %s fails',
		async ( _, storeFunctionName, args ) => {
			const error = {
				code: 'test_error',
				message: 'Error message.',
				data: {},
			};

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveError( error, storeFunctionName, args );

			const { getByRole, getByText, waitForRegistry } = render(
				<ErrorNotice />,
				{
					registry,
				}
			);

			await waitForRegistry();

			expect( getByText( /retry/i ) ).toBeInTheDocument();

			await act( waitForDefaultTimeouts );

			if ( 'syncAvailableAudiences' === storeFunctionName ) {
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getErrorForAction( 'syncAvailableAudiences' )
				).toEqual( error );
			}

			fireEvent.click( getByRole( 'button', { name: /retry/i } ) );

			if ( 'syncAvailableAudiences' === storeFunctionName ) {
				fetchMock.postOnce( syncAvailableAudiencesEndpoint, {
					body: availableAudiences,
					status: 200,
				} );

				fetchMock.getOnce( audienceSettingsEndpoint, {
					body: {
						data: {
							configuredAudiences: [],
						},
					},
				} );

				await untilResolved(
					registry,
					CORE_USER
				).getAudienceSettings();

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getErrorForAction( 'syncAvailableAudiences' )
				).toEqual( undefined );
			} else {
				expect( invalidateResolutionSpy ).toHaveBeenCalledTimes( 1 );
			}
		}
	);

	describe( 'when a Site Kit audience is in the partial data state, and the special case `newVsReturning` report returns an error', () => {
		beforeEach( () => {
			const error = {
				code: 'test_error',
				message: 'Error message.',
				data: {},
			};

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveResourceDataAvailabilityDates( {
					audience: availableAudiences.reduce(
						( acc, { name, audienceType } ) => {
							if ( 'SITE_KIT_AUDIENCE' === audienceType ) {
								acc[ name ] = 20240405; // Ensure Site Kit audiences are in the partial data state.
							} else {
								acc[ name ] = 20201220;
							}

							return acc;
						},
						{}
					),
					customDimension: {},
					property: {},
				} );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveError( error, 'getReport', [
					registry
						.select( MODULES_ANALYTICS_4 )
						.getSiteKitAudiencesUserCountReportOptions(),
				] );
		} );

		it( 'should render the error notice', async () => {
			const { getByText, waitForRegistry } = render( <ErrorNotice />, {
				registry,
			} );

			await waitForRegistry();

			expect( getByText( /Data loading failed/i ) ).toBeInTheDocument();
		} );

		it( 'should render a "Retry" button', async () => {
			const { getByText, getByRole, waitForRegistry } = render(
				<ErrorNotice />,
				{
					registry,
				}
			);

			await waitForRegistry();

			expect( getByText( /retry/i ) ).toBeInTheDocument();

			expect( invalidateResolutionSpy ).not.toHaveBeenCalled();

			fireEvent.click( getByRole( 'button', { name: /retry/i } ) );

			expect( invalidateResolutionSpy ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
