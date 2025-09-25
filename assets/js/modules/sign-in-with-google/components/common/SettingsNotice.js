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
import RegistrationDisabledNotice from './RegistrationDisabledNotice';
import AnyoneCanRegisterDisabledNotice from './AnyoneCanRegisterDisabledNotice';
import { MODULES_SIGN_IN_WITH_GOOGLE } from '@/js/modules/sign-in-with-google/datastore/constants';

export default function SettingsNotice() {
	const anyoneCanRegister = useSelect( ( select ) =>
		select( CORE_SITE ).getAnyoneCanRegister()
	);
	const oneTapEnabled = useSelect( ( select ) =>
		select( MODULES_SIGN_IN_WITH_GOOGLE ).getOneTapEnabled()
	);
	const isWooCommerceActive = useSelect( ( select ) =>
		select( MODULES_SIGN_IN_WITH_GOOGLE ).getIsWooCommerceActive()
	);
	const isWooCommerceRegistrationEnabled = useSelect( ( select ) =>
		select(
			MODULES_SIGN_IN_WITH_GOOGLE
		).getIsWooCommerceRegistrationEnabled()
	);

	let shouldShowRegistrationDisabledNotice =
		oneTapEnabled &&
		anyoneCanRegister === false &&
		isWooCommerceActive === false;

	if ( isWooCommerceActive ) {
		// If WooCommerce is active, we take the `isWooCommerceRegistrationEnabled`
		// option into the account to determine if this notice should be shown.
		//
		// It is cleaner to redefine the variable here than place all conditionals
		// in a single check.
		shouldShowRegistrationDisabledNotice =
			oneTapEnabled &&
			anyoneCanRegister === false &&
			isWooCommerceRegistrationEnabled === false;
	}

	return (
		<Fragment>
			{ anyoneCanRegister === false &&
				! shouldShowRegistrationDisabledNotice && (
					<AnyoneCanRegisterDisabledNotice />
				) }
			{ shouldShowRegistrationDisabledNotice && (
				<RegistrationDisabledNotice />
			) }
		</Fragment>
	);
}
