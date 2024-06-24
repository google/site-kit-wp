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
 * Internal dependencies
 */
import {
	AUDIENCE_ADD_GROUP_NOTICE_SLUG,
	AUDIENCE_SELECTED,
	AUDIENCE_SELECTION_CHANGED,
	AUDIENCE_SELECTION_FORM,
} from './constants';
import { CORE_FORMS } from '../../../../../../googlesitekit/datastore/forms/constants';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import { ERROR_REASON_INSUFFICIENT_PERMISSIONS } from '../../../../../../util/errors';
import { MODULES_ANALYTICS_4 } from '../../../../datastore/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY } from '../../../../../../googlesitekit/constants';
import {
	createTestRegistry,
	provideModuleRegistrations,
	provideModules,
	provideUserAuthentication,
	provideUserInfo,
} from '../../../../../../../../tests/js/utils';
import { provideAnalytics4MockReport } from '../../../../utils/data-mock';
import { fireEvent, render } from '../../../../../../../../tests/js/test-utils';
import { availableAudiences } from './../../../../datastore/__fixtures__';
import AudienceSelectionPanel from '.';

describe( 'AudienceSelectionPanel', () => {
	let registry;

	const baseReportOptions = {
		endDate: '2024-03-27',
		startDate: '2024-02-29',
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

	beforeEach( () => {
		registry = createTestRegistry();

		provideUserAuthentication( registry );

		registry.dispatch( CORE_USER ).setReferenceDate( '2024-03-28' );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAvailableAudiences( availableAudiences );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setConfiguredAudiences( configuredAudiences );

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

		it( 'should display "dash" instead of user count if retrieving it fails', async () => {
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
	} );

	describe( 'AddGroupNotice', () => {
		it( 'should display notice when there is a saved selection of one group', async () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setConfiguredAudiences( [ 'properties/12345/audiences/3' ] );

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
					.dispatch( MODULES_ANALYTICS_4 )
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
				.dispatch( MODULES_ANALYTICS_4 )
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
				.dispatch( MODULES_ANALYTICS_4 )
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

		it.each( [
			[ 'resyncing available audiences', 'syncAvailableAudiences', [] ],
			[ 'retrieving user count', 'getReport', [ reportOptions ] ],
		] )(
			'should display an error notice when there is an insufficient permissions error while %s',
			async ( _, fn, args ) => {
				const error = {
					code: 'test_error',
					message: 'Error message.',
					data: { reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS },
				};

				provideUserInfo( registry, {
					id: 1,
					email: 'admin@example.com',
					name: 'admin',
					picture: 'https://path/to/image',
				} );
				provideModules( registry );
				provideModuleRegistrations( registry );
				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
					accountID: '12345',
					propertyID: '34567',
					measurementID: '56789',
					webDataStreamID: '78901',
				} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveError( error, fn, args );

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
			}
		);

		it.each( [
			[ 'resyncing available audiences', 'syncAvailableAudiences', [] ],
			[ 'retrieving user count', 'getReport', [ reportOptions ] ],
		] )(
			'should display an error notice when %s fails',
			async ( _, fn, args ) => {
				const error = {
					code: 'test_error',
					message: 'Error message.',
					data: {},
				};

				provideModules( registry );
				provideModuleRegistrations( registry );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveError( error, fn, args );

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
			}
		);
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
				.dispatch( CORE_FORMS )
				.setValues( AUDIENCE_SELECTION_FORM, {
					[ AUDIENCE_SELECTED ]: [],
				} );

			const { findByLabelText, waitForRegistry } = render(
				<AudienceSelectionPanel />,
				{
					registry,
				}
			);

			await waitForRegistry();

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
	} );
} );
