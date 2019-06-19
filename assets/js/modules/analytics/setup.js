/**
 * AnalyticsSetup component.
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

import data from 'GoogleComponents/data';
import PropTypes from 'prop-types';
import Button from 'GoogleComponents/button';
import ProgressBar from 'GoogleComponents/progress-bar';
import Link from 'GoogleComponents/link';
import Radio from 'GoogleComponents/radio';
import Switch from 'GoogleComponents/switch';
import { Select, Option } from 'SiteKitCore/material-components';
import SvgIcon from 'GoogleUtil/svg-icon';
import {
	sendAnalyticsTrackingEvent,
	isFrontendIframeLoaded,
	findTagInIframeContent,
	toggleConfirmModuleSettings,
} from 'GoogleUtil';

const { __, sprintf } = wp.i18n;
const { Component, Fragment } = wp.element;
const {
	removeFilter,
	addFilter,
} = wp.hooks;
const { trimEnd } = lodash;

class AnalyticsSetup extends Component {
	constructor( props ) {
		super( props );
		const {
			accountId,
			internalWebPropertyId,
			profileId,
			propertyId,
			useSnippet,
			ampClientIdOptIn
		} = googlesitekit.modules.analytics.settings;

		this.state = {
			setupNewAccount: false,
			isLoading: true,
			isSaving: false,
			propertiesLoading: false,
			profilesLoading: false,
			useSnippet: useSnippet,
			errorCode: false,
			errorMsg: '',
			errorReason: false,
			accounts: [],
			properties: [],
			profiles: [],
			selectedAccount: accountId,
			selectedProperty: propertyId,
			selectedProfile: profileId,
			selectedinternalWebProperty: internalWebPropertyId,
			ampClientIdOptIn: ampClientIdOptIn,
			existingTag: false,
			iframeLoaded: false,
		};

		this.handleAccountChange = this.handleAccountChange.bind( this );
		this.handlePropertyChange = this.handlePropertyChange.bind( this );
		this.handleProfileChange = this.handleProfileChange.bind( this );
		this.processAccountChange = this.processAccountChange.bind( this );
		this.processPropertyChange = this.processPropertyChange.bind( this );
		this.handleSubmit = this.handleSubmit.bind( this );
		this.handleRadioClick = this.handleRadioClick.bind( this );
		this.handleAMPClientIdSwitch = this.handleAMPClientIdSwitch.bind( this );
		this.handleRefetchAccount = this.handleRefetchAccount.bind( this );
	}

	async componentDidMount() {
		this._isMounted = true;

		this.iframeLoad();

		await this.getAccounts();

		this.getExistingTag();

		// Handle save hook from the settings page.
		addFilter( 'googlekit.SettingsConfirmed',
			'googlekit.AnalyticsSettingsConfirmed',
			( chain, module ) => {
				if ( 'analytics' !== module.replace( '-module', '' ) ) {
					return chain;
				}
				const { isEditing } = this.props;
				if ( isEditing ) {
					return this.handleSubmit();
				}
			} );
	}

	componentWillUnmount() {
		this._isMounted = false;

		removeFilter( 'googlekit.SettingsConfirmed', 'googlekit.AnalyticsSettingsConfirmed' );
	}

	componentDidUpdate() {
		this.toggleConfirmChangesButton();
	}

	/**
	 * Toggle confirm changes button disable/enabble depending on the changed settings.
	 */
	toggleConfirmChangesButton() {

		if ( ! this.props.isEditing ) {
			return;
		}

		const settingsMapping = {
			selectedAccount: 'accountId',
			selectedProperty: 'propertyId',
			selectedProfile: 'profileId',
			selectedinternalWebProperty: 'internalWebPropertyId',
			useSnippet: 'useSnippet',
			ampClientIdOptIn: 'ampClientIdOptIn',
		};

		toggleConfirmModuleSettings( 'analytics', settingsMapping, this.state );
	}

	handleAccountChange( index, item ) {
		const { selectedAccount } = this.state;
		const selectValue = item.getAttribute( 'data-value' );

		if ( selectValue === selectedAccount ) {
			return;
		}

		// The selected value is string.
		if ( '-1' === selectValue ) {
			this.setState( {
				selectedAccount: selectValue,
				setupNewAccount: true,
			} );
			return;
		}

		if ( '0' === selectValue ) {
			this.setState( {
				selectedAccount: selectValue,
				selectedProperty: '-1',
				selectedProfile: '-1',
				setupNewAccount: false,
				properties: [ {
					id: '-1',
					name: __( 'Select an account', 'google-site-kit' )
				} ],
				profiles: [ {
					id: '-1',
					name: __( 'Select an account', 'google-site-kit' )
				} ],
			} );
			return;
		}

		this.setState( {
			propertiesLoading: true,
			profilesLoading: true,
			selectedAccount: selectValue,
			setupNewAccount: false,
		} );

		// Track selection.
		sendAnalyticsTrackingEvent( 'analytics_setup', 'account_change', selectValue );

		this.processAccountChange( selectValue );
	}

	handlePropertyChange( index, item ) {
		const { selectedProperty } = this.state;
		const selectValue = item.getAttribute( 'data-value' );

		if ( selectValue === selectedProperty ) {
			return;
		}

		// The selected value is string.
		if ( '0' === selectValue ) {
			this.setState( {
				selectedProperty: selectValue,
				selectedProfile: selectValue,
				profiles: [ {
					id: 0,
					name: __( 'Setup a New Profile', 'google-site-kit' )
				} ],
			} );
			return;
		}

		this.setState( {
			profilesLoading: true,
			selectedProperty: selectValue,
		} );

		// Track selection.
		sendAnalyticsTrackingEvent( 'analytics_setup', 'property_change', selectValue );

		this.processPropertyChange( selectValue );
	}

	handleProfileChange( index, item ) {
		const selectValue = item.getAttribute( 'data-value' );

		this.setState( {
			selectedProfile: selectValue
		} );

		// Track selection.
		sendAnalyticsTrackingEvent( 'analytics_setup', 'profile_change', selectValue );
	}

	/**
	 * Looks for existing tag in iframe front end load if no existing tag was found on server side
	 * while requesting list of accounts.
	 */
	async getExistingTag() {
		const { onSettingsPage } = this.props;
		const {
			useSnippet,
			existingTag,
			iframeLoaded,
		} = this.state;

		if ( existingTag ) {
			return;
		}

		let tagFound = false;

		// Try detect analytics tag from iframe.
		if ( iframeLoaded ) {
			tagFound = findTagInIframeContent( this.state.iframeLoaded, 'analytics' );
		}

		// Double check existing tag from accounts cached data and remove cache if data needs to be updated.
		if ( false === tagFound ) {
			let accountsData = data.getCache( 'analytics', 'get-accounts', 3600 );
			if ( accountsData && accountsData.existingTag ) {
				data.deleteCache( 'analytics', 'get-accounts' );
			}
		}

		if ( this._isMounted ) {
			this.setState( {
				existingTag: tagFound,

				// Set useSnippet default as true while setting up analytics if there is no existing tag.
				useSnippet: ( ! tagFound && ! onSettingsPage ) ? true : useSnippet,
			} );
		}
	}

	/**
	 * Save iframe for tag verification in state.
	 */
	iframeLoad() {
		const iframe = isFrontendIframeLoaded();

		if ( iframe && -1 !== iframe.dataset.modules.indexOf( 'analytics' ) ) {
			const iFrameIsLoaded = iframe.contentDocument || ( iframe.contentWindow && iframe.contentWindow.document ) ;

			if ( iFrameIsLoaded ) {
				this.setState( { iframeLoaded: iframe } );
			} else {
				iframe.onload = async() => {
					this.setState( { iframeLoaded: iframe } );
				};
			}
		}
	}

	async getAccounts() {
		const { isEditing } = this.props;

		try {
			let responseData = await data.get( 'modules', 'analytics', 'get-accounts', {}, false );
			let selectedAccount = this.state.selectedAccount;
			let selectedProperty = this.state.selectedProperty;
			let selectedProfile = this.state.selectedProfile;

			if ( 0 === responseData.accounts.length ) {

				// clear the cache.
				data.deleteCache( 'analytics', 'get-accounts' );
			} else {

				if ( ! selectedAccount ) {
					let matchedProperty = null;

					if ( responseData.existingTag ) {

						// Select account and property of existing tag.
						matchedProperty = responseData.existingTag.property;
						if ( this._isMounted ) {
							this.setState( {
								existingTag: responseData.existingTag.property[0].id,
							} );
						}
					} else {

						// Look for account, property and profile match to site URL.
						matchedProperty = responseData.properties.filter( property => {
							return trimEnd( property.websiteUrl, '/' ) === trimEnd( googlesitekit.admin.siteURL, '/' );
						} );
					}

					if ( 0 < matchedProperty.length ) {
						selectedAccount  = matchedProperty[0].accountId;
						selectedProperty = matchedProperty[0].id;
						const matchedProfile = responseData.profiles.filter( profile => {
							return profile.accountId === selectedAccount;
						} );
						if ( 0 < matchedProfile.length ) {
							selectedProfile = matchedProfile[0].id;
						}
					} else {
						responseData.accounts.unshift( {
							id: 0,
							name: __( 'Select one...', 'google-site-kit' )
						} );
					}
				} else {

					// Verify user has access to selected property.
					const hasAccessToAccount = responseData.accounts.filter( account => {
						return account.id === selectedAccount;
					} );

					if ( 0 === hasAccessToAccount.length ) {
						data.deleteCache( 'analytics', 'get-accounts' );

						responseData.accounts.unshift( {
							id: 0,
							name: __( 'Select one...', 'google-site-kit' )
						} );

						if ( isEditing ) {
							selectedAccount = '0';
							selectedProperty = '-1';
							selectedProfile = '-1';
						}

						if ( this._isMounted ) {
							this.setState( {
								errorCode: true,
								errorReason: 'insufficientPermissions',
							} );
						}
					}
				}
			}

			// Return only existing tag account and property for dropdown options.
			if ( responseData.existingTag ) {
				responseData.accounts = responseData.accounts.filter( ( account ) => {
					return responseData.existingTag.account === account.id;
				} );
				responseData.properties = responseData.properties.filter( ( property ) => {
					return responseData.existingTag.property[0].id === property.id;
				} );
			}

			const chooseAccount = {
				id: '-1',
				name: __( 'Select an account', 'google-site-kit' )
			};

			if ( ! this.state.existingTag ) {
				const chooseProperty = {
					id: 0,
					name: __( 'Setup a New Property', 'google-site-kit' )
				};
				responseData.properties.push( chooseProperty );
			}

			const chooseProfile = {
				id: 0,
				name: __( 'Setup a New Profile', 'google-site-kit' )
			};
			responseData.profiles.push( chooseProfile );

			let newState = {
				isLoading: false,
				accounts: responseData.accounts,
				errorCode: this.state.errorCode,
				selectedAccount: selectedAccount,
				selectedProperty: selectedProperty,
				selectedProfile: selectedProfile,
				properties: [ chooseAccount ],
				profiles: [ chooseAccount ],
			};

			if ( selectedAccount && '0' !== selectedAccount ) {
				newState = Object.assign( newState, {
					properties: responseData.properties,
					profiles: responseData.profiles,
					selectedinternalWebProperty: ( responseData.properties[0] ) ? responseData.properties[0].internalWebPropertyId : 0,
				} );
			}

			if ( this._isMounted ) {
				this.setState( newState );
			}
		} catch ( err ) {
			if ( this._isMounted ) {
				this.setState( {
					isLoading: false,
					errorCode: err.code,
					errorMsg: err.message,
					errorReason: err.data && err.data.reason ? err.data.reason : false,
				} );
			}
		}
	}

	async processAccountChange( selectValue ) {
		try {
			const queryArgs = {
				accountId: selectValue,
			};

			let responseData = await data.get( 'modules', 'analytics', 'get-properties', queryArgs );

			const chooseProperty = {
				id: 0,
				name: __( 'Setup a New Property', 'google-site-kit' )
			};
			responseData.properties.push( chooseProperty );
			const chooseProfile = {
				id: 0,
				name: __( 'Setup a New Profile', 'google-site-kit' )
			};
			responseData.profiles.push( chooseProfile );

			this.setState( {
				propertiesLoading: false,
				profilesLoading: false,
				properties: responseData.properties,
				profiles: responseData.profiles,
				selectedAccount: selectValue,
				selectedProperty: responseData.properties[0].id,
				selectedinternalWebProperty: responseData.properties[0].internalWebPropertyId,
				selectedProfile: responseData.profiles[0].id,
				errorCode: false,
			} );
		} catch ( err ) {
			this.setState( {
				errorCode: err.code,
				errorMsg: err.message,
			} );
		}
	}

	async processPropertyChange( selectValue ) {
		const { selectedAccount } = this.state;

		try {
			const queryArgs = {
				accountId: selectedAccount,
				propertyId: selectValue,
			};

			let responseData = await data.get( 'modules', 'analytics', 'get-profiles', queryArgs );

			this.setState( {
				profilesLoading: false,
				profiles: responseData,
				selectedProperty: selectValue,
				selectedinternalWebProperty: responseData[0].internalWebPropertyId,
				selectedProfile: responseData[0].id,
				errorCode: false,
			} );
		} catch ( err ) {
			this.setState( {
				errorCode: err.code,
				errorMsg: err.message,
			} );
		}
	}

	async handleSubmit( e ) {
		e && e.preventDefault();

		if ( ! this.state.selectedAccount || '-1' === this.state.selectedAccount ) {
			return;
		}

		const {
			selectedAccount,
			selectedProperty,
			selectedProfile,
			useSnippet,
			selectedinternalWebProperty,
			accounts,
			properties,
			profiles,
			ampClientIdOptIn,
		} = this.state;

		this.setState( {
			isSaving: true
		} );

		const {
			finishSetup,
		} = this.props;

		const analyticAccount = {
			accountId: selectedAccount || accounts[0].id || null,
			profileId: selectedProfile || profiles[0].id || null,
			propertyId: selectedProperty || properties[0].id || null,
			internalWebPropertyId: selectedinternalWebProperty || properties[0].internalWebPropertyId || null,
			useSnippet: useSnippet || false,
			ampClientIdOptIn: ampClientIdOptIn || false,
		};

		try {
			const response = await data.set( 'modules', 'analytics', 'save', analyticAccount );

			const cache = data.getCache( 'analytics', 'get-accounts', 3600 );
			if ( cache ) {
				const newData = {};

				newData.properties = this.state.properties.filter( profile => {
					return 0 !== profile.id;
				} );
				newData.profiles = this.state.profiles.filter( profile => {
					return 0 !== profile.id;
				} );

				const values = Object.assign( cache, newData );
				data.setCache( 'analytics', 'get-accounts', values );
			}

			googlesitekit.modules.analytics.settings.accountId  = response.accountId;
			googlesitekit.modules.analytics.settings.profileId  = response.profileId;
			googlesitekit.modules.analytics.settings.propertyId = response.propertyId;
			googlesitekit.modules.analytics.settings.internalWebPropertyId = response.internalWebPropertyId;
			googlesitekit.modules.analytics.settings.useSnippet = response.useSnippet;
			googlesitekit.modules.analytics.settings.ampClientIdOptIn = response.ampClientIdOptIn;

			// Track event.
			sendAnalyticsTrackingEvent( 'analytics_setup', 'analytics_configured' );

			if ( finishSetup ) {
				finishSetup();
			}

			if ( this._isMounted ) {
				this.setState( {
					isSaving: false,
					selectedAccount: response.accountId,
					selectedProfile: response.profileId,
					selectedProperty: response.propertyId,
					selectedinternalWebProperty: response.internalWebPropertyId,
				} );
			}
		} catch ( err ) {
			this.setState( {
				isSaving: false,
				errorCode: err.code,
				errorMsg: err.message,
			} );
		}


	}

	static createNewAccount( e ) {
		e.preventDefault();
		sendAnalyticsTrackingEvent( 'analytics_setup', 'new_analytics_account' );

		window.open( 'https://analytics.google.com/analytics/web/?#/provision/SignUp', '_blank' );
	}

	handleRadioClick( e )  {
		const value = e.target.value;
		const useSnippet = ( '1' === value );
		this.setState( {
			useSnippet
		} );

		sendAnalyticsTrackingEvent( 'analytics_setup', useSnippet ? 'analytics_tag_enabled' : 'analytics_tag_disabled' );

	}

	handleAMPClientIdSwitch( ) {
		this.setState( {
			ampClientIdOptIn: ! this.state.ampClientIdOptIn
		} );
	}

	handleRefetchAccount() {
		this.setState( {
			isLoading: true,
			errorCode: false,
			errorMsg: '',
		} );

		this.getAccounts();
	}

	renderAutoInsertSnippetForm() {
		const {
			useSnippet,
			isSaving,
			ampClientIdOptIn,
			existingTag,
		} = this.state;

		const {
			isEditing,
			onSettingsPage
		}  = this.props;
		const disabled       = ! isEditing;
		const { AMPenabled } = window.googlesitekit.admin;
		const useSnippetSettings = window.googlesitekit.modules.analytics.settings.useSnippet;

		return (
			<div className="googlesitekit-setup-module__inputs googlesitekit-setup-module__inputs--multiline">
				{
					( isEditing || isSaving ) &&
						<Fragment>
							{ onSettingsPage &&
								<Fragment>
									{ ! useSnippetSettings && ! existingTag &&
										<Fragment>
											<p className="googlesitekit-setup-module__text--no-margin">{ __( 'Currently there is no Analytics snippet placed on your site, so no stats are being gathered. Would you like Site Kit to insert the Analytics snippet? You can change this setting later.', 'google-site-kit' ) }</p>
										</Fragment>
									}
									{ useSnippetSettings &&
										<p className="googlesitekit-setup-module__text--no-margin">{ __( 'Do you want to remove the Analytics snippet inserted by Site Kit?', 'google-site-kit' ) }</p>
									}
								</Fragment>
							}
							{ onSettingsPage && ! existingTag && ! useSnippet && useSnippetSettings &&
								<p>{ sprintf( __( 'If the code snippet is removed, you will no longer be able to gather Analytics insights about your site.', 'google-site-kit' ), existingTag ) }</p>
							}
						</Fragment>
				}
				{ onSettingsPage &&
					<Fragment>
						{ existingTag &&
							<p>{ sprintf( __( 'Placing two tags at the same time is not recommended.', 'google-site-kit' ), existingTag ) }</p>
						}
						<Radio
							onClick={ this.handleRadioClick }
							id="useSnippetTrue"
							name="useSnippet"
							value="1"
							checked={ useSnippet }
							disabled={ disabled }
						>
							{ ! useSnippetSettings ? __( 'Insert snippet', 'google-site-kit' ) : __( 'Not at this time', 'google-site-kit' ) }
						</Radio>
						<Radio
							onClick={ this.handleRadioClick }
							id="useSnippetFalse"
							name="useSnippet"
							value="0"
							checked={ ! useSnippet }
							disabled={ disabled }
						>
							{ useSnippetSettings ? __( 'Remove snippet', 'google-site-kit' ) : __( 'Not at this time', 'google-site-kit' ) }
						</Radio>
					</Fragment>
				}
				{ useSnippet && AMPenabled &&
					<div className="googlesitekit-setup-module__input">
						<Switch
							id="ampClientIdOptIn"
							label={ __( 'Opt in AMP Client ID', 'google-site-kit' ) }
							onClick={ this.handleAMPClientIdSwitch }
							checked={ ampClientIdOptIn }
							hideLabel={ false }
						/>
						<p>
							{ ampClientIdOptIn ?
								__( 'Sessions will be combined across AMP/non-AMP pages.', 'google-site-kit' ) + ' ' :
								__( 'Sessions will be tracked separately between AMP/non-AMP pages.', 'google-site-kit' ) + ' '
							}
							<Link href="https://support.google.com/analytics/answer/7486764" external inherit>{ __( 'Learn more', 'google-site-kit' ) }</Link>
						</p>
					</div>
				}
			</div>
		);
	}

	accountsDropdown() {
		const {
			accounts,
			selectedAccount,
			existingTag,
		} = this.state;

		const {
			isEditing,
		} = this.props;

		let disabled = ! isEditing;
		if ( existingTag &&  selectedAccount ) {
			disabled = true;
		}

		return (
			<Select
				enhanced
				name='accounts'
				value={ selectedAccount || '0'  }
				onEnhancedChange={ this.handleAccountChange }
				label={ __( 'Account', 'google-site-kit' ) }
				disabled={ disabled }
				outlined
			>
				{ accounts.map( ( account, id ) =>
					<Option
						key={ id }
						value={ account.id }
					>
						{ account.name }
					</Option> ) }
			</Select>
		);
	}

	hasAccessToExistingTagProperty() {
		const {
			existingTag,
			selectedProfile,
		} = this.state;

		return existingTag && selectedProfile;
	}

	renderForm() {
		const {
			isLoading,
			propertiesLoading,
			profilesLoading,
			accounts,
			properties,
			profiles,
			selectedAccount,
			selectedProperty,
			selectedProfile,
			useSnippet,
			setupNewAccount,
			existingTag,
		} = this.state;

		const {
			onSettingsPage,
			isEditing,
		} = this.props;
		const disabledProfile = ! isEditing;

		let disabledProperty = ! isEditing;
		if ( existingTag &&  selectedProperty ) {
			disabledProperty = true;
		}

		const { setupComplete } = googlesitekit.modules.analytics;

		if ( isLoading ) {
			return <ProgressBar/>;
		}

		// Accounts will always include Set up New Account option unless existing tag matches property.
		if ( ( 1 >= accounts.length && ! existingTag ) || ( 0 >= accounts.length && existingTag ) || setupNewAccount ) {
			if ( ! isEditing ) {
				return __( 'No account found.', 'google-site-kit' );
			}
			if ( ! setupComplete || isEditing ) {
				if ( ! this.hasAccessToExistingTagProperty() && 0 < accounts.length ) {
					return null;
				}
				return (
					<Fragment>
						{ ( setupNewAccount && 1 < accounts.length ) &&
							<div className="googlesitekit-setup-module__inputs">{ this.accountsDropdown() }</div>
						}
						<div className="googlesitekit-setup-module__action">
							<Button onClick={ AnalyticsSetup.createNewAccount }>{ __( 'Create an account', 'google-site-kit' ) }</Button>

							<div className="googlesitekit-setup-module__sub-action">
								<Link onClick={ this.handleRefetchAccount }>{ __( 'Re-fetch My Account', 'google-site-kit' ) }</Link>
							</div>
						</div>
					</Fragment>
				);
			}
		}

		if ( ! isEditing ) {
			let tagStateMessage = useSnippet ? __( 'Snippet is inserted', 'google-site-kit' ) : __( 'Snippet is not inserted', 'google-site-kit' );
			if ( existingTag ) {
				tagStateMessage = __( 'Inserted by another plugin or theme', 'google-site-kit' );
			}

			return (
				<Fragment>
					<div className="googlesitekit-settings-module__meta-items">
						<div className="googlesitekit-settings-module__meta-item">
							<p className="googlesitekit-settings-module__meta-item-type">
								{ __( 'Account', 'google-site-kit' ) }
							</p>
							<h5 className="googlesitekit-settings-module__meta-item-data">
								{ selectedAccount || accounts[0].name || false }
							</h5>
						</div>
						<div className="googlesitekit-settings-module__meta-item">
							<p className="googlesitekit-settings-module__meta-item-type">
								{ __( 'Property', 'google-site-kit' ) }
							</p>
							<h5 className="googlesitekit-settings-module__meta-item-data">
								{ selectedProperty || properties[0].name || false }
							</h5>
						</div>
						<div className="googlesitekit-settings-module__meta-item">
							<p className="googlesitekit-settings-module__meta-item-type">
								{ __( 'View', 'google-site-kit' ) }
							</p>
							<h5 className="googlesitekit-settings-module__meta-item-data">
								{ selectedProfile || profiles[0].name || false }
							</h5>
						</div>
					</div>
					<div className="googlesitekit-settings-module__meta-items">
						<div className="
							googlesitekit-settings-module__meta-item
							googlesitekit-settings-module__meta-item--nomargin
						">
							<p className="googlesitekit-settings-module__meta-item-type">
								{ __( 'Analytics Code Snippet', 'google-site-kit' ) }
							</p>
							<h5 className="googlesitekit-settings-module__meta-item-data">
								{ tagStateMessage }
							</h5>
						</div>
					</div>
				</Fragment>
			);
		}

		return (
			<Fragment>
				{ ! onSettingsPage && 0 < accounts.length && ! existingTag &&
					<p>{ __( 'Please select the account information below. You can change this view later in your settings.', 'google-site-kit' ) }</p>
				}
				<div className="googlesitekit-setup-module__inputs">
					{ this.accountsDropdown() }
					{ propertiesLoading ? ( <ProgressBar small /> ) : (
						<Select
							enhanced
							name='properties'
							value={ selectedProperty || '-1' }
							onEnhancedChange={ this.handlePropertyChange }
							label={ __( 'Property', 'google-site-kit' ) }
							disabled={ disabledProperty }
							outlined
						>
							{ properties.map( ( property, id ) =>
								<Option
									key={ id }
									value={ property.id }>
									{ property.name }
								</Option> ) }

						</Select>
					) }
					{ profilesLoading ? ( <ProgressBar small /> ) : (
						<Select
							enhanced
							name='profiles'
							value={  selectedProfile || '-1' }
							onEnhancedChange={ this.handleProfileChange }
							label={ __( 'View', 'google-site-kit' ) }
							disabled={ disabledProfile }
							outlined
						>
							{ profiles.map( ( profile, id ) =>
								<Option
									key={ id }
									value={ profile.id }>
									{ profile.name }
								</Option> ) }

						</Select>
					) }
				</div>

				{ /*Render the auto snippet toggle form.*/ }
				{ this.renderAutoInsertSnippetForm() }

				{ /*Render the continue and skip button.*/ }
				{
					! onSettingsPage &&
					<div className="googlesitekit-setup-module__action">
						<Button
							disabled={ ! this.state.selectedAccount }
							onClick={ this.handleSubmit }>{ __( 'Configure Analytics', 'google-site-kit' ) }</Button>
					</div>
				}
			</Fragment>
		);
	}

	renderErrorOrNotice() {
		const {
			errorCode,
			errorMsg,
			errorReason,
			accounts,
		} = this.state;

		const {
			onSettingsPage,
		} = this.props;

		if ( ! errorCode ) {
			return null;
		}

		let showError = true; // default error message.
		let showNotice = false;
		let message = errorMsg;

		switch ( true ) {
				case 'google_analytics_existing_tag_permission' === errorCode:
					showError = false;
					showNotice = true;
					break;
				case onSettingsPage && errorCode && 'insufficientPermissions' === errorReason:
					showError = false;
					showNotice = true;
					message = __( 'You currently don\'t have access to this account.You can either request access from your team, or remove this Analytics tag and connect to a different account.', 'google-site-kit' );
					break;
				case ! onSettingsPage && 0 === accounts.length:
					showError = false;
					showNotice = true;
					message = __( 'Looks like you don\'t have Analytics account yet. Once you create it click "Re-fetch my account" and Site Kit will locate it.', 'google-site-kit' );
					break;
		}

		if ( showError && 0 < message.length ) {
			return (
				<div className="googlesitekit-error-text">
					<p>{ __( 'Error:', 'google-site-kit' ) } { message }</p>
				</div>
			);
		}

		if ( showNotice && 0 < message.length ) {
			return (
				<div>
					<p>{ message }</p>
				</div>
			);
		}
	}

	render() {

		// The description section is hidden when displaying on the settings page.
		const { onSettingsPage } = this.props;
		const {
			existingTag,
		} = this.state;

		if ( ! onSettingsPage ) {
			sendAnalyticsTrackingEvent( 'analytics_setup', 'configure_analytics_screen' );
		}

		return (
			<div className="googlesitekit-setup-module googlesitekit-setup-module--analytics">
				{
					! onSettingsPage &&
						<Fragment>
							<div className="googlesitekit-setup-module__logo">
								<SvgIcon id="analytics" width="33" height="33"/>
							</div>
							<h2 className="
								googlesitekit-heading-3
								googlesitekit-setup-module__title
							">
								{ __( 'Analytics', 'google-site-kit' ) }
							</h2>
						</Fragment>
				}

				{ this.hasAccessToExistingTagProperty() && existingTag !== googlesitekit.admin.trackingID &&
					<p>{ sprintf( __( 'An existing analytics tag was found on your site with the id %s. If later on you decide to replace this tag, Site Kit can place the new tag for you. Make sure you remove the old tag first.', 'google-site-kit' ), existingTag ) }</p>
				}

				{ this.renderErrorOrNotice() }

				{ this.renderForm() }
			</div>
		);
	}
}

AnalyticsSetup.propTypes = {
	onSettingsPage: PropTypes.bool,
	finishSetup: PropTypes.func,
	isEditing: PropTypes.bool,
};

AnalyticsSetup.defaultProps = {
	onSettingsPage: true,
	isEditing: false,
};

export default AnalyticsSetup;
