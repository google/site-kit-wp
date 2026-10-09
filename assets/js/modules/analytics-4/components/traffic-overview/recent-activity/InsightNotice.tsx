/**
 * Recent activity insight notice.
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
import { useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useInViewSelect, useSelect } from 'googlesitekit-data';
import PreviewBlock from '@/js/components/PreviewBlock';
import { SIZE_MEDIUM } from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import { useFreshDataDateRange } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useFreshDataDateRange';
import {
	FRESH_DATA_FETCH_OPTIONS,
	getInsightReportArgs,
} from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/reportOptions';
import {
	Insight,
	classifyInsight,
} from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/insight';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { numFmt } from '@/js/util';
import MagnifyingGlassIcon from '@/svg/icons/magnifying-glass.svg';

/**
 * Gets the notice copy for an insight.
 *
 * @since n.e.x.t
 *
 * @param {Object} insight                The insight.
 * @param {string} insight.classification `typical`, `up` or `down`.
 * @param {number} insight.changePercent  The change from the median, in percent.
 * @return {string} The notice copy.
 */
function getInsightCopy( { classification, changePercent }: Insight ): string {
	const change = numFmt( Math.abs( changePercent ) / 100, {
		style: 'percent',
		maximumFractionDigits: 1,
	} );

	if ( classification === 'up' ) {
		return sprintf(
			/* translators: %s: the increase in visitors, e.g. "32%" */
			__(
				'Your site’s traffic since yesterday is up %s compared to how it performed at the same time over the past few weeks',
				'google-site-kit'
			),
			change
		);
	}

	if ( classification === 'down' ) {
		return sprintf(
			/* translators: %s: the decrease in visitors, e.g. "32%" */
			__(
				'Your site’s traffic since yesterday is down %s compared to how it performed at the same time over the past few weeks',
				'google-site-kit'
			),
			change
		);
	}

	return __(
		'Your site’s traffic since yesterday is typical compared to how it performed at the same time over the past few weeks',
		'google-site-kit'
	);
}

const InsightNotice: FC = () => {
	const dateRange = useFreshDataDateRange();

	const reportArgs = useMemo(
		() => getInsightReportArgs( dateRange ),
		[ dateRange ]
	);

	const report = useInViewSelect< Report | undefined >(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getReport(
				reportArgs,
				FRESH_DATA_FETCH_OPTIONS
			),
		[ reportArgs ]
	);

	// `areReportsLoading()` checks the resolution of `getReport()` called with
	// the report options alone, so it never sees this call, which passes the
	// fetch options too.
	const loaded = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).hasFinishedResolution( 'getReport', [
				reportArgs,
				FRESH_DATA_FETCH_OPTIONS,
			] ),
		[ reportArgs ]
	);

	const error = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getFirstReportError( reportArgs ),
		[ reportArgs ]
	);

	const insight = useMemo(
		() => classifyInsight( { rows: report?.rows, ...dateRange } ),
		[ report, dateRange ]
	);

	if ( ! loaded ) {
		return (
			<div className="googlesitekit-traffic-overview__insight-notice">
				<PreviewBlock width="100%" height="72px" />
			</div>
		);
	}

	if ( error || ! insight ) {
		return null;
	}

	return (
		<div className="googlesitekit-traffic-overview__insight-notice">
			<div className="googlesitekit-traffic-overview__insight-notice-content">
				<span className="googlesitekit-traffic-overview__insight-notice-icon">
					<MagnifyingGlassIcon width={ 18 } height={ 18 } />
				</span>
				<P size={ SIZE_MEDIUM }>{ getInsightCopy( insight ) }</P>
			</div>
		</div>
	);
};

export default InsightNotice;
