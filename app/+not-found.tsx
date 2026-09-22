import React from 'react';
import { Redirect } from 'expo-router';

/**
 * Any path the router does not recognise lands on the entry route.
 *
 * On native this is only ever reached through a bad deep link. On web it also
 * covers static hosting under a sub-path, where the first URL the router sees
 * is the host's, not one of ours.
 */
export default function NotFound() {
  return <Redirect href="/" />;
}
