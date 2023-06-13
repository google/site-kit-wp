/**
 * LoyalVisitorsWidget component.
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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '../../datastore/constants';
import {
	MetricTileNumeric,
	whenKeyMetricsWidgetVisible,
} from '../../../../components/KeyMetrics';
import { pickIntValueWhere } from '../../utils';
import { numFmt } from '../../../../util';

const { useSelect, useInViewSelect } = Data;

function LoyalVisitorsWidget( { Widget } ) {
	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} )
	);

	const reportOptions = {
		...dates,
		dimensions: [ 'newVsReturning' ],
		metrics: [ { name: 'activeUsers' } ],
	};

	const report = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getReport( reportOptions )
	);

	const loading = useInViewSelect(
		( select ) =>
			! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getReport',
				[ reportOptions ]
			)
	);

	const { rows = [], totals = [] } = report || {};

	// Total users and returning users for the current date range.
	const returning = pickIntValueWhere( rows, 'metricValues.0.value', {
		'dimensionValues.0.value': 'returning',
		'dimensionValues.1.value': 'current_range',
	} );
	const total = pickIntValueWhere( totals, 'metricValues.0.value', {
		'dimensionValues.1.value': 'current_range',
	} );

	// Total users and returning users for the previous date range.
	const prevReturning = pickIntValueWhere( rows, 'metricValues.0.value', {
		'dimensionValues.0.value': 'returning',
		'dimensionValues.1.value': 'compare_range',
	} );
	const prevTotal = pickIntValueWhere( totals, 'metricValues.0.value', {
		'dimensionValues.1.value': 'compare_range',
	} );

	// Calculate portions.
	const currentPercentage = total > 0 ? returning / total : 0;
	const prevPercentage = prevTotal > 0 ? prevReturning / prevTotal : 0;

	const format = {
		style: 'percent',
		signDisplay: 'never',
		maximumFractionDigits: 1,
	};

	return (
		<MetricTileNumeric
			Widget={ Widget }
			title={ __( 'Loyal visitors', 'google-site-kit' ) }
			metricValue={ currentPercentage }
			metricValueFormat={ format }
			subText={ sprintf(
				/* translators: %d: Number of total visitors visiting the site. */
				__( 'of %d total visitors', 'google-site-kit' ),
				total
			) }
			previousValue={ prevPercentage }
			currentValue={ currentPercentage }
			loading={ loading }
			tooltip={ sprintf(
				// translators: %1$s - the previous value, %2$s - the current value
				__( '%1$s before vs %2$s now', 'google-site-kit' ),
				numFmt( prevPercentage, format ),
				numFmt( currentPercentage, format )
			) }
		/>
	);
}

LoyalVisitorsWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};

export default whenKeyMetricsWidgetVisible()( LoyalVisitorsWidget );
