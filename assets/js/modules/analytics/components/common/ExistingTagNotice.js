/**
 * Analytics Existing Tag Notice component.
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
import { sprintf, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_ANALYTICS } from '../../datastore/constants';
import { useFeature } from '../../../../hooks/useFeature';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
const { useSelect } = Data;

export default function ExistingTagNotice() {
	// should use this for returning null?
	// const hasExistingTag = useSelect( ( select ) => select( STORE_NAME ).hasExistingTag() );

	const ga4setupEnabled = useFeature( 'ga4setup' );

	const uaexistingTag = useSelect( ( select ) => select( MODULES_ANALYTICS ).getExistingTag() );
	const ga4existingTag = useSelect( ( select ) => select( MODULES_ANALYTICS_4 ).getExistingTag() );

	const uaPropertyID = useSelect( ( select ) => select( MODULES_ANALYTICS ).getPropertyID() );
	const ga4PropertyID = useSelect( ( select ) => select( MODULES_ANALYTICS_4 ).getPropertyID() );

	// not sure if this rule is even needed!
	if ( ! uaexistingTag && ! ga4existingTag ) {
		return null;
	}

	if ( ! ga4setupEnabled ) {
		return (
			<p>
				{
					sprintf(
					/* translators: %s: Analytics tag ID */
						__( 'An existing Analytics tag was found on your site with the ID %s. If later on you decide to replace this tag, Site Kit can place the new tag for you. Make sure you remove the old tag first.', 'google-site-kit' ),
						uaexistingTag
					)
				}
			</p>
		);
	}

	if ( ! ga4existingTag && uaexistingTag ) {
		if ( uaexistingTag === uaPropertyID ) {
			return (
				<p>
					{
						sprintf(
						/* translators: %s: Analytics tag ID */
							__( 'An existing Universal Analytics tag was found on your site with the ID %s. Since this tag refers to the same property you have selected here, Site Kit will not place its own tag and rely on the existing one. If later on you decide to remove this tag, Site Kit can place a new tag for you.', 'google-site-kit' ),
							uaexistingTag
						)
					}
				</p>
			);
		}
		return (
			<p>
				{
					sprintf(
					/* translators: %s: Analytics tag ID */
						__( 'An existing Universal Analytics tag was found on your site with the ID %s.', 'google-site-kit' ),
						uaexistingTag
					)
				}
			</p>
		);
	}

	if ( ga4existingTag && ! uaexistingTag ) {
		if ( ga4existingTag === ga4PropertyID ) {
			return (
				<p>
					{
						sprintf(
						/* translators: %s: Analytics tag ID */
							__( 'An existing Google Analytics 4 tag was found on your site with the ID G-%s. Since this tag refers to the same property you have selected here, Site Kit will not place its own tag and rely on the existing one. If later on you decide to remove this tag, Site Kit can place a new tag for you.', 'google-site-kit' ),
							ga4existingTag
						)
					}
				</p>
			);
		}
		return (
			<p>
				{
					sprintf(
					/* translators: %s: Analytics tag ID */
						__( 'An existing Google Analytics 4 tag was found on your site with the ID G-%s.', 'google-site-kit' ),
						ga4existingTag
					)
				}
			</p>
		);
	}

	return (
		<div>
			<p>uaexistingTag: { uaexistingTag }</p>
			<p>uaPropertyID: { uaPropertyID }</p>
			<p>ga4existingTag: { ga4existingTag }</p>
			<p>ga4PropertyID: { ga4PropertyID }</p>
		</div>
	);
}
