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
import { Switch } from 'googlesitekit-components';
import Data from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';

const { useDispatch, useSelect } = Data;

export default function ConsentModeSwitch() {
	const consentMode = useSelect( ( select ) =>
		select( CORE_SITE ).getConsentModeSettings()
	);

	const isLoading = useSelect( ( select ) => {
		const {
			isResolving,
			hasFinishedResolution,
			isFetchingSaveConsentModeSettings,
		} = select( CORE_SITE );

		return (
			! hasFinishedResolution( 'getConsentModeSettings' ) ||
			isResolving( 'getConsentModeSettings' ) ||
			isFetchingSaveConsentModeSettings()
		);
	} );

	const { setConsentModeEnabled } = useDispatch( CORE_SITE );

	return (
		<div>
			<Switch
				label={ __( 'Enable consent mode', 'google-site-kit' ) }
				checked={ consentMode?.enabled }
				disabled={ isLoading }
				onClick={ () => {
					setConsentModeEnabled( ! consentMode?.enabled );
				} }
				hideLabel={ false }
			/>
			<p>
				Delay measurement until users grant consent.{ ' ' }
				<a href="#">Learn more</a>
			</p>
		</div>
	);
}
