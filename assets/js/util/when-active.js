/**
 * whenActive HOC.
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
const { useSelect } = Data;

/**
 * Higher-Order Component to render wrapped components when selected module is active and connected.
 *
 * @since n.e.x.t
 *
 * @param {Object}   options                     Options for enhancing function.
 * @param {string}   options.moduleName          Name of a module to check.
 * @param {Function} [options.fallbackComponent] Optional. Fallback component to render when the module is not active.
 * @return {Function} Enhancing function.
 */
export default function whenActive( { moduleName, fallbackComponent = null } ) {
	return ( wrappedComponent ) => {
		const whenActiveComponent = ( props ) => {
			// eslint-disable-next-line react-hooks/rules-of-hooks
			const moduleInfo = useSelect( ( select ) => select( CORE_MODULES ).getModule( moduleName ) );
			if ( ! moduleInfo ) {
				return null;
			}

			if ( ! moduleInfo.active || ! moduleInfo.connected ) {
				return fallbackComponent ? createElement( fallbackComponent ) : fallbackComponent;
			}

			return createElement( wrappedComponent, props );
		};

		whenActiveComponent.displayName = `When${ kebabCaseToPascalCase( moduleName ) }Active`;
		if ( wrappedComponent.displayName || wrappedComponent.name ) {
			whenActiveComponent.displayName += `(${ wrappedComponent.displayName || wrappedComponent.name })`;
		}

		return whenActiveComponent;
	};
}
