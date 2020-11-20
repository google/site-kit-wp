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
import map from 'lodash/map';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

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
import GenericError from './notifications/generic-error';
import ModuleSettingsWarning from './notifications/module-settings-warning';
import VisuallyHidden from './VisuallyHidden';
import { STORE_NAME as CORE_MODULES } from '../googlesitekit/modules/datastore/constants';

const { useSelect, useDispatch } = Data;

function ModulesList( { moduleSlugs } ) {
	const { activateModule } = useDispatch( CORE_MODULES );
	const modulesData = useSelect( ( select ) => select( CORE_MODULES ).getModules() ?? {} );

	/**
	 * Handle setup module click event.
	 *
	 * @since 1.0.0
	 *
	 * @param {string} slug Module slug.
	 */
	const handleSetupModule = useCallback( async ( slug ) => {
		try {
			const { response } = await activateModule( slug );
			await trackEvent(
				`${ slug }_setup`,
				'module_activate',
				slug,
			);

			// Redirect to ReAuthentication URL
			global.location.assign( response.moduleReauthURL );
		} catch ( err ) {
			showErrorNotification( GenericError, {
				id: 'setup-module-error',
				title: __( 'Internal Server Error', 'google-site-kit' ),
				description: err.message,
				format: 'small',
				type: 'win-error',
			} );
		}
	}, [ activateModule ] );

	// Filter specific modules
	const moduleObjects = Array.isArray( moduleSlugs ) && moduleSlugs.length
		? moduleSlugs
			.filter( ( slug ) => modulesData.hasOwnProperty( slug ) )
			.reduce( ( acc, slug ) => ( { ...acc, [ slug ]: modulesData[ slug ] } ), {} )
		: modulesData;

	// Filter out internal modules.
	const modules = Object.values( moduleObjects ).filter( ( module ) => ! module.internal );

	// Map of slug => name for every module that is active and completely set up.
	const completedModuleNames = modules
		.filter( ( module ) => module.active && module.connected )
		.reduce( ( completed, module ) => {
			completed[ module.slug ] = module.name;
			return completed;
		}, {} );

	// Sort modules and exclude those that required other modules to be set up.
	// Logic still in place below in case we want to add blocked modules back.
	const sortedModules = modules
		.filter( ( module ) => 0 === module.dependencies.length )
		.sort( ( module1, module2 ) => module1.sort - module2.sort );

	return (
		<div className="googlesitekit-modules-list">
			{ map( sortedModules, ( module ) => {
				let blockedByParentModule = false;
				let parentBlockerName = '';
				const {
					slug,
					name,
					connected,
					active,
					dependencies,
				} = module;
				const setupComplete = connected && active;

				// Check if required modules are active.
				if ( 0 < dependencies.length ) {
					dependencies.forEach( ( requiredModule ) => {
						if ( completedModuleNames[ requiredModule ] ) {
							blockedByParentModule = true;
							parentBlockerName = completedModuleNames[ requiredModule ];
						}
					} );
				}

				return (
					<div
						key={ slug }
						className={ classnames(
							'googlesitekit-modules-list__module',
							`googlesitekit-modules-list__module--${ slug }`,
							{ 'googlesitekit-modules-list__module--disabled': blockedByParentModule }
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
						{ ! setupComplete && ! blockedByParentModule && (
							<Link
								arrow
								small
								inherit
								onClick={ () => handleSetupModule( slug ) }
							>
								{ __( 'Connect Service', 'google-site-kit' ) }
							</Link>
						) }
						{ ! setupComplete && blockedByParentModule && (
							<Link disabled small inherit>
								{
									/* translators: %s: parent module name */
									sprintf( __( 'Enable %s to start setup', 'google-site-kit' ), parentBlockerName )
								}
							</Link>
						) }
					</div>
				);
			} ) }
		</div>
	);
}

export default ModulesList;
