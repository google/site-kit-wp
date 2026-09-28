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

use Google\Service\WebContentPublisher\CheckFreeAccessResponse;

/**
 * The "publications" collection of methods.
 * Typical usage is:
 *  <code>
 *   $webcontentpublisherService = new Google\Service\WebContentPublisher(...);
 *   $publications = $webcontentpublisherService->publications;
 *  </code>
 */
class Publications extends \Google\Service\Resource
{
  /**
   * Checks if a user is eligible for free article access.
   * (publications.checkFreeAccess)
   *
   * @param string $name Required. The resource name of the publication. Format:
   * publications/{publication_id}
   * @param array $optParams Optional parameters.
   *
   * @opt_param string httpReferrer Required. The HTTP referrer.
   * @opt_param string uri Required. The URI of the content.
   * @return CheckFreeAccessResponse
   * @throws \Google\Service\Exception
   */
  public function checkFreeAccess($name, $optParams = [])
  {
    $params = ['name' => $name];
    $params = array_merge($params, $optParams);
    return $this->call('checkFreeAccess', [$params], CheckFreeAccessResponse::class);
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(Publications::class, 'Google_Service_WebContentPublisher_Resource_Publications');
