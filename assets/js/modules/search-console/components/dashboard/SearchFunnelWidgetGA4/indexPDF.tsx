/**
 * SearchFunnelWidgetGA4 PDF component for @react-pdf/renderer.
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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import PDFMetricChartTile from '@/js/components/pdf-export/shared-react-pdf-components/PDFMetricChartTile';
import PDFTypography from '@/js/components/pdf-export/shared-react-pdf-components/PDFTypography';
import { numFmt } from '@/js/util';
import { SearchFunnelMetric, SearchFunnelPDFData } from './getPDFData';

const styles = createPDFStyles( {
	heading: {
		marginBottom: 15,
	},
	grid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		rowGap: 24,
	},
	cell: {
		width: '48.94%',
	},
} );

interface CardDefinition {
	/** Metric key that selects the card's data and chart image. */
	key: 'impressions' | 'clicks' | 'uniqueVisitors' | 'keyEvents';
	/** Card title, like "Total impressions". */
	title: string;
	/** Current-period series label. */
	currentLabel: string;
	/** Series color for the legend swatch, matching the chart lines. */
	color: string;
}

/** The cards render in the 2x2 grid in this order. */
const CARDS: CardDefinition[] = [
	{
		key: 'impressions',
		title: __( 'Total impressions', 'google-site-kit' ),
		currentLabel: __( 'Impressions', 'google-site-kit' ),
		color: PDF_COLORS.BLUE_B_400,
	},
	{
		key: 'clicks',
		title: __( 'Total clicks', 'google-site-kit' ),
		currentLabel: __( 'Clicks', 'google-site-kit' ),
		color: PDF_COLORS.TEAL_T_300,
	},
	{
		key: 'uniqueVisitors',
		title: __( 'Unique visitors from Search', 'google-site-kit' ),
		currentLabel: __( 'Unique visitors', 'google-site-kit' ),
		color: PDF_COLORS.SITE_KIT_SK_500,
	},
	{
		key: 'keyEvents',
		title: __( 'Key events', 'google-site-kit' ),
		currentLabel: __( 'Key events', 'google-site-kit' ),
		color: PDF_COLORS.VIOLET_V_300,
	},
];

/**
 * Derives the change chip props from a metric's period-over-period change ratio.
 *
 * @since n.e.x.t
 *
 * @param metric The metric data, if any.
 * @return Props for the change chip (empty when the change is unavailable).
 */
function getChangeProps( metric: SearchFunnelMetric | null ): {
	change?: string;
	changeDirection?: 'up' | 'down';
} {
	const change = metric?.change;

	if ( typeof change !== 'number' ) {
		return {};
	}

	return {
		change: numFmt( Math.abs( change ), {
			style: 'percent',
			maximumFractionDigits: 1,
		} ),
		changeDirection: change >= 0 ? 'up' : 'down',
	};
}

export interface SearchFunnelWidgetGA4PDFProps {
	/** Metric totals and changes from `getPDFData`. */
	data?: SearchFunnelPDFData[ 'data' ];
	/** Rendered line chart images from `getPDFData`, one per metric. */
	chartImages?: SearchFunnelPDFData[ 'chartImages' ];
}

const SearchFunnelWidgetGA4PDF: FC< SearchFunnelWidgetGA4PDFProps > = ( {
	data,
	chartImages,
} ) => {
	// Without data the widget returns null, and no placeholder takes its place.
	if ( ! data ) {
		return null;
	}

	const { dateRangeLength, metrics } = data;

	const changeLabel = sprintf(
		/* translators: %d: number of days in the comparison period */
		__( 'Vs. prev. %d days', 'google-site-kit' ),
		dateRangeLength
	);

	return (
		<View>
			{ /* This widget shares the Traffic area with the All Visitors widget, so it
			     renders its own heading. */ }
			<PDFTypography size="large" style={ styles.heading }>
				{ __( 'Search traffic over time', 'google-site-kit' ) }
			</PDFTypography>
			<View style={ styles.grid }>
				{ CARDS.map( ( { key, title, currentLabel, color } ) => {
					const metric = metrics[ key ];
					const chartImage = chartImages?.[ key ];

					// The widget skips a card whose metric failed. The loader
					// fails the whole widget when every card fails, so the
					// heading never renders above an empty grid.
					if ( ! chartImage ) {
						return null;
					}

					return (
						<View key={ key } style={ styles.cell }>
							<PDFMetricChartTile
								title={ title }
								value={ numFmt( metric?.total || 0 ) }
								changeLabel={ changeLabel }
								currentLabel={ currentLabel }
								color={ color }
								chartImage={ chartImage }
								{ ...getChangeProps( metric ) }
							/>
						</View>
					);
				} ) }
			</View>
		</View>
	);
};

export default SearchFunnelWidgetGA4PDF;
