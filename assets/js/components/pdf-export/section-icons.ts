/**
 * PDF report section icons for @react-pdf/renderer.
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
import { Path, Rect, Svg } from '@react-pdf/renderer';
import { ReactNode, createElement } from 'react';

/**
 * Internal dependencies
 */
import {
	CONTEXT_MAIN_DASHBOARD_CONTENT,
	CONTEXT_MAIN_DASHBOARD_KEY_METRICS,
	CONTEXT_MAIN_DASHBOARD_MONETIZATION,
	CONTEXT_MAIN_DASHBOARD_SPEED,
	CONTEXT_MAIN_DASHBOARD_TRAFFIC,
} from '@/js/googlesitekit/widgets/default-contexts';
import { PDF_HEADER_COLORS } from './pdf-theme';
import type { PDFIcon } from './types';

const DEFAULT_SIZE = 12;

/**
 * Builds a section icon component from inlined SVG children.
 *
 * @since n.e.x.t
 *
 * @param renderChildren Receives the resolved fill colour, returns the SVG children.
 * @return Section icon component.
 */
function makeIcon( renderChildren: ( color: string ) => ReactNode ): PDFIcon {
	return function Icon( { size = DEFAULT_SIZE, color } ) {
		return createElement(
			Svg,
			{ width: size, height: size, viewBox: '0 0 20 20' },
			renderChildren( color ?? PDF_HEADER_COLORS.chipIcon )
		);
	};
}

const KeyMetricsIcon = makeIcon( ( color ) =>
	// A 2×2 grid of rounded squares; only the x/y offsets differ.
	(
		[
			[ 3, 3 ],
			[ 11.167, 3 ],
			[ 3, 11.167 ],
			[ 11.167, 11.167 ],
		] as const
	 ).map( ( [ x, y ], index ) =>
		createElement( Rect, {
			key: index,
			width: 5.833,
			height: 5.833,
			x,
			y,
			rx: 1.167,
			fill: color,
		} )
	)
);

const TrafficIcon = makeIcon( ( color ) =>
	createElement( Path, {
		d: 'M4.94 17a1.39 1.39 0 0 1-1.02-.418 1.39 1.39 0 0 1-.418-1.022V8.226c0-.403.14-.743.418-1.022a1.388 1.388 0 0 1 1.02-.418c.403 0 .744.14 1.022.418.279.279.418.62.418 1.022v7.334c0 .403-.14.744-.418 1.022A1.39 1.39 0 0 1 4.94 17Zm5.077-.002a1.39 1.39 0 0 1-1.022-.417 1.39 1.39 0 0 1-.418-1.022l-.016-11.12c0-.402.14-.743.418-1.021A1.39 1.39 0 0 1 10.001 3c.403 0 .743.14 1.022.418.278.278.418.619.418 1.02l.015 11.12c0 .403-.14.744-.418 1.023a1.39 1.39 0 0 1-1.021.418Zm5.045.002a1.39 1.39 0 0 1-1.022-.418 1.39 1.39 0 0 1-.418-1.022v-3.62c0-.403.14-.744.418-1.022a1.39 1.39 0 0 1 1.022-.418c.402 0 .742.14 1.02.418.279.278.418.619.418 1.021v3.621c0 .403-.14.744-.418 1.022a1.388 1.388 0 0 1-1.02.418Z',
		fill: color,
	} )
);

const ContentIcon = makeIcon( ( color ) =>
	createElement( Path, {
		d: 'M10.953 8.464h2.12c.22 0 .41-.081.573-.243a.785.785 0 0 0 .243-.574.782.782 0 0 0-.243-.573.782.782 0 0 0-.574-.244h-2.12a.785.785 0 0 0-.573.244.784.784 0 0 0-.243.573c0 .22.081.412.243.574a.787.787 0 0 0 .574.243Zm0 4.706h2.12c.22 0 .41-.082.573-.244a.782.782 0 0 0 .243-.573.785.785 0 0 0-.243-.574.784.784 0 0 0-.574-.243h-2.12c-.22 0-.41.081-.573.243a.787.787 0 0 0-.243.574c0 .22.081.411.243.573a.785.785 0 0 0 .574.244ZM6.79 9.32h1.712c.22 0 .411-.082.573-.244a.782.782 0 0 0 .244-.573V6.79a.782.782 0 0 0-.244-.573.784.784 0 0 0-.573-.243H6.79a.784.784 0 0 0-.573.243.784.784 0 0 0-.243.573v1.712c0 .22.081.411.243.573a.782.782 0 0 0 .573.244Zm0 4.704h1.712c.22 0 .411-.08.573-.242a.782.782 0 0 0 .244-.573v-1.712a.782.782 0 0 0-.244-.573.782.782 0 0 0-.573-.244H6.79a.782.782 0 0 0-.573.244.784.784 0 0 0-.243.573v1.712c0 .22.081.411.243.573a.784.784 0 0 0 .573.242ZM4.633 17c-.453 0-.839-.159-1.157-.476A1.577 1.577 0 0 1 3 15.367V4.633c0-.453.159-.839.476-1.157A1.577 1.577 0 0 1 4.633 3h10.734c.453 0 .839.159 1.157.476.317.318.476.704.476 1.157v10.734c0 .453-.159.839-.476 1.157a1.578 1.578 0 0 1-1.157.476H4.633Zm0-1.633h10.734V4.633H4.633v10.734Z',
		fill: color,
	} )
);

const SpeedIcon = makeIcon( ( color ) =>
	createElement( Path, {
		d: 'M8.668 12.938c.333.32.774.482 1.323.489.548.007.954-.19 1.218-.594l3.417-5.125c.139-.208.118-.402-.063-.583-.18-.18-.374-.202-.583-.063l-5.167 3.396c-.403.25-.61.642-.624 1.177-.014.535.146.97.479 1.303Zm-4.334 3.729c-.32 0-.618-.07-.895-.209a1.473 1.473 0 0 1-.646-.625 8.493 8.493 0 0 1-.834-1.989 8.207 8.207 0 0 1-.291-2.198c0-1.139.219-2.212.656-3.219a8.486 8.486 0 0 1 1.792-2.646A8.447 8.447 0 0 1 6.772 3.99a8.056 8.056 0 0 1 3.229-.657c.625 0 1.23.063 1.812.188a7.328 7.328 0 0 1 1.688.583.762.762 0 0 1 .458.604c.042.278-.041.535-.25.771a.821.821 0 0 1-.489.261.952.952 0 0 1-.573-.073 6.361 6.361 0 0 0-2.646-.584c-1.82 0-3.371.642-4.656 1.927-1.285 1.285-1.927 2.83-1.927 4.636 0 .57.083 1.135.25 1.698a7.43 7.43 0 0 0 .666 1.573h11.334a6.07 6.07 0 0 0 .687-1.615 6.768 6.768 0 0 0 .229-1.74c0-.43-.052-.87-.156-1.322a5.414 5.414 0 0 0-.469-1.282.82.82 0 0 1-.073-.583.874.874 0 0 1 .303-.479c.236-.18.486-.243.75-.188.263.056.458.216.583.48a9.51 9.51 0 0 1 .594 1.604 6.57 6.57 0 0 1 .218 1.708 8.518 8.518 0 0 1-.26 2.281 7.92 7.92 0 0 1-.844 2.052 1.451 1.451 0 0 1-.667.625c-.291.14-.59.209-.895.209H4.334Z',
		fill: color,
	} )
);

const MonetizationIcon = makeIcon( ( color ) =>
	createElement( Path, {
		d: 'M2.313 14.375a.836.836 0 0 1-.25-.615c0-.243.083-.447.25-.614l3.75-3.75c.5-.5 1.1-.75 1.803-.75.7 0 1.295.25 1.78.75l.958.958a.777.777 0 0 0 .574.229c.229 0 .42-.076.572-.229l3.604-3.604h-1.228a.843.843 0 0 1-.615-.26.843.843 0 0 1-.26-.615.84.84 0 0 1 .26-.615.843.843 0 0 1 .615-.26h3.333c.236 0 .44.087.614.26a.84.84 0 0 1 .26.615v3.333a.843.843 0 0 1-.26.615.843.843 0 0 1-.614.26.84.84 0 0 1-.614-.26.841.841 0 0 1-.261-.615V7.979l-3.625 3.604c-.5.5-1.101.75-1.803.75-.7 0-1.295-.25-1.78-.75l-.98-.979a.752.752 0 0 0-.552-.229.748.748 0 0 0-.551.229L3.52 14.375a.823.823 0 0 1-.603.25.824.824 0 0 1-.606-.25Z',
		fill: color,
	} )
);

/**
 * Maps a dashboard context slug to its section icon.
 *
 * Keyed by the main-dashboard context slugs that surface in the PDF; contexts
 * without a nav icon (e.g. site goals) are intentionally absent. Entity-dashboard
 * contexts are also omitted because PDF export is main-dashboard only today; add
 * them here when entity-context export lands, otherwise those chips render
 * label-only (handled gracefully by `PDFHeaderSectionChip`).
 *
 * @since n.e.x.t
 */
export const SECTION_ICONS: Record< string, PDFIcon > = {
	[ CONTEXT_MAIN_DASHBOARD_KEY_METRICS ]: KeyMetricsIcon,
	[ CONTEXT_MAIN_DASHBOARD_TRAFFIC ]: TrafficIcon,
	[ CONTEXT_MAIN_DASHBOARD_CONTENT ]: ContentIcon,
	[ CONTEXT_MAIN_DASHBOARD_SPEED ]: SpeedIcon,
	[ CONTEXT_MAIN_DASHBOARD_MONETIZATION ]: MonetizationIcon,
};
