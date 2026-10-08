/**
 * Recent activity latest post visitor breakdown.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { Fragment, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { usePostReport } from '@/js/modules/analytics-4/components/traffic-overview/hooks/usePostReport';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { numFmt } from '@/js/util';
import LatestPostMetricRow from './LatestPostMetricRow';
import LatestPostReportError from './LatestPostReportError';
import LatestPostTile from './LatestPostTile';
import { PostReportArgs, getVisitorsReportOptions } from './postReportOptions';
import { getMetricValue } from './utils/getMetricValue';

interface VisitorBreakdownGroupProps {
	/** The post's permalink and the date range of its reports. */
	reportArgs: PostReportArgs;
}

/**
 * Gets the number of new or returning visitors in a report split by the
 * `newVsReturning` dimension.
 *
 * @since n.e.x.t
 *
 * @param {Object} report      The report, which is `undefined` while it loads.
 * @param {string} visitorType The type of visitors, `new` or `returning`.
 * @return {number} The number of visitors, or 0 when the report has no such row.
 */
function getVisitors(
	report: Report | undefined,
	visitorType: 'new' | 'returning'
): number {
	const row = report?.rows?.find(
		( { dimensionValues } ) => dimensionValues?.[ 0 ]?.value === visitorType
	);

	return getMetricValue( row );
}

const VisitorBreakdownGroup: FC< VisitorBreakdownGroupProps > = ( {
	reportArgs,
} ) => {
	const reportOptions = useMemo(
		() => getVisitorsReportOptions( reportArgs ),
		[ reportArgs ]
	);

	const { report, loading, error } = usePostReport< Report >(
		MODULES_ANALYTICS_4,
		reportOptions
	);

	return (
		<LatestPostTile title={ __( 'Visitor breakdown', 'google-site-kit' ) }>
			{ ! loading && !! error ? (
				<LatestPostReportError error={ error } />
			) : (
				<Fragment>
					<LatestPostMetricRow
						label={ __( 'Total visitors', 'google-site-kit' ) }
						// A visitor can be new and returning in the same date
						// range, so the total comes from the report's totals
						// rather than the sum of both rows.
						value={ numFmt(
							getMetricValue( report?.totals?.[ 0 ] )
						) }
						loading={ loading }
					/>
					<LatestPostMetricRow
						label={ __( 'New visitors', 'google-site-kit' ) }
						value={ numFmt( getVisitors( report, 'new' ) ) }
						loading={ loading }
					/>
					<LatestPostMetricRow
						label={ __( 'Returning visitors', 'google-site-kit' ) }
						value={ numFmt( getVisitors( report, 'returning' ) ) }
						loading={ loading }
					/>
				</Fragment>
			) }
		</LatestPostTile>
	);
};

export default VisitorBreakdownGroup;
