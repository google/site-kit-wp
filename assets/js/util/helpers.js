/**
 * Helper functions.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
import { createElement, Fragment } from '@wordpress/element';

/**
 * Append the passed component to a filtered component.
 *
 * Components wrapped in the 'withFilters' higher order component have a filter applied to them (wp.hooks.applyFilters).
 * This helper is used to append a filtered component with a passed component. To use, pass as the third
 * argument to an addFilter call, eg:
 *
 * 		addFilter( 'googlesitekit.DashboardModule', // Filter name.
 *			'googlesitekit.DashboardEarningModule', // callback name.
 *			createAddToFilter( <DashboardEarnings /> ), // Using the helper to append a component.
 * 			11 ); // Priority will determine the order items are appended.
 *
 * @param {Component} NewComponent The new component to append to the filtered component.
 *
 * @return {ReactElement} Filtered component with appended component.
 *
 */
export const createAddToFilter = ( NewComponent ) => {
	return ( OriginalComponent ) => {
		return function FilteredComponent( props ) {
			return (
				createElement(
					Fragment,
					{},
					'',
					createElement(
						OriginalComponent,
						props
					),
					NewComponent
				)
			);
		};
	};
};
