/**
 * ModulesList component.
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
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	showErrorNotification,
	trackEvent,
} from '../util';
import Data from 'googlesitekit-data';
import Link from './Link';
import ModuleIcon from './ModuleIcon';
import GenericError from './legacy-notifications/generic-error';
import ModuleSettingsWarning from './legacy-notifications/module-settings-warning';
import VisuallyHidden from './VisuallyHidden';
import { STORE_NAME as CORE_MODULES } from '../googlesitekit/modules/datastore/constants';

const { useSelect, useDispatch } = Data;

function ModulesList( { moduleSlugs } ) {
	const { activateModule } = useDispatch( CORE_MODULES );
	const modulesData = useSelect( ( select ) => select( CORE_MODULES ).getModules() );

	const handleSetupModule = useCallback( async ( slug ) => {
		const { response, error } = await activateModule( slug );

		if ( error ) {
			showErrorNotification( GenericError, {
				id: 'setup-module-error',
				title: __( 'Internal Server Error', 'google-site-kit' ),
				description: error.message,
				format: 'small',
				type: 'win-error',
			} );
			return null;
		}

		await trackEvent(
			`${ slug }_setup`,
			'module_activate',
			slug,
		);

		// Redirect to ReAuthentication URL
		global.location.assign( response.moduleReauthURL );
	}, [ activateModule ] );

	if ( ! modulesData ) {
		return null;
	}

	// Filter specific modules
	const moduleObjects = Array.isArray( moduleSlugs ) && moduleSlugs.length
		? moduleSlugs
			.filter( ( slug ) => modulesData.hasOwnProperty( slug ) )
			.reduce( ( acc, slug ) => ( { ...acc, [ slug ]: modulesData[ slug ] } ), {} )
		: modulesData;

	// Filter out internal modules and remove modules with dependencies.
	const modules = Object.values( moduleObjects )
		.filter( ( module ) => ! module.internal && 0 === module.dependencies.length )
		.sort( ( module1, module2 ) => module1.sort - module2.sort );

	return (
		<div className="googlesitekit-modules-list">
			{ modules.map( ( module ) => {
				const {
					slug,
					name,
					connected,
					active,
				} = module;
				const setupComplete = connected && active;

				return (
					<div
						key={ slug }
						className={ classnames(
							'googlesitekit-modules-list__module',
							`googlesitekit-modules-list__module--${ slug }`,
						) }
					>
						<div className="googlesitekit-settings-connect-module__wrapper">
							<div className="googlesitekit-settings-connect-module__logo">
								<ModuleIcon slug={ slug } />
							</div>
							<h3 className="googlesitekit-settings-connect-module__title">
								{ name }
							</h3>
						</div>
						<ModuleSettingsWarning slug={ slug } context="modules-list" />
						{ setupComplete && (
							<span className="googlesitekit-settings-module__status">
								<span className="googlesitekit-settings-module__status-icon googlesitekit-settings-module__status-icon--connected">
									<VisuallyHidden>
										{ __( 'Connected', 'google-site-kit' ) }
									</VisuallyHidden>
								</span>
								{ __( 'Connected', 'google-site-kit' ) }
							</span>
						) }
						{ ! setupComplete && (
							<Link
								onClick={ () => handleSetupModule( slug ) }
								arrow
								small
								inherit
							>
								{ __( 'Connect Service', 'google-site-kit' ) }
							</Link>
						) }
					</div>
				);
			} ) }
		</div>
	);
}

export default ModulesList;
