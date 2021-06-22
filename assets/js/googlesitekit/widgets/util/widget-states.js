/**
 * Widget state utils.
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
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { SPECIAL_WIDGET_STATES } from './constants';

/**
 * Filters widgets that are in a special state.
 *
 * @since n.e.x.t
 *
 * @param {Array} widgets Array of widget name and state tuples.
 * @return {Array} The widgets that are in a special state.
 */
export const getWidgetsWithSpecialState = ( widgets = [] ) => widgets.filter( ( [ name, state ] ) => SPECIAL_WIDGET_STATES.includes( state ) ); // eslint-disable-line no-unused-vars

/**
 * Groups widgets by state.
 *
 * @since n.e.x.t
 *
 * @param {Array} widgets Array of widget name and state tuples.
 * @return {Array} Array of states and widgets in those states.
 */
export const sortWidgetsByState = ( widgets = [] ) => {
	if ( ! widgets.length ) {
		return [];
	}
	const statesCounter = new Map();

	for ( let i = 0; i < widgets.length; i++ ) {
		const [ name, state ] = widgets[ i ];
		if ( statesCounter.has( state ) ) {
			statesCounter.set( state, [ ...statesCounter.get( state ), name ] );
		} else {
			statesCounter.set( state, [ name ] );
		}
	}

	// Invert the map so that the widget names are the keys
	const invertedMap = new Map( Array.from( statesCounter, ( a ) => a.reverse() ) );
	return [ ...invertedMap ];
};

export const sortWidgetsBySpecialState = compose( sortWidgetsByState, getWidgetsWithSpecialState );

