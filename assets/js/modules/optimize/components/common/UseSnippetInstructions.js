/**
 * UseSnippetInstructions component.
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
import { Fragment } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { sanitizeHTML } from '../../../../util/sanitize';
import { MODULES_OPTIMIZE } from '../../datastore/constants';
import { MODULES_ANALYTICS } from '../../../analytics/datastore/constants';
import { MODULES_TAGMANAGER } from '../../../tagmanager/datastore/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';

const { useSelect } = Data;

export default function UseSnippetInstructions() {
	const optimizeID = useSelect( ( select ) =>
		select( MODULES_OPTIMIZE ).getOptimizeID()
	);
	const analyticsActive = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleActive( 'analytics' )
	);
	const analyticsUseSnippet = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getUseSnippet()
	);
	const isTagManagerAvailable = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleAvailable( 'tagmanager' )
	);
	const gtmActive = useSelect(
		( select ) =>
			isTagManagerAvailable &&
			select( CORE_MODULES ).isModuleActive( 'tagmanager' )
	);
	const gtmUseSnippet = useSelect(
		( select ) =>
			isTagManagerAvailable &&
			select( MODULES_TAGMANAGER ).getUseSnippet()
	);
	const settingsURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-settings' )
	);
	const supportURLAutoInsert = useSelect( ( select ) =>
		select( CORE_SITE ).getGoogleSupportURL( {
			path: '/optimize/answer/6314801',
		} )
	);
	const supportURLDisabledAutoInsert = useSelect( ( select ) =>
		select( CORE_SITE ).getGoogleSupportURL( {
			path: '/optimize/answer/6262084',
		} )
	);

	if ( ! analyticsActive ) {
		return (
			<Fragment>
				<p>
					{ __(
						'Google Analytics must be active to use Optimize',
						'google-site-kit'
					) }
				</p>
				<p
					dangerouslySetInnerHTML={ sanitizeHTML(
						sprintf(
							/* translators: %s: Analytics connect URL in Site Kit */
							__(
								'<a href="%s">Click here</a> to connect Google Analytics',
								'google-site-kit'
							),
							`${ settingsURL }#connect`
						),
						{
							ALLOWED_TAGS: [ 'a' ],
							ALLOWED_ATTR: [ 'href' ],
						}
					) }
				/>
			</Fragment>
		);
	}

	// If we don't use auto insert gtag, but use auto insert gtm. Show instruction of how to implement it on GTM.
	if ( false === analyticsUseSnippet && gtmActive && gtmUseSnippet ) {
		return (
			<Fragment>
				<p>
					{ __(
						'You are using auto insert snippet with Tag Manager',
						'google-site-kit'
					) }
				</p>
				<p
					dangerouslySetInnerHTML={ sanitizeHTML(
						sprintf(
							/* translators: %s: external URL with instructions */
							__(
								'<a href="%s">Click here</a> for how to implement Optimize tag through your Tag Manager',
								'google-site-kit'
							),
							supportURLAutoInsert
						),
						{
							ALLOWED_TAGS: [ 'a' ],
							ALLOWED_ATTR: [ 'href' ],
						}
					) }
				/>
			</Fragment>
		);
	}

	if ( false === analyticsUseSnippet ) {
		return (
			<Fragment>
				<p>
					{ __(
						'You disabled Analytics auto insert snippet. If you are using Google Analytics code snippet, add the code below:',
						'google-site-kit'
					) }
				</p>
				<pre>
					ga(&quot;require&quot;, &quot;
					{ optimizeID ? optimizeID : 'GTM-XXXXXXX' }&quot;);
				</pre>
				<p
					dangerouslySetInnerHTML={ sanitizeHTML(
						sprintf(
							/* translators: %s: external URL with instructions */
							__(
								'<a href="%s">Click here</a> for how to implement Optimize tag in Google Analytics Code Snippet',
								'google-site-kit'
							),
							supportURLDisabledAutoInsert
						),
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
