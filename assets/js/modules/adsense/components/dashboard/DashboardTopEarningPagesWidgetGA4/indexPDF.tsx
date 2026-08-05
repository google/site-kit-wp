/**
 * DashboardTopEarningPagesWidgetGA4 PDF component for @react-pdf/renderer.
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
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import PDFTable, {
	PDFTableColumn,
} from '@/js/components/pdf-export/shared-react-pdf-components/PDFTable';
import PDFTruncatedValue from '@/js/components/pdf-export/shared-react-pdf-components/PDFTruncatedValue';
import PDFTypography from '@/js/components/pdf-export/shared-react-pdf-components/PDFTypography';
import PDFWidgetSection from '@/js/components/pdf-export/shared-react-pdf-components/PDFWidgetSection';
import { PDFWidgetComponentProps } from '@/js/googlesitekit/widgets/types';
import { numFmt } from '@/js/util';
import { TopEarningPagesPDFData } from './getPDFData';

const styles = createPDFStyles( {
	// The table owns the row padding, so the card drops its horizontal padding
	// and keeps the vertical padding, matching PDFTableSection.
	card: {
		paddingVertical: 16,
		paddingHorizontal: 0,
	},
	pageCell: {
		flexDirection: 'row',
		columnGap: 4,
	},
	rank: {
		color: PDF_COLORS.SURFACES_ON_SURFACE,
	},
} );

interface TopEarningPageRow {
	/** Position of the page in the table, starting at 1. */
	rank: number;
	/** Page title shown in the first cell. */
	title: string;
	/** Analytics report link for the page, which the title links to. Empty when the page has no link, so the title renders as plain text. */
	serviceURL: string;
	/** Earnings amount, as the report's raw string. */
	earnings: string;
}

const DashboardTopEarningPagesWidgetGA4PDF: FC< PDFWidgetComponentProps > = ( {
	data,
} ) => {
	const topEarningPagesData = data as TopEarningPagesPDFData | null;
	const rows = topEarningPagesData?.rows ?? [];
	const titles = topEarningPagesData?.titles ?? {};
	const links = topEarningPagesData?.links ?? {};
	const currencyCode = topEarningPagesData?.currencyCode ?? '';

	// The report's first dimension is `pagePath`, so the first dimension value is
	// the page path, and the first metric value is its earnings.
	const tableRows: TopEarningPageRow[] = rows.map( ( row, index ) => {
		const pagePath = row.dimensionValues?.[ 0 ]?.value ?? '';

		return {
			rank: index + 1,
			title: titles[ pagePath ] ?? '',
			serviceURL: links[ pagePath ] ?? '',
			earnings: row.metricValues?.[ 0 ]?.value ?? '',
		};
	} );

	if ( tableRows.length === 0 ) {
		return null;
	}

	const heading = __( 'Top earning pages', 'google-site-kit' );

	const columns: Array< PDFTableColumn< TopEarningPageRow > > = [
		{
			// The page title column has no header, matching the dashboard widget.
			header: '',
			// Shows the page title with the row rank to its left. The title
			// links to the page's Analytics report, like the dashboard widget.
			// A long title truncates to one line and never overlaps the Earnings
			// column. A title with no URL renders as plain text.
			cell: ( row ) => (
				<View style={ styles.pageCell }>
					<PDFTypography style={ styles.rank }>
						{ `${ row.rank }.` }
					</PDFTypography>
					<PDFTruncatedValue href={ row.serviceURL }>
						{ row.title }
					</PDFTruncatedValue>
				</View>
			),
		},
		{
			header: __( 'Earnings', 'google-site-kit' ),
			// 15% of the row, aligned right like the dashboard widget.
			width: '15%',
			align: 'right',
			format: ( row ) =>
				numFmt( row.earnings, {
					style: 'currency',
					currency: currencyCode,
				} ),
		},
	];

	return (
		<PDFWidgetSection heading={ heading } cardStyle={ styles.card }>
			<PDFTable columns={ columns } rows={ tableRows } columnGap={ 4 } />
		</PDFWidgetSection>
	);
};

export default DashboardTopEarningPagesWidgetGA4PDF;
