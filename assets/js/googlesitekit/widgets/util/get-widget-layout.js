/**
 * Widgets layout utilities.
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
import { WIDTH_GRID_COUNTER_MAP, WIDTH_GRID_CLASS_MAP } from './constants';

/**
 * Adjusts class names to better fit into the current row knowing that the default sizes don't fill the row completely.
 *
 * @since 1.21.0
 *
 * @param {Array.<string>} classNames   Current class names.
 * @param {Array.<number>} columnWidths Current column widths.
 * @param {number}         counter      Current counter.
 * @return {Array} Array where the first element is the updated list of class
 *                 names, the second element is the updated list of column
 *                 widths, and the third element is the resulting counter
 *                 after the update.
 */
function resizeClasses( classNames, columnWidths, counter ) {
	// Safeguard: counter must always be 9 for this to work.
	if ( counter !== 9 ) {
		return [ classNames, columnWidths, counter ];
	}

	classNames = [ ...classNames ];
	columnWidths = [ ...columnWidths ];

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

		// Replace the 3-column class with a 4-column class, or the 6-column
		// class with an 8-column class so that the overall row expands from
		// 9 to the full 12 columns.
		if ( singleWidgetClassNames.includes( 'mdc-layout-grid__cell--span-3-desktop' ) ) {
			singleWidgetClassNames[ singleWidgetClassNames.indexOf( 'mdc-layout-grid__cell--span-3-desktop' ) ] = 'mdc-layout-grid__cell--span-4-desktop';
			counter -= 3;
			columnWidths[ i ] = 4; // Correct the column width.
		} else if ( singleWidgetClassNames.includes( 'mdc-layout-grid__cell--span-6-desktop' ) ) {
			singleWidgetClassNames[ singleWidgetClassNames.indexOf( 'mdc-layout-grid__cell--span-6-desktop' ) ] = 'mdc-layout-grid__cell--span-8-desktop';
			counter -= 6;
			columnWidths[ i ] = 8; // Correct the column width.
		}

		classNames[ i ] = singleWidgetClassNames; // Correct the class names.
		i--;
	}

	return [ classNames, columnWidths, counter ];
}

/**
 * Gets an array of sizes that widget can take accounting the current counter value.
 *
 * @since 1.21.0
 *
 * @param {number} counter The current counter.
 * @param {Object} widget  Widget object.
 * @return {Array.<Object>} List of objects with `counter` and `width` properties.
 */
function getWidgetSizes( counter, widget ) {
	const widths = Array.isArray( widget.width ) ? widget.width : [ widget.width ];
	return widths.map( ( width ) => ( {
		counter: counter + WIDTH_GRID_COUNTER_MAP[ width ],
		width,
	} ) );
}

/**
 * Gets widget class names as well as column widths and row indexes for an area.
 *
 * @since n.e.x.t
 *
 * @param {Array.<Object>} activeWidgets List of active widgets.
 * @return {Object} Object with `classNames`, `columnWidths` and `rowIndexes`
 *                  properties, each of which is an array with one item for
 *                  each active widget.
 */
export function getWidgetLayout( activeWidgets ) {
	let counter = 0;
	let rowIndex = 0;

	let classNames = [].fill( null, 0, activeWidgets.length );
	let columnWidths = [];
	const rowIndexes = [];

	const ascending = ( { counter: a }, { counter: b } ) => a - b;
	const descending = ( { counter: a }, { counter: b } ) => b - a;
	const fitIntoRow = ( { counter: width } ) => width <= 12;

	activeWidgets.forEach( ( widget, i ) => {
		// Get available sizes for the current widget to select the most appropriate width for the current row.
		let sizes = getWidgetSizes( counter, widget );

		if (
			// If it is the last widget in the entire widget area.
			i + 1 === activeWidgets.length ||
			// Or the next widget can't fit into the current row anyway, then we can try to use alternative sizes.
			getWidgetSizes( sizes.sort( ascending )[ 0 ].counter, activeWidgets[ i + 1 ] ).filter( fitIntoRow ).length === 0
		) {
			// We need to check whether we have a size that can fit into the row and if so, try to get it.
			const hasSizeThatCanFitIntoRow = sizes.some( fitIntoRow );
			if ( hasSizeThatCanFitIntoRow ) {
				// Sort available sizes to have the descending order.
				sizes = sizes.sort( descending );
				// Filter out only those sizes that fit into the current row.
				sizes = sizes.filter( fitIntoRow );
			}
		}

		// Grab the width of the first size in the sizes list, it's either the default one or the best suiting to the current row.
		const width = sizes[ 0 ].width;

		// Populate initial column width and row index for the widget.
		// These may be corrected below in certain situations.
		columnWidths.push( WIDTH_GRID_COUNTER_MAP[ width ] );
		rowIndexes.push( rowIndex );

		// Increase column counter based on width.
		counter += WIDTH_GRID_COUNTER_MAP[ width ];

		// If counter is going above 12, this widget is too wide for the current row.
		// So it's going to be the first widget in the next row instead.
		if ( counter > 12 ) {
			counter -= WIDTH_GRID_COUNTER_MAP[ width ];

			// Correct the previously added row index for this widget as it
			// will end up in the following row.
			rowIndexes[ i ]++;

			// If the column count without the overflowing widget is exactly 9, expand
			// the widths of these widgets slightly to fill the entire 12 columns.
			if ( counter === 9 ) {
				[ classNames, columnWidths, counter ] = resizeClasses( classNames, columnWidths, counter );
			}

			// See above, initial counter for the next row of widgets.
			counter = WIDTH_GRID_COUNTER_MAP[ width ];
			rowIndex++;
		} else if ( counter % 12 === 0 ) {
			// Or if the counter is exactly 12, the next widget is going to be in a new row.
			counter = 0;
			rowIndex++;
		}

		// Actually set the class for the current widget. This must be set after
		// potentially resizing classes, since in that case this will be the overflowing
		// widget which should NOT be adjusted because it will be in the next row.
		classNames[ i ] = WIDTH_GRID_CLASS_MAP[ width ];
	} );

	if ( counter === 9 ) {
		[ classNames, columnWidths, counter ] = resizeClasses( classNames, columnWidths, counter );
	}

	return { classNames, columnWidths, rowIndexes };
}
