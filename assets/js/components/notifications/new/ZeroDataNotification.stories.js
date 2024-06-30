import { getNotificationComponentProps } from '../../../googlesitekit/notifications/util/component-props';
import ZeroDataNotification from './ZeroDataNotification';

function Template( args ) {
	return <ZeroDataNotification { ...args } />;
}

export const Default = Template.bind( {} );
Default.args = getNotificationComponentProps( 'zero-data' );

export default {
	component: ZeroDataNotification,
	title: 'Components/Notifications/ZeroData',
};
