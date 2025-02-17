/**
 * Sign in with Google Settings View component.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import {
	MODULES_SIGN_IN_WITH_GOOGLE,
	SIGN_IN_WITH_GOOGLE_SHAPES,
	SIGN_IN_WITH_GOOGLE_TEXTS,
	SIGN_IN_WITH_GOOGLE_THEMES,
} from '../../datastore/constants';
import { SettingsNotice } from '../common';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import DisplaySetting from '../../../../components/DisplaySetting';

export default function SettingsView() {
	const clientID = useSelect( ( select ) =>
		select( MODULES_SIGN_IN_WITH_GOOGLE ).getClientID()
	);

	const anyoneCanRegister = useSelect( ( select ) =>
		select( CORE_SITE ).getAnyoneCanRegister()
	);

	const buttonShapeLabel = useSelect( ( select ) => {
		const shape = select( MODULES_SIGN_IN_WITH_GOOGLE ).getShape();

		return SIGN_IN_WITH_GOOGLE_SHAPES.find( ( { value } ) => {
			return value === shape;
		} )?.label;
	} );

	const buttonTextLabel = useSelect( ( select ) => {
		const text = select( MODULES_SIGN_IN_WITH_GOOGLE ).getText();

		return SIGN_IN_WITH_GOOGLE_TEXTS.find( ( { value } ) => {
			return value === text;
		} )?.label;
	} );

	const buttonThemeLabel = useSelect( ( select ) => {
		const theme = select( MODULES_SIGN_IN_WITH_GOOGLE ).getTheme();

		return SIGN_IN_WITH_GOOGLE_THEMES.find( ( { value } ) => {
			return value === theme;
		} )?.label;
	} );

	const oneTapEnabled = useSelect( ( select ) =>
		select( MODULES_SIGN_IN_WITH_GOOGLE ).getOneTapEnabled()
	);

	const oneTapOnAllPages = useSelect( ( select ) =>
		select( MODULES_SIGN_IN_WITH_GOOGLE ).getOneTapOnAllPages()
	);

	// If Sign in with Google does not have a client ID, do not display the
	// settings view.
	if ( ! clientID ) {
		return null;
	}

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--sign-in-with-google">
			<StoreErrorNotices
				moduleSlug="sign-in-with-google"
				storeName={ MODULES_SIGN_IN_WITH_GOOGLE }
			/>

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Client ID', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						<DisplaySetting value={ clientID } />
					</p>
				</div>
			</div>

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Button text', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						<DisplaySetting value={ buttonTextLabel } />
					</p>
				</div>

				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Button theme', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						<DisplaySetting value={ buttonThemeLabel } />
					</p>
				</div>

				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Button shape', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						<DisplaySetting value={ buttonShapeLabel } />
					</p>
				</div>
			</div>

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'One Tap sign in', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						{ ! oneTapEnabled && (
							<DisplaySetting
								value={ __( 'Disabled', 'google-site-kit' ) }
							/>
						) }
						{ !! oneTapEnabled && (
							<DisplaySetting
								value={
									!! oneTapOnAllPages
										? __(
												'Enabled (on all pages)',
												'google-site-kit'
										  )
										: __(
												'Enabled (login pages only)',
												'google-site-kit'
										  )
								}
							/>
						) }
					</p>
				</div>
			</div>

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'User registration', 'google-site-kit' ) }
					</h5>
					{ anyoneCanRegister !== undefined && (
						<p className="googlesitekit-settings-module__meta-item-data">
							<DisplaySetting
								value={
									anyoneCanRegister
										? __( 'Enabled', 'google-site-kit' )
										: __( 'Disabled', 'google-site-kit' )
								}
							/>
						</p>
					) }
				</div>
			</div>
			<SettingsNotice className="googlesitekit-margin-top-0" />
		</div>
	);
}
