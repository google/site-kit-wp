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
import { useBlockProps, InspectorControls } from '@wordpress-core/block-editor';
import { ExternalLink, Notice } from '@wordpress-core/components';
import { createInterpolateElement, Fragment } from '@wordpress-core/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { EditorButton } from '../common';
import { CORE_EDITOR } from '../common/constants';
import { CORE_MODULES } from '../../../assets/js/googlesitekit/modules/datastore/constants';
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
	const blockProps = useBlockProps();

	const hasModuleAccess = select( CORE_MODULES ).hasModuleOwnershipOrAccess(
		'reader-revenue-manager'
	);

	const settings = select( MODULES_READER_REVENUE_MANAGER ).getSettings();

	const { publicationID, paymentOption, snippetMode, postTypes } = settings;

	const serviceURL = select( MODULES_READER_REVENUE_MANAGER ).getServiceURL( {
		path: 'reader-revenue-manager',
		query: {
			publication: publicationID,
		},
	} );

	const metaKey = `googlesitekit_rrm_${ publicationID }:productID`;

	const postProductID =
		select( CORE_EDITOR ).getEditedPostAttribute( 'meta' )?.[ metaKey ] ||
		'';
	const postType = select( CORE_EDITOR ).getCurrentPostType();

	let notice = '';
	let disabled = false;

	if ( paymentOption !== 'subscriptions' ) {
		disabled = true;

		if ( hasModuleAccess ) {
			notice = createInterpolateElement(
				__(
					'You need to set up a paywall in Reader Revenue Manager to use this block. <a>Go to Reader Revenue Manager</a>',
					'google-site-kit'
				),
				{
					a: <ExternalLink href={ serviceURL } />,
				}
			);
		} else {
			notice = __(
				'You need to set up a paywall in Reader Revenue Manager to use this block. Contact your administrator.',
				'google-site-kit'
			);
		}
	} else if (
		postProductID === 'none' ||
		( ! postProductID && snippetMode === 'per_post' ) ||
		( ! postProductID &&
			snippetMode === 'post_types' &&
			! postTypes.includes( postType ) )
	) {
		disabled = true;

		if ( hasModuleAccess ) {
			notice = createInterpolateElement(
				__(
					'This post does not include the Reader Revenue Manager snippet. Configure the snippet for this post in the post settings sidebar.',
					'google-site-kit'
				),
				{
					a: <ExternalLink href={ serviceURL } />,
				}
			);
		} else {
			notice = __(
				'This post does not include the Reader Revenue Manager snippet. Contact your administrator',
				'google-site-kit'
			);
		}
	}

	return (
		<Fragment>
			{ notice && (
				<InspectorControls>
					<div className="block-editor-block-card">
						<Notice status="warning" isDismissible={ false }>
							{ notice }
						</Notice>
					</div>
				</InspectorControls>
			) }
			<div { ...blockProps }>
				<div className="googlesitekit-blocks-reader-revenue-manager">
					<EditorButton disabled={ disabled }>
						{
							/* translators: Button label for Subscribe with Google. See: https://github.com/subscriptions-project/swg-js/blob/05af2d45cfcaf831a6b4d35c28f2c7b5c2e39308/src/i18n/swg-strings.ts#L24-L57 (please refer to the latest version of the file) */
							__( 'Subscribe with Google', 'google-site-kit' )
						}
					</EditorButton>
				</div>
			</div>
		</Fragment>
	);
}
