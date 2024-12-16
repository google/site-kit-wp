/**
 * Key Metrics Selection Panel Metrics Listing
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useInViewSelect, useSelect } from 'googlesitekit-data';
import { AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY } from '../../../googlesitekit/widgets/default-areas';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { CORE_WIDGETS } from '../../../googlesitekit/widgets/datastore/constants';
import { KEY_METRICS_WIDGETS } from '../key-metrics-widgets';
import MetricItem from './MetricItem';
import useViewOnly from '../../../hooks/useViewOnly';
import { useFeature } from '../../../hooks/useFeature';
import KeyMetricsSelectionPanelItems from './SelectionPanelItems';
import { SelectionPanelItems } from '../../SelectionPanel';

export default function MetricItems( { savedMetrics } ) {
	const isViewOnlyDashboard = useViewOnly();
	const isConversionReportingEnabled = useFeature( 'conversionReporting' );

	const { isKeyMetricAvailable } = useSelect( ( select ) =>
		select( CORE_USER )
	);

	const displayInSelectionPanel = useInViewSelect(
		( select ) => {
			return ( metric ) =>
				KEY_METRICS_WIDGETS[ metric ].displayInSelectionPanel(
					select,
					isViewOnlyDashboard,
					metric
				);
		},
		[ isViewOnlyDashboard ]
	);

	const metricsListReducer = ( acc, metricSlug ) => {
		if ( ! isKeyMetricAvailable( metricSlug ) ) {
			return acc;
		}

		if (
			displayInSelectionPanel === undefined ||
			( typeof KEY_METRICS_WIDGETS[ metricSlug ]
				.displayInSelectionPanel === 'function' &&
				! displayInSelectionPanel( metricSlug ) )
		) {
			return acc;
		}

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

	const widgets = useSelect(
		( select ) =>
			select( CORE_WIDGETS ).getWidgets(
				AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY
			) || []
	);

	const savedMetricSlugs = widgets
		.filter( ( { slug } ) => savedMetrics?.includes( slug ) )
		.map( ( { slug } ) => slug );

	const availableSavedMetrics = Object.keys( KEY_METRICS_WIDGETS )
		.filter( ( metricSlug ) => {
			return savedMetricSlugs.includes( metricSlug );
		} )
		.reduce( metricsListReducer, {} );

	const availableUnsavedMetrics = Object.keys( KEY_METRICS_WIDGETS )
		.filter( ( metricSlug ) => {
			return ! savedMetricSlugs.includes( metricSlug );
		} )
		.reduce( metricsListReducer, {} );

	const allMetricItems = Object.keys( KEY_METRICS_WIDGETS ).reduce(
		metricsListReducer,
		{}
	);

	if ( isConversionReportingEnabled ) {
		return (
			<KeyMetricsSelectionPanelItems
				savedItemSlugs={ savedMetrics }
				allMetricItems={ allMetricItems }
			/>
		);
	}

	return (
		<SelectionPanelItems
			availableItemsTitle={ __(
				'Additional metrics',
				'google-site-kit'
			) }
			savedItemSlugs={ savedMetrics }
			availableSavedItems={ availableSavedMetrics }
			availableUnsavedItems={ availableUnsavedMetrics }
			ItemComponent={ MetricItem }
		/>
	);
}

MetricItems.propTypes = {
	savedMetrics: PropTypes.array,
};
