/**
 * A button for the PDF report, wrapped in a link so it works in the PDF.
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
import { Link, View } from '@react-pdf/renderer';
import { FC } from 'react';

/**
 * Internal dependencies
 */
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import PDFTypography from './PDFTypography';

const styles = createPDFStyles( {
	link: {
		textDecoration: 'none',
	},
	button: {
		borderRadius: 100,
		paddingVertical: 6,
		paddingHorizontal: 16,
	},
} );

export interface PDFButtonProps {
	/** Link target URL the button opens. */
	href?: string;
	/** Background color of the button. */
	backgroundColor: string;
	/** Color of the button label. */
	labelColor: string;
}

const PDFButton: FC< PDFButtonProps > = ( {
	href,
	backgroundColor,
	labelColor,
	children,
} ) => {
	return (
		<Link src={ href } style={ styles.link }>
			<View style={ [ styles.button, { backgroundColor } ] }>
				<PDFTypography type="label" style={ { color: labelColor } }>
					{ children }
				</PDFTypography>
			</View>
		</Link>
	);
};

export default PDFButton;
