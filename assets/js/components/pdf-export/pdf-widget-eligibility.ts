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
import type { Select } from 'googlesitekit-data';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import type { Widget, WidgetPDFConfig } from '@/js/googlesitekit/widgets/types';
import { normalizeWidgetModules } from '@/js/googlesitekit/widgets/util/widget-modules';

/**
 * A registry widget that declares a PDF export configuration.
 *
 * @since 1.183.0
 */
export type WidgetWithPDF = Widget & { pdf: WidgetPDFConfig };

/**
 * Determines whether a registry widget declares a PDF export configuration.
 *
 * @since 1.183.0
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
 * A widget is eligible when it declares a `pdf` config, every module it
 * needs is connected, and its optional `pdf.isActive` returns `true`.
 * The sections selection panel and the orchestrator both use this
 * function, so the panel and the report always show the same widgets.
 *
 * On the Site Kit dashboard, the `whenActive` HOC keeps a disconnected
 * module's widgets off the screen. The PDF export skips that HOC, so this
 * function checks the modules instead. Without that check, `getData` would
 * run for a disconnected module, and the API would reject the request with
 * the "Module must be active to request data" error.
 *
 * @since 1.183.0
 * @since 1.184.0 Require every module in `widget.modules` to be connected.
 *
 * @param widget Registry widget.
 * @param select Registry `select` function.
 * @return `true` when the widget should appear in the PDF.
 */
export function isActivePDFWidget(
	widget: Widget,
	select: Select
): widget is WidgetWithPDF {
	if ( ! hasPDFConfig( widget ) ) {
		return false;
	}

	if ( widget.pdf.isActive && ! widget.pdf.isActive( select ) ) {
		return false;
	}

	// `isModuleConnected` returns `undefined` while modules load and `null`
	// for an unknown module, so only `true` counts as connected.
	return normalizeWidgetModules( widget.modules ?? [] ).every(
		( slug ) => select( CORE_MODULES ).isModuleConnected( slug ) === true
	);
}
