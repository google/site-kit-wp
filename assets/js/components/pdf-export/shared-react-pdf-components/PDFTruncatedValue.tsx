/**
 * PDFTruncatedValue: a value that shows on one line and ends in an ellipsis when it's too long.
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
import PDFTypography, {
	PDFTypographySize,
	PDFTypographyType,
} from './PDFTypography';

const styles = createPDFStyles( {
	box: {
		flexGrow: 1,
		flexShrink: 1,
		flexBasis: 0,
		marginRight: 20,
	},
	value: {
		textOverflow: 'ellipsis',
	},
} );

export interface PDFTruncatedValueProps {
	/** Typography type for the value. */
	type?: PDFTypographyType;
	/** Typography size for the value. */
	size?: PDFTypographySize;
	/** Additional styles applied to the value. */
	style?: Style | Style[];
}

const PDFTruncatedValue: FC< PDFTruncatedValueProps > = ( {
	type,
	size,
	style,
	children,
} ) => {
	const baseStyles: Style[] = [ styles.value ];

	return (
		<View style={ styles.box }>
			<PDFTypography
				type={ type }
				size={ size }
				style={ style ? baseStyles.concat( style ) : baseStyles }
				maxLines={ 1 }
			>
				{ children }
			</PDFTypography>
		</View>
	);
};

export default PDFTruncatedValue;
