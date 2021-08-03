import initStoryshots from '@storybook/addon-storyshots';
import { puppeteerTest } from '@storybook/addon-storyshots-puppeteer';
import path from 'path';

initStoryshots( {
	suite: 'Puppeteer storyshots',
	test: puppeteerTest( {
		// eslint-disable-next-line sitekit/acronym-case
		storybookUrl: `file://${ path.resolve(
			__dirname,
			'../storybook-static'
		) }`,
		setupTimeout: 5000,
		testTimeout: 5000,
	} ),
} );
