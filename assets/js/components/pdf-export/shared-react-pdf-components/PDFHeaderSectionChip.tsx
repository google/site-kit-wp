/**
 * PDFHeaderSectionChip: a section pill rendered in the PDF report header.
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
import { FC } from 'react';

/**
 * Internal dependencies
 */
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import {
	PDF_FONT_FAMILY_TEXT,
	PDF_HEADER_COLORS,
} from '@/js/components/pdf-export/pdf-theme';
import type { PDFIcon } from '@/js/components/pdf-export/types';

const styles = createPDFStyles( {
	chip: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: PDF_HEADER_COLORS.chipBorder,
		borderRadius: 100,
		paddingVertical: 8,
		paddingHorizontal: 12,
	},
	label: {
		fontFamily: PDF_FONT_FAMILY_TEXT,
		fontSize: 12,
		fontWeight: 500,
		lineHeight: 1.333,
		letterSpacing: 0.5,
		color: PDF_HEADER_COLORS.chipText,
	},
	// Only offset the label from the icon; without one it would be off-centre.
	labelWithIcon: {
		marginLeft: 4,
	},
} );

export interface PDFHeaderSectionChipProps {
	label: string;
	Icon?: PDFIcon;
}

const PDFHeaderSectionChip: FC< PDFHeaderSectionChipProps > = ( {
	label,
	Icon,
} ) => {
	// Rendered as a plain pill for now: the chip has no jump-to-section target
	// yet, so wrapping it in a srcless <Link> would only risk an empty/broken
	// link annotation in the PDF. #12553 wires the anchor by wrapping this in a
	// `<Link src={ `#${ slug }` } />` plus matching section ids. A bare "#" is
	// NOT used because @react-pdf treats any non-`#id` src as an external URI
	// and would emit a broken clickable link in every PDF.
	return (
		<View style={ styles.chip }>
			{ Icon && <Icon color={ PDF_HEADER_COLORS.chipIcon } /> }
			<Text
				style={
					Icon ? [ styles.label, styles.labelWithIcon ] : styles.label
				}
			>
				{ label }
			</Text>
		</View>
	);
};

export default PDFHeaderSectionChip;
