/**
 * ModulePopularPagesWidgetGA4 PDF component for @react-pdf/renderer.
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
import { View } from '@react-pdf/renderer';
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import PDFLink from '@/js/components/pdf-export/shared-react-pdf-components/PDFLink';
import { PDFTableColumn } from '@/js/components/pdf-export/shared-react-pdf-components/PDFTable';
import PDFTableSection from '@/js/components/pdf-export/shared-react-pdf-components/PDFTableSection';
import PDFTypography from '@/js/components/pdf-export/shared-react-pdf-components/PDFTypography';
import { PDFWidgetComponentProps } from '@/js/googlesitekit/widgets/types';
import { numFmt } from '@/js/util';
import { PopularPagesPDFData } from './getPDFData';

// Maximum URL characters shown in the Title column before the ellipsis.
const MAX_URL_LENGTH = 70;

const styles = createPDFStyles( {
	titleCell: {
		flexDirection: 'row',
	},
	rank: {
		minWidth: 20,
		marginRight: 8,
	},
	titleGroup: {
		flex: 1,
	},
} );

interface PopularPageRow {
	/** Position of the page in the table, starting at 1. */
	rank: number;
	/** Page title shown in the Title cell. */
	title: string;
	/** Page path shown under the title, shortened with an ellipsis when longer than `MAX_URL_LENGTH`. */
	displayURL: string;
	/** Analytics report link for the page, which the title links to. Empty when the page has no link, so the title renders as plain text. */
	serviceURL: string;
	/** The page's own public URL, which the URL line links to. Empty when the page has no link, so the URL line renders as plain text. */
	permaLink: string;
	/** Pageviews count, as the report's raw string. */
	pageviews: string;
	/** Sessions count, as the report's raw string. */
	sessions: string;
	/** Engagement rate as the report's raw string, a fraction between 0 and 1. */
	engagementRate: string;
	/** Average session duration in seconds, as the report's raw string. */
	sessionDuration: string;
}

const ModulePopularPagesWidgetGA4PDF: FC< PDFWidgetComponentProps > = ( {
	data,
} ) => {
	const heading = __( 'Top content over time', 'google-site-kit' );
	const popularPagesData = data as PopularPagesPDFData[ 'data' ];
	const rows = popularPagesData?.rows ?? [];
	const titles = popularPagesData?.titles ?? {};
	const links = popularPagesData?.links ?? {};

	const tableRows: PopularPageRow[] = rows.map( ( row, index ) => {
		const url = row.dimensionValues?.[ 0 ]?.value ?? '';
		const { serviceURL = '', permaLink = '' } = links[ url ] ?? {};
		const displayURL =
			url.length > MAX_URL_LENGTH
				? `${ url.slice( 0, MAX_URL_LENGTH ) }…`
				: url;

		return {
			rank: index + 1,
			title: titles[ url ] ?? '',
			displayURL,
			serviceURL,
			permaLink,
			pageviews: row.metricValues?.[ 0 ]?.value ?? '',
			sessions: row.metricValues?.[ 1 ]?.value ?? '',
			engagementRate: row.metricValues?.[ 2 ]?.value ?? '',
			sessionDuration: row.metricValues?.[ 3 ]?.value ?? '',
		};
	} );

	const columns: Array< PDFTableColumn< PopularPageRow > > = [
		{
			header: __( 'Title', 'google-site-kit' ),
			// 42.8% of the 1084px row, about 464px.
			width: '42.8%',
			// Shows the page title above its URL, with the row rank to the
			// left. The title links to the page's Analytics report, like the
			// dashboard widget, and the URL links to the page itself. When a
			// row has no links, `PDFLink` renders both lines as plain text
			// instead of as links.
			cell: ( row ) => (
				<View style={ styles.titleCell }>
					<PDFTypography style={ styles.rank }>
						{ `${ row.rank }.` }
					</PDFTypography>
					<View style={ styles.titleGroup }>
						<PDFLink href={ row.serviceURL }>{ row.title }</PDFLink>
						<PDFLink href={ row.permaLink } size="small">
							{ row.displayURL }
						</PDFLink>
					</View>
				</View>
			),
		},
		{
			header: __( 'Pageviews', 'google-site-kit' ),
			// 6.46% of the 1084px row, about 70px.
			width: '6.46%',
			align: 'right',
			format: ( row ) => numFmt( row.pageviews, { style: 'decimal' } ),
		},
		{
			header: __( 'Sessions', 'google-site-kit' ),
			// 10.15% of the 1084px row, about 110px.
			width: '10.15%',
			align: 'right',
			format: ( row ) => numFmt( row.sessions, { style: 'decimal' } ),
		},
		{
			header: __( 'Engaged sessions', 'google-site-kit' ),
			// 15.5% of the 1084px row, about 168px.
			width: '15.5%',
			align: 'right',
			// The "Engaged sessions" column shows the engagement rate metric,
			// formatted as a percentage.
			format: ( row ) => numFmt( row.engagementRate, '%' ),
		},
		{
			header: __( 'Session duration', 'google-site-kit' ),
			// 10.33% of the 1084px row, about 112px.
			width: '10.33%',
			align: 'right',
			// numFmt with 's' renders seconds as Xm Ys (for example 1m 38s or
			// 51s).
			format: ( row ) => numFmt( row.sessionDuration, 's' ),
		},
	];

	return (
		<PDFTableSection
			heading={ heading }
			columns={ columns }
			rows={ tableRows }
		/>
	);
};

export default ModulePopularPagesWidgetGA4PDF;
