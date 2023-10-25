<?php
namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Tests\MockableTime;

function gmdate( $format, $timestamp = null ) {
	return MockableTime::gmdate( $format, $timestamp );
}

function strtotime( $time, $now = null ) {
	return MockableTime::strtotime( $time, $now );
}

namespace Google\Site_Kit\Modules\Analytics_4\Report;

use Google\Site_Kit\Tests\MockableTime;

function gmdate( $format, $timestamp = null ) {
	return MockableTime::gmdate( $format, $timestamp );
}

function strtotime( $time, $now = null ) {
	return MockableTime::strtotime( $time, $now );
}

namespace Google\Site_Kit\Modules;

use Google\Site_Kit\Tests\MockableTime;

function gmdate( $format, $timestamp = null ) {
	return MockableTime::gmdate( $format, $timestamp );
}

function strtotime( $time, $now = null ) {
	return MockableTime::strtotime( $time, $now );
}
