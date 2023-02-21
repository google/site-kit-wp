/**
 * Setup Banner Footer component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { EDIT_SCOPE } from '../../../../analytics/datastore/constants';
import {
	MODULES_ANALYTICS_4,
	PROPERTY_CREATE,
} from '../../../datastore/constants';
import { VARIANT } from './constants';
const { useSelect } = Data;

export function SetupBannerFooter( { variant } ) {
	const items = useSelect( ( select ) => {
		const messages = [];
		const hasEditScope = select( CORE_USER ).hasScope( EDIT_SCOPE );
		const ga4PropertyID = select( MODULES_ANALYTICS_4 ).getPropertyID();
		const measurementID = select( MODULES_ANALYTICS_4 ).getMeasurementID();
		const existingTag = select( MODULES_ANALYTICS_4 ).getExistingTag();

		if ( variant === VARIANT.EXISTING_PROPERTY ) {
			if (
				hasEditScope === false &&
				( ga4PropertyID === PROPERTY_CREATE || ! measurementID )
			) {
				messages.push(
					__(
						'You will need to give Site Kit permission to create an Analytics property on your behalf',
						'google-site-kit'
					)
				);
			}

			messages.push(
				__(
					'You can always add/edit this in the Site Kit Settings',
					'google-site-kit'
				)
			);
		} else {
			if ( existingTag ) {
				messages.push(
					sprintf(
						/* translators: %s: The existing tag ID. */
						__(
							'A GA4 tag %s is found on this site but this property is not associated with your Google Analytics account',
							'google-site-kit'
						),
						existingTag
					)
				);
			}

			if ( hasEditScope === false ) {
				messages.push(
					__(
						'You will need to give Site Kit permission to create an Analytics property on your behalf',
						'google-site-kit'
					)
				);
			}

			messages.push(
				__(
					'You can always add/edit this in the Site Kit Settings',
					'google-site-kit'
				)
			);
		}

		return messages;
	} );

	return (
		!! items.length && (
			<ul className="googlesitekit-ga4-setup-banner__footer-text-list">
				{ items.map( ( message ) => (
					<li key={ message }>{ message }</li>
				) ) }
			</ul>
		)
	);
}
