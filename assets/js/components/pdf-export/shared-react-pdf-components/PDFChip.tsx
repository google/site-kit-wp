/**
 * A pill-shaped chip with a label and an optional icon.
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
 * Internal dependencies
 */
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import {
	PDF_COLORS,
	PDF_FONT_FAMILY_DISPLAY,
} from '@/js/components/pdf-export/pdf-theme';
import { PDFIcon } from '@/js/components/pdf-export/types';
import PDFTypography from './PDFTypography';

const styles = createPDFStyles( {
	chip: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: PDF_COLORS.SURFACES_SURFACE_1,
		borderRadius: 100,
		paddingVertical: 8,
		paddingHorizontal: 12,
	},
	label: {
		fontFamily: PDF_FONT_FAMILY_DISPLAY,
		letterSpacing: 0.5,
	},
	labelWithIcon: {
		marginLeft: 4,
	},
} );

export interface PDFChipProps {
	/** The chip text. */
	label: string;
	/** The icon rendered before the label. */
	Icon?: PDFIcon;
}

const PDFChip: FC< PDFChipProps > = ( { label, Icon } ) => {
	return (
		<View style={ styles.chip }>
			{ Icon && (
				<Icon size={ 20 } color={ PDF_COLORS.SURFACES_ON_SURFACE } />
			) }
			<PDFTypography
				type="label"
				size="small"
				style={ [
					styles.label,
					...( Icon ? [ styles.labelWithIcon ] : [] ),
				] }
			>
				{ label }
			</PDFTypography>
		</View>
	);
};

export default PDFChip;
