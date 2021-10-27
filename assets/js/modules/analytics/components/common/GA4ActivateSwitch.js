/**
 * Analytics Use Snippet Switch component.
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
import { __ } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import { FORM_SETUP } from '../../datastore/constants';
import Switch from '../../../../components/Switch';
import Link from '../../../../components/Link';
const { useSelect, useDispatch } = Data;

export default function GA4ActivateSwitch() {
	const enableGA4 = useSelect( ( select ) =>
		select( CORE_FORMS ).getValue( FORM_SETUP, 'enableGA4' )
	);

	const { setValues } = useDispatch( CORE_FORMS );
	const onChange = useCallback( () => {
		setValues( FORM_SETUP, { enableGA4: ! enableGA4 } );
	}, [ enableGA4, setValues ] );

	return (
		<div className="googlesitekit-settings-module__meta-item">
			<Switch
				label={ __(
					'Activate Google Analytics 4 and place code on your site.',
					'google-site-kit'
				) }
				checked={ enableGA4 }
				onClick={ onChange }
				hideLabel={ false }
			/>{ ' ' }
			<Link
				to="https://sitekit.withgoogle.com/documentation/ga4-analytics-property/"
				external
			>
				{ __( 'Learn more', 'google-site-kit' ) }
			</Link>
		</div>
	);
}
