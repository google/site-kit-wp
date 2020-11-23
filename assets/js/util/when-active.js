/**
 * `whenActive` HOC.
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
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME as CORE_MODULES } from '../googlesitekit/modules/datastore/constants';
import { kebabCaseToPascalCase } from '../googlesitekit/data/transform-case';
const { RegistryConsumer } = Data;

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
 * @param {Object}                options                     Options for enhancing function.
 * @param {string|Array.<string>} options.moduleName          Name of a module to check.
 * @param {Function}              [options.fallbackComponent] Optional. Fallback component to render when the module is not active.
 * @return {Function} Enhancing function.
 */
export default function whenActive( { moduleName, fallbackComponent = null } ) {
	const modules = Array.isArray( moduleName ) ? moduleName : [ moduleName ];
	return ( WrappedComponent ) => {
		const WhenActiveComponent = ( props ) => (
			<RegistryConsumer>
				{ ( registry ) => {
					const areConnected = modules.map( ( module ) => registry.select( CORE_MODULES ).isModuleConnected( module ) );

					// Return null if the module is not loaded yet or doesn't exist.
					if ( ! areConnected.some( ( isConnected ) => isConnected !== undefined && isConnected !== null ) ) {
						return null;
					}

					// Return a fallback if the module isn't connected yet.
					if ( areConnected.some( ( isConnected ) => ! isConnected ) ) {
						return fallbackComponent ? createElement( fallbackComponent ) : fallbackComponent;
					}

					return <WrappedComponent { ...props } />;
				} }
			</RegistryConsumer>
		);

		WhenActiveComponent.wrappedComponent = WrappedComponent;

		WhenActiveComponent.displayName = `When${ modules.map( ( module ) => kebabCaseToPascalCase( module ) ).join( 'And' ) }Active`;
		if ( WrappedComponent.displayName || WrappedComponent.name ) {
			WhenActiveComponent.displayName += `(${ WrappedComponent.displayName || WrappedComponent.name })`;
		}

		return WhenActiveComponent;
	};
}
