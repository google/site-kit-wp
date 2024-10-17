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
import { useDispatch, useSelect } from 'googlesitekit-data';
import { MODULES_SIGN_IN_WITH_GOOGLE } from '../../datastore/constants';

export default function OneTapToggle() {
	const oneTapEnabled = useSelect( ( select ) =>
		select( MODULES_SIGN_IN_WITH_GOOGLE ).getOneTapEnabled()
	);
	const { setOneTapEnabled } = useDispatch( MODULES_SIGN_IN_WITH_GOOGLE );

	return (
		<div className="googlesitekit-settings-module__fields-group">
			<Switch
				label={ __( 'Enable One Tap sign in', 'google-site-kit' ) }
				checked={ oneTapEnabled }
				onClick={ () => setOneTapEnabled( ! oneTapEnabled ) }
				hideLabel={ false }
			/>
		</div>
	);
}
