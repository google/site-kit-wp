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
 * Internal dependencies
 */
import Link from './link';
/**
 * External dependencies
 */
import data from 'SiteKitCore/components/data';
import {
	refreshAuthentication,
	getReAuthUrl,
	activateOrDeactivateModule,
	showErrorNotification,
	moduleIcon,
} from 'GoogleUtil';
import GenericError from 'GoogleComponents/notifications/generic-error';
import ModuleSettingsWarning from 'GoogleComponents/notifications/module-settings-warning';

const { Component } = wp.element;
const { __, sprintf } = wp.i18n;
const { sortBy, filter, map } = lodash;

class ModulesList extends Component {
	constructor( props ) {
		super( props );

		this.setupModuleClick = this.setupModuleClick.bind( this );
	}

	/**
	 * Handle setup module click event.
	 *
	 * @param {string} slug Module slug.
	 * @return void
	 */
	async setupModuleClick( slug ) {
		try {
			this.setState( { isSaving: true } );
			await activateOrDeactivateModule( data, slug, true );

			await refreshAuthentication();

			// Redirect to ReAuthentication URL
			window.location = getReAuthUrl( slug, true );
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
		const modules = window.googlesitekit.modules || [];

		// Sort Modules by sort order.
		let sortedModules = sortBy( modules, ( module, key ) => {
			module.key = key;
			return module.sort;
		} );

		// Prevent modules with dependencies from displaying (Optimize and Tag Manager).
		// Logic still in place below in case we want to add blocked modules back.
		sortedModules = filter( sortedModules, ( module ) => 0 === module.required.length );

		return (
			<div className="googlesitekit-modules-list">
				{ map( sortedModules, 'slug' ).map( ( module ) => {
					let blockedByParentModule = false;
					let parentBlockerName = '';
					const slug = modules[ module ].slug;
					const name = modules[ module ].name;
					const isConnected = modules[ module ].setupComplete;

					// Check if required modules are active.
					if ( 0 < modules[ module ].required.length ) {
						const requiredModules = modules[ module ].required;

						requiredModules.forEach( ( requiredModule ) => {
							if ( 'undefined' !== typeof modules[ requiredModule ] ) {
								blockedByParentModule = ! modules[ requiredModule ].setupComplete;
								parentBlockerName = modules[ requiredModule ].name;
							}
						} );
					}

					return (
						<div key={ slug } className={ `
							googlesitekit-modules-list__module
							googlesitekit-modules-list__module--${ slug }
							${ blockedByParentModule ? 'googlesitekit-modules-list__module--disabled' : '' }
						` }>
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
									{ sprintf( __( 'Enable %s to start setup', 'google-site-kit' ), parentBlockerName ) }
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
