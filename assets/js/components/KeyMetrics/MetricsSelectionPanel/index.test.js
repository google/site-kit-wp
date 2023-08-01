/**
 * MetricsSelectionPanel component tests.
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
import MetricsSelectionPanel from '.';
import { render } from '../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	freezeFetch,
	provideKeyMetrics,
	provideModules,
} from '../../../../../tests/js/utils';
import { CORE_UI } from '../../../googlesitekit/datastore/ui/constants';
import {
	KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
	KM_ANALYTICS_LOYAL_VISITORS,
	KM_ANALYTICS_NEW_VISITORS,
	KM_ANALYTICS_POPULAR_CONTENT,
	KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
	KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
} from '../../../googlesitekit/datastore/user/constants';
import { KEY_METRICS_SELECTION_PANEL_OPENED_KEY } from '../constants';
import { KEY_METRICS_WIDGETS } from '../key-metrics-widgets';
import { provideKeyMetricsWidgetRegistrations } from '../test-utils';

describe( 'MetricsSelectionPanel', () => {
	let registry;

	const coreKeyMetricsEndpointRegExp = new RegExp(
		'^/google-site-kit/v1/core/user/data/key-metrics'
	);

	beforeEach( () => {
		registry = createTestRegistry();

		freezeFetch( coreKeyMetricsEndpointRegExp );

		registry
			.dispatch( CORE_UI )
			.setValue( KEY_METRICS_SELECTION_PANEL_OPENED_KEY, true );
	} );

	describe( 'Header', () => {
		it( 'should show the number of selected metrics', () => {
			provideKeyMetrics( registry, {
				widgetSlugs: [ 'metric-a', 'metric-b' ],
			} );

			provideModules( registry, [
				{
					slug: 'analytics-4',
					active: true,
					connected: true,
				},
			] );

			provideKeyMetricsWidgetRegistrations( registry, {
				'metric-a': {
					modules: [ 'search-console' ],
				},
				'metric-b': {
					modules: [ 'analytics-4' ],
				},
			} );

			render( <MetricsSelectionPanel />, { registry } );

			expect(
				document.querySelector(
					'.googlesitekit-km-selection-panel-header'
				)
			).toHaveTextContent( '2 of 4 metrics selected' );
		} );
	} );

	describe( 'Metrics', () => {
		it( 'should only list metrics dependent on connected modules', () => {
			provideKeyMetrics( registry );

			provideModules( registry, [
				{
					slug: 'analytics-4',
					active: false,
					connected: false,
				},
			] );

			provideKeyMetricsWidgetRegistrations( registry, {
				[ KM_SEARCH_CONSOLE_POPULAR_KEYWORDS ]: {
					modules: [ 'search-console' ],
				},
				[ KM_ANALYTICS_LOYAL_VISITORS ]: {
					modules: [ 'analytics-4' ],
				},
			} );

			render( <MetricsSelectionPanel />, { registry } );

			expect(
				document.querySelector(
					'.googlesitekit-km-selection-panel-metrics'
				)
			).not.toHaveTextContent( 'Loyal visitors' );

			expect(
				document.querySelector(
					'.googlesitekit-km-selection-panel-metrics'
				)
			).toHaveTextContent( 'How people find your site' );
		} );

		it( 'should disable unchecked metrics when four metrics are checked', () => {
			const metrics = [
				KM_ANALYTICS_LOYAL_VISITORS,
				KM_ANALYTICS_NEW_VISITORS,
				KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
				KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
				KM_ANALYTICS_POPULAR_CONTENT,
			];

			provideModules( registry, [
				{
					slug: 'analytics-4',
					active: true,
					connected: true,
				},
			] );

			provideKeyMetricsWidgetRegistrations(
				registry,
				metrics.reduce(
					( acc, widget ) => ( {
						...acc,
						[ widget ]: {
							modules: [ 'analytics-4' ],
						},
					} ),
					{}
				)
			);

			// Set the first four metrics as selected.
			provideKeyMetrics( registry, {
				widgetSlugs: metrics.slice( 0, 4 ),
			} );

			const { getByRole } = render( <MetricsSelectionPanel />, {
				registry,
			} );

			// Verify that the fifth metric is disabled.
			expect(
				getByRole( 'checkbox', {
					name: /Most popular content/i,
				} )
			).toBeDisabled();
		} );

		it( 'should order pre-saved metrics to the top', () => {
			const metrics = [
				KM_ANALYTICS_LOYAL_VISITORS,
				KM_ANALYTICS_NEW_VISITORS,
				KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
				KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE,
			];

			provideModules( registry, [
				{
					slug: 'analytics-4',
					active: true,
					connected: true,
				},
			] );

			provideKeyMetricsWidgetRegistrations(
				registry,
				metrics.reduce(
					( acc, widget ) => ( {
						...acc,
						[ widget ]: {
							modules: [ 'analytics-4' ],
						},
					} ),
					{}
				)
			);

			// Set the last metric as selected.
			provideKeyMetrics( registry, {
				widgetSlugs: [ KM_ANALYTICS_TOP_CONVERTING_TRAFFIC_SOURCE ],
			} );

			render( <MetricsSelectionPanel />, { registry } );

			// Verify that the last metric is positioned at the top.
			expect(
				document.querySelector(
					'.googlesitekit-km-selection-panel-metrics__metric-item:first-child label'
				)
			).toHaveTextContent( 'Top converting traffic source' );
		} );
	} );

	describe( 'Footer', () => {
		it( 'should prevent saving when less than two metrics are checked', () => {
			provideKeyMetrics( registry );

			provideModules( registry, [
				{
					slug: 'analytics-4',
					active: true,
					connected: true,
				},
			] );

			provideKeyMetricsWidgetRegistrations(
				registry,
				Object.keys( KEY_METRICS_WIDGETS ).reduce(
					( acc, widget ) => ( {
						...acc,
						[ widget ]: {
							modules: [
								'search-console',
								'analytics-4',
								'adsense',
							],
						},
					} ),
					{}
				)
			);

			render( <MetricsSelectionPanel />, { registry } );

			expect(
				document.querySelector(
					'.googlesitekit-km-selection-panel-footer .googlesitekit-button-icon--spinner'
				)
			).toBeDisabled();
		} );
	} );
} );
