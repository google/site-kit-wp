/**
 * Site Kit by Google, Copyright 2023 Google LLC
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

/*
 * Internal dependencies
 */
import { Cell } from '../../../material-components';
import GoogleLogoIcon from '../../../../svg/graphics/logo-g.svg';
import ModuleIcon from '../../ModuleIcon';
import { BannerLogoProps } from './types';

export default function BannerLogo( props: BannerLogoProps ) {
	const { module, moduleName } = props;

	return (
		<Cell size={ 12 }>
			<div className="googlesitekit-publisher-win__logo">
				{ module && <ModuleIcon slug={ module } size={ 19 } /> }
				{ ! module && <GoogleLogoIcon height="34" width="32" /> }
			</div>
			{ moduleName && (
				<div className="googlesitekit-publisher-win__module-name">
					{ moduleName }
				</div>
			) }
		</Cell>
	);
}
