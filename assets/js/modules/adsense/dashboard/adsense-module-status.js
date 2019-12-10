/**
 * AdSenseModuleStatus component.
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
import { parse as pslParse } from 'psl';
import PropTypes from 'prop-types';
import SvgIcon from 'GoogleUtil/svg-icon';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import AdSenseSetupInstructions from '../setup/adsense-setup-instructions';
import AdSenseInProcessStatus from './adsense-in-process-status';
import { getExistingTag, getReAuthURL, getSiteKitAdminURL } from 'GoogleUtil';
import { getAdSenseAccountStatus } from '../util';

const propsFromAccountStatus = ( accountStatus, existingTag ) => {
	/**
	 * Defines the account status variables.
	 */
	let accountTagMatch = false;
	let continueAction = false;
	let ctaLink;
	let ctaLinkText;
	let footerAppendedText;
	let footerCTA;
	let footerCTALink;
	let footerText;
	let icon;
	let incomplete = false;
	let issue;
	let profile = false;
	let required = false;
	const setupComplete = false;
	let statusHeadline;
	let statusMessage;
	let switchLabel;
	let switchOffMessage;
	let switchOnMessage;
	let tracking = false;

	const { accountURL, signupURL } = googlesitekit.modules.adsense;
	const moduleURL = getSiteKitAdminURL(
		'googlesitekit-module-adsense',
		{}
	);
	const siteURL = new URL( googlesitekit.admin.siteURL );

	switch ( accountStatus ) {
		case 'account-connected':
			if ( existingTag ) {
				issue = false;
				icon = 'alert';
				statusHeadline = __( 'Site Kit will place AdSense code to your site', 'google-site-kit' );
				statusMessage = __( 'This means Google will automatically place ads for you in all the best places.', 'google-site-kit' );
				ctaLinkText = __( 'Continue', 'google-site-kit' );
				ctaLink = moduleURL;
				accountTagMatch = true;
				switchLabel = __( 'Let Site Kit place code on your site', 'google-site-kit' );
				switchOffMessage = __( 'If you don’t let Site Kit place the code you may not get the best ads experience. You can set this up later on the Site Kit settings page.', 'google-site-kit' );
				switchOnMessage = __( 'If you’ve already set up ads on your site, it may change how they appear. You can customize this later in AdSense.', 'google-site-kit' );
			} else {
				issue = false;
				icon = false;
				statusHeadline = __( 'Looks like you’re already using AdSense', 'google-site-kit' );
				statusMessage = __( 'Site Kit will place AdSense code on your site to connect your site to AdSense and help you get the most out of ads. This means Google will automatically place ads for you in all the best places.', 'google-site-kit' );
				ctaLinkText = __( 'Continue', 'google-site-kit' );
				ctaLink = moduleURL;
				tracking = {
					eventCategory: 'adsense_setup',
					eventName: 'complete_adsense_setup',
				};
				switchLabel = __( 'Let Site Kit place code on your site to get your site approved', 'google-site-kit' );
				switchOffMessage = __( 'If you’ve already got some AdSense code on your site, we recommend you use Site Kit to place code to get the most out of AdSense.', 'google-site-kit' );
			}
			break;
		case 'account-connected-nonmatching':
			issue = false;
			icon = false;
			statusHeadline = __( 'Your site has code from another AdSense account', 'google-site-kit' );
			statusMessage = __( 'We’ve found some AdSense code on your site, but it’s not linked to this AdSense account.', 'google-site-kit' );
			profile = false;
			ctaLinkText = __( 'Switch Google account', 'google-site-kit' );
			ctaLink = getReAuthURL( 'adsense', true );
			continueAction = {
				accountStatus: 'account-connected',
				continueText: __( 'Continue anyway', 'google-site-kit' ),
				statusHeadline: __( 'Site Kit will place AdSense code on your site', 'google-site-kit' ),
				statusMessage: __( 'To connect your site to your AdSense account, Site Kit will place AdSense code on your site. For a better ads experience, you should remove AdSense code that’s not linked to this AdSense account.', 'google-site-kit' ),
				profile: true,
				ctaLink: moduleURL,
				ctaLinkText: __( 'Continue', 'google-site-kit' ),
				continueAction: false,
				switchLabel: __( 'Let Site Kit place code on your site', 'google-site-kit' ),
				switchOffMessage: __( 'You can let Site Kit do this later.', 'google-site-kit' ),
			};
			break;
		case 'ads-display-pending':
			const { domain: parsedDomain } = pslParse( siteURL.hostname );

			statusHeadline = __( 'Let’s get your site ready for ads', 'google-site-kit' );
			statusMessage = __(
				'After you’ve finished setting up your account, we’ll let you know when your site is ready to show ads. This usually takes less than a day, but it can sometimes take a bit longer.',
				'google-site-kit'
			);
			ctaLinkText = __( 'Go to your AdSense account to check on your site’s status or to complete setting up', 'google-site-kit' );
			ctaLink = `https://www.google.com/adsense/new/sites?url=${ parsedDomain || siteURL.hostname }&source=site-kit`;
			break;
		case 'account-pending-review':
			statusHeadline = __( 'We’re getting your site ready for ads', 'google-site-kit' );
			statusMessage = __(
				'AdSense is reviewing your site. Meanwhile, make sure you’ve completed these steps in AdSense.',
				'google-site-kit'
			);
			ctaLinkText = __( 'Go to your AdSense account to check on your site’s status', 'google-site-kit' );
			ctaLink = `https://www.google.com/adsense/new/sites?url=${ siteURL.hostname }&source=site-kit`;
			incomplete = true;
			break;
		case 'account-required-action':
			required = true;
			break;
		case 'disapproved-account':
			ctaLink = accountURL;
			ctaLinkText = __( 'Go to AdSense to find out how to fix the issue', 'google-site-kit' );
			statusHeadline = __( 'Your site isn’t ready to show ads yet', 'google-site-kit' );
			statusMessage = __( 'You need to fix some things before we can connect Site Kit to your AdSense account.', 'google-site-kit' );
			break;
		case 'disapproved-account-afc':
			issue = __( 'There is an AdSense account, but the AFC account is disapproved', 'google-site-kit' );
			icon = 'error';
			statusHeadline = __( 'Create Account', 'google-site-kit' );
			statusMessage = __( 'Create an AdMob account, then open AdSense and try to upgrade.', 'google-site-kit' );
			ctaLinkText = __( 'Create an AdMob Account', 'google-site-kit' );
			ctaLink = 'https://google.com/admob';
			break;
		case 'no-account':
			statusHeadline = __( 'Create your AdSense account', 'google-site-kit' );
			statusMessage = __( 'Site Kit will place AdSense code on every page across your site. This means Google will automatically place ads for you in all the best places.', 'google-site-kit' );
			profile = true;
			ctaLinkText = __( 'Create AdSense Account', 'google-site-kit' );
			ctaLink = signupURL;
			footerText = __( 'Already have an AdSense account?', 'google-site-kit' );
			footerAppendedText = __( 'to connect to it', 'google-site-kit' );
			footerCTA = __( 'Switch Google account', 'google-site-kit' );
			footerCTALink = getReAuthURL( 'adsense', true );
			tracking = {
				eventCategory: 'adsense_setup',
				eventName: 'create_adsense_account',
			};
			break;
		case 'no-account-tag-found':
			statusHeadline = __( 'Looks like you’re already using AdSense', 'google-site-kit' );
			statusMessage = __( 'We’ve found some AdSense code on your site, but it’s not linked to this Google account.', 'google-site-kit' );
			profile = false;
			ctaLinkText = __( 'Switch Google account', 'google-site-kit' );
			ctaLink = getReAuthURL( 'adsense', true );
			switchLabel = __( 'Let Site Kit place code on your site to get your site approved', 'google-site-kit' );
			continueAction = {
				statusHeadline: __( 'Create a new AdSense account', 'google-site-kit' ),
				statusMessage: __( 'Site Kit will place additional AdSense code on every page across your site after you create an account. This means Google will automatically place ads for you in all the best places.', 'google-site-kit' ),
				notice: __( 'We recommend you remove the old AdSense code from this site.', 'google-site-kit' ),
				icon: 'warning',
				continueText: __( 'Continue anyway', 'google-site-kit' ),
				ctaLinkText: __( 'Create AdSense Account', 'google-site-kit' ),
				ctaLink: signupURL,
				ctaTarget: '_blank',
				continueAction: false,
			};
			break;
		default:
			break;
	}

	return {
		accountTagMatch,
		continueAction,
		ctaLink,
		ctaLinkText,
		footerAppendedText,
		footerCTA,
		footerCTALink,
		footerText,
		icon,
		incomplete,
		issue,
		profile,
		required,
		setupComplete,
		statusHeadline,
		statusMessage,
		switchLabel,
		switchOffMessage,
		switchOnMessage,
		tracking,
	};
};

class AdSenseModuleStatus extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			accountStatus: undefined,
			loadingMessage: __( 'Loading…', 'google-site-kit' ),
			instructionProps: {},
		};
	}

	async componentDidMount() {
		await this.updateAccountStatus();
	}

	componentDidUpdate( previousProps, previousState ) {
		const { accountStatus } = this.state;

		if ( previousState.accountStatus !== accountStatus ) {
			const adSenseSetupInstructionsProps = propsFromAccountStatus( accountStatus );
			this.setState( { instructionProps: adSenseSetupInstructionsProps } );
		}
	}

	/**
	 * If setup requires a continue step, the method repopulates state with the new data.
	 * @param {Object} continueData
	 */
	continueSetup( continueData ) {
		const { instructionProps } = this.state;

		continueData.existingState = { ...instructionProps };
		this.setState( { instructionProps: continueData } );
	}

	/**
	 * Go back to the previous (existing) state.
	 */
	goBack() {
		const { instructionProps } = this.state;

		const { existingState } = { ...instructionProps };
		if ( existingState ) {
			existingState.existingState = false;
			this.setState( { instructionProps: existingState } );
		}
	}

	async updateAccountStatus() {
		const existingTag = await getExistingTag( 'adsense' );
		const setLoadingMessage = ( message ) => {
			this.setState( { loadingMessage: message } );
		};

		const { accountStatus, clientID } = await getAdSenseAccountStatus( existingTag, setLoadingMessage );

		this.setState( { accountStatus, clientID } );
	}

	render() {
		const { accountStatus, clientID, loadingMessage, instructionProps } = this.state;

		const showInProcess = ! accountStatus || ! googlesitekit.modules.adsense.setupComplete || [
			'ads-display-pending',
			'account-pending-review',
			'account-required-action',
		].includes( accountStatus );

		return (
			<div className="googlesitekit-setup-module googlesitekit-setup-module--adsense">
				<div className="googlesitekit-setup-module__step">
					<div className="googlesitekit-setup-module__logo">
						<SvgIcon id="adsense" width="33" height="33" />
					</div>
					<h2 className="
							googlesitekit-heading-3
							googlesitekit-setup-module__title
						">
						{ _x( 'AdSense', 'Service name', 'google-site-kit' ) }
					</h2>
				</div>
				<div className="googlesitekit-setup-module__step">
					{ ! googlesitekit.canAdsRun && ! googlesitekit.modules.adsense.setupComplete && (
						<div className="googlesitekit-settings-module-warning">
							<SvgIcon id="error" height="20" width="23" />
							{ __( 'Ad blocker detected, you need to disable it in order to setup AdSense.', 'google-site-kit' ) }
						</div>
					) }

					{ showInProcess && 'account-connected' !== accountStatus && (
						<AdSenseInProcessStatus
							ctaLink={ instructionProps.ctaLink }
							ctaLinkText={ instructionProps.ctaLinkText }
							header={ instructionProps.statusHeadline }
							subHeader={ instructionProps.statusMessage }
							incomplete={ instructionProps.incomplete }
							required={ instructionProps.required }
							loadingMessage={ ! accountStatus && loadingMessage }
						/>
					) }

					{ googlesitekit.canAdsRun && ( googlesitekit.modules.adsense.setupComplete || 'account-connected' === accountStatus ) && accountStatus && (
						<AdSenseSetupInstructions
							{ ...instructionProps }
							accountStatus={ accountStatus }
							clientID={ clientID }
							continueSetup={ this.continueSetup }
							goBack={ this.goBack }
						/>
					) }
				</div>
			</div>
		);
	}
}

AdSenseModuleStatus.propTypes = {
	status: PropTypes.string,
	module: PropTypes.string,
};

export default AdSenseModuleStatus;
