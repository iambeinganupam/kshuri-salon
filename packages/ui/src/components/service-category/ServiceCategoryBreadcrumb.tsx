'use client';
// ─────────────────────────────────────────────────────────────────────────────
// ServiceCategoryBreadcrumb — trail for category landing pages.
//
// Renders e.g. Home › Services › Skin & Facial › Hydra Facial.
// Composes the existing breadcrumb primitive in @kshuri/ui so styling stays
// consistent across the customer portal and the salon/freelancer browse
// surfaces. Pure presentational; the caller threads in app-native link
// components via renderLink if it needs Next.js / react-router behaviour.
// ─────────────────────────────────────────────────────────────────────────────

import * as React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../breadcrumb';

export interface ServiceCategoryBreadcrumbItem {
  label: string;
  href?: string;
}

export interface ServiceCategoryBreadcrumbProps {
  /** Home link. Defaults to `{ label: 'Home', href: '/' }`. Pass `null` to hide. */
  home?: ServiceCategoryBreadcrumbItem | null;
  /** Top-level services index. Defaults to `{ label: 'Services', href: '/services' }`.
   *  Pass `null` to hide. */
  services?: ServiceCategoryBreadcrumbItem | null;
  /** The current root category. When present, renders linked unless the
   *  current page IS the root (then `subcategory` is undefined and root
   *  is rendered as the active page). */
  root?: ServiceCategoryBreadcrumbItem;
  /** The current subcategory. When present, renders as the active page. */
  subcategory?: ServiceCategoryBreadcrumbItem;
  /** Optional render-prop for app-native links. Default: plain `<a>`. */
  renderLink?: (props: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => React.ReactElement;
  className?: string;
}

const DEFAULT_HOME: ServiceCategoryBreadcrumbItem = { label: 'Home', href: '/' };
const DEFAULT_SERVICES: ServiceCategoryBreadcrumbItem = { label: 'Services', href: '/services' };

export function ServiceCategoryBreadcrumb({
  home = DEFAULT_HOME,
  services = DEFAULT_SERVICES,
  root,
  subcategory,
  renderLink,
  className,
}: ServiceCategoryBreadcrumbProps) {
  // Wraps BreadcrumbLink with the caller's renderLink so app-native routing
  // (Next.js <Link>, react-router <Link>) works without re-implementing the
  // primitive. asChild on BreadcrumbLink forwards styling to the inner anchor.
  const Link = ({ href, label }: { href: string; label: string }) => {
    if (renderLink) {
      return (
        <BreadcrumbLink asChild>
          {renderLink({ href, children: label })}
        </BreadcrumbLink>
      );
    }
    return <BreadcrumbLink href={href}>{label}</BreadcrumbLink>;
  };

  const rootIsActive = root && !subcategory;

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {home && (
          <>
            <BreadcrumbItem>
              {home.href ? (
                <Link href={home.href} label={home.label} />
              ) : (
                <BreadcrumbPage>{home.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {(services || root) && <BreadcrumbSeparator />}
          </>
        )}
        {services && (
          <>
            <BreadcrumbItem>
              {services.href ? (
                <Link href={services.href} label={services.label} />
              ) : (
                <BreadcrumbPage>{services.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {root && <BreadcrumbSeparator />}
          </>
        )}
        {root && (
          <>
            <BreadcrumbItem>
              {rootIsActive || !root.href ? (
                <BreadcrumbPage>{root.label}</BreadcrumbPage>
              ) : (
                <Link href={root.href} label={root.label} />
              )}
            </BreadcrumbItem>
            {subcategory && <BreadcrumbSeparator />}
          </>
        )}
        {subcategory && (
          <BreadcrumbItem>
            <BreadcrumbPage>{subcategory.label}</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default ServiceCategoryBreadcrumb;
