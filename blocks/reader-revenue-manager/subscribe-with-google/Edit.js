/**
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { ExternalLink } from '@wordpress-core/components';
import { createInterpolateElement } from '@wordpress-core/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ButtonEdit } from '../common';
import { MODULES_READER_REVENUE_MANAGER } from '../../../assets/js/modules/reader-revenue-manager/datastore/constants';

/**
 * Contribute with Google Block Edit component.
 *
 * @since n.e.x.t
 *
 * @param {Object} props        Component props.
 * @param {Object} props.select Data store select function.
 * @return {Element} Element to render.
 */
export default function Edit( { select } ) {
	const publicationID = select(
		MODULES_READER_REVENUE_MANAGER
	).getPublicationID();

	const serviceURL = select( MODULES_READER_REVENUE_MANAGER ).getServiceURL( {
		path: 'reader-revenue-manager',
		query: {
			publication: publicationID,
		},
	} );

	return (
		<ButtonEdit
			buttonLabel={
				/* translators: Button label for Subscribe with Google. See: https://github.com/subscriptions-project/swg-js/blob/05af2d45cfcaf831a6b4d35c28f2c7b5c2e39308/src/i18n/swg-strings.ts#L24-L57 (please refer to the latest version of the file) */
				__( 'Subscribe with Google', 'google-site-kit' )
			}
			requiredPaymentOption="subscriptions"
			invalidPaymentOptionWithModuleAccessNotice={ createInterpolateElement(
				__(
					'You need to set up a paywall in Reader Revenue Manager to use this block. <a>Go to Reader Revenue Manager</a>',
					'google-site-kit'
				),
				{
					a: <ExternalLink href={ serviceURL } />,
				}
			) }
			invalidPaymentOptionWithoutModuleAccessNotice={ __(
				'You need to set up a paywall in Reader Revenue Manager to use this block. Contact your administrator.',
				'google-site-kit'
			) }
			noSnippetWithModuleAccessNotice={ createInterpolateElement(
				__(
					'This post does not include the Reader Revenue Manager snippet. Configure the snippet for this post in the post settings sidebar.',
					'google-site-kit'
				),
				{
					a: <ExternalLink href={ serviceURL } />,
				}
			) }
			noSnippetWithoutModuleAccessNotice={ __(
				'This post does not include the Reader Revenue Manager snippet. Contact your administrator',
				'google-site-kit'
			) }
		/>
	);
}
