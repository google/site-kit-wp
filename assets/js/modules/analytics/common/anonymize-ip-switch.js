/**
 * Analytics Anonymize IP Switch component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { __ } from '@wordpress/i18n';
import {
	useSelect as useSelectHook,
	useDispatch as useDispatchHook,
} from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import PropTypes from 'prop-types';
import Switch from 'GoogleComponents/switch';
import Link from 'GoogleComponents/link';

const STORE_NAME = 'modules/analytics'; // temp

export default function AnonymizeIPSwitch( { useSelect, useDispatch } ) {
	const anonymizeIP = useSelect( ( select ) => select( STORE_NAME ).getAnonymizeIP() );

	const { setAnonymizeIP } = useDispatch( STORE_NAME );
	const onChange = useCallback( () => {
		setAnonymizeIP( ! anonymizeIP );
	}, [ anonymizeIP ] );

	return (
		<div className="googlesitekit-analytics-anonymizeip">
			<Switch
				id="anonymizeIP"
				label={ __( 'Anonymize IP addresses', 'google-site-kit' ) }
				// eslint-disable-next-line no-console
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
					href="https://support.google.com/analytics/answer/2763052"
					external
					inherit
					dangerouslySetInnerHTML={
						{
							__html: __( 'Learn more<span class="screen-reader-text"> about IP anonymization.</span>', 'google-site-kit' ),
						}
					} />
			</p>
		</div>
	);
}

AnonymizeIPSwitch.propTypes = {
	useSelect: PropTypes.func,
	useDispatch: PropTypes.func,
};

AnonymizeIPSwitch.defaultProps = {
	useSelect: useSelectHook,
	useDispatch: useDispatchHook,
};
