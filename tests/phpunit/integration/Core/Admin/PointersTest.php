<?php
/**
 * PointersTest
 *
 * @package   Google\Site_Kit\Tests\Core\Admin
 * @copyright 2022 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */
namespace Google\Site_Kit\Tests\Core\Admin;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Admin\Pointer;
use Google\Site_Kit\Core\Admin\Pointers;
use Google\Site_Kit\Core\Assets\Script_Data;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Admin
 * @group Pointer
 */
class PointersTest extends TestCase {

	const TEST_HOOK_SUFFIX = 'test-hook-suffix';

	const DATA_HANDLE = 'googlesitekit-admin-pointers-data';

	/**
	 * Pointers instance.
	 *
	 * @var Pointers
	 */
	private $pointers;

	public function set_up() {
		parent::set_up();

		remove_all_actions( 'admin_enqueue_scripts' );
		remove_all_filters( 'googlesitekit_assets' );

		// Register the scripts and styles that the Pointers class enqueues.
		wp_register_script( 'googlesitekit-admin-pointers', '', array(), GOOGLESITEKIT_VERSION, true );
		wp_register_style( 'wp-pointer', '', array(), GOOGLESITEKIT_VERSION, true );

		$this->pointers = new Pointers();
		$this->pointers->register();
	}

	public function test_register() {
		$this->assertTrue( has_action( 'admin_enqueue_scripts' ), 'Pointers should register the admin_enqueue_scripts action.' );
	}

	public function test_enqueue_pointers__no_hook_suffix() {
		do_action( 'admin_enqueue_scripts' );

		$this->assertFalse( wp_script_is( 'googlesitekit-admin-pointers' ), 'Admin pointers script should not be enqueued when no hook suffix.' );
		$this->assertFalse( wp_style_is( 'wp-pointer' ), 'wp-pointer style should not be enqueued when no hook suffix.' );
	}

	public function test_enqueue_pointers__no_pointers() {
		do_action( 'admin_enqueue_scripts', self::TEST_HOOK_SUFFIX );

		$this->assertFalse( wp_script_is( 'googlesitekit-admin-pointers' ), 'Admin pointers script should not be enqueued when no pointers.' );
		$this->assertFalse( wp_style_is( 'wp-pointer' ), 'wp-pointer style should not be enqueued when no pointers.' );
	}

	public function test_enqueue_pointers__no_active_pointers() {
		$this->add_pointer(
			'test-slug',
			array(
				'title'           => 'Test pointer title',
				'content'         => 'Test pointer content.',
				'target_id'       => 'test-target',
				'active_callback' => '__return_false',
			)
		);

		do_action( 'admin_enqueue_scripts', self::TEST_HOOK_SUFFIX );

		$this->assertFalse( wp_script_is( 'googlesitekit-admin-pointers' ), 'Admin pointers script should not be enqueued when no active pointers.' );
		$this->assertFalse( wp_style_is( 'wp-pointer' ), 'wp-pointer style should not be enqueued when no active pointers.' );
		$this->assertSame( array(), $this->get_pointers_data(), 'Pointers data should be empty when no active pointers.' );
	}

	public function test_enqueue_pointers() {
		$tracking = array(
			'view' => array(
				'category' => 'test-category',
				'action'   => 'view_notification',
			),
		);

		$this->add_pointer(
			'test-slug',
			array(
				'title'           => 'Test pointer title',
				'content'         => 'Test pointer content.',
				'target_id'       => 'test-target',
				'position'        => 'bottom',
				'active_callback' => '__return_true',
				'class'           => 'custom-class',
				'buttons'         => '<a class="googlesitekit-pointer-cta button-primary" href="#">Set up</a>',
				'tracking'        => $tracking,
			)
		);

		do_action( 'admin_enqueue_scripts', self::TEST_HOOK_SUFFIX );

		$this->assertTrue( wp_script_is( 'googlesitekit-admin-pointers' ), 'Admin pointers script should be enqueued when there are active pointers.' );
		$this->assertTrue( wp_style_is( 'wp-pointer' ), 'wp-pointer style should be enqueued when there are active pointers.' );

		$this->assertSame(
			array(
				array(
					'slug'     => 'test-slug',
					'class'    => 'wp-pointer test-slug custom-class',
					'targetID' => 'test-target',
					'title'    => 'Test pointer title',
					'content'  => '<p>Test pointer content.</p><div class="googlesitekit-pointer-buttons"><a class="googlesitekit-pointer-cta button-primary" href="#">Set up</a></div>',
					'position' => 'bottom',
					'tracking' => $tracking,
				),
			),
			$this->get_pointers_data(),
			'Pointers data should contain one entry with the active pointer data.'
		);
	}

	public function test_enqueue_pointers__filters_markup() {
		$this->add_pointer(
			'test-slug',
			array(
				'title'           => 'Title <button class="googlesitekit-pointer-cta--dismiss" data-action="dismiss"><span class="screen-reader-text">Dismiss</span></button><script>alert( 1 )</script>',
				'content'         => function () {
					return '<h4>Heading</h4><p class="description">Content</p><img src="x" onerror="alert( 1 )">';
				},
				'target_id'       => 'test-target',
				'active_callback' => '__return_true',
			)
		);

		do_action( 'admin_enqueue_scripts', self::TEST_HOOK_SUFFIX );

		$data = $this->get_pointers_data();

		$this->assertSame(
			'Title <button class="googlesitekit-pointer-cta--dismiss" data-action="dismiss"><span class="screen-reader-text">Dismiss</span></button>alert( 1 )',
			$data[0]['title'],
			'Pointer title should keep the allowed markup and remove other tags.'
		);
		$this->assertSame(
			'<h4>Heading</h4><p class="description">Content</p>',
			$data[0]['content'],
			'Pointer content should keep the allowed markup and remove other tags.'
		);
	}

	public function test_enqueue_pointers__empty_content() {
		$this->add_pointer(
			'test-slug-empty',
			array(
				'title'           => 'Test pointer title',
				'content'         => '__return_empty_string',
				'target_id'       => 'test-target',
				'active_callback' => '__return_true',
			)
		);
		$this->add_pointer(
			'test-slug',
			array(
				'title'           => 'Test pointer title',
				'content'         => 'Test pointer content.',
				'target_id'       => 'test-target',
				'active_callback' => '__return_true',
			)
		);

		do_action( 'admin_enqueue_scripts', self::TEST_HOOK_SUFFIX );

		$this->assertSame(
			array( 'test-slug' ),
			wp_list_pluck( $this->get_pointers_data(), 'slug' ),
			'Pointers data should leave out a pointer with empty content.'
		);
	}

	/**
	 * Adds a pointer through the `googlesitekit_admin_pointers` filter.
	 *
	 * @param string $slug Pointer slug.
	 * @param array  $args Pointer arguments.
	 */
	private function add_pointer( $slug, array $args ) {
		add_filter(
			'googlesitekit_admin_pointers',
			function ( $pointers ) use ( $slug, $args ) {
				$pointers[] = new Pointer( $slug, $args );
				return $pointers;
			}
		);
	}

	/**
	 * Gets the data that the pointers data script assigns to its global.
	 *
	 * @return array Decoded pointers data.
	 */
	private function get_pointers_data() {
		$assets = apply_filters( 'googlesitekit_assets', array() );
		$script = current(
			array_filter(
				$assets,
				function ( $asset ) {
					return $asset instanceof Script_Data && self::DATA_HANDLE === $asset->get_handle();
				}
			)
		);

		$this->assertInstanceOf( Script_Data::class, $script, 'Pointers should add the pointers data script to the Site Kit assets.' );

		$script->register( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$script->before_print();

		$script_data = wp_scripts()->get_data( self::DATA_HANDLE, 'data' );
		$prefix      = 'var _googlesitekitAdminPointersData = ';

		$this->assertStringStartsWith( $prefix, $script_data, 'Pointers data script should assign the _googlesitekitAdminPointersData global.' );

		return json_decode( substr( $script_data, strlen( $prefix ), -1 ), true );
	}
}
