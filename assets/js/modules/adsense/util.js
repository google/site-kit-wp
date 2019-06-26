/**
 * AdSense utility functions.
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
import {
	getSiteKitAdminURL,
	getReAuthUrl,
	sendAnalyticsTrackingEvent,
} from 'GoogleUtil';

const { each, find, filter } = lodash;
const { __, sprintf } = wp.i18n;

export function reduceAdSenseData( rows ) {
	const dataMap = [
		[
			{ type: 'date', label: 'Day' },
			{ type: 'number', label: 'RPM' },
			{ type: 'number', label: 'Earnings' },
			{ type: 'number', label: 'Impressions' },
		]
	];

	each( rows, ( row ) => {
		const date = new Date( row[0] );
		dataMap.push( [
			date,
			row[2],
			row[1],
			row[3],
		] );
	} );

	return {
		dataMap,
	};
}

/**
 * Determine the AdSense account status.
 *
 * @param {function} statusUpdateCallback The function to call back with status updates.
 */
export async function getAdSenseAccountStatus( statusUpdateCallback, existingTag = false ) {

	/**
	 * Defines the account status variables.
	 */
	let accountStatus      = '';
	let statusMessage      = '';
	let profile            = false;
	let ctaLink            = '';
	let ctaLinkText        = '';
	let ctaTarget          = false;
	let helpLink           = '';
	let helpLinkText       = '';
	let setupComplete      = false;
	let statusHeadline     = '';
	let issue              = '';
	let notice             = '';
	let icon               = '';
	let buttonLink         = false;
	let footerText         = '';
	let footerAppendedText = '';
	let footerCTA          = '';
	let footerCTALink      = '';
	let continueAction     = false;
	let accountTagMatch    = false;
	let clientId           = false;
	let switchLabel        = '';
	let tracking           = false;
	let switchOffMessage   = '';
	let switchOnMessage    = '';

	const { accountURL, signupURL } = googlesitekit.modules.adsense;

	try {

		// First, fetch the list of accounts connected to this user.
		statusUpdateCallback( __( 'Locating accounts…', 'google-site-kit' ) );
		const results     = await data.get( 'modules', 'adsense', 'accounts' ).then( res => res ).catch( e => e );
		const accountData = results.data && ( ! results.data.status || 200 === results.data.status  )  ? results.data : results;
		const hasError    = accountData && accountData.message && accountData.message.error;
		let id            = accountData && accountData.length && accountData[0] ? accountData[0].id : false;

		/**
		 * Handle error states.
		 */
		if ( ! accountData || ! id || hasError ) {

			const { errors } = accountData.message.error;
			const { reason } = errors[0];

			/**
			 * Status: noAdSenseAccount.
			 *
			 * No account.
			 */
			if ( 'noAdSenseAccount'  === reason || ! accountData || ! id ) {

				/**
				 * Status disapprovedAccount.
				 *
				 * There is an AdSense account, it is disapproved, suspended, terminated etc.
				 */
				if ( 'disapprovedAccount' === reason ) {
					accountStatus  = 'account-disapproved';
					statusHeadline =  __( 'Your site isn’t ready to show ads yet', 'google-site-kit' );
					statusMessage  =  __( 'You need to fix some things before we can connect Site Kit to your AdSense account.', 'google-site-kit' );
					ctaLinkText    = __( 'Go to AdSense to find out how to fix the issue', 'google-site-kit' );
					ctaLink        = accountURL;
				} else {

					// There is no AdSense account, there is an existing tag.
					if ( existingTag ) {
						accountStatus  = 'no-account-tag-found';
						statusHeadline =  __( 'Looks like you’re already using AdSense', 'google-site-kit' );
						statusMessage  =  __( 'We’ve found some AdSense code on your site, but it’s not linked to this Google account.', 'google-site-kit' );
						profile        = false;
						ctaLinkText    = __( 'Switch Google account', 'google-site-kit' );
						ctaLink        = getReAuthUrl( 'adsense', true );
						buttonLink     = true;
						switchLabel  = __( 'Let Site Kit place code on your site to get your site approved', 'google-site-kit' );
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

					} else {
						accountStatus      = 'no-account';
						statusHeadline     =  __( 'Create your AdSense account', 'google-site-kit' );
						statusMessage      =  __( 'Site Kit will place AdSense code on every page across your site. This means Google will automatically place ads for you in all the best places.', 'google-site-kit' );
						profile            = true;
						ctaLinkText        = __( 'Create AdSense Account', 'google-site-kit' );
						ctaLink            = signupURL;
						ctaTarget          = '_blank';
						buttonLink         = true;
						footerText         = __( 'Already have an AdSense account?', 'google-site-kit'  );
						footerAppendedText = __( 'to connect to it', 'google-site-kit'  );
						footerCTA          = __( 'Switch Google account', 'google-site-kit' );
						footerCTALink      = getReAuthUrl( 'adsense', true );
						tracking           = {
							eventCategory: 'adsense_setup',
							eventName: 'create_adsense_account'
						};
					}
				}
			}
		} else {

			// Found one or more accounts for this user, continue processing.
			const accounts = accountData;

			// If multiple accounts are returned, we need to search thru all of them to find accounts with matching domains.
			if ( 1 < accounts.length ) {

				// Find accounts with a matching URL channel.
				statusUpdateCallback( __( 'Searching for domain…', 'google-site-kit' ) );
				for ( let account of accounts ) {
					const accountId = account.id;
					const urlchannels = await data.get( 'modules', 'adsense', 'urlchannels', { clientId: accountId } ).then( res => res ).catch( e => e );
					const parsedUrl = new URL( googlesitekit.admin.siteURL );
					const matches = urlchannels && urlchannels.length ? filter( urlchannels, { urlPattern: parsedUrl.hostname } ) : [];

					if ( 0 === matches.length ) {
						accountStatus  = 'account-pending-review';
						issue          = 'accountPendingReview';
						sendAnalyticsTrackingEvent( 'adsense_setup', 'adsense_account_pending', 'accountPendingReview status account-pending-review' );
					} else {
						id = matches[0].id;
						sendAnalyticsTrackingEvent( 'adsense_setup', 'adsense_account_detected' );
					}
				}
			}

			// Set AdSense account link with account found.
			googlesitekit.modules.adsense.accountURL = sprintf( 'https://www.google.com/adsense/new/%s/home', id );

			statusUpdateCallback( __( 'Account found, checking account status…', 'google-site-kit' ) );
			let results    = await data.get( 'modules', 'adsense', 'alerts', { accountId: id } ).then( res => res ).catch( e => e );
			const alerts   = results.data && ( ! results.data.status || 200 === results.data.status  ) ? results.data : results;
			const hasError = alerts && alerts.message && alerts.message.error;
			if ( find( results, { type: 'GRAYLISTED_PUBLISHER' } ) ) {
				accountStatus  = 'ads-display-pending';
				issue          = 'accountPendingReview';
				sendAnalyticsTrackingEvent( 'adsense_setup', 'adsense_account_pending', 'accountPendingReview status ads-display-pending' );
			} else {


				// Attempt to retrieve and save the client id.
				const clientResults  = await data.get( 'modules', 'adsense', 'clients' ).then( res => res ).catch( e => e );
				const clients = clientResults.data && ( ! clientResults.data.status || 200 === clientResults.data.status  ) ? clientResults.data : clientResults;
				const hasClientError = clients && clients.message && clients.message.error;
				const item = clients && clients.length ? find( clients, { productCode: 'AFC' } ) : false;
				if ( item ) {
					clientId = item.id;

					// Save the client ID immediately so we can verify the site by inserting the tag.
					await data.set( 'modules', 'adsense', 'client-id', { clientId } ).then( res => res ).catch( e => e );
				}

				if ( hasError ) {
					const { reason } = alerts.message.error.errors[0];

					/**
					 * Status: accountPendingReview
					 */
					if ( 'accountPendingReview' === reason ) {

						/**
						 * Account setup still needs completion.
						 *
						 * The 'ads-display-pending' state shows the AdSenseInProcessStatus component.
						 */
						accountStatus = 'ads-display-pending';
						issue = 'accountPendingReview';
						sendAnalyticsTrackingEvent( 'adsense_setup', 'adsense_account_pending', 'accountPendingReview status ads-display-pending' );
					}

				} else {

					statusUpdateCallback( __( 'Looking for AdSense client…', 'google-site-kit' ) );

					/**
					 * Status: Account created, but cannot get the ad code yet.
					 */
					if ( hasClientError ) {

						/**
						 * Account setup still needs completion.
						 *
						 * The 'account-required-action' state shows the AdSenseInProcessStatus component.
						 */
						accountStatus  = 'account-required-action';
						issue          = 'accountRequiredAction';
						sendAnalyticsTrackingEvent( 'adsense_setup', 'adsense_required_action', 'accountRequiredAction status' );
					} else {
						if ( item ) {
							clientId = item.id;

							// Check the URL channels.
							statusUpdateCallback( __( 'Looking for site domain…', 'google-site-kit' ) );

							let urlchannels = await data.get( 'modules', 'adsense', 'urlchannels', { clientId } ).then( res => res ).catch( e => e );

							// Find a URL channel with a matching domain
							const matches = urlchannels && urlchannels.length && filter( urlchannels, ( channel ) => {
								return 0 < googlesitekit.admin.siteURL.indexOf( channel.urlPattern );
							} );

							// No domains found in the account, it is newly set up and domain addition is pending.
							if ( 0 === urlchannels.length ) {
								accountStatus  = 'ads-display-pending';
								issue          = 'accountPendingReview';
								sendAnalyticsTrackingEvent( 'adsense_setup', 'adsense_account_pending', 'accountPendingReview status ads-display-pending' );
							} else {

								// No URL matching the site URL is found in the account, the account is still pending.
								if ( ( ! matches ) || 0 === matches.length ) {
									accountStatus  = 'account-pending-review';
									issue          = 'accountPendingReview';
									sendAnalyticsTrackingEvent( 'adsense_setup', 'adsense_account_pending', 'accountPendingReview status account-pending-review' );
								} else {
									const moduleURL = getSiteKitAdminURL(
										'googlesitekit-module-adsense',
										{}
									);

									if ( existingTag ) {

										// AdSense existing tag id matches detected client id.
										if ( clientId === existingTag ) {

											/**
											 * No error, matched domain, account is connected.
											 *
											 * Existing tag detected, matching client id.
											 */
											accountStatus    = 'account-connected';
											issue            = false;
											icon             = 'alert';
											statusHeadline   =  __( 'Site Kit will place AdSense code to your site', 'google-site-kit' );
											statusMessage    =  __( 'This means Google will automatically place ads for you in all the best places.', 'google-site-kit' );
											ctaLinkText      = __( 'Continue', 'google-site-kit' );
											ctaLink          = moduleURL;
											buttonLink       = true;
											accountTagMatch  = true;
											sendAnalyticsTrackingEvent( 'adsense_setup', 'adsense_account_connected', 'existing_matching_tag' );
											switchLabel      = __( 'Let Site Kit place code on your site', 'google-site-kit' ),
											switchOffMessage = __( 'If you don’t let Site Kit place the code you may not get the best ads experience. You can set this up later on the Site Kit settings page.', 'google-site-kit' );
											switchOnMessage  = __( 'If you’ve already set up ads on your site, it may change how they appear. You can customize this later in AdSense.', 'google-site-kit' );

										} else {

											/**
											 * No error, matched domain, account is connected.
											 *
											 * Existing tag detected, non-matching client id.
											 */
											accountStatus  = 'account-connected-nonmatching';
											issue          = false;
											icon           = false;
											statusHeadline =  __( 'Your site has code from another AdSense account', 'google-site-kit' );
											statusMessage  =  __( 'We’ve found some AdSense code on your site, but it’s not linked to this AdSense account.', 'google-site-kit' );
											profile        = false;
											ctaLinkText    = __( 'Switch Google account', 'google-site-kit' );
											ctaLink        = getReAuthUrl( 'adsense', true );
											buttonLink     = true;
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
											sendAnalyticsTrackingEvent( 'adsense_setup', 'adsense_account_connected', 'existing_non_matching_tag' );

										}

									} else {

										/**
										 * No error, matched domain, account is connected.
										 */
										accountStatus    = 'account-connected';
										issue            = false;
										icon             = false;
										statusHeadline   =  __( 'Looks like you’re already using AdSense', 'google-site-kit' );
										statusMessage    =  __( 'Site Kit will place AdSense code on your site to connect your site to AdSense and help you get the most out of ads. This means Google will automatically place ads for you in all the best places.', 'google-site-kit' );
										ctaLinkText      = __( 'Continue', 'google-site-kit' );
										ctaLink          = moduleURL;
										buttonLink       = true;
										tracking         = {
											eventCategory: 'adsense_setup',
											eventName: 'complete_adsense_setup'
										};
										switchLabel      = __( 'Let Site Kit place code on your site to get your site approved', 'google-site-kit' );
										switchOffMessage = __( 'If you’ve already got some AdSense code on your site, we recommend you use Site Kit to place code to get the most out of AdSense.', 'google-site-kit' );

										// Send a callback to set the connection status.
										statusUpdateCallback( __( 'Connecting…', 'google-site-kit' ) );

										// Track this event.
										sendAnalyticsTrackingEvent( 'adsense_setup', 'adsense_account_connected' );

										// Save the publisher clientId: AdSense setup is complete!
										await data.set( 'modules', 'adsense', 'setup-complete', { clientId } ).then( res => res ).catch( e => e );
									}
								}
							}

						} else {

							/**
							 * No AFC matching client was found.
							 *
							 * There is an AdSense account, but the AFC account is disapproved.
							 */
							accountStatus  = 'account-disapproved';
							issue          = __( 'There is an AdSense account, but the AFC account is disapproved', 'google-site-kit' );
							icon           = 'error';
							statusHeadline =  __( 'Create Account', 'google-site-kit' );
							statusMessage  =  __( 'Create an AdMob account, then open AdSense and try to upgrade.', 'google-site-kit' );
							ctaLinkText    = __( 'Create an AdMob Account', 'google-site-kit' );
							ctaLink        = 'https://google.com/admob';
						}
					}
				}
			}
		}

		let accounts = [];

		if ( accountData && accountData.length ) {
			accounts = accountData;
		}

		// Save the account status.
		await data.set( 'modules', 'adsense', 'account-status', { accountStatus } ).then( res => res ).catch( e => e );

		return ( {
			isLoading: false,
			accountStatus,
			statusMessage,
			accounts,
			profile,
			ctaLink,
			ctaLinkText,
			ctaTarget,
			helpLink,
			helpLinkText,
			error: false,
			setupComplete,
			statusHeadline,
			issue,
			notice,
			icon,
			buttonLink,
			footerCTALink,
			footerCTA,
			footerText,
			footerAppendedText,
			continueAction,
			accountTagMatch,
			clientId,
			existingTag,
			switchLabel,
			tracking,
			switchOffMessage,
			switchOnMessage,
		} );
	} catch ( err ) {
		return ( {
			isLoading: false,
			error: err.code,
			message: err.message,
		} );
	}
}

/**
 * Check if adsense is connected from Analytics API.
 *
 * @returns {boolean}
 */
export const isAdsenseConnectedAnalytics = async() => {
	const { active } = googlesitekit.modules.adsense;
	let adsenseConnect = true;

	if ( active ) {
		await data.get( 'modules', 'analytics', 'adsense' ).then( ( res ) => {
			if ( res ) {
				adsenseConnect = true;
			}
		} ).catch( ( err ) => {

			if ( 400 === err.code && 'INVALID_ARGUMENT' === err.message ) {
				adsenseConnect = false;
			}
		} );
	}

	return new Promise( ( resolve ) => {
		resolve( adsenseConnect );
	} );
};
