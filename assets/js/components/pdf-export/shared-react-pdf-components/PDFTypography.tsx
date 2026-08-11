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
import { Text } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/stylesheet';
import { FC } from 'react';

/**
 * Internal dependencies
 */
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import { PDF_TYPOGRAPHY } from '@/js/components/pdf-export/pdf-typography';

export type PDFTypographyType = keyof typeof PDF_TYPOGRAPHY;
export type PDFTypographySize = keyof typeof PDF_TYPOGRAPHY[ 'body' ];

export interface PDFTypographyProps {
	/** Typography type, a key of `PDF_TYPOGRAPHY`. Defaults to `'body'`. */
	type?: PDFTypographyType;
	/** Typography size within the type, a key of the type's entry. Defaults to `'medium'`. */
	size?: PDFTypographySize;
	/** Style merged on top of the base text styles. */
	style?: Style | Style[];
	/** Caps the text at this many lines. Pair with `textOverflow: 'ellipsis'` to truncate. */
	maxLines?: number;
}

const PDFTypography: FC< PDFTypographyProps > = ( {
	type = 'body',
	size = 'medium',
	style,
	maxLines,
	children,
} ) => {
	const baseStyles: Style[] = [
		PDF_TYPOGRAPHY[ type ][ size ],
		{ color: PDF_COLORS.SURFACES_ON_SURFACE },
	];

	// `@react-pdf/renderer` reads `maxLines` off the text's style, not as a
	// prop, so it is merged into the styles rather than passed to `Text`.
	if ( typeof maxLines === 'number' ) {
		baseStyles.push( { maxLines } );
	}

	return (
		<Text style={ style ? baseStyles.concat( style ) : baseStyles }>
			{ children }
		</Text>
	);
};

export default PDFTypography;
