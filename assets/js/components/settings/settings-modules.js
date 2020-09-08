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
 * External dependencies
 */
import { map, filter, sortBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { Component, Fragment } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { clearWebStorage } from '../../util';
import Layout from '../layout/layout';
import Notification from '../notifications/notification';
import SettingsModule from './settings-module';
import SettingsOverlay from './settings-overlay';
import { isPermissionScopeError } from '../../googlesitekit/datastore/user/utils/is-permission-scope-error';
import { STORE_NAME as CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
const { withSelect, withDispatch } = Data;

class SettingsModules extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			error: false,
			isSaving: false,
		};

		this.mapToModule = this.mapToModule.bind( this );
		this.updateModulesList = this.updateModulesList.bind( this );
		this.handleButtonAction = this.handleButtonAction.bind( this );
		this.handleAccordion = this.handleAccordion.bind( this );
	}

	updateModulesList() {
		this.forceUpdate();
	}

	handleAccordion( module, e ) {
		const { activeModule, moduleState } = this.props;
		// Set focus on heading when clicked.
		e.target.closest( '.googlesitekit-settings-module__header' ).focus();

		// If same as activeModule, toggle closed, otherwise it is open.
		const isOpen = module !== activeModule || ! moduleState;
		this.props.setActiveModule( isOpen ? module : null );
	}

	/**
	 * Handle clicks on the Edit, Cancel and Confirm buttons.
	 *
	 * @param {string} module         The module slug.
	 * @param {string} action         The action being performed, one of 'edit', 'cancel' or 'confirm'.
	 */
	handleButtonAction( module, action ) {
		if ( 'confirm' === action ) {
			const modulePromise = applyFilters( 'googlekit.SettingsConfirmed', false, module );

			this.setState( { isSaving: module } );
			if ( ! modulePromise ) {
				// Clears session and local storage on successful setting.
				clearWebStorage();

				return;
			}
			modulePromise.then( () => {
				// Clears session and local storage on every successful setting.
				clearWebStorage();

				this.setState( {
					isSaving: false,
					error: false,
				} );

				this.props.setModuleState( 'view' );
			} ).catch( ( err ) => {
				let error;
				if ( isPermissionScopeError( err ) ) {
					error = false;
				} else {
					error = {
						errorCode: err.code,
						errorMsg: err.message,
					};
				}
				this.setState( {
					isSaving: false,
					error,
				} );
			} );
		} else {
			this.setState( {
				error: false, // Reset error state when switching modules.
			} );
			this.props.setModuleState(
				this.props.moduleState === 'edit' ? 'view' : 'edit'
			);
		}
	}

	settingsModuleComponent( module, isSaving ) {
		const { activeTab, activeModule, moduleState, modules } = this.props;
		if ( ! modules ) {
			return null;
		}

		const isCurrentModule = activeModule === module.slug;
		const { settingsComponent: SettingsComponent, provides } = modules[ module.slug ];
		const { error } = this.state;

		if ( activeTab === 0 && SettingsComponent ) {
			return <SettingsComponent slug={ module.slug } />;
		}

		return (
			<SettingsModule
				key={ module.slug + '-module' }
				slug={ module.slug }
				name={ module.name }
				description={ module.description }
				homepage={ module.homepage }
				learnmore={ module.learnMore }
				active={ module.active }
				setupComplete={ module.connected }
				hasSettings={ !! module.settings && 'search-console' !== module.slug }
				forceActive={ module.forceActive }
				updateModulesList={ this.updateModulesList }
				handleEdit={ this.handleButtonAction }
				handleConfirm
				isEditing={ { [ `${ activeModule }-module` ]: moduleState === 'edit' } }
				isOpen={ isCurrentModule && moduleState }
				handleAccordion={ this.handleAccordion }
				handleDialog={ this.handleDialog }
				provides={ provides }
				isSaving={ isSaving }
				error={ error }
			/>
		);
	}

	/**
	 * Return list of modules markup.
	 *
	 * @param {Object}  modules List of modules
	 * @param {boolean} active Sets styling for active modules, helps with parent/child grouping.
	 *
	 * @return {HTMLElement} HTML markup with modules.
	 *
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
		const { modules: modulesData } = this.props;
		if ( ! modulesData ) {
			return null;
		}

		const { isEditing } = this.state;
		const { activeTab } = this.props;
		const modulesBeingEdited = filter( isEditing, ( module ) => module );
		const editActive = 0 < modulesBeingEdited.length;
		if ( ! Object.values( modulesData ).length ) {
			return null;
		}

		// Filter out internal modules.
		const modules = filter( modulesData, ( module ) => ! module.internal );

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
							smallImage={ `${ global._googlesitekitLegacyData.admin.assetsRoot }images/thumbs-up.png` }
							type="win-success"
						/>
					</div>
				}
			</Fragment>
		);
	}
}

export default compose(
	withSelect( ( select ) => {
		const activeModule = select( CORE_MODULES ).getCurrentSettingsViewModule();
		return {
			modules: select( CORE_MODULES ).getModules(),
			activeModule,
			moduleState: select( CORE_MODULES ).getSettingsViewModuleState( activeModule ),
		};
	} ),
	withDispatch( ( dispatch ) => {
		return {
			setActiveModule( slug ) {
				dispatch( CORE_MODULES ).setSettingsViewCurrentModule( slug || '' );
			},
			setModuleState( state ) {
				dispatch( CORE_MODULES ).setSettingsViewIsEditing( state === 'edit' );
			},
		};
	} )
)( SettingsModules );
