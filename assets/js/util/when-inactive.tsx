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
 * External dependencies
 */
import type { ComponentType } from 'react';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import { hyphenCaseToPascalCase } from '@/js/googlesitekit/data/transform-case';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';

interface WhenInactiveProps {
	WidgetNull?: ComponentType< Record< string, never > > | null;
}

interface WhenInactiveOptions< P > {
	FallbackComponent?: ComponentType< P >;
	moduleName: string;
}

/**
 * Higher-Order Component to render wrapped components when selected module is not active.
 *
 * @since 1.128.0
 *
 * @param {Object}      options                   Options for enhancing function.
 * @param {string}      options.moduleName        Name of a module to check.
 * @param {WPComponent} options.FallbackComponent Optional. Fallback component to render when the module is not active.
 * @return {Function} Enhancing function.
 */
export default function whenInactive< P extends WhenInactiveProps >( {
	moduleName,
	FallbackComponent,
}: WhenInactiveOptions< P > ): (
	WrappedComponent: ComponentType< P >
) => ComponentType< P > {
	return ( WrappedComponent: ComponentType< P > ) => {
		function WhenInactiveComponent( props: P ) {
			const module = useSelect(
				( select: Select ) =>
					select( CORE_MODULES ).getModule( moduleName ),
				[ moduleName ]
			);

			// Return null if the module is not loaded yet or doesn't exist.
			if ( ! module ) {
				return null;
			}

			// This component isn't widget-specific but widgets need to use `WidgetNull`
			// from props when rendering "null" output.
			const DefaultFallbackComponent: ComponentType< P > | null =
				FallbackComponent ||
				( props.WidgetNull as ComponentType< P > | null ) ||
				null;

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
