/**
 * Widgets combination utilities.
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
 * External dependencies
 */
import isEqual from 'lodash/isEqual';

/**
 * Internal dependencies
 */
import { SPECIAL_WIDGET_STATES } from './constants';

function stateAndRowMatch( stateA, stateB, rowA, rowB ) {
	return rowA === rowB && isEqual( stateA, stateB );
}

/**
 * Determines whether all the widgets in a given area should be combined.
 *
 * The given widgets in an area can all be combined if they are
 * all from the same module and they are all in the same special
 * state (see #3225).
 *
 * @since 1.34.0
 *
 * @param {Array.<Object>} widgets      List of widgets.
 * @param {Object}         widgetStates Map of widget slug and their
 *                                             state (either an object with
 *                                             `Component` and `metadata`, or
 *                                             `null`).
 * @return {boolean} 			Whether all the widgets should be combined.
 */
function shouldCombineAllWidgets( widgets, widgetStates ) {
	const states = {};

	for ( let i = 0; i < widgets.length; i++ ) {
		const widget = widgets[ i ];
		const widgetState = widgetStates?.[ widget.slug ];

		const state = widgetState?.Component;
		const module = widgetState?.metadata?.moduleSlug;
		const isSpecialState = SPECIAL_WIDGET_STATES.includes( state );

		if ( ! state || ! module || ! isSpecialState ) {
			return false;
		}

		if ( states[ module ] ) {
			if ( states[ module ] !== state ) {
				// We have a widget from a given module in a different state from the others.
				return false;
			}
		} else {
			states[ module ] = state;
		}
	}

	if ( Object.keys( states ).length > 1 ) {
		// We have multiple modules, so the widgets can't be combined.
		return false;
	}

	return true;
}

/*
 * Combines consecutive widgets with similar states within the same row.
 *
 * @since 1.25.0
 *
 * @param {Array.<Object>} widgets             List of widgets.
 * @param {Object}         widgetStates        Map of widget slug and their
 *                                             state (either an object with
 *                                             `Component` and `metadata`, or
 *                                             `null`).
 * @param {Object}         layout              Layout arguments from
 *                                             	`getWidgetLayout()`.
 * @param {Array.<number>} layout.columnWidths List of column widths for each
 *                                             widget.
 * @param {Array.<number>} layout.rowIndexes   List of row indexes for each
 *                                             widget.
 * @return {Object} Object with `overrideComponents` property, both of which are a
 * 					list with one item for each widget. Every `overrideComponents`
 * 					entry is either an object with `Component` and `metadata`, or
 * 					`null` (similar to the `widgetStates` parameter).
 */
export function combineWidgets( widgets, widgetStates, {
	columnWidths,
	rowIndexes,
} ) {
	const overrideComponents = [];
	const gridColumnWidths = [ ...columnWidths ];

	let currentState = null;
	let currentRowIndex = -1;
	let columnWidthsBuffer = [];

	if ( shouldCombineAllWidgets( widgets, widgetStates ) ) {
		// All the widgets have the same state, so we should only render one and hide the rest.
		const hiddenRows = Array.from( { length: widgets.length - 1 } ).fill( 0 );
		// Since all the components are the same, we can just pick the first.
		const overrideComponent = widgetStates[ widgets[ 0 ].slug ];

		return {
			overrideComponents: [ overrideComponent ],
			gridColumnWidths: [
				12, // Full width row.
				...hiddenRows,
			],
		};
	}

	widgets.forEach( ( widget, i ) => {
		overrideComponents.push( null );

		currentState = widgetStates[ widget.slug ];
		currentRowIndex = rowIndexes[ i ];

		// If the current widget has a special state...
		if ( currentState ) {
			if ( stateAndRowMatch( currentState, widgetStates[ widgets[ i + 1 ]?.slug ], currentRowIndex, rowIndexes[ i + 1 ] ) ) {
				// If the current widget state and row index match the next
				// state and row index, hide the widget entirely. Only the last
				// similar instance will be rendered in this case.
				columnWidthsBuffer.push( columnWidths[ i ] );
				// Mark this column as width = 0, so we can hide it
				gridColumnWidths[ i ] = 0;
			} else if ( columnWidthsBuffer.length > 0 ) {
				// If the state and row index do not match the next ones and
				// there are already similar instances (from previous
				// iterations), this is the last similar instance, so the
				// combined version will need to be displayed instead of the
				// widget. The combined version will use the common Component
				// and pass all common metadata as props.
				columnWidthsBuffer.push( columnWidths[ i ] );

				// Get total (desktop) column width. For tablet and phone,
				// the component should span the full width as by definition
				// it is at least a "half" widget wide (which has that behavior).
				const combinedColumnWidth = columnWidthsBuffer.reduce( ( sum, columnWidth ) => sum + columnWidth, 0 );

				overrideComponents[ i ] = currentState;

				// This final column should have the combined width
				gridColumnWidths[ i ] = combinedColumnWidth;

				// Reset the columnWidthsBuffer variable.
				columnWidthsBuffer = [];
			}
		}
	} );

	return {
		gridColumnWidths,
		overrideComponents,
	};
}
