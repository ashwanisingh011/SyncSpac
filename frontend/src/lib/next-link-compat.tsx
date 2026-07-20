import React from 'react';
import { Link as ReactRouterLink } from 'react-router-dom';

export default function Link({ href, children, ...props }: any) {
  // If href is external, render standard a tag, else ReactRouterLink
  const isExternal = href && (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('tel:'));

  if (isExternal) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }

  return (
    <ReactRouterLink to={href} {...props}>
      {children}
    </ReactRouterLink>
  );
}
