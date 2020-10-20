/**
 * AdSense Settings form.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../../datastore/constants';
import { parseAccountID } from '../../util/parsing';
import {
	ErrorNotices,
	UseSnippetSwitch,
} from '../common';
const { useSelect } = Data;

export default function SettingsForm() {
	const clientID = useSelect( ( select ) => select( STORE_NAME ).getClientID() );
	const existingTag = useSelect( ( select ) => select( STORE_NAME ).getExistingTag() );

	let checkedMessage, uncheckedMessage;
	if ( existingTag && existingTag === clientID ) {
		// Existing tag with permission.
		checkedMessage = __( 'You’ve already got an AdSense code on your site for this account, we recommend you use Site Kit to place code to get the most out of AdSense.', 'google-site-kit' );
		uncheckedMessage = checkedMessage;
	} else if ( existingTag ) {
		// Existing tag without permission.
		checkedMessage = sprintf(
			/* translators: %s: account ID */
			__( 'Site Kit detected AdSense code for a different account %s on your site. For a better ads experience, you should remove AdSense code that’s not linked to this AdSense account.', 'google-site-kit' ),
			parseAccountID( existingTag )
		);
		uncheckedMessage = __( 'By not placing the code, AdSense will not show ads on your website unless you’ve already got some AdSense code.', 'google-site-kit' );
	} else {
		// No existing tag.
		uncheckedMessage = __( 'By not placing the code, AdSense will not show ads on your website unless you’ve already got some AdSense code.', 'google-site-kit' );
	}

	return (
		<div className="googlesitekit-adsense-settings-fields">
			<ErrorNotices />

			<UseSnippetSwitch
				checkedMessage={ checkedMessage }
				uncheckedMessage={ uncheckedMessage }
			/>
		</div>
	);
}
