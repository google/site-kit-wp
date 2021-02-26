/**
 * SettingsModules component.
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
import { useEffect } from 'react';
import { useHistory, Redirect, Route, Switch } from 'react-router-dom';

/**
 * Internal dependencies
 */
import { getModulesData, listFormat } from '../../util';
import SettingsAdmin from './SettingsAdmin';
import SettingsConnectedServices from './SettingsConnectedServices';
import SettingsConnectMoreServices from './SettingsConnectMoreServices';

function SettingsModules() {
	const modulesData = getModulesData();
	const history = useHistory();

	useEffect( () => {
		if ( global._googlesitekitLegacyData.editmodule && modulesData[ global._googlesitekitLegacyData.editmodule ].active ) {
			history.push( `/connected-services/${ global._googlesitekitLegacyData.editmodule }/edit` );
		}
	}, [] );

	if ( ! Object.values( modulesData ).length ) {
		return null;
	}

	const toDependantModules = ( dependantModules, dependantSlug ) => {
		const dependantModule = modulesData[ dependantSlug ];
		return dependantModule
			?	[ ...dependantModules, dependantModule.name ]
			: dependantModules;
	};

	const getDependantModulesText = ( { dependants } ) =>
		dependants && dependants.length > 0
			? listFormat( dependants.reduce( toDependantModules, [] ) )
			: '';

	const withDependantModulesText = ( module ) => ( {
		...module,
		dependantModulesText: getDependantModulesText( module ),
	} );

	const byActiveNoInternals = ( active ) => ( module ) =>
		! module.internal && active === module.active;

	const getModulesByStatus = ( { active } = {} ) =>
		Object.values( modulesData )
			.filter( byActiveNoInternals( active ) )
			.sort( ( a, b ) => a.sort - b.sort )
			.map( withDependantModulesText );

	const activeModules = getModulesByStatus( { active: true } );
	const inactiveModules = getModulesByStatus( { active: false } );

	return (
		<Switch>
			{ /* Settings Module Routes */ }
			<Route path={ [ '/connected-services/:moduleSlug/:action', '/connected-services/:moduleSlug', '/connected-services' ] }>
				<SettingsConnectedServices modules={ activeModules } />
			</Route>
			<Route path="/connect-more-services">
				<SettingsConnectMoreServices modules={ inactiveModules } />
			</Route>
			<Route path="/admin-settings">
				<SettingsAdmin />
			</Route>

			{ /* Redirects for routes that existed before React Router implementation. */ }
			<Redirect from="/settings/:moduleSlug/edit" to="/connected-services/:moduleSlug/edit" />
			<Redirect from="/settings/:moduleSlug" to="/connected-services/:moduleSlug" />
			<Redirect from="/settings" to="/connected-services" />
			<Redirect from="/connect" to="/connect-more-services" />
			<Redirect from="/admin" to="/admin-settings" />

			{ /* Fallback to `/connected-services` route if no match found. */ }
			<Redirect to="/connected-services" />
		</Switch>
	);
}

export default SettingsModules;
