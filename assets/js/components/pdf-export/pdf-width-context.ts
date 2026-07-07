/**
 * Available-text-width context for the PDF report.
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
import { createContext, useContext } from 'react';

/**
 * Internal dependencies
 */
import { PDF_PAGE_PADDING, PDF_PAGE_WIDTH } from './pdf-scale';

/**
 * The report's full content width in points (page minus its padding).
 *
 * The default available width for complex-script line layout. Narrower
 * containers (tiles, table cells) override it via `PDFWidthContext.Provider`.
 *
 * @since n.e.x.t
 */
export const PDF_CONTENT_WIDTH = PDF_PAGE_WIDTH - 2 * PDF_PAGE_PADDING;

/**
 * The available width, in points, for text at the current point in the tree.
 *
 * `PDFTypography` reads it to lay complex-script text out into lines that fit.
 * An over-estimate only causes the line to overflow rather than to wrap (and
 * crash), so providers can supply approximate widths safely.
 *
 * @since n.e.x.t
 */
export const PDFWidthContext = createContext< number >( PDF_CONTENT_WIDTH );

/**
 * Reads the available text width, in points, for the current subtree.
 *
 * @since n.e.x.t
 *
 * @return {number} The available width in points.
 */
export function usePDFTextWidth(): number {
	return useContext( PDFWidthContext );
}
