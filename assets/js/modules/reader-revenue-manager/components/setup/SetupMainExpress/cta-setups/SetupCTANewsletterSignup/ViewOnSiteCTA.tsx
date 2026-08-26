/**
 * Reader Revenue Manager newsletter signup "View on your site" CTA.
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
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import { type Select, useSelect } from 'googlesitekit-data';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';
import ExternalIcon from '@/svg/icons/external.svg';
import useHasPreExistingCTAs from './useHasPreExistingCTAs';

const ViewOnSiteCTA: FC = () => {
	const hasPreExistingCTAs = useHasPreExistingCTAs();
	const viewOnSiteURL = useSelect(
		( select: Select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).getViewOnSiteURL(),
		[]
	);

	const onClick = useCallback( () => {
		global.open( viewOnSiteURL, '_blank' );
	}, [ viewOnSiteURL ] );

	// When the publication already had CTAs, the new form is displayed last,
	// so there is nothing useful to preview.
	if ( hasPreExistingCTAs !== false || ! viewOnSiteURL ) {
		return null;
	}

	return (
		// @ts-expect-error `Button` component is not yet typed.
		<Button
			className="googlesitekit-rrm-express-setup-complete__view-on-site-cta"
			onClick={ onClick }
			trailingIcon={ <ExternalIcon width="15" height="15" /> }
			tertiary
		>
			{ __( 'View on your site', 'google-site-kit' ) }
		</Button>
	);
};

export default ViewOnSiteCTA;
