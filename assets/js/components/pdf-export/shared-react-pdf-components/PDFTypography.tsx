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
import {
	PDF_COLORS,
	PDF_TYPOGRAPHY,
	getPDFFontFamily,
} from '@/js/components/pdf-export/pdf-theme';
import { getLocale } from '@/js/util';

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
	const baseStyles: Style[] = [
		typeStyle,
		{ color: PDF_COLORS.SURFACES_ON_SURFACE },
		// Append the locale's script fallback to the family so non-Latin text
		// renders legibly. Every report text renders through this component, so
		// this is the single place the fallback needs to apply.
		{ fontFamily: getPDFFontFamily( typeStyle.fontFamily, getLocale() ) },
	];

	return (
		<Text style={ style ? baseStyles.concat( style ) : baseStyles }>
			{ children }
		</Text>
	);
};

export default PDFTypography;
