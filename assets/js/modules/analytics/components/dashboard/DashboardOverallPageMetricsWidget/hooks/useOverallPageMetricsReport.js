/**
 * OverallPageMetricsWidget hooks.
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
 * WordPress dependencies
 */
import { isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS,
} from '../../../../datastore/constants';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../../../../../googlesitekit/datastore/site/constants';
import { generateDateRangeArgs } from '../../../../util/report-date-range-args';
import { getURLPath } from '../../../../../../util';
import useViewOnly from '../../../../../../hooks/useViewOnly';
const { useSelect, useInViewSelect } = Data;

/**
 * Fetches Analytics report data and state for the Overall Page Metrics widget.
 *
 * @since 1.45.0
 * @since n.e.x.t Moved to its own file.
 *
 * @typedef {Object} OverallPageMetricsReport
 * @property {Array.<Object>|undefined} report     - Analytics report data if exists, otherwise undefined.
 * @property {string}                   serviceURL - Link to relevant Google Analytics page for the report.
 * @property {boolean}                  isLoading  - Loading status for report.
 * @property {(Object|undefined)}       error      - Error object if exists, otherwise undefined.
 * @return {OverallPageMetricsReport} Analytics report data and state.
 */
export function useOverallPageMetricsReport() {
	const viewOnlyDashboard = useViewOnly();

	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} )
	);

	const url = useSelect( ( select ) =>
		select( CORE_SITE ).getCurrentEntityURL()
	);

	const args = {
		...dates,
		dimensions: [ 'ga:date' ],
		metrics: [
			{
				expression: 'ga:pageviews',
				alias: 'Pageviews',
			},
			{
				expression: 'ga:uniquePageviews',
				alias: 'Unique Pageviews',
			},
			{
				expression: 'ga:bounceRate',
				alias: 'Bounce Rate',
			},
			{
				expression: 'ga:avgSessionDuration',
				alias: 'Session Duration',
			},
		],
		url,
	};

	const reportArgs = generateDateRangeArgs( dates );

	if ( isURL( url ) ) {
		reportArgs[ 'explorer-table.plotKeys' ] = '[]';
		reportArgs[ '_r.drilldown' ] = `analytics.pagePath:${ getURLPath(
			url
		) }`;
	}

	const isLoading = useSelect(
		( select ) =>
			! select( MODULES_ANALYTICS ).hasFinishedResolution( 'getReport', [
				args,
			] )
	);

	const error = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getErrorForSelector( 'getReport', [ args ] )
	);

	const serviceURL = useSelect( ( select ) => {
		if ( viewOnlyDashboard ) {
			return null;
		}

		return select( MODULES_ANALYTICS ).getServiceReportURL(
			'visitors-overview',
			reportArgs
		);
	} );

	const report = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getReport( args )
	);

	return {
		report,
		serviceURL,
		isLoading,
		error,
	};
}
