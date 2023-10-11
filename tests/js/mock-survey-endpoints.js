import { provideSiteInfo } from './utils';

/**
 * Mocks the survey endpoints and ensure the proxy is considered
 * in-use for this test/`registry` instance.
 *
 * @since n.e.x.t
 *
 * @param {*} registry WordPress Data registry instance.
 */
export const mockSurveyEndpoints = ( registry ) => {
	const surveyTriggerEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/survey-trigger'
	);
	const surveyTimeoutEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/survey-timeout'
	);

	fetchMock.postOnce( surveyTriggerEndpoint, {
		status: 200,
		body: {},
	} );

	fetchMock.getOnce( surveyTimeoutEndpoint, {
		status: 200,
		body: {},
	} );

	fetchMock.postOnce( surveyTimeoutEndpoint, {
		status: 200,
		body: {},
	} );

	provideSiteInfo( registry, {
		usingProxy: true,
	} );
};
