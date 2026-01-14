/**
 * Mobile Slice Container Configuration
 */

import { Container } from 'inversify';
import { mobileBindings } from './mobile.bindings';

export function configureMobileContainer(container: Container): void {
  container.load(mobileBindings);
}
