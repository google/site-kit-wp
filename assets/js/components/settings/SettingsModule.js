/**
 * SettingsModule component.
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
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { compose } from '@wordpress/compose';
import { applyFilters } from '@wordpress/hooks';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import PencilIcon from '../../../svg/pencil.svg';
import TrashIcon from '../../../svg/trash.svg';
import {
	activateOrDeactivateModule,
	getReAuthURL,
	showErrorNotification,
	clearWebStorage,
} from '../../util';
import { refreshAuthentication } from '../../util/refresh-authentication';
import Link from '../Link';
import Button from '../Button';
import data, { TYPE_MODULES } from '../data';
import SettingsOverlay from './SettingsOverlay';
import Spinner from '../Spinner';
import GenericError from '../legacy-notifications/generic-error';
import SetupModule from './SetupModule';
import Dialog from '../Dialog';
import ModuleIcon from '../ModuleIcon';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import SettingsRenderer from './SettingsRenderer';
import VisuallyHidden from '../VisuallyHidden';
import { Grid, Row, Cell } from '../../material-components/layout';
import { isPermissionScopeError } from '../../util/errors';
const { withSelect, withDispatch } = Data;

/**
 * A single module. Keeps track of its own active state and settings.
 */
class SettingsModule extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			active: props.module.active,
			dialogActive: false,
			status: 'initial', // 'initial' | 'saving' | 'error'
		};

		this.deactivate = this.deactivate.bind( this );
		this.activateOrDeactivate = this.activateOrDeactivate.bind( this );
		this.handleDialog = this.handleDialog.bind( this );
		this.handleCloseModal = this.handleCloseModal.bind( this );
		this.saveSettings = this.saveSettings.bind( this );
		this.handleConfirmEditModule = this.handleConfirmEditModule.bind( this );
		this.handleSaveError = this.handleSaveError.bind( this );
		this.handleSaveSuccess = this.handleSaveSuccess.bind( this );
		this.navigate = this.navigate.bind( this );
	}

	componentDidMount() {
		global.addEventListener( 'keyup', this.handleCloseModal, false );
	}

	componentWillUnmount() {
		global.removeEventListener( 'keyup', this.handleCloseModal );
	}

	componentDidUpdate( prevProps ) {
		const { slug } = this.props.module;
		const { moduleSlug: previousSlug } = prevProps.match.params;
		const { moduleSlug: currentSlug } = this.props.match.params;
		const changingModule = ( previousSlug === slug ) || ( currentSlug === slug );
		const openModuleChanged = currentSlug !== previousSlug;

		// Reset `SettingsModule` state when open module slug changes
		if ( changingModule && openModuleChanged ) {
			this.setState( { status: 'initial' } );
		}
	}

	async activateOrDeactivate() {
		try {
			const { active } = this.state;
			const newActiveState = ! active;

			await activateOrDeactivateModule(
				data,
				this.props.module.slug,
				newActiveState
			);

			await refreshAuthentication();

			if ( false === newActiveState ) {
				data.invalidateCacheGroup( TYPE_MODULES, this.props.module.slug );
			}

			this.setState( { active: newActiveState } );

			global.location = getReAuthURL( this.props.module.slug, false );
		} catch ( err ) {
			showErrorNotification( GenericError, {
				id: 'activate-module-error',
				title: __( 'Internal Server Error', 'google-site-kit' ),
				description: err.message,
				format: 'small',
				type: 'win-error',
			} );
		}
	}

	navigate( path ) {
		this.props.history.push( path );
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

	handleCloseModal( e ) {
		if ( ESCAPE === e.keyCode ) {
			this.setState( {
				dialogActive: false,
			} );
		}
	}

	handleSaveError( error ) {
		return isPermissionScopeError( error )
			? this.setState( { status: 'initial' } )
			: this.setState( { status: 'error' } );
	}

	handleSaveSuccess() {
		this.setState( { status: 'initial' }, () => {
			clearWebStorage();
			this.navigate( `/connected-services/${ this.props.module.slug }` );
		} );
	}

	async saveSettings() {
		return await new Promise( ( resolve, reject ) => {
			this.props.submitChanges( this.props.module.slug )
				.then( ( { error } ) => error ? reject( error ) : resolve() );
		} );
	}

	async handleConfirmEditModule() {
		return await this.saveSettings()
			.then( this.handleSaveSuccess )
			.catch( this.handleSaveError );
	}

	render() {
		const {
			active,
			dialogActive,
			status,
		} = this.state;

		const {
			canSubmitChanges,
			hasSettings,
			match,
			module: {
				autoActivate,
				dependantModulesText,
				description,
				homepage,
				name,
				provides,
				setupComplete,
				slug,
			},
		} = this.props;

		const { moduleSlug, action } = match.params;
		const isOpen = slug === moduleSlug;
		const isEditing = isOpen && action === 'edit';
		const isEditingOtherModule = ! isOpen && action === 'edit';
		const isSaving = status === 'saving';
		const isConnected = applyFilters( `googlesitekit.Connected-${ slug }`, setupComplete );
		const connectedClassName = isConnected
			? 'googlesitekit-settings-module__status-icon--connected'
			: 'googlesitekit-settings-module__status-icon--not-connected';

		/* translators: %s: module name */
		const subtitle = sprintf( __( 'By disconnecting the %s module from Site Kit, you will no longer have access to:', 'google-site-kit' ), name );

		return (
			<Fragment>
				{ active ? (
					<div
						className={ classnames(
							'googlesitekit-settings-module',
							'googlesitekit-settings-module--active',
							`googlesitekit-settings-module--${ slug }`,
							{ 'googlesitekit-settings-module--error': status === 'error' && isEditing }
						) }
					>
						{ isEditingOtherModule && <SettingsOverlay compress={ ! isOpen } /> }
						<Link
							className={ classnames(
								'googlesitekit-settings-module__header',
								{ 'googlesitekit-settings-module__header--open': isOpen }
							) }
							id={ `googlesitekit-settings-module__header--${ slug }` }
							type="button"
							role="tab"
							aria-selected={ isOpen }
							aria-expanded={ isOpen }
							aria-controls={ `googlesitekit-settings-module__content--${ slug }` }
							to={ `/connected-services${ isOpen ? '' : `/${ slug }` }` }
						>
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
											<ModuleIcon slug={ slug } size={ 24 } className="googlesitekit-settings-module__title-icon" />
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
													? sprintf(
														/* translators: %s: module name. */
														__( '%s is connected', 'google-site-kit' ),
														name
													)
													: sprintf(
														/* translators: %s: module name. */
														__( '%s is not connected', 'google-site-kit' ),
														name
													)
											}
											<span className={ classnames(
												'googlesitekit-settings-module__status-icon',
												connectedClassName
											) }>
												<VisuallyHidden>
													{ isConnected
														? __( 'Connected', 'google-site-kit' )
														: __( 'Not Connected', 'google-site-kit' )
													}
												</VisuallyHidden>
											</span>
										</p>
									</div>
								</div>
							</div>
						</Link>
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
							<Grid>
								<Row>
									<Cell size={ 12 }>
										<SettingsRenderer
											slug={ slug }
											isEditing={ isEditing }
											isOpen={ isOpen }
										/>
									</Cell>
								</Row>
							</Grid>
							<footer className="googlesitekit-settings-module__footer">
								<div className="mdc-layout-grid">
									<div className="mdc-layout-grid__inner">
										<div className="
											mdc-layout-grid__cell
											mdc-layout-grid__cell--span-6-desktop
											mdc-layout-grid__cell--span-8-tablet
											mdc-layout-grid__cell--span-4-phone
										">
											{ isEditing ? (
												<Fragment>
													{ /* Confirm Changes button */ }
													{ hasSettings && setupComplete && (
														<Button
															onClick={ this.handleConfirmEditModule }
															disabled={ isSaving || ! canSubmitChanges }
															id={ `confirm-changes-${ slug }` }
														>
															{ isSaving
																? __( 'Saving…', 'google-site-kit' )
																: __( 'Confirm Changes', 'google-site-kit' )
															}
														</Button>
													) }
													{ /* Close button */ }
													{ ! ( hasSettings && setupComplete ) && (
														<Button
															id={ `close-${ slug }` }
															disabled={ isSaving || ! canSubmitChanges }
															onClick={ () => this.navigate( `/connected-services/${ slug }` ) }
														>
															{ __( 'Close', 'google-site-kit' ) }
														</Button>
													) }

													<Spinner isSaving={ isSaving } />

													{ /* Edit `Cancel` link */ }
													{ hasSettings &&
														<Link
															to={ `/connected-services/${ slug }` }
															className="googlesitekit-settings-module__footer-cancel"
															inherit
														>
															{ __( 'Cancel', 'google-site-kit' ) }
														</Link>
													}
												</Fragment>
											) : ( ( hasSettings || ! autoActivate ) &&
											<Link
												to={ `/connected-services/${ slug }/edit` }
												className="googlesitekit-settings-module__edit-button"
												inherit
											>
												{ __( 'Edit', 'google-site-kit' ) }
												<PencilIcon
													className="googlesitekit-settings-module__edit-button-icon"
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
											{ isEditing && ! autoActivate && (
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
													<TrashIcon
														className="googlesitekit-settings-module__remove-button-icon"
														width="13"
														height="13"
													/>
												</Link>
											) }
											{ ! isEditing && (
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
							handleConfirm={ this.deactivate }
							dependentModules={ dependantModulesText
								? sprintf(
									/* translators: %1$s: module name, %2$s: list of dependent modules */
									__( 'these active modules depend on %1$s and will also be disconnected: %2$s', 'google-site-kit' ),
									name,
									dependantModulesText
								) : false
							}
							danger
						/>
					</div>
				) : (
					<Fragment>
						<SetupModule
							key={ `${ slug }-module` }
							slug={ slug }
							name={ name }
							description={ description }
						/>
					</Fragment>
				)
				}
			</Fragment>
		);
	}
}

SettingsModule.propTypes = {
	canSubmitChanges: PropTypes.bool.isRequired,
	hasSettings: PropTypes.bool,
	history: PropTypes.shape( {
		push: PropTypes.func.isRequired,
	} ).isRequired,
	match: PropTypes.shape( {
		params: PropTypes.shape( {
			moduleSlug: PropTypes.string,
		} ),
	} ).isRequired,
	module: PropTypes.shape( {
		active: PropTypes.bool,
		autoActivate: PropTypes.bool,
		dependantModulesText: PropTypes.string.isRequired,
		description: PropTypes.string,
		homepage: PropTypes.string,
		name: PropTypes.string,
		provides: PropTypes.arrayOf( PropTypes.string ),
		setupComplete: PropTypes.bool,
		slug: PropTypes.string,
	} ).isRequired,
	submitChanges: PropTypes.func.isRequired,
};

export default compose( [
	withSelect( ( select, { module: { slug } } ) => {
		const module = select( CORE_MODULES ).getModule( slug );
		const canSubmitChanges = select( CORE_MODULES ).canSubmitChanges( slug );

		return {
			hasSettings: !! module?.SettingsEditComponent,
			canSubmitChanges,
		};
	} ),
	withDispatch( ( dispatch, { module: { slug } } ) => {
		const submitChanges = () => dispatch( CORE_MODULES ).submitChanges( slug );

		return {
			submitChanges,
		};
	} ),
	withRouter,
] )( SettingsModule );
