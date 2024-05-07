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
import Data from 'googlesitekit-data';
import MetricItem from './MetricItem';
import { AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY } from '../../../googlesitekit/widgets/default-areas';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { CORE_WIDGETS } from '../../../googlesitekit/widgets/datastore/constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { KEY_METRICS_WIDGETS } from '../key-metrics-widgets';
import useViewOnly from '../../../hooks/useViewOnly';
import PanelItems from '../../SelectionPanel/PanelItems';
const { useSelect } = Data;

export default function Metrics( { savedMetrics } ) {
	const isViewOnlyDashboard = useViewOnly();

	const { isKeyMetricAvailable } = useSelect( ( select ) =>
		select( CORE_USER )
	);

	const { getModule } = useSelect( ( select ) => select( CORE_MODULES ) );

	const displayInList = useSelect(
		( select ) => ( metric ) =>
			KEY_METRICS_WIDGETS[ metric ].displayInList(
				select,
				isViewOnlyDashboard
			)
	);

	const getWidget = useSelect(
		( select ) => ( metric ) => select( CORE_WIDGETS ).getWidget( metric )
	);

	const metricsListReducer = ( acc, metric ) => {
		if ( ! isKeyMetricAvailable( metric ) ) {
			return acc;
		}

		if (
			typeof KEY_METRICS_WIDGETS[ metric ].displayInList === 'function' &&
			! displayInList( metric )
		) {
			return acc;
		}

		const widget = getWidget( metric );

		const disconnectedModules = widget.modules.reduce(
			( modulesAcc, slug ) => {
				const module = getModule( slug );
				if ( module?.connected || ! module?.name ) {
					return modulesAcc;
				}

				return [ ...modulesAcc, module.name ];
			},
			[]
		);

		return {
			...acc,
			[ metric ]: {
				...KEY_METRICS_WIDGETS[ metric ],
				disconnectedModules,
			},
		};
	};

	const widgets = useSelect(
		( select ) =>
			select( CORE_WIDGETS ).getWidgets(
				AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY
			) || []
	);

	const addSavedMetricFlag = ( metricList, value ) => {
		if ( Object.keys( metricList ).length > 0 ) {
			Object.keys( metricList ).forEach( ( slug ) => {
				metricList[ slug ] = {
					savedMetric: value,
					...metricList[ slug ],
				};
			} );
		}

		return metricList;
	};

	const savedMetricSlugs = widgets
		.filter( ( { slug } ) => savedMetrics.includes( slug ) )
		.map( ( { slug } ) => slug );

	let availableSavedMetrics = Object.keys( KEY_METRICS_WIDGETS )
		.filter( ( metricSlug ) => {
			return savedMetricSlugs.includes( metricSlug );
		} )
		.reduce( metricsListReducer, {} );

	let availableUnsavedMetrics = Object.keys( KEY_METRICS_WIDGETS )
		.filter( ( metricSlug ) => {
			return ! savedMetricSlugs.includes( metricSlug );
		} )
		.reduce( metricsListReducer, {} );

	availableSavedMetrics = addSavedMetricFlag( availableSavedMetrics, true );
	availableUnsavedMetrics = addSavedMetricFlag(
		availableUnsavedMetrics,
		false
	);

	return (
		<div className="googlesitekit-km-selection-panel-metrics">
			<PanelItems
				heading={ __( 'Current Selection', 'google-site-kit' ) }
				items={ availableSavedMetrics }
				ItemComponent={ MetricItem }
			/>
			<PanelItems
				heading={ __( 'Additional metrics', 'google-site-kit' ) }
				items={ availableUnsavedMetrics }
				ItemComponent={ MetricItem }
			/>
		</div>
	);
}

Metrics.propTypes = {
	savedMetrics: PropTypes.array,
};
