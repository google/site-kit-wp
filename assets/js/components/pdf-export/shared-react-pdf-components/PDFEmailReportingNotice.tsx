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
import { Path, View } from '@react-pdf/renderer';
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import PDFButton from './PDFButton';
import PDFSvg from './PDFSvg';
import PDFTypography from './PDFTypography';

/**
 * The star path from `assets/svg/icons/star-fill.svg`. Importing the SVG
 * file produces a DOM component, which @react-pdf cannot render in a PDF.
 * So the path data is inlined here and rendered with @react-pdf's own
 * <Svg> and <Path> components.
 */
const STAR_ICON_PATH =
	'M5.825 22L8.15 14.4L2 10H9.6L12 2L14.4 10H22L15.85 14.4L18.175 22L12 17.3L5.825 22Z';

const noticeTextColor = { color: PDF_COLORS.VIOLET_V_600 };

const styles = createPDFStyles( {
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		// The notice renders outside the report body's `gap` spacing, so it
		// sets its own top margin.
		marginTop: 59,
		backgroundColor: PDF_COLORS.VIOLET_V_50,
		borderRadius: 16,
		paddingVertical: 14,
		paddingHorizontal: 24,
	},
	textColumn: {
		flexGrow: 1,
		flexShrink: 1,
		marginLeft: 16,
		marginRight: 60,
	},
	button: {
		flexShrink: 0,
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
			<PDFSvg width={ 24 } height={ 24 } viewBox="0 0 24 24">
				<Path d={ STAR_ICON_PATH } fill={ PDF_COLORS.VIOLET_V_600 } />
			</PDFSvg>
			<View style={ styles.textColumn }>
				<PDFTypography type="label" style={ noticeTextColor }>
					{ __(
						'Get your site’s most important insights delivered to your inbox',
						'google-site-kit'
					) }
				</PDFTypography>
				<PDFTypography style={ noticeTextColor }>
					{ __(
						'Stay updated with a summary of your site’s performance, key trends, and tailored metrics sent directly to your inbox.',
						'google-site-kit'
					) }
				</PDFTypography>
				<PDFTypography style={ noticeTextColor }>
					{ __(
						'This feature is available exclusively to Site Kit users.',
						'google-site-kit'
					) }
				</PDFTypography>
			</View>
			<View style={ styles.button }>
				<PDFButton
					href={ emailReportingSetupURL }
					backgroundColor={ PDF_COLORS.VIOLET_V_600 }
					labelColor={ PDF_COLORS.SURFACES_SURFACE }
				>
					{ __( 'Set up email reports', 'google-site-kit' ) }
				</PDFButton>
			</View>
		</View>
	);
};

export default PDFEmailReportingNotice;
