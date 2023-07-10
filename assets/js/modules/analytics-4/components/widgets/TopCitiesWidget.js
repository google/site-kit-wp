/**
 * TopCitiesWidget component.
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
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../datastore/constants';
import { ZeroDataMessage } from '../../../analytics/components/common';
import { numFmt } from '../../../../util';
import {
	MetricTileTable,
	whenKeyMetricsWidgetVisible,
} from '../../../../components/KeyMetrics';
const { useSelect, useInViewSelect } = Data;

function TopCitiesWidget( { Widget, WidgetNull } ) {
	const keyMetricsWidgetHidden = useSelect( ( select ) =>
		select( CORE_USER ).isKeyMetricsWidgetHidden()
	);
	const isGA4ModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);

	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);

	const topcCitiesReportOptions = {
		...dates,
		dimensions: [ 'city' ],
		metrics: [ { name: 'totalUsers' } ],
		orderby: [
			{
				metric: {
					metricName: 'totalUsers',
				},
				desc: true,
			},
		],
		limit: 3,
	};

	const topCitiesReport = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getReport( topcCitiesReportOptions )
	);

	const loading = useInViewSelect(
		( select ) =>
			! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getReport',
				[ topcCitiesReportOptions ]
			)
	);

	if ( ! isGA4ModuleConnected || keyMetricsWidgetHidden !== false ) {
		return <WidgetNull />;
	}

	const { rows = [] } = topCitiesReport || {};

	const totalUsers =
		topCitiesReport?.totals?.[ 0 ]?.metricValues?.[ 0 ]?.value;

	const columns = [
		{
			field: 'dimensionValues',
			Component: ( { fieldValue } ) => {
				const [ title ] = fieldValue;

				return (
					<p className="googlesitekit-km-widget-tile__table-item-text">
						{ title.value }
					</p>
				);
			},
		},
		{
			field: 'metricValues.0.value',
			Component: ( { fieldValue } ) => (
				<strong>{ numFmt( fieldValue / totalUsers, '%' ) }</strong>
			),
		},
	];

	return (
		<MetricTileTable
			Widget={ Widget }
			title={ __( 'To cities driving traffic', 'google-site-kit' ) }
			loading={ loading }
			rows={ rows }
			columns={ columns }
			zeroState={ ZeroDataMessage }
		/>
	);
}

TopCitiesWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetNull: PropTypes.elementType.isRequired,
};

export default whenKeyMetricsWidgetVisible()( TopCitiesWidget );
