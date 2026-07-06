/**
 * A white card that holds one section of the PDF report.
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
import type { Style } from '@react-pdf/stylesheet';
import { FC } from 'react';

/**
 * Internal dependencies
 */
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';

const styles = createPDFStyles( {
	card: {
		backgroundColor: PDF_COLORS.SURFACES_SURFACE,
		borderRadius: 16,
		paddingVertical: 18,
		paddingHorizontal: 24,
	},
} );

export interface PDFCardProps {
	/** Style merged over the card surface, radius, and padding. */
	style?: Style | Style[];
}

const PDFCard: FC< PDFCardProps > = ( { style, children } ) => {
	const baseStyles: Style[] = [ styles.card ];

	return (
		<View style={ style ? baseStyles.concat( style ) : styles.card }>
			{ children }
		</View>
	);
};

export default PDFCard;
