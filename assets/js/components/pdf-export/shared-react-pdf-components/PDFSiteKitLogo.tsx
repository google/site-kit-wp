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
import { Path, Svg, Text, View } from '@react-pdf/renderer';
import { FC } from 'react';

/**
 * Internal dependencies
 */
import {
	createPDFStyles,
	scalePDFValue,
} from '@/js/components/pdf-export/pdf-scale';
import {
	PDF_COLOR_TEXT_PRIMARY,
	PDF_FONT_FAMILY_DISPLAY,
} from '@/js/components/pdf-export/pdf-theme';

// Mirrors the `Logo` component (`assets/js/components/Logo.js`): the colour
// Google "G" (`assets/svg/graphics/logo-g.svg`) next to the "Site Kit" wordmark
// (`assets/svg/graphics/logo-sitekit.svg`). The geometry is inlined because the
// webpack SVG import yields a DOM component @react-pdf cannot render in a PDF;
// it is drawn here with @react-pdf's own <Svg>/<Path> primitives.
const G_PATHS = [
	{
		d: 'M2.25253805,12.2519409 L9.65186195,17.9102474 C9.228777,19.1952969 9,20.5700374 9,22 C9,23.4299626 9.228777,24.8047031 9.65186195,26.0897526 L2.25253805,31.7480591 C0.809393905,28.8140208 0,25.5061199 0,22 C0,18.4938801 0.809393905,15.1859792 2.25253805,12.2519409 Z',
		fill: '#FBBC05',
	},
	{
		d: 'M9.65186195,17.9102474 L2.25253805,12.2519409 C5.83100163,4.97661119 13.3061199,0 22,0 C27.6,0 32.6,2.1 36.5,5.5 L30.1,11.9 C27.9,10.1 25.1,9 22,9 C16.2299626,9 11.3590507,12.7249484 9.65186195,17.9102474 Z',
		fill: '#EA4335',
	},
	{
		d: 'M2.24956066,31.7420035 L9.64586796,26.0715012 C11.3476258,31.2663086 16.223195,35 22,35 C28.1,35 32.7,31.9 33.8,26.5 L22,26.5 L22,18 L42.5,18 C42.8,19.3 43,20.7 43,22 C43,36 33,44 22,44 C13.3037079,44 5.82685413,39.0206271 2.24956066,31.7420035 Z',
		fill: '#34A853',
	},
	{
		d: 'M36.3394527,38.5208666 L29.3149064,33.0825082 C31.6117078,31.6329963 33.209743,29.3976252 33.8,26.5 L22,26.5 L22,18 L42.5,18 C42.8,19.3 43,20.7 43,22 C43,29.170479 40.3767465,34.7670059 36.3394527,38.5208666 Z',
		fill: '#4285F4',
	},
];

const styles = createPDFStyles( {
	logo: {
		flexDirection: 'row',
		alignItems: 'center',
		flexShrink: 0,
	},
	wordmark: {
		fontFamily: PDF_FONT_FAMILY_DISPLAY,
		fontSize: 22,
		fontWeight: 400,
		color: PDF_COLOR_TEXT_PRIMARY,
		lineHeight: 28 / 22,
		marginLeft: 7,
	},
} );

const PDFSiteKitLogo: FC = () => {
	return (
		<View style={ styles.logo }>
			<Svg
				width={ scalePDFValue( 21 ) }
				height={ scalePDFValue( 22 ) }
				viewBox="0 0 43 44"
			>
				{ G_PATHS.map( ( { d, fill }, index ) => (
					<Path key={ index } d={ d } fill={ fill } />
				) ) }
			</Svg>
			<Text style={ styles.wordmark }>Site Kit</Text>
		</View>
	);
};

export default PDFSiteKitLogo;
