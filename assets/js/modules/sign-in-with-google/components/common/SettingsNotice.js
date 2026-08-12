/**
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { MODULES_SIGN_IN_WITH_GOOGLE } from '@/js/modules/sign-in-with-google/datastore/constants';
import AnyoneCanRegisterDisabledNotice from './AnyoneCanRegisterDisabledNotice';
import RegistrationDisabledNotice from './RegistrationDisabledNotice';

export default function SettingsNotice() {
	const anyoneCanRegister = useSelect( ( select ) =>
		select( CORE_SITE ).getAnyoneCanRegister()
	);
	const anyoneCanRegisterWooCommerce = useSelect( ( select ) =>
		select( CORE_SITE ).getAnyoneCanRegisterWooCommerce()
	);
	const oneTapEnabled = useSelect( ( select ) =>
		select( MODULES_SIGN_IN_WITH_GOOGLE ).getOneTapEnabled()
	);

	// Registration is closed everywhere only when neither WordPress nor
	// WooCommerce (if active) allows new accounts to be created. When
	// WooCommerce already has registration open, neither notice below is
	// relevant: AnyoneCanRegisterReadOnly already communicates that new
	// accounts can be created via WooCommerce.
	const registrationClosedEverywhere =
		anyoneCanRegister === false && ! anyoneCanRegisterWooCommerce;

	const shouldShowRegistrationDisabledNotice =
		oneTapEnabled && registrationClosedEverywhere;

	return (
		<Fragment>
			{ registrationClosedEverywhere &&
				! shouldShowRegistrationDisabledNotice && (
					<AnyoneCanRegisterDisabledNotice />
				) }
			{ shouldShowRegistrationDisabledNotice && (
				<RegistrationDisabledNotice />
			) }
		</Fragment>
	);
}
