/**
 * Sign in with Google Settings form.
 *
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
import { __, _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import {
	ButtonShapeSelect,
	ButtonTextSelect,
	ButtonThemeSelect,
	ClientIDTextField,
	OneTapToggle,
} from '../common';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { MODULES_SIGN_IN_WITH_GOOGLE } from '../../datastore/constants';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import { Cell, Grid, Row } from '../../../../material-components';
import SettingsGroup from '../../../../components/settings/SettingsGroup';

export default function SettingsForm() {
	const anyoneCanRegister = useSelect( ( select ) =>
		select( CORE_SITE ).getAnyoneCanRegister()
	);

	return (
		<div className="googlesitekit-sign-in-with-google-settings-fields">
			<StoreErrorNotices
				moduleSlug="sign-in-with-google"
				storeName={ MODULES_SIGN_IN_WITH_GOOGLE }
			/>
			<Grid>
				<Row>
					<Cell size={ 8 }>
						<Grid className="googlesitekit-sign-in-with-google-settings-fields__stretch-form">
							<Row>
								<Cell size={ 12 }>
									<ClientIDTextField />
								</Cell>
							</Row>
							<Row>
								<Cell size={ 4 }>
									<ButtonTextSelect />
								</Cell>
								<Cell size={ 4 }>
									<ButtonThemeSelect />
								</Cell>
								<Cell size={ 4 }>
									<ButtonShapeSelect />
								</Cell>
							</Row>
						</Grid>
					</Cell>
					<Cell size={ 12 }>
						<OneTapToggle />
					</Cell>
					<Cell size={ 12 }>
						<SettingsGroup
							title={ __(
								'Users can create new accounts',
								'google-site-kit'
							) }
						>
							<p>
								{ anyoneCanRegister
									? sprintf(
											/* translators: %s: Sign in with Google service name */
											__(
												'Users can create new accounts on this site using %s',
												'google-site-kit'
											),
											_x(
												'Sign in with Google',
												'Service name',
												'google-site-kit'
											)
									  )
									: sprintf(
											/* translators: %s: Sign in with Google service name */
											__(
												'Only existing users can use %s to access their accounts',
												'google-site-kit'
											),
											_x(
												'Sign in with Google',
												'Service name',
												'google-site-kit'
											)
									  ) }
							</p>
						</SettingsGroup>
					</Cell>
				</Row>
			</Grid>
		</div>
	);
}
