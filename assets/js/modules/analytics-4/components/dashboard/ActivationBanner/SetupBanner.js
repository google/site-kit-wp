/**
 * SetupBanner component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import BannerNotification from '../../../../../components/notifications/BannerNotification';
import { Grid, Row, Cell } from '../../../../../material-components';
import ErrorNotice from '../../../../../components/ErrorNotice';
import { MODULES_ANALYTICS_4 } from '../../../datastore/constants';
const { useDispatch, useSelect } = Data;

export default function SetupBanner( { onCTAClick } ) {
	const [ errorNotice, setErrorNotice ] = useState( null );

	const ga4MeasurementID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getMeasurementID()
	);
	const existingTag = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getExistingTag()
	);

	const { submitChanges } = useDispatch( MODULES_ANALYTICS_4 );

	const handleSubmitChanges = useCallback( async () => {
		if ( ! ga4MeasurementID ) {
			const { error } = await submitChanges();

			if ( error ) {
				setErrorNotice( error );
				return;
			}
		}

		onCTAClick();
	}, [ ga4MeasurementID, onCTAClick, submitChanges ] );

	let title;
	let ctaLabel;
	let footer;

	if ( ga4MeasurementID ) {
		title = __(
			'Connect the Google Analytics 4 property that’s associated with your existing Universal Analytics property',
			'google-site-kit'
		);
		ctaLabel = __( 'Connect', 'google-site-kit' );
		footer = __(
			'You can always add/edit this in the Site Kit Settings.',
			'google-site-kit'
		);
	} else if ( existingTag ) {
		title = __(
			'No existing Google Analytics 4 property found, Site Kit will help you create a new one and insert it on your site',
			'google-site-kit'
		);
		ctaLabel = __( 'Create property', 'google-site-kit' );
		footer = sprintf(
			/* translators: %s: The existing tag ID. */
			__(
				'A GA4 tag %s is found on this site but this property is not associated with your Google Analytics account. You can always add/edit this in the Site Kit Settings.',
				'google-site-kit'
			),
			existingTag
		);
	} else {
		title = __(
			'No existing Google Analytics 4 property found, Site Kit will help you create a new one and insert it on your site',
			'google-site-kit'
		);
		ctaLabel = __( 'Create property', 'google-site-kit' );
		footer = __(
			'You can always add/edit this in the Site Kit Settings.',
			'google-site-kit'
		);
	}

	return (
		<Grid>
			<Row>
				<Cell lgSize={ 8 } mdSize={ 8 }>
					<BannerNotification
						id="ga4-activation-banner"
						className="googlesitekit-ga4-setup-banner"
						title={ title }
						ctaLabel={ ctaLabel }
						onCTAClick={ handleSubmitChanges }
						footer={ <p>{ footer }</p> }
						dismiss={ __( 'Cancel', 'google-site-kit' ) }
					>
						{ errorNotice && <ErrorNotice error={ errorNotice } /> }
					</BannerNotification>
				</Cell>
			</Row>
		</Grid>
	);
}
