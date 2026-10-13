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
import classnames from 'classnames';
import { ElementType, FC } from 'react';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
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
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '@/js/hooks/useBreakpoint';
import useViewOnly from '@/js/hooks/useViewOnly';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { RecentContentItem } from '@/js/modules/analytics-4/datastore/fresh-data';
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { numFmt } from '@/js/util';
import { formatDate } from '@/js/util/dates';
import { getLocale } from '@/js/util/i18n';
import { getLatestContentReportArgs } from './latestContentReportOptions';
import NoPublishedContentMessage from './NoPublishedContentMessage';
import {
	LatestContentRow,
	hasUniquePagePath,
	joinLatestContentRows,
} from './utils/joinLatestContentRows';

const RECENT_CONTENT_OPTIONS = { count: 10 };

const COLUMN_HEADER_CLASS_NAME =
	'googlesitekit-typography googlesitekit-typography--title googlesitekit-typography--small';

// `sitePublishedAt` is already in the site's time zone, so it is read and
// formatted as UTC to stop the browser shifting it to its own time zone.
function getSitePublishDate( { sitePublishedAt }: RecentContentItem ): Date {
	// eslint-disable-next-line sitekit/no-direct-date -- Parses a stored publish time, not the current date.
	return new Date( `${ sitePublishedAt }Z` );
}

function formatPublishedDate( item: RecentContentItem ): string {
	return formatDate( getSitePublishDate( item ), {
		year: undefined,
		timeZone: 'UTC',
	} );
}

function formatPublishedTime( item: RecentContentItem ): string {
	return new Intl.DateTimeFormat( getLocale(), {
		hour: 'numeric',
		minute: '2-digit',
		timeZone: 'UTC',
	} ).format( getSitePublishDate( item ) );
}

/**
 * Props for the Latest content table.
 *
 * @since n.e.x.t
 */
export interface LatestContentTableProps {
	/** The component the table renders when a request fails. */
	WidgetReportError: ElementType;
}

const LatestContentTable: FC< LatestContentTableProps > = ( {
	WidgetReportError,
} ) => {
	const breakpoint = useBreakpoint();

	const viewOnlyDashboard = useViewOnly();

	const isGatheringData: boolean | undefined = useInViewSelect(
		( select: Select ) => select( MODULES_ANALYTICS_4 ).isGatheringData(),
		[]
	);

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

	const pagePaths = ( recentContent ?? [] )
		.filter( hasUniquePagePath )
		.map( ( { pagePath } ) => pagePath );

	const args = pagePaths.length
		? getLatestContentReportArgs( dates, pagePaths )
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
			<div className="googlesitekit-analytics-popular-pages-widget__error">
				<WidgetReportError
					moduleSlug="analytics-4"
					error={ recentContentError }
				/>
			</div>
		);
	}

	if (
		recentContent === undefined ||
		isGatheringData === undefined ||
		! reportLoaded
	) {
		return <PreviewTable padding />;
	}

	const rows = joinLatestContentRows(
		recentContent,
		reportError ? undefined : report
	);

	// With no metric columns there is nothing to switch between, so the
	// report error keeps the full layout on every screen size.
	const tabbedLayout =
		! reportError &&
		( breakpoint === BREAKPOINT_SMALL || breakpoint === BREAKPOINT_TABLET );

	const titleColumn = {
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

					return select( MODULES_ANALYTICS_4 ).getServiceReportURL(
						'all-pages-and-screens',
						{
							filters: { unifiedPagePathScreen: row.pagePath },
							dates,
						}
					);
				},
				[ row.pagePath ]
			);

			return (
				<div>
					{ tabbedLayout && (
						<span className="googlesitekit-analytics-popular-pages-widget__posted-meta">
							{ formatPublishedDate( row ) }{ ' ' }
							{ formatPublishedTime( row ) }
						</span>
					) }
					<DetailsPermaLinks
						title={ row.title }
						path={ row.pagePath }
						serviceURL={ serviceURL }
					/>
				</div>
			);
		},
	};

	const postedColumns = [
		{
			columnHeaderClassName: COLUMN_HEADER_CLASS_NAME,
			title: __( 'Posted', 'google-site-kit' ),
			description: __( 'Published date', 'google-site-kit' ),
			className:
				'googlesitekit-analytics-popular-pages-widget__posted-date',
			Component( { row }: { row: LatestContentRow } ) {
				return <span>{ formatPublishedDate( row ) }</span>;
			},
		},
		{
			columnHeaderClassName: COLUMN_HEADER_CLASS_NAME,
			title: __( 'Time', 'google-site-kit' ),
			description: __( 'Published time', 'google-site-kit' ),
			className:
				'googlesitekit-analytics-popular-pages-widget__posted-time',
			Component( { row }: { row: LatestContentRow } ) {
				return <span>{ formatPublishedTime( row ) }</span>;
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
			field: 'engagementRate',
			className: 'googlesitekit-table__head-item--engaged-sessions',
			Component( { fieldValue }: { fieldValue: number } ) {
				return <span>{ numFmt( fieldValue, '%' ) }</span>;
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

	let columns;

	if ( tabbedLayout ) {
		columns = [ titleColumn, ...metricColumns ];
	} else if ( reportError ) {
		columns = [ ...postedColumns, titleColumn ];
	} else {
		columns = [ ...postedColumns, titleColumn, ...metricColumns ];
	}

	const reportTable = (
		<ReportTable
			className={ classnames(
				'googlesitekit-analytics-popular-pages-widget__latest-content-table',
				{
					'googlesitekit-analytics-popular-pages-widget__report-table--tabbed-layout':
						tabbedLayout,
				}
			) }
			rows={ rows }
			columns={ columns }
			zeroState={ NoPublishedContentMessage }
			gatheringData={ isGatheringData }
			tabbedLayout={ tabbedLayout }
		/>
	);

	return (
		<Fragment>
			{ reportError && (
				<div className="googlesitekit-analytics-popular-pages-widget__report-error">
					<WidgetReportError
						moduleSlug="analytics-4"
						error={ reportError }
					/>
				</div>
			) }
			{ tabbedLayout ? (
				reportTable
			) : (
				<TableOverflowContainer>{ reportTable }</TableOverflowContainer>
			) }
		</Fragment>
	);
};

export default LatestContentTable;
