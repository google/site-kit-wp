/**
 * PDFMetricChartTile: a metric tile with a line chart image for the PDF report.
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
import { Image, Line, View } from '@react-pdf/renderer';
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
import PDFCard from './PDFCard';
import PDFChangeBadge from './PDFChangeBadge';
import PDFSvg from './PDFSvg';
import PDFTypography, { PDFTypographySize } from './PDFTypography';

const styles = createPDFStyles( {
	headerRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-end',
	},
	headerLeft: {
		flexGrow: 1,
		flexShrink: 1,
	},
	headerRight: {
		alignItems: 'flex-end',
	},
	title: {
		marginBottom: 1,
	},
	changeLabel: {
		color: PDF_COLORS.SURFACES_ON_SURFACE_VARIANT,
		marginTop: 4,
		textAlign: 'right',
	},
	legendRow: {
		flexDirection: 'row',
		gap: 18,
		marginTop: 7,
		marginBottom: 0,
	},
	legendItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	legendLabel: {
		color: PDF_COLORS.SURFACES_ON_SURFACE_VARIANT,
	},
	chart: {
		width: '100%',
		height: 133,
		// Keep the chart at its drawn aspect ratio, 506 by 133, so it never
		// stretches when the card width rounds off.
		objectFit: 'contain',
		marginTop: 7,
	},
} );

interface LegendSwatchProps {
	/** The swatch line color, the same as its chart series. */
	color: string;
	/** Whether the line is dashed, which marks the previous period series. */
	dashed?: boolean;
}

const LegendSwatch: FC< LegendSwatchProps > = ( { color, dashed = false } ) => {
	return (
		<PDFSvg width={ 24 } height={ 2 } viewBox="0 0 16 2">
			<Line
				x1="0"
				y1="1"
				x2="16"
				y2="1"
				stroke={ color }
				strokeWidth={ 2 }
				{ ...( dashed ? { strokeDasharray: '3 2' } : {} ) }
			/>
		</PDFSvg>
	);
};
export interface PDFMetricChartTileProps {
	/** Heading rendered above the metric value, e.g. "Total Impressions". */
	title: string;
	/** Pre-formatted metric value to display prominently, e.g. "9.2K". */
	value: string;
	/** Typography size for the metric value. Defaults to `'medium'`. */
	valueSize?: PDFTypographySize;
	/** Pre-formatted change badge text, e.g. "5.2%". Hides the badge when omitted. */
	change?: string;
	/** Direction the change badge points. Controls the badge color. */
	changeDirection?: 'up' | 'down';
	/** Caption rendered below the badge, e.g. "Vs. prev. 28 days". */
	changeLabel?: string;
	/** Legend label for the current-period series, e.g. "Impressions". */
	currentLabel: string;
	/** Legend label for the previous-period series, e.g. "Previous period". */
	previousLabel?: string;
	/** Series color used for the legend swatches, matching the chart. */
	color: string;
	/** JPEG data URI for the rendered line chart. When it's not set, the tile returns null. */
	chartImage?: string | null;
}

const PDFMetricChartTile: FC< PDFMetricChartTileProps > = ( {
	title,
	value,
	valueSize = 'medium',
	change,
	changeDirection,
	changeLabel,
	currentLabel,
	previousLabel = __( 'Previous period', 'google-site-kit' ),
	color,
	chartImage,
} ) => {
	// Without a chart image the tile returns null, and no placeholder takes
	// its place.
	if ( ! chartImage ) {
		return null;
	}

	return (
		<PDFCard>
			<View style={ styles.headerRow }>
				<View style={ styles.headerLeft }>
					<PDFTypography
						type="title"
						size="small"
						style={ styles.title }
					>
						{ title }
					</PDFTypography>
					<PDFTypography type="headline" size={ valueSize }>
						{ value }
					</PDFTypography>
				</View>
				<View style={ styles.headerRight }>
					{ change !== undefined &&
						change !== null &&
						changeDirection && (
							<PDFChangeBadge
								change={ change }
								changeType={
									changeDirection === 'down'
										? 'negative'
										: 'positive'
								}
							/>
						) }
					{ changeLabel && (
						<PDFTypography
							size="small"
							style={ styles.changeLabel }
						>
							{ changeLabel }
						</PDFTypography>
					) }
				</View>
			</View>

			<View style={ styles.legendRow }>
				<View style={ styles.legendItem }>
					<LegendSwatch color={ color } />
					<PDFTypography size="small" style={ styles.legendLabel }>
						{ currentLabel }
					</PDFTypography>
				</View>
				<View style={ styles.legendItem }>
					<LegendSwatch color={ color } dashed />
					<PDFTypography size="small" style={ styles.legendLabel }>
						{ previousLabel }
					</PDFTypography>
				</View>
			</View>

			<Image src={ chartImage } style={ styles.chart } />
		</PDFCard>
	);
};

export default PDFMetricChartTile;
