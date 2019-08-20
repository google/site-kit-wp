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
import Link from 'GoogleComponents/link';
import Button from 'GoogleComponents/button';
import data from 'GoogleComponents/data';
import SvgIcon from 'GoogleUtil/svg-icon';
import SetupModule from 'GoogleComponents/setup-module';
import Dialog from 'GoogleComponents/dialog';
import ModuleSettingsDetails from 'GoogleComponents/settings/module-settings-details';
import ModuleSetupIncomplete from 'GoogleComponents/settings/module-setup-incomplete';
import {
	activateOrDeactivateModule,
	refreshAuthentication,
	getReAuthUrl,
	moduleIcon,
	showErrorNotification,
} from 'GoogleUtil';
import Spinner from 'GoogleComponents/spinner';
import SettingsOverlay from 'GoogleComponents/settings/settings-overlay';
import GenericError from 'GoogleComponents/notifications/generic-error';

const { Component, Fragment } = wp.element;
const { __, sprintf } = wp.i18n;
const { filter, map } = lodash;
const { applyFilters } = wp.hooks;
const { withFilters } = wp.components;

/**
 * A single module. Keeps track of its own active state and settings.
 */
class SettingsModule extends Component {
	constructor( props ) {
		super( props );
		const { slug } = props;
		const { setupComplete } = googlesitekit.modules[ slug ];
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
		window.addEventListener( 'keyup', this.handleCloseModal, false );
	}

	componentWillUnmount() {
		window.removeEventListener( 'keyup', this.handleCloseModal );
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
				Object.keys( window.sessionStorage ).map( ( key ) => {
					if ( -1 < key.indexOf( `${ this.props.slug }::` ) ) {
						sessionStorage.removeItem( key );
					}
				} );
			}

			this.setState( {
				isSaving: false,
				active: newActiveState,
			} );

			window.location = getReAuthUrl( this.props.slug, false );
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
		const { modules } = googlesitekit;
		const dependants = {};

		modules[ slug ].dependants && modules[ slug ].dependants.forEach( ( dependantSlug ) => {
			if ( ! modules[ dependantSlug ] ) {
				return;
			}
			dependants[ dependantSlug ] = modules[ dependantSlug ];
		} );

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
			screenId,
			error,
		} = this.props;

		const moduleKey = `${ slug }-module`;
		const isConnected = applyFilters( `googlesitekit.Connected-${ slug }`, setupComplete );
		const connectedClassName = isConnected ?
			'googlesitekit-settings-module__status-icon--connected' :
			'googlesitekit-settings-module__status-icon--not-connected';

		const subtitle = sprintf( __( 'By disconnecting the %s module from Site Kit, you will no longer have access to:', 'google-site-kit' ), name );

		const isSavingModule = isSaving === `${ slug }-module`;
		const FilteredModuleSettingsDetails = withFilters( `googlesitekit.ModuleSettingsDetails-${ slug }` )( ModuleSettingsDetails );

		// Disable other modules during editing
		const modulesBeingEdited = filter( isEditing, ( module ) => module );
		const editActive = 0 < modulesBeingEdited.length;

		const dependentModules = map( this.getDependentModules(), 'name' ).join( ', ' );

		const nothingToSave = 'pagespeed-insights' === slug;

		return (
			<Fragment>
				{ active ? (
					<div
						className={ `
							googlesitekit-settings-module
							googlesitekit-settings-module--${ slug }
							googlesitekit-settings-module--active
							${ error && editActive && isEditing[ moduleKey ] ? 'googlesitekit-settings-module--error' : '' }
						` }
						key={ moduleKey }
					>
						{ editActive && ! isEditing[ moduleKey ] && <SettingsOverlay compress={ ! isOpen } /> }
						<button
							className={ `
								googlesitekit-settings-module__header
								${ isOpen ? 'googlesitekit-settings-module__header--open' : '' }
							`	}
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
												isConnected ?
													sprintf( __( '%s is connected', 'google-site-kit' ), name ) :
													sprintf( __( '%s is not connected', 'google-site-kit' ), name )
											}
											<span className={ `googlesitekit-settings-module__status-icon ${ connectedClassName } ` }>
												<span className="screen-reader-text">
													{ isConnected ?
														__( 'Connected', 'google-site-kit' ) :
														__( 'Not Connected', 'google-site-kit' )
													}
												</span>
											</span>
										</p>
									</div>
								</div>
							</div>
						</button>
						<div
							className={ `
								googlesitekit-settings-module__content
								${ isOpen ? 'googlesitekit-settings-module__content--open' : '' }
							`	}
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
											<FilteredModuleSettingsDetails module={ moduleKey } isEditing={ isEditing[ moduleKey ] } />
										</div>
									</Fragment>
									}
									{
										hasSettings && ! setupComplete &&
											<ModuleSetupIncomplete
												screenId={ screenId }
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
														onClick={ () => handleEdit( moduleKey, setupComplete ? 'confirm' : 'cancel', nothingToSave ) }
														disabled={ isSavingModule }
														id={ hasSettings && setupComplete ? `confirm-changes-${ slug }` : `close-${ slug }` }
													>
														{
															hasSettings && setupComplete ?
																( isSavingModule ?
																	__( 'Saving...', 'google-site-kit' ) :
																	nothingToSave ?
																		__( 'Close', 'google-site-kit' ) :
																		__( 'Confirm Changes', 'google-site-kit' )
																) :
																__( 'Close', 'google-site-kit' ) }
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
											) : ( hasSettings &&
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
											{ isEditing[ moduleKey ] ? (
												! autoActivate ?
													<Link
														className="googlesitekit-settings-module__remove-button"
														onClick={ this.handleDialog }
														inherit
														danger
													>
														{ sprintf( __( 'Disconnect %s from Site Kit', 'google-site-kit' ), name ) }
														<SvgIcon
															className="googlesitekit-settings-module__remove-button-icon"
															id="trash"
															width="13"
															height="13"
														/>
													</Link> :
													null
											) : (
												<Link
													href={ homepage }
													className="googlesitekit-settings-module__cta-button"
													inherit
													external
												>
													{ sprintf( __( 'See full details in %s', 'google-site-kit' ), name ) }
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
							title={ sprintf( __( 'Disconnect %s from Site Kit?', 'google-site-kit' ), name ) }
							subtitle={ subtitle }
							onKeyPress={ this.handleCloseModal }
							provides={ provides }
							handleConfirm={ this.handleConfirmRemoveModule }
							dependentModules={ dependentModules ?
								sprintf(
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
