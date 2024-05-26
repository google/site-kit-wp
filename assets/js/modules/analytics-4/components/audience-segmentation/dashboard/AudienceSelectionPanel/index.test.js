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
import { AUDIENCE_SELECTED, AUDIENCE_SELECTION_FORM } from './constants';
import { CORE_FORMS } from '../../../../../../googlesitekit/datastore/forms/constants';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../../../datastore/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY } from '../../../../../../googlesitekit/constants';
import {
	createTestRegistry,
	provideUserAuthentication,
} from '../../../../../../../../tests/js/utils';
import { provideAnalytics4MockReport } from '../../../../utils/data-mock';
import { render } from '../../../../../../../../tests/js/test-utils';
import { availableAudiences } from './../../../../datastore/__fixtures__';
import AudienceSelectionPanel from '.';

describe( 'AudienceSelectionPanel', () => {
	let registry;

	const reportOptions = {
		endDate: '2024-03-27',
		startDate: '2024-02-29',
		dimensions: [ { name: 'audienceResourceName' } ],
		dimensionFilters: {
			audienceResourceName: availableAudiences.map(
				( { name } ) => name
			),
		},
		metrics: [ { name: 'totalUsers' } ],
	};

	const configuredAudiences = [
		'properties/12345/audiences/3',
		'properties/12345/audiences/4',
	];

	beforeEach( () => {
		registry = createTestRegistry();

		provideUserAuthentication( registry );

		registry.dispatch( CORE_USER ).setReferenceDate( '2024-03-28' );

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
						'input[type ="checkbox"]'
					)?.value;

					const rowIndex = report?.rows?.findIndex(
						( row ) =>
							row?.dimensionValues?.[ 0 ]?.value === audienceName
					);

					const userCountInReport =
						report?.rows?.[ rowIndex ]?.metricValues?.[ 0 ]
							?.value || 0;

					const userCountInDOM = item?.querySelector(
						'.googlesitekit-selection-panel-item-suffix'
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
						'input[type ="checkbox"]'
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
								'created by Site Kit'
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
	} );
} );
