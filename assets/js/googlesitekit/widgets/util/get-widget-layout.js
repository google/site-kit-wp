/**
 * Widgets layout utilities.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { WIDTH_GRID_COUNTER_MAP } from './constants';
import { isInactiveWidgetState } from './is-inactive-widget-state';

/**
 * Adjusts column widths to better fit into the current row knowing that the default sizes don't fill the row completely.
 *
 * @since 1.21.0
 *
 * @param {Array.<number>} columnWidths Current column widths.
 * @param {number}         counter      Current counter.
 * @return {Array} Array where the first element is the updated list of column
 *                 widths, and the second element is the resulting counter
 *                 after the update.
 */
function resizeColumns( columnWidths, counter ) {
	// Safeguard: counter must always be 9 for this to work.
	if ( counter !== 9 ) {
		return [ columnWidths, counter ];
	}
	columnWidths = [ ...columnWidths ];

	// Start counting backwards from the last item.
	let i = columnWidths.length - 1;

	// Go back until counter is 0. The i >= 0 check is an extra safeguard that, with
	// correct usage should never apply, but is still useful to avoid infinite loops
	// if the function was used incorrectly.
	while ( counter !== 0 && i >= 0 ) {
		// Replace the 3-column width with a 4-column width, or the 6-column
		// width with an 8-column width so that the overall row expands from
		// 9 to the full 12 columns.
		if ( columnWidths[ i ] === 3 ) {
			counter -= 3;
			columnWidths[ i ] = 4; // Correct the column width.
		} else if ( columnWidths[ i ] === 6 ) {
			counter -= 6;
			columnWidths[ i ] = 8; // Correct the column width.
		}

		i--;
	}

	return [ columnWidths, counter ];
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
	const widths = Array.isArray( widget.width )
		? widget.width
		: [ widget.width ];
	return widths.map( ( width ) => ( {
		counter: counter + WIDTH_GRID_COUNTER_MAP[ width ],
		width,
	} ) );
}

/**
 * Gets the first active widget in a list of widgets, after a specified offset,
 * based on a set of widget states specifying which widgets are inactive.
 *
 * @since 1.28.0
 * @private
 *
 * @param {number}         offset       The current index offset.
 * @param {Array.<Object>} widgets      List of widgets.
 * @param {Array.<Object>} widgetStates List of widget states.
 * @return {Object|null} Object representing the next active widget from the widgets array,
 * or null if no more active widgets exist.
 */
function getNextActiveWidget( offset, widgets, widgetStates ) {
	while ( ++offset < widgets.length ) {
		if (
			! isInactiveWidgetState( widgetStates[ widgets[ offset ].slug ] )
		) {
			return widgets[ offset ];
		}
	}
	return null;
}

/**
 * Gets widget class names as well as column widths and row indexes for an area.
 *
 * @since 1.25.0
 *
 * @param {Array.<Object>} widgets      List of widgets.
 * @param {Array.<Object>} widgetStates List of widget states.
 * @return {Object} Object with `columnWidths` and `rowIndexes`
 *                  properties, each of which is an array with one item for
 *                  each active widget.
 */
export function getWidgetLayout( widgets, widgetStates ) {
	let columnWidths = [];
	const rowIndexes = [];

	if ( ! widgets?.length ) {
		return { columnWidths, rowIndexes };
	}

	let counter = 0;
	let rowIndex = 0;
	const ascending = ( { counter: a }, { counter: b } ) => a - b;
	const descending = ( { counter: a }, { counter: b } ) => b - a;
	const fitIntoRow = ( { counter: width } ) => width <= 12;

	widgets.forEach( ( widget, i ) => {
		// If a widget is inactive, we set null / 0 values and don't need to calculate a layout.

		if ( isInactiveWidgetState( widgetStates[ widget.slug ] ) ) {
			columnWidths.push( 0 );
			rowIndexes.push( rowIndex );
			return;
		}

		// Get available sizes for the current widget to select the most appropriate width for the current row.
		let sizes = getWidgetSizes( counter, widget );

		// Get the next active widget to help determine the best width for this widget.
		const nextActiveWidget = getNextActiveWidget(
			i,
			widgets,
			widgetStates
		);

		if (
			// If it is the last widget in the entire widget area.
			null === nextActiveWidget ||
			// Or the next widget can't fit into the current row anyway, then we can try to use alternative sizes.
			getWidgetSizes(
				sizes.sort( ascending )[ 0 ].counter,
				nextActiveWidget
			).filter( fitIntoRow ).length === 0
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

		// Populate row index for the widget. The value may be corrected further below.
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
				[ columnWidths, counter ] = resizeColumns(
					columnWidths,
					counter
				);
			}

			// See above, initial counter for the next row of widgets.
			counter = WIDTH_GRID_COUNTER_MAP[ width ];
			rowIndex++;
		} else if ( counter === 12 ) {
			// Or if the counter is exactly 12, the next widget is going to be in a new row.
			counter = 0;
			rowIndex++;
		}

		// Actually set the columnWidth for the current widget. This must be set after
		// potentially resizing, since in that case this will be the overflowing
		// widget which should NOT be adjusted because it will be in the next row.
		columnWidths.push( WIDTH_GRID_COUNTER_MAP[ width ] );
	} );

	if ( counter === 9 ) {
		[ columnWidths, counter ] = resizeColumns( columnWidths, counter );
	}

	return { columnWidths, rowIndexes };
}
