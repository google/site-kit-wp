/**
 * AdSense Setup UseSnippet Switch Component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_ADSENSE } from '../../datastore/constants';
import { parseAccountID } from '../../util/parsing';
import { UseSnippetSwitch } from '../common';
const { useSelect, useDispatch } = Data;

export default function SetupUseSnippetSwitch() {
	const originalUseSnippet = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getOriginalUseSnippet()
	);
	const existingTag = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getExistingTag()
	);
	const clientID = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getClientID()
	);

	const { setUseSnippet, saveSettings } = useDispatch( MODULES_ADSENSE );

	const hasExistingTag = Boolean( existingTag );
	useEffect( () => {
		if ( hasExistingTag ) {
			setUseSnippet( false );
			saveSettings();
		}
	}, [ hasExistingTag, saveSettings, setUseSnippet ] );

	if (
		( originalUseSnippet && ! existingTag ) ||
		undefined === existingTag ||
		undefined === originalUseSnippet
	) {
		return null;
	}

	let checkedMessage, uncheckedMessage;
	const checkedMessageExtra = __(
		'Make sure to remove the existing AdSense code to avoid conflicts with the code placed by Site Kit.',
		'google-site-kit'
	);
	if ( existingTag === clientID ) {
		// Existing tag with permission.
		uncheckedMessage = __(
			'You’ve already got an AdSense code on your site for this account. We recommend you use Site Kit to place the code to get the most out of AdSense.',
			'google-site-kit'
		);
		checkedMessage = `${ uncheckedMessage } ${ checkedMessageExtra }`;
	} else if ( existingTag ) {
		// Existing tag without permission.
		uncheckedMessage = sprintf(
			/* translators: 1: existing account ID, 2: current account ID */
			__(
				'Site Kit detected AdSense code for a different account %1$s on your site. In order to configure AdSense for your current account %2$s, we recommend you use Site Kit to place the code instead.',
				'google-site-kit'
			),
			parseAccountID( existingTag ),
			parseAccountID( clientID )
		);
		checkedMessage = `${ uncheckedMessage } ${ checkedMessageExtra }`;
	} else {
		// No existing tag.
		checkedMessage = checkedMessageExtra;
	}

	return (
		<UseSnippetSwitch
			checkedMessage={ checkedMessage }
			uncheckedMessage={ uncheckedMessage }
			saveOnChange
		/>
	);
}
