import parseUnsatisfiedScopes from './parse-unsatisfied-scopes';
describe( 'parseUnsatisfiedScopes', () => {
	const scopes = [
		'openid',
		'https://www.googleapis.com/auth/adsense',
		'https://www.googleapis.com/auth/analytics.readonly',
		'https://www.googleapis.com/auth/analytics.manage.users',
		'https://www.googleapis.com/auth/userinfo',
		'https://www.googleapis.com/auth/siteverification',
		'https://www.googleapis.com/auth/webmaster',
	];

	it( 'only includes parsable scopes', () => {
		expect( parseUnsatisfiedScopes( scopes ) ).toEqual( expect.not.arrayContaining( [ 'openid' ] ) );
	} );

	it( 'retuns a array of scopes and sub-scope', () => {
		const expected = [
			[ 'adsense' ],
			[ 'analytics', 'readonly' ],
			[ 'analytics', 'manage', 'users' ],
			[ 'userinfo' ],
			[ 'siteverification' ],
			[ 'webmaster' ],
		];
		expect( parseUnsatisfiedScopes( scopes ) ).toEqual( expected );
	} );
} );
