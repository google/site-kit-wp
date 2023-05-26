import ModalDialog from './ModalDialog';

const Template = () => (
	<ModalDialog
		dialogActive
		title="Modal Dialog Title"
		subtitle="Modal Dialog Subtitle"
		provides={ [
			'Audience overview',
			'Top pages',
			'Top acquisition channels',
		] }
		handleConfirm={ global.console.log.bind(
			null,
			'Dialog::handleConfirm'
		) }
		danger
	/>
);

export const Default = Template.bind( {} );
Default.storyName = 'Default';

export const Material3 = Template.bind( {} );
Material3.storyName = 'Material3';
Material3.parameters = {
	isMaterial3: true,
};

export default {
	title: 'Global/Modal Dialog',
	component: ModalDialog,
};
