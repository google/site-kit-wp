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
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	PDF_FONT_FAMILY_DISPLAY,
	PDF_FONT_FAMILY_TEXT,
} from '@/js/components/pdf-export/pdf-theme';
import type { PDFReportArea } from '@/js/components/pdf-export/types';
import PDFEmailReportingNotice from './PDFEmailReportingNotice';

const DEFAULT_PAGE_HEIGHT = 792;

const styles = StyleSheet.create( {
	page: {
		paddingTop: 24,
		paddingBottom: 24,
		paddingHorizontal: 24,
		fontFamily: PDF_FONT_FAMILY_TEXT,
		fontSize: 12,
		backgroundColor: '#f3f5f7',
	},
	header: {
		marginBottom: 32,
	},
	headerSiteName: {
		fontFamily: PDF_FONT_FAMILY_DISPLAY,
		fontSize: 20,
		fontWeight: 400,
		marginBottom: 4,
	},
	headerDateRange: {
		fontFamily: PDF_FONT_FAMILY_TEXT,
		fontSize: 11,
		color: '#5f6368',
	},
	body: {
		flexGrow: 1,
	},
	section: {
		marginBottom: 24,
	},
	sectionTitle: {
		fontFamily: PDF_FONT_FAMILY_DISPLAY,
		fontSize: 24,
		fontWeight: 'normal',
		color: '#161b18',
		marginBottom: 12,
	},
	emptyText: {
		fontFamily: PDF_FONT_FAMILY_TEXT,
		fontSize: 11,
		color: '#5f6368',
	},
	footer: {
		borderTopWidth: 1,
		borderTopColor: '#dadce0',
		paddingTop: 12,
		fontFamily: PDF_FONT_FAMILY_TEXT,
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
	areas?: PDFReportArea[];
	/** Golink URL for the "Set up email reports" button in the email reporting notice. */
	emailReportingSetupURL?: string;
}

const DashboardReport: FC< DashboardReportProps > = ( {
	siteName,
	dateRange,
	userName,
	generatedAt,
	pageHeight = DEFAULT_PAGE_HEIGHT,
	areas = [],
	emailReportingSetupURL,
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
					{ areas.length === 0 && (
						<Text style={ styles.emptyText }>
							{ __(
								'No report data available.',
								'google-site-kit'
							) }
						</Text>
					) }
					{ areas.map( ( { areaSlug, areaTitle, widgets } ) => (
						<View
							key={ `section-${ areaSlug }` }
							style={ styles.section }
						>
							<Text style={ styles.sectionTitle }>
								{ areaTitle }
							</Text>
							{ widgets.map(
								( { slug, Component, data, chartImages } ) => {
									if ( ! Component ) {
										return (
											<Text
												key={ slug }
												style={ styles.emptyText }
											>
												{ __(
													'Data unavailable.',
													'google-site-kit'
												) }
											</Text>
										);
									}

									return (
										<Component
											key={ slug }
											data={ data }
											chartImages={ chartImages }
										/>
									);
								}
							) }
						</View>
					) ) }
				</View>
				<PDFEmailReportingNotice
					emailReportingSetupURL={ emailReportingSetupURL }
				/>
				<View style={ styles.footer }>
					<Text>{ footerLine }</Text>
				</View>
			</Page>
		</Document>
	);
};

export default DashboardReport;
