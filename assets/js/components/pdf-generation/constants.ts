/**
 * PDF Generation constants.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export const PDF_DOWNLOAD_PANEL_OPENED_KEY = 'pdfDownloadPanelOpened';

/**
 * TODO:
 * Temporary state flag used to render the "Your report is being generated…"
 * notice when the user clicks "Download report". To be replaced by the PDF
 * generation orchestrator in #12537.
 */
export const PDF_GENERATING_KEY = 'pdfDownloadGenerating';

export const FORM_PDF_DOWNLOAD = 'pdfDownloadForm';
export const FORM_PDF_DOWNLOAD_SELECTED_SECTIONS = 'selectedSections';

export interface PDFSection {
	slug: string;
	title: string;
}

/**
 * Hard-coded list of PDF report sections rendered in the selection panel.
 *
 * Each section exposes a slug used as both the `CORE_FORMS` selection key and
 * the checkbox input identifier.
 *
 * TODO:
 * Temporary constant to be replaced by the widget registry in #12537.
 * The widget-registry integration will source these dynamically and
 * introduce the section/widget two-level hierarchy.
 */
export const PDF_SECTIONS: PDFSection[] = [
	{
		slug: 'summary',
		title: __( 'Summary', 'google-site-kit' ),
	},
	{
		slug: 'traffic',
		title: __( 'Traffic', 'google-site-kit' ),
	},
	{
		slug: 'engagement',
		title: __( 'Engagement', 'google-site-kit' ),
	},
	{
		slug: 'monetization',
		title: __( 'Monetization', 'google-site-kit' ),
	},
	{
		slug: 'key-metrics',
		title: __( 'Key metrics', 'google-site-kit' ),
	},
	{
		slug: 'speed',
		title: __( 'Speed', 'google-site-kit' ),
	},
];

/**
 * Default selection used when the panel is opened for the first time.
 * All sections are selected by default.
 */
export const DEFAULT_SELECTED_SECTIONS: string[] = PDF_SECTIONS.map(
	( { slug } ) => slug
);
