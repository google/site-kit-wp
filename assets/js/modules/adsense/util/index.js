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

/**
 * External dependencies
 */
import { parse as pslParse } from 'psl';
import data, { TYPE_MODULES } from 'GoogleComponents/data';
import { sendAnalyticsTrackingEvent, getReAuthURL, getSiteKitAdminURL } from 'GoogleUtil';
import { each, find, filter } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { analyticsAdsenseReportDataDefaults } from '../../analytics/util';

export function reduceAdSenseData( rows ) {
	const dataMap = [
		[
			{ type: 'date', label: 'Day' },
			{ type: 'number', label: 'RPM' },
			{ type: 'number', label: 'Earnings' },
			{ type: 'number', label: 'Impressions' },
		],
	];

	each( rows, ( row ) => {
		const date = new Date( row[ 0 ] );
		dataMap.push( [
			date,
			row[ 2 ],
			row[ 1 ],
			row[ 3 ],
		] );
	} );

	return {
		dataMap,
	};
}

export const propsFromAccountStatus = ( accountStatus, existingTag ) => {
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
		case 'account-connected-no-data':
			statusHeadline = __( 'We’re getting your site ready for ads', 'google-site-kit' );
			statusMessage = __(
				'AdSense is reviewing your site. Meanwhile, make sure you’ve completed these steps in AdSense.',
				'google-site-kit'
			);
			incomplete = true;
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

/**
 * Determine the AdSense account status.
 *
 * @param {string|boolean} existingTag String existing clientID, or false.
 * @param {function} statusUpdateCallback The function to call back with status updates.
 */
export const getAdSenseAccountStatus = async ( existingTag = false, statusUpdateCallback = () => {} ) => {
	/**
	 * Defines the account status variables.
	 */
	let accountStatus;
	let clientID = false;

	try {
		// First, fetch the list of accounts connected to this user.
		statusUpdateCallback( __( 'Locating accounts…', 'google-site-kit' ) );
		const results = await data.get( TYPE_MODULES, 'adsense', 'accounts' ).then( ( res ) => res ).catch( ( e ) => e );

		const accountData = results.data && ( ! results.data.status || 200 === results.data.status ) ? results.data : results;

		// If multiple accounts are returned, we need to search through all of them
		// to find accounts with matching domains.
		if ( 1 < accountData.length ) {
			// Find accounts with a matching URL channel.
			statusUpdateCallback( __( 'Searching for domain…', 'google-site-kit' ) );
			for ( const account of accountData ) {
				const accountID = account.id;
				const urlchannels = await data.get( TYPE_MODULES, 'adsense', 'urlchannels', { clientID: accountID } ).then( ( res ) => res ).catch( ( e ) => e );
				const parsedURL = new URL( googlesitekit.admin.siteURL );
				const matches = urlchannels && urlchannels.length ? filter( urlchannels, { urlPattern: parsedURL.hostname } ) : [];

				if ( ! matches || 0 === matches.length ) {
					accountStatus = 'account-pending-review';
					sendAnalyticsTrackingEvent( 'adsense_setup', 'adsense_account_pending', 'accountPendingReview status account-pending-review' );
				} else {
					id = matches[ 0 ].id;
					sendAnalyticsTrackingEvent( 'adsense_setup', 'adsense_account_detected' );
				}
			}
		}

		const hasError = accountData && accountData.message && accountData.message.error;
		let id = accountData && accountData.length && accountData[ 0 ] ? accountData[ 0 ].id : false;

		/**
		 * Handle error states.
		 */
		if ( ! accountData || ! id || hasError ) {
			const { errors } = hasError || {};
			const { reason } = errors[ 0 ];

			/**
			 * Status: noAdSenseAccount.
			 *
			 * No account.
			 */
			if ( 'noAdSenseAccount' === reason || ! accountData || ! id ) {
				/**
				 * Status disapprovedAccount.
				 *
				 * There is an AdSense account, it is disapproved, suspended, terminated etc.
				 */
				if ( 'disapprovedAccount' === reason ) {
					accountStatus = 'disapproved-account';
				} else if ( existingTag ) {
					// There is no AdSense account, there is an existing tag.
					accountStatus = 'no-account-tag-found';
				} else {
					accountStatus = 'no-account';
				}
			}
		} else {
			// Set AdSense account link with account found.
			googlesitekit.modules.adsense.accountURL = sprintf( 'https://www.google.com/adsense/new/%s/home', id );

			statusUpdateCallback( __( 'Account found, checking account status…', 'google-site-kit' ) );

			const alertsResults = await data.get( TYPE_MODULES, 'adsense', 'alerts', { accountID: id } ).then( ( res ) => res ).catch( ( e ) => e );
			const alerts = alertsResults.data && ( ! alertsResults.data.status || 200 === alertsResults.data.status ) ? alertsResults.data : alertsResults;
			const hasAlertsError = alerts && alerts.message && alerts.message.error;

			if ( find( alertsResults, { type: 'GRAYLISTED_PUBLISHER' } ) ) {
				accountStatus = 'ads-display-pending';
				sendAnalyticsTrackingEvent( 'adsense_setup', 'adsense_account_pending', 'accountPendingReview status ads-display-pending' );
			} else {
				// Attempt to retrieve and save the client id.
				const clientResults = await data.get( TYPE_MODULES, 'adsense', 'clients' ).then( ( res ) => res ).catch( ( e ) => e );
				const clients = clientResults.data && ( ! clientResults.data.status || 200 === clientResults.data.status ) ? clientResults.data : clientResults;
				const hasClientError = clients && clients.message && clients.message.error;
				const item = clients && clients.length ? find( clients, { productCode: 'AFC' } ) : false;
				if ( item ) {
					clientID = item.id;

					// Save the client ID immediately so we can verify the site by inserting the tag.
					await data.set( TYPE_MODULES, 'adsense', 'client-id', { clientID } ).then( ( res ) => res ).catch( ( e ) => e );
				}

				if ( hasAlertsError ) {
					const { reason } = alerts.message.error.errors[ 0 ];

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
						accountStatus = 'account-required-action';
						sendAnalyticsTrackingEvent( 'adsense_setup', 'adsense_required_action', 'accountRequiredAction status' );
					} else if ( item ) {
						clientID = item.id;

						// Check the URL channels.
						statusUpdateCallback( __( 'Looking for site domain…', 'google-site-kit' ) );

						const urlchannels = await data.get( TYPE_MODULES, 'adsense', 'urlchannels', { clientID } ).then( ( res ) => res ).catch( ( e ) => e );

						// Find a URL channel with a matching domain
						const matches = urlchannels && urlchannels.length && filter( urlchannels, ( channel ) => {
							return 0 < googlesitekit.admin.siteURL.indexOf( channel.urlPattern );
						} );

						// No domains found in the account, it is newly set up and domain
						// addition is pending.
						if ( 0 === urlchannels.length ) {
							accountStatus = 'ads-display-pending';
							sendAnalyticsTrackingEvent( 'adsense_setup', 'adsense_account_pending', 'accountPendingReview status ads-display-pending' );
						} else if ( ! matches || 0 === matches.length ) {
							// No URL matching the site URL is found in the account,
							// the account is still pending.
							accountStatus = 'account-pending-review';
							sendAnalyticsTrackingEvent( 'adsense_setup', 'adsense_account_pending', 'accountPendingReview status account-pending-review' );
						} else if ( existingTag && clientID === existingTag ) {
							// AdSense existing tag id matches detected client id.
							/**
							 * No error, matched domain, account is connected.
							 *
							 * Existing tag detected, matching client id.
							 */
							accountStatus = 'account-connected';
							sendAnalyticsTrackingEvent( 'adsense_setup', 'adsense_account_connected', 'existing_matching_tag' );
						} else if ( existingTag && clientID !== existingTag ) {
							/**
							 * No error, matched domain, account is connected.
							 *
							 * Existing tag detected, non-matching client id.
							 */
							accountStatus = 'account-connected-nonmatching';
							sendAnalyticsTrackingEvent( 'adsense_setup', 'adsense_account_connected', 'existing_non_matching_tag' );
						} else {
							/**
							 * No error, matched domain, account is connected.
							 */
							accountStatus = 'account-connected';

							// Send a callback to set the connection status.
							statusUpdateCallback( __( 'Connecting…', 'google-site-kit' ) );

							sendAnalyticsTrackingEvent( 'adsense_setup', 'adsense_account_connected' );

							// Save the publisher clientID: AdSense setup is complete!
							await data.set( TYPE_MODULES, 'adsense', 'setup-complete', { clientID } ).then( ( res ) => res ).catch( ( e ) => e );
						}
					} else {
						/**
						 * No AFC matching client was found.
						 *
						 * There is an AdSense account, but the AFC account is disapproved.
						 */
						accountStatus = 'disapproved-account-afc';
					}
				}
			}
		}

		// Save the account status.
		await data.set( TYPE_MODULES, 'adsense', 'account-status', { accountStatus } ).then( ( res ) => res ).catch( ( e ) => e );

		return ( {
			accountStatus,
			clientID,
		} );
	} catch ( err ) {
		return ( {
			isLoading: false,
			error: err.code,
			message: err.message,
		} );
	}
};

/**
 * Check if adsense is connected from Analytics API.
 *
 * @return {Promise} Resolves to a boolean, whether or not AdSense is connected.
 */
export const isAdsenseConnectedAnalytics = async () => {
	const { active: adsenseActive } = googlesitekit.modules.adsense;
	const { active: analyticsActive } = googlesitekit.modules.analytics;

	let adsenseConnect = true;

	if ( adsenseActive && analyticsActive ) {
		await data.get( TYPE_MODULES, 'analytics', 'report', analyticsAdsenseReportDataDefaults ).then( ( res ) => {
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

/**
 * Check for any value higher than 0 in values from AdSense data.
 *
 * @param {Array} adSenseData Data returned from the AdSense.
 * @param {string} datapoint Datapoint requested.
 * @param {Object} dataRequest Request data object.
 * @return {boolean} Whether or not AdSense data is considered zero data.
 */
export const isDataZeroAdSense = ( adSenseData, datapoint, dataRequest ) => {
	// We only check the last 28 days of earnings because it is the most reliable data point to identify new setups:
	// only new accounts or accounts not showing ads would have zero earnings in the last 28 days.
	if ( ! dataRequest.data || ! dataRequest.data.dateRange || 'last-28-days' !== dataRequest.data.dateRange ) {
		return false;
	}

	let totals = [];
	if ( adSenseData.totals ) {
		totals = adSenseData.totals;
	}

	// Look for any value > 0.
	totals = totals.filter( ( total ) => {
		return 0 < total;
	} );
	return 0 === totals.length;
};
