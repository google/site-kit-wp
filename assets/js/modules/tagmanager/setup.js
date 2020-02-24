/**
 * TagmanagerSetup component.
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
import Button from 'GoogleComponents/button';
import Link from 'GoogleComponents/link';
import Switch from 'GoogleComponents/switch';
import data, { TYPE_MODULES } from 'GoogleComponents/data';
import ProgressBar from 'GoogleComponents/progress-bar';
import { Select, Option } from 'SiteKitCore/material-components';
import SvgIcon from 'GoogleUtil/svg-icon';
import PropTypes from 'prop-types';
import { getExistingTag, toggleConfirmModuleSettings } from 'GoogleUtil';
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';
import { addFilter, removeFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import {
	getContainers,
	isValidAccountID,
	isValidContainerID,
} from './util';

const ACCOUNT_CREATE = 'account_create';
const CONTAINER_CREATE = 'container_create';
const USAGE_CONTEXT_WEB = 'web';
const USAGE_CONTEXT_AMP = 'amp';

class TagmanagerSetup extends Component {
	constructor( props ) {
		super( props );

		const { ampEnabled, ampMode } = global.googlesitekit.admin;
		const { settings } = global.googlesitekit.modules.tagmanager;
		const ampUsageContext = ampMode === 'primary' ? USAGE_CONTEXT_AMP : [ USAGE_CONTEXT_WEB, USAGE_CONTEXT_AMP ];

		this.state = {
			ampEnabled,
			isLoading: true,
			isSecondaryAMP: 'secondary' === ampMode,
			accounts: [],
			containers: [],
			containersAMP: [],
			errorCode: false,
			errorMsg: '',
			existingContainer: '',
			selectedAccount: settings.accountID,
			selectedContainer: settings.containerID,
			selectedContainerAMP: settings.ampContainerID,
			containersLoading: false,
			usageContext: ampEnabled ? ampUsageContext : USAGE_CONTEXT_WEB,
			hasExistingTag: false,
			useSnippet: settings.useSnippet,
		};

		this.handleSubmit = this.handleSubmit.bind( this );
		this.renderAccountDropdownForm = this.renderAccountDropdownForm.bind( this );
		this.handleAccountChange = this.handleAccountChange.bind( this );
		this.refetchAccount = this.refetchAccount.bind( this );
	}

	setState() {
		if ( this._isMounted ) {
			Component.prototype.setState.apply( this, arguments );
		}
	}

	async componentDidMount() {
		const {
			isOpen,
			onSettingsPage,
		} = this.props;
		this._isMounted = true;

		// If on settings page, only run the rest if the module is "open".
		if ( onSettingsPage && ! isOpen ) {
			return;
		}

		await this.loadAccountsContainers();

		// Handle save hook from the settings page.
		addFilter( 'googlekit.SettingsConfirmed',
			'googlekit.TagmanagerSettingsConfirmed',
			( chain, module ) => {
				if ( 'tagmanager' !== module.replace( '-module', '' ) ) {
					return chain;
				}
				const { isEditing } = this.props;
				if ( isEditing ) {
					return this.handleSubmit();
				}
			} );

		this.toggleConfirmChangesButton();
	}

	componentDidUpdate() {
		this.toggleConfirmChangesButton();
	}

	componentWillUnmount() {
		this._isMounted = false;

		removeFilter( 'googlekit.SettingsConfirmed', 'googlekit.TagmanagerSettingsConfirmed' );
	}

	/**
	 * Toggle confirm changes button disable/enable depending on the changed settings.
	 */
	toggleConfirmChangesButton() {
		if ( ! this.props.isEditing ) {
			return;
		}

		let settingsMapping = {
			selectedContainer: 'containerID',
			selectedContainerAMP: 'ampContainerID',
			selectedAccount: 'accountID',
			useSnippet: 'useSnippet',
		};

		// Disable the confirmation button if necessary conditions are not met.
		if ( ! this.canSaveSettings() ) {
			settingsMapping = {};
		}

		toggleConfirmModuleSettings( 'tagmanager', settingsMapping, this.state );
	}

	async loadAccountsContainers() {
		const existingContainerID = await getExistingTag( 'tagmanager' );

		if ( existingContainerID ) {
			// Verify the user has access to existing tag if found.
			try {
				const { account, container } = await data.get( TYPE_MODULES, 'tagmanager', 'tag-permission', { tag: existingContainerID } );
				const containers = getContainers( [ container ] ).byContext( USAGE_CONTEXT_WEB );
				const containersAMP = getContainers( [ container ] ).byContext( USAGE_CONTEXT_AMP );

				// If the user has access, they may continue but must use the found account+container.
				this.setState(
					{
						isLoading: false,
						existingContainer: existingContainerID,
						selectedAccount: account.accountId, // Capitalization rule exception: `accountId` is a property of an API returned value.
						selectedContainer: get( containers, [ 0, 'publicId' ] ), // Capitalization rule exception: `publicId` is a property of an API returned value.
						selectedContainerAMP: get( containersAMP, [ 0, 'publicId' ] ), // Capitalization rule exception: `publicId` is a property of an API returned value.
						accounts: [ account ],
						hasExistingTag: true,
					}
				);
			} catch ( err ) {
				this.setState(
					{
						isLoading: false,
						errorCode: err.code,
						errorMsg: err.message,
						errorReason: err.data && err.data.reason ? err.data.reason : false,
						existingContainer: existingContainerID,
						hasExistingTag: !! existingContainerID,
					}
				);
			}
		} else {
			// Only load accounts if there is no existing tag.
			await this.requestTagManagerAccountsContainers();
		}
	}

	/**
	 * Request Tag Manager accounts.
	 */
	async requestTagManagerAccounts() {
		try {
			const {
				selectedAccount,
			} = this.state;

			const accounts = await data.get( TYPE_MODULES, 'tagmanager', 'accounts' );

			this.validateAccounts( accounts, selectedAccount );

			this.setState( {
				isLoading: false,
				accounts,
			} );
		} catch ( err ) {
			this.setState( {
				isLoading: false,
				errorCode: err.code,
				errorMsg: err.message,
			} );
		}
	}

	/**
	 * Request Tag Manager accounts and containers.
	 */
	async requestTagManagerAccountsContainers() {
		try {
			const {
				selectedAccount,
				usageContext,
			} = this.state;
			let {
				selectedContainer,
				selectedContainerAMP,
			} = this.state;

			const queryArgs = {
				accountID: selectedAccount,
				usageContext,
			};

			const { accounts, containers } = await data.get( TYPE_MODULES, 'tagmanager', 'accounts-containers', queryArgs );

			this.validateAccounts( accounts, selectedAccount );

			// If the selected container is not in the list of containers, clear it.
			const containerIDs = containers.map( ( { publicId } ) => publicId ); /* Capitalization rule exception: `publicId` is a property of an API returned value. */
			if ( isValidContainerID( selectedContainer ) && ! containerIDs.includes( selectedContainer ) ) {
				selectedContainer = '';
			}
			if ( isValidContainerID( selectedContainerAMP ) && ! containerIDs.includes( selectedContainerAMP ) ) {
				selectedContainerAMP = '';
			}

			const containersWeb = getContainers( containers ).byContext( USAGE_CONTEXT_WEB );
			const containersAMP = getContainers( containers ).byContext( USAGE_CONTEXT_AMP );

			this.setState( {
				isLoading: false,
				accounts,
				containers: containersWeb,
				containersAMP,
				selectedAccount: selectedAccount || get( containers, [ 0, 'accountId' ] ), // Capitalization rule exception: `accountId` is a property of an API returned value.
				selectedContainer: selectedContainer || get( containersWeb, [ 0, 'publicId' ] ), // Capitalization rule exception: `publicId` is a property of an API returned value.
				selectedContainerAMP: selectedContainerAMP || get( containersAMP, [ 0, 'publicId' ] ), // Capitalization rule exception: `accountId` is a property of an API returned value.
				errorCode: false,
				errorMsg: '',
			} );
		} catch ( err ) {
			this.setState( {
				isLoading: false,
				errorCode: err.code,
				errorMsg: err.message,
			} );
		}
	}

	/**
	 * Validates the given accounts with the given selected account.
	 *
	 * @param {Array} accounts List of account objects to validate.
	 * @param {string} selectedAccount Currently chosen account.
	 * @throws {Object} If there is no selected account and user has no accounts.
	 * @throws {Object} If the user does not have access to the selected account.
	 */
	validateAccounts( accounts, selectedAccount ) {
		if ( ! selectedAccount && 0 === accounts.length ) {
			throw {
				code: 'accountEmpty',
				message: __(
					'We didn’t find an associated Google Tag Manager account, would you like to set it up now? If you’ve just set up an account please re-fetch your account to sync it with Site Kit.',
					'google-site-kit'
				),
			};
		}

		// Verify if user has access to the selected account.
		if ( isValidAccountID( selectedAccount ) && ! accounts.find( ( account ) => account.accountId === selectedAccount ) ) { // Capitalization rule exception: `accountId` is a property of an API returned value.
			throw {
				code: 'insufficientPermissions',
				message: __(
					'You currently don’t have access to this Google Tag Manager account. You can either request access from your team, or remove this Google Tag Manager snippet and connect to a different account.',
					'google-site-kit'
				),
			};
		}
	}

	/**
	 * Request Tag Manager accounts.
	 *
	 * @param {string} selectedAccount The account ID to get containers from.
	 */
	async requestTagManagerContainers( selectedAccount ) {
		this.setState( { containersLoading: true } );

		try {
			const queryArgs = {
				accountID: selectedAccount,
				usageContext: this.state.usageContext,
			};

			const containers = await data.get( TYPE_MODULES, 'tagmanager', 'containers', queryArgs );

			this.setState( {
				containersLoading: false,
				containers: getContainers( containers ).byContext( USAGE_CONTEXT_WEB ),
				containersAMP: getContainers( containers ).byContext( USAGE_CONTEXT_AMP ),
				errorCode: false,
			} );
		} catch ( err ) {
			this.setState( {
				containersLoading: false,
				errorCode: err.code,
				errorMsg: err.message,
			} );
		}
	}

	async handleSubmit() {
		const {
			hasExistingTag,
			selectedAccount,
			selectedContainer,
			selectedContainerAMP,
			usageContext,
			useSnippet,
		} = this.state;

		const { finishSetup } = this.props;

		try {
			const dataParams = {
				accountID: selectedAccount,
				containerID: selectedContainer,
				ampContainerID: selectedContainerAMP,
				usageContext,
				useSnippet: hasExistingTag ? false : useSnippet,
			};

			const savedSettings = await data.set( TYPE_MODULES, 'tagmanager', 'settings', dataParams );

			if ( finishSetup ) {
				finishSetup();
			}

			global.googlesitekit.modules.tagmanager.settings = savedSettings;

			this.setState( {
				isSaving: false,
			} );
		} catch ( err ) {
			this.setState( {
				isLoading: false,
				isSaving: false,
				errorCode: err.code,
				errorMsg: err.message,
			} );

			// Re-throw the error to return a rejected promise.
			throw err;
		}
	}

	static createNewAccount( e ) {
		e.preventDefault();
		global.open( 'https://tagmanager.google.com/#/admin/accounts/create', '_blank' );
	}

	handleAccountChange( index, item ) {
		const { selectedAccount } = this.state;
		const selectValue = item.dataset.value;

		if ( selectValue === selectedAccount ) {
			return;
		}

		this.setState( {
			selectedAccount: selectValue,
			selectedContainer: '',
			selectedContainerAMP: '',
		} );

		if ( ! isValidAccountID( selectValue ) ) {
			return;
		}

		this.requestTagManagerContainers( selectValue );
	}

	refetchAccount( e ) {
		e.preventDefault();

		this.setState(
			{
				isLoading: true,
				errorCode: false,
				errorMsg: '',
				selectedAccount: '',
				selectedContainer: '',
				selectedContainerAMP: '',
			},
			this.requestTagManagerAccounts
		);
	}

	renderSettingsInfo() {
		const { settings } = global.googlesitekit.modules.tagmanager;
		const {
			ampEnabled,
			isSecondaryAMP,
			hasExistingTag,
			isLoading,
		} = this.state;
		const {
			accountID,
			useSnippet,
		} = settings;

		if ( isLoading ) {
			return <ProgressBar />;
		}

		return (
			<Fragment>
				<div className="googlesitekit-settings-module__meta-items">
					<div className="googlesitekit-settings-module__meta-item">
						<p className="googlesitekit-settings-module__meta-item-type">
							{ __( 'Account', 'google-site-kit' ) }
						</p>
						<h5 className="googlesitekit-settings-module__meta-item-data">
							{ accountID || false }
						</h5>
					</div>

					{ ( ! ampEnabled || isSecondaryAMP ) && (
						<div className="googlesitekit-settings-module__meta-item">
							<p className="googlesitekit-settings-module__meta-item-type">
								{ isSecondaryAMP && __( 'Web Container ID', 'google-site-kit' ) }
								{ ! ampEnabled && __( 'Container ID', 'google-site-kit' ) }
							</p>
							<h5 className="googlesitekit-settings-module__meta-item-data">
								{ settings.containerID || false }
							</h5>
						</div>
					) }

					{ ampEnabled && (
						<div className="googlesitekit-settings-module__meta-item">
							<p className="googlesitekit-settings-module__meta-item-type">
								{ isSecondaryAMP && __( 'AMP Container ID', 'google-site-kit' ) }
								{ ! isSecondaryAMP && __( 'Container ID', 'google-site-kit' ) }
							</p>
							<h5 className="googlesitekit-settings-module__meta-item-data">
								{ settings.ampContainerID || false }
							</h5>
						</div>
					) }
				</div>
				<div className="googlesitekit-settings-module__meta-items">
					<div className="googlesitekit-settings-module__meta-item">
						<p className="googlesitekit-settings-module__meta-item-type">
							{ __( 'Tag Manager Code Snippet', 'google-site-kit' ) }
						</p>
						<h5 className="googlesitekit-settings-module__meta-item-data">
							{ useSnippet && __( 'Snippet is inserted', 'google-site-kit' ) }
							{ ! useSnippet && __( 'Snippet is not inserted', 'google-site-kit' ) }
						</h5>
						{ hasExistingTag &&
							<p>{ __( 'Placing two tags at the same time is not recommended.', 'google-site-kit' ) }</p>
						}
					</div>
				</div>
			</Fragment>
		);
	}

	renderAccountDropdownForm() {
		const {
			ampEnabled,
			accounts,
			selectedAccount,
			containers,
			containersAMP,
			existingContainer,
			hasExistingTag,
			isLoading,
			isSecondaryAMP,
			errorCode,
			useSnippet,
		} = this.state;

		const {
			onSettingsPage,
		} = this.props;

		if ( isLoading ) {
			return <ProgressBar />;
		}

		// If the user doesn't have the necessary permissions for an existing tag
		// don't render the form as we may not have enough data to properly display dropdowns.
		// The user is blocked from completing setup.
		if ( 'tag_manager_existing_tag_permission' === errorCode ) {
			return null;
		}

		if ( 'accountEmpty' === errorCode ) {
			return this.renderCreateAccount();
		}

		if ( ACCOUNT_CREATE === selectedAccount ) {
			return <Fragment>
				<p>{ __( 'To create a new account, click the button below which will open the Google Tag Manager account creation screen in a new window.', 'google-site-kit' ) }</p>
				<p>{ __( 'Once completed, click the link below to re-fetch your accounts to continue.', 'google-site-kit' ) }</p>
				{ this.renderCreateAccount() }
			</Fragment>;
		}

		// Only show the web container select if AMP is not used, or AMP is in secondary mode.
		const showWebContainerSelect = ( ! ampEnabled || isSecondaryAMP );
		// Show the AMP select if AMP is in primary or secondary mode (implies enabled).
		const showAMPContainerSelect = ampEnabled;

		return (
			<Fragment>
				{ hasExistingTag && (
					<p>
						{ sprintf(
							// translators: %s: the existing container ID.
							__( 'An existing tag was found on your site (%s). If you later decide to replace this tag, Site Kit can place the new tag for you. Make sure you remove the old tag first.', 'google-site-kit' ),
							existingContainer
						) }
					</p>
				) }

				{ ( ! hasExistingTag && ! isSecondaryAMP ) && (
					<p>
						{ __( 'Please select your Tag Manager account and container below, the snippet will be inserted automatically on your site.', 'google-site-kit' ) }
					</p>
				) }

				{ ( ! hasExistingTag && isSecondaryAMP ) && (
					<p>
						{ __( 'Looks like your site is using paired AMP. Please select your Tag Manager account and relevant containers below, the snippets will be inserted automatically on your site.', 'google-site-kit' ) }
					</p>
				) }

				<div className="googlesitekit-setup-module__inputs">
					<Select
						className="googlesitekit-tagmanager__select-account"
						enhanced
						name="accounts"
						label={ __( 'Account', 'google-site-kit' ) }
						value={ selectedAccount }
						disabled={ hasExistingTag }
						onEnhancedChange={ this.handleAccountChange }
						outlined
					>
						{ []
							.concat( accounts )
							.concat( ! hasExistingTag ? {
								name: __( 'Set up a new account', 'google-site-kit' ),
								accountId: ACCOUNT_CREATE, /* Capitalization rule exception: `accountId` is a property of an API returned value. */
							} : [] )
							.map( ( account ) => {
								return (
									<Option
										key={ account.accountId /* Capitalization rule exception: `accountId` is a property of an API returned value. */ }
										value={ account.accountId /* Capitalization rule exception: `accountId` is a property of an API returned value. */ }>
										{ account.name }
									</Option>
								);
							} )
						}
					</Select>

					{ showWebContainerSelect &&
						this.renderContainerSelect( {
							selectedStateKey: 'selectedContainer',
							containers,
							label: showAMPContainerSelect ? __( 'Web Container', 'google-site-kit' ) : null,
							type: USAGE_CONTEXT_WEB,
						} )
					}

					{ showAMPContainerSelect &&
						this.renderContainerSelect( {
							selectedStateKey: 'selectedContainerAMP',
							containers: containersAMP,
							// Use the default label if it is the only select shown.
							label: showWebContainerSelect ? __( 'AMP Container', 'google-site-kit' ) : null,
							type: USAGE_CONTEXT_AMP,
						} )
					}
				</div>

				{ onSettingsPage &&
					<Fragment>
						{ hasExistingTag &&
							<p>{ __( 'Placing two tags at the same time is not recommended.', 'google-site-kit' ) }</p>
						}
						<Switch
							id="tagmanagerUseSnippet"
							onClick={ () => this.setState( { useSnippet: ! useSnippet } ) }
							name="useSnippet"
							checked={ useSnippet }
							label={ __( 'Let Site Kit place code on your site', 'google-site-kit' ) }
							hideLabel={ false }
						/>
						<p>
							{ useSnippet ?
								__( 'Site Kit will add the code automatically', 'google-site-kit' ) :
								__( 'Site Kit will not add the code to your site', 'google-site-kit' )
							}
						</p>
					</Fragment>
				}

				{ /*Render the continue and skip button.*/ }
				{
					! onSettingsPage &&
					<div className="googlesitekit-setup-module__action">
						<Button
							onClick={ this.handleSubmit }
							disabled={ ! this.canSaveSettings() }
						>{ __( 'Confirm & Continue', 'google-site-kit' ) }</Button>
					</div>
				}

			</Fragment>
		);
	}

	renderContainerSelect( args ) {
		const {
			label,
			selectedStateKey,
			containers,
			type,
		} = args;
		const {
			containersLoading,
			selectedAccount,
			hasExistingTag,
		} = this.state;
		const hasContainers = !! containers.length;

		if ( containersLoading ) {
			return <ProgressBar small />;
		}

		return (
			<Select
				className={ `
					googlesitekit-tagmanager__select-container
					googlesitekit-tagmanager__select-container--${ type }
				` }
				label={ label || __( 'Container', 'google-site-kit' ) }
				value={ hasContainers ? this.state[ selectedStateKey ] : CONTAINER_CREATE }
				onEnhancedChange={ ( idx, item ) => this.setState( { [ selectedStateKey ]: item.dataset.value } ) }
				disabled={ hasExistingTag || ! isValidAccountID( selectedAccount ) }
				enhanced
				outlined
			>
				{ []
					.concat( containers )
					.concat( ! hasExistingTag ? {
						name: __( 'Set up a new container', 'google-site-kit' ),
						publicId: CONTAINER_CREATE, /* Capitalization rule exception: `publicId` is a property of an API returned value. */
					} : [] )
					.map( ( { name, publicId }, i ) =>
						<Option
							key={ i }
							value={ publicId /* Capitalization rule exception: `publicId` is a property of an API returned value. */ }
						>
							{ name }
						</Option>
					) }
			</Select>
		);
	}

	canSaveSettings() {
		const {
			ampEnabled,
			isSecondaryAMP,
			errorCode,
			isLoading,
			selectedAccount,
			selectedContainer,
			selectedContainerAMP,
		} = this.state;

		if (
			isLoading ||
			'tag_manager_existing_tag_permission' === errorCode ||
			! isValidAccountID( selectedAccount )
		) {
			return false;
		}

		if (
			( ! ampEnabled || isSecondaryAMP ) &&
			! isValidContainerID( selectedContainer ) &&
			CONTAINER_CREATE !== selectedContainer
		) {
			return false;
		}

		if ( ampEnabled && ! isValidContainerID( selectedContainerAMP ) && CONTAINER_CREATE !== selectedContainerAMP ) {
			return false;
		}

		return true;
	}

	renderCreateAccount() {
		return <div className="googlesitekit-setup-module__action">
			<Button onClick={ TagmanagerSetup.createNewAccount }>{ __( 'Create an account', 'google-site-kit' ) }</Button>

			<div className="googlesitekit-setup-module__sub-action">
				<Link onClick={ this.refetchAccount }>{ __( 'Re-fetch My Account', 'google-site-kit' ) }</Link>
			</div>
		</div>;
	}

	/**
	 * Render Error or Notice format depending on the errorCode.
	 *
	 * @return {WPElement|null} Error message if any, or null.
	 */
	renderErrorOrNotice() {
		const {
			errorCode,
			errorMsg,
		} = this.state;

		const {
			onSettingsPage,
		} = this.props;

		if ( 0 === errorMsg.length ) {
			return null;
		}

		const showErrorFormat = onSettingsPage && 'insufficientPermissions' === errorCode ? false : true; // default error format.

		return (
			<div className={ showErrorFormat ? 'googlesitekit-error-text' : '' }>
				<p>{
					showErrorFormat ?

						/* translators: %s: Error message */
						sprintf( __( 'Error: %s', 'google-site-kit' ), errorMsg ) :
						errorMsg
				}</p>
			</div>
		);
	}

	render() {
		const {
			onSettingsPage,
			isEditing,
		} = this.props;

		return (
			<div className="googlesitekit-setup-module googlesitekit-setup-module--tag-manager">
				{
					! onSettingsPage &&
					<Fragment>
						<div className="googlesitekit-setup-module__logo">
							<SvgIcon id="tagmanager" width="33" height="33" />
						</div>
						<h2 className="
							googlesitekit-heading-3
							googlesitekit-setup-module__title
						">
							{ _x( 'Tag Manager', 'Service name', 'google-site-kit' ) }
						</h2>
					</Fragment>
				}

				{ this.renderErrorOrNotice() }

				{ isEditing && this.renderAccountDropdownForm() }

				{ ! isEditing && this.renderSettingsInfo() }

			</div>
		);
	}
}

TagmanagerSetup.propTypes = {
	onSettingsPage: PropTypes.bool,
	finishSetup: PropTypes.func,
	isEditing: PropTypes.bool,
};

TagmanagerSetup.defaultProps = {
	onSettingsPage: true,
	isEditing: false,
};

export default TagmanagerSetup;
