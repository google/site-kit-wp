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
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import {
	MODULES_SIGN_IN_WITH_GOOGLE,
	SIGN_IN_WITH_GOOGLE_SHAPES,
	SIGN_IN_WITH_GOOGLE_TEXTS,
	SIGN_IN_WITH_GOOGLE_THEMES,
} from '../../datastore/constants';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import DisplaySetting from '../../../../components/DisplaySetting';
import Link from '../../../../components/Link';
import SettingsNotice, {
	TYPE_WARNING,
} from '../../../../components/SettingsNotice';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';

export default function SettingsView() {
	const { dismissItem } = useDispatch( CORE_USER );

	const clientID = useSelect( ( select ) =>
		select( MODULES_SIGN_IN_WITH_GOOGLE ).getClientID()
	);

	const anyoneCanRegister = useSelect( ( select ) =>
		select( MODULES_SIGN_IN_WITH_GOOGLE ).getAnyoneCanRegister()
	);

	const buttonShape = useSelect( ( select ) =>
		select( MODULES_SIGN_IN_WITH_GOOGLE ).getShape()
	);

	const buttonShapeLabel = SIGN_IN_WITH_GOOGLE_SHAPES.find( ( { value } ) => {
		return value === buttonShape;
	} )?.label;

	const buttonText = useSelect( ( select ) =>
		select( MODULES_SIGN_IN_WITH_GOOGLE ).getText()
	);

	const buttonTextLabel = SIGN_IN_WITH_GOOGLE_TEXTS.find( ( { value } ) => {
		return value === buttonText;
	} )?.label;

	const buttonTheme = useSelect( ( select ) =>
		select( MODULES_SIGN_IN_WITH_GOOGLE ).getTheme()
	);

	const buttonThemeLabel = SIGN_IN_WITH_GOOGLE_THEMES.find( ( { value } ) => {
		return value === buttonTheme;
	} )?.label;

	const oneTapEnabled = useSelect( ( select ) =>
		select( MODULES_SIGN_IN_WITH_GOOGLE ).getOneTapEnabled()
	);

	const generalSettingsURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'options-general.php' )
	);

	const anyoneCanRegisterNoticeDismissed = useSelect( ( select ) => {
		const dismissedItems = select( CORE_USER ).getDismissedItems();

		return dismissedItems?.some(
			( item ) =>
				item === 'sign-in-with-google-anyone-can-register-notice'
		);
	} );

	// If Sign in with Google does not have a client ID, do not display the
	// settings view.
	if ( ! clientID?.length ) {
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
				{ !! buttonTextLabel && (
					<div className="googlesitekit-settings-module__meta-item">
						<h5 className="googlesitekit-settings-module__meta-item-type">
							{ __( 'Button text', 'google-site-kit' ) }
						</h5>
						<p className="googlesitekit-settings-module__meta-item-data">
							<DisplaySetting value={ buttonTextLabel } />
						</p>
					</div>
				) }

				{ !! buttonThemeLabel && (
					<div className="googlesitekit-settings-module__meta-item">
						<h5 className="googlesitekit-settings-module__meta-item-type">
							{ __( 'Button theme', 'google-site-kit' ) }
						</h5>
						<p className="googlesitekit-settings-module__meta-item-data">
							<DisplaySetting value={ buttonThemeLabel } />
						</p>
					</div>
				) }

				{ !! buttonShapeLabel && (
					<div className="googlesitekit-settings-module__meta-item">
						<h5 className="googlesitekit-settings-module__meta-item-type">
							{ __( 'Button shape', 'google-site-kit' ) }
						</h5>
						<p className="googlesitekit-settings-module__meta-item-data">
							<DisplaySetting value={ buttonShapeLabel } />
						</p>
					</div>
				) }
			</div>

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'One tap sign in', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						<DisplaySetting
							value={
								oneTapEnabled
									? __( 'Enabled', 'google-site-kit' )
									: __( 'Disabled', 'google-site-kit' )
							}
						/>
					</p>
				</div>
			</div>

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __(
							'Users can create new accounts',
							'google-site-kit'
						) }
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

					{ anyoneCanRegisterNoticeDismissed !== undefined &&
						anyoneCanRegisterNoticeDismissed !== true &&
						anyoneCanRegister === false && (
							<SettingsNotice
								type={ TYPE_WARNING }
								dismiss
								dismissCallback={ () => {
									dismissItem(
										'sign-in-with-google-anyone-can-register-notice'
									);
								} }
								notice={ createInterpolateElement(
									__(
										'Enable the <a>“Anyone can register” setting in WordPress</a> to allow your visitors to create an account using the Sign in with Google button.',
										'google-site-kit'
									),
									{
										a: <Link href={ generalSettingsURL } />,
									}
								) }
							/>
						) }
				</div>
			</div>
		</div>
	);
}
