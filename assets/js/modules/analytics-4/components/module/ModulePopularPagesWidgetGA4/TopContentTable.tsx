/**
 * TopContentTable component.
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
import { cloneDeep } from 'lodash';
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
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '@/js/hooks/useBreakpoint';
import useViewOnly from '@/js/hooks/useViewOnly';
import { ZeroDataMessage } from '@/js/modules/analytics-4/components/common';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { Report, ReportRow } from '@/js/modules/analytics-4/datastore/types';
import { numFmt } from '@/js/util';
import Footer from './Footer';
import { getPopularPagesReportOptions } from './reportOptions';

export interface TopContentTableProps {
	/** The widget wrapper the table renders in. */
	Widget: ElementType;
	/** The component the table renders when the report fails. */
	WidgetReportError: ElementType;
	/** The widget header, if any. */
	Header?: ElementType;
	/** The tab bar rendered above the table, if any. */
	tabBar?: ReactNode;
}

const TopContentTable: FC< TopContentTableProps > = ( {
	Widget,
	WidgetReportError,
	Header,
	tabBar,
} ) => {
	const widgetClassName = tabBar
		? 'googlesitekit-analytics-popular-pages-widget--tabbed'
		: undefined;

	const breakpoint = useBreakpoint();

	const isGatheringData = useInViewSelect( ( select: Select ) =>
		select( MODULES_ANALYTICS_4 ).isGatheringData()
	);

	const dates = useSelect(
		( select: Select ) => select( CORE_USER ).getDateRangeDates(),
		[]
	);

	const viewOnlyDashboard = useViewOnly();

	const args = {
		...dates,
		...getPopularPagesReportOptions(),
	};

	const error = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getErrorForSelector( 'getReport', [
				args,
			] ),
		[ args ]
	);

	const report: Report | undefined = useInViewSelect(
		( select: Select ) => select( MODULES_ANALYTICS_4 ).getReport( args ),
		[ args ]
	);

	const titles: Record< string, string > | undefined = useInViewSelect(
		( select: Select ) =>
			! error
				? select( MODULES_ANALYTICS_4 ).getPageTitles( report, args )
				: undefined,
		[ error, report, args ]
	);

	const loaded = useSelect(
		( select: Select ) => {
			const reportLoaded = select(
				MODULES_ANALYTICS_4
			).hasFinishedResolution( 'getReport', [ args ] );

			return (
				undefined !== error || ( reportLoaded && undefined !== titles )
			);
		},
		[ args, error, titles ]
	);

	const loading = ! loaded || isGatheringData === undefined;

	if ( loading ) {
		return (
			<Widget
				className={ widgetClassName }
				Header={ Header }
				Footer={ Footer }
				noPadding
			>
				{ tabBar }
				<PreviewTable padding />
			</Widget>
		);
	}

	if ( error ) {
		return (
			<Widget
				className={ widgetClassName }
				Header={ Header }
				Footer={ Footer }
			>
				{ tabBar }
				<WidgetReportError moduleSlug="analytics-4" error={ error } />
			</Widget>
		);
	}

	const columnClassName =
		'googlesitekit-typography googlesitekit-typography--title googlesitekit-typography--small';

	const tableColumns = [
		{
			columnHeaderClassName: columnClassName,
			title: __( 'Title', 'google-site-kit' ),
			description: __( 'Page Title', 'google-site-kit' ),
			primary: true,
			Component( { row }: { row: Required< ReportRow > } ) {
				const [ { value: title }, { value: url } ] =
					row.dimensionValues;
				const serviceURL = useSelect(
					( select: Select ) => {
						if ( viewOnlyDashboard ) {
							return null;
						}

						return select(
							MODULES_ANALYTICS_4
						).getServiceReportURL( 'all-pages-and-screens', {
							filters: { unifiedPagePathScreen: url },
							dates,
						} );
					},
					[ url ]
				);

				return (
					<DetailsPermaLinks
						title={ title }
						path={ url }
						serviceURL={ serviceURL }
					/>
				);
			},
		},
		{
			columnHeaderClassName: columnClassName,
			title: __( 'Pageviews', 'google-site-kit' ),
			description: __( 'Pageviews', 'google-site-kit' ),
			field: 'metricValues.0.value',
			className: 'googlesitekit-table__head-item--pageviews',
			Component( { fieldValue }: { fieldValue: string } ) {
				return (
					<span>{ numFmt( fieldValue, { style: 'decimal' } ) }</span>
				);
			},
		},
		{
			columnHeaderClassName: columnClassName,
			title: __( 'Sessions', 'google-site-kit' ),
			description: __( 'Sessions', 'google-site-kit' ),
			field: 'metricValues.1.value',
			className: 'googlesitekit-table__head-item--sessions',
			Component( { fieldValue }: { fieldValue: string } ) {
				return (
					<span>{ numFmt( fieldValue, { style: 'decimal' } ) }</span>
				);
			},
		},
		{
			columnHeaderClassName: columnClassName,
			title: __( 'Engagement Rate', 'google-site-kit' ),
			description: __( 'Engagement Rate', 'google-site-kit' ),
			field: 'metricValues.2.value',
			className: 'googlesitekit-table__head-item--engagement-rate',
			Component( { fieldValue }: { fieldValue: string } ) {
				return <span>{ numFmt( fieldValue, '%' ) }</span>;
			},
		},
		{
			columnHeaderClassName: columnClassName,
			title: __( 'Session Duration', 'google-site-kit' ),
			description: __( 'Session Duration', 'google-site-kit' ),
			field: 'metricValues.3.value',
			Component( { fieldValue }: { fieldValue: string } ) {
				return <span>{ numFmt( fieldValue, 's' ) }</span>;
			},
		},
	];

	const rows: Required< ReportRow >[] = report?.rows?.length
		? cloneDeep( report.rows as Required< ReportRow >[] )
		: [];
	const ZeroState = ZeroDataMessage;

	// Combine the titles from the pageTitles with the rows from the metrics report.
	rows.forEach( ( row ) => {
		const url = row.dimensionValues[ 0 ].value;
		// We always have an entry for titles[url].
		row.dimensionValues.unshift( {
			value: ( titles as Record< string, string > )[ url ],
		} );
	} );

	const tabbedLayout =
		breakpoint === BREAKPOINT_SMALL || breakpoint === BREAKPOINT_TABLET;

	const reportTable = (
		<ReportTable
			className={ classnames( {
				'googlesitekit-analytics-popular-pages-widget__report-table--tabbed-layout':
					tabbedLayout,
			} ) }
			rows={ rows }
			columns={ tableColumns }
			zeroState={ ZeroState }
			gatheringData={ isGatheringData }
			tabbedLayout={ tabbedLayout }
		/>
	);

	return (
		<Widget
			className={ widgetClassName }
			Header={ Header }
			Footer={ Footer }
			noPadding
		>
			{ tabBar }
			{ tabbedLayout ? (
				reportTable
			) : (
				<TableOverflowContainer>{ reportTable }</TableOverflowContainer>
			) }
		</Widget>
	);
};

export default TopContentTable;
