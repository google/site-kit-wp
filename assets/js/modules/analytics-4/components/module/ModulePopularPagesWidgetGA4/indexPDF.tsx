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
import PDFTable, {
	PDFTableColumn,
} from '@/js/components/pdf-export/shared-react-pdf-components/PDFTable';
import { numFmt } from '@/js/util';
import { PopularPagesPDFData } from './getPDFData';

const styles = StyleSheet.create( {
	titleCell: {
		flexDirection: 'row',
	},
	rank: {
		fontSize: 9,
		// Dark neutral, matching the row numbers in the Figma.
		color: '#212121',
		width: 22,
	},
	titleGroup: {
		flex: 1,
	},
	title: {
		fontSize: 9,
		// Teal link colour ($c-teal-t-500), matching the dashboard page-title
		// links and the Figma.
		color: '#108080',
	},
	url: {
		fontSize: 7,
		color: '#646464',
	},
} );

export interface ModulePopularPagesWidgetGA4PDFProps {
	data?: PopularPagesPDFData[ 'data' ];
}

const ModulePopularPagesWidgetGA4PDF: FC<
	ModulePopularPagesWidgetGA4PDFProps
> = ( { data } ) => {
	const reportRows = data?.rows ?? [];
	const titles = data?.titles ?? {};

	const tableRows = reportRows.map( ( row, index ) => {
		const pagePath = row.dimensionValues?.[ 0 ]?.value ?? '';

		return {
			rank: index + 1,
			title: titles[ pagePath ] || pagePath,
			url: pagePath,
			pageviews: row.metricValues?.[ 0 ]?.value ?? '',
			sessions: row.metricValues?.[ 1 ]?.value ?? '',
			engagementRate: row.metricValues?.[ 2 ]?.value ?? '',
			sessionDuration: row.metricValues?.[ 3 ]?.value ?? '',
		};
	} );

	const columns: PDFTableColumn[] = [
		{
			title: __( 'Title', 'google-site-kit' ),
			width: '44%',
			// The Title cell stacks the page title above its URL, with the row
			// rank to the left, matching the Figma.
			cell: ( row ) => (
				<View style={ styles.titleCell }>
					<Text style={ styles.rank }>
						{ `${ String( row.rank ) }.` }
					</Text>
					<View style={ styles.titleGroup }>
						<Text style={ styles.title }>
							{ String( row.title ) }
						</Text>
						<Text style={ styles.url }>{ String( row.url ) }</Text>
					</View>
				</View>
			),
		},
		{
			title: __( 'Pageviews', 'google-site-kit' ),
			key: 'pageviews',
			align: 'right',
			format: ( value ) => numFmt( value, { style: 'decimal' } ),
		},
		{
			title: __( 'Sessions', 'google-site-kit' ),
			key: 'sessions',
			align: 'right',
			format: ( value ) => numFmt( value, { style: 'decimal' } ),
		},
		{
			title: __( 'Engaged sessions', 'google-site-kit' ),
			key: 'engagementRate',
			align: 'right',
			// The Figma labels this column "Engaged sessions", but the value is
			// the engagement rate metric the dashboard shows, formatted as a
			// percentage.
			format: ( value ) => numFmt( value, '%' ),
		},
		{
			title: __( 'Session duration', 'google-site-kit' ),
			key: 'sessionDuration',
			align: 'right',
			// numFmt with 's' renders seconds in the narrow Xm Ys form, such as
			// 1m 38s or 51s, matching the dashboard widget.
			format: ( value ) => numFmt( value, 's' ),
		},
	];

	return <PDFTable columns={ columns } rows={ tableRows } />;
};

export default ModulePopularPagesWidgetGA4PDF;
