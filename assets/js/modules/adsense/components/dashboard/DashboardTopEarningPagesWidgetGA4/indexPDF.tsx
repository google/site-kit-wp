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
	pageTitle: {
		flex: 1,
		color: PDF_COLORS.CONTENT_SECONDARY,
	},
	noData: {
		paddingHorizontal: 24,
		color: PDF_COLORS.SURFACES_ON_SURFACE_VARIANT,
	},
} );

interface TopEarningPageRow {
	rank: number;
	title: string;
	earnings: string;
}

const DashboardTopEarningPagesWidgetGA4PDF: FC< PDFWidgetComponentProps > = ( {
	data,
} ) => {
	const heading = __( 'Top earning pages', 'google-site-kit' );
	const topEarningPagesData = data as TopEarningPagesPDFData[ 'data' ];
	const rows = topEarningPagesData?.rows ?? [];
	const titles = topEarningPagesData?.titles ?? {};
	const currencyCode = topEarningPagesData?.currencyCode ?? '';

	// The report's first dimension is `pagePath`, so the first dimension value is
	// the page path, and the first metric value is its earnings.
	const tableRows: TopEarningPageRow[] = rows.map( ( row, index ) => {
		const pagePath = row.dimensionValues?.[ 0 ]?.value ?? '';

		return {
			rank: index + 1,
			title: titles[ pagePath ] ?? '',
			earnings: row.metricValues?.[ 0 ]?.value ?? '',
		};
	} );

	const columns: Array< PDFTableColumn< TopEarningPageRow > > = [
		{
			// The page title column has no header, matching the dashboard widget.
			header: '',
			// Shows the page title with the row rank to its left.
			cell: ( row ) => (
				<View style={ styles.pageCell }>
					<PDFTypography style={ styles.rank }>
						{ `${ row.rank }.` }
					</PDFTypography>
					<PDFTypography style={ styles.pageTitle }>
						{ row.title }
					</PDFTypography>
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

	// The report already limits the rows; an empty set renders a placeholder
	// inside the card rather than dropping the whole section.
	return (
		<PDFWidgetSection heading={ heading } cardStyle={ styles.card }>
			{ tableRows.length > 0 ? (
				<PDFTable
					columns={ columns }
					rows={ tableRows }
					columnGap={ 4 }
				/>
			) : (
				<PDFTypography style={ styles.noData }>
					{ __( 'No data available', 'google-site-kit' ) }
				</PDFTypography>
			) }
		</PDFWidgetSection>
	);
};

export default DashboardTopEarningPagesWidgetGA4PDF;
