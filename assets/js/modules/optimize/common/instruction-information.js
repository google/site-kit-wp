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
import { STORE_NAME } from '../datastore/constants';
import { STORE_NAME as analyticsStoreName } from '../../analytics/datastore/constants';
import { getModulesData } from '../../../util';

const { useSelect } = Data;

export default function InstructionInformation() {
	const analyticsUseSnippet = useSelect( ( select ) => select( analyticsStoreName ).getUseSnippet() );
	const optimizeID = useSelect( ( select ) => select( STORE_NAME ).getOptimizeID() );
	const { settings } = getModulesData().tagmanager;
	const gtmUseSnippet = settings.useSnippet;

	// If we don't use auto insert gtag, but use auto insert gtm. Show instruction of how to implement it on GTM.
	if ( ! analyticsUseSnippet && gtmUseSnippet ) {
		return (
			<Fragment>
				<p>{ __( 'You are using auto insert snippet with Tag Manager', 'google-site-kit' ) }</p>
				<p><a href="https://support.google.com/optimize/answer/6314801">{ __( 'Click here', 'google-site-kit' ) }</a> { __( 'for how to implement Optimize tag through your Tag Manager', 'google-site-kit' ) }</p>
			</Fragment>
		);
	}

	if ( ! analyticsUseSnippet ) {
		return (
			<Fragment>
				<p>{ __( 'You disabled analytics auto insert snippet. If You are using Google Analytics code snippet, add the code below:', 'google-site-kit' ) }</p>
				<pre>
					ga(&quot;require&quot;, &quot;{ optimizeID ? optimizeID : 'GTM-XXXXXXX' }&quot;);
				</pre>
				<p><a href="https://support.google.com/optimize/answer/6262084">{ __( 'Click here', 'google-site-kit' ) }</a> { __( 'for how to implement Optimize tag in Google Analytics Code Snippet', 'google-site-kit' ) }</p>
			</Fragment>
		);
	}
}
