/**
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
import type { ComponentType, FC } from 'react';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useInViewSelect, type Select } from 'googlesitekit-data';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import PreviewBlock from '@/js/components/PreviewBlock';
import ChangeBadge from '@/js/components/ChangeBadge';
import MetricTileHeader from '@/js/components/KeyMetrics/MetricTileHeader';
import { numFmt } from '@/js/util';

const RATE_FORMAT = {
	style: 'percent' as const,
	signDisplay: 'never' as const,
	maximumFractionDigits: 1,
};

export interface PrimaryActionSectionProps {
	currentCount: number;
	previousCount: number;
	currentLabel: string;
	previousLabel: string;
	ErrorComponent: ComponentType< {
		moduleSlug: string;
		error: unknown;
	} >;
}

type ReportRow = {
	dimensionValues?: Array< { value: string } >;
	metricValues?: Array< { value: string } >;
};

function makeFind( dateRangeSlug: string, dimensionIndex: number ) {
	return ( row: ReportRow ) =>
		row?.dimensionValues?.[ dimensionIndex ]?.value === dateRangeSlug;
}

export const PrimaryActionSection: FC< PrimaryActionSectionProps > = (
	props
) => {
	const {
		currentCount,
		previousCount,
		currentLabel,
		previousLabel,
		ErrorComponent,
	} = props;

	const dates = useSelect(
		( select: Select ) =>
			select( CORE_USER ).getDateRangeDates( {
				offsetDays: DATE_RANGE_OFFSET,
				compare: true,
			} ),
		[]
	);

	const sessionsOptions = {
		...dates,
		metrics: [ { name: 'sessions' } ],
		reportID: 'analytics-4_site-goals_sessionsReportOptions',
	};

	const sessionsReport = useInViewSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getReport( sessionsOptions ),
		[ sessionsOptions ]
	);

	const loading = useSelect(
		( select: Select ) =>
			! select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getReport',
				[ sessionsOptions ]
			),
		[]
	);

	const error = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
				sessionsOptions,
			] ),
		[]
	);

	if ( loading ) {
		return <PrimaryActionSectionLoading />;
	}

	if ( ErrorComponent ) {
		return <ErrorComponent moduleSlug="analytics-4" error={ error } />;
	}

	const { rows: sessionsRows = [] } = sessionsReport || {};

	const currentSessions =
		parseInt(
			( sessionsRows as ReportRow[] ).find(
				makeFind( 'date_range_0', 0 )
			)?.metricValues?.[ 0 ]?.value ?? '',
			10
		) || 0;

	const previousSessions =
		parseInt(
			( sessionsRows as ReportRow[] ).find(
				makeFind( 'date_range_1', 0 )
			)?.metricValues?.[ 0 ]?.value ?? '',
			10
		) || 0;

	const currentRate =
		currentSessions === 0 ? 0 : currentCount / currentSessions;
	const previousRate =
		previousSessions === 0 ? 0 : previousCount / previousSessions;

	return (
		<div className="googlesitekit-site-goals-primary-action">
			<p className="googlesitekit-site-goals-primary-action__title">
				{ __( 'Key action', 'google-site-kit' ) }
			</p>
			<div className="googlesitekit-site-goals-primary-action__tiles">
				<div className="googlesitekit-km-widget-tile googlesitekit-km-widget-tile--numeric">
					<MetricTileHeader title={ currentLabel } />
					<div className="googlesitekit-km-widget-tile__body">
						<div className="googlesitekit-km-widget-tile__metric-container">
							<div className="googlesitekit-km-widget-tile__metric">
								{ numFmt( currentRate, RATE_FORMAT ) }
							</div>
							<p className="googlesitekit-km-widget-tile__subtext">
								{ sprintf(
									/* translators: %s: formatted number of total sessions */
									__(
										'%s total sessions',
										'google-site-kit'
									),
									numFmt( currentSessions, {
										style: 'decimal',
									} )
								) }
							</p>
						</div>
						<div className="googlesitekit-km-widget-tile__metric-change-container">
							<ChangeBadge
								previousValue={ previousRate }
								currentValue={ currentRate }
								isAbsolute
							/>
						</div>
					</div>
				</div>
				<div className="googlesitekit-km-widget-tile googlesitekit-km-widget-tile--numeric">
					<MetricTileHeader title={ previousLabel } />
					<div className="googlesitekit-km-widget-tile__body">
						<div className="googlesitekit-km-widget-tile__metric-container">
							<div className="googlesitekit-km-widget-tile__metric">
								{ numFmt( currentCount, { style: 'decimal' } ) }
							</div>
						</div>
						<div className="googlesitekit-km-widget-tile__metric-change-container">
							<ChangeBadge
								previousValue={ previousCount }
								currentValue={ currentCount }
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export const PrimaryActionSectionLoading: FC<
	Record< string, never >
> = () => <PreviewBlock width="100%" height="100px" />;
