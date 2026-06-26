/**
 * DashboardAllTrafficWidgetGA4 PDF component for @react-pdf/renderer.
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
import { Image, StyleSheet, Text, View } from '@react-pdf/renderer';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PDF_FONT_FAMILY_TEXT } from '@/js/components/pdf-export/pdf-theme';
import { PIE_CHART_COLORS } from '@/js/components/pdf-export/pie-chart-colors';
import PDFMetricTile from '@/js/components/pdf-export/shared-react-pdf-components/PDFMetricTile';
import PDFNoData from '@/js/components/pdf-export/shared-react-pdf-components/PDFNoData';
import PDFPieChartTile from '@/js/components/pdf-export/shared-react-pdf-components/PDFPieChartTile';
import type { PDFWidgetComponentProps } from '@/js/googlesitekit/widgets/types';
import { calculateChange, numFmt } from '@/js/util';
import type { AllTrafficPDFData, BreakdownRow } from './getPDFData';

const styles = StyleSheet.create( {
	heading: {
		fontFamily: PDF_FONT_FAMILY_TEXT,
		fontSize: 8,
		letterSpacing: 0.25,
		lineHeight: 1.5,
		color: '#161b18',
		marginBottom: 8,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'stretch',
	},
	rowSpacing: {
		marginTop: 12,
	},
	card: {
		flexGrow: 1,
		flexShrink: 1,
		flexBasis: 0,
		backgroundColor: '#ffffff',
		borderRadius: 8,
		padding: 12,
	},
	cardGap: {
		width: 12,
	},
	chart: {
		width: '100%',
		// Fit the line chart to the card width without stretching it.
		height: 88,
		objectFit: 'contain',
		marginTop: 12,
	},
} );

/**
 * Builds the legend rows for a breakdown donut.
 *
 * Pairs each segment with its color by index, and formats its share as a
 * percentage. The color order matches the donut, because both read
 * `PIE_CHART_COLORS` in the same slice order.
 *
 * @since n.e.x.t
 *
 * @param {Array<Object>|null} breakdown Ordered `{ label, percentage }` rows, or `null`.
 * @return {Array<Object>} Legend rows of `{ label, percentage, color }`.
 */
function buildLegendRows( breakdown: BreakdownRow[] | null | undefined ) {
	return ( breakdown || [] ).map( ( { label, percentage }, index ) => ( {
		label,
		percentage: numFmt( percentage, {
			style: 'percent',
			maximumFractionDigits: 1,
		} ),
		// A breakdown has at most 5 rows, so each row maps to one of the 5 colors.
		color: PIE_CHART_COLORS[ index ],
	} ) );
}

export default function DashboardAllTrafficWidgetGA4PDF( {
	data,
	chartImages,
}: PDFWidgetComponentProps ) {
	const trafficData = data as AllTrafficPDFData[ 'data' ];

	let body;

	if ( ! trafficData ) {
		body = (
			<View style={ styles.card }>
				<PDFNoData />
			</View>
		);
	} else {
		const {
			totalsReport,
			graphReport,
			channelBreakdown,
			locationBreakdown,
			deviceBreakdown,
		} = trafficData;

		const [ current, previous ] = totalsReport?.totals || [];
		const currentValue = Number( current?.metricValues?.[ 0 ]?.value );
		const previousValue = Number( previous?.metricValues?.[ 0 ]?.value );

		const change = calculateChange( previousValue, currentValue );
		const changeText =
			typeof change === 'number'
				? numFmt( change, {
						style: 'percent',
						signDisplay: 'exceptZero',
						maximumFractionDigits: 1,
				  } )
				: undefined;

		const graphRowCount = graphReport?.rows?.length || 0;
		const comparisonLabel =
			graphRowCount > 0
				? sprintf(
						/* translators: %d: number of days in the comparison period */
						__( 'Vs. prev. %d days', 'google-site-kit' ),
						graphRowCount
				  )
				: undefined;

		const formattedValue = numFmt( currentValue || 0 );

		const lineChart = chartImages?.lineChart;

		body = (
			<Fragment>
				<View style={ styles.row }>
					<View style={ styles.card }>
						<PDFMetricTile
							title={ __( 'All visitors', 'google-site-kit' ) }
							value={ formattedValue }
							change={ changeText }
							isNegative={
								typeof change === 'number' && change < 0
							}
							changeLabel={ comparisonLabel }
						/>
						{ lineChart ? (
							<Image src={ lineChart } style={ styles.chart } />
						) : (
							<PDFNoData />
						) }
					</View>
					<View style={ styles.cardGap } />
					<View style={ styles.card }>
						<PDFPieChartTile
							title={ __(
								'Visitors by channels',
								'google-site-kit'
							) }
							rows={ buildLegendRows( channelBreakdown ) }
							chartImage={ chartImages?.channelChart }
						/>
					</View>
				</View>
				<View style={ [ styles.row, styles.rowSpacing ] }>
					<View style={ styles.card }>
						<PDFPieChartTile
							title={ __(
								'Visitors by locations',
								'google-site-kit'
							) }
							rows={ buildLegendRows( locationBreakdown ) }
							chartImage={ chartImages?.locationChart }
						/>
					</View>
					<View style={ styles.cardGap } />
					<View style={ styles.card }>
						<PDFPieChartTile
							title={ __(
								'Visitors by devices',
								'google-site-kit'
							) }
							rows={ buildLegendRows( deviceBreakdown ) }
							chartImage={ chartImages?.deviceChart }
						/>
					</View>
				</View>
			</Fragment>
		);
	}

	return (
		<View>
			<Text style={ styles.heading }>
				{ __( 'Your site traffic over time', 'google-site-kit' ) }
			</Text>
			{ body }
		</View>
	);
}
