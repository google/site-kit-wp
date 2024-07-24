/**
 * `whenInViewContext` HOC.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import useViewContext from '../hooks/useViewContext';
import useViewOnly from '../hooks/useViewOnly';

/**
 * Higher-Order Component to render wrapped components based on view context.
 *
 * @since 1.132.0
 *
 * @param {Object}  options                Options for enhancing function.
 * @param {boolean} options.allViewOnly    Render component when in view only context.
 * @param {boolean} options.allNonViewOnly Render component when not in view only context.
 * @param {boolean} options.includeList    Array of view contexts that the component should render when present.
 * @param {boolean} options.excludeList    Array of view contexts that the component should render when not present.
 * @return {Function} Enhancing function.
 */
export default function whenInViewContext( {
	allViewOnly,
	allNonViewOnly,
	includeList,
	excludeList,
} ) {
	return ( WrappedComponent ) => {
		function WhenInViewContext( props ) {
			const isViewOnly = useViewOnly();
			const viewContext = useViewContext();

			invariant(
				! ( !! allViewOnly && !! allNonViewOnly ),
				'Cannot allow both `allViewOnly` and `allNonViewOnly` contexts; if all contexts are allowed, remove this `whenInViewContext` wrapper.'
			);

			invariant(
				! ( !! includeList && !! excludeList ),
				'Do not use both an include and exclude lists for `whenInViewContext`'
			);

			if ( allViewOnly && ! isViewOnly ) {
				return null;
			}

			if ( allNonViewOnly && isViewOnly ) {
				return null;
			}

			if ( !! includeList && ! includeList.includes( viewContext ) ) {
				return null;
			}

			if ( !! excludeList && excludeList.includes( viewContext ) ) {
				return null;
			}

			return <WrappedComponent { ...props } />;
		}

		return WhenInViewContext;
	};
}
