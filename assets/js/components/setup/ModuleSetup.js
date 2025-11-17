/**
 * ModuleSetup component.
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
import PropTypes from 'prop-types';
import { useMount } from 'react-use';
import { useCallbackOne } from 'use-memo-one';

/**
 * WordPress dependencies
 */
import { Fragment, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch, useRegistry } from 'googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { deleteItem } from '@/js/googlesitekit/api/cache';
import { trackEvent } from '@/js/util';
import { useFeature } from '@/js/hooks/useFeature';
import useQueryArg from '@/js/hooks/useQueryArg';
import useViewContext from '@/js/hooks/useViewContext';
import HelpMenu from '@/js/components/help/HelpMenu';
import { Cell, Grid, Row } from '@/js/material-components';
import Header from '@/js/components/Header';
import ModuleSetupFooter from './ModuleSetupFooter';
import ExitSetup from '@/js/components/setup/ExitSetup';
import ProgressIndicator from '@/js/components/ProgressIndicator';

export default function ModuleSetup( { moduleSlug } ) {
	const viewContext = useViewContext();
	const { navigateTo } = useDispatch( CORE_LOCATION );
	const setupFlowRefreshEnabled = useFeature( 'setupFlowRefresh' );
	const [ showProgress ] = useQueryArg( 'showProgress' );

	const module = useSelect( ( select ) =>
		select( CORE_MODULES ).getModule( moduleSlug )
	);

	const registry = useRegistry();

	/**
	 * When module setup done, we redirect the user to Site Kit dashboard.
	 *
	 * @since 1.0.0
	 * @since 1.18.0 Added optional redirectURL parameter.
	 *
	 * @param {string} [redirectURL] URL to redirect to when complete. Defaults to Site Kit dashboard.
	 */
	const finishSetup = useCallbackOne(
		async ( redirectURL ) => {
			await deleteItem( 'module_setup' );

			if ( isInitialSetupFlow ) {
				await trackEvent(
					`${ viewContext }_setup`,
					'setup_flow_v3_complete_analytics_step'
				);
			} else {
				await trackEvent(
					'moduleSetup',
					'complete_module_setup',
					moduleSlug
				);
			}

			if ( redirectURL ) {
				navigateTo( redirectURL );
				return;
			}

			const { select, resolveSelect } = registry;
			await resolveSelect( CORE_SITE ).getSiteInfo();
			const adminURL = select( CORE_SITE ).getAdminURL(
				'googlesitekit-dashboard',
				{
					notification: 'authentication_success',
					slug: moduleSlug,
				}
			);
			navigateTo( adminURL );
		},
		[ registry, navigateTo, moduleSlug ]
	);

	const onCompleteSetup = module?.onCompleteSetup;
	const onCompleteSetupCallback = useCallback(
		() => onCompleteSetup( registry, finishSetup ),
		[ onCompleteSetup, registry, finishSetup ]
	);

	const onCancelButtonClick = useCallback( async () => {
		await trackEvent( 'moduleSetup', 'cancel_module_setup', moduleSlug );
	}, [ moduleSlug ] );

	const isInitialSetupFlow =
		setupFlowRefreshEnabled &&
		moduleSlug === MODULE_SLUG_ANALYTICS_4 &&
		showProgress === 'true';

	useMount( () => {
		if ( isInitialSetupFlow ) {
			trackEvent(
				`${ viewContext }_setup`,
				'setup_flow_v3_view_analytics_step'
			);

			return;
		}

		trackEvent( 'moduleSetup', 'view_module_setup', moduleSlug );
	} );

	if ( ! module?.SetupComponent ) {
		return null;
	}

	const { SetupComponent } = module;

	return (
		<Fragment>
			<Header
				subHeader={
					isInitialSetupFlow ? (
						<ProgressIndicator
							currentSegment={ 3 }
							totalSegments={ 6 }
						/>
					) : null
				}
			>
				{ isInitialSetupFlow ? <ExitSetup /> : <HelpMenu /> }
			</Header>
			<div className="googlesitekit-setup">
				<Grid>
					<Row>
						<Cell size={ 12 }>
							<section className="googlesitekit-setup__wrapper">
								<Grid>
									<Row>
										<Cell size={ 12 }>
											{ ! isInitialSetupFlow && (
												<p className="googlesitekit-setup__intro-title">
													{ __(
														'Connect Service',
														'google-site-kit'
													) }
												</p>
											) }
											<SetupComponent
												module={ module }
												finishSetup={ finishSetup }
											/>
										</Cell>
									</Row>
								</Grid>

								{ ! isInitialSetupFlow && (
									<ModuleSetupFooter
										module={ module }
										onCancel={ onCancelButtonClick }
										onComplete={
											typeof onCompleteSetup ===
											'function'
												? onCompleteSetupCallback
												: undefined
										}
									/>
								) }
							</section>
						</Cell>
					</Row>
				</Grid>
			</div>
		</Fragment>
	);
}

ModuleSetup.propTypes = {
	moduleSlug: PropTypes.string.isRequired,
};
