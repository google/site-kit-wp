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
import { Fragment } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import ChangeBadge from '@/js/components/ChangeBadge';
import GatheringDataNotice, {
	NOTICE_STYLE,
} from '@/js/components/GatheringDataNotice';
import InfoTooltip from '@/js/components/InfoTooltip';
import PreviewBlock from '@/js/components/PreviewBlock';
import Typography from '@/js/components/Typography';
import {
	SIZE_LARGE,
	SIZE_MEDIUM,
	SIZE_SMALL,
	TYPE_DISPLAY,
	TYPE_HEADLINE,
} from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { getMetricValue } from '@/js/modules/analytics-4/components/traffic-overview/utils/getMetricValue';
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { calculateChange, numFmt } from '@/js/util';

export interface TotalVisitorsProps {
	/** The totals report, holding the selected range then the range before it. */
	report?: Report;
	/** The unique visitors over the selected range. */
	uniqueVisitors?: number;
	/** Whether the figures have arrived. */
	loaded?: boolean;
	/** Whether the Analytics property is still gathering data. */
	gatheringData?: boolean;
}

const TotalVisitors: FC< TotalVisitorsProps > = ( {
	report,
	uniqueVisitors = 0,
	loaded = true,
	gatheringData = false,
} ) => {
	const comparisonDays = useSelect(
		( select: Select ) => select( CORE_USER ).getDateRangeNumberOfDays(),
		[]
	);

	const [ current, previous ] = report?.totals || [];

	const currentValue = getMetricValue( current );
	const previousValue = getMetricValue( previous );

	// `ChangeBadge` renders nothing when the previous value is zero. Asking
	// the same question here stops the label being left on its own.
	const hasChange = calculateChange( previousValue, currentValue ) !== null;

	return (
		<div className="googlesitekit-traffic-overview__total-visitors">
			{ ! loaded && (
				// The placeholder is as tall as the figures, so the chart
				// under it stays in place when they arrive.
				<PreviewBlock width="248px" height="78px" />
			) }
			{ loaded && gatheringData && (
				<GatheringDataNotice style={ NOTICE_STYLE.LARGE } />
			) }
			{ loaded && ! gatheringData && (
				<Fragment>
					<div className="googlesitekit-traffic-overview__total-visits">
						<div className="googlesitekit-traffic-overview__total-visits-metric">
							<Typography
								as="span"
								type={ TYPE_DISPLAY }
								size={ SIZE_LARGE }
								className="googlesitekit-traffic-overview__total-visits-figure"
							>
								{ numFmt( currentValue ) }
							</Typography>
							<P
								size={ SIZE_MEDIUM }
								className="googlesitekit-traffic-overview__total-visits-label"
							>
								{ __( 'Total visits', 'google-site-kit' ) }
							</P>
						</div>
						{ hasChange && (
							<div className="googlesitekit-traffic-overview__total-visits-change">
								<ChangeBadge
									previousValue={ previousValue }
									currentValue={ currentValue }
								/>
								<P
									size={ SIZE_SMALL }
									className="googlesitekit-traffic-overview__total-visits-comparison"
								>
									{ sprintf(
										/* translators: %d: number of days in the comparison period */
										__(
											'Vs. prev. %d days',
											'google-site-kit'
										),
										comparisonDays
									) }
								</P>
							</div>
						) }
					</div>
					<div className="googlesitekit-traffic-overview__unique-visitors">
						<Typography
							as="span"
							type={ TYPE_HEADLINE }
							size={ SIZE_SMALL }
							className="googlesitekit-traffic-overview__unique-visitors-figure"
						>
							{ numFmt( uniqueVisitors ) }
						</Typography>
						<div className="googlesitekit-traffic-overview__unique-visitors-label">
							<P size={ SIZE_SMALL }>
								{ __( 'Unique visitors', 'google-site-kit' ) }
							</P>
							<InfoTooltip
								title={ __(
									'Shows how many people visited your site, counting each person once.',
									'google-site-kit'
								) }
							/>
						</div>
					</div>
				</Fragment>
			) }
		</div>
	);
};

export default TotalVisitors;
