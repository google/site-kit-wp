/**
 * SettingsIncludeWooCommerceProductsSwitch component.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Switch } from 'googlesitekit-components';
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import LoadingWrapper from '@/js/components/LoadingWrapper';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { useFeature } from '@/js/hooks/useFeature';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';

interface SettingsIncludeWooCommerceProductsSwitchProps {
	hasModuleAccess?: boolean;
}

const SettingsIncludeWooCommerceProductsSwitch: FC<
	SettingsIncludeWooCommerceProductsSwitchProps
> = ( { hasModuleAccess = true } ) => {
	const freshDataEnabled = useFeature( 'freshData' );

	const {
		isWooCommerceInstalled,
		isAnalyticsConnected,
		hasResolvedSettings,
	} = useSelect(
		( select: Select ) => {
			if ( ! freshDataEnabled ) {
				return {
					isWooCommerceInstalled: false,
					isAnalyticsConnected: false,
					hasResolvedSettings: false,
				};
			}

			return {
				isWooCommerceInstalled:
					select( CORE_SITE ).isWooCommerceInstalled(),
				isAnalyticsConnected: select( CORE_MODULES ).isModuleConnected(
					MODULE_SLUG_ANALYTICS_4
				),
				hasResolvedSettings:
					select( MODULES_ANALYTICS_4 ).getSettings() !== undefined,
			};
		},
		[ freshDataEnabled ]
	);

	const includesWooCommerceProducts = useSelect(
		( select: Select ) =>
			freshDataEnabled
				? select(
						MODULES_ANALYTICS_4
				  ).getFreshDataIncludesWooCommerceProducts()
				: undefined,
		[ freshDataEnabled ]
	);

	const { setFreshDataIncludesWooCommerceProducts } =
		useDispatch( MODULES_ANALYTICS_4 );

	if (
		! freshDataEnabled ||
		isWooCommerceInstalled === false ||
		isAnalyticsConnected === false
	) {
		return null;
	}

	// `includesWooCommerceProducts` is intentionally excluded here: unlike
	// the values above, it can be `undefined` even once settings have fully
	// resolved (e.g. a settings object saved before this setting existed),
	// so `hasResolvedSettings` is used instead as the reliable signal.
	const loading =
		isWooCommerceInstalled === undefined ||
		isAnalyticsConnected === undefined ||
		! hasResolvedSettings;

	return (
		<div>
			<LoadingWrapper loading={ loading } width="180px" height="21.3px">
				<div className="googlesitekit-module-settings-group__switch">
					<Switch
						label={ __(
							'Include products in Recent activity',
							'google-site-kit'
						) }
						checked={ !! includesWooCommerceProducts }
						disabled={ ! hasModuleAccess }
						onClick={ () =>
							setFreshDataIncludesWooCommerceProducts(
								! includesWooCommerceProducts
							)
						}
						hideLabel={ false }
					/>
				</div>
			</LoadingWrapper>
			<LoadingWrapper loading={ loading } width="620px" height="21px">
				<p className="googlesitekit-module-settings-group__helper-text">
					{ __(
						'Show your new products alongside your latest posts in "Recent activity"',
						'google-site-kit'
					) }
				</p>
			</LoadingWrapper>
		</div>
	);
};

export default SettingsIncludeWooCommerceProductsSwitch;
