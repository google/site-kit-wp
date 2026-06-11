/**
 * PDFEmailReportingNotice: Email Reporting setup notice for the PDF report.
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
import { Link, Path, StyleSheet, Svg, Text, View } from '@react-pdf/renderer';
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PDF_FONT_FAMILY_TEXT } from '@/js/components/pdf-export/pdf-theme';

const COLORS = {
	background: '#e3d1ff',
	text: '#462083',
	buttonBackground: '#462083',
	buttonText: '#ffffff',
};

// The star path from `assets/svg/icons/star-fill.svg`. Importing the SVG
// file produces a DOM component, which @react-pdf cannot render in a PDF.
// So the path data is inlined here and rendered with @react-pdf's own
// <Svg> and <Path> components.
const STAR_ICON_PATH =
	'M5.825 22L8.15 14.4L2 10H9.6L12 2L14.4 10H22L15.85 14.4L18.175 22L12 17.3L5.825 22Z';

const baseTextStyle = {
	fontFamily: PDF_FONT_FAMILY_TEXT,
	fontSize: 7,
	lineHeight: 1.43,
	color: COLORS.text,
};

const styles = StyleSheet.create( {
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: COLORS.background,
		borderRadius: 8,
		paddingVertical: 7,
		paddingHorizontal: 12,
		marginBottom: 22,
	},
	textColumn: {
		flexGrow: 1,
		flexShrink: 1,
		marginLeft: 8,
		marginRight: 55,
	},
	title: {
		...baseTextStyle,
		fontWeight: 500,
	},
	body: {
		...baseTextStyle,
		letterSpacing: 0.125,
	},
	button: {
		flexShrink: 0,
		backgroundColor: COLORS.buttonBackground,
		borderRadius: 8,
		paddingVertical: 3,
		paddingHorizontal: 8,
	},
	buttonLink: {
		textDecoration: 'none',
	},
	buttonText: {
		...baseTextStyle,
		fontWeight: 500,
		color: COLORS.buttonText,
	},
} );

export interface PDFEmailReportingNoticeProps {
	/** Golink URL for the "Set up email reports" button. */
	emailReportingSetupURL?: string;
}

const PDFEmailReportingNotice: FC< PDFEmailReportingNoticeProps > = ( {
	emailReportingSetupURL,
} ) => {
	return (
		<View style={ styles.container }>
			<Svg width={ 12 } height={ 12 } viewBox="0 0 24 24">
				<Path d={ STAR_ICON_PATH } fill={ COLORS.text } />
			</Svg>
			<View style={ styles.textColumn }>
				<Text style={ styles.title }>
					{ __(
						'Get your site’s most important insights delivered to your inbox',
						'google-site-kit'
					) }
				</Text>
				<Text style={ styles.body }>
					{ __(
						'Stay updated with a summary of your site’s performance, key trends, and tailored metrics sent directly to your inbox.',
						'google-site-kit'
					) }
				</Text>
				<Text style={ styles.body }>
					{ __(
						'This feature is available exclusively to Site Kit users.',
						'google-site-kit'
					) }
				</Text>
			</View>
			<View style={ styles.button }>
				<Link
					src={ emailReportingSetupURL }
					style={ styles.buttonLink }
				>
					<Text style={ styles.buttonText }>
						{ __( 'Set up email reports', 'google-site-kit' ) }
					</Text>
				</Link>
			</View>
		</View>
	);
};

export default PDFEmailReportingNotice;
