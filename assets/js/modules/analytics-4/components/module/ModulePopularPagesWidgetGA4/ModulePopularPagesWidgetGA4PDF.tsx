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
import { StyleSheet, Text, View } from '@react-pdf/renderer';
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PDF_FONT_FAMILY_TEXT } from '@/js/components/pdf-export/pdf-theme';
import PDFTable, {
	PDFTableColumn,
} from '@/js/components/pdf-export/shared-react-pdf-components/PDFTable';
import PDFWidgetSection from '@/js/components/pdf-export/shared-react-pdf-components/PDFWidgetSection';
import { PDFWidgetComponentProps } from '@/js/googlesitekit/widgets/types';
import { numFmt } from '@/js/util';
import { PopularPagesPDFData } from './getPDFData';

const bodyTextStyles = {
	fontFamily: PDF_FONT_FAMILY_TEXT,
	fontSize: 7,
	lineHeight: 1.43,
	letterSpacing: 0.125,
};

const PAGE_LINK_COLOR = '#108080';

// Maximum URL characters shown in the Title column before the ellipsis.
const MAX_URL_LENGTH = 70;

const styles = StyleSheet.create( {
	titleCell: {
		flexDirection: 'row',
	},
	rank: {
		...bodyTextStyles,
		color: '#161b18',
		minWidth: 10,
		marginRight: 4,
	},
	titleGroup: {
		flex: 1,
	},
	title: {
		...bodyTextStyles,
		color: PAGE_LINK_COLOR,
	},
	url: {
		fontFamily: PDF_FONT_FAMILY_TEXT,
		fontSize: 6,
		lineHeight: 1.33,
		letterSpacing: 0.1,
		color: PAGE_LINK_COLOR,
	},
	noData: {
		fontFamily: PDF_FONT_FAMILY_TEXT,
		fontSize: 9,
		color: '#646464',
	},
} );

interface PopularPageRow {
	rank: number;
	title: string;
	url: string;
	pageviews: string;
	sessions: string;
	engagementRate: string;
	sessionDuration: string;
}

const ModulePopularPagesWidgetGA4PDF: FC< PDFWidgetComponentProps > = ( {
	data,
} ) => {
	const heading = __( 'Top content over time', 'google-site-kit' );
	const popularPagesData = data as PopularPagesPDFData[ 'data' ];
	const rows = popularPagesData?.rows ?? [];
	const titles = popularPagesData?.titles ?? {};

	const tableRows: PopularPageRow[] = rows.map( ( row, index ) => {
		const url = row.dimensionValues?.[ 0 ]?.value ?? '';

		return {
			rank: index + 1,
			title: titles[ url ] ?? '',
			url,
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
			// Shows the page title above its URL, with the row rank to the left.
			cell: ( row ) => (
				<View style={ styles.titleCell }>
					<Text style={ styles.rank }>{ `${ row.rank }.` }</Text>
					<View style={ styles.titleGroup }>
						<Text style={ styles.title }>{ row.title }</Text>
						<Text style={ styles.url }>
							{ row.url.length > MAX_URL_LENGTH
								? `${ row.url.slice( 0, MAX_URL_LENGTH ) }…`
								: row.url }
						</Text>
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

	const hasRows = tableRows.length > 0;
	const cardStyle = {
		borderRadius: 8,
		paddingVertical: 8,
		paddingHorizontal: hasRows ? 0 : 12,
	};

	return (
		<PDFWidgetSection heading={ heading } cardStyle={ cardStyle }>
			{ hasRows ? (
				<PDFTable columns={ columns } rows={ tableRows } />
			) : (
				<Text style={ styles.noData }>
					{ __( 'No data available.', 'google-site-kit' ) }
				</Text>
			) }
		</PDFWidgetSection>
	);
};

export default ModulePopularPagesWidgetGA4PDF;
