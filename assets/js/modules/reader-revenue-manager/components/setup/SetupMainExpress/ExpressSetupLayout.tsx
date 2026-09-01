/**
 * Reader Revenue Manager express setup layout.
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
import type { FC, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '@/js/hooks/useBreakpoint';
import useQueryArg from '@/js/hooks/useQueryArg';
import { Cell, Grid, Row } from '@/js/material-components';
import PoweredBy from './PoweredBy';

interface ExpressSetupLayoutProps {
	children: ReactNode;
	sidebar: ReactNode;
}

const ExpressSetupLayout: FC< ExpressSetupLayoutProps > = ( {
	children,
	sidebar,
} ) => {
	const [ cta ] = useQueryArg( 'cta' );
	const breakpoint = useBreakpoint();
	const isMobileOrTablet = [ BREAKPOINT_SMALL, BREAKPOINT_TABLET ].includes(
		breakpoint
	);
	const showPoweredBy = !! cta;

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
						{ sidebar }
						{ showPoweredBy && ! isMobileOrTablet && <PoweredBy /> }
					</div>
				</Cell>
				<Cell
					className="googlesitekit-rrm-express-setup__content"
					smSize={ 4 }
					mdSize={ 8 }
					lgSize={ 9 }
				>
					{ children }
				</Cell>
				{ showPoweredBy && isMobileOrTablet && (
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
};

export default ExpressSetupLayout;
