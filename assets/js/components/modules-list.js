/**
 * ModulesList component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
import { map } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	refreshAuthentication,
	getReAuthURL,
	activateOrDeactivateModule,
	showErrorNotification,
	moduleIcon,
} from '../util';
import Link from './link';
import data from '../components/data';
import GenericError from './notifications/generic-error';
import ModuleSettingsWarning from './notifications/module-settings-warning';

class ModulesList extends Component {
	constructor( props ) {
		super( props );

		this.setupModuleClick = this.setupModuleClick.bind( this );
	}

	/**
	 * Handle setup module click event.
	 *
	 * @param {string} slug Module slug.
	 */
	async setupModuleClick( slug ) {
		try {
			this.setState( { isSaving: true } );
			await activateOrDeactivateModule( data, slug, true );

			await refreshAuthentication();

			// Redirect to ReAuthentication URL
			global.location = getReAuthURL( slug, true );
		} catch ( err ) {
			showErrorNotification( GenericError, {
				id: 'setup-module-error',
				title: __( 'Internal Server Error', 'google-site-kit' ),
				description: err.message,
				format: 'small',
				type: 'win-error',
			} );
			this.setState( { isSaving: false } );
		}
	}

	render() {
		// Filter out internal modules.
		const modules = Object.values( global.googlesitekit.modules || {} ).filter( ( module ) => ! module.internal );

		// Map of slug => name for every module that is active and completely set up.
		const completedModuleNames = modules
			.filter( ( module ) => module.active && module.setupComplete )
			.reduce( ( completed, module ) => {
				completed[ module.slug ] = module.name;
				return completed;
			}, {} );

		// Sort modules and exclude those that required other modules to be set up.
		// Logic still in place below in case we want to add blocked modules back.
		const sortedModules = modules
			.filter( ( module ) => 0 === module.required.length )
			.sort( ( module1, module2 ) => module1.sort - module2.sort );

		return (
			<div className="googlesitekit-modules-list">
				{ map( sortedModules, ( module ) => {
					let blockedByParentModule = false;
					let parentBlockerName = '';
					const {
						slug,
						name,
						setupComplete: isConnected,
						required: requiredModules,
					} = module;

					// Check if required modules are active.
					if ( 0 < requiredModules.length ) {
						requiredModules.forEach( ( requiredModule ) => {
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
									{ moduleIcon( slug, blockedByParentModule ) }
								</div>
								<h3 className="googlesitekit-settings-connect-module__title">
									{ name }
								</h3>
							</div>
							<ModuleSettingsWarning slug={ slug } context="modules-list" />
							{ isConnected && (
								<span className="googlesitekit-settings-module__status">
									<span className="googlesitekit-settings-module__status-icon googlesitekit-settings-module__status-icon--connected">
										<span className="screen-reader-text">
											{
												__( 'Connected', 'google-site-kit' )
											}
										</span>
									</span>
									{
										__( 'Connected', 'google-site-kit' )
									}
								</span>
							) }
							{ ! isConnected && ! blockedByParentModule && (
								<Link
									arrow
									small
									inherit
									onClick={ () => {
										this.setupModuleClick( slug );
									} }
								> {
										__( 'Connect Service', 'google-site-kit' )
									}
								</Link>
							) }
							{ ! isConnected && blockedByParentModule && (
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
}

export default ModulesList;
