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
	provideKeyMetricsUserInputSettings,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
} from '../../../../../tests/js/utils';
import { provideKeyMetricsWidgetRegistrations } from '../test-utils';
import { KEY_METRICS_WIDGETS } from '../key-metrics-widgets';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import {
	EFFECTIVE_SELECTION,
	KEY_METRICS_SELECTED,
	KEY_METRICS_SELECTION_FORM,
} from '../constants';
import {
	CORE_USER,
	KM_ANALYTICS_NEW_VISITORS,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_LEADS,
	KM_ANALYTICS_VISIT_LENGTH,
	KM_ANALYTICS_VISITS_PER_VISITOR,
} from '../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../../modules/analytics-4/datastore/constants';
import KeyMetricsError from '../MetricsSelectionPanel/KeyMetricsError';

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
		<SelectionPanel
			isOpen
			className="googlesitekit-km-selection-panel googlesitekit-acr-km-selection-panel"
		>
			<Header closePanel={ () => null } />
			<SelectionPanelItems
				savedItemSlugs={ savedViewableMetrics }
				allMetricItems={ allMetricItems }
			/>
			<CustomDimensionsNotice />
			<KeyMetricsError savedMetrics={ savedViewableMetrics } />
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
Default.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( CORE_USER ).receiveIsUserInputCompleted( false );
	},
	features: [ 'conversionReporting' ],
};
Default.scenario = {
	label: 'Components/KeyMetrics/ChipTabGroup/default',
};

export const WithError = Template.bind( {} );
WithError.storyName = 'With Error';
WithError.args = {
	setupRegistry: ( registry ) => {
		const savedKeyMetrics = [ KM_ANALYTICS_VISITS_PER_VISITOR ];
		const selectedMetrics = [
			KM_ANALYTICS_VISITS_PER_VISITOR,
			KM_ANALYTICS_VISIT_LENGTH,
			KM_ANALYTICS_NEW_VISITORS,
		];

		provideKeyMetrics( registry, { widgetSlugs: savedKeyMetrics } );
		registry.dispatch( CORE_USER ).receiveIsUserInputCompleted( false );

		registry.dispatch( CORE_FORMS ).setValues( KEY_METRICS_SELECTION_FORM, {
			[ KEY_METRICS_SELECTED ]: savedKeyMetrics,
			[ EFFECTIVE_SELECTION ]: selectedMetrics,
		} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveConversionReportingInlineData( {
				newEvents: [],
				lostEvents: [],
			} );
	},
	features: [ 'conversionReporting' ],
};
WithError.scenario = {
	label: 'Components/KeyMetrics/ChipTabGroup/WithError',
};

export const WithSuggestedGroup = Template.bind( {} );
WithSuggestedGroup.storyName = 'With Suggested Group';
WithSuggestedGroup.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( CORE_USER ).receiveIsUserInputCompleted( true );
		provideKeyMetricsUserInputSettings( registry, {
			purpose: {
				values: [ 'sell_products' ],
				scope: 'site',
			},
		} );
	},
	features: [ 'conversionReporting' ],
};
WithSuggestedGroup.scenario = {
	label: 'Components/KeyMetrics/ChipTabGroup/WithSuggestedGroup',
};

export default {
	title: 'Key Metrics/ChipTabGroup',
	component: SelectionPanel,
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideUserAuthentication( registry );

				provideSiteInfo( registry );

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
					KM_ANALYTICS_NEW_VISITORS,
					KM_ANALYTICS_TOP_TRAFFIC_SOURCE_DRIVING_LEADS,
				];

				provideKeyMetrics( registry, { widgetSlugs: savedKeyMetrics } );

				registry
					.dispatch( CORE_FORMS )
					.setValues( KEY_METRICS_SELECTION_FORM, {
						[ KEY_METRICS_SELECTED ]: savedKeyMetrics,
						[ EFFECTIVE_SELECTION ]: savedKeyMetrics,
					} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setDetectedEvents( [ 'contact', 'purchase' ] );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveConversionReportingInlineData( {
						newEvents: [ 'contact' ],
						lostEvents: [],
					} );

				// Call story-specific setup.
				if ( args && args?.setupRegistry ) {
					args.setupRegistry( registry );
				}
			};

			return (
				<WithRegistrySetup
					func={ setupRegistry }
					features={ args.features || [] }
				>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
