/**
 * SettingsAdminSharing component.
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
 * External dependencies
 */
import {
	Combobox,
	ComboboxInput,
} from '@reach/combobox';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Grid, Row, Cell } from '../../material-components';
import Link from '../Link';

export default function SettingsAdminSharing() {
	const users = [
		{
			type: 'role',
			id: 'editor',
			displayName: 'All editors',
			thumbnail: '',
		},
		{
			type: 'user',
			id: 4,
			displayName: 'John Doe',
			thumbnail: '',
		},
		{
			type: 'user',
			id: 3,
			displayName: 'Jane Doe',
			thumbnail: '',
		},
	];
	return (
		<div className="
            googlesitekit-settings-module
            googlesitekit-settings-module--active
            googlesitekit-settings-user-input
        ">
			<Grid>
				<Row>
					<Cell size={ 12 }>
						<h3 className="
                            googlesitekit-heading-4
                            googlesitekit-settings-module__title
                        ">
							{ __( 'Share dashboard', 'google-site-kit' ) }
						</h3>
						<p>
							{ __( 'Share with people or groups', 'google-site-kit' ) }
						</p>
					</Cell>
				</Row>
				<Row>
					<Cell>
						<Combobox className="autocomplete__wrapper">
							<ComboboxInput
								className="autocomplete__input autocomplete__input--default"
								type="text"
							/>
						</Combobox>
						<table>
							<thead>
								<tr>
									<td>Name</td>
									<td>Edit</td>
								</tr>
							</thead>
							<tbody>
								{ users.map( ( user ) => (
									<tr key={ user.id }>
										<td>{ user.displayName }</td>
										<td><Link>Remove</Link></td>
									</tr>
								) ) }
							</tbody>
						</table>
					</Cell>
				</Row>
			</Grid>
		</div>
	);
}
