/**
 * Analytics-4 Settings controls.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import { MODULES_ANALYTICS } from '../../../analytics/datastore/constants';
import { PropertyNotice, PropertySelect, UseSnippetSwitch } from '../common';
const { useSelect } = Data;

export default function SettingsControls() {
	const accountID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getAccountID()
	);

	const properties = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getProperties( accountID )
	);

	return (
		<Fragment>
			<div className="googlesitekit-setup-module__inputs">
				{ properties?.length > 0 && (
					<PropertySelect
						label={ __(
							'Google Analytics 4 Property',
							'google-site-kit'
						) }
					/>
				) }
				{ properties?.length < 0 && (
					<PropertyNotice
						notice={ __(
							'A Google Analytics 4 property will be created.',
							'google-site-kit'
						) }
					/>
				) }
			</div>

			<div className="googlesitekit-setup-module__inputs googlesitekit-setup-module__inputs--multiline">
				<UseSnippetSwitch />
			</div>
		</Fragment>
	);
}
