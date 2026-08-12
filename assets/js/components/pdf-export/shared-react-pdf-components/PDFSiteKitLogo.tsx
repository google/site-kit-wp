/**
 * PDFSiteKitLogo: Site Kit brand mark rendered with @react-pdf/renderer.
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
import { PDFLogoG } from '@/js/components/pdf-export/pdf-icons';
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import PDFTypography from './PDFTypography';

const styles = createPDFStyles( {
	logo: {
		flexDirection: 'row',
		alignItems: 'center',
		flexShrink: 0,
	},
	wordmark: {
		// Gap between the "G" mark and the "Site Kit" wordmark.
		marginLeft: 7,
	},
} );

const PDFSiteKitLogo: FC = () => {
	return (
		<View style={ styles.logo }>
			<PDFLogoG size={ 24 } />
			<PDFTypography
				type="headline"
				size="small"
				style={ styles.wordmark }
			>
				Site Kit
			</PDFTypography>
		</View>
	);
};

export default PDFSiteKitLogo;
