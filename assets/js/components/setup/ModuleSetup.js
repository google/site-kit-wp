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
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import { Fragment, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useRegistry, useSelect } from 'googlesitekit-data';
import Header from '@/js/components/Header';
import HelpMenu from '@/js/components/help/HelpMenu';
import ProgressIndicator from '@/js/components/ProgressIndicator';
import ExitSetup from '@/js/components/setup/ExitSetup';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { useFeature } from '@/js/hooks/useFeature';
import useQueryArg from '@/js/hooks/useQueryArg';
import useViewContext from '@/js/hooks/useViewContext';
import { Cell, Grid, Row } from '@/js/material-components';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { useFinishSetup, useModuleSetupTracking } from './hooks';
import ModuleSetupFooter from './ModuleSetupFooter';

export default function ModuleSetup( { moduleSlug } ) {
	const viewContext = useViewContext();
	const setupFlowRefreshEnabled = useFeature( 'setupFlowRefresh' );
	const [ showProgress ] = useQueryArg( 'showProgress' );

	const isInitialSetupFlow =
		setupFlowRefreshEnabled &&
		moduleSlug === MODULE_SLUG_ANALYTICS_4 &&
		showProgress === 'true';

	const module = useSelect( ( select ) =>
		select( CORE_MODULES ).getModule( moduleSlug )
	);

	const registry = useRegistry();

	const finishSetup = useFinishSetup(
		moduleSlug,
		isInitialSetupFlow
			? {
					gaTrackingEventArgs: {
						category: `${ viewContext }_setup`,
						action: 'setup_flow_v3_complete_analytics_step',
					},
			  }
			: {}
	);

	const { trackCancel: onCancelButtonClick } = useModuleSetupTracking(
		moduleSlug,
		isInitialSetupFlow
			? {
					viewGATrackingEventArgs: {
						category: `${ viewContext }_setup`,
						action: 'setup_flow_v3_view_analytics_step',
					},
			  }
			: {}
	);

	const onCompleteSetup = module?.onCompleteSetup;
	const onCompleteSetupCallback = useCallback(
		() => onCompleteSetup( registry, finishSetup ),
		[ onCompleteSetup, registry, finishSetup ]
	);

	// Add the initial setup class to the body when the component mounts.
	useMount( () => {
		if ( isInitialSetupFlow ) {
			global.document.body.classList.add( 'googlesitekit-setup-flow' );
		}
	} );

	if ( ! module?.SetupComponent ) {
		return null;
	}

	const { SetupComponent } = module;

	const setupMainContent = (
		<Fragment>
			{ isInitialSetupFlow && (
				<ProgressIndicator currentSegment={ 3 } totalSegments={ 6 } />
			) }
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
							typeof onCompleteSetup === 'function'
								? onCompleteSetupCallback
								: undefined
						}
					/>
				) }
			</section>
		</Fragment>
	);

	return (
		<Fragment>
			<Header>
				{ isInitialSetupFlow && (
					<ExitSetup
						gaTrackingEventArgs={ {
							category: `${ viewContext }_setup`,
							label: moduleSlug,
						} }
					/>
				) }
				<HelpMenu />
			</Header>
			<div
				className={ classnames(
					'googlesitekit-setup',
					...( isInitialSetupFlow
						? [
								'googlesitekit-initial-setup',
								`googlesitekit-initial-setup--${ moduleSlug }`,
						  ]
						: [] )
				) }
			>
				{ isInitialSetupFlow ? (
					setupMainContent
				) : (
					<Grid>
						<Row>
							<Cell size={ 12 }>{ setupMainContent }</Cell>
						</Row>
					</Grid>
				) }
			</div>
		</Fragment>
	);
}

ModuleSetup.propTypes = {
	moduleSlug: PropTypes.string.isRequired,
};
