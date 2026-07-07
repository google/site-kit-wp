/**
 * Shared text component for the PDF report, mirroring the dashboard
 * `Typography` component.
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
import type { Style } from '@react-pdf/stylesheet';
import { FC } from 'react';

/**
 * Internal dependencies
 */
import {
	getComplexScript,
	layoutComplexScriptLines,
} from '@/js/components/pdf-export/pdf-text-shaping';
import {
	PDF_COLORS,
	PDF_TYPOGRAPHY,
} from '@/js/components/pdf-export/pdf-theme';
import { usePDFTextWidth } from '@/js/components/pdf-export/pdf-width-context';

export type PDFTypographyType = keyof typeof PDF_TYPOGRAPHY;
export type PDFTypographySize = keyof typeof PDF_TYPOGRAPHY[ 'body' ];

export interface PDFTypographyProps {
	/** Typography type, a key of `PDF_TYPOGRAPHY`. Defaults to `'body'`. */
	type?: PDFTypographyType;
	/** Typography size within the type, a key of the type's entry. Defaults to `'medium'`. */
	size?: PDFTypographySize;
	/** Style merged on top of the base text styles. */
	style?: Style | Style[];
}

const PDFTypography: FC< PDFTypographyProps > = ( {
	type = 'body',
	size = 'medium',
	style,
	children,
} ) => {
	const typeStyle = PDF_TYPOGRAPHY[ type ][ size ];
	const maxWidth = usePDFTextWidth();

	const baseStyles: Style[] = [
		typeStyle,
		{ color: PDF_COLORS.SURFACES_ON_SURFACE },
	];

	const text = typeof children === 'string' ? children : undefined;
	const script = text !== undefined ? getComplexScript( text ) : undefined;

	// Latin, Cyrillic, digits, and non-string children render as-is; the brand
	// family from `typeStyle` covers them.
	if ( ! script || text === undefined ) {
		return (
			<Text style={ style ? baseStyles.concat( style ) : baseStyles }>
				{ children }
			</Text>
		);
	}

	// @react-pdf cannot shape, reorder, or wrap complex scripts and crashes when
	// it wraps them, so the text is laid out here into visual-order,
	// non-wrapping lines drawn in the script's single font and right-aligned.
	// Every report text renders through this component, so this is the single
	// place the handling applies.
	const fontSize =
		typeof typeStyle.fontSize === 'number' ? typeStyle.fontSize : 12;
	const lines = layoutComplexScriptLines( text, script, fontSize, maxWidth );
	const lineStyles: Style[] = baseStyles.concat( {
		fontFamily: script.fontFamily,
		textAlign: 'right',
	} );
	const mergedLineStyles = style ? lineStyles.concat( style ) : lineStyles;

	// A single line keeps the plain `<Text>` shape so inline usages are
	// unchanged; multiple lines stack in a `<View>`.
	if ( lines.length === 1 ) {
		return <Text style={ mergedLineStyles }>{ lines[ 0 ] }</Text>;
	}

	return (
		<View>
			{ lines.map( ( line, index ) => (
				<Text key={ index } style={ mergedLineStyles }>
					{ line }
				</Text>
			) ) }
		</View>
	);
};

export default PDFTypography;
