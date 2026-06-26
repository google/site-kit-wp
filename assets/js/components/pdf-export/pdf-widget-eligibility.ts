/**
 * PDF export widget eligibility helpers.
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
 * Internal dependencies
 */
import type { Widget, WidgetPDFConfig } from '@/js/googlesitekit/widgets/types';

/**
 * A registry widget that declares a PDF export configuration.
 *
 * @since n.e.x.t
 */
export type WidgetWithPDF = Widget & { pdf: WidgetPDFConfig };

/**
 * Determines whether a registry widget declares a PDF export configuration.
 *
 * @since n.e.x.t
 *
 * @param widget Registry widget.
 * @return `true` when the widget has a `pdf` config.
 */
function hasPDFConfig( widget: Widget ): widget is WidgetWithPDF {
	return !! widget.pdf;
}

/**
 * Determines whether a widget should be included in the PDF export.
 *
 * A widget is eligible when it declares a `pdf` config and either omits
 * `pdf.isActive` or its `pdf.isActive` predicate returns `true` for the current
 * store state. This is the single source of truth shared by the sidesheet
 * (which offers selectable sections) and the orchestrator (which builds the
 * document), so the two cannot drift on which widgets are PDF-eligible.
 *
 * @since n.e.x.t
 *
 * @param widget Registry widget.
 * @param select Registry `select` function, forwarded to `pdf.isActive`.
 * @return `true` when the widget should appear in the PDF.
 */
export function isActivePDFWidget(
	widget: Widget,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- The registry `select` is loosely typed, so `isActive` predicates can read store selectors without casting.
	select: ( storeName: string ) => any
): widget is WidgetWithPDF {
	return (
		hasPDFConfig( widget ) &&
		( ! widget.pdf.isActive || widget.pdf.isActive( select ) )
	);
}
