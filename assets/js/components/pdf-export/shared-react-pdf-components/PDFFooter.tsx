/**
 * PDFFooter: the footer links of the PDF report.
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
import { createPDFStyles } from '@/js/components/pdf-export/pdf-scale';
import { PDF_COLORS } from '@/js/components/pdf-export/pdf-theme';
import PDFLink from './PDFLink';

const styles = createPDFStyles( {
	footer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		alignItems: 'flex-start',
		columnGap: 49.5,
		rowGap: 4,
		// The footer renders outside the report body's `gap` spacing, so it
		// sets its own top margin.
		marginTop: 44,
	},
	link: {
		color: PDF_COLORS.SURFACES_ON_SURFACE_VARIANT,
	},
} );

export interface PDFFooterProps {
	/** Golink URL opening the Site Kit dashboard the current user can access. */
	dashboardURL: string;
	/** Golink URL opening the Site Kit help center. */
	helpCenterURL: string;
	/** Golink URL opening the Google privacy policy. */
	privacyPolicyURL: string;
}

const PDFFooter: FC< PDFFooterProps > = ( {
	dashboardURL,
	helpCenterURL,
	privacyPolicyURL,
} ) => (
	<View style={ styles.footer }>
		<PDFLink
			href={ dashboardURL }
			type="label"
			size="small"
			style={ styles.link }
		>
			{ __( 'View dashboard', 'google-site-kit' ) }
		</PDFLink>
		<PDFLink
			href={ helpCenterURL }
			type="label"
			size="small"
			style={ styles.link }
		>
			{ __( 'Help center', 'google-site-kit' ) }
		</PDFLink>
		<PDFLink
			href={ privacyPolicyURL }
			type="label"
			size="small"
			style={ styles.link }
		>
			{ __( 'Privacy Policy', 'google-site-kit' ) }
		</PDFLink>
	</View>
);

export default PDFFooter;
