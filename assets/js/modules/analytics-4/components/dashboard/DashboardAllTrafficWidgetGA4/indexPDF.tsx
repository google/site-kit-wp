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
import { Image, View } from '@react-pdf/renderer';
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import { PIE_CHART_COLORS } from '@/js/components/pdf-export/pie-chart-colors';
import PDFCard from '@/js/components/pdf-export/shared-react-pdf-components/PDFCard';
import PDFMetricTile from '@/js/components/pdf-export/shared-react-pdf-components/PDFMetricTile';
import PDFPieChartTile from '@/js/components/pdf-export/shared-react-pdf-components/PDFPieChartTile';
import PDFTypography from '@/js/components/pdf-export/shared-react-pdf-components/PDFTypography';
import { PDFWidgetComponentProps } from '@/js/googlesitekit/widgets/types';
import { calculateChange, numFmt } from '@/js/util';
import { AllTrafficPDFData, BreakdownRow } from './getPDFData';

const styles = createPDFStyles( {
	heading: {
		marginBottom: 15,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'stretch',
	},
	rowSpacing: {
		marginTop: 24,
	},
	card: {
		flexGrow: 1,
		flexShrink: 1,
		flexBasis: 0,
	},
	cardGap: {
		width: 24,
	},
	chart: {
		width: '100%',
		// Fit the line chart to the card width without stretching it.
		height: 133,
		objectFit: 'contain',
		marginTop: 7,
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
 * @param breakdown Ordered `{ label, percentage }` rows, or `null`.
 * @return Legend rows of `{ label, percentage, color }`.
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

const DashboardAllTrafficWidgetGA4PDF: FC< PDFWidgetComponentProps > = ( {
	data,
	chartImages,
} ) => {
	const trafficData = data as AllTrafficPDFData[ 'data' ] | undefined;
	const trafficChartImages =
		chartImages as AllTrafficPDFData[ 'chartImages' ];

	// Without data the widget returns null, and no placeholder takes its place.
	if ( ! trafficData ) {
		return null;
	}

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

	const lineChartImage = trafficChartImages?.lineChart;

	// A breakdown whose report or donut render failed adds no card, and no
	// placeholder takes its place.
	const breakdownTiles = [
		{
			key: 'channels',
			title: __( 'Visitors by channels', 'google-site-kit' ),
			rows: channelBreakdown,
			chartImage: trafficChartImages?.channelChart,
		},
		{
			key: 'locations',
			title: __( 'Visitors by locations', 'google-site-kit' ),
			rows: locationBreakdown,
			chartImage: trafficChartImages?.locationChart,
		},
		{
			key: 'devices',
			title: __( 'Visitors by devices', 'google-site-kit' ),
			rows: deviceBreakdown,
			chartImage: trafficChartImages?.deviceChart,
		},
	].filter( ( { rows, chartImage } ) => !! ( rows?.length && chartImage ) );

	// Every card that renders, in dashboard order: the All visitors tile
	// first, then the surviving breakdown donuts.
	const cards = [
		{
			key: 'all-visitors',
			content: (
				<Fragment>
					<PDFMetricTile
						title={ __( 'All visitors', 'google-site-kit' ) }
						value={ formattedValue }
						change={ changeText }
						isNegative={ typeof change === 'number' && change < 0 }
						changeLabel={ comparisonLabel }
					/>
					{ lineChartImage && (
						<Image src={ lineChartImage } style={ styles.chart } />
					) }
				</Fragment>
			),
		},
		...breakdownTiles.map( ( { key, title, rows, chartImage } ) => ( {
			key,
			content: (
				<PDFPieChartTile
					title={ title }
					rows={ buildLegendRows( rows ) }
					chartImage={ chartImage }
				/>
			),
		} ) ),
	];

	// Pair the cards into rows of two, so the grid fills row by row with the
	// cards that have data instead of leaving holes where the others were.
	const cardRows: Array< typeof cards > = [];
	for ( let index = 0; index < cards.length; index += 2 ) {
		cardRows.push( cards.slice( index, index + 2 ) );
	}

	return (
		<View>
			<PDFTypography size="large" style={ styles.heading }>
				{ __( 'Your site traffic over time', 'google-site-kit' ) }
			</PDFTypography>
			{ cardRows.map( ( [ leftCard, rightCard ], rowIndex ) => (
				<View
					key={ leftCard.key }
					style={
						rowIndex === 0
							? styles.row
							: [ styles.row, styles.rowSpacing ]
					}
				>
					<PDFCard style={ styles.card }>
						{ leftCard.content }
					</PDFCard>
					<View style={ styles.cardGap } />
					{ rightCard ? (
						<PDFCard style={ styles.card }>
							{ rightCard.content }
						</PDFCard>
					) : (
						// An invisible spacer holds a lone card at its half
						// width, so the card keeps the two-column size.
						<View style={ styles.card } />
					) }
				</View>
			) ) }
		</View>
	);
};

export default DashboardAllTrafficWidgetGA4PDF;
