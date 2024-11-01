/**
 * ChipTabGroup Component Stories.
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
import { useSelect } from 'googlesitekit-data';
import SelectionPanel from '../../SelectionPanel';
import Header from '../MetricsSelectionPanel/Header';
import SelectionPanelItems from '../MetricsSelectionPanel/SelectionPanelItems';
import CustomDimensionsNotice from '../MetricsSelectionPanel/CustomDimensionsNotice';
import Footer from '../MetricsSelectionPanel/Footer';
import WithRegistrySetup from '../../../../../tests/js/WithRegistrySetup';
import {
	provideKeyMetrics,
	provideModules,
	provideUserAuthentication,
} from '../../../../../tests/js/utils';
import { provideKeyMetricsWidgetRegistrations } from '../test-utils';
import { KEY_METRICS_WIDGETS } from '../key-metrics-widgets';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { KEY_METRICS_SELECTED, KEY_METRICS_SELECTION_FORM } from '../constants';
import {
	CORE_USER,
	KM_ANALYTICS_VISIT_LENGTH,
	KM_ANALYTICS_VISITS_PER_VISITOR,
} from '../../../googlesitekit/datastore/user/constants';

function Template() {
	const savedViewableMetrics = useSelect( ( select ) => {
		const metrics = select( CORE_USER ).getKeyMetrics();

		if ( ! Array.isArray( metrics ) ) {
			return [];
		}

		const { isKeyMetricAvailable } = select( CORE_USER );

		return metrics.filter( isKeyMetricAvailable );
	} );

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
		<SelectionPanel isOpen className="googlesitekit-km-selection-panel">
			<Header closePanel={ () => null } />
			<SelectionPanelItems
				savedItemSlugs={ savedViewableMetrics }
				allMetricItems={ allMetricItems }
			/>
			<CustomDimensionsNotice />
			<Footer
				isOpen
				closePanel={ () => null }
				savedMetrics={ savedViewableMetrics }
				onNavigationToOAuthURL={ () => null }
			/>
		</SelectionPanel>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {
	label: 'Components/KeyMetrics/ChipTabGroup/default',
};

export default {
	title: 'Key Metrics/ChipTabGroup',
	component: SelectionPanel,
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideUserAuthentication( registry );

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
								modules: [ 'search-console', 'analytics-4' ],
							},
						} ),
						{}
					)
				);

				const savedKeyMetrics = [
					KM_ANALYTICS_VISITS_PER_VISITOR,
					KM_ANALYTICS_VISIT_LENGTH,
				];

				provideKeyMetrics( registry, { widgetSlugs: savedKeyMetrics } );

				registry
					.dispatch( CORE_FORMS )
					.setValues( KEY_METRICS_SELECTION_FORM, {
						[ KEY_METRICS_SELECTED ]: savedKeyMetrics,
					} );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
