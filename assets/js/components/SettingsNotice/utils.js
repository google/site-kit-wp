/**
 * Settings notice utils.
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
 * Internal dependencies
 */
import InfoIcon from '../../../svg/icons/info-icon.svg';
import SuggestionIcon from '../../../svg/icons/suggestion-icon.svg';
import WarningIcon from '../../../svg/icons/warning-icon.svg';
import Null from '../Null';

export const TYPE_WARNING = 'warning';
export const TYPE_INFO = 'info';
export const TYPE_SUGGESTION = 'suggestion';

const typeIconMap = {
	[ TYPE_INFO ]: InfoIcon,
	[ TYPE_WARNING ]: WarningIcon,
	[ TYPE_SUGGESTION ]: SuggestionIcon,
};

export const getIconFromType = ( type ) => {
	return typeIconMap[ type ] || Null;
};
