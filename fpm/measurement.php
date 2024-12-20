<?php

/**
 * FirstPartyServing redirect file
 *
 * @package   Google\FirstPartyLibrary
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 *
 * @version   57f0a63
 * 
 * NOTICE: This file has been modified from its original version in accordance with the Apache License, Version 2.0.
 */

// This file should run in isolation from any other PHP file. This means using
// minimal to no external dependencies, which leads us to suppressing the
// following linting rules:
//
// phpcs:disable PSR1.Files.SideEffects.FoundWithSymbols
// phpcs:disable PSR1.Classes.ClassDeclaration.MultipleClasses

namespace Google\FirstPartyLibrary;

/* Start of Site Kit modified code.
 * This block is an addition to the original file. */
if ( isset( $_GET['healthCheck'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
	echo 'ok';
	exit;
}
/* End of Site Kit modified code. */

/** Core measurement.php logic. */
final class Measurement
{
    private const TAG_ID_QUERY = '?id=';
    private const PATH_QUERY = '&s=';
    private const FPS_PATH = 'PHP_FPM_REPLACE_PATH';

    /** @var RequestHelper */
    private $helper;

    /**
     * Create the measurement request handler.
     *
     * @param RequestHelper $helper
     */
    public function __construct($helper)
    {
        $this->helper = $helper;
    }

    /** Run the measurement logic. */
    public function run()
    {
        $redirectorFile = $_SERVER['SCRIPT_NAME'] ?? '';
        if (empty($redirectorFile)) {
            $this->helper->invalidRequest(500);
            return "";
        }

        $parameters = self::extractParameters();

        $tagId = $parameters['tag_id'];
        $path = $parameters['path'];

        if (empty($tagId) || empty($path)) {
            $this->helper->invalidRequest(400);
            return "";
        }

        if (!self::isScriptRequest($path)) {
            $path = self::appendRequestIP($path);
        }

        $fpsUrl = 'https://' . $tagId . '.fps.goog/' . self::FPS_PATH . $path;

        if (self::isScriptRequest($path)) {
            $response = $this->helper->sendRequest($fpsUrl);
            $response['body'] = str_replace(
                '/' . self::FPS_PATH . '/',
                $redirectorFile . self::TAG_ID_QUERY . $tagId . self::PATH_QUERY,
                $response['body']
            );
            return $response;
        } else {
            return $this->helper->sendRequest($fpsUrl);
        }
    }

    private static function appendRequestIP($path)
    {
        if (!isset($_SERVER['REMOTE_ADDR'])) {
            return $path;
        }

        $requestIP = $_SERVER['REMOTE_ADDR'];
        //  Use x-forwarded-for IP if behind a proxy
        if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $requestIP = $_SERVER['HTTP_X_FORWARDED_FOR'];
        }
        $requestIP = urlencode($requestIP);

        $gaPath = "/g/collect";
        if (false !== strpos($path, $gaPath)) {
            return $path . '&_uip=' . $requestIP;
        } else {
            return $path . '&uip=' . $requestIP;
        }
    }

    private static function isScriptRequest($requestPath)
    {
        return substr($requestPath, 0, 7) === "/gtm.js"
        || substr($requestPath, 0, 8) === "/gtag.js"
        || substr($requestPath, 0, 8) === "/gtag/js";
    }


    private static function extractParameters()
    {
        $get = $_GET;
        if (empty($get)) {
            return array(
                "tag_id" =>  '',
                "path" => '',
            );
        }

        $tagId = $get['id'] ?? '';
        $path = $get['s'] ?? '';

        unset($get['id'], $get['s']);

        if (!empty($get)) {
            $containsQueryParameters = strpos($path, '?') !== false;
            $paramSeparator = $containsQueryParameters ? '&' : '?';
            $path .= $paramSeparator . http_build_query($get, '', '&', PHP_QUERY_RFC3986);
        }

        return array(
            "tag_id" =>  $tagId,
            "path" => $path,
        );
    }
}

// REQUEST_HELPER_START
/**
 * NOTE: DO NOT edit RequestHelper directly nor remove the start and end tags.
 *
 * This class is copied over from src/RequestHelper.php. If any changes are
 * needed, change that file and run the command `npm run copy:RequestHelper`.
 */
/**
 * Isolates network requests and other methods like exit to inject into classes.
 */
class RequestHelper
{
    /**
     * Helper method to exit the script early and send back a status code.
     *
     * @param int $statusCode
     */
    public function invalidRequest($statsCode): void
    {
        http_response_code($statsCode);
        exit();
    }

    /**
     * Set the headers from a headers array.
     *
     * @param array<string, string> $headers
     */
    public function setHeaders($headers): void
    {
        foreach ($headers as $header) {
            if (!empty($header)) {
                header($header);
            }
        }
    }

    /**
     * Helper method to send requests depending on the PHP environment.
     *
     * @param string $url
     * @return array{
     *      body: string,
     *      headers: array<string, string>,
     *      statusCode: int,
     * }
     */
    public function sendRequest($url): array
    {
        if ($this->isCurlInstalled()) {
            $response = $this->sendCurlRequest($url);
        } else {
            $response = $this->sendFileGetContents($url);
        }
        return $response;
    }

    /**
     * @param string $url
     * @return array{
     *      body: string,
     *      headers: array<string, string>,
     *      statusCode: int,
     * }
     */
    protected function sendCurlRequest($url): array
    {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HEADER, true);
        curl_setopt($ch, CURLOPT_URL, $url);

        $result = curl_exec($ch);

        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $headersString = substr($result, 0, $headerSize);
        $headers = explode("\r\n", $headersString);

        $body = substr($result, $headerSize);

        curl_close($ch);

        return array(
            'body' => $body,
            'headers' => $headers,
            'statusCode' => $statusCode,
        );
    }

    /**
     * @param string $url
     * @return array{
     *      body: string,
     *      headers: array<string, string>,
     *      statusCode: int,
     * }
     */
    protected function sendFileGetContents($url): array
    {
        $streamContext = array(
            "http" => array(
                "method" => "GET",
            )
        );

        // Calling file_get_contents will set the variable $http_response_header
        // within the local scope.
        $result = file_get_contents($url, false, $streamContext);

        /** @var string[] $headers */
        $headers = $http_response_header ?? [];

        $statusCode = 200;
        if (!empty($headers)) {
            // The first element in the headers array will be the HTTP version
            // and status code used, parse out the status code and remove this
            // value from the headers.
            preg_match('/HTTP\/\d\.\d\s+(\d+)/', $headers[0], $statusHeader);
            $statusCode = intval($statusHeader[1]) ?? 200;
            array_shift($headers);
        }

        return array(
            'body' => $result,
            'headers' => $headers,
            'statusCode' => $statusCode,
        );
    }

    protected function isCurlInstalled(): bool
    {
        return extension_loaded('curl');
    }
}
// REQUEST_HELPER_END

/* Start of Site Kit modified code.
 * The condition has been modified to include a check for WPINC.
 *
 * WPINC is defined when WordPress is loaded, and Site Kit includes this file in a WordPress
 * context in order to use the RequestHelper class.
 */
// Skip initial run for testing and when WordPress is loaded.
if (!defined('IS_FIRST_PARTY_MODE_TEST') && !defined( 'WPINC')) {
/* End of Site Kit modified code. */
    $requestHelper = new RequestHelper();
    $response = (new Measurement($requestHelper))->run();

    $requestHelper->setHeaders($response['headers']);
    http_response_code($response['statusCode']);
    echo $response['body'];
}
