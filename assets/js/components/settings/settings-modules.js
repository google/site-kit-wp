/**
 * SettingsModules component.
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
import SettingsModule from './settings-module';
/**
 * External dependencies
 */
import Layout from 'GoogleComponents/layout/layout';
import Notification from 'GoogleComponents/notifications/notification';
import SettingsOverlay from './settings-overlay';
import { clearAppLocalStorage } from 'GoogleUtil/index';

import { __ } from '@wordpress/i18n';
import { map, filter, sortBy } from 'lodash';
import { Component, Fragment } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';

class SettingsModules extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			error: false,
			isEditing: {},
			openModules: {},
			isSaving: false,
		};

		this.mapToModule = this.mapToModule.bind( this );
		this.updateModulesList = this.updateModulesList.bind( this );
		this.handleButtonAction = this.handleButtonAction.bind( this );
		this.handleAccordion = this.handleAccordion.bind( this );
	}

	componentDidMount() {
		if ( googlesitekit.editmodule && googlesitekit.modules[ googlesitekit.editmodule ].active ) {
			this.handleButtonAction( `${ googlesitekit.editmodule }-module`, 'edit' );
		}
	}

	updateModulesList() {
		this.forceUpdate();
	}

	handleAccordion( module, e ) {
		// Set focus on heading when clicked.
		e.target.closest( '.googlesitekit-settings-module__header' ).focus();

		this.setState( ( prevState ) => {
			return {
				openModules: {
					...prevState.openModules,
					[ module ]: ! prevState.openModules[ module ],
				},
			};
		} );
	}

	/**
	 * Handle clicks on the Edit, Cancel and Confirm buttons.
	 *
	 * @param {string} module         The module slug.
	 * @param {string} action         The action being performed, one of 'edit', 'cancel' or 'confirm'.
	 * @param {boolean} nothingToSave Skip saving for this click.
	 */
	handleButtonAction( module, action, nothingToSave = false ) {
		if ( 'confirm' === action ) {
			const modulePromise = applyFilters( 'googlekit.SettingsConfirmed', false, module );
			if ( nothingToSave ) {
				this.setState( ( prevState ) => {
					return {
						isSaving: false,
						error: false,
						isEditing: {
							...prevState.isEditing,
							[ module ]: ! prevState.isEditing[ module ],
						},
					};
				} );
				return;
			}

			this.setState( { isSaving: module } );
			if ( ! modulePromise ) {
				// Clears session and local storage on successful setting.
				clearAppLocalStorage();

				return;
			}
			modulePromise.then( () => {
				// Clears session and local storage on every successful setting.
				clearAppLocalStorage();

				this.setState( ( prevState ) => {
					return {
						isSaving: false,
						error: false,
						isEditing: {
							...prevState.isEditing,
							[ module ]: ! prevState.isEditing[ module ],
						},
					};
				} );
			} ).catch( ( err ) => {
				this.setState( {
					isSaving: false,
					error: {
						errorCode: err.code,
						errorMsg: err.message,
					},
				} );
			} );
		} else {
			this.setState( ( prevState ) => {
				return {
					isEditing: {
						...prevState.isEditing,
						[ module ]: ! prevState.isEditing[ module ],
					},
					error: false, // Reset error state when switching modules.
				};
			} );
		}
	}

	settingsModuleComponent( module, isSaving ) {
		const { provides } = googlesitekit.modules[ module.slug ];
		const { isEditing, openModules, error } = this.state;
		const isOpen = openModules[ module.slug ] || false;

		return (
			<SettingsModule
				key={ module.slug + '-module' }
				slug={ module.slug }
				name={ module.name }
				description={ module.description }
				homepage={ module.homepage }
				learnmore={ module.learnMore }
				active={ module.active }
				hasSettings={ module.hasSettings }
				autoActivate={ module.autoActivate }
				updateModulesList={ this.updateModulesList }
				handleEdit={ this.handleButtonAction }
				handleConfirm
				isEditing={ isEditing }
				isOpen={ isOpen }
				handleAccordion={ this.handleAccordion }
				handleDialog={ this.handleDialog }
				provides={ provides }
				isSaving={ isSaving }
				screenID={ module.screenID }
				error={ error }
			/>
		);
	}

	/**
	 * Return list of modules markup.
	 *
	 * @param {Object}  modules List of modules
	 * @param {boolean} active Sets styling for active modules, helps with parent/child grouping.
	 */
	mapToModule( modules, active = false ) {
		const { isSaving } = this.state;

		if ( active ) {
			return map( modules, function mapFn( module ) {
				return (
					<Fragment key={ module.slug + '-module-wrapper' }>
						{ this.settingsModuleComponent( module, isSaving ) }
					</Fragment>
				);
			}.bind( this ) );
		}

		return map( modules, function mapFn( module ) {
			return (
				<div
					className="mdc-layout-grid__cell mdc-layout-grid__cell--span-4"
					key={ module.slug + '-module-wrapper' }
				>
					{ this.settingsModuleComponent( module, isSaving ) }
				</div>
			);
		}.bind( this ) );
	}

	render() {
		const { isEditing } = this.state;
		const { activeTab } = this.props;
		const modulesBeingEdited = filter( isEditing, ( module ) => module );
		const editActive = 0 < modulesBeingEdited.length;
		if ( ! window.googlesitekit || ! window.googlesitekit.modules ) {
			return null;
		}

		// Filter out internal modules.
		const modules = filter( window.googlesitekit.modules, ( module ) => ! module.internal );

		const activeModules = this.mapToModule(
			sortBy(
				filter(
					modules,
					function( module ) {
						return module.active;
					}
				),
				'sort'
			),
			true
		);

		const inactiveModules = this.mapToModule(
			sortBy(
				filter(
					modules,
					{
						active: false,
					}
				),
				'sort'
			)
		);

		const inactiveModulesAvailable = 0 < inactiveModules.length;

		return (
			<Fragment>
				{ /* Active Modules*/ }
				{ (
					0 < activeModules.length && // If we have active modules.
					0 === activeTab ) && // If <SettingsApp/> is on the Connected tab. TODO this could be removed after refactoring this into separate components.
					<div className="
						mdc-layout-grid__cell
						mdc-layout-grid__cell--span-12
					">
						<Layout>
							{ activeModules }
						</Layout>
					</div>
				}

				{ /* Inactive Modules */ }
				{ 1 === activeTab && // If <SettingsApp/> is on the Add tab. TODO this could be removed after refactoring this into separate components.
					inactiveModulesAvailable && // We have inactive modules available.

					<div className="
								mdc-layout-grid__cell
								mdc-layout-grid__cell--span-12
							">
						<Layout
							header
							title={ __( 'Connect More Services to Gain More Insights', 'google-site-kit' ) }
							relative
						>
							<div className="mdc-layout-grid">
								<div className="mdc-layout-grid__inner">
									{ 0 < inactiveModules.length && inactiveModules }
								</div>
							</div>
							{ /* TODO: Need some input here with regards to changing state */ }
							{ editActive && <SettingsOverlay /> }
						</Layout>
					</div>
				}
				{ 1 === activeTab && // If <SettingsApp/> is on the Add tab. TODO this could be removed after refactoring this into separate components.
					! inactiveModulesAvailable && // If we have no active modules.
					<div className="
						mdc-layout-grid__cell
						mdc-layout-grid__cell--span-12
					">
						<Notification
							id="no-more-modules"
							title={ __( 'Congrats, you’ve connected all services!', 'google-site-kit' ) }
							description={ __( 'We’re working on adding new services to Site Kit by Google all the time, so please check back in the future.', 'google-site-kit' ) }
							format="small"
							smallImage={ `${ googlesitekit.admin.assetsRoot }images/thumbs-up.png` }
							type="win-success"
						/>
					</div>
				}
			</Fragment>
		);
	}
}

export default SettingsModules;
