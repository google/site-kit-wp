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
import MetricTileNumeric from '../../../../components/KeyMetrics/MetricTileNumeric';
const { useSelect, useInViewSelect } = Data;

export default function NewVisitorsWidget( widgetProps ) {
	const dates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
			compare: true,
		} )
	);

	const reportOptions = {
		...dates,
		dimensions: [ 'newVsReturning' ],
		metrics: [
			{
				name: 'activeUsers',
			},
		],
	};

	const report = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getReport( reportOptions )
	);

	const loading = useSelect(
		( select ) =>
			! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getReport',
				[ reportOptions ]
			)
	);

	const newVisitors =
		parseInt( report?.rows?.[ 1 ]?.metricValues[ 0 ]?.value, 10 ) || 0;
	const returningVisitors =
		parseInt( report?.rows?.[ 3 ]?.metricValues[ 0 ]?.value, 10 ) || 0;
	const totalVisitors = newVisitors + returningVisitors;

	const compareNewVisitors =
		parseInt( report?.rows?.[ 0 ]?.metricValues[ 0 ]?.value, 10 ) || 0;
	const compareReturningVisitors =
		parseInt( report?.rows?.[ 2 ]?.metricValues[ 0 ]?.value, 10 ) || 0;
	const compareTotalVisitors = compareNewVisitors + compareReturningVisitors;

	return (
		<MetricTileNumeric
			{ ...widgetProps }
			title={ __( 'New Visitors', 'google-site-kit' ) }
			metricValue={ newVisitors }
			subText={ sprintf(
				/* translators: %d: Number of total visitors visiting the site. */
				__( 'of %d total visitors', 'google-site-kit' ),
				totalVisitors
			) }
			previousValue={ compareTotalVisitors }
			currentValue={ totalVisitors }
			loading={ loading }
		/>
	);
}
