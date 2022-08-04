/**
 * ModulesList component.
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_SITE } from '../googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '../googlesitekit/modules/datastore/constants';
import { CORE_LOCATION } from '../googlesitekit/datastore/location/constants';
import { trackEvent } from '../util';
import ModulesListItem from './ModulesListItem';
import useViewContext from '../hooks/useViewContext';

const { useSelect, useDispatch } = Data;

export default function ModulesList( { moduleSlugs } ) {
	const { activateModule } = useDispatch( CORE_MODULES );
	const { navigateTo } = useDispatch( CORE_LOCATION );
	const { setInternalServerError } = useDispatch( CORE_SITE );
	const viewContext = useViewContext();

	const modules = useSelect( ( select ) =>
		select( CORE_MODULES ).getModules()
	);

	const handleSetupModule = useCallback(
		async ( slug ) => {
			const { response, error } = await activateModule( slug );

			if ( error ) {
				setInternalServerError( {
					id: 'setup-module-error',
					description: error.message,
				} );
				return null;
			}

			await trackEvent(
				`${ viewContext }_authentication-success-notification`,
				'activate_module',
				slug
			);

			// Redirect to ReAuthentication URL
			navigateTo( response.moduleReauthURL );
		},
		[ activateModule, navigateTo, setInternalServerError, viewContext ]
	);

	if ( modules === undefined ) {
		return null;
	}

	// Filter specific modules.
	const moduleObjects =
		Array.isArray( moduleSlugs ) && moduleSlugs.length
			? moduleSlugs
					.filter( ( slug ) => modules[ slug ] )
					.reduce(
						( acc, slug ) => ( {
							...acc,
							[ slug ]: modules[ slug ],
						} ),
						{}
					)
			: modules;

	// Filter out internal modules and remove modules with dependencies.
	const modulesToShow = Object.values( moduleObjects )
		.filter(
			( module ) => ! module.internal && 0 === module.dependencies.length
		)
		.sort( ( a, b ) => a.order - b.order );

	return (
		<div className="googlesitekit-modules-list">
			{ modulesToShow.map( ( module ) => (
				<ModulesListItem
					key={ module.slug }
					module={ module }
					handleSetupModule={ handleSetupModule }
				/>
			) ) }
		</div>
	);
}

ModulesList.propTypes = {
	moduleSlugs: PropTypes.arrayOf( PropTypes.string ).isRequired,
};
