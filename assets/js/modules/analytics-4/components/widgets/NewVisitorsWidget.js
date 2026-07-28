/**
 * NewVisitorsWidget component.
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
import { get } from 'lodash';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useInViewSelect, useSelect } from 'googlesitekit-data';
import { MetricTileNumeric } from '@/js/components/KeyMetrics';
import {
	CORE_USER,
	KM_ANALYTICS_NEW_VISITORS,
} from '@/js/googlesitekit/datastore/user/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { numFmt } from '@/js/util/i18n';
import whenActive from '@/js/util/when-active';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';

/**
 * Builds the Analytics 4 report options for the New Visitors metric.
 *
 * Both this widget and the metric's PDF tile import this, so the dashboard tile
 * and the report request the same data.
 *
 * @since n.e.x.t
 *
 * @param {Object} dates The date range, including the compare dates.
 * @return {Object} The Analytics 4 `getReport` options.
 */
export function getNewVisitorsReportOptions( dates ) {
	return {
		...dates,
		dimensions: [ 'newVsReturning' ],
		metrics: [ { name: 'activeUsers' } ],
		reportID: 'analytics-4_new-visitors-widget_widget_reportOptions',
	};
}

/**
 * Builds the sub-text for the New Visitors metric tile.
 *
 * Both this widget and the metric's PDF tile import this, so the dashboard tile
 * and the PDF tile display the same sub-text.
 *
 * @since n.e.x.t
 *
 * @param {number} total The total number of visitors.
 * @return {string} The formatted sub-text.
 */
export function getNewVisitorsSubtext( total ) {
	return sprintf(
		/* translators: %s: Number of total visitors visiting the site, such as "1,234". */
		__( 'of %s total visitors', 'google-site-kit' ),
		numFmt( total, { style: 'decimal' } )
	);
}

function NewVisitorsWidget( { Widget } ) {
	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			compare: true,
		} )
	);

	const reportOptions = getNewVisitorsReportOptions( dates );

	const report = useInViewSelect(
		( select ) => select( MODULES_ANALYTICS_4 ).getReport( reportOptions ),
		[ reportOptions ]
	);

	const error = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
			reportOptions,
		] )
	);

	const loading = useSelect(
		( select ) =>
			! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getReport',
				[ reportOptions ]
			)
	);

	const { rows = [], totals = [] } = report || {};

	function makeFind( dateRange ) {
		return ( row ) =>
			get( row, 'dimensionValues.0.value' ) === 'new' &&
			get( row, 'dimensionValues.1.value' ) === dateRange;
	}

	const newVisitors =
		rows.find( makeFind( 'date_range_0' ) )?.metricValues?.[ 0 ]?.value ||
		0;

	const total = Number( totals[ 0 ]?.metricValues?.[ 0 ]?.value ) || 0;

	const prevTotal = Number( totals[ 1 ]?.metricValues?.[ 0 ]?.value ) || 0;

	return (
		<MetricTileNumeric
			Widget={ Widget }
			widgetSlug={ KM_ANALYTICS_NEW_VISITORS }
			metricValue={ newVisitors }
			subText={ getNewVisitorsSubtext( total ) }
			previousValue={ prevTotal }
			currentValue={ total }
			loading={ loading }
			error={ error }
			moduleSlug="analytics-4"
		/>
	);
}

NewVisitorsWidget.propTypes = {
	Widget: PropTypes.elementType.isRequired,
};

export default whenActive( {
	moduleName: MODULE_SLUG_ANALYTICS_4,
	FallbackComponent: ConnectGA4CTATileWidget,
} )( NewVisitorsWidget );
