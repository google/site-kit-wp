/**
 * DashboardIdeasWidget utils.
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
import {
	IDEA_HUB_BUTTON_CREATE,
	IDEA_HUB_BUTTON_PIN,
	IDEA_HUB_BUTTON_UNPIN,
	IDEA_HUB_BUTTON_DELETE,
} from '../../../datastore/constants';
import DeleteIcon from '../../../../../../svg/idea-hub-delete.svg';
import CreateIcon from '../../../../../../svg/idea-hub-create.svg';
import PinIcon from '../../../../../../svg/idea-hub-pin.svg';
import UnpinIcon from '../../../../../../svg/idea-hub-unpin.svg';
import Null from '../../../../../components/Null';

const activityIconMap = {
	[ IDEA_HUB_BUTTON_DELETE ]: <DeleteIcon />,
	[ IDEA_HUB_BUTTON_PIN ]: <PinIcon />,
	[ IDEA_HUB_BUTTON_UNPIN ]: <UnpinIcon />,
	[ IDEA_HUB_BUTTON_CREATE ]: <CreateIcon />,
};

export const getIconFromActivity = ( activity ) => {
	return activityIconMap[ activity ] || Null;
};
