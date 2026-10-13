/**
 * Recent activity site traffic metrics.
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
import { createInterpolateElement, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	Select,
	useDispatch,
	useInViewSelect,
	useSelect,
} from 'googlesitekit-data';
import Link from '@/js/components/Link';
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { ErrorObject } from '@/js/util/errors';
import FreshMetric from './FreshMetric';
import FreshMetricsGroup from './FreshMetricsGroup';
import {
	FRESH_DATA_REPORT_FETCH_OPTIONS,
	getTimeZoneReportOptions,
	getTotalVisitorsReportOptions,
} from './reportOptions';

export interface SiteTrafficMetricsProps {
	/** The start of the last 24 hours, from `getFreshDataWindowStart()`. */
	windowStart: number;
}

const SiteTrafficMetrics: FC< SiteTrafficMetricsProps > = ( {
	windowStart,
} ) => {
	const documentationURL = useSelect(
		( select: Select ) =>
			select( CORE_SITE ).getDocumentationLinkURL( 'fresh-data' ),
		[]
	);

	const timeZoneReportOptions = useMemo(
		() => getTimeZoneReportOptions( windowStart ),
		[ windowStart ]
	);

	const timeZone = useInViewSelect< string | undefined >(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getReport( timeZoneReportOptions )
				?.metadata?.timeZone,
		[ timeZoneReportOptions ]
	);

	const totalVisitorsReportOptions = useMemo(
		() =>
			timeZone
				? getTotalVisitorsReportOptions( windowStart, timeZone )
				: undefined,
		[ windowStart, timeZone ]
	);

	const totalVisitorsReport = useInViewSelect< Report | undefined >(
		( select: Select ) =>
			totalVisitorsReportOptions
				? select( MODULES_ANALYTICS_4 ).getReport(
						totalVisitorsReportOptions,
						FRESH_DATA_REPORT_FETCH_OPTIONS
				  )
				: undefined,
		[ totalVisitorsReportOptions ]
	);

	// The store saves a report's error under its options alone, without the
	// fetch options.
	const error: ErrorObject | undefined = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getFirstReportError(
				timeZoneReportOptions,
				totalVisitorsReportOptions
			),
		[ timeZoneReportOptions, totalVisitorsReportOptions ]
	);

	const isGatheringData = useInViewSelect< boolean | undefined >(
		( select: Select ) => select( MODULES_ANALYTICS_4 ).isGatheringData(),
		[]
	);

	const { invalidateResolution } = useDispatch( MODULES_ANALYTICS_4 );

	// "Retry" requests again only reports without fetch options, such as the
	// time zone report, so this requests the Total visitors report again.
	function handleRetry() {
		if ( totalVisitorsReportOptions ) {
			invalidateResolution( 'getReport', [
				totalVisitorsReportOptions,
				FRESH_DATA_REPORT_FETCH_OPTIONS,
			] );
		}
	}

	const totalVisitors =
		totalVisitorsReport &&
		( Number(
			totalVisitorsReport.rows?.[ 0 ]?.metricValues?.[ 0 ]?.value
		) ||
			0 );

	// While Analytics gathers data, the tab already says so, and zero
	// visitors is expected.
	if ( totalVisitors === 0 && isGatheringData === false ) {
		return (
			<div className="googlesitekit-traffic-overview__fresh-metrics-notice">
				<Notice
					type={ NOTICE_TYPES.INFO }
					title={ __(
						'No recent visitor data yet',
						'google-site-kit'
					) }
					description={ __(
						'Analytics hasn’t reported any visits in the last 24 hours. Data may still be on its way.',
						'google-site-kit'
					) }
				/>
			</div>
		);
	}

	return (
		<FreshMetricsGroup
			title={ __( 'Site traffic since yesterday', 'google-site-kit' ) }
			infoTooltip={ createInterpolateElement(
				__(
					'Shows traffic from the last 24 hours. Data may take up to 6 hours to update. <a>Learn more</a>',
					'google-site-kit'
				),
				{
					a: (
						<Link
							href={ documentationURL }
							external
							hideExternalIndicator
						/>
					),
				}
			) }
			moduleSlug={ MODULE_SLUG_ANALYTICS_4 }
			error={ error }
			onRetry={ handleRetry }
		>
			<FreshMetric
				label={ __( 'Total visitors', 'google-site-kit' ) }
				value={ totalVisitors }
			/>
		</FreshMetricsGroup>
	);
};

export default SiteTrafficMetrics;
