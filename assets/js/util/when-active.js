/**
 * `whenActive` HOC.
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
import Data from 'googlesitekit-data';
import { CORE_MODULES } from '../googlesitekit/modules/datastore/constants';
import { hyphenCaseToPascalCase } from '../googlesitekit/data/transform-case';
const { useSelect } = Data;

/**
 * Higher-Order Component to render wrapped components when selected module is active and connected.
 *
 * A higher-order component is used here instead of hooks because there is potential for
 * related selectors in components this HOC wraps to call out to resolvers that call endpoints
 * for modules that aren't active. This would cause 404s at best and possibly errors, so
 * it's better to wrap them in HOCs and "return early".
 *
 * @since 1.16.0
 *
 * @param {Object}           options                       Options for enhancing function.
 * @param {string}           options.moduleName            Name of a module to check.
 * @param {WPComponent|null} [options.FallbackComponent]   Optional. Fallback component to render when the module is not active.
 * @param {WPComponent|null} [options.IncompleteComponent] Optional. Fallback component to render when the module is active but not connected.
 * @return {Function} Enhancing function.
 */
export default function whenActive( {
	moduleName,
	FallbackComponent,
	IncompleteComponent = null,
} ) {
	return ( WrappedComponent ) => {
		const WhenActiveComponent = ( props ) => {
			const { WidgetNull } = props;
			// The following eslint rule is disabled because it treats the following hook as such that doesn't adhere
			// the "rules of hooks" which is incorrect because the following hook is a valid one.
			// eslint-disable-next-line react-hooks/rules-of-hooks
			const module = useSelect( ( select ) => select( CORE_MODULES ).getModule( moduleName ) );
			const WhenFallbackComponent = FallbackComponent || WidgetNull;

			// Return null if the module is not loaded yet or doesn't exist.
			if ( ! module ) {
				return null;
			}

			// Return a fallback if the module is not active.
			if ( module.active === false ) {
				return <WhenFallbackComponent { ...props } />;
			}

			// Return a fallback if the module is active but not connected yet.
			if ( module.connected === false ) {
				if ( IncompleteComponent !== null ) {
					return <IncompleteComponent { ...props } />;
				}

				// If there isn't a IncompleteComponent then use the WhenFallbackComponent.
				return <WhenFallbackComponent { ...props } />;
			}

			// Return the active and connected component.
			return <WrappedComponent { ...props } />;
		};

		WhenActiveComponent.displayName = `When${ hyphenCaseToPascalCase( moduleName ) }Active`;
		if ( WrappedComponent.displayName || WrappedComponent.name ) {
			WhenActiveComponent.displayName += `(${ WrappedComponent.displayName || WrappedComponent.name })`;
		}

		return WhenActiveComponent;
	};
}
