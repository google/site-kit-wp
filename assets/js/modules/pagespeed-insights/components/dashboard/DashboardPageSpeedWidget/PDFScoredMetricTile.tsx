/**
 * Speed PDF widget scored metric tile.
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
import type { FC } from 'react';

/**
 * Internal dependencies
 */
import {
	PDF_COLOR_TEXT_PRIMARY,
	PDF_COLOR_TEXT_SECONDARY,
	PDF_FONT_FAMILY_TEXT,
	PDF_SCORE_COLORS,
} from '@/js/components/pdf-export/pdf-theme';
import {
	CATEGORY_AVERAGE,
	CATEGORY_FAST,
	CATEGORY_SLOW,
} from '@/js/modules/pagespeed-insights/util/constants';

const INDICATOR_SIZE = 8;

const styles = StyleSheet.create( {
	row: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'space-between',
		paddingVertical: 6,
		borderBottomWidth: 1,
		borderBottomColor: '#f1f3f4',
		borderBottomStyle: 'solid',
	},
	labelGroup: {
		flex: 1,
		paddingRight: 8,
	},
	title: {
		fontFamily: PDF_FONT_FAMILY_TEXT,
		fontSize: 9,
		fontWeight: 500,
		color: PDF_COLOR_TEXT_PRIMARY,
	},
	description: {
		fontFamily: PDF_FONT_FAMILY_TEXT,
		fontSize: 8,
		color: PDF_COLOR_TEXT_SECONDARY,
		marginTop: 1,
	},
	valueGroup: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	value: {
		fontFamily: PDF_FONT_FAMILY_TEXT,
		fontSize: 9,
		color: PDF_COLOR_TEXT_PRIMARY,
	},
	indicator: {
		width: INDICATOR_SIZE,
		height: INDICATOR_SIZE,
		borderRadius: INDICATOR_SIZE / 2,
	},
} );

function getCategoryColor( category: string ): string {
	switch ( category ) {
		case CATEGORY_FAST:
			return PDF_SCORE_COLORS.fast;
		case CATEGORY_AVERAGE:
			return PDF_SCORE_COLORS.average;
		case CATEGORY_SLOW:
			return PDF_SCORE_COLORS.slow;
		default:
			return PDF_SCORE_COLORS.average;
	}
}

export interface PDFScoredMetricTileProps {
	title: string;
	description: string;
	displayValue: string;
	category: string;
}

const PDFScoredMetricTile: FC< PDFScoredMetricTileProps > = ( {
	title,
	description,
	displayValue,
	category,
} ) => (
	<View style={ styles.row }>
		<View style={ styles.labelGroup }>
			<Text style={ styles.title }>{ title }</Text>
			<Text style={ styles.description }>{ description }</Text>
		</View>
		<View style={ styles.valueGroup }>
			<Text style={ styles.value }>{ displayValue }</Text>
			<View
				style={ [
					styles.indicator,
					{ backgroundColor: getCategoryColor( category ) },
				] }
			/>
		</View>
	</View>
);

export default PDFScoredMetricTile;
