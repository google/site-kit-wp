/**
 * AdSense Settings form.
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
import { __, sprintf } from '@wordpress/i18n';
import { Fragment, createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { ProgressBar } from 'googlesitekit-components';
import { MODULES_ADSENSE } from '../../datastore/constants';
import { parseAccountID } from '../../util/parsing';
import {
	ErrorNotices,
	UseSnippetSwitch,
	AutoAdExclusionSwitches,
} from '../common';
import WebStoriesAdUnitSelect from '../common/WebStoriesAdUnitSelect';
import Link from '../../../../components/Link';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import AdBlockingRecoverySetupCTANotice from './AdBlockingRecoverySetupCTANotice';
import AdBlockingRecoveryToggle from './AdBlockingRecoveryToggle';

export default function SettingsForm() {
	const webStoriesActive = useSelect( ( select ) =>
		select( CORE_SITE ).isWebStoriesActive()
	);
	const clientID = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getClientID()
	);
	const existingTag = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getExistingTag()
	);
	const hasResolvedGetExistingTag = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).hasFinishedResolution( 'getExistingTag' )
	);

	// This is called here to ensure that the progress bar is displayed while
	// the Ad Blocking Recovery existing tag is being resolved to prevent a
	// layout shift.
	useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getExistingAdBlockingRecoveryTag()
	);
	const hasResolvedGetExistingAdBlockingRecoveryTag = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).hasFinishedResolution(
			'getExistingAdBlockingRecoveryTag'
		)
	);

	if (
		! hasResolvedGetExistingTag ||
		! hasResolvedGetExistingAdBlockingRecoveryTag
	) {
		return <ProgressBar />;
	}

	let checkedMessage, uncheckedMessage;
	if ( existingTag && existingTag === clientID ) {
		// Existing tag with permission.
		checkedMessage = __(
			'You’ve already got an AdSense code on your site for this account, we recommend you use Site Kit to place code to get the most out of AdSense',
			'google-site-kit'
		);
		uncheckedMessage = checkedMessage;
	} else if ( existingTag ) {
		// Existing tag without permission.
		checkedMessage = sprintf(
			/* translators: %s: account ID */
			__(
				'Site Kit detected AdSense code for a different account %s on your site. For a better ads experience, you should remove AdSense code that’s not linked to this AdSense account.',
				'google-site-kit'
			),
			parseAccountID( existingTag )
		);
		uncheckedMessage = __(
			'Please note that AdSense will not show ads on your website unless you’ve already placed the code',
			'google-site-kit'
		);
	} else {
		// No existing tag.
		uncheckedMessage = __(
			'Please note that AdSense will not show ads on your website unless you’ve already placed the code',
			'google-site-kit'
		);
	}

	const supportURL =
		'https://support.google.com/adsense/answer/10175505#create-an-ad-unit-for-web-stories';

	return (
		<div className="googlesitekit-adsense-settings-fields">
			<ErrorNotices />

			<UseSnippetSwitch
				checkedMessage={ checkedMessage }
				uncheckedMessage={ uncheckedMessage }
			/>

			{ webStoriesActive && (
				<Fragment>
					<WebStoriesAdUnitSelect />
					<p>
						{ createInterpolateElement(
							__(
								'This ad unit will be used for your Web Stories. <LearnMoreLink />',
								'google-site-kit'
							),
							{
								LearnMoreLink: (
									<Link
										href={ supportURL }
										external
										aria-label={ __(
											'Learn more about Ad Sense Web Stories.',
											'google-site-kit'
										) }
									>
										{ __(
											'Learn more',
											'google-site-kit'
										) }
									</Link>
								),
							}
						) }
					</p>
				</Fragment>
			) }

			<AutoAdExclusionSwitches />

			<Fragment>
				<AdBlockingRecoverySetupCTANotice />
				<AdBlockingRecoveryToggle />
			</Fragment>
		</div>
	);
}
