/**
 * Traffic Overview total visitors.
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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import ChangeBadge from '@/js/components/ChangeBadge';
import Typography from '@/js/components/Typography';
import {
	SIZE_LARGE,
	SIZE_SMALL,
	TYPE_BODY,
	TYPE_DISPLAY,
} from '@/js/components/Typography/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { Report, ReportRow } from '@/js/modules/analytics-4/datastore/types';
import { calculateChange, numFmt } from '@/js/util';

/**
 * Reads a row's first metric value.
 *
 * The API returns metric values as strings.
 *
 * @since n.e.x.t
 *
 * @param {Object} row A totals row.
 * @return {number} The row's visitor count, or `0` when it is missing or not a number.
 */
function getTotalUsers( row?: ReportRow ): number {
	return Number( row?.metricValues?.[ 0 ]?.value ) || 0;
}

export interface TotalVisitorsProps {
	/** The totals report, holding the selected range then the range before it. */
	report?: Report;
}

const TotalVisitors: FC< TotalVisitorsProps > = ( { report } ) => {
	const comparisonDays = useSelect(
		( select: Select ) => select( CORE_USER ).getDateRangeNumberOfDays(),
		[]
	);

	const [ current, previous ] = report?.totals || [];

	const currentValue = getTotalUsers( current );
	const previousValue = getTotalUsers( previous );

	// `ChangeBadge` renders nothing when the previous value is zero. Asking
	// the same question here stops the label being left on its own.
	const hasChange = calculateChange( previousValue, currentValue ) !== null;

	return (
		<div className="googlesitekit-traffic-overview__total-visitors">
			<Typography
				as="h3"
				type={ TYPE_BODY }
				size={ SIZE_SMALL }
				className="googlesitekit-traffic-overview__total-visitors-title"
			>
				{ __( 'Total visitors', 'google-site-kit' ) }
			</Typography>
			<div className="googlesitekit-traffic-overview__total-visitors-metric">
				<Typography
					as="div"
					type={ TYPE_DISPLAY }
					size={ SIZE_LARGE }
					className="googlesitekit-traffic-overview__total-visitors-figure"
				>
					{ numFmt( currentValue ) }
				</Typography>
				{ hasChange && (
					<div className="googlesitekit-traffic-overview__total-visitors-change">
						<ChangeBadge
							previousValue={ previousValue }
							currentValue={ currentValue }
						/>
						<Typography
							as="p"
							type={ TYPE_BODY }
							size={ SIZE_SMALL }
							className="googlesitekit-traffic-overview__total-visitors-comparison"
						>
							{ sprintf(
								/* translators: %d: number of days in the comparison period */
								__( 'Vs. prev. %d days', 'google-site-kit' ),
								comparisonDays
							) }
						</Typography>
					</div>
				) }
			</div>
		</div>
	);
};

export default TotalVisitors;
