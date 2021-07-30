/**
 * Analytics Anonymize IP Switch component.
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
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../../datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import Switch from '../../../../components/Switch';
import Link from '../../../../components/Link';

const { useSelect, useDispatch } = Data;

export default function AnonymizeIPSwitch() {
	const anonymizeIP = useSelect( ( select ) => select( STORE_NAME ).getAnonymizeIP() );
	const useSnippet = useSelect( ( select ) => select( STORE_NAME ).getUseSnippet() );
	const ampMode = useSelect( ( select ) => select( CORE_SITE ).getAMPMode() );
	const supportURL = useSelect( ( select ) => select( CORE_SITE ).getGoogleSupportURL( {
		path: '/analytics/answer/2763052',
	} ) );
	const { setAnonymizeIP } = useDispatch( STORE_NAME );
	const onChange = useCallback( () => {
		setAnonymizeIP( ! anonymizeIP );
	}, [ anonymizeIP, setAnonymizeIP ] );

	if ( ! useSnippet || ampMode === 'primary' || anonymizeIP === undefined ) {
		return null;
	}

	return (
		<div className="googlesitekit-analytics-anonymizeip">
			<Switch
				label={ __( 'Anonymize IP addresses', 'google-site-kit' ) }
				onClick={ onChange }
				checked={ anonymizeIP }
				hideLabel={ false }
			/>
			<p>
				{ anonymizeIP
					? __( 'IP addresses will be anonymized.', 'google-site-kit' )
					: __( 'IP addresses will not be anonymized.', 'google-site-kit' )
				}
				{ ' ' }
				<Link
					href={ supportURL }
					external
					inherit
					aria-label={ __( 'Learn more about IP anonymization.', 'google-site-kit' ) }
				>
					{ __( 'Learn more', 'google-site-kit' ) }
				</Link>
			</p>
		</div>
	);
}
