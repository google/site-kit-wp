/**
 * Widgets class names utilities.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { WIDGET_WIDTHS } from '../datastore/constants';

const WIDTH_GRID_COUNTER_MAP = {
	[ WIDGET_WIDTHS.QUARTER ]: 3,
	[ WIDGET_WIDTHS.HALF ]: 6,
	[ WIDGET_WIDTHS.FULL ]: 12,
};

const WIDTH_GRID_CLASS_MAP = {
	[ WIDGET_WIDTHS.QUARTER ]: [
		'mdc-layout-grid__cell',
		'mdc-layout-grid__cell--span-2-phone',
		'mdc-layout-grid__cell--span-3-desktop',
		'mdc-layout-grid__cell--span-4-tablet',
	],
	[ WIDGET_WIDTHS.HALF ]: [
		'mdc-layout-grid__cell',
		'mdc-layout-grid__cell--span-6-desktop',
		'mdc-layout-grid__cell--span-8-tablet',
	],
	[ WIDGET_WIDTHS.FULL ]: [
		'mdc-layout-grid__cell',
		'mdc-layout-grid__cell--span-12',
	],
};

/**
 * Adjusts class names to better fit into the current row knowing that the default sizes don't fill the row completely.
 *
 * @since n.e.x.t
 *
 * @param {Array.<string>} classNames Current class names.
 * @param {number}         counter    Current counter.
 * @return {Array.<string>} Updated list of class names.
 */
function resizeClasses( classNames, counter ) {
	// Safeguard: counter must always be 9 for this to work.
	if ( counter !== 9 ) {
		return [ classNames, counter ];
	}

	classNames = [ ...classNames ];

	// Start counting backwards from the last item.
	let i = classNames.length - 1;

	// Go back until counter is 0. The i >= 0 check is an extra safeguard that, with
	// correct usage should never apply, but is still useful to avoid infinite loops
	// if the function was used incorrectly.
	while ( counter !== 0 && i >= 0 ) {
		// Skip any classNames that are `null`; this happens when the component itself
		// renders `null`.
		if ( ! classNames[ i ] || ! Array.isArray( classNames[ i ] ) ) {
			i--;
			continue;
		}

		const singleWidgetClassNames = [ ...classNames[ i ] ];

		// Replace the 3-column class with a 4-column class so this element goes from 1/4
		// to 1/3 on desktop.
		if ( singleWidgetClassNames.includes( 'mdc-layout-grid__cell--span-3-desktop' ) ) {
			singleWidgetClassNames[ singleWidgetClassNames.indexOf( 'mdc-layout-grid__cell--span-3-desktop' ) ] = 'mdc-layout-grid__cell--span-4-desktop';
			counter -= 3;
		}

		// Replace the 6-column class with a 8-column class so this element goes from 1/2
		// to 2/3 on desktop.
		if ( singleWidgetClassNames.includes( 'mdc-layout-grid__cell--span-6-desktop' ) ) {
			singleWidgetClassNames[ singleWidgetClassNames.indexOf( 'mdc-layout-grid__cell--span-6-desktop' ) ] = 'mdc-layout-grid__cell--span-8-desktop';
			counter -= 6;
		}

		classNames[ i ] = singleWidgetClassNames;
		i--;
	}

	return [ classNames, counter ];
}

/**
 * Gets widget class names for an area.
 *
 * @since n.e.x.t
 *
 * @param {Array.<Object>} activeWidgets List of active widgets.
 * @return {Array.<string>} List of class names for active widgets.
 */
export function getWidgetClassNames( activeWidgets ) {
	let counter = 0;
	let classNames = [].fill( null, 0, activeWidgets.length );

	activeWidgets.forEach( ( widget, i ) => {
		// Let's make sure we always have an array of widths for the widget.
		const widths = Array.isArray( widget.width ) ? widget.width : [ widget.width ];

		// Get available sizes for the current widget to select the most appropriate width for the current row.
		let sizes = widths.map( ( widgetWidth ) => [ counter + WIDTH_GRID_COUNTER_MAP[ widgetWidth ], widgetWidth ] );

		// If it is the last widget, we can try to use an alternative size if it fits into the current row.
		if ( i + 1 === activeWidgets.length ) {
			// We need to check whether we have a size that can fit into the row and if so, try to get it.
			const hasSizeThatCanFitIntoRow = sizes.some( ( [ widgetWidth ] ) => widgetWidth <= 12 );
			if ( hasSizeThatCanFitIntoRow ) {
				// Sort available sizes to have the descending order.
				sizes = sizes.sort( ( [ a ], [ b ] ) => b - a );
				// Filter out only those sizes that fit into the current row.
				sizes = sizes.filter( ( [ widgetWidth ] ) => widgetWidth <= 12 );
			}
		}

		// Grab the width of the first size in the sizes list, it's either the default one or the best suiting to the current row.
		const width = sizes[ 0 ][ 1 ];

		// Increase column counter based on width.
		counter += WIDTH_GRID_COUNTER_MAP[ width ];

		// If counter is exactly 12, the next widget is going to be in a new row.
		if ( counter % 12 === 0 ) {
			counter = 0;
		}

		// If counter is going above 12, this widget is too wide for the current row.
		// So it's going to be the first widget in the next row instead.
		if ( counter > 12 ) {
			counter -= WIDTH_GRID_COUNTER_MAP[ width ];

			// If the column count without the overflowing widget is exactly 9, expand
			// the widths of these widgets slightly to fill the entire 12 columns.
			if ( counter === 9 ) {
				[ classNames, counter ] = resizeClasses( classNames, counter );
			}

			// See above, initial counter for the next row of widgets.
			counter = WIDTH_GRID_COUNTER_MAP[ width ];
		}

		// Actually set the class for the current widget. This must be set after
		// potentially resizing classes, since in that case this will be the overflowing
		// widget which should NOT be adjusted because it will be in the next row.
		classNames[ i ] = WIDTH_GRID_CLASS_MAP[ width ];
	} );

	if ( counter === 9 ) {
		[ classNames, counter ] = resizeClasses( classNames, counter );
	}

	return classNames;
}
