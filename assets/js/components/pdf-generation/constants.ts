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

export const PDF_DOWNLOAD_PANEL_OPENED_KEY = 'pdfDownloadPanelOpened';

export interface PDFSectionWidget {
	slug: string;
	label: string;
}

export interface PDFSection {
	/** Widget area slug; identifies the section. */
	slug: string;
	/** Section heading, sourced from the area's `pdfTitle`. */
	label: string;
	/** Dashboard context the area belongs to (drives `core/pdf` contextSlugs). */
	contextSlug: string;
	/** Labelled PDF widgets rendered as child checkboxes; empty = collapsed section. */
	widgets: PDFSectionWidget[];
	/** All PDF widget slugs in the area; the unit of selection and parent state. */
	widgetSlugs: string[];
}
