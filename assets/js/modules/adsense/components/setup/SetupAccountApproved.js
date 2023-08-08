/**
 * AdSense Setup Account Approved component.
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
 * WordPress dependencies
 */
import { Fragment, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Button } from 'googlesitekit-components';
import { MODULES_ADSENSE } from '../../datastore/constants';
import { parseAccountID } from '../../util/parsing';
import { ACCOUNT_STATUS_APPROVED } from '../../util/status';
import { ErrorNotices, UserProfile, UseSnippetSwitch } from '../common';
const { useSelect, useDispatch } = Data;

export default function SetupAccountApproved() {
	const existingTag = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getExistingTag()
	);
	const clientID = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getClientID()
	);
	const originalAccountStatus = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getOriginalAccountStatus()
	);
	const isDoingSubmitChanges = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).isDoingSubmitChanges()
	);

	const hasExistingTagPermission = existingTag === clientID;
	const { completeAccountSetup } = useDispatch( MODULES_ADSENSE );
	const continueHandler = useCallback( async () => {
		if ( isDoingSubmitChanges ) {
			return;
		}
		await completeAccountSetup();
	}, [ isDoingSubmitChanges, completeAccountSetup ] );

	if ( undefined === existingTag || undefined === originalAccountStatus ) {
		return null;
	}

	// Depending on whether the user's AdSense account was already approved
	// before setting up the module in Site Kit or not, different wording
	// needs to be used. This can be determined by checking the previously
	// saved account status. If the previous value is the approved state or
	// nothing, we know the account had already been approved.
	const isApprovedFromVeryBeginning =
		'' === originalAccountStatus ||
		ACCOUNT_STATUS_APPROVED === originalAccountStatus;

	let label;
	if ( isApprovedFromVeryBeginning ) {
		label = __(
			'Let Site Kit place AdSense code on your site to get your site approved',
			'google-site-kit'
		);
	} else {
		label = __( 'Keep AdSense code placed by Site Kit', 'google-site-kit' );
	}

	let showProfile;
	let checkedMessage;
	let uncheckedMessage;
	if ( existingTag && hasExistingTagPermission ) {
		// Existing tag with permission.
		showProfile = false;
		checkedMessage = __(
			'You’ve already got an AdSense code on your site for this account, we recommend you use Site Kit to place code to get the most out of AdSense.',
			'google-site-kit'
		);
		uncheckedMessage = checkedMessage;
	} else if ( existingTag ) {
		// Existing tag without permission.
		showProfile = true;
		checkedMessage = sprintf(
			/* translators: %s: account ID */
			__(
				'Site Kit detected AdSense code for a different account %s on your site. For a better ads experience, you should remove AdSense code that’s not linked to this AdSense account.',
				'google-site-kit'
			),
			parseAccountID( existingTag )
		);
		uncheckedMessage = __(
			'Please note that AdSense will not show ads on your website unless you’ve already placed the code.',
			'google-site-kit'
		);
	} else {
		// No existing tag.
		showProfile = false;
		uncheckedMessage = __(
			'Please note that AdSense will not show ads on your website unless you’ve already placed the code.',
			'google-site-kit'
		);
	}

	return (
		<Fragment>
			<h3 className="googlesitekit-heading-4 googlesitekit-setup-module__title">
				{ isApprovedFromVeryBeginning && (
					<span>
						{ __(
							'Looks like you’re already using AdSense',
							'google-site-kit'
						) }
					</span>
				) }
				{ ! isApprovedFromVeryBeginning && (
					<span>
						{ __(
							'Your account is ready to use AdSense',
							'google-site-kit'
						) }
					</span>
				) }
			</h3>

			<ErrorNotices />

			<p>
				{ isApprovedFromVeryBeginning && (
					<span>
						{ __(
							'Site Kit will place AdSense code on your site to connect your site to AdSense and help you get the most out of ads. This means Google will automatically place ads for you in all the best places.',
							'google-site-kit'
						) }
					</span>
				) }
				{ ! isApprovedFromVeryBeginning && (
					<span>
						{ __(
							'Site Kit has placed AdSense code on your site to connect your site to AdSense and help you get the most out of ads. This means Google will automatically place ads for you in all the best places.',
							'google-site-kit'
						) }
					</span>
				) }
			</p>

			{ showProfile && <UserProfile /> }

			<UseSnippetSwitch
				label={ label }
				checkedMessage={ checkedMessage }
				uncheckedMessage={ uncheckedMessage }
				saveOnChange /* Save setting right when toggling. */
			/>

			<div className="googlesitekit-setup-module__action">
				<Button
					onClick={ continueHandler }
					disabled={ isDoingSubmitChanges }
				>
					{ __( 'Continue', 'google-site-kit' ) }
				</Button>
			</div>
		</Fragment>
	);
}
