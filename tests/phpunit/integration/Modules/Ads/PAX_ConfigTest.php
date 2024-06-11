<?php
/**
 * PAX_ConfigTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Ads
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Ads;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Token;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Ads\PAX_Config;
use Google\Site_Kit\Tests\TestCase;
use Google\Site_Kit\Tests\UserAuthenticationTrait;

/**
 * @group Modules
 * @group Ads
 * @group PAX
 */
class PAX_ConfigTest extends TestCase {
	use UserAuthenticationTrait;

	private $context;
	private $user_options;
	private $token;

	public function set_up() {
		parent::set_up();
		$this->context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->user_options = new User_Options( $this->context );
		$this->token        = new Token( $this->user_options );
	}

	public function test_get() {
		$config = new PAX_Config( $this->context, $this->token );
		$this->assertFalse( $this->token->has() );

		$data = $config->get();

		$this->assertEquals(
			array(
				'authAccess'      => array(
					'oauthTokenAccess' => array(
						'token' => '', // No token yet.
					),
				),
				'debuggingConfig' => array(
					'env' => 'PROD',
				),
				'locale'          => 'en',
			),
			$data
		);
	}

	public function test_get__token() {
		$user_id = $this->factory()->user->create();
		$this->user_options->switch_user( $user_id );
		$this->set_user_access_token( $user_id, 'test-access-token' );
		$config = new PAX_Config( $this->context, $this->token );

		$data = $config->get();

		$this->assertEquals( 'test-access-token', $data['authAccess']['oauthTokenAccess']['token'] );
	}

	/**
	 * @param string $const_value
	 * @param string $expected
	 * @dataProvider data_envs
	 * @runInSeparateProcess
	 */
	public function test_get__env( $const_value, $expected ) {
		$config = new PAX_Config( $this->context, $this->token );
		define( 'GOOGLESITEKIT_PAX_ENV', $const_value );

		$data = $config->get();

		$this->assertEquals( $expected, $data['debuggingConfig']['env'] );
	}

	public function data_envs() {
		return array(
			'PROD'    => array(
				'PROD',
				'PROD',
			),
			'QA_PROD' => array(
				'QA_PROD',
				'QA_PROD',
			),
			'OTHER'   => array(
				'OTHER',
				'PROD',
			),
		);
	}
}
