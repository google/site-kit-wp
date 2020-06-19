/**
 * InstructionInformation component.
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
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { sanitizeHTML } from '../../../util/sanitize';
import { STORE_NAME } from '../datastore/constants';
import { STORE_NAME as MODULE_ANALYTICS } from '../../analytics/datastore/constants';
import { STORE_NAME as CORE_MODULE } from '../../../googlesitekit/modules/datastore/constants';
import { getModulesData } from '../../../util';

const { useSelect } = Data;

export default function InstructionInformation() {
	const optimizeID = useSelect( ( select ) => select( STORE_NAME ).getOptimizeID() );
	const analyticsActive = useSelect( ( select ) => select( CORE_MODULE ).isModuleActive( 'analytics' ) );
	const analyticsUseSnippet = useSelect( ( select ) => select( MODULE_ANALYTICS ).getUseSnippet() );
	const gtmActive = useSelect( ( select ) => select( CORE_MODULE ).isModuleActive( 'tagmanager' ) );
	// TO DO: To be removed once tag manager store is merged
	const { settings } = getModulesData().tagmanager;
	const gtmUseSnippet = settings.useSnippet;

	if ( ! analyticsActive ) {
		return null;
	}

	// If we don't use auto insert gtag, but use auto insert gtm. Show instruction of how to implement it on GTM.
	if ( ! analyticsUseSnippet && gtmActive && gtmUseSnippet ) {
		return (
			<Fragment>
				<p>{ __( 'You are using auto insert snippet with Tag Manager', 'google-site-kit' ) }</p>
				<p
					dangerouslySetInnerHTML={ sanitizeHTML(
						__( '<a href="https://support.google.com/optimize/answer/6314801">Click here for how to implement Optimize tag through your Tag Manager</a>', 'google-site-kit' ),
						{
							ALLOWED_TAGS: [ 'a' ],
							ALLOWED_ATTR: [ 'href' ],
						}
					) }
				/>
			</Fragment>
		);
	}

	if ( ! analyticsUseSnippet ) {
		return (
			<Fragment>
				<p>{ __( 'You disabled analytics auto insert snippet. If You are using Google Analytics code snippet, add the code below:', 'google-site-kit' ) }</p>
				<pre>
					{ /* eslint-disable-next-line react/no-unescaped-entities */ }
					ga( 'require', `{ optimizeID ? optimizeID : 'GTM-XXXXXXX' }` );
				</pre>
				<p
					dangerouslySetInnerHTML={ sanitizeHTML(
						__( '<a href="https://support.google.com/optimize/answer/6262084">Click here for how to implement Optimize tag in Google Analytics Code Snippet</a>', 'google-site-kit' ),
						{
							ALLOWED_TAGS: [ 'a' ],
							ALLOWED_ATTR: [ 'href' ],
						}
					) }
				/>
			</Fragment>
		);
	}

	return null;
}
