/**
 * CompatibilityErrorNotice component.
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

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { sanitizeHTML } from '../../../util/sanitize';
import Link from '../../Link';
const { useSelect } = Data;
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import {
	ERROR_AMP_CDN_RESTRICTED,
	ERROR_API_UNAVAILABLE,
	ERROR_FETCH_FAIL,
	ERROR_GOOGLE_API_CONNECTION_FAIL,
	ERROR_INVALID_HOSTNAME,
	ERROR_TOKEN_MISMATCH,
	ERROR_WP_PRE_V5,
} from './constants';

const helperCTA = ( developerPlugin ) => {
	const { installed, active, installURL, activateURL, configureURL } = developerPlugin;

	if ( ! installed && installURL ) {
		return {
			'aria-label': __( 'Install the helper plugin', 'google-site-kit' ),
			children: __( 'Install', 'google-site-kit' ),
			href: installURL,
			external: false,
		};
	}
	if ( installed && ! active && activateURL ) {
		return {
			'aria-label': __( 'Activate the helper plugin', 'google-site-kit' ),
			children: __( 'Activate', 'google-site-kit' ),
			href: activateURL,
			external: false,
		};
	}
	if ( installed && active && configureURL ) {
		return {
			'aria-label': __( 'Configure the helper plugin', 'google-site-kit' ),
			children: __( 'Configure', 'google-site-kit' ),
			href: configureURL,
			external: false,
		};
	}
	return {
		'aria-label': __( 'Learn how to install and use the helper plugin', 'google-site-kit' ),
		children: __( 'Learn how', 'google-site-kit' ),
		href: 'https://sitekit.withgoogle.com/documentation/using-site-kit-on-a-staging-environment/',
		external: true,
	};
};

export default function CompatibilityErrorNotice( { error } ) {
	const developerPlugin = useSelect( ( select ) => select( CORE_SITE ).getDeveloperPluginState() ) || {};
	const { installed } = developerPlugin;

	switch ( error ) {
		case ERROR_API_UNAVAILABLE:
			return (
				<p>
					{ __( 'Site Kit cannot access the WordPress REST API. Please ensure it is enabled on your site.', 'google-site-kit' ) }
				</p>
			);
		case ERROR_INVALID_HOSTNAME:
		case ERROR_FETCH_FAIL:
			return (
				<p>
					{ ! installed && <span>{ __( 'Looks like this may be a staging environment. If so, you’ll need to install a helper plugin and verify your production site in Search Console.', 'google-site-kit' ) }</span> }
					{ installed && <span>{ __( 'Looks like this may be a staging environment and you already have the helper plugin. Before you can use Site Kit, please make sure you’ve provided the necessary credentials in the Authentication section and verified your production site in Search Console.', 'google-site-kit' ) }</span> }
					{ ' ' }
					<Link
						{ ...helperCTA( developerPlugin ) }
						inherit
					/>
				</p>
			);
		case ERROR_TOKEN_MISMATCH:
			return (
				<p>
					{ __( 'Looks like you may be using a caching plugin which could interfere with setup. Please deactivate any caching plugins before setting up Site Kit. You may reactivate them once setup has been completed.', 'google-site-kit' ) }
				</p>
			);
		case ERROR_GOOGLE_API_CONNECTION_FAIL:
			return (
				<p dangerouslySetInnerHTML={ sanitizeHTML(
					`
						${ __( 'Looks like your site is having a technical issue with requesting data from Google services.', 'google-site-kit' ) }
						<br/>
						${ sprintf(
						/* translators: %1$s: Support Forum URL, %2$s: Error message */ // eslint-disable-line indent
						__( 'To get more help, ask a question on our <a href="%1$s">support forum</a> and include the text of the original error message: %2$s', 'google-site-kit' ), // eslint-disable-line indent
						'https://wordpress.org/support/plugin/google-site-kit/', // eslint-disable-line indent
						`<br/>${ error }` // eslint-disable-line indent
					) /* eslint-disable-line indent */ }
						`,
					{
						ALLOWED_TAGS: [ 'a', 'br' ],
						ALLOWED_ATTR: [ 'href' ],
					}
				) } />
			);
		case ERROR_AMP_CDN_RESTRICTED:
			return (
				<p dangerouslySetInnerHTML={ sanitizeHTML(
					`
						${ __( 'Looks like the AMP CDN is restricted in your region, which could interfere with setup on the Site Kit service.', 'google-site-kit' ) }
						<br/>
						${ sprintf(
						/* translators: %1$s: Support Forum URL, %2$s: Error message */ // eslint-disable-line indent
						__( 'To get more help, ask a question on our <a href="%1$s">support forum</a> and include the text of the original error message: %2$s', 'google-site-kit' ), // eslint-disable-line indent
						'https://wordpress.org/support/plugin/google-site-kit/', // eslint-disable-line indent
						`<br/>${ error }` // eslint-disable-line indent
					) /* eslint-disable-line indent */ }
						`,
					{
						ALLOWED_TAGS: [ 'a', 'br' ],
						ALLOWED_ATTR: [ 'href' ],
					}
				) } />
			);
		case ERROR_WP_PRE_V5:
			return (
				<p>
					{ __( 'Looks like you’re using a version of WordPress that’s older than 5.0. You can still install and use Site Kit, but some of its features might not work (for example translations).', 'google-site-kit' ) }
				</p>
			);
	}
}
