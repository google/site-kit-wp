<?php

namespace Google\Site_Kit\Core\Tags;

use Closure;

class Gtag_JS {
	const HANDLE = 'google_gtagjs';

	/**
	 * Enqueues gtag for the given measurement ID.
	 *
	 * Everything in this method should be safe to call multiple times.
	 */
	public static function enqueue( $measurement_id ) {
		wp_enqueue_script(
			self::HANDLE,
			'https://www.googletagmanager.com/gtag/js?id=' . rawurlencode( $measurement_id ),
			array(),
			null
		);

		// Core async strategy puts the script in the footer, and removes async when adding inline scripts.
		wp_script_add_data( 'google_gtagjs', 'script_execution', 'async' );

		// static callbacks are only added once.
		add_filter( 'wp_resource_hints', array( self::class, 'wp_resource_hints' ), 10, 2 );
		add_action( 'wp_print_scripts', array( self::class, 'wp_print_scripts' ) );
	}

	public static function wp_resource_hints( $urls, $relation_type ) {
		if ( 'dns-prefetch' === $relation_type ) {
			$urls[] = '//www.googletagmanager.com';
		}

		return $urls;
	}

	public static function wp_print_scripts() {
		if (
			! wp_script_is( self::HANDLE, 'enqueued' )
			|| wp_script_is( self::HANDLE, 'done' )
		) {
			return;
		}

		self::print_comment( __( 'Google tag (gtag.js) snippet added by Site Kit', 'google-site-kit' ) );
		self::print_tag_before();
		wp_scripts()->do_items( self::HANDLE );
		self::print_tag_after();
		self::print_comment( __( 'End Google tag (gtag.js) snippet added by Site Kit', 'google-site-kit' ) );
	}

	private static function print_tag_before() {
		// Limit the earliest commands to configuring consent only.
		$gtag = new Gtag( array( 'consent' ) );
		$func = self::gtag_func( $gtag );

		do_action( 'googlesitekit_gtag_before', $func );

		if ( $gtag->has_calls() ) {
			self::print_commands( $gtag );
		}
	}

	private static function print_tag_after() {
		$gtag = new Gtag();
		$gtag( 'js', '{newDate}' );
		$gtag( 'set', 'developer_id.dZTNiMT', true );
		$func = static::gtag_func( $gtag );

		do_action( 'googlesitekit_gtag', $func );

		static::print_commands( $gtag );
	}

	/**
	 * Wrap the gtag instance to avoid type coupling with consumers.
	 *
	 * @param Gtag $gtag
	 *
	 * @return Closure
	 */
	private static function gtag_func( Gtag $gtag ) {
		return static function ( ...$args ) use ( $gtag ) {
			return $gtag( ...$args );
		};
	}

	private static function print_commands( Gtag $gtag ) {
		$javascript = static::commands_to_js( $gtag->get_calls() );

		wp_print_inline_script_tag(
			join( PHP_EOL, $javascript ),
			array(
				'data-googlesitekit' => true,
			)
		);
	}

	private static function commands_to_js( $commands ) {
		// Initialize with common JS.
		$javascript = array(
			'window.dataLayer = window.dataLayer || [];',
			'function gtag(){dataLayer.push(arguments);}',
		);

		foreach ( $commands as $command_args ) {
			$command_js = array_map(
				static function ( $arg ) {
					if ( '{newDate}' === $arg ) {
						return 'new Date()';
					}
					return wp_json_encode( $arg );
				},
				$command_args
			);
			$javascript[] = sprintf( 'gtag(%s);', join( ', ', $command_js ) );
		}

		return $javascript;
	}

	private static function print_comment( $text ) {
		printf( '<!-- %s -->' . PHP_EOL, esc_html( $text ) );
	}
}
