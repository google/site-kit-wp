/**
 * DashboardReport: minimal `react-pdf` Document used by the MVP export.
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
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

const DEFAULT_PAGE_HEIGHT = 792;

const styles = StyleSheet.create( {
	page: {
		paddingTop: 48,
		paddingBottom: 48,
		paddingHorizontal: 48,
		fontSize: 12,
	},
	header: {
		marginBottom: 32,
	},
	headerSiteName: {
		fontSize: 20,
		fontWeight: 700,
		marginBottom: 4,
	},
	headerDateRange: {
		fontSize: 11,
		color: '#5f6368',
	},
	body: {
		flexGrow: 1,
		justifyContent: 'flex-start',
	},
	bodyHeading: {
		fontSize: 16,
		marginBottom: 8,
	},
	bodyText: {
		fontSize: 12,
		lineHeight: 1.5,
	},
	footer: {
		borderTopWidth: 1,
		borderTopColor: '#dadce0',
		paddingTop: 12,
		fontSize: 9,
		color: '#5f6368',
	},
} );

export interface DashboardReportProps {
	siteName: string;
	dateRange?: string;
	userName?: string;
	generatedAt: string;
	pageHeight?: number;
}

const DashboardReport: FC< DashboardReportProps > = ( {
	siteName,
	dateRange,
	userName,
	generatedAt,
	pageHeight = DEFAULT_PAGE_HEIGHT,
} ) => {
	const footerLine = userName
		? sprintf(
				/* translators: 1: Date and time string. 2: User name. */
				__( 'Generated %1$s by %2$s', 'google-site-kit' ),
				generatedAt,
				userName
		  )
		: sprintf(
				/* translators: %s: Date and time string. */
				__( 'Generated %s', 'google-site-kit' ),
				generatedAt
		  );

	return (
		<Document
			title={ __( 'Site Kit Dashboard Report', 'google-site-kit' ) }
			author="Site Kit by Google"
		>
			<Page
				size={ [ 612, pageHeight ] }
				style={ styles.page }
				wrap={ false }
			>
				<View style={ styles.header }>
					<Text style={ styles.headerSiteName }>{ siteName }</Text>
					{ dateRange ? (
						<Text style={ styles.headerDateRange }>
							{ dateRange }
						</Text>
					) : null }
				</View>
				<View style={ styles.body }>
					<Text style={ styles.bodyHeading }>
						{ __( 'Site Kit Dashboard Report', 'google-site-kit' ) }
					</Text>
					<Text style={ styles.bodyText }>
						{ __(
							'This is an MVP placeholder for the upcoming Site Kit PDF report. The full layout, charts, and metrics land in follow-up tickets.',
							'google-site-kit'
						) }
					</Text>
				</View>
				<View style={ styles.footer }>
					<Text>{ footerLine }</Text>
				</View>
			</Page>
		</Document>
	);
};

export default DashboardReport;
