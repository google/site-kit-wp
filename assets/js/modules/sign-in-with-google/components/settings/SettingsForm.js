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
 * Internal dependencies
 */
import {
	AnyoneCanRegisterReadOnly,
	ButtonShapeSelect,
	ButtonTextSelect,
	ButtonThemeSelect,
	ClientIDTextField,
	OneTapToggles,
	Preview,
	SettingsNotice,
} from '../common';
import { MODULES_SIGN_IN_WITH_GOOGLE } from '../../datastore/constants';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import { Cell, Grid, Row } from '../../../../material-components';
import { getLocale } from '../../../../util';

export default function SettingsForm() {
	return (
		<div className="googlesitekit-sign-in-with-google-settings-fields">
			<StoreErrorNotices
				moduleSlug="sign-in-with-google"
				storeName={ MODULES_SIGN_IN_WITH_GOOGLE }
			/>
			<h1>Locale Debug: { getLocale() }</h1>
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
					<Cell
						size={ 4 }
						className="googlesitekit-sign-in-with-google-settings-fields__button-preview"
					>
						<Grid>
							<Row>
								<Cell size={ 12 }>
									<Preview />
								</Cell>
							</Row>
						</Grid>
					</Cell>
				</Row>
				<Row>
					<Cell size={ 12 }>
						<OneTapToggles />
					</Cell>
					<Cell size={ 12 }>
						<AnyoneCanRegisterReadOnly />
						<SettingsNotice />
					</Cell>
				</Row>
			</Grid>
		</div>
	);
}
