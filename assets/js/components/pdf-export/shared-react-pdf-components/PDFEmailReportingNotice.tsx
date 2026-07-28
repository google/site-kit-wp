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
import { View } from '@react-pdf/renderer';
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PDFStarFill } from '@/js/components/pdf-export/pdf-icons';
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import PDFButton from './PDFButton';
import PDFTypography from './PDFTypography';

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
			<PDFStarFill size={ 24 } />
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
