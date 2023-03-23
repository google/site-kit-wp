/**
 * Adsense Setup utilities.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ProgressBar } from 'googlesitekit-components';
import ErrorText from '../../../../components/ErrorText';
import {
	ACCOUNT_STATUS_NONE,
	ACCOUNT_STATUS_MULTIPLE,
	ACCOUNT_STATUS_DISAPPROVED,
	ACCOUNT_STATUS_GRAYLISTED,
	ACCOUNT_STATUS_PENDING,
	ACCOUNT_STATUS_NO_CLIENT,
	ACCOUNT_STATUS_APPROVED,
	SITE_STATUS_NONE,
	SITE_STATUS_ADDED,
} from '../../util/status';
import SetupAccountCreate from './SetupAccountCreate';
import SetupAccountSelect from './SetupAccountSelect';
import SetupAccountDisapproved from './SetupAccountDisapproved';
import SetupAccountPending from './SetupAccountPending';
import SetupAccountNoClient from './SetupAccountNoClient';
import SetupAccountApproved from './SetupAccountApproved';
import SetupSiteAdd from './SetupSiteAdd';
import SetupSiteAdded from './SetupSiteAdded';
import { ErrorNotices } from '../common';

/**
 * Returns translatable account status element.
 *
 * @since 1.94.0
 *
 * @param {string}  accountStatus The active adsense account status.
 * @param {boolean} hasErrors     The adsense setup error flag.
 * @return {Element} The account status setup element or error notice.
 */
const getAccountStatusViewComponent = ( accountStatus, hasErrors ) => {
	let viewComponent = hasErrors ? (
		<ErrorNotices />
	) : (
		<ErrorText
			message={ sprintf(
				/* translators: %s: invalid account status identifier */
				__( 'Invalid account status: %s', 'google-site-kit' ),
				accountStatus
			) }
		/>
	);
	switch ( accountStatus ) {
		case ACCOUNT_STATUS_NONE:
			viewComponent = <SetupAccountCreate />;
			break;
		case ACCOUNT_STATUS_MULTIPLE:
			viewComponent = <SetupAccountSelect />;
			break;
		case ACCOUNT_STATUS_DISAPPROVED:
			viewComponent = <SetupAccountDisapproved />;
			break;
		case ACCOUNT_STATUS_GRAYLISTED:
		case ACCOUNT_STATUS_PENDING:
			viewComponent = <SetupAccountPending />;
			break;
		case ACCOUNT_STATUS_NO_CLIENT:
			viewComponent = <SetupAccountNoClient />;
			break;
		case ACCOUNT_STATUS_APPROVED:
			viewComponent = <SetupAccountApproved />;
			break;
	}

	return viewComponent;
};

/**
 * Returns translatable site status element.
 *
 * @since 1.94.0
 *
 * @param {string}   siteStatus  The adsense site status.
 * @param {boolean}  hasErrors   The adsense setup error flag.
 * @param {Function} finishSetup The call back action to finish adsense site setup.
 * @return {Element} The site status setup element or error notice.
 */
const getSiteStatusViewComponent = ( siteStatus, hasErrors, finishSetup ) => {
	let viewComponent = hasErrors ? (
		<ErrorNotices />
	) : (
		<ErrorText
			message={ sprintf(
				/* translators: %s: invalid site status identifier */
				__( 'Invalid site status: %s', 'google-site-kit' ),
				siteStatus
			) }
		/>
	);
	switch ( siteStatus ) {
		case SITE_STATUS_NONE:
			viewComponent = <SetupSiteAdd />;
			break;
		case SITE_STATUS_ADDED:
			viewComponent = <SetupSiteAdded finishSetup={ finishSetup } />;
			break;
	}

	return viewComponent;
};

/**
 * Returns apropriate view component to use in adsense SetupMain.
 *
 * @since 1.94.0
 *
 * @param {string}   accountStatus            The adsense account status.
 * @param {boolean}  hasErrors                The adsense setup error flag.
 * @param {string}   existingTag              The adsense existing tag.
 * @param {boolean}  isDoingSubmitChanges     The adsense submit changes action flag.
 * @param {boolean}  isSubmittingInBackground The adsense submit changes in background action flag.
 * @param {boolean}  isNavigating             The site navigation action flag.
 * @param {Function} accountSetupComplete     The callback action to finish adsense account setup.
 * @param {string}   siteStatus               The adsense site status.
 * @param {Function} siteSetupComplete        The callback action to finish adsense site setup.
 * @param {Function} finishSetup              The callback action to finish site setup.
 * @return {Element} The site status setup element or error notice.
 */
export const getSetupMainViewComponent = (
	accountStatus,
	hasErrors,
	existingTag,
	isDoingSubmitChanges,
	isSubmittingInBackground,
	isNavigating,
	accountSetupComplete,
	siteStatus,
	siteSetupComplete,
	finishSetup
) => {
	if (
		( undefined === accountStatus && ! hasErrors ) ||
		undefined === existingTag ||
		( isDoingSubmitChanges && ! isSubmittingInBackground ) ||
		isNavigating
	) {
		// Show loading indicator if account status not determined yet or if
		// a submission is in progress that is not happening in background.
		return <ProgressBar />;
	} else if (
		accountStatus !== ACCOUNT_STATUS_APPROVED ||
		! accountSetupComplete
	) {
		// Show relevant account status component.
		return getAccountStatusViewComponent( accountStatus, hasErrors );
	} else if ( undefined === siteStatus ) {
		// Show loading indicator if site status not determined yet.
		return <ProgressBar />;
	} else if ( siteStatus !== SITE_STATUS_ADDED || ! siteSetupComplete ) {
		// Show relevant site status component.
		return getSiteStatusViewComponent( siteStatus, hasErrors, finishSetup );
	}
	// This should never be reached because the setup is not accessible
	// under these circumstances due to related PHP+/JS logic. But at
	// least in theory it should show the last step, just in case.
	return <SetupSiteAdded finishSetup={ finishSetup } />;
};
