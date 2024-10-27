/**
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_LOCATION } from '../../../datastore/location/constants';
import Dismiss from './Dismiss';
import CTALink from './CTALink';

export default function ActionsCTALinkDismiss( {
	id,
	className = 'googlesitekit-publisher-win__actions',
	ctaLink,
	ctaLabel,
	dismissLabel = __( 'OK, Got it!', 'google-site-kit' ),
	dismissExpires = 0,
} ) {
	const isNavigatingToCTALink = useSelect( ( select ) => {
		return ctaLink
			? select( CORE_LOCATION ).isNavigatingTo( ctaLink )
			: false;
	} );

	return (
		<div className={ className }>
			<CTALink
				id={ id }
				ctaLink={ ctaLink }
				ctaLabel={ ctaLabel }
				dismissExpires={ dismissExpires }
			/>

			<Dismiss
				id={ id }
				primary={ false }
				dismissLabel={ dismissLabel }
				dismissExpires={ dismissExpires }
				disabled={ isNavigatingToCTALink }
			/>
		</div>
	);
}
