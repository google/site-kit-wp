/**
 * PDFMetricTile component for @react-pdf/renderer.
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
import { Text, View } from '@react-pdf/renderer';
import type { FC } from 'react';

/**
 * Internal dependencies
 */
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import {
	PDF_FONT_FAMILY_DISPLAY,
	PDF_FONT_FAMILY_TEXT,
} from '@/js/components/pdf-export/pdf-theme';

const COLORS = {
	text: '#161b18',
	secondary: '#6c726e',
	positiveBackground: '#d8ffc0',
	positiveText: '#1f4c04',
	negativeBackground: '#ffded3',
	negativeText: '#7a1e00',
};

const tileStyles = createPDFStyles( {
	container: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
	},
	metric: {
		flexDirection: 'column',
	},
	title: {
		fontFamily: PDF_FONT_FAMILY_TEXT,
		fontSize: 14,
		fontWeight: 500,
		letterSpacing: -0.1,
		lineHeight: 1.143,
		color: COLORS.text,
		marginBottom: 0,
	},
	value: {
		fontFamily: PDF_FONT_FAMILY_DISPLAY,
		fontSize: 28,
		fontWeight: 400,
		lineHeight: 1.286,
		color: COLORS.text,
	},
	aside: {
		flexDirection: 'column',
		alignItems: 'flex-end',
	},
	chip: {
		borderRadius: 100,
		paddingVertical: 4,
		paddingHorizontal: 8,
	},
	chipText: {
		fontFamily: PDF_FONT_FAMILY_TEXT,
		fontSize: 12,
		fontWeight: 500,
		letterSpacing: 0.2,
		lineHeight: 1.333,
	},
	changeLabel: {
		fontFamily: PDF_FONT_FAMILY_TEXT,
		fontSize: 12,
		letterSpacing: 0.2,
		lineHeight: 1.333,
		color: COLORS.secondary,
		marginTop: 8,
	},
} );

export interface PDFMetricTileProps {
	/** Heading rendered above the metric value, e.g. "All visitors". */
	title: string;
	/** Pre-formatted metric value to display prominently, e.g. "32.6K". */
	value: string;
	/** Pre-formatted, signed change string for the chip, e.g. "+5.1%". Hides the chip when omitted. */
	change?: string;
	/** Whether the change is negative; controls the chip color. */
	isNegative?: boolean;
	/** Optional caption rendered below the chip, e.g. "Vs. prev. 28 days". */
	changeLabel?: string;
}

const PDFMetricTile: FC< PDFMetricTileProps > = ( {
	title,
	value,
	change,
	isNegative = false,
	changeLabel,
} ) => {
	const chipBackground = isNegative
		? COLORS.negativeBackground
		: COLORS.positiveBackground;
	const chipColor = isNegative ? COLORS.negativeText : COLORS.positiveText;

	return (
		<View style={ tileStyles.container }>
			<View style={ tileStyles.metric }>
				<Text style={ tileStyles.title }>{ title }</Text>
				<Text style={ tileStyles.value }>{ value }</Text>
			</View>
			<View style={ tileStyles.aside }>
				{ !! change && (
					<View
						style={ [
							tileStyles.chip,
							{ backgroundColor: chipBackground },
						] }
					>
						<Text
							style={ [
								tileStyles.chipText,
								{ color: chipColor },
							] }
						>
							{ change }
						</Text>
					</View>
				) }
				{ !! changeLabel && (
					<Text style={ tileStyles.changeLabel }>
						{ changeLabel }
					</Text>
				) }
			</View>
		</View>
	);
};

export default PDFMetricTile;
