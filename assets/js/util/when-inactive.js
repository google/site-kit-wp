/**
 * `whenInactive` HOC.
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
import Data from 'googlesitekit-data';
import { CORE_MODULES } from '../googlesitekit/modules/datastore/constants';
import { hyphenCaseToPascalCase } from '../googlesitekit/data/transform-case';
const { useSelect } = Data;

/**
 * Higher-Order Component to render wrapped components when selected module is not active.
 *
 * @since n.e.x.t
 *
 * @param {Object}      options                   Options for enhancing function.
 * @param {string}      options.moduleName        Name of a module to check.
 * @param {WPComponent} options.FallbackComponent Optional. Fallback component to render when the module is not active.
 * @return {Function} Enhancing function.
 */
export default function whenInactive( { moduleName, FallbackComponent } ) {
	return ( WrappedComponent ) => {
		function WhenInactiveComponent( props ) {
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
			if ( module.active === true ) {
				return (
					DefaultFallbackComponent && (
						<DefaultFallbackComponent { ...props } />
					)
				);
			}

			// Return the active and connected component.
			return <WrappedComponent { ...props } />;
		}

		WhenInactiveComponent.displayName = `When${ hyphenCaseToPascalCase(
			moduleName
		) }Inactive`;
		if ( WrappedComponent.displayName || WrappedComponent.name ) {
			WhenInactiveComponent.displayName += `(${
				WrappedComponent.displayName || WrappedComponent.name
			})`;
		}

		return WhenInactiveComponent;
	};
}
