<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Analytics_4\Site_Goals_SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Analytics_4
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */
// phpcs:disable PHPCS.PHPUnit.RequireAssertionMessage.MissingAssertionMessage -- Ignoring assertion message rule, messages to be added in #10760

namespace Google\Site_Kit\Tests\Modules\Analytics_4;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Modules\Analytics_4\Site_Goals_Settings;
use Google\Site_Kit\Tests\TestCase;

class Site_Goals_SettingsTest extends TestCase {

	/**
	 * Site_Goals_Settings instance.
	 *
	 * @var Site_Goals_Settings
	 */
	private $site_goals_settings;

	public function set_up() {
		parent::set_up();
		$user_id      = $this->factory()->user->create();
		$context      = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$user_options = new User_Options( $context, $user_id );
		$meta_key     = $user_options->get_meta_key( Site_Goals_Settings::OPTION );

		unregister_meta_key( 'user', $meta_key );
		remove_all_filters( "sanitize_user_meta_{$meta_key}" );

		$this->site_goals_settings = new Site_Goals_Settings( $user_options );
		$this->site_goals_settings->register();
	}

	public function test_get_default() {
		$this->assertEquals( array(), $this->site_goals_settings->get() );
	}

	public function test_merge__saves_goal_drivers_and_visitor_engagement() {
		$settings = array(
			'goalDrivers'       => array(
				'ecommerce' => array( 'topTrafficChannels', 'visitorType' ),
				'lead'      => array( 'topTrafficChannels' ),
			),
			'visitorEngagement' => array(
				'ecommerce' => array( 'add_to_cart' ),
				'lead'      => array(),
			),
		);

		$this->site_goals_settings->merge( $settings );

		$this->assertEqualSetsWithIndex( $settings, $this->site_goals_settings->get() );
	}

	public function test_merge__preserves_existing_settings() {
		$this->site_goals_settings->merge(
			array(
				'goalDrivers' => array(
					'ecommerce' => array( 'topTrafficChannels' ),
					'lead'      => array(),
				),
			)
		);

		// Partial save of only `visitorEngagement` preserves existing `goalDrivers`.
		$this->site_goals_settings->merge(
			array(
				'visitorEngagement' => array(
					'ecommerce' => array( 'add_to_cart' ),
				),
			)
		);

		$this->assertEqualSetsWithIndex(
			array(
				'goalDrivers'       => array(
					'ecommerce' => array( 'topTrafficChannels' ),
					'lead'      => array(),
				),
				'visitorEngagement' => array(
					'ecommerce' => array( 'add_to_cart' ),
				),
			),
			$this->site_goals_settings->get()
		);
	}

	public function test_merge__ignores_unknown_keys() {
		$this->site_goals_settings->merge(
			array(
				'goalDrivers' => array(
					'ecommerce' => array( 'topTrafficChannels' ),
				),
				'unknownKey'  => array( 'foo' ),
			)
		);

		$this->assertEqualSetsWithIndex(
			array(
				'goalDrivers' => array(
					'ecommerce' => array( 'topTrafficChannels' ),
				),
			),
			$this->site_goals_settings->get()
		);
	}

	public function test_merge__ignores_null_values() {
		$this->site_goals_settings->merge(
			array(
				'goalDrivers' => array(
					'ecommerce' => array( 'topTrafficChannels' ),
				),
			)
		);

		$this->site_goals_settings->merge(
			array(
				'goalDrivers'       => null,
				'visitorEngagement' => array(
					'ecommerce' => array( 'add_to_cart' ),
				),
			)
		);

		$this->assertEqualSetsWithIndex(
			array(
				'goalDrivers'       => array(
					'ecommerce' => array( 'topTrafficChannels' ),
				),
				'visitorEngagement' => array(
					'ecommerce' => array( 'add_to_cart' ),
				),
			),
			$this->site_goals_settings->get()
		);
	}

	public function data_site_goals_settings() {
		return array(
			'non-array - bool'                       => array(
				false,
				array(),
			),
			'non-array - int'                        => array(
				123,
				array(),
			),
			'strips non-string values from sub-keys' => array(
				array(
					'goalDrivers' => array(
						'ecommerce' => array( 'topTrafficChannels', false, null, array(), 'visitorType', '' ),
						'lead'      => array( 'topTrafficChannels' ),
					),
				),
				array(
					'goalDrivers' => array(
						'ecommerce' => array( 'topTrafficChannels', 'visitorType' ),
						'lead'      => array( 'topTrafficChannels' ),
					),
				),
			),
			'drops non-array top-level keys'         => array(
				array(
					'goalDrivers'       => 'invalid',
					'visitorEngagement' => array(
						'ecommerce' => array( 'add_to_cart' ),
					),
				),
				array(
					'visitorEngagement' => array(
						'ecommerce' => array( 'add_to_cart' ),
					),
				),
			),
			'drops non-array sub-keys'               => array(
				array(
					'goalDrivers' => array(
						'ecommerce' => 'invalid',
						'lead'      => array( 'visitorType' ),
					),
				),
				array(
					'goalDrivers' => array(
						'lead' => array( 'visitorType' ),
					),
				),
			),
			'drops unknown keys'                     => array(
				array(
					'goalDrivers' => array(
						'ecommerce' => array( 'topTrafficChannels' ),
					),
					'unknownKey'  => array( 'foo' ),
				),
				array(
					'goalDrivers' => array(
						'ecommerce' => array( 'topTrafficChannels' ),
					),
				),
			),
		);
	}

	/**
	 * @dataProvider data_site_goals_settings
	 *
	 * @param mixed $input    Values to pass to the `set()` method.
	 * @param array $expected The expected sanitized array.
	 */
	public function test_get_sanitize_callback( $input, $expected ) {
		$this->site_goals_settings->set( $input );
		$this->assertEquals( $expected, $this->site_goals_settings->get() );
	}
}
