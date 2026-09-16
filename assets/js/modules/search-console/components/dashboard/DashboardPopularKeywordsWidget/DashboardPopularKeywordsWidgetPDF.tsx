/**
 * DashboardPopularKeywordsWidget PDF component for `@react-pdf/renderer`.
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
import { PopularKeywordsPDFData } from './getPDFData';

const styles = createPDFStyles( {
	queryCell: {
		flexDirection: 'row',
	},
	rank: {
		minWidth: 20,
		marginRight: 8,
	},
} );

interface SearchQueryRow {
	/** Position of the query in the table, starting at 1. */
	rank: number;
	/** The search query text. */
	query: string;
	/** Search Console report link for the query. Empty when the query has no link, so the query renders as plain text. */
	queryURL: string;
	/** Number of clicks for the query. */
	clicks: number;
	/** Number of impressions for the query. */
	impressions: number;
}

const DashboardPopularKeywordsWidgetPDF: FC< PDFWidgetComponentProps > = ( {
	data,
} ) => {
	const heading = __( 'Top search queries for your site', 'google-site-kit' );
	const popularKeywordsData = data as PopularKeywordsPDFData[ 'data' ];
	const rows = popularKeywordsData?.rows ?? [];
	const links = popularKeywordsData?.links ?? {};

	// The query report has one dimension, so the first key is the query.
	const tableRows: SearchQueryRow[] = rows.map( ( row, index ) => {
		const query = row.keys?.[ 0 ] ?? '';

		return {
			rank: index + 1,
			query,
			queryURL: links[ query ] ?? '',
			clicks: row.clicks,
			impressions: row.impressions,
		};
	} );

	const columns: Array< PDFTableColumn< SearchQueryRow > > = [
		{
			header: __( 'Search query', 'google-site-kit' ),
			// 66.7% of the 1084px row (723px).
			width: '66.7%',
			// Show the rank number before the query. The query links to its
			// Search Console report, like the dashboard widget.
			cell: ( row ) => (
				<View style={ styles.queryCell }>
					<PDFTypography style={ styles.rank }>
						{ `${ row.rank }.` }
					</PDFTypography>
					<PDFTypography truncateContent>
						<PDFLink href={ row.queryURL }>{ row.query }</PDFLink>
					</PDFTypography>
				</View>
			),
		},
		{
			header: __( 'Clicks', 'google-site-kit' ),
			// 3.69% of the 1084px row (40px).
			width: '3.69%',
			align: 'right',
			format: ( row ) => numFmt( row.clicks, { style: 'decimal' } ),
		},
		{
			header: __( 'Impressions', 'google-site-kit' ),
			// 28.87% of the 1084px row (313px).
			width: '28.87%',
			align: 'right',
			format: ( row ) => numFmt( row.impressions, { style: 'decimal' } ),
		},
	];

	return (
		<PDFTableSection
			heading={ heading }
			columns={ columns }
			rows={ tableRows }
			columnGap={ 8 }
		/>
	);
};

export default DashboardPopularKeywordsWidgetPDF;
