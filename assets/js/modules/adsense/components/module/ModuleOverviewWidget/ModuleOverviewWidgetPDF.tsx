/**
 * ModuleOverviewWidgetPDF component for @react-pdf/renderer.
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
import {
	ModuleOverviewMetric,
	ModuleOverviewMetricKey,
	ModuleOverviewPDFData,
} from './getPDFData';

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

/**
 * Formats a currency metric total from the report's currency code.
 *
 * Without a currency code the value falls back to a plain grouped number, so
 * the card never shows the wrong currency.
 *
 * @since n.e.x.t
 *
 * @param total        The metric total.
 * @param currencyCode Currency code from the AdSense report, if any.
 * @return The formatted value.
 */
function formatCurrencyValue( total: number, currencyCode?: string ): string {
	if ( ! currencyCode ) {
		return numFmt( total, { style: 'decimal' } );
	}

	return numFmt( total, currencyCode );
}

interface CardDefinition {
	/** Metric key that selects the card's data and chart image. */
	key: ModuleOverviewMetricKey;
	/** Card title, also the current-period legend label, like "Earnings". */
	title: string;
	/** Series color for the legend swatch, matching the chart lines. */
	color: string;
	/** Formats the card's headline value. */
	formatValue: ( total: number, currencyCode?: string ) => string;
}

/** The cards render in the 2x2 grid in this order. */
const CARDS: CardDefinition[] = [
	{
		key: 'estimatedEarnings',
		title: __( 'Earnings', 'google-site-kit' ),
		color: PDF_COLORS.BLUE_B_400,
		formatValue: formatCurrencyValue,
	},
	{
		key: 'pageRPM',
		title: __( 'Page RPM', 'google-site-kit' ),
		color: PDF_COLORS.TEAL_T_300,
		formatValue: formatCurrencyValue,
	},
	{
		key: 'impressions',
		title: __( 'Impressions', 'google-site-kit' ),
		color: PDF_COLORS.SITE_KIT_SK_500,
		formatValue: ( total ) => numFmt( total, { style: 'decimal' } ),
	},
	{
		key: 'pageCTR',
		title: __( 'Page CTR', 'google-site-kit' ),
		color: PDF_COLORS.VIOLET_V_300,
		formatValue: ( total ) => numFmt( total, '%' ),
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
function getChangeProps( metric: ModuleOverviewMetric | null ): {
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

export interface ModuleOverviewWidgetPDFProps {
	/** Metric totals and changes from `getPDFData`. */
	data?: ModuleOverviewPDFData[ 'data' ];
	/** Rendered line chart images from `getPDFData`, one per metric. */
	chartImages?: ModuleOverviewPDFData[ 'chartImages' ];
}

const ModuleOverviewWidgetPDF: FC< ModuleOverviewWidgetPDFProps > = ( {
	data,
	chartImages,
} ) => {
	// Without data the widget returns null, and no placeholder takes its place.
	if ( ! data ) {
		return null;
	}

	const { dateRangeLength, currencyCode, metrics } = data;

	const changeLabel = sprintf(
		/* translators: %d: number of days in the comparison period */
		__( 'Vs. prev. %d days', 'google-site-kit' ),
		dateRangeLength
	);

	return (
		<View>
			{ /* This widget shares the Monetization area with the Top earning
			     pages widget, so it renders its own heading. */ }
			<PDFTypography size="large" style={ styles.heading }>
				{ __( 'Earning performance over time', 'google-site-kit' ) }
			</PDFTypography>
			<View style={ styles.grid }>
				{ CARDS.map( ( { key, title, color, formatValue } ) => {
					const metric = metrics[ key ];
					const chartImage = chartImages?.[ key ];

					// The widget skips a card whose metric has no data or
					// failed. The loader returns null data when every card is
					// empty, so the heading never renders above an empty grid.
					if ( ! chartImage ) {
						return null;
					}

					return (
						<View key={ key } style={ styles.cell }>
							<PDFMetricChartTile
								title={ title }
								value={ formatValue(
									metric?.total || 0,
									currencyCode
								) }
								valueSize="large"
								changeLabel={ changeLabel }
								currentLabel={ title }
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

export default ModuleOverviewWidgetPDF;
