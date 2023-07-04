/**
 * TopConvertingTrafficSourceWidget component.
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
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

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
import { numFmt } from '../../../../util';
import MetricTileText from '../../../../components/KeyMetrics/MetricTileText';
const { useSelect, useInViewSelect } = Data;

export default function TopConvertingTrafficSourceWidget( props ) {
	const { Widget, WidgetNull } = props;

	const isGA4ModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);

	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} )
	);

	const reportOptions = {
		...dates,
		dimensions: [ 'sessionSource' ],
		metrics: [ { name: 'engagementRate' } ],
		orderby: [
			{
				metric: { metricName: 'engagementRate' },
				desc: true,
			},
		],
		limit: 1,
	};

	const report = useInViewSelect( ( select ) =>
		isGA4ModuleConnected
			? select( MODULES_ANALYTICS_4 ).getReport( reportOptions )
			: undefined
	);

	const loading = useInViewSelect( ( select ) =>
		isGA4ModuleConnected
			? ! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
					'getReport',
					[ reportOptions ]
			  )
			: undefined
	);

	if ( ! isGA4ModuleConnected ) {
		return <WidgetNull />;
	}

	const makeFilter = ( dateRange, dimensionIndex ) => ( row ) =>
		get( row, `dimensionValues.${ dimensionIndex }.value` ) === dateRange;

	// Prevents running a filter on `report.rows` which could be undefined.
	const { rows = [] } = report || {};

	const curRange = rows.find( makeFilter( 'date_range_0', 1 ) );
	const prevRange = rows.find( makeFilter( 'date_range_1', 1 ) );

	const topTrafficSource = curRange?.dimensionValues?.[ 0 ]?.value || '-';

	const curEngagementRate =
		parseFloat( curRange?.metricValues?.[ 0 ].value ) || 0;
	const prevEngagementRate =
		parseFloat( prevRange?.metricValues?.[ 0 ]?.value ) || 0;

	const format = {
		style: 'percent',
		signDisplay: 'never',
		maximumFractionDigits: 1,
	};

	return (
		<MetricTileText
			Widget={ Widget }
			title={ __( 'Most engaged traffic source', 'google-site-kit' ) }
			metricValue={ topTrafficSource }
			metricValueFormat={ format }
			subText={ sprintf(
				/* translators: %s: Percentage of engaged sessions for the current top traffic source compared to the number of total engaged sessions for all traffic sources. */
				__( '%s of engaged sessions', 'google-site-kit' ),
				numFmt( 1, format )
			) }
			previousValue={ prevEngagementRate }
			currentValue={ curEngagementRate }
			loading={ loading }
		/>
	);
}

TopConvertingTrafficSourceWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
	WidgetNull: PropTypes.elementType.isRequired,
};
