<?php
/**
 * \Google\Site_Kit\Tests\Core\Util\Migration_1_119_0Test
 *
 * @package   Google\Site_Kit\Tests\Core\Util
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Util\Migration_1_121_0;
use Google\Site_Kit\Modules\Analytics_4;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\TestCase;

class Migration_1_121_0Test extends TestCase {

	use Fake_Site_Connection_Trait;

	/**
	 * @var integer
	 */
	protected $user_id;

	/**
	 * @var Context
	 */
	protected $context;

	/**
	 * @var Options
	 */
	protected $options;

	/**
	 * @var User_Options
	 */
	protected $user_options;

	/**
	 * @var Authentication
	 */
	protected $authentication;

	/**
	 * @var Analytics_4
	 */
	protected $analytics_4;

	public function set_up() {
		parent::set_up();

		$this->user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );

		$this->context        = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options        = new Options( $this->context );
		$this->user_options   = new User_Options( $this->context, $this->user_id );
		$this->authentication = new Authentication( $this->context, $this->options, $this->user_options );

		// Fake a valid authentication token on the client.
		$this->authentication->get_oauth_client()->set_token( array( 'access_token' => 'valid-auth-token' ) );
		$this->authentication->verification()->set( true );

		$this->fake_site_connection();
		add_filter( 'googlesitekit_setup_complete', '__return_true', 100 );

		$this->analytics_4 = new Analytics_4(
			$this->context,
			$this->options,
			$this->user_options,
			$this->authentication
		);

		$this->authentication->get_oauth_client()->set_granted_scopes(
			$this->analytics_4->get_scopes()
		);

		$this->analytics_4->get_settings()->register();

		$this->set_legacy_options();
		$this->delete_db_version();
	}

	public function get_new_migration_instance() {
		return new Migration_1_121_0(
			$this->context,
			$this->options,
			$this->user_options
		);
	}

	public function test_register() {
		$migration = $this->get_new_migration_instance();
		remove_all_actions( 'admin_init' );

		$migration->register();

		$this->assertTrue( has_action( 'admin_init' ) );
	}

	public function test_migrate() {
		$migration = $this->get_new_migration_instance();
		remove_all_actions( 'admin_init' );

		$this->reset_analytics_4_options();

		$migrated_keys = array(
			'accountID',
			'adsConversionID',
			'canUseSnippet',
			'trackingDisabled',
		);

		$migration->migrate();

		$legacy_settings      = get_option( 'googlesitekit_analytics_settings' );
		$analytics_4_settings = $this->analytics_4->get_settings()->get();

		// Even current user is not the owner, settings should update by acquiring the module owner id.
		$this->assertNotEquals( $this->user_id, get_current_user_id() );

		$this->assertEquals(
			$this->filter_settings( $analytics_4_settings, $migrated_keys ),
			$this->filter_settings( $legacy_settings, $migrated_keys )
		);

		$this->assertEquals( Migration_1_121_0::DB_VERSION, $this->get_db_version() );
	}

	public function test_migrate__analytics_4_not_connected() {
		$migration = $this->get_new_migration_instance();
		remove_all_actions( 'admin_init' );

		// Disconnect Analytics 4 module.
		$this->analytics_4->get_settings()->merge(
			array(
				'propertyID'      => '',
				'webDataStreamID' => '',
				'measurementID'   => '',
			)
		);

		$migrated_keys = array(
			'accountID',
			'adsConversionID',
			'canUseSnippet',
			'trackingDisabled',
		);

		$migration->migrate();

		$legacy_settings      = get_option( 'googlesitekit_analytics_settings' );
		$analytics_4_settings = $this->analytics_4->get_settings()->get();

		$this->assertNotEquals(
			$this->filter_settings( $analytics_4_settings, $migrated_keys ),
			$this->filter_settings( $legacy_settings, $migrated_keys )
		);

		$this->assertNotEquals( Migration_1_121_0::DB_VERSION, $this->get_db_version() );
	}

	protected function filter_settings( $settings, $keys_to_filter ) {
		return array_filter(
			$settings,
			function( $key ) use ( $keys_to_filter ) {
				if ( in_array( $key, $keys_to_filter, true ) ) {
					return true;
				}

				return false;
			},
			ARRAY_FILTER_USE_KEY
		);
	}

	protected function reset_analytics_4_options() {
		// Set initial Analytics 4 module settings.
		$this->analytics_4->get_settings()->merge(
			array(
				'accountID'        => '', // Simulate an empty account id.
				'propertyID'       => '987654321',
				'webDataStreamID'  => '1234567890',
				'measurementID'    => 'G-A1B2C3D4E5',
				'trackingDisabled' => array( 'loggedinUsers' ),
				'useSnippet'       => true,
				'canUseSnippet'    => true,
				'adsenseLinked'    => false,
				'ownerID'          => $this->user_id,
			)
		);
	}

	protected function set_legacy_options() {
		$this->options->set(
			'googlesitekit_analytics_settings',
			array(
				'ownerID'               => $this->user_id,
				'accountID'             => '12345678',
				'adsenseLinked'         => true,
				'adsConversionID'       => '111111',
				'anonymizeIP'           => true,
				'internalWebPropertyID' => '',
				'profileID'             => '',
				'propertyID'            => '',
				'trackingDisabled'      => array(),
				'useSnippet'            => false,
				'canUseSnippet'         => false,
			)
		);
	}

	protected function get_db_version() {
		return $this->options->get( 'googlesitekit_db_version' );
	}

	protected function delete_db_version() {
		$this->options->delete( 'googlesitekit_db_version' );
	}
}
