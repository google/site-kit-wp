/**
 * Subscribe with Google Settings Form component.
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
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import { STORE_NAME } from '../../datastore/constants';
import {
	ProductsInput,
	PublicationIDInput,
	RevenueModelDropdown,
} from '../common';

export default function SettingsForm() {
	return (
		<Fragment>
			<StoreErrorNotices
				moduleSlug="subscribe-with-google"
				storeName={ STORE_NAME }
			/>

			<div className="googlesitekit-setup-module__inputs">
				<PublicationIDInput />
			</div>

			<div className="googlesitekit-setup-module__inputs">
				<RevenueModelDropdown />
			</div>

			<div className="googlesitekit-setup-module__inputs">
				<ProductsInput />
			</div>
		</Fragment>
	);
}
