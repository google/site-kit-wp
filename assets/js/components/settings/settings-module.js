/**
 * SettingsModule component.
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
import PropTypes from 'prop-types';
import { filter, map } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { withFilters } from '@wordpress/components';
import { Component, Fragment } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import SvgIcon from '../../util/svg-icon';
import {
	activateOrDeactivateModule,
	getReAuthURL,
	moduleIcon,
	showErrorNotification,
	getModulesData,
} from '../../util';
import { refreshAuthentication } from '../../util/refresh-authentication';
import Link from '../../components/link';
import Button from '../../components/button';
import data, { TYPE_MODULES } from '../../components/data';
import Spinner from '../../components/spinner';
import SettingsOverlay from '../../components/settings/settings-overlay';
import GenericError from '../../components/notifications/generic-error';
import SetupModule from '../../components/setup-module';
import Dialog from '../../components/dialog';
import ModuleSettingsDetails from '../../components/settings/module-settings-details';
import ModuleSetupIncomplete from '../../components/settings/module-setup-incomplete';

/**
 * A single module. Keeps track of its own active state and settings.
 */
class SettingsModule extends Component {
	constructor( props ) {
		super( props );
		const { slug } = props;
		const { setupComplete } = getModulesData()[ slug ];
		this.state = {
			isSaving: false,
			active: props.active,
			setupComplete,
			dialogActive: false,
		};

		this.deactivate = this.deactivate.bind( this );
		this.activateOrDeactivate = this.activateOrDeactivate.bind( this );
		this.handleDialog = this.handleDialog.bind( this );
		this.handleCloseModal = this.handleCloseModal.bind( this );
		this.handleConfirmRemoveModule = this.handleConfirmRemoveModule.bind( this );
	}

	componentDidMount() {
		global.addEventListener( 'keyup', this.handleCloseModal, false );
	}

	componentWillUnmount() {
		global.removeEventListener( 'keyup', this.handleCloseModal );
	}

	async activateOrDeactivate() {
		try {
			const { active } = this.state;
			const newActiveState = ! active;

			this.setState( { isSaving: true } );

			await activateOrDeactivateModule(
				data,
				this.props.slug,
				newActiveState
			);

			await refreshAuthentication();

			if ( false === newActiveState ) {
				data.invalidateCacheGroup( TYPE_MODULES, this.props.slug );
			}

			this.setState( {
				isSaving: false,
				active: newActiveState,
			} );

			global.location = getReAuthURL( this.props.slug, false );
		} catch ( err ) {
			showErrorNotification( GenericError, {
				id: 'activate-module-error',
				title: __( 'Internal Server Error', 'google-site-kit' ),
				description: err.message,
				format: 'small',
				type: 'win-error',
			} );
			this.setState( { isSaving: false } );
		}
	}

	deactivate() {
		if ( this.props.autoActivate ) {
			return;
		}
		this.activateOrDeactivate();
	}

	handleDialog() {
		this.setState( ( prevState ) => {
			return {
				dialogActive: ! prevState.dialogActive,
			};
		} );
	}

	// Handle user click on the confirm removal button.
	handleConfirmRemoveModule() {
		this.deactivate();
	}

	handleCloseModal( e ) {
		if ( 27 === e.keyCode ) {
			this.setState( {
				dialogActive: false,
			} );
		}
	}

	// Find modules that depend on a module.
	getDependentModules() {
		const { slug } = this.props;
		const { modules } = global.googlesitekit;
		const dependants = {};

		if ( modules[ slug ].dependants ) {
			modules[ slug ].dependants.forEach( ( dependantSlug ) => {
				if ( modules[ dependantSlug ] ) {
					dependants[ dependantSlug ] = modules[ dependantSlug ];
				}
			} );
		}

		return dependants;
	}

	render() {
		const {
			active,
			setupComplete,
			dialogActive,
		} = this.state;

		const {
			name,
			slug,
			homepage,
			isEditing,
			isOpen,
			handleAccordion,
			handleEdit,
			description,
			hasSettings,
			autoActivate,
			provides,
			isSaving,
			screenID,
			error,
		} = this.props;

		const moduleKey = `${ slug }-module`;
		const isConnected = applyFilters( `googlesitekit.Connected-${ slug }`, setupComplete );
		const connectedClassName = isConnected
			? 'googlesitekit-settings-module__status-icon--connected'
			: 'googlesitekit-settings-module__status-icon--not-connected';

		/* translators: %s: module name */
		const subtitle = sprintf( __( 'By disconnecting the %s module from Site Kit, you will no longer have access to:', 'google-site-kit' ), name );

		const isSavingModule = isSaving === `${ slug }-module`;
		// Disabled because this rule doesn't acknowledge our use of the variable
		// as a component in JSX.
		// eslint-disable-next-line @wordpress/no-unused-vars-before-return
		const FilteredModuleSettingsDetails = withFilters( `googlesitekit.ModuleSettingsDetails-${ slug }` )( ModuleSettingsDetails );

		// Disable other modules during editing
		const modulesBeingEdited = filter( isEditing, ( module ) => module );
		const editActive = 0 < modulesBeingEdited.length;

		const dependentModules = map( this.getDependentModules(), 'name' ).join( ', ' );

		// Set button text based on state.
		let buttonText = __( 'Close', 'google-site-kit' );
		if ( hasSettings && setupComplete ) {
			if ( isSavingModule ) {
				buttonText = __( 'Saving...', 'google-site-kit' );
			} else {
				buttonText = __( 'Confirm Changes', 'google-site-kit' );
			}
		}

		return (
			<Fragment>
				{ active ? (
					<div
						className={ classnames(
							'googlesitekit-settings-module',
							'googlesitekit-settings-module--active',
							`googlesitekit-settings-module--${ slug }`,
							{ 'googlesitekit-settings-module--error': error && editActive && isEditing[ moduleKey ] }
						) }
						key={ moduleKey }
					>
						{ editActive && ! isEditing[ moduleKey ] && <SettingsOverlay compress={ ! isOpen } /> }
						<button
							className={ classnames(
								'googlesitekit-settings-module__header',
								{ 'googlesitekit-settings-module__header--open': isOpen }
							) }
							id={ `googlesitekit-settings-module__header--${ slug }` }
							type="button"
							role="tab"
							aria-selected={ !! isOpen }
							aria-expanded={ !! isOpen }
							aria-controls={ `googlesitekit-settings-module__content--${ slug }` }
							onClick={ handleAccordion.bind( null, slug ) }
						>
							{ error && editActive && isEditing[ moduleKey ] &&
								<div className="googlesitekit-settings-module__error">
									<div className="mdc-layout-grid">
										<div className="mdc-layout-grid__inner">
											<div className="
												mdc-layout-grid__cell
												mdc-layout-grid__cell--span-12
											">
												{ __( 'Error:', 'google-site-kit' ) } { error.errorMsg }
											</div>
										</div>
									</div>
								</div>
							}
							<div className="mdc-layout-grid">
								<div className="mdc-layout-grid__inner">
									<div className="
										mdc-layout-grid__cell
										mdc-layout-grid__cell--span-6-desktop
										mdc-layout-grid__cell--span-4-tablet
										mdc-layout-grid__cell--span-4-phone
									">
										<h3 className="
											googlesitekit-heading-4
											googlesitekit-settings-module__title
										">
											{ moduleIcon( slug, false, '24', '26', 'googlesitekit-settings-module__title-icon' ) }
											{ name }
										</h3>
									</div>
									<div className="
										mdc-layout-grid__cell
										mdc-layout-grid__cell--span-6-desktop
										mdc-layout-grid__cell--span-4-tablet
										mdc-layout-grid__cell--span-4-phone
										mdc-layout-grid__cell--align-middle
										mdc-layout-grid__cell--align-right-tablet
									">
										<p className="googlesitekit-settings-module__status">
											{
												isConnected
													/* translators: %s: module name */
													? sprintf( __( '%s is connected', 'google-site-kit' ), name )
													/* translators: %s: module name */
													: sprintf( __( '%s is not connected', 'google-site-kit' ), name )
											}
											<span className={ classnames(
												'googlesitekit-settings-module__status-icon',
												connectedClassName
											) }>
												<span className="screen-reader-text">
													{ isConnected
														? __( 'Connected', 'google-site-kit' )
														: __( 'Not Connected', 'google-site-kit' )
													}
												</span>
											</span>
										</p>
									</div>
								</div>
							</div>
						</button>
						<div
							className={ classnames(
								'googlesitekit-settings-module__content',
								{ 'googlesitekit-settings-module__content--open': isOpen }
							) }
							id={ `googlesitekit-settings-module__content--${ slug }` }
							role="tabpanel"
							aria-hidden={ ! isOpen }
							aria-labelledby={ `googlesitekit-settings-module__header--${ slug }` }
						>
							<div className="mdc-layout-grid">
								<div className="mdc-layout-grid__inner">
									{ setupComplete &&
									<Fragment>
										<div className="
													mdc-layout-grid__cell
													mdc-layout-grid__cell--span-12
												">
											<FilteredModuleSettingsDetails module={ moduleKey } isEditing={ isEditing[ moduleKey ] } isOpen={ isOpen } />
										</div>
									</Fragment>
									}
									{
										hasSettings && ! setupComplete &&
											<ModuleSetupIncomplete
												screenID={ screenID }
												slug={ slug }
											/>
									}
								</div>
							</div>
							<footer className="googlesitekit-settings-module__footer">
								<div className="mdc-layout-grid">
									<div className="mdc-layout-grid__inner">
										<div className="
											mdc-layout-grid__cell
											mdc-layout-grid__cell--span-6-desktop
											mdc-layout-grid__cell--span-8-tablet
											mdc-layout-grid__cell--span-4-phone
										">
											{ isEditing[ moduleKey ] || isSavingModule ? (
												<Fragment>
													<Button
														onClick={ () => handleEdit( moduleKey, hasSettings && setupComplete ? 'confirm' : 'cancel' ) }
														disabled={ isSavingModule }
														id={ hasSettings && setupComplete ? `confirm-changes-${ slug }` : `close-${ slug }` }
													>
														{ buttonText }
													</Button>
													<Spinner isSaving={ isSavingModule } />
													{ hasSettings &&
													<Link
														className="googlesitekit-settings-module__footer-cancel"
														onClick={ () => handleEdit( moduleKey, 'cancel' ) }
														inherit
													>
														{ __( 'Cancel', 'google-site-kit' ) }
													</Link>
													}
												</Fragment>
											) : ( ( hasSettings || ! autoActivate ) &&
											<Link
												className="googlesitekit-settings-module__edit-button"
												onClick={ () => {
													handleEdit( moduleKey, 'edit' );
												} }
												inherit
											>
												{ __( 'Edit', 'google-site-kit' ) }
												<SvgIcon
													className="googlesitekit-settings-module__edit-button-icon"
													id="pencil"
													width="10"
													height="10"
												/>
											</Link>
											) }
										</div>
										<div className="
											mdc-layout-grid__cell
											mdc-layout-grid__cell--span-6-desktop
											mdc-layout-grid__cell--span-8-tablet
											mdc-layout-grid__cell--span-4-phone
											mdc-layout-grid__cell--align-middle
											mdc-layout-grid__cell--align-right-desktop
										">
											{ isEditing[ moduleKey ] && ! autoActivate && (
												<Link
													className="googlesitekit-settings-module__remove-button"
													onClick={ this.handleDialog }
													inherit
													danger
												>
													{
														/* translators: %s: module name */
														sprintf( __( 'Disconnect %s from Site Kit', 'google-site-kit' ), name )
													}
													<SvgIcon
														className="googlesitekit-settings-module__remove-button-icon"
														id="trash"
														width="13"
														height="13"
													/>
												</Link>
											) }
											{ ! isEditing[ moduleKey ] && (
												<Link
													href={ homepage }
													className="googlesitekit-settings-module__cta-button"
													inherit
													external
												>
													{
														/* translators: %s: module name */
														sprintf( __( 'See full details in %s', 'google-site-kit' ), name )
													}
												</Link>
											) }
										</div>
									</div>
								</div>
							</footer>
						</div>
						<Dialog
							dialogActive={ dialogActive }
							handleDialog={ this.handleDialog }
							/* translators: %s: module name */
							title={ sprintf( __( 'Disconnect %s from Site Kit?', 'google-site-kit' ), name ) }
							subtitle={ subtitle }
							onKeyPress={ this.handleCloseModal }
							provides={ provides }
							handleConfirm={ this.handleConfirmRemoveModule }
							dependentModules={ dependentModules
								? sprintf(
									/* translators: %s: module name */
									__( 'these active modules depend on %s and will also be disconnected: ', 'google-site-kit' ),
									name
								) + dependentModules : false
							}
						/>
					</div>
				) : (
					<Fragment>
						<SetupModule
							key={ `${ slug }-module` }
							slug={ slug }
							name={ name }
							description={ description }
							active={ active }
							showLink
						/>
					</Fragment>
				)
				}
			</Fragment>
		);
	}
}

SettingsModule.propTypes = {
	name: PropTypes.string,
	slug: PropTypes.string,
	homepage: PropTypes.string,
	isEditing: PropTypes.object,
	handleEdit: PropTypes.func,
	handleDialog: PropTypes.func,
	autoActivate: PropTypes.bool,
	hasSettings: PropTypes.bool,
	required: PropTypes.array,
	active: PropTypes.bool,
};

SettingsModule.defaultProps = {
	name: '',
	slug: '',
	homepage: '',
	isEditing: {},
	handleEdit: null,
	handleDialog: null,
	active: false,
};

export default SettingsModule;
