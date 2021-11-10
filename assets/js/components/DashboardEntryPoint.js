import { Fragment } from '@wordpress/element';
import { useFeature } from '../hooks/useFeature';
import ModuleSetup from './setup/ModuleSetup';
import DashboardApp from './dashboard/DashboardApp';
import DashboardMainApp from './DashboardMainApp';
import NotificationCounter from './legacy-notifications/notification-counter';

export default function DashboardEntryPoint( { setupModuleSlug } ) {
	const unifiedDashboardEnabled = useFeature( 'unifiedDashboard' );

	if ( !! setupModuleSlug ) {
		return <ModuleSetup moduleSlug={ setupModuleSlug } />;
	}

	if ( unifiedDashboardEnabled ) {
		return <DashboardMainApp />;
	}

	return (
		<Fragment>
			<NotificationCounter />
			<DashboardApp />
		</Fragment>
	);
}
