<?php
/**
 * Class Google\Site_Kit\Tests\Tags\GTagTest
 *
 * @package   Google\Site_Kit\Tests\Core\Tags\GTag
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Tags;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Tags\First_Party_Mode\First_Party_Mode_Settings;
use Google\Site_Kit\Core\Tags\GTag;
use Google\Site_Kit\Tests\TestCase;

class GTagTest extends TestCase {

	/**
	 * Holds an instance of the GTag class.
	 *
	 * @var GTag $gtag Gtag instance.
	 */
	private $gtag;

	const TEST_TAG_ID_1           = 'GT-12345';
	const TEST_TAG_ID_2           = 'GT-67890';
	const TEST_TAG_ID_2_CONFIG    = array( 'foo' => 'bar' );
	const TEST_COMMAND_1          = 'foo';
	const TEST_COMMAND_1_POSITION = 'before';
	const TEST_COMMAND_1_PARAMS   = array( 'bar', 'far' );
	const TEST_COMMAND_2_POSITION = 'after';
	const TEST_COMMAND_2          = 'foo';
	const TEST_COMMAND_2_PARAMS   = array( array( 'bar' => 'far' ) );

	/**
	 * Options object.
	 *
	 * @var Options
	 */
	private $options;

	public function set_up() {
		parent::set_up();

		$context       = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options = new Options( $context );
		$this->gtag    = new GTag( $this->options );
		$this->gtag->register();

		$this->gtag->add_tag( static::TEST_TAG_ID_1 );

		// Add commands for testing.
		$this->gtag->add_command( static::TEST_COMMAND_1, static::TEST_COMMAND_1_PARAMS, static::TEST_COMMAND_1_POSITION );
		$this->gtag->add_command( static::TEST_COMMAND_2, static::TEST_COMMAND_2_PARAMS, static::TEST_COMMAND_2_POSITION );
	}

	public function test_gtag_class_instance() {
		$this->assertInstanceOf( GTag::class, $this->gtag );
	}

	public function test_gtag_script_enqueue() {
		$this->assertFalse( wp_script_is( GTag::HANDLE ) );

		do_action( 'wp_enqueue_scripts' );

		// Assert that the gtag script is enqueued.
		$this->assertTrue( wp_script_is( GTag::HANDLE ) );
	}

	public function test_gtag_script_src() {
		$scripts = wp_scripts();
		$script  = $scripts->registered[ GTag::HANDLE ];

		// Assert that the gtag script src is correct.
		$this->assertEquals( 'https://www.googletagmanager.com/gtag/js?id=' . static::TEST_TAG_ID_1, $script->src );
	}

	public function test_gtag_script_contains_gtag_call() {
		$scripts = wp_scripts();
		$script  = $scripts->registered[ GTag::HANDLE ];

		// Assert the array of inline script data contains the necessary gtag config line.
		// Should be in index 5, the first registered gtag.
		$this->assertEquals( 'gtag("config", "' . static::TEST_TAG_ID_1 . '");', $script->extra['after'][5] );
	}

	/**
	 * @dataProvider provider_first_party_mode_data
	 */
	public function test_gtag_script_src__first_party_mode( $data ) {
		self::enable_feature( 'firstPartyMode' );

		$first_party_mode_settings = new First_Party_Mode_Settings( $this->options );
		$first_party_mode_settings->set( $data['settings'] );

		$this->assertEquals( $data['expected_src'], $this->gtag->get_gtag_src() );
	}

	public function provider_first_party_mode_data() {
		$googletagmanager_url = 'https://www.googletagmanager.com/gtag/js?id=' . static::TEST_TAG_ID_1;

		return array(
			'all settings enabled'        => array(
				array(
					'settings'     => array(
						'isEnabled'             => true,
						'isFPMHealthy'          => true,
						'isScriptAccessEnabled' => true,
					),
					'expected_src' => plugins_url( 'fpm/measurement.php', GOOGLESITEKIT_PLUGIN_MAIN_FILE ) . '?id=' . static::TEST_TAG_ID_1 . '&s=/gtag/js',
				),
			),
			'isEnabled false'             => array(
				array(
					'settings'     => array(
						'isEnabled'             => false,
						'isFPMHealthy'          => true,
						'isScriptAccessEnabled' => true,
					),
					'expected_src' => $googletagmanager_url,
				),
			),
			'isFPMHealthy false'          => array(
				array(
					'settings'     => array(
						'isEnabled'             => true,
						'isFPMHealthy'          => false,
						'isScriptAccessEnabled' => true,
					),
					'expected_src' => $googletagmanager_url,
				),
			),
			'isScriptAccessEnabled false' => array(
				array(
					'settings'     => array(
						'isEnabled'             => true,
						'isFPMHealthy'          => true,
						'isScriptAccessEnabled' => false,
					),
					'expected_src' => $googletagmanager_url,
				),
			),
			'all settings disabled'       => array(
				array(
					'settings'     => array(
						'isEnabled'             => false,
						'isFPMHealthy'          => false,
						'isScriptAccessEnabled' => false,
					),
					'expected_src' => $googletagmanager_url,
				),
			),
		);
	}

	public function test_gtag_script_commands() {
		$scripts = wp_scripts();
		$script  = $scripts->registered[ GTag::HANDLE ];

		// Test commands in the before position.
		$this->assertEquals( sprintf( 'gtag(%s");', '"' . static::TEST_COMMAND_1 . '","' . implode( '","', static::TEST_COMMAND_1_PARAMS ) ), $script->extra['before'][1] );

		// Test commands in the after position.
		$this->assertEquals( sprintf( 'gtag(%s);', '"' . static::TEST_COMMAND_2 . '",' . json_encode( static::TEST_COMMAND_2_PARAMS[0] ) ), $script->extra['after'][2] );
	}

	public function test_gtag_with_tag_config() {
		$this->gtag->add_tag( static::TEST_TAG_ID_2, static::TEST_TAG_ID_2_CONFIG );

		// Remove already enqueued script to avoid duplication of output.
		global $wp_scripts;
		unset( $wp_scripts->registered[ GTag::HANDLE ] );

		do_action( 'wp_enqueue_scripts' );

		$scripts = wp_scripts();
		$script  = $scripts->registered[ GTag::HANDLE ];

		// Assert the array of inline script data contains the necessary gtag entry for the second script.
		// Should be in index 6, immediately after the first registered gtag.
		$this->assertEquals( 'gtag("config", "' . static::TEST_TAG_ID_2 . '", ' . json_encode( self::TEST_TAG_ID_2_CONFIG ) . ');', $script->extra['after'][6] );
	}

	public function test_get_gtag_src() {
		$this->assertEquals( 'https://www.googletagmanager.com/gtag/js?id=' . static::TEST_TAG_ID_1, $this->gtag->get_gtag_src() );

		// Reset the GTag instance.
		$this->gtag = new GTag( $this->options );
		$this->gtag->register();

		// Verify that this returns `false` when no tags are added.
		$this->assertFalse( $this->gtag->get_gtag_src() );

		// Add a different tag ID.
		$this->gtag->add_tag( static::TEST_TAG_ID_2 );

		// Verify that this returns the correct URL for the different tag ID.
		$this->assertEquals( 'https://www.googletagmanager.com/gtag/js?id=' . static::TEST_TAG_ID_2, $this->gtag->get_gtag_src() );
	}
}
