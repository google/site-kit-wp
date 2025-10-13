/**
 * Sign in with Google Setup form.
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
 * External dependencies
 */
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import {
	lazy,
	Suspense,
	createInterpolateElement,
	useState,
	useEffect,
} from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch, useRegistry, useSelect } from 'googlesitekit-data';
import StoreErrorNotices from '@/js/components/StoreErrorNotices';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { MODULES_SIGN_IN_WITH_GOOGLE } from '@/js/modules/sign-in-with-google/datastore/constants';
import { MODULE_SLUG_SIGN_IN_WITH_GOOGLE } from '@/js/modules/sign-in-with-google/constants';
import ClientIDTextField from '@/js/modules/sign-in-with-google/components/common/ClientIDTextField';
import CompatibilityChecks from './CompatibilityChecks';
import OneTapToggle from '@/js/modules/sign-in-with-google/components/common/OneTapToggle';
import { Button } from 'googlesitekit-components';
import Link from '@/js/components/Link';
import ExternalIcon from '@/svg/icons/external.svg';
import PreviewBlock from '@/js/components/PreviewBlock';
import MediaErrorHandler from '@/js/components/MediaErrorHandler';
const LazyGraphicSVG = lazy( () =>
	import( '../../../../../svg/graphics/sign-in-with-google-setup.svg' )
);

export default function SetupForm() {
	const registry = useRegistry();
	const [ existingClientID, setExistingClientID ] = useState();

	const learnMoreURL = useSelect( ( select ) => {
		return select( CORE_SITE ).getDocumentationLinkURL(
			MODULE_SLUG_SIGN_IN_WITH_GOOGLE
		);
	} );

	const serviceClientIDProvisioningURL = useSelect( ( select ) =>
		select(
			MODULES_SIGN_IN_WITH_GOOGLE
		).getServiceClientIDProvisioningURL()
	);

	const anyoneCanRegister = useSelect( ( select ) =>
		select( CORE_SITE ).getAnyoneCanRegister()
	);

	// Ensure SiwG settings are resolved so defaults (shape/text/theme) are available.
	const settingsLoaded = useSelect(
		( select ) =>
			select( MODULES_SIGN_IN_WITH_GOOGLE ).getSettings() !== undefined
	);

	// Read One Tap current value and set a default ON during setup when registration is open,
	// without breaking canSubmitChanges (wait until settingsLoaded).
	const oneTapEnabled = useSelect( ( select ) =>
		select( MODULES_SIGN_IN_WITH_GOOGLE ).getOneTapEnabled()
	);
	const [ hasSetDefaultOneTap, setHasSetDefaultOneTap ] = useState( false );
	const { setOneTapEnabled } = useDispatch( MODULES_SIGN_IN_WITH_GOOGLE );

	useEffect( () => {
		if (
			settingsLoaded &&
			anyoneCanRegister &&
			! hasSetDefaultOneTap &&
			oneTapEnabled === false
		) {
			setOneTapEnabled( true );
			setHasSetDefaultOneTap( true );
		}
	}, [
		settingsLoaded,
		anyoneCanRegister,
		hasSetDefaultOneTap,
		oneTapEnabled,
		setOneTapEnabled,
	] );

	// Prefill the clientID field with a value from a previous module connection, if it exists.
	useMount( async () => {
		// Allow default `settings` and `savedSettings` to load before updating
		// the `clientID` setting again.
		await registry
			.resolveSelect( MODULES_SIGN_IN_WITH_GOOGLE )
			.getSettings();

		// The clientID is fetched again as useMount does not receive the
		// updated clientID.
		const currentClientID = registry
			.select( MODULES_SIGN_IN_WITH_GOOGLE )
			.getClientID();

		await registry
			.resolveSelect( MODULES_SIGN_IN_WITH_GOOGLE )
			.getExistingClientID();

		const existingID = registry
			.select( MODULES_SIGN_IN_WITH_GOOGLE )
			.getExistingClientID();

		if ( currentClientID === '' && existingID ) {
			setExistingClientID( existingID );
		}
	} );

	return (
		<div className="googlesitekit-sign-in-with-google-setup__form">
			<div className="googlesitekit-setup-module__panel-item">
				<CompatibilityChecks />
				<StoreErrorNotices
					moduleSlug={ MODULES_SIGN_IN_WITH_GOOGLE }
					storeName={ MODULES_SIGN_IN_WITH_GOOGLE }
				/>
				<p className="googlesitekit-setup-module__step-description">
					{ createInterpolateElement(
						sprintf(
							/* translators: %1$s: Sign in with Google service name */
							__(
								'To set up %1$s, Site Kit will help you create an “OAuth Client ID“ that will be used to enable %1$s on your website. You will be directed to a page that will allow you to generate an “OAuth Client ID“. <a>Learn more</a>',
								'google-site-kit'
							),
							_x(
								'Sign in with Google',
								'Service name',
								'google-site-kit'
							)
						),
						{
							a: <Link href={ learnMoreURL } external />,
						}
					) }
				</p>
				<p className="googlesitekit-margin-bottom-0">
					{ __(
						'Add your client ID here to complete setup:',
						'google-site-kit'
					) }
				</p>
				<div className="googlesitekit-setup-module__inputs">
					<ClientIDTextField existingClientID={ existingClientID } />
				</div>
				<Button
					className="googlesitekit-sign-in-with-google-client-id-cta"
					href={ serviceClientIDProvisioningURL }
					target="_blank"
					trailingIcon={ <ExternalIcon width="15" height="15" /> }
					inverse
				>
					{ __( 'Get your client ID', 'google-site-kit' ) }
				</Button>
				{ anyoneCanRegister && (
					<div className="googlesitekit-setup-module__inputs">
						<OneTapToggle />
					</div>
				) }
			</div>

			<div className="googlesitekit-setup-module__panel-item googlesitekit-setup-module__panel-item--with-svg">
				<Suspense
					fallback={ <PreviewBlock width="100%" height="235px" /> }
				>
					<MediaErrorHandler
						errorMessage={ __(
							'Failed to load graphic',
							'google-site-kit'
						) }
					>
						<LazyGraphicSVG />
					</MediaErrorHandler>
				</Suspense>
			</div>
		</div>
	);
}
