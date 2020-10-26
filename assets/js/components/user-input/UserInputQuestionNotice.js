/**
 * User Input Question Notice.
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
import { sprintf, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME as CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { sanitizeHTML } from '../../util';
const { useSelect } = Data;

export default function UserInputQuestionNotice() {
	const settingsURL = useSelect( ( select ) => select( CORE_SITE ).getAdminURL( 'googlesitekit-settings' ) );

	const notice = sprintf(
		/* translators: %s: Settings page URL */
		__( 'You can always edit your answers after your submission in <a href="%s">Setting</a>.', 'google-site-kit' ),
		settingsURL,
	);

	const sanitizeArgs = {
		ALLOWED_TAGS: [ 'a' ],
		ALLOWED_ATTR: [ 'href' ],
	};

	return (
		<p
			className="googlesitekit-user-input__question-instructions--notice"
			dangerouslySetInnerHTML={ sanitizeHTML( notice, sanitizeArgs ) }
		/>
	);
}
