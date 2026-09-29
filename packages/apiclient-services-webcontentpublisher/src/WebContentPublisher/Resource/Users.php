<?php
/*
 * Copyright 2014 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

namespace Google\Service\WebContentPublisher\Resource;

use Google\Service\WebContentPublisher\GeneratePlatformSiteTokensRequest;
use Google\Service\WebContentPublisher\GeneratePlatformSiteTokensResponse;

/**
 * The "users" collection of methods.
 * Typical usage is:
 *  <code>
 *   $webcontentpublisherService = new Google\Service\WebContentPublisher(...);
 *   $users = $webcontentpublisherService->users;
 *  </code>
 */
class Users extends \Google\Service\Resource
{
  /**
   * Returns user tokens mapped to their canonical domains for all publications
   * the authenticated user is entitled to. (users.generatePlatformSiteTokens)
   *
   * @param string $name Required. The resource name of the user to generate
   * tokens for. Format: users/{user}
   * @param GeneratePlatformSiteTokensRequest $postBody
   * @param array $optParams Optional parameters.
   * @return GeneratePlatformSiteTokensResponse
   * @throws \Google\Service\Exception
   */
  public function generatePlatformSiteTokens($name, GeneratePlatformSiteTokensRequest $postBody, $optParams = [])
  {
    $params = ['name' => $name, 'postBody' => $postBody];
    $params = array_merge($params, $optParams);
    return $this->call('generatePlatformSiteTokens', [$params], GeneratePlatformSiteTokensResponse::class);
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(Users::class, 'Google_Service_WebContentPublisher_Resource_Users');
