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
import { useSelect } from 'googlesitekit-data';
import { CORE_MODULES } from '../googlesitekit/modules/datastore/constants';
import { hyphenCaseToPascalCase } from '../googlesitekit/data/transform-case';

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
 * @param {Object}      options                       Options for enhancing function.
 * @param {string}      options.moduleName            Name of a module to check.
 * @param {WPComponent} [options.FallbackComponent]   Optional. Fallback component to render when the module is not active.
 * @param {WPComponent} [options.IncompleteComponent] Optional. Fallback component to render when the module is active but not connected.
 * @return {Function} Enhancing function.
 */
export default function whenActive( {
	moduleName,
	FallbackComponent,
	IncompleteComponent,
} ) {
	return ( WrappedComponent ) => {
		function WhenActiveComponent( props ) {
			const module = useSelect(
				( select ) => select( CORE_MODULES ).getModule( moduleName ),
				[ moduleName ]
			);

			// Return null if the module is not loaded yet or doesn't exist.
			if ( ! module ) {
				return null;
			}

			// This component isn't widget-specific but widgets need to use `WidgetNull`
			// from props when rendering "null" output.
			const DefaultFallbackComponent =
				FallbackComponent || props.WidgetNull || null;

			// Return a fallback if the module is not active.
			if ( module.active === false ) {
				return (
					DefaultFallbackComponent && (
						<DefaultFallbackComponent { ...props } />
					)
				);
			}

			// Return a fallback if the module is active but not connected yet.
			if ( module.connected === false ) {
				// If no IncompleteComponent is provided, use the default fallback.
				const IncompleteFallbackComponent =
					IncompleteComponent || DefaultFallbackComponent;
				return (
					IncompleteFallbackComponent && (
						<IncompleteFallbackComponent { ...props } />
					)
				);
			}

			// Return the active and connected component.
			return <WrappedComponent { ...props } />;
		}

		WhenActiveComponent.displayName = `When${ hyphenCaseToPascalCase(
			moduleName
		) }Active`;
		if ( WrappedComponent.displayName || WrappedComponent.name ) {
			WhenActiveComponent.displayName += `(${
				WrappedComponent.displayName || WrappedComponent.name
			})`;
		}

		return WhenActiveComponent;
	};
}
