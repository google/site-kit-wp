/**
 * A rounded pill badge for the PDF report, colored by its caller.
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
import PDFTypography from './PDFTypography';

const styles = createPDFStyles( {
	badge: {
		borderRadius: 4,
		paddingVertical: 4,
		paddingHorizontal: 8,
	},
} );

export interface PDFBadgeProps {
	/** The badge label text. */
	label: string;
	/** The badge's fill color. */
	backgroundColor: string;
	/** The label's text color. */
	color: string;
	/** Styles to merge onto the base styles in this component. */
	style?: Style | Style[];
}

const PDFBadge: FC< PDFBadgeProps > = ( {
	label,
	backgroundColor,
	color,
	style,
} ) => {
	const baseStyle: Style[] = [ styles.badge, { backgroundColor } ];

	return (
		<View style={ style ? baseStyle.concat( style ) : baseStyle }>
			<PDFTypography type="label" size="small" style={ { color } }>
				{ label }
			</PDFTypography>
		</View>
	);
};

export default PDFBadge;
