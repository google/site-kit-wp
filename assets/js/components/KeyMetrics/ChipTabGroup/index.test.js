/**
 * Tests for ChipTabGroup component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { fireEvent, render } from '../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	provideKeyMetricsUserInputSettings,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
} from '../../../../../tests/js/utils';
import { enabledFeatures } from '../../../features';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { withConnected } from '../../../googlesitekit/modules/datastore/__fixtures__';
import {
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '../../../modules/analytics-4/datastore/constants';
import { KEY_METRICS_WIDGETS } from '../key-metrics-widgets';
import { provideKeyMetricsWidgetRegistrations } from '../test-utils';
import ChipTabGroup from './';

function ChipTabGroupWrapped( { savedItemSlugs } ) {
	const metricsListReducer = ( acc, metricSlug ) => {
		const {
			title,
			description,
			metadata: { group },
		} = KEY_METRICS_WIDGETS[ metricSlug ];

		return {
			...acc,
			[ metricSlug ]: {
				title,
				description,
				group,
			},
		};
	};
	const allMetricItems = Object.keys( KEY_METRICS_WIDGETS ).reduce(
		metricsListReducer,
		{}
	);

	return (
		<ChipTabGroup
			savedItemSlugs={ savedItemSlugs || [] }
			allMetricItems={ allMetricItems }
		/>
	);
}

describe( 'ChipTabGroup', () => {
	let registry;

	beforeEach( () => {
		enabledFeatures.add( 'conversionReporting' );

		registry = createTestRegistry();

		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		provideKeyMetricsUserInputSettings( registry );
		provideModules( registry, withConnected( 'analytics-4' ) );

		provideKeyMetricsWidgetRegistrations(
			registry,
			Object.keys( KEY_METRICS_WIDGETS ).reduce(
				( acc, widget ) => ( {
					...acc,
					[ widget ]: {
						modules: [ 'analytics-4' ],
					},
				} ),
				{}
			)
		);

		registry.dispatch( CORE_USER ).receiveIsUserInputCompleted( true );

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

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveConversionReportingInlineData( {
				newEvents: [],
				lostEvents: [],
				newBadgeEvents: [],
			} );

		registry.dispatch( MODULES_ANALYTICS_4 ).setDetectedEvents( [] );

		registry.dispatch( CORE_USER ).receiveGetConversionReportingSettings( {
			newEventsCalloutDismissedAt: 0,
			lostEventsCalloutDismissedAt: 0,
		} );
	} );

	describe( 'suggested group', () => {
		it( 'does not show in the groups tab if user input is not completed', async () => {
			registry.dispatch( CORE_USER ).receiveIsUserInputCompleted( false );

			const savedItemSlugs = registry.select( CORE_USER ).getKeyMetrics();
			const { queryByText, waitForRegistry } = render(
				<ChipTabGroupWrapped savedItemSlugs={ savedItemSlugs } />,
				{
					registry,
					features: [ 'conversionReporting' ],
				}
			);

			await waitForRegistry();

			expect( queryByText( /suggested/i ) ).not.toBeInTheDocument();
		} );

		it( 'does show in the groups tab when user input is completed', async () => {
			const savedItemSlugs = registry.select( CORE_USER ).getKeyMetrics();
			const { getByText, waitForRegistry } = render(
				<ChipTabGroupWrapped savedItemSlugs={ savedItemSlugs } />,
				{
					registry,
					features: [ 'conversionReporting' ],
				}
			);

			await waitForRegistry();

			expect( getByText( /suggested/i ) ).toBeInTheDocument();
		} );

		it( 'doesn not include conversion reporting metrics in suggested group if events are not detected', async () => {
			const savedItemSlugs = registry.select( CORE_USER ).getKeyMetrics();
			const { queryByText, getByRole, waitForRegistry } = render(
				<ChipTabGroupWrapped savedItemSlugs={ savedItemSlugs } />,
				{
					registry,
				}
			);

			fireEvent.click( getByRole( 'tab', { name: /suggested/i } ) );

			await waitForRegistry();

			expect(
				queryByText( /top pages driving leads/i )
			).not.toBeInTheDocument();
		} );

		it( 'does include conversion reporting metrics in suggested group if events matching the saved site purpose are detected', async () => {
			// Default includeConversionEvents sertting is empty array.
			// Here we simulate new events being detected afterwards, which will not include
			// conversion reporting metrics to the tailored metrics list automatically.
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.CONTACT ] );

			const savedItemSlugs = registry.select( CORE_USER ).getKeyMetrics();
			const { getByLabelText, getByRole, waitForRegistry } = render(
				<ChipTabGroupWrapped savedItemSlugs={ savedItemSlugs } />,
				{
					registry,
					features: [ 'conversionReporting' ],
				}
			);

			fireEvent.click( getByRole( 'tab', { name: /suggested/i } ) );

			await waitForRegistry();

			const topPagesDrivingLeadsMetrics = getByLabelText(
				/top pages driving leads/i
			);

			expect( topPagesDrivingLeadsMetrics ).toBeInTheDocument();
		} );
	} );
} );
