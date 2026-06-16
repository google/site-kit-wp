/**
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
import {
	Image,
	Line,
	Path,
	StyleSheet,
	Svg,
	Text,
	View,
} from '@react-pdf/renderer';
import type { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

// color tokens sourced from the PDF report Figma design.
const COLORS = {
	// surfaces/on-surface
	text: '#161b18',
	// surfaces/on-surface-variant
	secondary: '#6c726e',
	success: '#34a853',
	error: '#ea4335',
	successBg: '#e6f4ea',
	errorBg: '#fce8e6',
	cardBg: '#ffffff',
	// utility/divider
	border: '#ebeef0',
	placeholderBg: '#f8f9fa',
};

const styles = StyleSheet.create( {
	card: {
		backgroundColor: COLORS.cardBg,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: COLORS.border,
		borderStyle: 'solid',
		padding: 12,
	},
	headerRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
	},
	headerLeft: {
		flexGrow: 1,
		flexShrink: 1,
	},
	headerRight: {
		alignItems: 'flex-end',
		marginLeft: 8,
	},
	title: {
		fontSize: 9,
		color: COLORS.text,
		marginBottom: 2,
	},
	value: {
		fontSize: 22,
		color: COLORS.text,
	},
	chip: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 3,
		borderRadius: 100,
		paddingVertical: 2,
		paddingHorizontal: 6,
	},
	chipText: {
		fontSize: 9,
	},
	changeLabel: {
		fontSize: 8,
		color: COLORS.secondary,
		marginTop: 3,
		textAlign: 'right',
	},
	legendRow: {
		flexDirection: 'row',
		gap: 14,
		marginTop: 8,
		marginBottom: 2,
	},
	legendItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	legendLabel: {
		fontSize: 8,
		color: COLORS.secondary,
	},
	chart: {
		width: '100%',
		height: 120,
		marginTop: 4,
	},
	placeholder: {
		minHeight: 150,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: COLORS.placeholderBg,
		borderRadius: 4,
	},
	placeholderText: {
		fontSize: 9,
		color: COLORS.secondary,
	},
} );

interface ChangeArrowProps {
	direction: 'up' | 'down';
	color: string;
}

const ChangeArrow: FC< ChangeArrowProps > = ( { direction, color } ) => {
	return (
		<Svg width={ 8 } height={ 8 } viewBox="0 0 8 8">
			<Path
				d={
					direction === 'up' ? 'M4,0 L8,8 L0,8 Z' : 'M0,0 L8,0 L4,8 Z'
				}
				fill={ color }
			/>
		</Svg>
	);
};

interface LegendSwatchProps {
	color: string;
	dashed?: boolean;
}

const LegendSwatch: FC< LegendSwatchProps > = ( { color, dashed = false } ) => {
	return (
		<Svg width={ 16 } height={ 2 } viewBox="0 0 16 2">
			<Line
				x1="0"
				y1="1"
				x2="16"
				y2="1"
				stroke={ color }
				strokeWidth={ 2 }
				{ ...( dashed ? { strokeDasharray: '3 2' } : {} ) }
			/>
		</Svg>
	);
};

export interface PDFMetricChartTileProps {
	/** Heading rendered above the metric value, e.g. "Total Impressions". */
	title: string;
	/** Pre-formatted metric value to display prominently, e.g. "9.2K". */
	value: string;
	/** Pre-formatted change chip text, e.g. "5.2%". Hides the chip when omitted. */
	change?: string;
	/** Direction the change chip points; controls the arrow and color. */
	changeDirection?: 'up' | 'down';
	/** Caption rendered below the chip, e.g. "Vs. prev. 28 days". */
	changeLabel?: string;
	/** Legend label for the current-period series, e.g. "Impressions". */
	currentLabel: string;
	/** Legend label for the previous-period series, e.g. "Previous period". */
	previousLabel?: string;
	/** Series color used for the legend swatches, matching the chart. */
	color: string;
	/** JPEG data URI for the rasterised line chart. */
	chartImage?: string | null;
}

const PDFMetricChartTile: FC< PDFMetricChartTileProps > = ( {
	title,
	value,
	change,
	changeDirection,
	changeLabel,
	currentLabel,
	previousLabel = __( 'Previous period', 'google-site-kit' ),
	color,
	chartImage,
} ) => {
	// A missing chart image means the metric's report or rasterisation failed,
	// so the whole card falls back to a "Data unavailable" placeholder.
	if ( ! chartImage ) {
		return (
			<View style={ styles.card }>
				<View style={ styles.placeholder }>
					<Text style={ styles.placeholderText }>
						{ __( 'Data unavailable', 'google-site-kit' ) }
					</Text>
				</View>
			</View>
		);
	}

	const changeColor =
		changeDirection === 'up' ? COLORS.success : COLORS.error;
	const chipBackground =
		changeDirection === 'up' ? COLORS.successBg : COLORS.errorBg;

	return (
		<View style={ styles.card }>
			<View style={ styles.headerRow }>
				<View style={ styles.headerLeft }>
					<Text style={ styles.title }>{ title }</Text>
					<Text style={ styles.value }>{ value }</Text>
				</View>
				<View style={ styles.headerRight }>
					{ change !== undefined &&
						change !== null &&
						changeDirection && (
							<View
								style={ [
									styles.chip,
									{ backgroundColor: chipBackground },
								] }
							>
								<ChangeArrow
									direction={ changeDirection }
									color={ changeColor }
								/>
								<Text
									style={ [
										styles.chipText,
										{ color: changeColor },
									] }
								>
									{ change }
								</Text>
							</View>
						) }
					{ changeLabel && (
						<Text style={ styles.changeLabel }>
							{ changeLabel }
						</Text>
					) }
				</View>
			</View>

			<View style={ styles.legendRow }>
				<View style={ styles.legendItem }>
					<LegendSwatch color={ color } />
					<Text style={ styles.legendLabel }>{ currentLabel }</Text>
				</View>
				<View style={ styles.legendItem }>
					<LegendSwatch color={ color } dashed />
					<Text style={ styles.legendLabel }>{ previousLabel }</Text>
				</View>
			</View>

			<Image src={ chartImage } style={ styles.chart } />
		</View>
	);
};

export default PDFMetricChartTile;
