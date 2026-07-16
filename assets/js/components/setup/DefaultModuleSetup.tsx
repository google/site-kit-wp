/**
 * DefaultModuleSetup component.
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
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { type Select, useSelect } from 'googlesitekit-data';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { Cell, Grid, Row } from '@/js/material-components';
import { useFinishSetup, useModuleSetupTracking } from './hooks';
import SetupFooter from './SetupFooter';
import SetupHeader from './SetupHeader';
import type { ModuleSetupLayoutProps, ModuleWithSetupComponent } from './types';

export default function DefaultModuleSetup( {
	moduleSlug,
}: ModuleSetupLayoutProps ) {
	const module = useSelect(
		( select: Select ): ModuleWithSetupComponent | undefined =>
			select( CORE_MODULES ).getModule( moduleSlug ),
		[ moduleSlug ]
	);

	const finishSetup = useFinishSetup( moduleSlug );

	const { trackCancel: onCancelButtonClick } =
		useModuleSetupTracking( moduleSlug );

	if ( ! module?.SetupComponent ) {
		return null;
	}

	const { SetupComponent } = module;

	return (
		<Fragment>
			<SetupHeader />
			<div className="googlesitekit-setup">
				<Grid>
					<Row>
						<Cell size={ 12 }>
							<section className="googlesitekit-setup__wrapper">
								<Grid>
									<Row>
										<Cell size={ 12 }>
											<p className="googlesitekit-setup__intro-title">
												{ __(
													'Connect Service',
													'google-site-kit'
												) }
											</p>
											<SetupComponent
												module={ module }
												finishSetup={ finishSetup }
											/>
										</Cell>
									</Row>
								</Grid>
								<SetupFooter
									moduleSlug={ moduleSlug }
									finishSetup={ finishSetup }
									onCancel={ onCancelButtonClick }
								/>
							</section>
						</Cell>
					</Row>
				</Grid>
			</div>
		</Fragment>
	);
}
