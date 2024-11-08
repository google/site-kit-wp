/**
 * AudienceSelectionPanel component tests.
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
 * External dependencies
 */
import {
	getByText as domGetByText,
	queryByText as domQueryByText,
} from '@testing-library/dom';

/**
 * Internal dependencies
 */
import {
	AUDIENCE_ADD_GROUP_NOTICE_SLUG,
	AUDIENCE_CREATION_FORM,
	AUDIENCE_CREATION_SUCCESS_NOTICE_SLUG,
	AUDIENCE_SELECTED,
	AUDIENCE_SELECTION_CHANGED,
	AUDIENCE_SELECTION_FORM,
	AUDIENCE_SELECTION_PANEL_OPENED_KEY,
} from './constants';
import { CORE_FORMS } from '../../../../../../googlesitekit/datastore/forms/constants';
import { CORE_SITE } from '../../../../../../googlesitekit/datastore/site/constants';
import { CORE_UI } from '../../../../../../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '../../../../../../util/errors';
import {
	AUDIENCE_ITEM_NEW_BADGE_SLUG_PREFIX,
	EDIT_SCOPE,
	MODULES_ANALYTICS_4,
} from '../../../../datastore/constants';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '../../../../../../googlesitekit/constants';
import { WEEK_IN_SECONDS } from '../../../../../../util';
import {
	createTestRegistry,
	muteFetch,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserInfo,
	waitForDefaultTimeouts,
	waitForTimeouts,
} from '../../../../../../../../tests/js/utils';
import { provideAnalytics4MockReport } from '../../../../utils/data-mock';
import {
	act,
	fireEvent,
	render,
	waitFor,
} from '../../../../../../../../tests/js/test-utils';
import { availableAudiences } from './../../../../datastore/__fixtures__';
import * as tracking from '../../../../../../util/tracking';
import AudienceSelectionPanel from '.';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'AudienceSelectionPanel', () => {
	let registry;

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

	const configuredAudiences = [
		'properties/12345/audiences/3',
		'properties/12345/audiences/4',
	];

	const expirableItemEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/set-expirable-item-timers'
	);
	const syncAvailableAudiencesEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/sync-audiences'
	);
	const audienceSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/audience-settings'
	);
	const dismissedItemsEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismissed-items'
	);

	beforeEach( () => {
		registry = createTestRegistry();

		provideUserAuthentication( registry, {
			grantedScopes: [ EDIT_SCOPE ],
		} );

		registry.dispatch( CORE_USER ).setReferenceDate( '2024-03-28' );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAvailableAudiences( availableAudiences );

		registry.dispatch( CORE_USER ).receiveGetAudienceSettings( {
			configuredAudiences,
			isAudienceSegmentationWidgetHidden: false,
		} );

		registry.dispatch( CORE_FORMS ).setValues( AUDIENCE_SELECTION_FORM, {
			[ AUDIENCE_SELECTED ]: configuredAudiences,
		} );

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

		provideAnalytics4MockReport( registry, reportOptions );

		registry.dispatch( CORE_USER ).receiveGetExpirableItems( {} );

		muteFetch( expirableItemEndpoint );
	} );

	afterEach( () => {
		mockTrackEvent.mockClear();
	} );

	it( 'should track event when the panel is opened', async () => {
		fetchMock.postOnce( syncAvailableAudiencesEndpoint, {
			body: availableAudiences,
			status: 200,
		} );

		registry
			.dispatch( CORE_UI )
			.setValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY, true );

		const { waitForRegistry } = render( <AudienceSelectionPanel />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		await waitForRegistry();

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_audiences-sidebar`,
			'audiences_sidebar_view'
		);
	} );

	describe( 'Header', () => {
		it( 'should display a settings link to deactivate the widget', async () => {
			const { getByText, waitForRegistry } = render(
				<AudienceSelectionPanel />,
				{
					registry,
				}
			);

			await waitForRegistry();

			expect(
				getByText( /You can deactivate this widget in/i )
			).toBeInTheDocument();
		} );

		it( 'should not display a settings link to deactivate the widget for a view-only user', async () => {
			const { container, waitForRegistry } = render(
				<AudienceSelectionPanel />,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
				}
			);

			await waitForRegistry();

			expect( container ).not.toHaveTextContent(
				'You can deactivate this widget in'
			);
		} );
	} );

	describe( 'AudienceItems', () => {
		it( 'should list available audiences', async () => {
			registry
				.dispatch( CORE_UI )
				.setValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY, true );

			fetchMock.postOnce( syncAvailableAudiencesEndpoint, {
				body: availableAudiences,
				status: 200,
			} );

			const { waitForRegistry } = render( <AudienceSelectionPanel />, {
				registry,
			} );

			await waitForRegistry();

			expect(
				document.querySelector(
					'.googlesitekit-audience-selection-panel .googlesitekit-selection-panel-items'
				)
			).toHaveTextContent( 'All visitors' );

			expect(
				document.querySelector(
					'.googlesitekit-audience-selection-panel .googlesitekit-selection-panel-items'
				)
			).toHaveTextContent( 'New visitors' );
		} );

		it( 'should not list "Purchasers" if it has no data', async () => {
			// Simulate no data available state for "Purchasers".
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveResourceDataAvailabilityDates( {
					audience: availableAudiences.reduce(
						( acc, { audienceSlug, name } ) => {
							if ( 'purchasers' === audienceSlug ) {
								acc[ name ] = 0;
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

			// Add report data.
			provideAnalytics4MockReport( registry, {
				...reportOptions,
				dimensionFilters: {
					audienceResourceName: availableAudiences
						.filter(
							( { audienceSlug } ) =>
								'purchasers' !== audienceSlug
						)
						.map( ( { name } ) => name ),
				},
			} );

			const { waitForRegistry } = render( <AudienceSelectionPanel />, {
				registry,
			} );

			await waitForRegistry();

			expect(
				document.querySelector(
					'.googlesitekit-audience-selection-panel .googlesitekit-selection-panel-items'
				)
			).not.toHaveTextContent( 'Purchasers' );
		} );

		it( 'should include user count for each audience if available', async () => {
			const { waitForRegistry } = render( <AudienceSelectionPanel />, {
				registry,
			} );

			await waitForRegistry();

			const report = registry
				.select( MODULES_ANALYTICS_4 )
				.getReport( reportOptions );

			document
				.querySelectorAll(
					'.googlesitekit-audience-selection-panel .googlesitekit-selection-panel-item'
				)
				?.forEach( ( item ) => {
					const audienceName = item?.querySelector(
						'input[type="checkbox"]'
					)?.value;

					const rowIndex = report?.rows?.findIndex(
						( row ) =>
							row?.dimensionValues?.[ 0 ]?.value === audienceName
					);

					const userCountInReport =
						report?.rows?.[ rowIndex ]?.metricValues?.[ 0 ]
							?.value || 0;

					const userCountInDOM = item?.querySelector(
						'.googlesitekit-selection-panel-item__suffix'
					);

					if ( !! userCountInReport ) {
						expect( userCountInDOM ).toHaveTextContent(
							userCountInReport
						);
					} else {
						expect( userCountInDOM ).not.toBeInTheDocument();
					}
				} );
		} );

		it.each( [
			[ [ 'new-visitors' ] ],
			[ [ 'returning-visitors' ] ],
			[ [ 'new-visitors', 'returning-visitors' ] ],
		] )(
			'should use the `newVsReturning` dimension when retrieving user counts for Site Kit-created audiences when the following audiences are in the partial data state: %s',
			async ( siteKitAudienceSlugs ) => {
				const newVisitorsAudience = availableAudiences[ 2 ];
				const returningVisitorsAudience = availableAudiences[ 3 ];

				const otherAudiences = availableAudiences.filter(
					( { name } ) =>
						! [
							newVisitorsAudience.name,
							returningVisitorsAudience.name,
						].includes( name )
				);

				const referenceDate = registry
					.select( CORE_USER )
					.getReferenceDate();

				// Simulate partial data state for the given audiences.
				siteKitAudienceSlugs.forEach( ( slug ) => {
					const audience = availableAudiences.find(
						( { audienceSlug } ) => audienceSlug === slug
					);

					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.setResourceDataAvailabilityDate(
							audience.name,
							'audience',
							Number( referenceDate.replace( /-/g, '' ) )
						);
				} );

				const newVsReturningReportOptions = {
					...baseReportOptions,
					dimensions: [ { name: 'newVsReturning' } ],
				};

				const audienceResourceNameReportOptions = {
					...baseReportOptions,
					dimensions: [ { name: 'audienceResourceName' } ],
					dimensionFilters: {
						audienceResourceName: otherAudiences.map(
							( { name } ) => name
						),
					},
				};

				provideAnalytics4MockReport(
					registry,
					newVsReturningReportOptions
				);

				provideAnalytics4MockReport(
					registry,
					audienceResourceNameReportOptions
				);

				const { waitForRegistry } = render(
					<AudienceSelectionPanel />,
					{
						registry,
					}
				);

				await waitForRegistry();

				const newVsReturningReport = registry
					.select( MODULES_ANALYTICS_4 )
					.getReport( newVsReturningReportOptions );

				const audienceResourceNameReport = registry
					.select( MODULES_ANALYTICS_4 )
					.getReport( audienceResourceNameReportOptions );

				function findAudienceRow( rows, dimensionValue ) {
					return rows.find(
						( row ) =>
							row?.dimensionValues?.[ 0 ]?.value ===
							dimensionValue
					);
				}

				document
					.querySelectorAll(
						'.googlesitekit-audience-selection-panel .googlesitekit-selection-panel-item'
					)
					?.forEach( ( item ) => {
						const audienceName = item?.querySelector(
							'input[type="checkbox"]'
						)?.value;

						let audienceRow;

						if ( audienceName === newVisitorsAudience.name ) {
							audienceRow = findAudienceRow(
								newVsReturningReport.rows,
								'new'
							);
						} else if (
							audienceName === returningVisitorsAudience.name
						) {
							audienceRow = findAudienceRow(
								newVsReturningReport.rows,
								'returning'
							);
						} else {
							audienceRow = findAudienceRow(
								audienceResourceNameReport.rows,
								audienceName
							);
						}

						const userCountInReport =
							audienceRow?.metricValues?.[ 0 ]?.value || 0;

						const userCountInDOM = item?.querySelector(
							'.googlesitekit-selection-panel-item__suffix'
						);

						if ( !! userCountInReport ) {
							expect( userCountInDOM ).toHaveTextContent(
								userCountInReport
							);
						} else {
							expect( userCountInDOM ).not.toBeInTheDocument();
						}
					} );
			}
		);

		it( 'should display a "dash" instead of the user count if retrieval fails', async () => {
			const error = {
				code: 'test_error',
				message: 'Error message.',
				data: {},
			};

			provideModules( registry );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveError( error, 'getReport', [ reportOptions ] );

			const { waitForRegistry } = render( <AudienceSelectionPanel />, {
				registry,
			} );

			await waitForRegistry();

			document
				.querySelectorAll(
					'.googlesitekit-audience-selection-panel .googlesitekit-selection-panel-item'
				)
				?.forEach( ( item ) => {
					const userCountInDOM = item?.querySelector(
						'.googlesitekit-selection-panel-item__suffix'
					);

					expect( userCountInDOM ).toHaveTextContent( '-' );
				} );
		} );

		it( 'should include audience source for each audience', async () => {
			const { waitForRegistry } = render( <AudienceSelectionPanel />, {
				registry,
			} );

			await waitForRegistry();

			document
				.querySelectorAll(
					'.googlesitekit-audience-selection-panel .googlesitekit-selection-panel-item'
				)
				?.forEach( ( item ) => {
					const audienceName = item?.querySelector(
						'input[type="checkbox"]'
					)?.value;

					const audienceType = availableAudiences.find(
						( { name } ) => name === audienceName
					)?.audienceType;

					const sourceInDOM = item?.querySelector(
						'.mdc-checkbox__description'
					);

					switch ( audienceType ) {
						case 'DEFAULT_AUDIENCE':
							expect( sourceInDOM ).toHaveTextContent(
								'Created by default by Google Analytics'
							);
							break;
						case 'SITE_KIT_AUDIENCE':
							expect( sourceInDOM ).toHaveTextContent(
								'Created by Site Kit'
							);
							break;
						case 'USER_AUDIENCE':
							expect( sourceInDOM ).toHaveTextContent(
								'Already exists in your Analytics property'
							);
							break;
					}
				} );
		} );

		it( 'should show a "New" badge for non-default audiences if the badges have not been seen yet', async () => {
			const { waitForRegistry } = render( <AudienceSelectionPanel />, {
				registry,
			} );

			await waitForRegistry();

			document
				.querySelectorAll(
					'.googlesitekit-audience-selection-panel .googlesitekit-selection-panel-item'
				)
				?.forEach( ( item ) => {
					const audienceName = item?.querySelector(
						'input[type="checkbox"]'
					)?.value;

					const audienceType = availableAudiences.find(
						( { name } ) => name === audienceName
					)?.audienceType;

					const sourceInDOM = item?.querySelector(
						'.googlesitekit-new-badge'
					);

					if ( audienceType === 'DEFAULT_AUDIENCE' ) {
						expect( sourceInDOM ).not.toBeInTheDocument();
					} else {
						expect( sourceInDOM ).toBeInTheDocument();
					}
				} );
		} );

		it( 'should show a "New" badge for non-default audiences if the badges have been seen and they are still active', async () => {
			const currentTimeInSeconds = Math.floor( Date.now() / 1000 );

			registry.dispatch( CORE_USER ).receiveGetExpirableItems(
				availableAudiences
					.filter(
						( { audienceType } ) =>
							audienceType !== 'DEFAULT_AUDIENCE'
					)
					.reduce(
						( acc, { name } ) => ( {
							...acc,
							[ `${ AUDIENCE_ITEM_NEW_BADGE_SLUG_PREFIX }${ name }` ]:
								currentTimeInSeconds + 100,
						} ),
						{}
					)
			);

			const { waitForRegistry } = render( <AudienceSelectionPanel />, {
				registry,
			} );

			await waitForRegistry();

			document
				.querySelectorAll(
					'.googlesitekit-audience-selection-panel .googlesitekit-selection-panel-item'
				)
				?.forEach( ( item ) => {
					const audienceName = item?.querySelector(
						'input[type="checkbox"]'
					)?.value;

					const audienceType = availableAudiences.find(
						( { name } ) => name === audienceName
					)?.audienceType;

					const sourceInDOM = item?.querySelector(
						'.googlesitekit-new-badge'
					);

					if ( audienceType === 'DEFAULT_AUDIENCE' ) {
						expect( sourceInDOM ).not.toBeInTheDocument();
					} else {
						expect( sourceInDOM ).toBeInTheDocument();
					}
				} );
		} );

		it( 'should show a "Temporarily hidden" badge for temporarily hidden audiences', async () => {
			const temporarilyHiddenAudiences = [
				'properties/12345/audiences/3',
			];

			registry
				.dispatch( CORE_USER )
				.receiveGetDismissedItems( [
					'audience-tile-properties/12345/audiences/3',
				] );

			const { waitForRegistry } = render( <AudienceSelectionPanel />, {
				registry,
			} );

			await waitForRegistry();

			document
				.querySelectorAll(
					'.googlesitekit-audience-selection-panel .googlesitekit-selection-panel-item'
				)
				?.forEach( ( item ) => {
					const audienceName = item?.querySelector(
						'input[type="checkbox"]'
					)?.value;

					const sourceInDOM = item?.querySelector(
						'.googlesitekit-badge-with-tooltip'
					);

					if (
						! temporarilyHiddenAudiences.includes( audienceName )
					) {
						expect( sourceInDOM ).not.toBeInTheDocument();
					} else {
						expect( sourceInDOM ).toBeInTheDocument();
					}
				} );
		} );

		it( 'should show a "Temporarily hidden" badge taking precedence over the "New" badge', async () => {
			const currentTimeInSeconds = Math.floor( Date.now() / 1000 );

			registry.dispatch( CORE_USER ).receiveGetExpirableItems(
				availableAudiences
					.filter(
						( { audienceType } ) =>
							audienceType !== 'DEFAULT_AUDIENCE'
					)
					.reduce(
						( acc, { name } ) => ( {
							...acc,
							[ `${ AUDIENCE_ITEM_NEW_BADGE_SLUG_PREFIX }${ name }` ]:
								currentTimeInSeconds + WEEK_IN_SECONDS,
						} ),
						{}
					)
			);

			registry
				.dispatch( CORE_USER )
				.receiveGetDismissedItems( [
					'audience-tile-properties/12345/audiences/3',
				] );

			const { container, waitForRegistry } = render(
				<AudienceSelectionPanel />,
				{
					registry,
				}
			);

			await waitForRegistry();

			container
				.querySelectorAll(
					'.googlesitekit-audience-selection-panel .googlesitekit-selection-panel-item'
				)
				?.forEach( ( item ) => {
					const audienceName = item?.querySelector(
						'input[type="checkbox"]'
					)?.value;

					const temporarilyHiddenBadgeSourceInDOM =
						item?.querySelector(
							'.googlesitekit-badge-with-tooltip'
						);

					const newBadgeSourceInDOM = item?.querySelector(
						'.googlesitekit-new-badge'
					);

					if ( audienceName === 'properties/12345/audiences/3' ) {
						expect( item ).toContainElement(
							temporarilyHiddenBadgeSourceInDOM
						);

						expect( item ).not.toContainElement(
							newBadgeSourceInDOM
						);
					} else {
						expect( item ).not.toContainElement(
							temporarilyHiddenBadgeSourceInDOM
						);
						expect( item ).toContainElement( newBadgeSourceInDOM );
					}
				} );
		} );

		it( 'should clear the "Temporarily hidden" badge for the first configured audience if all audiences are hidden when saving the selection', async () => {
			fetchMock.postOnce( syncAvailableAudiencesEndpoint, {
				body: availableAudiences,
				status: 200,
			} );

			registry
				.dispatch( CORE_UI )
				.setValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY, true );

			registry
				.dispatch( CORE_USER )
				.setConfiguredAudiences( [
					'properties/12345/audiences/1',
					'properties/12345/audiences/2',
					'properties/12345/audiences/5',
				] );

			const temporarilyHiddenAudiences = [
				'properties/12345/audiences/1',
				'properties/12345/audiences/5',
			];

			registry
				.dispatch( CORE_USER )
				.receiveGetDismissedItems( [
					'audience-tile-properties/12345/audiences/1',
					'audience-tile-properties/12345/audiences/5',
				] );

			const { getByRole, waitForRegistry } = render(
				<AudienceSelectionPanel />,
				{
					registry,
				}
			);

			await waitForRegistry();

			function assertExpectedTemporarilyHiddenBadges( hiddenAudiences ) {
				const selectionPanelItems = document.querySelectorAll(
					'.googlesitekit-audience-selection-panel .googlesitekit-selection-panel-item'
				);

				expect( selectionPanelItems ).toHaveLength( 5 );

				selectionPanelItems.forEach( ( item ) => {
					const audienceName = item.querySelector(
						'input[type="checkbox"]'
					).value;

					if ( hiddenAudiences.includes( audienceName ) ) {
						expect(
							domGetByText( item, 'Temporarily hidden' )
						).toBeInTheDocument();
					} else {
						expect(
							domQueryByText( item, 'Temporarily hidden' )
						).not.toBeInTheDocument();
					}
				} );
			}

			// Verify there are "Temporarily hidden" badges for the hidden audiences.
			assertExpectedTemporarilyHiddenBadges( temporarilyHiddenAudiences );

			act( () => {
				fireEvent.click(
					document.querySelector(
						'input[type="checkbox"][value="properties/12345/audiences/2"]'
					)
				);
			} );

			fetchMock.postOnce( audienceSettingsEndpoint, ( url, opts ) => {
				const { data } = JSON.parse( opts.body );
				// Return the same settings passed to the API.
				return { body: data, status: 200 };
			} );

			fetchMock.postOnce(
				dismissedItemsEndpoint,
				{
					body: [ 'audience-tile-properties/12345/audiences/5' ],
				},
				{
					headers: {
						// The @wordpress/api-fetch middleware uses this header to tunnel DELETE requests via POST.
						// See https://github.com/WordPress/gutenberg/blob/8e06f0d212f89adba9099106497117819adefc5a/packages/api-fetch/src/middlewares/http-v1.js#L36
						'X-HTTP-Method-Override': 'DELETE',
					},
				}
			);

			// Save the settings.
			await act( async () => {
				fireEvent.click(
					getByRole( 'button', { name: 'Apply changes' } )
				);

				await waitForDefaultTimeouts();
			} );

			// Verify the dismissed item for the first configured audience is cleared.
			expect( fetchMock ).toHaveFetched(
				dismissedItemsEndpoint,
				{
					body: {
						data: {
							slugs: [
								'audience-tile-properties/12345/audiences/1',
							],
						},
					},
				},
				{
					headers: {
						'X-HTTP-Method-Override': 'DELETE',
					},
				}
			);

			// Verify there is a "Temporarily hidden" badge for the remaining hidden audience.
			assertExpectedTemporarilyHiddenBadges( [
				'properties/12345/audiences/5',
			] );
		} );

		it( 'should not show "New" badges if they have expired', async () => {
			const currentTimeInSeconds = Math.floor( Date.now() / 1000 );

			registry.dispatch( CORE_USER ).receiveGetExpirableItems(
				availableAudiences
					.filter(
						( { audienceType } ) =>
							audienceType !== 'DEFAULT_AUDIENCE'
					)
					.reduce(
						( acc, { name } ) => ( {
							...acc,
							[ `${ AUDIENCE_ITEM_NEW_BADGE_SLUG_PREFIX }${ name }` ]:
								currentTimeInSeconds - 100,
						} ),
						{}
					)
			);

			const { waitForRegistry } = render( <AudienceSelectionPanel />, {
				registry,
			} );

			await waitForRegistry();

			document
				.querySelectorAll(
					'.googlesitekit-audience-selection-panel .googlesitekit-selection-panel-item'
				)
				?.forEach( ( item ) => {
					const sourceInDOM = item?.querySelector(
						'.googlesitekit-new-badge'
					);

					expect( sourceInDOM ).not.toBeInTheDocument();
				} );
		} );

		it( 'should make a request to set an expiry for "New" badges as soon as they are visibile', async () => {
			fetchMock.postOnce(
				expirableItemEndpoint,
				{
					body: availableAudiences
						.filter(
							( { audienceType } ) =>
								audienceType !== 'DEFAULT_AUDIENCE'
						)
						.map( ( { name } ) => ( {
							[ `${ AUDIENCE_ITEM_NEW_BADGE_SLUG_PREFIX }${ name }` ]:
								WEEK_IN_SECONDS * 4,
						} ) ),
				},
				{
					overwriteRoutes: true,
				}
			);

			fetchMock.postOnce( syncAvailableAudiencesEndpoint, {
				body: availableAudiences,
				status: 200,
			} );

			// The request is made when the panel is opened.
			registry
				.dispatch( CORE_UI )
				.setValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY, true );

			const { waitForRegistry } = render( <AudienceSelectionPanel />, {
				registry,
			} );

			await waitForRegistry();

			expect( fetchMock ).toHaveFetchedTimes( 1, expirableItemEndpoint );
		} );
	} );

	describe( 'AddGroupNotice', () => {
		it( 'should display notice when there is a saved selection of one group', async () => {
			const selectedAudiences = [ 'properties/12345/audiences/3' ];
			registry
				.dispatch( CORE_USER )
				.setConfiguredAudiences( selectedAudiences );

			registry
				.dispatch( CORE_FORMS )
				.setValues( AUDIENCE_SELECTION_FORM, {
					[ AUDIENCE_SELECTED ]: selectedAudiences,
					[ AUDIENCE_SELECTION_CHANGED ]: true,
				} );

			const { getByText, waitForRegistry } = render(
				<AudienceSelectionPanel />,
				{
					registry,
				}
			);

			await waitForRegistry();

			expect(
				getByText(
					/By adding another group to your dashboard, you will be able to compare them and understand which content brings back users from each group/i
				)
			).toBeInTheDocument();
		} );

		it.each( [
			[ 'less', [] ],
			[ 'more', configuredAudiences ],
		] )(
			'should not display notice when there is a saved selection of %s than one group',
			async ( _, audiences ) => {
				registry
					.dispatch( CORE_USER )
					.setConfiguredAudiences( audiences );

				const { queryByText, waitForRegistry } = render(
					<AudienceSelectionPanel />,
					{
						registry,
					}
				);

				await waitForRegistry();

				expect(
					queryByText(
						/By adding another group to your dashboard, you will be able to compare them and understand which content brings back users from each group/i
					)
				).not.toBeInTheDocument();
			}
		);

		it( 'should not display notice when the selection changes', async () => {
			registry
				.dispatch( CORE_USER )
				.setConfiguredAudiences( [ 'properties/12345/audiences/3' ] );

			registry
				.dispatch( CORE_FORMS )
				.setValues( AUDIENCE_SELECTION_FORM, {
					[ AUDIENCE_SELECTED ]: configuredAudiences,
					[ AUDIENCE_SELECTION_CHANGED ]: true,
				} );

			const { queryByText, waitForRegistry } = render(
				<AudienceSelectionPanel />,
				{
					registry,
				}
			);

			await waitForRegistry();

			expect(
				queryByText(
					/By adding another group to your dashboard, you will be able to compare them and understand which content brings back users from each group/i
				)
			).not.toBeInTheDocument();
		} );

		it( 'should not display notice when dismissed', async () => {
			registry
				.dispatch( CORE_USER )
				.setConfiguredAudiences( [ 'properties/12345/audiences/3' ] );

			registry
				.dispatch( CORE_USER )
				.receiveGetDismissedItems( [ AUDIENCE_ADD_GROUP_NOTICE_SLUG ] );

			const { queryByText, waitForRegistry } = render(
				<AudienceSelectionPanel />,
				{
					registry,
				}
			);

			await waitForRegistry();

			expect(
				queryByText(
					/By adding another group to your dashboard, you will be able to compare them and understand which content brings back users from each group/i
				)
			).not.toBeInTheDocument();
		} );
	} );

	describe( 'AudienceCreationNotice / AudienceCreationSuccess', () => {
		it( 'should display an audience creation notice with both audiences', async () => {
			const nonSiteKitAvailableAudiences = availableAudiences.filter(
				( { audienceType } ) => audienceType !== 'SITE_KIT_AUDIENCE'
			);

			const nonSiteKitConfiguredAudiences =
				nonSiteKitAvailableAudiences.map( ( { name } ) => name );

			const nonSiteKitReportOptions = {
				...reportOptions,
				dimensionFilters: {
					audienceResourceName: nonSiteKitConfiguredAudiences,
				},
			};

			registry
				.dispatch( CORE_UI )
				.setValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY, true );

			fetchMock.postOnce( syncAvailableAudiencesEndpoint, {
				body: nonSiteKitAvailableAudiences,
				status: 200,
			} );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setAvailableAudiences( nonSiteKitAvailableAudiences );

			registry
				.dispatch( CORE_USER )
				.setConfiguredAudiences( nonSiteKitConfiguredAudiences );

			provideAnalytics4MockReport( registry, nonSiteKitReportOptions );

			const { getByText, queryByText, waitForRegistry } = render(
				<AudienceSelectionPanel />,
				{
					registry,
				}
			);

			await waitForRegistry();

			expect(
				getByText( /Create groups suggested by Site Kit/i )
			).toBeInTheDocument();
			document
				.querySelectorAll(
					'.googlesitekit-audience-selection-panel__audience-creation-notice-audience .googlesitekit-audience-selection-panel__audience-creation-notice-audience-details h3'
				)
				?.forEach( ( element, index ) => {
					expect( element ).toHaveTextContent(
						index === 0 ? 'New visitors' : 'Returning visitors'
					);
				} );

			// Verify the edit scope notice is not displayed.
			expect(
				queryByText(
					/Creating these groups require more data tracking. You will be directed to update your Analytics property./i
				)
			).not.toBeInTheDocument();
		} );

		it( 'should display the audience creation notice with the missing scope notice', async () => {
			const nonSiteKitAvailableAudiences = availableAudiences.filter(
				( { audienceType } ) => audienceType !== 'SITE_KIT_AUDIENCE'
			);

			const nonSiteKitConfiguredAudiences =
				nonSiteKitAvailableAudiences.map( ( { name } ) => name );

			const nonSiteKitReportOptions = {
				...reportOptions,
				dimensionFilters: {
					audienceResourceName: nonSiteKitConfiguredAudiences,
				},
			};

			provideUserAuthentication( registry, {
				grantedScopes: [],
			} );

			registry
				.dispatch( CORE_UI )
				.setValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY, true );

			fetchMock.postOnce( syncAvailableAudiencesEndpoint, {
				body: nonSiteKitAvailableAudiences,
				status: 200,
			} );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setAvailableAudiences( nonSiteKitAvailableAudiences );

			registry
				.dispatch( CORE_USER )
				.setConfiguredAudiences( nonSiteKitConfiguredAudiences );

			provideAnalytics4MockReport( registry, nonSiteKitReportOptions );

			const { getByText, waitForRegistry } = render(
				<AudienceSelectionPanel />,
				{
					registry,
				}
			);

			await waitForRegistry();

			expect(
				getByText( /Create groups suggested by Site Kit/i )
			).toBeInTheDocument();

			// Verify the edit scope notice is displayed.
			expect(
				getByText(
					/Creating these groups require more data tracking. You will be directed to update your Analytics property./i
				)
			).toBeInTheDocument();
		} );

		it( 'should display an audience creation notice for a single audience', async () => {
			const mixedConfiguredAudiences = [
				'properties/12345/audiences/1',
				'properties/12345/audiences/2',
				'properties/12345/audiences/3', // New visitors Site Kit audience.
			];

			const mixedSiteKitReportOptions = {
				...reportOptions,
				dimensionFilters: {
					audienceResourceName: mixedConfiguredAudiences,
				},
			};

			const filteredAudiences = availableAudiences.filter( ( { name } ) =>
				mixedConfiguredAudiences.includes( name )
			);

			fetchMock.post( syncAvailableAudiencesEndpoint, {
				status: 200,
				body: filteredAudiences,
			} );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setAvailableAudiences( filteredAudiences );

			registry
				.dispatch( CORE_USER )
				.setConfiguredAudiences( mixedConfiguredAudiences );

			registry
				.dispatch( CORE_UI )
				.setValue( AUDIENCE_CREATION_SUCCESS_NOTICE_SLUG, true );

			registry
				.dispatch( CORE_UI )
				.setValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY, true );

			provideAnalytics4MockReport( registry, mixedSiteKitReportOptions );

			const { getByText, queryByText, waitForRegistry } = render(
				<AudienceSelectionPanel />,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			await waitForRegistry();

			expect(
				getByText( /Visitor group created successfully/i )
			).toBeInTheDocument();
			expect(
				getByText( /Create groups suggested by Site Kit/i )
			).toBeInTheDocument();
			expect(
				document.querySelector(
					'.googlesitekit-audience-selection-panel__audience-creation-notice-audience  .googlesitekit-audience-selection-panel__audience-creation-notice-audience-details h3'
				)
			).toHaveTextContent( 'Returning visitors' );
			// New visitors should now be showed in the list of configured audiences checkboxes.
			expect(
				document.querySelectorAll(
					'.googlesitekit-selection-panel-item .mdc-checkbox__content label'
				)[ 2 ]
			).toHaveTextContent( 'New visitors' );

			// Verify the edit scope notice is not displayed.
			expect(
				queryByText(
					/Creating these groups require more data tracking. You will be directed to update your Analytics property./i
				)
			).not.toBeInTheDocument();

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_audiences-sidebar-create-audiences-success`,
				'view_notification'
			);
		} );

		it( 'should display an audience creation success notice when both audiences are created', async () => {
			const mixedConfiguredAudiences = [
				'properties/12345/audiences/1',
				'properties/12345/audiences/2',
				'properties/12345/audiences/3', // New visitors Site Kit audience.
				'properties/12345/audiences/4', // Returning visitors Site Kit audience.
			];

			const mixedSiteKitReportOptions = {
				...reportOptions,
				dimensionFilters: {
					audienceResourceName: mixedConfiguredAudiences,
				},
			};

			const filteredAudiences = availableAudiences.filter( ( { name } ) =>
				mixedConfiguredAudiences.includes( name )
			);

			fetchMock.post( syncAvailableAudiencesEndpoint, {
				status: 200,
				body: filteredAudiences,
			} );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setAvailableAudiences( filteredAudiences );

			registry
				.dispatch( CORE_USER )
				.setConfiguredAudiences( mixedConfiguredAudiences );

			registry
				.dispatch( CORE_UI )
				.setValue( AUDIENCE_CREATION_SUCCESS_NOTICE_SLUG, true );

			registry
				.dispatch( CORE_UI )
				.setValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY, true );

			provideAnalytics4MockReport( registry, mixedSiteKitReportOptions );

			const { getByText, waitForRegistry } = render(
				<AudienceSelectionPanel />,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			await waitForRegistry();

			expect(
				getByText( /Visitor group created successfully/i )
			).toBeInTheDocument();
			// New visitors and Returning visitors should now be showed in the list of configured audiences checkboxes.
			expect(
				document.querySelectorAll(
					'.googlesitekit-selection-panel-item .mdc-checkbox__content label'
				)[ 2 ]
			).toHaveTextContent( 'New visitors' );
			expect(
				document.querySelectorAll(
					'.googlesitekit-selection-panel-item .mdc-checkbox__content label'
				)[ 3 ]
			).toHaveTextContent( 'Returning visitors' );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_audiences-sidebar-create-audiences-success`,
				'view_notification'
			);
		} );

		it( 'should track an event when the success notice is dismissed', async () => {
			const mixedConfiguredAudiences = [
				'properties/12345/audiences/1',
				'properties/12345/audiences/2',
				'properties/12345/audiences/3', // New visitors Site Kit audience.
			];

			const mixedSiteKitReportOptions = {
				...reportOptions,
				dimensionFilters: {
					audienceResourceName: mixedConfiguredAudiences,
				},
			};

			const filteredAudiences = availableAudiences.filter( ( { name } ) =>
				mixedConfiguredAudiences.includes( name )
			);

			fetchMock.post( syncAvailableAudiencesEndpoint, {
				status: 200,
				body: filteredAudiences,
			} );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setAvailableAudiences( filteredAudiences );

			registry
				.dispatch( CORE_USER )
				.setConfiguredAudiences( mixedConfiguredAudiences );

			registry
				.dispatch( CORE_UI )
				.setValue( AUDIENCE_CREATION_SUCCESS_NOTICE_SLUG, true );

			registry
				.dispatch( CORE_UI )
				.setValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY, true );

			provideAnalytics4MockReport( registry, mixedSiteKitReportOptions );

			const { getByRole, waitForRegistry } = render(
				<AudienceSelectionPanel />,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			await waitForRegistry();

			const dismissButton = getByRole( 'button', { name: /got it/i } );

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click( dismissButton );
			} );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_audiences-sidebar-create-audiences-success`,
				'view_notification'
			);
		} );

		describe( 'AudienceCreationErrorNotice', () => {
			const createAudienceEndpoint = new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/create-audience'
			);

			const nonSiteKitAvailableAudiences = availableAudiences.filter(
				( { audienceType } ) => audienceType !== 'SITE_KIT_AUDIENCE'
			);

			beforeEach( () => {
				const nonSiteKitConfiguredAudiences =
					nonSiteKitAvailableAudiences.map( ( { name } ) => name );

				const nonSiteKitReportOptions = {
					...reportOptions,
					dimensionFilters: {
						audienceResourceName: nonSiteKitConfiguredAudiences,
					},
				};

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setAvailableAudiences( nonSiteKitAvailableAudiences );

				registry
					.dispatch( CORE_USER )
					.setConfiguredAudiences( nonSiteKitConfiguredAudiences );

				provideAnalytics4MockReport(
					registry,
					nonSiteKitReportOptions
				);

				fetchMock.post( syncAvailableAudiencesEndpoint, {
					status: 200,
					body: nonSiteKitAvailableAudiences,
				} );

				registry
					.dispatch( CORE_UI )
					.setValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY, true );

				registry.dispatch( CORE_USER ).receiveGetExpirableItems(
					availableAudiences
						.filter(
							( { audienceType } ) =>
								audienceType !== 'DEFAULT_AUDIENCE'
						)
						.reduce(
							( acc, { name } ) => ( {
								...acc,
								[ `${ AUDIENCE_ITEM_NEW_BADGE_SLUG_PREFIX }${ name }` ]:
									Math.floor( Date.now() / 1000 ) - 100,
							} ),
							{}
						)
				);
			} );

			it( 'should display an audience creation notice with an OAuth error notice', async () => {
				provideSiteInfo( registry, {
					setupErrorCode: 'access_denied',
				} );

				provideUserAuthentication( registry, {
					grantedScopes: [],
				} );

				registry
					.dispatch( CORE_FORMS )
					.setValues( AUDIENCE_CREATION_FORM, {
						autoSubmit: true,
					} );

				const { getByText, getByRole, waitForRegistry } = render(
					<AudienceSelectionPanel />,
					{
						registry,
						viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
					}
				);

				await waitForRegistry();

				expect(
					getByText( /Create groups suggested by Site Kit/i )
				).toBeInTheDocument();
				document
					.querySelectorAll(
						'.googlesitekit-audience-selection-panel__audience-creation-notice-audience .googlesitekit-audience-selection-panel__audience-creation-notice-audience-details h3'
					)
					?.forEach( ( element, index ) => {
						expect( element ).toHaveTextContent(
							index === 0 ? 'New visitors' : 'Returning visitors'
						);
					} );

				expect(
					getByText(
						/Setup was interrupted because you didn’t grant the necessary permissions. Click on Create again to retry. If that doesn’t work/i
					)
				).toBeInTheDocument();

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

				expect( mockTrackEvent ).toHaveBeenCalledWith(
					`${ VIEW_CONTEXT_MAIN_DASHBOARD }_audiences-sidebar-create-audiences`,
					'auth_error'
				);
			} );

			it( 'should display an audience creation notice with an insufficient permissions error', async () => {
				const errorResponse = {
					code: 'test_error',
					message: 'Error message.',
					data: { reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS },
				};

				fetchMock.post( createAudienceEndpoint, {
					body: errorResponse,
					status: 500,
				} );

				const { getByText, getAllByText, waitForRegistry } = render(
					<AudienceSelectionPanel />,
					{
						registry,
						viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
					}
				);

				await waitForRegistry();

				const createButton = getAllByText( 'Create' )[ 0 ];

				expect( createButton ).toBeInTheDocument();

				act( () => {
					fireEvent.click( createButton );
				} );

				// Verify the error is "Insufficient permissions" variant.
				await waitFor( () => {
					expect(
						getByText( /Insufficient permissions/i )
					).toBeInTheDocument();

					expect( getByText( /get help/i ) ).toBeInTheDocument();

					expect(
						getByText( /request access/i )
					).toBeInTheDocument();
				} );

				await act( () => waitForTimeouts( 30 ) );

				expect( console ).toHaveErroredWith(
					'Google Site Kit API Error',
					'method:POST',
					'datapoint:create-audience',
					'type:modules',
					'identifier:analytics-4',
					'error:"Error message."'
				);

				expect( mockTrackEvent ).toHaveBeenCalledWith(
					`${ VIEW_CONTEXT_MAIN_DASHBOARD }_audiences-sidebar-create-audiences`,
					'insufficient_permissions_error'
				);
			} );

			it( 'should track an event when the insufficient permissions request access button is clicked', async () => {
				const errorResponse = {
					code: 'test_error',
					message: 'Error message.',
					data: { reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS },
				};

				fetchMock.post( createAudienceEndpoint, {
					body: errorResponse,
					status: 500,
				} );

				const { getByRole, getAllByText, waitForRegistry } = render(
					<AudienceSelectionPanel />,
					{
						registry,
						viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
					}
				);

				await waitForRegistry();

				const createButton = getAllByText( 'Create' )[ 0 ];

				expect( createButton ).toBeInTheDocument();

				act( () => {
					fireEvent.click( createButton );
				} );

				// Verify the error is "Insufficient permissions" variant.
				await waitFor( () => {
					expect(
						getByRole( 'button', { name: /request access/i } )
					).toBeInTheDocument();
				} );

				await act( () => waitForTimeouts( 30 ) );

				expect( console ).toHaveErroredWith(
					'Google Site Kit API Error',
					'method:POST',
					'datapoint:create-audience',
					'type:modules',
					'identifier:analytics-4',
					'error:"Error message."'
				);

				fireEvent.click(
					getByRole( 'button', {
						name: /request access/i,
					} )
				);

				expect( mockTrackEvent ).toHaveBeenCalledWith(
					`${ VIEW_CONTEXT_MAIN_DASHBOARD }_audiences-sidebar-create-audiences`,
					'insufficient_permissions_error_request_access'
				);
			} );

			it( 'should display an audience creation notice with a general error', async () => {
				const errorResponse = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.post( createAudienceEndpoint, {
					body: errorResponse,
					status: 500,
				} );

				const { getByText, getAllByText, waitForRegistry } = render(
					<AudienceSelectionPanel />,
					{
						registry,
						viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
					}
				);

				await waitForRegistry();

				const createButton = getAllByText( 'Create' )[ 0 ];

				expect( createButton ).toBeInTheDocument();

				act( () => {
					fireEvent.click( createButton );
				} );

				// Verify the error is general error variant.
				await waitFor( () => {
					expect(
						getByText( /Analytics update failed/i )
					).toBeInTheDocument();

					expect(
						getByText( /Click on Create to try again./i )
					).toBeInTheDocument();
				} );

				await act( () => waitForTimeouts( 30 ) );

				expect( console ).toHaveErroredWith(
					'Google Site Kit API Error',
					'method:POST',
					'datapoint:create-audience',
					'type:modules',
					'identifier:analytics-4',
					'error:"Internal server error"'
				);

				expect( mockTrackEvent ).toHaveBeenCalledWith(
					`${ VIEW_CONTEXT_MAIN_DASHBOARD }_audiences-sidebar-create-audiences`,
					'setup_error'
				);
			} );
		} );
	} );

	describe( 'LearnMoreLink', () => {
		it( 'should display a learn more link', async () => {
			const { getByText, waitForRegistry } = render(
				<AudienceSelectionPanel />,
				{
					registry,
				}
			);

			await waitForRegistry();

			expect(
				getByText(
					/Learn more about grouping site visitors and audiences in/i
				)
			).toBeInTheDocument();
		} );
	} );

	describe( 'ErrorNotice', () => {
		it( 'should not display an error notice when there are no errors', async () => {
			const { container, waitForRegistry } = render(
				<AudienceSelectionPanel />,
				{
					registry,
				}
			);

			await waitForRegistry();

			expect( container ).not.toHaveTextContent( 'Data loading failed' );
			expect( container ).not.toHaveTextContent(
				'Insufficient permissions, contact your administrator.'
			);
		} );

		describe( 'should display an insufficient permissions error', () => {
			const error = {
				code: 'test_error',
				message: 'Error message.',
				data: { reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS },
			};

			beforeEach( () => {
				provideUserInfo( registry );
				provideModules( registry );
				provideModuleRegistrations( registry );
				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
					accountID: '12345',
					propertyID: '34567',
					measurementID: '56789',
					webDataStreamID: '78901',
				} );
			} );

			afterEach( async () => {
				const { getByText, waitForRegistry } = render(
					<AudienceSelectionPanel />,
					{
						registry,
					}
				);

				await waitForRegistry();

				expect(
					getByText(
						/Insufficient permissions, contact your administrator/i
					)
				).toBeInTheDocument();
				expect( getByText( /get help/i ) ).toBeInTheDocument();
				expect( getByText( /request access/i ) ).toBeInTheDocument();
			} );

			it( 'while resyncing available audiences', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveError( error, 'syncAvailableAudiences', [] );
			} );

			it( 'while retrieving user count', () => {
				registry
					.dispatch( CORE_UI )
					.setValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY, true );

				fetchMock.postOnce( syncAvailableAudiencesEndpoint, {
					body: availableAudiences,
					status: 200,
				} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveError( error, 'getReport', [ reportOptions ] );
			} );
		} );

		describe( 'should display an error message', () => {
			const error = {
				code: 'test_error',
				message: 'Error message.',
				data: {},
			};

			beforeEach( () => {
				provideModules( registry );
				provideModuleRegistrations( registry );
			} );

			afterEach( async () => {
				const { getByText, waitForRegistry } = render(
					<AudienceSelectionPanel />,
					{
						registry,
					}
				);

				await waitForRegistry();

				expect(
					getByText( /Data loading failed/i )
				).toBeInTheDocument();
				expect( getByText( /retry/i ) ).toBeInTheDocument();
			} );

			it( 'while resyncing available audiences', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveError( error, 'syncAvailableAudiences', [] );
			} );

			it( 'while retrieving user count', () => {
				registry
					.dispatch( CORE_UI )
					.setValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY, true );

				fetchMock.postOnce( syncAvailableAudiencesEndpoint, {
					body: availableAudiences,
					status: 200,
				} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveError( error, 'getReport', [ reportOptions ] );
			} );
		} );
	} );

	describe( 'Footer', () => {
		it( 'should show the number of selected audiences', async () => {
			const { waitForRegistry } = render( <AudienceSelectionPanel />, {
				registry,
			} );

			await waitForRegistry();

			expect(
				document.querySelector(
					'.googlesitekit-audience-selection-panel .googlesitekit-selection-panel-footer__item-count'
				)
			).toHaveTextContent( '2 selected (up to 3)' );
		} );

		it( 'should prevent saving when no group is checked', async () => {
			registry
				.dispatch( CORE_FORMS )
				.setValues( AUDIENCE_SELECTION_FORM, {
					[ AUDIENCE_SELECTED ]: [],
				} );

			const { waitForRegistry } = render( <AudienceSelectionPanel />, {
				registry,
			} );

			await waitForRegistry();

			expect(
				document.querySelector(
					'.googlesitekit-audience-selection-panel .googlesitekit-selection-panel-footer .googlesitekit-button-icon--spinner'
				)
			).toBeDisabled();
		} );

		it( 'should display error message when no group is checked', async () => {
			registry
				.dispatch( CORE_UI )
				.setValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY, true );

			fetchMock.postOnce( syncAvailableAudiencesEndpoint, {
				body: availableAudiences,
				status: 200,
			} );

			const { findByLabelText, waitForRegistry } = render(
				<AudienceSelectionPanel />,
				{
					registry,
				}
			);

			await waitForRegistry();

			// De-select the selected groups.
			const newVisitorsCheckbox = await findByLabelText( 'New visitors' );
			fireEvent.click( newVisitorsCheckbox );

			const returningVisitorsCheckbox = await findByLabelText(
				'Returning visitors'
			);
			fireEvent.click( returningVisitorsCheckbox );

			expect(
				document.querySelector(
					'.googlesitekit-audience-selection-panel .googlesitekit-selection-panel-footer .googlesitekit-error-text'
				).textContent
			).toBe( 'Select at least 1 group (0 selected)' );

			// Select a group.
			const checkbox = await findByLabelText( 'All visitors' );
			fireEvent.click( checkbox );

			expect(
				document.querySelector(
					'.googlesitekit-audience-selection-panel .googlesitekit-selection-panel-footer .googlesitekit-error-text'
				)
			).not.toBeInTheDocument();
		} );

		it( 'should track event after saving', async () => {
			fetchMock.postOnce( syncAvailableAudiencesEndpoint, {
				body: availableAudiences,
				status: 200,
			} );

			registry.dispatch( CORE_USER ).receiveGetAudienceSettings( {
				configuredAudiences,
				isAudienceSegmentationWidgetHidden: false,
				didSetAudiences: true,
			} );

			muteFetch( audienceSettingsEndpoint );

			registry
				.dispatch( CORE_UI )
				.setValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY, true );

			const { getByRole, waitForRegistry } = render(
				<AudienceSelectionPanel />,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			await waitForRegistry();

			const saveButton = getByRole( 'button', {
				name: /save selection/i,
			} );

			fireEvent.click( saveButton );

			await waitFor( () => {
				expect( mockTrackEvent ).toHaveBeenCalledWith(
					`${ VIEW_CONTEXT_MAIN_DASHBOARD }_audiences-sidebar`,
					'audiences_sidebar_save',
					'user:0,site-kit:2,default:0'
				);
			} );
		} );

		it( 'should track event if cancelled', async () => {
			fetchMock.postOnce( syncAvailableAudiencesEndpoint, {
				body: availableAudiences,
				status: 200,
			} );

			registry
				.dispatch( CORE_UI )
				.setValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY, true );

			const { getByRole, waitForRegistry } = render(
				<AudienceSelectionPanel />,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			await waitForRegistry();

			const cancelButton = getByRole( 'button', {
				name: /cancel/i,
			} );

			fireEvent.click( cancelButton );

			await waitFor( () => {
				expect( mockTrackEvent ).toHaveBeenCalledWith(
					`${ VIEW_CONTEXT_MAIN_DASHBOARD }_audiences-sidebar`,
					'audiences_sidebar_cancel'
				);
			} );
		} );
	} );
} );
