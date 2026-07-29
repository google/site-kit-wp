/**
 * Reader Revenue Manager newsletter signup CTA express setup flow.
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
 * Internal dependencies
 */
import Stepper from '@/js/components/Stepper';
import Step from '@/js/components/Stepper/Step';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '@/js/hooks/useBreakpoint';
import useQueryArg from '@/js/hooks/useQueryArg';
import { Cell, Grid, Row } from '@/js/material-components';
import { EXPRESS_SETUP_STEPS } from '@/js/modules/reader-revenue-manager/datastore/constants';
import PoweredBy from './PoweredBy';
import StepPublicationPolicies from './StepPublicationPolicies';
import StepPublicationSetup from './StepPublicationSetup';
import StepSetupComplete from './StepSetupComplete';
import StepTermsOfService from './StepTermsOfService';

export default function SetupCTANewsletter() {
	const [ step ] = useQueryArg( 'step' );
	const breakpoint = useBreakpoint();
	const isMobileOrTablet = [ BREAKPOINT_SMALL, BREAKPOINT_TABLET ].includes(
		breakpoint
	);

	const stepComponents: Record< string, React.ComponentType > = {
		[ EXPRESS_SETUP_STEPS.CONNECT_PUBLICATION ]: StepPublicationSetup,
		[ EXPRESS_SETUP_STEPS.TERMS_OF_SERVICE ]: StepTermsOfService,
		[ EXPRESS_SETUP_STEPS.PUBLICATION_POLICIES ]: StepPublicationPolicies,
		[ EXPRESS_SETUP_STEPS.SETUP_COMPLETE ]: StepSetupComplete,
	};

	const StepComponent = stepComponents[ step ];

	return (
		<Grid className="googlesitekit-rrm-express-setup" collapsed>
			<Row className="googlesitekit-rrm-express-setup__layout">
				<Cell
					className="googlesitekit-rrm-express-setup__sidebar"
					smSize={ 4 }
					mdSize={ 8 }
					lgSize={ 3 }
				>
					<div className="googlesitekit-rrm-express-setup__sidebar-inner">
						<Stepper activeStep={ 0 } variant="rail">
							<Step title="Connect publication" />
							<Step title="Accept terms of service" />
							<Step title="Add publication policies" />
							<Step title="Set up a sign-up form" />
							<Step title="Setup complete" />
						</Stepper>
						{ ! isMobileOrTablet && <PoweredBy /> }
					</div>
				</Cell>
				<Cell
					className="googlesitekit-rrm-express-setup__content"
					smSize={ 4 }
					mdSize={ 8 }
					lgSize={ 9 }
				>
					<Grid>
						<Row>
							<Cell size={ 12 }>
								<StepComponent />
							</Cell>
						</Row>
					</Grid>
				</Cell>
				{ isMobileOrTablet && (
					<Cell
						size={ 12 }
						className="googlesitekit-rrm-express-setup__footer"
					>
						<Grid>
							<Row>
								<Cell size={ 12 }>
									<PoweredBy />
								</Cell>
							</Row>
						</Grid>
					</Cell>
				) }
			</Row>
		</Grid>
	);
}
