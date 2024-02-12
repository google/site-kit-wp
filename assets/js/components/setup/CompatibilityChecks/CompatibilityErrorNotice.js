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
import { createInterpolateElement } from '@wordpress/element';
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
	ERROR_SK_SERVICE_CONNECTION_FAIL,
} from './constants';
import GetHelpLink from './GetHelpLink';

const helperCTA = ( developerPlugin, stagingDocumentationURL ) => {
	const { installed, active, installURL, activateURL, configureURL } =
		developerPlugin;

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
			'aria-label': __(
				'Configure the helper plugin',
				'google-site-kit'
			),
			children: __( 'Configure', 'google-site-kit' ),
			href: configureURL,
			external: false,
		};
	}
	return {
		'aria-label': __(
			'Learn how to install and use the helper plugin',
			'google-site-kit'
		),
		children: __( 'Learn how', 'google-site-kit' ),
		href: stagingDocumentationURL,
		external: true,
	};
};

export default function CompatibilityErrorNotice( { error } ) {
	const developerPlugin =
		useSelect( ( select ) =>
			select( CORE_SITE ).getDeveloperPluginState()
		) || {};
	const { installed } = developerPlugin;

	const documentationURL = useSelect( ( select ) => {
		return select( CORE_SITE ).getDocumentationLinkURL( 'staging' );
	} );
	const googleAPIConnectionFailHelpURL = useSelect( ( select ) =>
		select( CORE_SITE ).getErrorTroubleshootingLinkURL( {
			code: ERROR_GOOGLE_API_CONNECTION_FAIL,
		} )
	);

	switch ( error ) {
		case ERROR_API_UNAVAILABLE:
			return (
				<p>
					{ createInterpolateElement(
						__(
							'Site Kit cannot access the WordPress REST API. Please ensure it is enabled on your site. <GetHelpLink />',
							'google-site-kit'
						),
						{
							GetHelpLink: <GetHelpLink errorCode={ error } />,
						}
					) }
				</p>
			);
		case ERROR_INVALID_HOSTNAME:
		case ERROR_FETCH_FAIL:
			return (
				<p>
					{ ! installed && (
						<span>
							{ createInterpolateElement(
								__(
									'Looks like this may be a staging environment. If so, you’ll need to install a helper plugin and verify your production site in Search Console. <GetHelpLink />',
									'google-site-kit'
								),
								{
									GetHelpLink: (
										<Link
											{ ...helperCTA(
												developerPlugin,
												documentationURL
											) }
										/>
									),
								}
							) }
						</span>
					) }
					{ installed && (
						<span>
							{ createInterpolateElement(
								__(
									'Looks like this may be a staging environment and you already have the helper plugin. Before you can use Site Kit, please make sure you’ve provided the necessary credentials in the Authentication section and verified your production site in Search Console. <GetHelpLink />',
									'google-site-kit'
								),
								{
									GetHelpLink: (
										<Link
											{ ...helperCTA(
												developerPlugin,
												documentationURL
											) }
										/>
									),
								}
							) }
						</span>
					) }
				</p>
			);
		case ERROR_TOKEN_MISMATCH:
			return (
				<p>
					{ createInterpolateElement(
						__(
							'Looks like Site Kit is unable to place or detect tags on your site. This can be caused by using certain caching or maintenance mode plugins or your site’s frontend is configured on a different host or infrastructure than your administration dashboard. <GetHelpLink />',
							'google-site-kit'
						),
						{ GetHelpLink: <GetHelpLink errorCode={ error } /> }
					) }
				</p>
			);
		case ERROR_GOOGLE_API_CONNECTION_FAIL:
			return (
				<p
					dangerouslySetInnerHTML={ sanitizeHTML(
						`
						${ __(
							'Looks like your site is having a technical issue with requesting data from Google services.',
							'google-site-kit'
						) }
						<br/>
						${ sprintf(
							/* translators: 1: Help URL, 2: Support Forum URL, 3: Error message */
							__(
								'<a href="%1$s">Click here</a> for more information, or to get more help, ask a question on our <a href="%2$s">support forum</a> and include the text of the original error message: %3$s',
								'google-site-kit'
							),
							googleAPIConnectionFailHelpURL,
							'https://wordpress.org/support/plugin/google-site-kit/',
							`<br/>${ error }`
						) }
						`,
						{
							ALLOWED_TAGS: [ 'a', 'br' ],
							ALLOWED_ATTR: [ 'href' ],
						}
					) }
				/>
			);
		case ERROR_AMP_CDN_RESTRICTED:
			return (
				<p>
					{ createInterpolateElement(
						__(
							'Looks like the AMP CDN is restricted in your region, which could interfere with setup on the Site Kit service. <GetHelpLink />',
							'google-site-kit'
						),
						{
							GetHelpLink: <GetHelpLink errorCode={ error } />,
						}
					) }
				</p>
			);
		case ERROR_SK_SERVICE_CONNECTION_FAIL:
			return (
				<p
					dangerouslySetInnerHTML={ sanitizeHTML(
						`
						${ __(
							'Looks like your site is having a technical issue with connecting to the Site Kit authentication service.',
							'google-site-kit'
						) }
						<br/>
						${
							sprintf(
								/* translators: 1: Support Forum URL, 2: Error message */ // eslint-disable-line indent
								__(
									'To get more help, ask a question on our <a href="%1$s">support forum</a> and include the text of the original error message: %2$s',
									'google-site-kit'
								), // eslint-disable-line indent
								'https://wordpress.org/support/plugin/google-site-kit/', // eslint-disable-line indent
								`<br/>${ error }` // eslint-disable-line indent
							) /* eslint-disable-line indent */
						}
						`,
						{
							ALLOWED_TAGS: [ 'a', 'br' ],
							ALLOWED_ATTR: [ 'href' ],
						}
					) }
				/>
			);
	}
}
