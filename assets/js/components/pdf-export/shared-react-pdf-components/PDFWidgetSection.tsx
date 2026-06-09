/**
 * PDFWidgetSection: widget heading + white card wrapper for the PDF report.
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
import type { FC, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import { PDF_FONT_FAMILY_TEXT } from '@/js/components/pdf-export/pdf-theme';

const styles = StyleSheet.create( {
	heading: {
		fontFamily: PDF_FONT_FAMILY_TEXT,
		fontSize: 13,
		color: '#6c726e',
		marginBottom: 8,
	},
	card: {
		backgroundColor: '#ffffff',
		borderRadius: 14,
		padding: 20,
		marginBottom: 20,
	},
} );

export interface PDFWidgetSectionProps {
	/** Optional widget heading rendered on the page above the card. */
	heading?: string;
	children: ReactNode;
}

const PDFWidgetSection: FC< PDFWidgetSectionProps > = ( {
	heading,
	children,
} ) => {
	return (
		<View>
			{ !! heading && <Text style={ styles.heading }>{ heading }</Text> }
			<View style={ styles.card }>{ children }</View>
		</View>
	);
};

export default PDFWidgetSection;
