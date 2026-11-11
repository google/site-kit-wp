/**
 * Site Kit by Google, Copyright 2025 Google LLC
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
 * Internal dependencies
 */
import CheckFill from '@/svg/icons/check-fill.svg';
import InfoCircle from '@/svg/icons/info-circle.svg';
import Launch from '@/svg/icons/launch.svg';
import StarFill from '@/svg/icons/star-fill.svg';
import WarningSVG from '@/svg/icons/warning-notice.svg';
import { NOTICE_TYPES } from './constants';

interface IconProps {
	type?: NOTICE_TYPES;
}

const typeIconMap: Record< NOTICE_TYPES, typeof WarningSVG > = {
	[ NOTICE_TYPES.ERROR ]: WarningSVG,
	[ NOTICE_TYPES.INFO ]: WarningSVG,
	[ NOTICE_TYPES.INFO_ALT ]: WarningSVG,
	[ NOTICE_TYPES.INFO_ALT_2 ]: WarningSVG,
	[ NOTICE_TYPES.INFO_CIRCLE ]: InfoCircle,
	[ NOTICE_TYPES.NEW ]: StarFill,
	[ NOTICE_TYPES.REMINDER ]: Launch,
	[ NOTICE_TYPES.SUCCESS ]: CheckFill,
	[ NOTICE_TYPES.WARNING ]: WarningSVG,
};

const Icon: FC< IconProps > = ( { type = NOTICE_TYPES.INFO } ) => {
	const IconComponent = typeIconMap[ type ];

	return <IconComponent height={ 24 } width={ 24 } />;
};

export default Icon;
