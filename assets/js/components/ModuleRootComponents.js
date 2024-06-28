/**
 * ModuleRootComponents component.
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
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_MODULES } from '../googlesitekit/modules/datastore/constants';

function ModuleRootComponents( { dashboardType } ) {
	const modules = useSelect( ( select ) =>
		select( CORE_MODULES ).getModules()
	);

	const filteredModules = [];
	if ( modules ) {
		for ( const moduleSlug in modules ) {
			if (
				modules[ moduleSlug ].connected &&
				( ( 'main' === dashboardType &&
					modules[ moduleSlug ]?.MainRootComponent ) ||
					( 'entity' === dashboardType &&
						modules[ moduleSlug ]?.EntityRootComponent ) )
			) {
				filteredModules.push( modules[ moduleSlug ] );
			}
		}
	}

	if ( ! filteredModules?.length ) {
		return null;
	}

	const rootComponents = filteredModules.map( ( Module, index ) =>
		'main' === dashboardType ? (
			<Module.MainRootComponent
				key={ `module-root-component-${ index }` }
			/>
		) : (
			<Module.EntityRootComponent
				key={ `module-root-component-${ index }` }
			/>
		)
	);

	return rootComponents;
}

ModuleRootComponents.propTypes = {
	dashboardType: PropTypes.oneOf( [ 'main', 'entity' ] ).isRequired,
};

export default ModuleRootComponents;
