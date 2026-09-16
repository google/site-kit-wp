/**
 * Type definitions for widgets.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import type { ComponentType } from 'react';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Date range passed to a PDF widget's `getData`, adjusted to exclude the current day.
 *
 * @since 1.181.0
 */
export interface PDFReportDates {
	startDate: string;
	endDate: string;
	compareStartDate: string;
	compareEndDate: string;
}

/**
 * Base parameters a PDF widget's `getData` loader receives.
 *
 * @since 1.186.0
 */
export interface PDFDataLoaderParams {
	/** WordPress data registry, with `resolveSelect` added. */
	registry: WPDataRegistry & {
		// `resolveSelect` is on the registry at runtime but missing from the
		// upstream `WPDataRegistry` type, so add it here with the same type as
		// `select`.
		resolveSelect: WPDataRegistry[ 'select' ];
	};
	/** Report date range. */
	dates: PDFReportDates;
	/** Signal that cancels the export. */
	signal: AbortSignal;
	/**
	 * The module slugs the current user can view, or `undefined` on the owner's
	 * dashboard where every module is viewable. A loader that composes several
	 * modules' data uses this to match the dashboard's module visibility.
	 */
	viewableModules?: string[];
}

/**
 * Parameters a PDF widget's `getData` loader receives.
 *
 * @since 1.183.0
 * @since 1.186.0 Added `viewOnly`.
 */
export interface GetPDFDataParams extends PDFDataLoaderParams {
	/** Whether the export runs on a view-only dashboard, where a loader leaves out the links an administrator sees. */
	viewOnly: boolean;
}

/**
 * Props every PDF widget `Component` receives from the report mapper.
 *
 * `data` is `unknown` at this boundary: each widget owns its own data shape and
 * narrows it inside its own `Component`.
 *
 * @since 1.181.0
 */
export interface PDFWidgetComponentProps {
	data?: unknown;
	chartImages?: Record< string, string >;
}

/**
 * A PDF widget `Component`, optionally exposing a `preload` to resolve its lazy
 * chunk before rendering (the `@react-pdf` renderer does not honour Suspense).
 *
 * @since 1.181.0
 */
export type PDFWidgetComponent = ComponentType< PDFWidgetComponentProps > & {
	preload?: () => Promise< {
		default: ComponentType< PDFWidgetComponentProps >;
	} >;
};

/**
 * Resolved output of a PDF widget's `getData`.
 *
 * @since 1.181.0
 */
export interface WidgetPDFData {
	data?: unknown;
	chartImages?: Record< string, string >;
}

/**
 * PDF export configuration for a widget.
 *
 * @since 1.181.0
 * @since 1.186.0 Added `viewOnly` to the `getData` params.
 */
export interface WidgetPDFConfig {
	Component: PDFWidgetComponent;
	getData: ( params: GetPDFDataParams ) => Promise< WidgetPDFData >;
	label?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- The registry `select` is loosely typed, so `isActive` predicates can read store selectors without casting.
	isActive?: ( select: ( storeName: string ) => any ) => boolean;
}

/**
 * Widget interface.
 *
 * Represents a registered widget with its configuration and settings.
 *
 * @since 1.170.0
 * @since 1.181.0 Added optional `pdf` config.
 */
export interface Widget {
	slug: string;
	Component: ComponentType;
	priority: number;
	width: string | string[];
	wrapWidget: boolean;
	modules?: string | string[];
	isActive?: () => boolean;
	isPreloaded?: () => boolean;
	hideOnBreakpoints?: string[];
	pdf?: WidgetPDFConfig;
}

/**
 * Widget area interface.
 *
 * Represents a registered widget area as returned by `getWidgetAreas` /
 * `getWidgetArea`. This is the typed lens over the `.js` widgets datastore.
 *
 * @since 1.181.0
 */
export interface WidgetArea {
	slug: string;
	title?: string;
	subtitle?: string;
	pdfTitle?: string;
	pdfReportTitle?: string;
	priority?: number;
	style?: string;
	Icon?: ComponentType;
}
