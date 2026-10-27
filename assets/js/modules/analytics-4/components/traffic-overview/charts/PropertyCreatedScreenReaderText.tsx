/**
 * Traffic Overview charts' screen reader text for the property's creation day.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
 * External dependencies
 */
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import VisuallyHidden from '@/js/components/VisuallyHidden';
import { formatDate } from '@/js/util';

export interface PropertyCreatedScreenReaderTextProps {
	/** The day the Analytics property was created, as `YYYY-MM-DD`. */
	date: string;
}

const PropertyCreatedScreenReaderText: FC<
	PropertyCreatedScreenReaderTextProps
> = ( { date } ) => {
	return (
		<VisuallyHidden>
			{ sprintf(
				/* translators: %s: the day the property was created, such as "January 15, 2025" */
				__(
					'Google Analytics property created on %s.',
					'google-site-kit'
				),
				formatDate( date, { month: 'long' } )
			) }
		</VisuallyHidden>
	);
};

export default PropertyCreatedScreenReaderText;
