/**
 * DashboardDetailsEntityHeaderContainer component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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

/**
 * Internal dependencies
 */
import Link from '../link';
import Layout from '../layout/layout';

export default function DashboardDetailsEntityHeaderContainer( { children, url } ) {
	return (
		<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
			<Layout>
				<div className="mdc-layout-grid">
					<div className="mdc-layout-grid__inner">
						<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
							{ children }
							<Link href={ url } inherit external>
								{ url }
							</Link>
						</div>
					</div>
				</div>
			</Layout>
		</div>
	);
}

DashboardDetailsEntityHeaderContainer.propTypes = {
	url: PropTypes.string.isRequired,
	children: PropTypes.node.isRequired,
};
