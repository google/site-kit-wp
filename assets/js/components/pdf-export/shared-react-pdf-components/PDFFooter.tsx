/**
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
import { Link, StyleSheet, View } from '@react-pdf/renderer';
import type { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	colors,
	fontSizes,
	spacing,
} from '@/js/components/pdf-export/pdf-theme';

const styles = StyleSheet.create( {
	footer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
		alignItems: 'flex-start',
		columnGap: spacing.footerLinkGap,
		rowGap: spacing.footerLinkRowGap,
		marginTop: spacing.footerMarginTop,
	},
	link: {
		fontSize: fontSizes.small,
		// Matches the design's label/small token (12/16): react-pdf lineHeight
		// is a unitless multiple of the font size, so 16 / 12 yields a 16pt line.
		lineHeight: 16 / 12,
		letterSpacing: 0.2,
		color: colors.onSurfaceVariant,
		textDecoration: 'none',
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
		<Link src={ dashboardURL } style={ styles.link }>
			{ __( 'View dashboard', 'google-site-kit' ) }
		</Link>
		<Link src={ helpCenterURL } style={ styles.link }>
			{ __( 'Help center', 'google-site-kit' ) }
		</Link>
		<Link src={ privacyPolicyURL } style={ styles.link }>
			{ __( 'Privacy Policy', 'google-site-kit' ) }
		</Link>
	</View>
);

export default PDFFooter;
