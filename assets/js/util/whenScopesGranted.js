/**
 * `whenScopesGranted` HOC.
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
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_USER } from '../googlesitekit/datastore/user/constants';

/**
 * Higher-Order Component to render wrapped components when specified scopes
 * are available to this user.
 *
 * If the scopes are not available, a fallback component is rendered instead.
 *
 * A higher-order component is used here instead of hooks because there is
 * potential for related selectors in components this HOC wraps to call out to
 * resolvers that call endpoints for modules that aren't active. This would
 * cause 404s at best and possibly errors, so it's better to wrap them in HOCs
 * and "return early".
 *
 * @since 1.127.0
 *
 * @param {Object}      options                     Options for enhancing function.
 * @param {string}      options.scopes              Array of scopes to check.
 * @param {WPComponent} [options.FallbackComponent] Optional. Fallback component to render when the module is not active.
 * @return {Function} Enhancing function.
 */
export default function whenScopesGranted( {
	scopes = [],
	FallbackComponent,
} ) {
	return ( WrappedComponent ) => {
		function WhenScopesGranted( props ) {
			const allScopeResults = useSelect(
				( select ) => {
					return scopes.map( ( scope ) => {
						return select( CORE_USER ).hasScope( scope );
					} );
				},
				[ scopes ]
			);

			// Return null if any scopes aren't yet loaded.
			if (
				allScopeResults.some( ( hasScope ) => {
					return hasScope === undefined;
				} )
			) {
				return null;
			}

			// This component isn't widget-specific but widgets need to use
			// `WidgetNull` from props when rendering "null" output.
			const DefaultFallbackComponent =
				FallbackComponent || props.WidgetNull || null;

			// Return a fallback (by default, `<WidgetNull />`) if any scopes are
			// not present for this user.
			if (
				allScopeResults.some( ( hasScope ) => {
					return hasScope === false;
				} )
			) {
				return (
					DefaultFallbackComponent && (
						<DefaultFallbackComponent { ...props } />
					)
				);
			}

			// Return the component if the user has all scopes specified.
			return <WrappedComponent { ...props } />;
		}

		WhenScopesGranted.displayName = 'WhenScopesGranted';

		return WhenScopesGranted;
	};
}
