/**
 * LatestContentTable component.
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
import { ElementType, FC, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useInViewSelect, useSelect } from 'googlesitekit-data';
import DetailsPermaLinks from '@/js/components/DetailsPermaLinks';
import PreviewTable from '@/js/components/PreviewTable';
import ReportTable from '@/js/components/ReportTable';
import TableOverflowContainer from '@/js/components/TableOverflowContainer';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import useViewOnly from '@/js/hooks/useViewOnly';
import { ZeroDataMessage } from '@/js/modules/analytics-4/components/common';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { RecentContentItem } from '@/js/modules/analytics-4/datastore/fresh-data';
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { numFmt } from '@/js/util';
import { formatDate } from '@/js/util/dates';
import { getLocale } from '@/js/util/i18n';
import Footer from './Footer';
import { getLatestContentReportArgs } from './latestContentReportOptions';
import {
	LatestContentRow,
	joinLatestContentRows,
} from './utils/joinLatestContentRows';

const RECENT_CONTENT_OPTIONS = { count: 10 };

const COLUMN_HEADER_CLASS_NAME =
	'googlesitekit-typography googlesitekit-typography--title googlesitekit-typography--small';

function formatPublishedTime( publishedAt: string ): string {
	return new Intl.DateTimeFormat( getLocale(), {
		hour: '2-digit',
		minute: '2-digit',
		hourCycle: 'h23',
	} ).format( Date.parse( publishedAt ) );
}

export interface LatestContentTableProps {
	/** The widget wrapper the table renders in. */
	Widget: ElementType;
	/** The component the table renders when a request fails. */
	WidgetReportError: ElementType;
	/** The tab bar rendered above the table. */
	tabBar?: ReactNode;
}

const LatestContentTable: FC< LatestContentTableProps > = ( {
	Widget,
	WidgetReportError,
	tabBar,
} ) => {
	const widgetClassName = tabBar
		? 'googlesitekit-analytics-popular-pages-widget--tabbed'
		: undefined;

	const viewOnlyDashboard = useViewOnly();

	const dates = useSelect(
		( select: Select ) => select( CORE_USER ).getDateRangeDates(),
		[]
	);

	const recentContent: RecentContentItem[] | undefined = useInViewSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getRecentContent(
				RECENT_CONTENT_OPTIONS
			),
		[]
	);

	const recentContentError = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getErrorForSelector(
				'getRecentContent',
				[ RECENT_CONTENT_OPTIONS ]
			),
		[]
	);

	const args = recentContent?.length
		? getLatestContentReportArgs(
				dates,
				recentContent.map( ( { pagePath } ) => pagePath )
		  )
		: undefined;

	const report: Report | undefined = useInViewSelect(
		( select: Select ) =>
			args ? select( MODULES_ANALYTICS_4 ).getReport( args ) : undefined,
		[ args ]
	);

	const reportError = useSelect(
		( select: Select ) =>
			args
				? select( MODULES_ANALYTICS_4 ).getErrorForSelector(
						'getReport',
						[ args ]
				  )
				: undefined,
		[ args ]
	);

	const reportLoaded = useSelect(
		( select: Select ) =>
			args
				? select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
						'getReport',
						[ args ]
				  )
				: true,
		[ args ]
	);

	if ( recentContentError ) {
		return (
			<Widget className={ widgetClassName } Footer={ Footer }>
				{ tabBar }
				<WidgetReportError
					moduleSlug="analytics-4"
					error={ recentContentError }
				/>
			</Widget>
		);
	}

	if ( recentContent === undefined || ! reportLoaded ) {
		return (
			<Widget className={ widgetClassName } Footer={ Footer } noPadding>
				{ tabBar }
				<PreviewTable padding />
			</Widget>
		);
	}

	const rows = joinLatestContentRows(
		recentContent,
		reportError ? undefined : report
	);

	const postedColumns = [
		{
			columnHeaderClassName: COLUMN_HEADER_CLASS_NAME,
			title: __( 'Posted', 'google-site-kit' ),
			description: __( 'Published date', 'google-site-kit' ),
			className:
				'googlesitekit-analytics-popular-pages-widget__posted-date',
			Component( { row }: { row: LatestContentRow } ) {
				return (
					<span>
						{ /* eslint-disable-next-line sitekit/no-direct-date -- Parses a stored publish time, not the current date. */ }
						{ formatDate( new Date( row.publishedAt ), {
							year: undefined,
						} ) }
					</span>
				);
			},
		},
		{
			columnHeaderClassName: COLUMN_HEADER_CLASS_NAME,
			title: '',
			description: __( 'Published time', 'google-site-kit' ),
			className:
				'googlesitekit-analytics-popular-pages-widget__posted-time',
			Component( { row }: { row: LatestContentRow } ) {
				return <span>{ formatPublishedTime( row.publishedAt ) }</span>;
			},
		},
		{
			columnHeaderClassName: COLUMN_HEADER_CLASS_NAME,
			title: __( 'Title', 'google-site-kit' ),
			description: __( 'Page Title', 'google-site-kit' ),
			primary: true,
			className: 'googlesitekit-analytics-popular-pages-widget__title',
			Component( { row }: { row: LatestContentRow } ) {
				const serviceURL = useSelect(
					( select: Select ) => {
						if ( viewOnlyDashboard ) {
							return null;
						}

						return select(
							MODULES_ANALYTICS_4
						).getServiceReportURL( 'all-pages-and-screens', {
							filters: { unifiedPagePathScreen: row.pagePath },
							dates,
						} );
					},
					[ row.pagePath ]
				);

				return (
					<DetailsPermaLinks
						title={ row.title }
						path={ row.pagePath }
						serviceURL={ serviceURL }
					/>
				);
			},
		},
	];

	const metricColumns = [
		{
			columnHeaderClassName: COLUMN_HEADER_CLASS_NAME,
			title: __( 'Pageviews', 'google-site-kit' ),
			description: __( 'Pageviews', 'google-site-kit' ),
			field: 'pageviews',
			className: 'googlesitekit-table__head-item--pageviews',
			Component( { fieldValue }: { fieldValue: number } ) {
				return (
					<span>{ numFmt( fieldValue, { style: 'decimal' } ) }</span>
				);
			},
		},
		{
			columnHeaderClassName: COLUMN_HEADER_CLASS_NAME,
			title: __( 'Sessions', 'google-site-kit' ),
			description: __( 'Sessions', 'google-site-kit' ),
			field: 'sessions',
			className: 'googlesitekit-table__head-item--sessions',
			Component( { fieldValue }: { fieldValue: number } ) {
				return (
					<span>{ numFmt( fieldValue, { style: 'decimal' } ) }</span>
				);
			},
		},
		{
			columnHeaderClassName: COLUMN_HEADER_CLASS_NAME,
			title: __( 'Engaged Sessions', 'google-site-kit' ),
			description: __( 'Engaged Sessions', 'google-site-kit' ),
			className: 'googlesitekit-table__head-item--engaged-sessions',
			Component( { row }: { row: LatestContentRow } ) {
				const share = row.sessions
					? row.engagedSessions / row.sessions
					: 0;

				return <span>{ numFmt( share, '%' ) }</span>;
			},
		},
		{
			columnHeaderClassName: COLUMN_HEADER_CLASS_NAME,
			title: __( 'Session Duration', 'google-site-kit' ),
			description: __( 'Session Duration', 'google-site-kit' ),
			field: 'averageSessionDuration',
			Component( { fieldValue }: { fieldValue: number } ) {
				return <span>{ numFmt( fieldValue, 's' ) }</span>;
			},
		},
	];

	const columns = reportError
		? postedColumns
		: [ ...postedColumns, ...metricColumns ];

	return (
		<Widget className={ widgetClassName } Footer={ Footer } noPadding>
			{ tabBar }
			{ reportError && (
				<div className="googlesitekit-analytics-popular-pages-widget__report-error">
					<WidgetReportError
						moduleSlug="analytics-4"
						error={ reportError }
					/>
				</div>
			) }
			<TableOverflowContainer>
				<ReportTable
					className="googlesitekit-analytics-popular-pages-widget__latest-content-table"
					rows={ rows }
					columns={ columns }
					zeroState={ ZeroDataMessage }
				/>
			</TableOverflowContainer>
		</Widget>
	);
};

export default LatestContentTable;
