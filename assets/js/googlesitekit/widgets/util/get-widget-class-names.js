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

export function getWidgetClassNames( activeWidgets ) {
	let classNames = [].fill( null, 0, activeWidgets.length );
	let counter = 0;
	activeWidgets.forEach( ( widget, i ) => {
		const width = Array.isArray( widget.width ) ? widget.width[ 0 ] : widget.width;

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
