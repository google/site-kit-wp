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
 * Internal dependencies
 */
import { useInViewSelect, useSelect } from 'googlesitekit-data';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { KEY_METRICS_WIDGETS } from '../key-metrics-widgets';
import useViewOnly from '../../../hooks/useViewOnly';
import KeyMetricsSelectionPanelItems from './SelectionPanelItems';

export default function MetricItems( { savedMetrics } ) {
	const isViewOnlyDashboard = useViewOnly();

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

	const allMetricItems = Object.keys( KEY_METRICS_WIDGETS ).reduce(
		metricsListReducer,
		{}
	);

	return (
		<KeyMetricsSelectionPanelItems
			savedItemSlugs={ savedMetrics }
			allMetricItems={ allMetricItems }
		/>
	);
}

MetricItems.propTypes = {
	savedMetrics: PropTypes.array,
};
