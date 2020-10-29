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
import { createElement, Fragment, useEffect, useRef } from '@wordpress/element';

/**
 * Appends the passed component to a filtered component.
 *
 * Components wrapped in the 'withFilters' higher order component have a filter applied to them (wp.hooks.applyFilters).
 * This helper is used to append a filtered component with a passed component. To use, pass as the third
 * argument to an addFilter call, eg:
 *
 * 		addFilter( 'googlesitekit.DashboardModule', // Filter name.
 *			'googlesitekit.DashboardEarningModule', // callback name.
 *			createAddToFilter( <LegacyDashboardEarnings /> ), // Using the helper to append a component.
 * 			11 ); // Priority will determine the order items are appended.
 *
 * @since 1.0.0
 *
 * @param {WPElement} NewComponent The new component to append to the filtered component.
 * @return {WPElement} Filtered component with appended component.
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

/**
 * Replaces a filtered component with the passed component and merge their props.
 *
 * Components wrapped in the 'withFilters' higher order component have a filter applied
 * to them (wp.hooks.applyFilters).
 *
 * This helper is used to replace (or "Fill") a filtered component with a passed component.
 * To use, pass as the third argument to an addFilter call, eg.
 *
 * ```
 * 	addFilter(
 * 		`googlesitekit.someFilter`,
 * 		'googlesitekit.someNamespace',
 * 		fillFilterWithComponent( SomeComponent, extraProps )
 * );
 * ```
 *
 * @since 1.0.0
 *
 * @param {WPElement} NewComponent The component to render in place of the filtered component.
 * @param {Object}    newProps     The props to pass down to the new component.
 * @return {WPElement} React Component after overriding filtered component with NewComponent.
 */
export const fillFilterWithComponent = ( NewComponent, newProps ) => {
	return ( OriginalComponent ) => {
		return function InnerComponent( props ) {
			return (
				<NewComponent { ...props } { ...newProps } OriginalComponent={ OriginalComponent } />
			);
		};
	};
};

/**
 * Merges forwarded refs and refs within a component so that they can be used in functional components.
 *
 * Ideally we should be able to write the following:
 *
 * ```
 *	const Component = React.forwardRef( ( props, ref ) => {
 *  	const innerRef = React.useRef( ref ); // set ref as an initial value
 * } );
 * ```
 * but this is not the case. The ref from outside stays { current: undefined }.
 * To fix that we need to write some manual update function for the ref
 * and merge those refs to use the single reference value.
 *
 * @since @next
 *
 * @param {...Object} refs Object from useRef or createRef functions.
 * @return {Object} Merged refs object.
 */
export const useCombinedRefs = ( ...refs ) => {
	const targetRef = useRef();

	useEffect( () => {
		refs.forEach( ( reference ) => {
			if ( ! reference ) {
				return;
			}

			if ( typeof reference === 'function' ) {
				reference( targetRef.current );
			} else {
				reference.current = targetRef.current;
			}
		} );
	}, [ refs ] );

	return targetRef;
};
